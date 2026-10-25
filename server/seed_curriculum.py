#!/usr/bin/env python3
"""
Seeds the 10 introductory Python curriculum modules, lessons, exercises,
test cases (visible and hidden), diagnostic pre-test, post-test, and demo users.
"""

import sqlite3
import json
import hashlib
import os

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "pytutor.db")

def hash_pw(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()

def seed():
    import init_db
    init_db.init_database()

    conn = sqlite3.connect(DB_PATH, timeout=30.0)
    c = conn.cursor()
    c.execute("PRAGMA journal_mode = WAL;")
    c.execute("PRAGMA busy_timeout = 30000;")

    # Clear existing data for a fresh, clean repeatable seed
    tables = [
        "audit_events", "lesson_completions", "sus_surveys", "assessment_responses",
        "assessment_questions", "assessments", "recommendations", "student_mastery",
        "attempt_test_results", "student_attempts", "exercise_test_cases", "exercises",
        "lessons", "topics", "users"
    ]
    for tbl in tables:
        c.execute(f"DELETE FROM {tbl}")

    # 1. Users
    now = "2026-10-12T17:30:00Z"
    users = [
        ("usr_student1", "student_demo", "student@example.edu", hash_pw("password123"), "student", "PARTICIPANT-A82F1", 1, "ITS_Intervention", now),
        ("usr_student2", "alex_learner", "alex@example.edu", hash_pw("password123"), "student", "PARTICIPANT-B49D2", 1, "Control_Baseline", now),
        ("usr_admin1", "lecturer_demo", "lecturer@example.edu", hash_pw(os.environ.get("ADMIN_PASSWORD", "Codexa#Faculty99!")), "administrator", "FACULTY-001", 0, "Staff", now)
    ]
    c.executemany("INSERT INTO users (id, username, email, password_hash, role, participant_id, leaderboard_opt_in, evaluation_group, created_at) VALUES (?,?,?,?,?,?,?,?,?)", users)

    # 2. Topics (10 Modules)
    topics = [
        (
            "mod_1", 1, "Introduction to Python",
            "Foundational understanding of what Python is, the execution model, print() function, comments, and syntax.",
            json.dumps(["Understand Python runtime and philosophy", "Execute output using print()", "Write single and multi-line comments", "Recognize basic syntax rules"]),
            json.dumps([]),
            "beginner", 70.0, 1
        ),
        (
            "mod_2", 2, "Variables and Data Types",
            "Storing state with variables, fundamental primitive types (int, float, str, bool), and type casting.",
            json.dumps(["Declare and reassign variables", "Distinguish integers, floats, strings, and booleans", "Convert between types using int(), float(), str()", "Avoid and diagnose TypeErrors"]),
            json.dumps(["mod_1"]),
            "beginner", 70.0, 2
        ),
        (
            "mod_3", 3, "Operators and Expressions",
            "Mathematical operations, boolean relational operators, logical operators (and, or, not), and precedence.",
            json.dumps(["Use arithmetic operators (+, -, *, /, //, %, **)", "Apply comparison operators (==, !=, <, >, <=, >=)", "Construct logical expressions with and, or, not", "Evaluate expression precedence"]),
            json.dumps(["mod_2"]),
            "beginner", 70.0, 3
        ),
        (
            "mod_4", 4, "Input and Output",
            "Interactive program input using input(), type conversions on user data, and formatted string output (f-strings).",
            json.dumps(["Read user input from standard input", "Cast input strings to appropriate numerical types", "Format strings dynamically using f-strings", "Structure readable terminal prompts"]),
            json.dumps(["mod_3"]),
            "beginner", 70.0, 4
        ),
        (
            "mod_5", 5, "Conditional Statements",
            "Decision making using if, if-else, if-elif-else branches, nested conditions, and boolean guard clauses.",
            json.dumps(["Structure single branch if statements", "Implement two-way if-else branching", "Chain multi-way if-elif-else logic", "Diagnose branch ordering and indentation errors"]),
            json.dumps(["mod_4"]),
            "beginner", 70.0, 5
        ),
        (
            "mod_6", 6, "Loops",
            "Repetitive execution with definite 'for' loops, range(), indefinite 'while' loops, break, and continue.",
            json.dumps(["Iterate numeric sequences using for loops and range()", "Implement while loops with proper termination safeguards", "Control loop flow with break and continue", "Avoid infinite loop pitfalls"]),
            json.dumps(["mod_5"]),
            "intermediate", 70.0, 6
        ),
        (
            "mod_7", 7, "Functions",
            "Modular code organization, defining functions with def, parameters, arguments, return values, and variable scope.",
            json.dumps(["Define reusable functions with def", "Pass positional and default arguments", "Return values and distinguish returning vs printing", "Understand local vs global scope"]),
            json.dumps(["mod_6"]),
            "intermediate", 70.0, 7
        ),
        (
            "mod_8", 8, "Lists and Strings",
            "Ordered sequence collections, 0-based indexing, slicing, common list methods (append, pop), and string manipulation.",
            json.dumps(["Create, index, and slice lists and strings", "Modify lists using methods like append(), insert(), remove()", "Iterate over collections with loops", "Diagnose and prevent IndexError exceptions"]),
            json.dumps(["mod_7"]),
            "intermediate", 70.0, 8
        ),
        (
            "mod_9", 9, "Dictionaries",
            "Key-value associative data structures, dictionary lookups, mutations, iterations, and handling missing keys.",
            json.dumps(["Create dictionaries and map key-value pairs", "Retrieve and update dictionary values", "Iterate through keys, values, and items", "Prevent KeyError using get() or membership checks"]),
            json.dumps(["mod_8"]),
            "intermediate", 70.0, 9
        ),
        (
            "mod_10", 10, "Introductory Problem-Solving",
            "Algorithmic thinking, problem decomposition, and synthesizing variables, conditions, loops, and functions.",
            json.dumps(["Decompose complex text problems into discrete steps", "Translate specifications into executable algorithms", "Combine data structures, loops, and logic", "Test and debug multi-component programs"]),
            json.dumps(["mod_9"]),
            "advanced", 70.0, 10
        )
    ]
    c.executemany("INSERT INTO topics VALUES (?,?,?,?,?,?,?,?,?)", topics)

    # 3. Lessons
    lessons = [
        (
            "les_m1", "mod_1", "Module 1: Getting Started with Python",
            "Understand the Python runtime, syntax structure, the print() function, and effective commenting.",
            """# Introduction to Python

Welcome to Python programming! Python is an interpreted, high-level, dynamically typed language celebrated for its clear, human-readable syntax.

## 1. The `print()` Function
To output text or numbers to the console screen in Python, we call the built-in `print()` function:

```python
print("Hello, World!")
print(42)
```

In Python:
* Text strings must be enclosed in single (`'...'`) or double (`"..."`) quotation marks.
* Numerical values do not need quotation marks.

## 2. Comments in Python
Comments are explanatory notes for humans reading the source code. The Python interpreter completely ignores comments during execution.

```python
# This is a single-line comment
print("Learning Python")  # Inline comment
```

## 3. Basic Syntax Rules
1. **Case Sensitivity**: `print` is valid; `Print` or `PRINT` will trigger a `NameError`.
2. **Parentheses**: Every function call requires matched opening and closing parentheses: `print(...)`.
3. **Punctuation**: No semicolons (`;`) are required at the ends of lines in Python.
""",
            json.dumps([
                {"title": "Basic Hello World", "code": "print('Hello, Python!')\nprint('Welcome to ITS.')", "explanation": "Outputs two lines of text sequentially."},
                {"title": "Comments in Action", "code": "# Calculate and print a greeting\nprint('ITS Active')  # Status notification", "explanation": "Demonstrates single-line and inline commenting."}
            ]),
            json.dumps([
                {"question": "Which statement correctly prints the word Python to the terminal?", "options": ["print('Python')", "echo 'Python'", "Console.WriteLine('Python')", "Print('Python')"], "correct_index": 0, "explanation": "Python uses lowercase print() with matched quotation marks."},
                {"question": "How are single-line comments denoted in Python?", "options": ["// Comment", "# Comment", "/* Comment */", "-- Comment"], "correct_index": 1, "explanation": "The hash '#' symbol designates a single-line comment in Python."}
            ]),
            1
        ),
        (
            "les_m2", "mod_2", "Module 2: Variables and Data Types",
            "Learn how variables store data, the four primary primitives (int, float, str, bool), and type conversion.",
            """# Variables and Data Types

A **variable** is a labeled container that stores a reference to a value in memory.

## 1. Assignment Syntax
In Python, you create a variable by assigning a value using the assignment operator (`=`):

```python
age = 20
gpa = 3.85
name = "Ada"
is_enrolled = True
```

Notice you do **not** specify data types (like `int age = 20`); Python automatically detects the type dynamically!

## 2. Fundamental Data Types
- **`int`**: Whole numbers (positive, negative, or zero), e.g., `42`, `-5`, `0`.
- **`float`**: Numbers with a decimal point, e.g., `3.14`, `-0.01`.
- **`str`**: Text surrounded by quotes, e.g., `"Ada Lovelace"`, `'Python'`.
- **`bool`**: Truth values, strictly `True` or `False` (capitalized).

## 3. Type Conversion (Casting)
When combining data, Python does **not** automatically convert incompatible types:

```python
# This raises a TypeError:
# print("Age: " + 20)

# Correct: convert integer to string
print("Age: " + str(20))

# Convert string from input to integer
num = int("45")
```
""",
            json.dumps([
                {"title": "Variable Assignment", "code": "course = 'CS101'\nstudents = 45\nprint(course, students)", "explanation": "Variables store different types and can be printed separated by commas."},
                {"title": "Type Casting", "code": "x = '10'\ny = int(x) + 5\nprint('Total:', y)", "explanation": "Converts string '10' to integer 10 before addition."}
            ]),
            json.dumps([
                {"question": "What is the type of the value 3.14?", "options": ["int", "float", "str", "bool"], "correct_index": 1, "explanation": "Numbers with decimal points are of type float."},
                {"question": "What happens if you run 'Score: ' + 95 without type conversion?", "options": ["Outputs Score: 95", "Raises a TypeError", "Outputs 95", "Raises a SyntaxError"], "correct_index": 1, "explanation": "Python does not allow concatenating str and int directly with '+'."}
            ]),
            1
        ),
        (
            "les_m3", "mod_3", "Module 3: Operators and Expressions",
            "Master arithmetic, comparison, and boolean logic operators, along with evaluation order.",
            """# Operators and Expressions

An **expression** is a combination of values, variables, and operators that evaluates to a single resulting value.

## 1. Arithmetic Operators
- Addition: `a + b`
- Subtraction: `a - b`
- Multiplication: `a * b`
- True Division: `a / b` (always produces a float: `7 / 2 = 3.5`)
- Floor Division: `a // b` (rounds down to whole number: `7 // 2 = 3`)
- Modulo (Remainder): `a % b` (e.g., `7 % 2 = 1`)
- Exponentiation (Power): `a ** b` (e.g., `2 ** 3 = 8`)

## 2. Comparison Operators
Comparison operators evaluate to a boolean (`True` or `False`):
- Equal to: `==` (do not confuse with `=` assignment)
- Not equal to: `!=`
- Greater than / Less than: `>`, `<`
- Greater/Less than or equal: `>=`, `<=`

## 3. Logical Operators
- `and`: True only if **both** operands are True.
- `or`: True if **at least one** operand is True.
- `not`: Inverts the truth value (`not True` is `False`).
""",
            json.dumps([
                {"title": "Modulo & Division", "code": "print(10 // 3)  # Floor division -> 3\nprint(10 % 3)   # Remainder -> 1", "explanation": "Shows integer quotient and remainder."},
                {"title": "Logical Conditions", "code": "age = 22\nhas_id = True\ncan_vote = (age >= 18) and has_id\nprint('Eligible:', can_vote)", "explanation": "Combines comparison with logical 'and'."}
            ]),
            json.dumps([
                {"question": "What is the result of 17 % 5 in Python?", "options": ["3", "2", "3.4", "1"], "correct_index": 1, "explanation": "17 divided by 5 is 3 with remainder 2."},
                {"question": "Which operator checks whether two values are equal?", "options": ["=", "==", "===", "equals"], "correct_index": 1, "explanation": "Double equals '==' compares equality; single '=' is variable assignment."}
            ]),
            1
        ),
        (
            "les_m4", "mod_4", "Module 4: Input and Output",
            "Capture interactive user input via input() and format rich terminal output with formatted string literals (f-strings).",
            """# Input and Output

Programs become truly interactive when they can receive input from the user and format clear responses.

## 1. The `input()` Function
The built-in `input()` function pauses execution and waits for the user to type text and press Enter:

```python
name = input("Enter your name: ")
print("Hello, " + name)
```

**CRITICAL RULE**: `input()` **ALWAYS** returns a string (`str`), even if the user enters digits!

```python
# To do math on numeric input, explicitly convert it:
raw_age = input("Enter your age: ")
age = int(raw_age)
next_year = age + 1
```

## 2. Formatted String Literals (f-strings)
The modern and preferred way to format output in Python 3 is using **f-strings** (prefix the string with `f` and embed variables or expressions inside curly braces `{}`):

```python
item = "Notebook"
price = 3.50
quantity = 4
print(f"Total for {quantity} {item}s is ${quantity * price:.2f}")
```
""",
            json.dumps([
                {"title": "Reading Numerical Input", "code": "# Convert input to int\nval = int(input('Number: '))\nprint(f'Double: {val * 2}')", "explanation": "Reads text, casts to integer, and doubles the value."},
                {"title": "f-string formatting", "code": "score = 88.5\nstudent = 'Maya'\nprint(f'{student} scored {score}% in Python.')", "explanation": "Embeds variable expressions cleanly into string."}
            ]),
            json.dumps([
                {"question": "What data type does input() return by default?", "options": ["int", "str", "float", "bool"], "correct_index": 1, "explanation": "input() always returns a string."},
                {"question": "Which syntax represents a valid Python f-string?", "options": ["f'Value: {x}'", "'Value: %{x}'", "format('Value: {x}')", "f(Value: x)"], "correct_index": 0, "explanation": "f'...' with curly braces surrounding expressions is the valid syntax."}
            ]),
            1
        ),
        (
            "les_m5", "mod_5", "Module 5: Conditional Statements",
            "Direct code execution paths using if, if-else, and if-elif-else branches, with proper boolean conditions.",
            """# Conditional Statements

Conditional statements enable programs to make decisions and execute different blocks of code depending on whether conditions are true or false.

## 1. The `if` Statement
```python
score = 85
if score >= 50:
    print("Passed!")
```
Notice:
1. The line ends with a colon (`:`).
2. The code block beneath is **indented** (standard: 4 spaces).

## 2. The `if-else` Statement
Provides an alternative branch when the condition is `False`:

```python
num = 7
if num % 2 == 0:
    print("Even")
else:
    print("Odd")
```

## 3. The `if-elif-else` Ladder
When evaluating multiple mutually exclusive cases:

```python
score = 78
if score >= 90:
    grade = "A"
elif score >= 80:
    grade = "B"
elif score >= 70:
    grade = "C"
else:
    grade = "F"
```
Python evaluates conditions from top to bottom and stops as soon as the first `True` condition is met!
""",
            json.dumps([
                {"title": "Checking Positive/Negative/Zero", "code": "val = 0\nif val > 0:\n    print('Positive')\nelif val < 0:\n    print('Negative')\nelse:\n    print('Zero')", "explanation": "Demonstrates 3-way branching with elif and else."}
            ]),
            json.dumps([
                {"question": "What punctuation character must follow an if, elif, or else statement line?", "options": ["; (semicolon)", ": (colon)", "{ (curly brace)", ". (period)"], "correct_index": 1, "explanation": "In Python, header statements require a colon at the end of the line."},
                {"question": "How does Python define the block of code inside an if statement?", "options": ["Curved brackets ()", "Square brackets []", "Indentation (whitespace)", "END IF keyword"], "correct_index": 2, "explanation": "Python strictly enforces indentation to indicate block scope."}
            ]),
            1
        ),
        (
            "les_m6", "mod_6", "Module 6: Loops",
            "Harness repetitive automation with for loops, range(), indefinite while loops, and flow controls.",
            """# Loops in Python

Loops execute a block of code repeatedly without rewriting the instructions.

## 1. The `for` Loop with `range()`
When you know how many times to repeat, use a `for` loop:

```python
# range(5) generates integers: 0, 1, 2, 3, 4 (up to, but NOT including 5)
for i in range(5):
    print(f"Iteration: {i}")

# range(start, stop, step)
for count in range(1, 10, 2):
    print(count)  # Prints 1, 3, 5, 7, 9
```

## 2. The `while` Loop
Repeats as long as a boolean condition remains `True`:

```python
counter = 3
while counter > 0:
    print(counter)
    counter -= 1  # Vital! Prevents infinite loops
print("Liftoff!")
```

## 3. Loop Flow Controls
- **`break`**: Immediately terminates and exits the loop.
- **`continue`**: Skips the rest of the current iteration and jumps to the next iteration.
""",
            json.dumps([
                {"title": "Summing with a loop", "code": "total = 0\nfor n in range(1, 6):\n    total += n\nprint(f'Sum 1 to 5: {total}')", "explanation": "Accumulates values 1 through 5, resulting in 15."},
                {"title": "While Loop Countdown", "code": "t = 3\nwhile t > 0:\n    print(t)\n    t -= 1", "explanation": "Executes 3 iterations and terminates cleanly."}
            ]),
            json.dumps([
                {"question": "What sequence of numbers does range(1, 5) produce?", "options": ["1, 2, 3, 4, 5", "1, 2, 3, 4", "0, 1, 2, 3, 4", "2, 3, 4, 5"], "correct_index": 1, "explanation": "range(start, stop) stops before reaching the stop value (1, 2, 3, 4)."},
                {"question": "Which keyword immediately exits a loop?", "options": ["stop", "exit", "break", "return"], "correct_index": 2, "explanation": "break causes the innermost loop to terminate immediately."}
            ]),
            1
        ),
        (
            "les_m7", "mod_7", "Module 7: Functions",
            "Encapsulate reusable logic using def, parameters, arguments, return values, and variable scope.",
            """# Functions in Python

A function is a named, reusable block of code that performs a specific task. Functions improve readability, modularity, and testability.

## 1. Defining and Calling Functions
Use the `def` keyword followed by the function name, parentheses, and a colon:

```python
def greet(name):
    return f"Hello, {name}!"

# Function call
message = greet("Ada")
print(message)
```

## 2. Returning vs Printing
- **`print()`** displays output to the screen, but returns `None`.
- **`return`** sends a computed value back to whoever called the function so it can be stored, tested, or used in calculations.

```python
# CORRECT for automated testing:
def square(n):
    return n * n

# Calling and asserting:
result = square(4)  # result holds 16
```

## 3. Variable Scope
Variables created inside a function are **local** to that function. They cannot be accessed outside the function body.
""",
            json.dumps([
                {"title": "Function with Return", "code": "def calculate_tax(subtotal, rate=0.05):\n    return subtotal * rate\n\nprint(calculate_tax(100.0))", "explanation": "Returns computed tax value with default parameter."}
            ]),
            json.dumps([
                {"question": "What keyword is used to define a function in Python?", "options": ["function", "fun", "def", "method"], "correct_index": 2, "explanation": "The 'def' keyword introduces a function definition."},
                {"question": "What is the return value of a function that does not have an explicit return statement?", "options": ["0", "False", "None", "'' (empty string)"], "correct_index": 2, "explanation": "Python functions implicitly return None if no return statement is executed."}
            ]),
            1
        ),
        (
            "les_m8", "mod_8", "Module 8: Lists and Strings",
            "Work with sequence collections, indexing from zero, slicing syntax, methods (append, pop), and string operations.",
            """# Lists and Strings

Lists are ordered, mutable collections of items. Strings are ordered, immutable sequences of characters.

## 1. Indexing and Slicing
Python uses **0-based indexing**:

```python
fruits = ["apple", "banana", "cherry", "date"]
print(fruits[0])   # "apple"
print(fruits[-1])  # "date" (negative indices count backwards)

# Slicing: [start:stop:step]
print(fruits[1:3]) # ["banana", "cherry"]
```

## 2. Common List Operations
```python
numbers = [10, 20, 30]
numbers.append(40)    # Adds 40 to the end -> [10, 20, 30, 40]
numbers.pop()         # Removes and returns last element -> 40
length = len(numbers) # 3
```

## 3. Iterating Over Sequences
```python
for item in fruits:
    print(f"Fruit: {item}")
```

## 4. Avoiding `IndexError`
Attempting to access `fruits[10]` when the list only contains 4 items raises an `IndexError: list index out of range`. Always ensure `index < len(collection)`.
""",
            json.dumps([
                {"title": "List Slicing & Methods", "code": "scores = [85, 90, 78]\nscores.append(95)\nprint(f'Total elements: {len(scores)}')\nprint(f'Top score: {max(scores)}')", "explanation": "Appends an element and calculates collection metrics."}
            ]),
            json.dumps([
                {"question": "What is the index of the first element in a Python list?", "options": ["1", "0", "-1", "first"], "correct_index": 1, "explanation": "Python sequences are zero-indexed."},
                {"question": "What error occurs if you access list[5] on a list with 3 elements?", "options": ["ValueError", "KeyError", "IndexError", "TypeError"], "correct_index": 2, "explanation": "Accessing an out-of-bounds index raises an IndexError."}
            ]),
            1
        ),
        (
            "les_m9", "mod_9", "Module 9: Dictionaries",
            "Store and query key-value pairs, mutate dictionary mappings, and avoid KeyError exceptions with safe lookups.",
            """# Dictionaries in Python

A **dictionary** is an unordered collection of associative key-value pairs. Each key maps directly to a value.

## 1. Creating and Accessing Dictionaries
Keys must be immutable (commonly strings or integers), while values can be any type:

```python
student = {
    "name": "Jordan",
    "major": "Computer Science",
    "year": 2
}

print(student["name"])  # "Jordan"
```

## 2. Mutating Dictionaries
```python
student["year"] = 3             # Update existing key
student["gpa"] = 3.9            # Add new key-value pair
del student["major"]            # Remove a key
```

## 3. Safe Access and `KeyError`
Accessing a key that does not exist raises a `KeyError`:

```python
# Unsafe:
# print(student["phone"]) # Raises KeyError!

# Safe approach 1: .get(key, default)
phone = student.get("phone", "Not provided")

# Safe approach 2: membership check
if "phone" in student:
    print(student["phone"])
```

## 4. Iterating Through Dictionaries
```python
for key, val in student.items():
    print(f"{key}: {val}")
```
""",
            json.dumps([
                {"title": "Dictionary Lookup", "code": "capital = {'France': 'Paris', 'Japan': 'Tokyo'}\nprint(capital.get('Japan'))\nprint(capital.get('Canada', 'Unknown'))", "explanation": "Demonstrates safe lookups using dict.get()."}
            ]),
            json.dumps([
                {"question": "Which data structure maps unique keys to values in Python?", "options": ["List", "Tuple", "Dictionary", "Set"], "correct_index": 2, "explanation": "Dictionaries associate keys with values."},
                {"question": "How can you safely retrieve a value without crashing if the key might not exist?", "options": ["dict[key]", "dict.get(key, default)", "dict.find(key)", "dict.search(key)"], "correct_index": 1, "explanation": "dict.get() returns None or a specified default if key is absent."}
            ]),
            1
        ),
        (
            "les_m10", "mod_10", "Module 10: Introductory Problem-Solving",
            "Synthesize variables, conditional branches, loops, and functions into cohesive algorithmic solutions.",
            """# Introductory Problem-Solving in Python

Problem-solving is the art of translating real-world requirements into clear, step-by-step algorithms.

## 1. The 4-Step Problem-Solving Cycle
1. **Understand the Problem**: Identify the inputs, expected outputs, and constraints.
2. **Break into Sub-Problems**: Don't write code immediately. Outline intermediate milestones (e.g. "Step 1: filter items; Step 2: compute total; Step 3: return average").
3. **Implement Incrementally**: Write one small helper or function, test it, and verify.
4. **Refactor and Test Edge Cases**: Test zero values, negative numbers, empty lists, and boundary conditions.

## 2. Synthesis Example: Filtering and Transforming
Suppose we need to count how many positive even numbers are in a list:

```python
def count_positive_evens(numbers):
    count = 0
    for num in numbers:
        if num > 0 and num % 2 == 0:
            count += 1
    return count
```
Notice how this combines:
- Function declaration (`def`)
- Accumulator variable (`count = 0`)
- Iteration (`for num in numbers`)
- Compound condition (`num > 0 and num % 2 == 0`)
- Return value (`return count`)
""",
            json.dumps([
                {"title": "Algorithm Synthesis", "code": "def find_vowel_count(word):\n    vowels = 'aeiouAEIOU'\n    count = 0\n    for char in word:\n        if char in vowels:\n            count += 1\n    return count\n\nprint(find_vowel_count('Intelligent Tutoring'))", "explanation": "Combines strings, loops, and conditional membership."}
            ]),
            json.dumps([
                {"question": "What is the recommended first step when approaching a programming problem?", "options": ["Start typing code immediately", "Understand inputs, outputs, and requirements", "Write random unit tests", "Look up solutions online"], "correct_index": 1, "explanation": "Carefully understanding specifications and inputs/outputs prevents flawed logic."},
                {"question": "Why is testing edge cases (e.g. empty lists, zeroes) critical?", "options": ["It increases code line count", "It uncovers boundary errors and unexpected runtime failures", "It makes the code run faster", "It is only needed for advanced software"], "correct_index": 1, "explanation": "Edge cases frequently reveal boundary conditions and off-by-one errors."}
            ]),
            1
        )
    ]
    c.executemany("INSERT INTO lessons VALUES (?,?,?,?,?,?,?,?)", lessons)

    # 4. Exercises & Test Cases (20+ exercises)
    exercises_data = [
        # Module 1
        {
            "id": "ex_m1_1",
            "topic_id": "mod_1",
            "title": "Print a Welcome Message",
            "difficulty": "easy",
            "statement": "Write a Python script that outputs exactly 'Welcome to Python Programming!' to standard output.",
            "instructions": "Use the print() function. Ensure capitalization and punctuation match exactly.",
            "starter_code": "# Use print() to display the welcome greeting\nprint(\"...\")\n",
            "hints": [
                {"level": 1, "text": "Concept: The built-in print() function displays text inside quotation marks."},
                {"level": 2, "text": "Check: Ensure the string is surrounded by double quotes or single quotes and matches the exact phrase."},
                {"level": 3, "text": "Solution outline: print(\"Welcome to Python Programming!\")"}
            ],
            "solution": "print(\"Welcome to Python Programming!\")\n",
            "errors": ["SyntaxError", "OutputMismatch"],
            "test_cases": [
                {"id": "tc_m1_1_1", "expected": "Welcome to Python Programming!", "hidden": 0, "desc": "Standard output check"},
                {"id": "tc_m1_1_2", "expected": "Welcome to Python Programming!", "hidden": 1, "desc": "Exact match verification"}
            ]
        },
        {
            "id": "ex_m1_2",
            "topic_id": "mod_1",
            "title": "Two-Line Output with Comments",
            "difficulty": "easy",
            "statement": "Write a program that includes at least one comment, prints 'Line One' on the first line, and 'Line Two' on the second line.",
            "instructions": "Call print() twice to output across two distinct lines.",
            "starter_code": "# Add a comment explaining your code\n# Call print() twice\n",
            "hints": [
                {"level": 1, "text": "Concept: Successive calls to print() output on separate lines by default."},
                {"level": 2, "text": "Target: First call print('Line One'), then on the next line call print('Line Two')."},
                {"level": 3, "text": "Code: print('Line One')\nprint('Line Two')"}
            ],
            "solution": "# Comment\nprint('Line One')\nprint('Line Two')\n",
            "errors": ["SyntaxError", "OutputMismatch"],
            "test_cases": [
                {"id": "tc_m1_2_1", "expected": "Line One\nLine Two", "hidden": 0, "desc": "Two line output check"}
            ]
        },

        # Module 2
        {
            "id": "ex_m2_1",
            "topic_id": "mod_2",
            "title": "Rectangle Area Calculation",
            "difficulty": "easy",
            "statement": "Assign the width to 5 and the height to 8 in variables, then compute and print their product (area).",
            "instructions": "Create variables named width and height, multiply them, and print the resulting number.",
            "starter_code": "width = 5\nheight = 8\n# Calculate area and print it\n",
            "hints": [
                {"level": 1, "text": "Concept: In Python, the '*' operator performs arithmetic multiplication between numeric variables."},
                {"level": 2, "text": "Target: Compute area = width * height, then pass area into print(area)."},
                {"level": 3, "text": "Debugging: You should print 40."}
            ],
            "solution": "width = 5\nheight = 8\narea = width * height\nprint(area)\n",
            "errors": ["NameError", "OutputMismatch", "TypeError"],
            "test_cases": [
                {"id": "tc_m2_1_1", "expected": "40", "hidden": 0, "desc": "Calculates 5 * 8 = 40"}
            ]
        },
        {
            "id": "ex_m2_2",
            "topic_id": "mod_2",
            "title": "String and Integer Conversion",
            "difficulty": "medium",
            "statement": "Given a numeric string val_str = '25', convert it to an integer, add 15, and print the resulting total.",
            "instructions": "Use int() to cast val_str before performing addition, then print the sum.",
            "starter_code": "val_str = '25'\n# Convert val_str to an int, add 15, and print the result\n",
            "hints": [
                {"level": 1, "text": "Concept: You cannot add an integer directly to a string without converting it first."},
                {"level": 2, "text": "Target: Call int(val_str) to convert '25' to 25."},
                {"level": 3, "text": "Example: result = int(val_str) + 15\nprint(result)"}
            ],
            "solution": "val_str = '25'\nresult = int(val_str) + 15\nprint(result)\n",
            "errors": ["TypeError", "ValueError", "OutputMismatch"],
            "test_cases": [
                {"id": "tc_m2_2_1", "expected": "40", "hidden": 0, "desc": "Correctly converts and adds 25 + 15 = 40"}
            ]
        },

        # Module 3
        {
            "id": "ex_m3_1",
            "topic_id": "mod_3",
            "title": "Quotient and Remainder",
            "difficulty": "easy",
            "statement": "Given dividend 17 and divisor 5, compute the floor division (quotient) and the modulo (remainder), and print them separated by a space on a single line.",
            "instructions": "Use '//' for integer floor division and '%' for remainder. Print: quotient, remainder.",
            "starter_code": "dividend = 17\ndivisor = 5\n# Compute quotient and remainder and print them\n",
            "hints": [
                {"level": 1, "text": "Concept: '//' gives whole division; '%' gives the remainder."},
                {"level": 2, "text": "Target: print(dividend // divisor, dividend % divisor)"},
                {"level": 3, "text": "Expected output: 3 2"}
            ],
            "solution": "dividend = 17\ndivisor = 5\nprint(dividend // divisor, dividend % divisor)\n",
            "errors": ["ZeroDivisionError", "OutputMismatch"],
            "test_cases": [
                {"id": "tc_m3_1_1", "expected": "3 2", "hidden": 0, "desc": "17 // 5 is 3 and 17 % 5 is 2"}
            ]
        },
        {
            "id": "ex_m3_2",
            "topic_id": "mod_3",
            "title": "Compound Boolean Check",
            "difficulty": "medium",
            "statement": "Write an expression that evaluates whether a variable x is both greater than 10 AND less than or equal to 50. Test with x = 25 and print the boolean result.",
            "instructions": "Combine comparison operators with the logical 'and' keyword. Print the boolean True or False.",
            "starter_code": "x = 25\n# Evaluate if x > 10 and x <= 50, then print the result\n",
            "hints": [
                {"level": 1, "text": "Concept: Use the 'and' logical operator to combine two boolean comparisons."},
                {"level": 2, "text": "Target: is_valid = (x > 10) and (x <= 50)"},
                {"level": 3, "text": "Output should print True."}
            ],
            "solution": "x = 25\nprint(x > 10 and x <= 50)\n",
            "errors": ["SyntaxError", "OutputMismatch"],
            "test_cases": [
                {"id": "tc_m3_2_1", "expected": "True", "hidden": 0, "desc": "Evaluates 25 > 10 and 25 <= 50 to True"}
            ]
        },

        # Module 4
        {
            "id": "ex_m4_1",
            "topic_id": "mod_4",
            "title": "Interactive User Greeting",
            "difficulty": "easy",
            "statement": "Read a user's name from standard input using input() and print 'Hello, [name]!' using an f-string.",
            "instructions": "Use name = input() and print(f'Hello, {name}!').",
            "starter_code": "# Read the name from input and print the formatted greeting\n",
            "hints": [
                {"level": 1, "text": "Concept: input() reads from standard input; f-strings embed variables inside {name}."},
                {"level": 2, "text": "Target: name = input()\nprint(f\"Hello, {name}!\")"},
                {"level": 3, "text": "Check punctuation: ensure there is an exclamation mark '!' at the end."}
            ],
            "solution": "name = input()\nprint(f\"Hello, {name}!\")\n",
            "errors": ["NameError", "OutputMismatch"],
            "test_cases": [
                {"id": "tc_m4_1_1", "input": "Alice", "expected": "Hello, Alice!", "hidden": 0, "desc": "Standard name Alice"},
                {"id": "tc_m4_1_2", "input": "Grace Hopper", "expected": "Hello, Grace Hopper!", "hidden": 1, "desc": "Multi-word name check"}
            ]
        },
        {
            "id": "ex_m4_2",
            "topic_id": "mod_4",
            "title": "Double the Input Number",
            "difficulty": "medium",
            "statement": "Read a whole number from standard input, double it, and print the doubled number.",
            "instructions": "Remember to convert the input string to an int using int(input()).",
            "starter_code": "# Read number, convert to int, double it, and print\n",
            "hints": [
                {"level": 1, "text": "Concept: input() returns a string. If you multiply '7' * 2 you get '77' instead of 14! Convert to int first."},
                {"level": 2, "text": "Target: n = int(input())\nprint(n * 2)"},
                {"level": 3, "text": "Ensure you print the numeric product, not repeated text."}
            ],
            "solution": "n = int(input())\nprint(n * 2)\n",
            "errors": ["TypeError", "ValueError", "OutputMismatch"],
            "test_cases": [
                {"id": "tc_m4_2_1", "input": "7", "expected": "14", "hidden": 0, "desc": "Doubles 7 to 14"},
                {"id": "tc_m4_2_2", "input": "-4", "expected": "-8", "hidden": 1, "desc": "Handles negative number doubling"}
            ]
        },

        # Module 5
        {
            "id": "ex_m5_1",
            "topic_id": "mod_5",
            "title": "Check Even or Odd",
            "difficulty": "easy",
            "statement": "Define a function named `is_even(n)` that returns True if integer n is even, and False if odd.",
            "instructions": "A number is even if n % 2 == 0. Return the boolean value.",
            "starter_code": "def is_even(n):\n    # Return True if even, else False\n    pass\n",
            "hints": [
                {"level": 1, "text": "Concept: Use the modulo operator '%' with 2 to check for remainder."},
                {"level": 2, "text": "Target: if n % 2 == 0: return True else: return False (or simply return n % 2 == 0)."},
                {"level": 3, "text": "Ensure you RETURN the boolean, do not print it."}
            ],
            "solution": "def is_even(n):\n    return n % 2 == 0\n",
            "errors": ["SyntaxError", "IndentationError", "OutputMismatch"],
            "test_cases": [
                {"id": "tc_m5_1_1", "func": "is_even(4)", "expected": "True", "hidden": 0, "desc": "4 is even"},
                {"id": "tc_m5_1_2", "func": "is_even(7)", "expected": "False", "hidden": 0, "desc": "7 is odd"},
                {"id": "tc_m5_1_3", "func": "is_even(0)", "expected": "True", "hidden": 1, "desc": "0 is even edge case"}
            ]
        },
        {
            "id": "ex_m5_2",
            "topic_id": "mod_5",
            "title": "Letter Grade Classifier",
            "difficulty": "medium",
            "statement": "Define a function `get_letter_grade(score)` that takes a score (0-100) and returns: 'A' if score >= 90, 'B' if score >= 80, 'C' if score >= 70, 'D' if score >= 60, otherwise 'F'.",
            "instructions": "Use an if-elif-else structure to evaluate the branches in descending order.",
            "starter_code": "def get_letter_grade(score):\n    # Return letter grade string\n    pass\n",
            "hints": [
                {"level": 1, "text": "Concept: Use if-elif-else to evaluate thresholds in descending order from highest to lowest."},
                {"level": 2, "text": "Target: Check score >= 90 first, then elif score >= 80, down to else: return 'F'."},
                {"level": 3, "text": "Ensure you return single-letter strings 'A', 'B', 'C', 'D', 'F'."}
            ],
            "solution": "def get_letter_grade(score):\n    if score >= 90:\n        return 'A'\n    elif score >= 80:\n        return 'B'\n    elif score >= 70:\n        return 'C'\n    elif score >= 60:\n        return 'D'\n    else:\n        return 'F'\n",
            "errors": ["IndentationError", "OutputMismatch"],
            "test_cases": [
                {"id": "tc_m5_2_1", "func": "get_letter_grade(95)", "expected": "A", "hidden": 0, "desc": "Score 95 gets A"},
                {"id": "tc_m5_2_2", "func": "get_letter_grade(72)", "expected": "C", "hidden": 0, "desc": "Score 72 gets C"},
                {"id": "tc_m5_2_3", "func": "get_letter_grade(59)", "expected": "F", "hidden": 1, "desc": "Score 59 gets F"}
            ]
        },

        # Module 6
        {
            "id": "ex_m6_1",
            "topic_id": "mod_6",
            "title": "Sum of First N Integers",
            "difficulty": "easy",
            "statement": "Define a function `sum_n(n)` that returns the sum of all integers from 1 up to and including n using a loop.",
            "instructions": "Initialize total = 0, iterate with for i in range(1, n + 1), and return total.",
            "starter_code": "def sum_n(n):\n    # Compute sum from 1 to n using a loop\n    pass\n",
            "hints": [
                {"level": 1, "text": "Concept: An accumulator variable adds each value inside a loop."},
                {"level": 2, "text": "Target: range(1, n + 1) includes n. range(1, n) would stop at n - 1."},
                {"level": 3, "text": "Structure:\ntotal = 0\nfor i in range(1, n + 1):\n    total += i\nreturn total"}
            ],
            "solution": "def sum_n(n):\n    total = 0\n    for i in range(1, n + 1):\n        total += i\n    return total\n",
            "errors": ["TimeLimitExceeded", "IndexError", "OutputMismatch"],
            "test_cases": [
                {"id": "tc_m6_1_1", "func": "sum_n(5)", "expected": "15", "hidden": 0, "desc": "1+2+3+4+5 = 15"},
                {"id": "tc_m6_1_2", "func": "sum_n(1)", "expected": "1", "hidden": 0, "desc": "sum_n(1) = 1"},
                {"id": "tc_m6_1_3", "func": "sum_n(10)", "expected": "55", "hidden": 1, "desc": "sum_n(10) = 55"}
            ]
        },
        {
            "id": "ex_m6_2",
            "topic_id": "mod_6",
            "title": "Count Down with While Loop",
            "difficulty": "medium",
            "statement": "Define a function `countdown_list(start)` that uses a while loop to generate and return a list of integers counting down from start down to 1.",
            "instructions": "Initialize an empty list, append the current number in each iteration, decrement the counter, and return the list.",
            "starter_code": "def countdown_list(start):\n    # Return list counting down from start to 1\n    pass\n",
            "hints": [
                {"level": 1, "text": "Concept: Initialize res = [], loop while start >= 1, and decrement start each step."},
                {"level": 2, "text": "Target: res.append(start); start -= 1"},
                {"level": 3, "text": "Ensure the loop decrements start to avoid an infinite loop!"}
            ],
            "solution": "def countdown_list(start):\n    res = []\n    while start >= 1:\n        res.append(start)\n        start -= 1\n    return res\n",
            "errors": ["TimeLimitExceeded", "OutputMismatch"],
            "test_cases": [
                {"id": "tc_m6_2_1", "func": "countdown_list(4)", "expected": "[4, 3, 2, 1]", "hidden": 0, "desc": "Countdown from 4"},
                {"id": "tc_m6_2_2", "func": "countdown_list(1)", "expected": "[1]", "hidden": 1, "desc": "Countdown from 1"}
            ]
        },

        # Module 7
        {
            "id": "ex_m7_1",
            "topic_id": "mod_7",
            "title": "Square of a Number",
            "difficulty": "easy",
            "statement": "Write a function `square(x)` that returns the square of number x.",
            "instructions": "Return x * x or x ** 2. Do not merely print the value.",
            "starter_code": "def square(x):\n    # Return the square of x\n    pass\n",
            "hints": [
                {"level": 1, "text": "Concept: Functions should return calculated values using the 'return' keyword."},
                {"level": 2, "text": "Target: return x * x"},
                {"level": 3, "text": "Check: Make sure you do not use print(x * x), but return x * x."}
            ],
            "solution": "def square(x):\n    return x * x\n",
            "errors": ["NameError", "OutputMismatch"],
            "test_cases": [
                {"id": "tc_m7_1_1", "func": "square(5)", "expected": "25", "hidden": 0, "desc": "5 squared is 25"},
                {"id": "tc_m7_1_2", "func": "square(-3)", "expected": "9", "hidden": 0, "desc": "-3 squared is 9"},
                {"id": "tc_m7_1_3", "func": "square(0)", "expected": "0", "hidden": 1, "desc": "0 squared is 0"}
            ]
        },
        {
            "id": "ex_m7_2",
            "topic_id": "mod_7",
            "title": "Maximum of Three Numbers",
            "difficulty": "medium",
            "statement": "Write a function `max_of_three(a, b, c)` that returns the largest of three numbers without using the built-in max() function.",
            "instructions": "Use conditional statements (if-elif-else) to determine and return the largest value.",
            "starter_code": "def max_of_three(a, b, c):\n    # Return the largest value among a, b, and c\n    pass\n",
            "hints": [
                {"level": 1, "text": "Concept: Compare a with b and c. If a >= b and a >= c, then a is the maximum."},
                {"level": 2, "text": "Target: Next check elif b >= c: return b; else: return c."},
                {"level": 3, "text": "Handle cases where two or three numbers are equal."}
            ],
            "solution": "def max_of_three(a, b, c):\n    if a >= b and a >= c:\n        return a\n    elif b >= c:\n        return b\n    else:\n        return c\n",
            "errors": ["SyntaxError", "OutputMismatch"],
            "test_cases": [
                {"id": "tc_m7_2_1", "func": "max_of_three(10, 4, 7)", "expected": "10", "hidden": 0, "desc": "First is max"},
                {"id": "tc_m7_2_2", "func": "max_of_three(3, 19, 12)", "expected": "19", "hidden": 0, "desc": "Second is max"},
                {"id": "tc_m7_2_3", "func": "max_of_three(5, 5, 2)", "expected": "5", "hidden": 1, "desc": "Duplicate values handled"}
            ]
        },

        # Module 8
        {
            "id": "ex_m8_1",
            "topic_id": "mod_8",
            "title": "Filter Positive Numbers",
            "difficulty": "medium",
            "statement": "Define a function `filter_positives(numbers)` that takes a list of integers and returns a new list containing only the positive numbers (> 0) in their original order.",
            "instructions": "Create an empty list, loop through the input list, and append numbers that are strictly greater than 0.",
            "starter_code": "def filter_positives(numbers):\n    # Return a new list of numbers > 0\n    pass\n",
            "hints": [
                {"level": 1, "text": "Concept: Initialize an accumulator list positives = [] and loop with 'for n in numbers:'."},
                {"level": 2, "text": "Target: if n > 0: positives.append(n)"},
                {"level": 3, "text": "Return positives after the loop finishes."}
            ],
            "solution": "def filter_positives(numbers):\n    positives = []\n    for n in numbers:\n        if n > 0:\n            positives.append(n)\n    return positives\n",
            "errors": ["IndexError", "TypeError", "OutputMismatch"],
            "test_cases": [
                {"id": "tc_m8_1_1", "func": "filter_positives([-2, 5, 0, 7, -1])", "expected": "[5, 7]", "hidden": 0, "desc": "Filters negative and zero"},
                {"id": "tc_m8_1_2", "func": "filter_positives([-1, -3])", "expected": "[]", "hidden": 0, "desc": "All negative returns empty list"},
                {"id": "tc_m8_1_3", "func": "filter_positives([10, 20])", "expected": "[10, 20]", "hidden": 1, "desc": "All positive returns identical"}
            ]
        },
        {
            "id": "ex_m8_2",
            "topic_id": "mod_8",
            "title": "Reverse a String",
            "difficulty": "easy",
            "statement": "Define a function `reverse_string(text)` that returns the reversed version of the input string.",
            "instructions": "You can use Python slicing text[::-1] or an iterative loop to construct the reversed string.",
            "starter_code": "def reverse_string(text):\n    # Return reversed text\n    pass\n",
            "hints": [
                {"level": 1, "text": "Concept: Slicing with step -1 text[::-1] reverses any sequence cleanly."},
                {"level": 2, "text": "Target: return text[::-1]"},
                {"level": 3, "text": "Alternatively, build reversed_text = '' and loop through char in text."}
            ],
            "solution": "def reverse_string(text):\n    return text[::-1]\n",
            "errors": ["IndexError", "OutputMismatch"],
            "test_cases": [
                {"id": "tc_m8_2_1", "func": "reverse_string('python')", "expected": "nohtyp", "hidden": 0, "desc": "Standard word reverse"},
                {"id": "tc_m8_2_2", "func": "reverse_string('radar')", "expected": "radar", "hidden": 1, "desc": "Palindrome reverse"}
            ]
        },

        # Module 9
        {
            "id": "ex_m9_1",
            "topic_id": "mod_9",
            "title": "Word Frequency Counter",
            "difficulty": "medium",
            "statement": "Define a function `count_frequencies(words)` that takes a list of strings and returns a dictionary mapping each unique word to the number of times it appears in the list.",
            "instructions": "Iterate through words, and for each word increment its count in the dictionary (e.g. counts[w] = counts.get(w, 0) + 1).",
            "starter_code": "def count_frequencies(words):\n    # Return dictionary with word counts\n    pass\n",
            "hints": [
                {"level": 1, "text": "Concept: Use a dictionary where keys are the words and values are counts."},
                {"level": 2, "text": "Target: freq[word] = freq.get(word, 0) + 1 prevents KeyError on new words."},
                {"level": 3, "text": "Return freq at the end."}
            ],
            "solution": "def count_frequencies(words):\n    freq = {}\n    for w in words:\n        freq[w] = freq.get(w, 0) + 1\n    return freq\n",
            "errors": ["KeyError", "TypeError", "OutputMismatch"],
            "test_cases": [
                {"id": "tc_m9_1_1", "func": "count_frequencies(['apple', 'banana', 'apple', 'orange'])", "expected": "{'apple': 2, 'banana': 1, 'orange': 1}", "hidden": 0, "desc": "Counts repeated and unique words"},
                {"id": "tc_m9_1_2", "func": "count_frequencies([])", "expected": "{}", "hidden": 1, "desc": "Empty list returns empty dict"}
            ]
        },
        {
            "id": "ex_m9_2",
            "topic_id": "mod_9",
            "title": "Safe Student Grade Lookup",
            "difficulty": "easy",
            "statement": "Define a function `lookup_grade(roster, student_name)` that takes a dictionary roster mapping student names to grades. Return the grade if found; if not found, return 'Not Found'.",
            "instructions": "Use roster.get(student_name, 'Not Found') or check if student_name in roster.",
            "starter_code": "def lookup_grade(roster, student_name):\n    # Safely return grade or 'Not Found'\n    pass\n",
            "hints": [
                {"level": 1, "text": "Concept: Direct indexing roster[name] crashes with KeyError if missing. Use dict.get(key, default)."},
                {"level": 2, "text": "Target: return roster.get(student_name, 'Not Found')"},
                {"level": 3, "text": "Ensure the default string is exactly 'Not Found'."}
            ],
            "solution": "def lookup_grade(roster, student_name):\n    return roster.get(student_name, 'Not Found')\n",
            "errors": ["KeyError", "OutputMismatch"],
            "test_cases": [
                {"id": "tc_m9_2_1", "func": "lookup_grade({'Ada': 98, 'Alan': 94}, 'Ada')", "expected": "98", "hidden": 0, "desc": "Found student"},
                {"id": "tc_m9_2_2", "func": "lookup_grade({'Ada': 98, 'Alan': 94}, 'Grace')", "expected": "Not Found", "hidden": 0, "desc": "Missing student"}
            ]
        },

        # Module 10
        {
            "id": "ex_m10_1",
            "topic_id": "mod_10",
            "title": "FizzBuzz Problem-Solving",
            "difficulty": "medium",
            "statement": "Define a function `fizzbuzz(n)` that returns: 'FizzBuzz' if n is divisible by both 3 and 5, 'Fizz' if divisible only by 3, 'Buzz' if divisible only by 5, or str(n) if divisible by neither.",
            "instructions": "Check for divisibility by 15 (both 3 and 5) first, as checking 3 or 5 first will trigger a false early branch.",
            "starter_code": "def fizzbuzz(n):\n    # Return 'FizzBuzz', 'Fizz', 'Buzz', or str(n)\n    pass\n",
            "hints": [
                {"level": 1, "text": "Concept: Order of conditions matters! Check (n % 3 == 0 and n % 5 == 0) first."},
                {"level": 2, "text": "Target: If not divisible by 15, then check elif n % 3 == 0, then elif n % 5 == 0."},
                {"level": 3, "text": "Remember to return str(n) for non-multiples."}
            ],
            "solution": "def fizzbuzz(n):\n    if n % 3 == 0 and n % 5 == 0:\n        return 'FizzBuzz'\n    elif n % 3 == 0:\n        return 'Fizz'\n    elif n % 5 == 0:\n        return 'Buzz'\n    else:\n        return str(n)\n",
            "errors": ["OutputMismatch", "IndentationError"],
            "test_cases": [
                {"id": "tc_m10_1_1", "func": "fizzbuzz(15)", "expected": "FizzBuzz", "hidden": 0, "desc": "15 gives FizzBuzz"},
                {"id": "tc_m10_1_2", "func": "fizzbuzz(9)", "expected": "Fizz", "hidden": 0, "desc": "9 gives Fizz"},
                {"id": "tc_m10_1_3", "func": "fizzbuzz(10)", "expected": "Buzz", "hidden": 0, "desc": "10 gives Buzz"},
                {"id": "tc_m10_1_4", "func": "fizzbuzz(7)", "expected": "7", "hidden": 1, "desc": "7 gives '7'"}
            ]
        },
        {
            "id": "ex_m10_2",
            "topic_id": "mod_10",
            "title": "Synthesized Score Statistics",
            "difficulty": "hard",
            "statement": "Define a function `analyze_scores(scores)` that takes a non-empty list of numeric scores and returns a dictionary with three keys: 'count' (number of scores), 'average' (mean score rounded to 2 decimals), and 'passed' (how many scores >= 50).",
            "instructions": "Combine list functions or loops with float rounding using round(sum / count, 2).",
            "starter_code": "def analyze_scores(scores):\n    # Return dict with 'count', 'average', and 'passed'\n    pass\n",
            "hints": [
                {"level": 1, "text": "Concept: Break into 3 milestones: count items, calculate sum/average, and count passed >= 50."},
                {"level": 2, "text": "Target: avg = round(sum(scores) / len(scores), 2). Count passed with a loop or list comprehension."},
                {"level": 3, "text": "Return {'count': len(scores), 'average': avg, 'passed': passed_count}"}
            ],
            "solution": "def analyze_scores(scores):\n    count = len(scores)\n    avg = round(sum(scores) / count, 2)\n    passed = sum(1 for s in scores if s >= 50)\n    return {'count': count, 'average': avg, 'passed': passed}\n",
            "errors": ["ZeroDivisionError", "TypeError", "OutputMismatch"],
            "test_cases": [
                {"id": "tc_m10_2_1", "func": "analyze_scores([70, 40, 90, 80])", "expected": "{'count': 4, 'average': 70.0, 'passed': 3}", "hidden": 0, "desc": "Calculates 4 scores"},
                {"id": "tc_m10_2_2", "func": "analyze_scores([100])", "expected": "{'count': 1, 'average': 100.0, 'passed': 1}", "hidden": 1, "desc": "Single element edge case"}
            ]
        }
    ]

    for ex in exercises_data:
        c.execute("""
        INSERT INTO exercises (
            id, topic_id, title, difficulty, exercise_type, problem_statement,
            instructions, starter_code, hints, worked_solution, common_error_categories, max_score, is_active
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
        """, (
            ex["id"], ex["topic_id"], ex["title"], ex["difficulty"], "programming",
            ex["statement"], ex["instructions"], ex["starter_code"],
            json.dumps(ex["hints"]), ex["solution"], json.dumps(ex["errors"]), 100.0, 1
        ))

        for tc in ex["test_cases"]:
            c.execute("""
            INSERT INTO exercise_test_cases (
                id, exercise_id, input_data, expected_output, function_call, is_hidden, description
            ) VALUES (?,?,?,?,?,?,?)
            """, (
                tc["id"], ex["id"], tc.get("input", ""), tc["expected"],
                tc.get("func", None), tc.get("hidden", 0), tc["desc"]
            ))

    # 5. Assessments: Pre-test and Post-test
    c.execute("INSERT INTO assessments VALUES (?,?,?,?)", ("pre_test", "Diagnostic Pre-Assessment", "Evaluates your baseline understanding across the 10 Python introductory topics to calibrate recommendations.", 10))
    c.execute("INSERT INTO assessments VALUES (?,?,?,?)", ("post_test", "Summative Post-Assessment", "Evaluates your final learning achievement and conceptual mastery after completing instruction.", 10))

    # 10 Diagnostic Pre-test questions (1 per module)
    pre_questions = [
        ("q_pre_1", "pre_test", "mod_1", "What does the print() function do in Python?", json.dumps(["Reads text from the keyboard", "Outputs data to the console", "Saves code to a file", "Creates a variable"]), 1, "print() outputs text or data to the standard console display."),
        ("q_pre_2", "pre_test", "mod_2", "Which statement correctly converts the string '45' to an integer?", json.dumps(["str(45)", "int('45')", "float('45')", "parse('45')"]), 1, "int('45') casts string '45' to an integer."),
        ("q_pre_3", "pre_test", "mod_3", "What is the output of 15 // 4 in Python?", json.dumps(["3.75", "3", "4", "3.0"]), 1, "// is floor division which returns integer 3."),
        ("q_pre_4", "pre_test", "mod_4", "What type of data does the input() function return?", json.dumps(["int", "float", "str", "bool"]), 2, "input() consistently returns a string (str)."),
        ("q_pre_5", "pre_test", "mod_5", "Which keyword is used in Python for an alternative condition branch?", json.dumps(["else if", "elif", "elseif", "case"]), 1, "Python uses 'elif' for else-if ladders."),
        ("q_pre_6", "pre_test", "mod_6", "What is the first number generated by range(5)?", json.dumps(["1", "0", "5", "-1"]), 1, "range(5) starts at 0 by default."),
        ("q_pre_7", "pre_test", "mod_7", "Which keyword is used to send a value back from a function?", json.dumps(["send", "output", "return", "yield_result"]), 2, "The 'return' keyword passes data back to the caller."),
        ("q_pre_8", "pre_test", "mod_8", "If colors = ['red', 'green', 'blue'], what is colors[1]?", json.dumps(["'red'", "'green'", "'blue'", "IndexError"]), 1, "Index 1 points to the second element ('green')."),
        ("q_pre_9", "pre_test", "mod_9", "What error occurs when accessing a non-existent key directly via dict[key]?", json.dumps(["IndexError", "TypeError", "KeyError", "NameError"]), 2, "Accessing an unregistered dictionary key triggers KeyError."),
        ("q_pre_10", "pre_test", "mod_10", "When designing a function, what is the best strategy?", json.dumps(["Write all code on one line", "Decompose into inputs, steps, and return value", "Ignore edge cases", "Use global variables everywhere"]), 1, "Problem decomposition simplifies algorithm structure and testing.")
    ]
    c.executemany("INSERT INTO assessment_questions VALUES (?,?,?,?,?,?,?)", pre_questions)

    # 10 Parallel Post-test questions (assessing same 10 competencies with parallel variations)
    post_questions = [
        ("q_post_1", "post_test", "mod_1", "Which of the following creates a valid comment in Python?", json.dumps(["// Note", "/* Note */", "# Note", "<!-- Note -->"]), 2, "The hash '#' introduces single-line comments in Python."),
        ("q_post_2", "post_test", "mod_2", "What is the type of variable x after x = True?", json.dumps(["str", "bool", "int", "NoneType"]), 1, "True and False are of type bool."),
        ("q_post_3", "post_test", "mod_3", "What is the result of 14 % 4?", json.dumps(["3", "2", "3.5", "0"]), 1, "14 divided by 4 leaves a remainder of 2."),
        ("q_post_4", "post_test", "mod_4", "Which syntax formats variables into strings dynamically?", json.dumps(["f'Result: {val}'", "'Result: {val}'", "format(val)", "print_f(val)"]), 0, "f'Result: {val}' is the f-string syntax."),
        ("q_post_5", "post_test", "mod_5", "What character is required at the end of an 'if condition' line?", json.dumps(["; (semicolon)", ": (colon)", "{ (brace)", "THEN"]), 1, "Python header statements require a colon ':' at the end."),
        ("q_post_6", "post_test", "mod_6", "How many times will a loop with 'for i in range(1, 4):' execute?", json.dumps(["4 times", "3 times", "2 times", "5 times"]), 1, "It iterates for i = 1, 2, 3 (3 times total)."),
        ("q_post_7", "post_test", "mod_7", "What is the difference between print() and return?", json.dumps(["They are identical", "print() outputs to screen; return provides value to caller", "return prints text to console", "print() can only be called in main"]), 1, "print() displays text; return sends a value back for further computation."),
        ("q_post_8", "post_test", "mod_8", "What list method adds a single element to the end of a list?", json.dumps(["add()", "push()", "append()", "insert_end()"]), 2, "list.append() appends to the end."),
        ("q_post_9", "post_test", "mod_9", "How can you safely retrieve a dictionary value without risking a KeyError?", json.dumps(["dict.safe()", "dict.get(key, default)", "dict.pop(key)", "dict.find(key)"]), 1, "dict.get(key, default) returns default if the key is missing."),
        ("q_post_10", "post_test", "mod_10", "In FizzBuzz, why must divisibility by 15 be tested before 3 or 5?", json.dumps(["15 is a smaller number", "A number divisible by 15 would trigger the 3 or 5 branch early", "Python requires descending checks", "It does not matter"]), 1, "Testing 3 first would falsely classify 15 as just 'Fizz' instead of 'FizzBuzz'.")
    ]
    c.executemany("INSERT INTO assessment_questions VALUES (?,?,?,?,?,?,?)", post_questions)

    # 6. Seed a sample learning attempt for student_demo to demonstrate dashboard visualizations immediately
    c.execute("""
    INSERT INTO student_attempts VALUES (
        'att_seed_1', 'usr_student1', 'ex_m1_1', 'mod_1',
        'print("Welcome to Python Programming!")',
        100.0, 2, 2, 1, 1, 'success', NULL,
        'Outstanding! All test cases passed successfully.',
        0, 0, 45, '2026-10-12T17:35:00Z'
    )
    """)
    c.execute("""
    INSERT INTO attempt_test_results VALUES
    ('atr_1', 'att_seed_1', 'tc_m1_1_1', 1, 'Welcome to Python Programming!', 'Welcome to Python Programming!', NULL, 18.2, 0),
    ('atr_2', 'att_seed_1', 'tc_m1_1_2', 1, '[Hidden Test Output]', '[Hidden]', NULL, 16.5, 1)
    """)
    c.execute("""
    INSERT INTO student_mastery VALUES (
        'usr_student1', 'mod_1', 100.0, 'provisional_mastery', 2, 2, 1,
        '2026-10-12T17:35:00Z', '2026-10-12T17:35:00Z'
    )
    """)
    c.execute("""
    INSERT INTO lesson_completions VALUES ('usr_student1', 'les_m1', 'mod_1', '2026-10-12T17:33:00Z')
    """)

    # Initial recommendation for student_demo
    c.execute("""
    INSERT INTO recommendations (
        id, student_id, rule_name, rule_code, target_type, target_id, target_title, reason, is_completed, learner_response, responded_at, created_at
    ) VALUES (
        'rec_seed_1', 'usr_student1', 'RULE 6: Provisional mastery advancement',
        'RULE_6', 'lesson', 'les_m2', 'Module 2: Variables and Data Types',
        'You have provisionally mastered Introduction to Python (100%). Proceed to Variables and Data Types.',
        0, NULL, NULL, '2026-10-12T17:35:01Z'
    )
    """)

    conn.commit()
    conn.close()

if __name__ == "__main__":
    seed()
    print("Curriculum and seed data successfully written to SQLite database.")
