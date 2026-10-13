#!/usr/bin/env python3
"""
PyTutor Sandbox: Secure, isolated Python code execution worker.
Enforces execution timeouts, resource limits, clean temporary environment,
captures stdout/stderr, evaluates test cases, and categorizes errors.
"""

import sys
import os
import json
import subprocess
import tempfile
import time
import re
try:
    import resource
    HAS_RESOURCE = True
except ImportError:
    HAS_RESOURCE = False

MAX_MEMORY_BYTES = 256 * 1024 * 1024 # 256 MB virtual memory limit
MAX_OUTPUT_CHARS = 16384 # 16 KB output limit

def set_sandbox_rlimits():
    """Applies POSIX address space and file size limits before exec."""
    if not HAS_RESOURCE:
        return
    try:
        resource.setrlimit(resource.RLIMIT_AS, (MAX_MEMORY_BYTES, MAX_MEMORY_BYTES))
    except Exception:
        pass
    try:
        resource.setrlimit(resource.RLIMIT_FSIZE, (2 * 1024 * 1024, 2 * 1024 * 1024))
    except Exception:
        pass

# Comprehensive error categorization mapping for introductory Python
ERROR_CATEGORIES = {
    "SyntaxError": {
        "category": "SyntaxError",
        "description": "The Python interpreter encountered invalid syntax.",
        "remedial_advice": "Check for missing colons (':') after if/for/def statements, unmatched parentheses or quotes, or misspelled keywords."
    },
    "IndentationError": {
        "category": "IndentationError",
        "description": "Inconsistent or missing indentation within code blocks.",
        "remedial_advice": "Python uses 4 spaces to define blocks after statements like 'def', 'if', 'for', and 'while'. Ensure consistent spacing."
    },
    "NameError": {
        "category": "NameError",
        "description": "Attempted to use a variable or function name that has not been defined.",
        "remedial_advice": "Check your spelling and capitalization. Make sure you assigned the variable or defined the function before calling it."
    },
    "TypeError": {
        "category": "TypeError",
        "description": "An operation or function was applied to an inappropriate data type.",
        "remedial_advice": "Verify data types. For instance, combining a string with an integer using '+' requires converting the int with str(val)."
    },
    "IndexError": {
        "category": "IndexError",
        "description": "Attempted to access a sequence index that does not exist.",
        "remedial_advice": "Remember Python indices start at 0 and end at len(collection) - 1. Verify your loop bounds or index values."
    },
    "KeyError": {
        "category": "KeyError",
        "description": "Attempted to access a dictionary using a key that is not in the dictionary.",
        "remedial_advice": "Check that the key exists, verify exact spelling/casing, or use dict.get(key, default) to handle missing keys."
    },
    "ZeroDivisionError": {
        "category": "ZeroDivisionError",
        "description": "Attempted division or modulo by zero.",
        "remedial_advice": "Add a conditional check to ensure the denominator is not zero before dividing or computing modulo."
    },
    "AttributeError": {
        "category": "AttributeError",
        "description": "Referenced an attribute or method that does not belong to the object's type.",
        "remedial_advice": "Check that the method you called actually exists for this data type (e.g., .append() belongs to lists, not strings)."
    },
    "ValueError": {
        "category": "ValueError",
        "description": "A function received an argument with the right type but inappropriate value.",
        "remedial_advice": "Check the value passed into functions like int() or float() (e.g. converting non-numeric text to int)."
    },
    "TimeLimitExceeded": {
        "category": "TimeLimitExceeded",
        "description": "The code exceeded the maximum allowed execution time (potential infinite loop).",
        "remedial_advice": "Inspect while loops and recursive calls. Ensure loop termination conditions are guaranteed to be reached."
    },
    "MemoryLimitExceeded": {
        "category": "MemoryLimitExceeded",
        "description": "The program exceeded the 256MB memory allocation limit.",
        "remedial_advice": "Inspect memory allocations. Avoid excessively large lists or uncontrolled recursion that exhausts memory."
    },
    "OutputLimitExceeded": {
        "category": "OutputLimitExceeded",
        "description": "The program exceeded the 16KB stdout/stderr output size limit.",
        "remedial_advice": "Ensure print() statements are not placed inside an infinite or large loop."
    },
    "OutputMismatch": {
        "category": "OutputMismatch",
        "description": "The code completed without runtime exceptions, but the output did not match expected requirements.",
        "remedial_advice": "Compare your actual output format, casing, punctuation, and calculations against the exercise instructions."
    }
}

