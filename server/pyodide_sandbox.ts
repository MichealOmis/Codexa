import { loadPyodide, type PyodideInterface } from 'pyodide';

let pyodideInstance: PyodideInterface | null = null;
let pyodidePromise: Promise<PyodideInterface> | null = null;

export async function getPyodide(): Promise<PyodideInterface> {
  if (pyodideInstance) return pyodideInstance;
  if (pyodidePromise) return pyodidePromise;

  pyodidePromise = (async () => {
    const py = await loadPyodide();
    pyodideInstance = py;
    return py;
  })();

  return pyodidePromise;
}

const ERROR_CATEGORIES: Record<string, { category: string; description: string; remedial_advice: string }> = {
  SyntaxError: {
    category: 'SyntaxError',
    description: 'The Python interpreter encountered invalid syntax.',
    remedial_advice: "Check for missing colons (':') after if/for/def statements, unmatched parentheses or quotes, or misspelled keywords."
  },
  IndentationError: {
    category: 'IndentationError',
    description: 'Inconsistent or missing indentation within code blocks.',
    remedial_advice: "Python uses 4 spaces to define blocks after statements like 'def', 'if', 'for', and 'while'. Ensure consistent spacing."
  },
  NameError: {
    category: 'NameError',
    description: 'Attempted to use a variable or function name that has not been defined.',
    remedial_advice: 'Check your spelling and capitalization. Make sure you assigned the variable or defined the function before calling it.'
  },
  TypeError: {
    category: 'TypeError',
    description: 'An operation or function was applied to an inappropriate data type.',
    remedial_advice: "Verify data types. For instance, combining a string with an integer using '+' requires converting the int with str(val)."
  },
  IndexError: {
    category: 'IndexError',
    description: 'Attempted to access a sequence index that does not exist.',
    remedial_advice: 'Remember Python indices start at 0 and end at len(collection) - 1. Verify your loop bounds or index values.'
  },
  KeyError: {
    category: 'KeyError',
    description: 'Attempted to access a dictionary using a key that is not in the dictionary.',
    remedial_advice: 'Check that the key exists, verify exact spelling/casing, or use dict.get(key, default) to handle missing keys.'
  },
  ZeroDivisionError: {
    category: 'ZeroDivisionError',
    description: 'Attempted division or modulo by zero.',
    remedial_advice: 'Add a conditional check to ensure the denominator is not zero before dividing or computing modulo.'
  },
  AttributeError: {
    category: 'AttributeError',
    description: "Referenced an attribute or method that does not belong to the object's type.",
    remedial_advice: 'Check that the method you called actually exists for this data type (e.g., .append() belongs to lists, not strings).'
  },
  ValueError: {
    category: 'ValueError',
    description: 'A function received an argument with the right type but inappropriate value.',
    remedial_advice: 'Check the value passed into functions like int() or float() (e.g. converting non-numeric text to int).'
  },
  TimeLimitExceeded: {
    category: 'TimeLimitExceeded',
    description: 'The code exceeded the maximum allowed execution time (potential infinite loop).',
    remedial_advice: 'Inspect while loops and recursive calls. Ensure loop termination conditions are guaranteed to be reached.'
  },
  MemoryLimitExceeded: {
    category: 'MemoryLimitExceeded',
    description: 'The program exceeded the memory allocation limit.',
    remedial_advice: 'Inspect memory allocations. Avoid excessively large lists or uncontrolled recursion.'
  },
  OutputLimitExceeded: {
    category: 'OutputLimitExceeded',
    description: 'The program exceeded the 16KB stdout/stderr output size limit.',
    remedial_advice: 'Ensure print() statements are not placed inside an infinite or large loop.'
  },
  OutputMismatch: {
    category: 'OutputMismatch',
    description: 'The code completed without runtime exceptions, but the output did not match expected requirements.',
    remedial_advice: 'Compare your actual output format, casing, punctuation, and calculations against the exercise instructions.'
  }
};