def classify_exception(stderr_text):
    if "MemoryError" in stderr_text or "MemoryLimitExceeded" in stderr_text:
        return "MemoryLimitExceeded"
    for err_name in ERROR_CATEGORIES.keys():
        if f"{err_name}:" in stderr_text or stderr_text.strip().endswith(err_name):
            return err_name
    return "RuntimeError"

def check_syntax(code_str):
    """Pre-compiles code in AST to detect syntax and indentation errors instantly."""
    try:
        compile(code_str, "<student_code>", "exec")
        return True, None, None
    except IndentationError as ie:
        msg = f"Indentation error on line {ie.lineno}: {ie.msg}"
        return False, "IndentationError", msg
    except SyntaxError as se:
        msg = f"Syntax error on line {se.lineno}: {se.msg}"
        if se.text:
            msg += f" -> {se.text.strip()}"
        return False, "SyntaxError", msg
    except Exception as e:
        return False, "SyntaxError", str(e)

def run_single_test(code_str, test_case, timeout=2.0):
    """
    Executes student code against a specific test case in an isolated subprocess.
    """
    input_data = test_case.get("input_data", "")
    expected = test_case.get("expected_output", "").strip()
    func_call = test_case.get("function_call", None)
    is_hidden = test_case.get("is_hidden", False)
    test_id = test_case.get("id", "test_1")

    # If test case specifies a function call, wrap the code
    script_content = code_str + "\n"
    if func_call:
        script_content += f"\n# Automated Assessment Wrapper\n_eval_result = {func_call}\nif _eval_result is not None:\n    print(_eval_result)\n"

    start_time = time.perf_counter()
    with tempfile.TemporaryDirectory() as temp_dir:
        temp_file = os.path.join(temp_dir, "submission.py")
        with open(temp_file, "w", encoding="utf-8") as f:
            f.write(script_content)

        # Isolated environment: scrub all sensitive variables
        clean_env = {
            "PATH": "/usr/local/bin:/usr/bin:/bin",
            "LANG": "C.UTF-8",
            "PYTHONIOENCODING": "utf-8",
            "PYTHONHASHSEED": "0",
        }

        try:
            # -I isolates python from user site, current directory modules, pythonpath
            proc = subprocess.run(
                [sys.executable, "-I", temp_file],
                input=input_data,
                text=True,
                capture_output=True,
                timeout=timeout,
                cwd=temp_dir,
                env=clean_env,
                preexec_fn=set_sandbox_rlimits if HAS_RESOURCE else None
            )
            elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
            stdout = proc.stdout
            stderr = proc.stderr

            if len(stdout) > MAX_OUTPUT_CHARS:
                return {
                    "id": test_id,
                    "passed": False,
                    "actual_output": "[Output size exceeded 16KB limit - truncated]",
                    "expected_output": expected if not is_hidden else "[Hidden]",
                    "stdout": stdout[:MAX_OUTPUT_CHARS] + "\n[Output truncated: exceeded 16KB limit]",
                    "stderr": "OutputLimitExceeded: Program generated excessive output (>16KB).",
                    "error_category": "OutputLimitExceeded",
                    "error_message": "Program generated excessive output exceeding 16KB limit. Check for uncontrolled print statements.",
                    "remedial_advice": ERROR_CATEGORIES["OutputLimitExceeded"]["remedial_advice"],
                    "execution_time_ms": elapsed_ms,
                    "is_hidden": is_hidden
                }

            if proc.returncode != 0:
                err_category = classify_exception(stderr)
                advice = ERROR_CATEGORIES.get(err_category, {}).get("remedial_advice", "Review the error message details.")
                return {
                    "id": test_id,
                    "passed": False,
                    "actual_output": stderr.strip() if not is_hidden else "[Hidden Test Failed with Runtime Error]",
                    "expected_output": expected if not is_hidden else "[Hidden]",
                    "stdout": stdout.strip(),
                    "stderr": stderr.strip(),
                    "error_category": err_category,
                    "error_message": stderr.strip(),
                    "remedial_advice": advice,
                    "execution_time_ms": elapsed_ms,
                    "is_hidden": is_hidden
                }

            # Normalize outputs (strip trailing spaces/newlines and match types)
            actual_clean = stdout.strip()
            # Accommodate valid float formatting like 4.0 vs 4 or case-tolerant boolean if relevant
            passed = (actual_clean == expected)
            
            # Additional tolerance for float equivalence if expected is numeric
            if not passed:
                try:
                    if float(actual_clean) == float(expected):
                        passed = True
                except Exception:
                    pass

            return {
                "id": test_id,
                "passed": passed,
                "actual_output": actual_clean if not is_hidden else ("[Hidden Test Output]" if passed else "[Hidden Test Did Not Match Expected Output]"),
                "expected_output": expected if not is_hidden else "[Hidden]",
                "stdout": stdout.strip(),
                "stderr": "",
                "error_category": None if passed else "OutputMismatch",
                "error_message": None if passed else f"Output '{actual_clean}' did not match expected '{expected}'",
                "remedial_advice": None if passed else ERROR_CATEGORIES["OutputMismatch"]["remedial_advice"],
                "execution_time_ms": elapsed_ms,
                "is_hidden": is_hidden
            }

        except subprocess.TimeoutExpired:
            elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
            return {
                "id": test_id,
                "passed": False,
                "actual_output": "[Execution timed out after 2.0s]",
                "expected_output": expected if not is_hidden else "[Hidden]",
                "stdout": "",
                "stderr": "TimeLimitExceeded: Program did not terminate within 2.0 seconds.",
                "error_category": "TimeLimitExceeded",
                "error_message": "Execution exceeded time limit of 2.0s (infinite loop suspected).",
                "remedial_advice": ERROR_CATEGORIES["TimeLimitExceeded"]["remedial_advice"],
                "execution_time_ms": elapsed_ms,
                "is_hidden": is_hidden
            }
        except Exception as ex:
            elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
            return {
                "id": test_id,
                "passed": False,
                "actual_output": str(ex),
                "expected_output": expected if not is_hidden else "[Hidden]",
                "stdout": "",
                "stderr": str(ex),
                "error_category": "RuntimeError",
                "error_message": str(ex),
                "remedial_advice": "Check your code structure.",
                "execution_time_ms": elapsed_ms,
                "is_hidden": is_hidden
            }

def run_assessment(payload):
    code = payload.get("code", "")
    test_cases = payload.get("test_cases", [])
    timeout = payload.get("timeout_seconds", 2.0)

    # 1. Syntax check
    valid_syntax, err_cat, err_msg = check_syntax(code)
    if not valid_syntax:
        advice = ERROR_CATEGORIES.get(err_cat, {}).get("remedial_advice", "Fix syntax issues.")
        return {
            "syntax_valid": False,
            "all_passed": False,
            "score_percentage": 0,
            "passed_count": 0,
            "total_count": len(test_cases),
            "primary_error_category": err_cat,
            "diagnostic_feedback": f"{err_cat}: {err_msg}. {advice}",
            "test_results": [
                {
                    "id": tc.get("id", f"test_{i}"),
                    "passed": False,
                    "actual_output": f"Code could not be executed due to {err_cat}",
                    "expected_output": tc.get("expected_output", "") if not tc.get("is_hidden") else "[Hidden]",
                    "error_category": err_cat,
                    "error_message": err_msg,
                    "remedial_advice": advice,
                    "execution_time_ms": 0,
                    "is_hidden": tc.get("is_hidden", False)
                }
                for i, tc in enumerate(test_cases)
            ]
        }

    # 2. Run all test cases
    results = []
    passed_count = 0
    primary_error = None
    first_advice = None

    for tc in test_cases:
        res = run_single_test(code, tc, timeout=timeout)
        results.append(res)
        if res["passed"]:
            passed_count += 1
        elif primary_error is None:
            primary_error = res["error_category"]
            first_advice = res.get("remedial_advice")

    total_count = len(test_cases)
    score_pct = round((passed_count / total_count * 100), 1) if total_count > 0 else 100
    all_passed = (passed_count == total_count and total_count > 0)

    if all_passed:
        feedback = "Outstanding! All test cases passed successfully, including edge cases."
    else:
        feedback = f"{passed_count}/{total_count} test cases passed. "
        if primary_error:
            feedback += f"Identified issue: {primary_error}. {first_advice or ''}"
        else:
            feedback += "Review your logic and check edge cases."

    sandbox_meta = {
        "isolation_mode": "subprocess_rlimit",
        "limits": {
            "timeout_seconds": timeout,
            "memory_limit_mb": 256,
            "output_max_chars": MAX_OUTPUT_CHARS
        },
        "security_disclosure": "POSIX process isolation with RLIMIT_AS (256MB) and RLIMIT_FSIZE (2MB). Kernel-level multi-tenant microVM containerization (e.g., gVisor/Firecracker) is recommended for production cloud deployments."
    }

    return {
        "syntax_valid": True,
        "all_passed": all_passed,
        "score_percentage": score_pct,
        "passed_count": passed_count,
        "total_count": total_count,
        "primary_error_category": primary_error,
        "diagnostic_feedback": feedback,
        "test_results": results,
        "sandbox_metadata": sandbox_meta
    }