const MAX_OUTPUT_CHARS = 16384;

function classifyException(stderrText: string): string {
  if (stderrText.includes('MemoryError')) return 'MemoryLimitExceeded';
  for (const cat of Object.keys(ERROR_CATEGORIES)) {
    if (stderrText.includes(`${cat}:`) || stderrText.trim().endsWith(cat)) {
      return cat;
    }
  }
  return 'RuntimeError';
}

export async function runPlaygroundPyodide(payload: { code: string; input_data?: string; timeout_seconds?: number }) {
  const py = await getPyodide();
  const timeoutMs = (payload.timeout_seconds || 2.0) * 1000;
  const startTime = Date.now();

  try {
    // Check syntax
    py.globals.set('__test_code__', payload.code);
    await py.runPythonAsync(`
import ast
ast.parse(__test_code__)
`);
  } catch (err: any) {
    const msg = String(err.message || err);
    const cat = msg.includes('IndentationError') ? 'IndentationError' : 'SyntaxError';
    return {
      success: false,
      stdout: '',
      stderr: msg,
      error_category: cat,
      execution_time_ms: Date.now() - startTime
    };
  }

  // Execution with timeout
  const execPromise = (async () => {
    py.globals.set('__code_to_run__', payload.code);
    py.globals.set('__input_data__', payload.input_data || '');

    const res = await py.runPythonAsync(`
import sys, io

class _StringInput:
    def __init__(self, data):
        self.stream = io.StringIO(data)
    def readline(self, size=-1):
        return self.stream.readline(size)
    def read(self, size=-1):
        return self.stream.read(size)

old_stdout = sys.stdout
old_stderr = sys.stderr
old_stdin = sys.stdin

sys.stdout = io.StringIO()
sys.stderr = io.StringIO()
sys.stdin = _StringInput(__input_data__)

_error_msg = None
_error_cat = None

try:
    _global_ns = {'__name__': '__main__'}
    exec(__code_to_run__, _global_ns)
except Exception as e:
    import traceback
    _error_msg = traceback.format_exc()
finally:
    _out = sys.stdout.getvalue()
    _err = sys.stderr.getvalue()
    sys.stdout = old_stdout
    sys.stderr = old_stderr
    sys.stdin = old_stdin

import json
json.dumps({
    'stdout': _out,
    'stderr': _err or _error_msg or '',
    'error': bool(_error_msg)
})
`);
    return JSON.parse(res);
  })();

  const timeoutPromise = new Promise<{ stdout: string; stderr: string; error: boolean; timeout: boolean }>((resolve) => {
    setTimeout(() => {
      resolve({
        stdout: '',
        stderr: 'TimeLimitExceeded: Program execution timed out.',
        error: true,
        timeout: true
      });
    }, timeoutMs);
  });

  const outcome = await Promise.race([execPromise, timeoutPromise]);
  const elapsed = Date.now() - startTime;

  if ('timeout' in outcome && outcome.timeout) {
    return {
      success: false,
      stdout: '',
      stderr: outcome.stderr,
      error_category: 'TimeLimitExceeded',
      execution_time_ms: elapsed
    };
  }

  let out = outcome.stdout || '';
  if (out.length > MAX_OUTPUT_CHARS) {
    out = out.substring(0, MAX_OUTPUT_CHARS) + '\n[Output truncated: exceeded 16KB limit]';
  }

  const errCat = outcome.error ? classifyException(outcome.stderr) : null;
  return {
    success: !outcome.error,
    stdout: out,
    stderr: outcome.stderr || '',
    error_category: errCat,
    execution_time_ms: elapsed
  };
}