def run_playground(payload):
    """Runs untrusted code for the playground/interactive editor without test cases."""
    code = payload.get("code", "")
    input_data = payload.get("input_data", "")
    timeout = payload.get("timeout_seconds", 2.0)

    valid_syntax, err_cat, err_msg = check_syntax(code)
    if not valid_syntax:
        advice = ERROR_CATEGORIES.get(err_cat, {}).get("remedial_advice", "")
        return {
            "success": False,
            "stdout": "",
            "stderr": f"{err_msg}\n{advice}",
            "error_category": err_cat,
            "execution_time_ms": 0
        }

    start = time.perf_counter()
    with tempfile.TemporaryDirectory() as temp_dir:
        temp_file = os.path.join(temp_dir, "play.py")
        with open(temp_file, "w", encoding="utf-8") as f:
            f.write(code)

        clean_env = {
            "PATH": "/usr/local/bin:/usr/bin:/bin",
            "LANG": "C.UTF-8",
            "PYTHONIOENCODING": "utf-8",
        }

        try:
            proc = subprocess.run(
                [sys.executable, "-I", temp_file],
                input=input_data,
                text=True,
                capture_output=True,
                timeout=timeout,
                cwd=temp_dir,
                env=clean_env,
                preexec_fn=set_sandbox_rlimits if HAS_RESOURCE else None
            )
            elapsed_ms = round((time.perf_counter() - start) * 1000, 2)
            stdout = proc.stdout
            stderr = proc.stderr
            if len(stdout) > MAX_OUTPUT_CHARS:
                stdout = stdout[:MAX_OUTPUT_CHARS] + "\n[Output truncated: exceeded 16KB limit]"
            err_cat = classify_exception(stderr) if proc.returncode != 0 else None
            return {
                "success": proc.returncode == 0,
                "stdout": stdout,
                "stderr": stderr,
                "error_category": err_cat,
                "execution_time_ms": elapsed_ms,
                "sandbox_metadata": {
                    "isolation_mode": "subprocess_rlimit",
                    "memory_limit_mb": 256,
                    "output_max_chars": MAX_OUTPUT_CHARS
                }
            }
        except subprocess.TimeoutExpired:
            return {
                "success": False,
                "stdout": "",
                "stderr": "TimeLimitExceeded: Program timed out after 2.0 seconds.",
                "error_category": "TimeLimitExceeded",
                "execution_time_ms": round((time.perf_counter() - start) * 1000, 2)
            }
        except Exception as e:
            return {
                "success": False,
                "stdout": "",
                "stderr": str(e),
                "error_category": "RuntimeError",
                "execution_time_ms": 0
            }

if __name__ == "__main__":
    if len(sys.argv) < 2:
        payload = json.loads(sys.stdin.read())
    else:
        arg = sys.argv[1]
        if os.path.isfile(arg):
            with open(arg, "r", encoding="utf-8") as f:
                payload = json.load(f)
        else:
            payload = json.loads(arg)

    mode = payload.get("mode", "assessment")
    if mode == "playground":
        output = run_playground(payload)
    else:
        output = run_assessment(payload)

    print(json.dumps(output, indent=2))