export async function runAssessmentPyodide(payload: {
  code: string;
  test_cases: Array<{
    id: string;
    input_data?: string;
    expected_output: string;
    function_call?: string | null;
    is_hidden?: boolean;
  }>;
  timeout_seconds?: number;
}) {
  const py = await getPyodide();
  const testCases = payload.test_cases || [];
  const timeoutMs = (payload.timeout_seconds || 2.0) * 1000;

  // 1. Syntax check
  try {
    py.globals.set('__test_code__', payload.code);
    await py.runPythonAsync(`
import ast
ast.parse(__test_code__)
`);
  } catch (err: any) {
    const msg = String(err.message || err);
    const cat = msg.includes('IndentationError') ? 'IndentationError' : 'SyntaxError';
    const advice = ERROR_CATEGORIES[cat]?.remedial_advice || 'Fix syntax issues.';
    return {
      syntax_valid: false,
      all_passed: false,
      score_percentage: 0,
      passed_count: 0,
      total_count: testCases.length,
      primary_error_category: cat,
      diagnostic_feedback: `${cat}: ${msg}. ${advice}`,
      test_results: testCases.map((tc, idx) => ({
        id: tc.id || `test_${idx}`,
        passed: false,
        actual_output: `Code could not be executed due to ${cat}`,
        expected_output: tc.is_hidden ? '[Hidden]' : tc.expected_output,
        error_category: cat,
        error_message: msg,
        remedial_advice: advice,
        execution_time_ms: 0,
        is_hidden: Boolean(tc.is_hidden)
      }))
    };
  }

  // 2. Run test cases
  const results: any[] = [];
  let passedCount = 0;
  let primaryError: string | null = null;
  let firstAdvice: string | null = null;

  for (const tc of testCases) {
    const startSingle = Date.now();
    const inputData = tc.input_data || '';
    const expected = (tc.expected_output || '').trim();
    const funcCall = tc.function_call || null;
    const isHidden = Boolean(tc.is_hidden);
    const testId = tc.id;

    let scriptContent = payload.code + '\n';
    if (funcCall) {
      scriptContent += `\n_eval_result = ${funcCall}\nif _eval_result is not None:\n    print(_eval_result)\n`;
    }

    const singleExec = (async () => {
      py.globals.set('__sub_code__', scriptContent);
      py.globals.set('__sub_input__', inputData);
      const res = await py.runPythonAsync(`
import sys, io

class _StringInput:
    def __init__(self, data):
        self.stream = io.StringIO(data)
    def readline(self, size=-1):
        return self.stream.readline(size)
    def read(self, size=-1):
        return self.stream.read(size)

old_stdout = sys.stdout
old_stderr = sys.stderr
old_stdin = sys.stdin

sys.stdout = io.StringIO()
sys.stderr = io.StringIO()
sys.stdin = _StringInput(__sub_input__)

_err = None
try:
    _ns = {'__name__': '__main__'}
    exec(__sub_code__, _ns)
except Exception as e:
    import traceback
    _err = traceback.format_exc()
finally:
    _out = sys.stdout.getvalue()
    sys.stdout = old_stdout
    sys.stderr = old_stderr
    sys.stdin = old_stdin

import json
json.dumps({
    'stdout': _out,
    'stderr': _err or ''
})
`);
      return JSON.parse(res);
    })();

    const singleTimeout = new Promise<{ stdout: string; stderr: string; timeout: boolean }>((resolve) => {
      setTimeout(() => {
        resolve({
          stdout: '',
          stderr: 'TimeLimitExceeded: Execution timed out after 2.0s',
          timeout: true
        });
      }, timeoutMs);
    });

    const singleOutcome = await Promise.race([singleExec, singleTimeout]);
    const elapsedMs = Date.now() - startSingle;

    if ('timeout' in singleOutcome && singleOutcome.timeout) {
      const resItem = {
        id: testId,
        passed: false,
        actual_output: isHidden ? '[Hidden]' : '[Execution timed out after 2.0s]',
        expected_output: isHidden ? '[Hidden]' : expected,
        stdout: '',
        stderr: singleOutcome.stderr,
        error_category: 'TimeLimitExceeded',
        error_message: 'Execution exceeded time limit of 2.0s (infinite loop suspected).',
        remedial_advice: ERROR_CATEGORIES.TimeLimitExceeded.remedial_advice,
        execution_time_ms: elapsedMs,
        is_hidden: isHidden
      };
      results.push(resItem);
      if (!primaryError) {
        primaryError = 'TimeLimitExceeded';
        firstAdvice = ERROR_CATEGORIES.TimeLimitExceeded.remedial_advice;
      }
      continue;
    }

    if (singleOutcome.stderr) {
      const cat = classifyException(singleOutcome.stderr);
      const advice = ERROR_CATEGORIES[cat]?.remedial_advice || 'Check code structure.';
      const resItem = {
        id: testId,
        passed: false,
        actual_output: isHidden ? '[Hidden Test Failed with Runtime Error]' : singleOutcome.stderr.trim(),
        expected_output: isHidden ? '[Hidden]' : expected,
        stdout: singleOutcome.stdout.trim(),
        stderr: singleOutcome.stderr.trim(),
        error_category: cat,
        error_message: singleOutcome.stderr.trim(),
        remedial_advice: advice,
        execution_time_ms: elapsedMs,
        is_hidden: isHidden
      };
      results.push(resItem);
      if (!primaryError) {
        primaryError = cat;
        firstAdvice = advice;
      }
      continue;
    }

    let stdoutClean = (singleOutcome.stdout || '').trim();
    let passed = stdoutClean === expected;
    if (!passed) {
      try {
        if (parseFloat(stdoutClean) === parseFloat(expected)) {
          passed = true;
        }
      } catch {
        // keep false
      }
    }

    if (passed) {
      passedCount++;
      results.push({
        id: testId,
        passed: true,
        actual_output: isHidden ? '[Hidden Test Output]' : stdoutClean,
        expected_output: isHidden ? '[Hidden]' : expected,
        stdout: stdoutClean,
        stderr: '',
        error_category: null,
        error_message: null,
        remedial_advice: null,
        execution_time_ms: elapsedMs,
        is_hidden: isHidden
      });
    } else {
      const resItem = {
        id: testId,
        passed: false,
        actual_output: isHidden ? '[Hidden Test Did Not Match Expected Output]' : stdoutClean,
        expected_output: isHidden ? '[Hidden]' : expected,
        stdout: stdoutClean,
        stderr: '',
        error_category: 'OutputMismatch',
        error_message: `Output '${stdoutClean}' did not match expected '${expected}'`,
        remedial_advice: ERROR_CATEGORIES.OutputMismatch.remedial_advice,
        execution_time_ms: elapsedMs,
        is_hidden: isHidden
      };
      results.push(resItem);
      if (!primaryError) {
        primaryError = 'OutputMismatch';
        firstAdvice = ERROR_CATEGORIES.OutputMismatch.remedial_advice;
      }
    }
  }

  const totalCount = testCases.length;
  const scorePct = totalCount > 0 ? Math.round((passedCount / totalCount) * 1000) / 10 : 100;
  const allPassed = passedCount === totalCount && totalCount > 0;

  let feedback = '';
  if (allPassed) {
    feedback = 'Outstanding! All test cases passed successfully, including edge cases.';
  } else {
    feedback = `${passedCount}/${totalCount} test cases passed. `;
    if (primaryError) {
      feedback += `Identified issue: ${primaryError}. ${firstAdvice || ''}`;
    } else {
      feedback += 'Review your logic and check edge cases.';
    }
  }

  return {
    syntax_valid: true,
    all_passed: allPassed,
    score_percentage: scorePct,
    passed_count: passedCount,
    total_count: totalCount,
    primary_error_category: primaryError,
    diagnostic_feedback: feedback,
    test_results: results,
    sandbox_metadata: {
      isolation_mode: 'pyodide_wasm',
      limits: {
        timeout_seconds: payload.timeout_seconds || 2.0,
        memory_limit_mb: 256,
        output_max_chars: MAX_OUTPUT_CHARS
      }
    }
  };
}
