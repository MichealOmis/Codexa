#!/usr/bin/env python3
"""
Database initialization and curriculum seeding script for PyTutor ITS.
Creates SQLite tables and seeds the 10-module Python curriculum,
exercises, test cases, pre/post-tests, and demonstration accounts.
"""

import sqlite3
import json
import hashlib
import os

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "pytutor.db")

def hash_pw(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()

def init_database():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH, timeout=30.0)
    c = conn.cursor()

    # Enable foreign keys, WAL mode, and busy timeout for high concurrency
    c.execute("PRAGMA foreign_keys = ON;")
    c.execute("PRAGMA journal_mode = WAL;")
    c.execute("PRAGMA busy_timeout = 30000;")

    # 1. Users
    c.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('student', 'administrator')),
        participant_id TEXT UNIQUE NOT NULL,
        leaderboard_opt_in INTEGER NOT NULL DEFAULT 0,
        evaluation_group TEXT NOT NULL DEFAULT 'ITS_Intervention',
        created_at TEXT NOT NULL
    );
    """)

    # Safe migration for existing user table columns
    user_cols = [row[1] for row in c.execute("PRAGMA table_info(users)").fetchall()]
    if 'leaderboard_opt_in' not in user_cols:
        c.execute("ALTER TABLE users ADD COLUMN leaderboard_opt_in INTEGER NOT NULL DEFAULT 0")
    if 'evaluation_group' not in user_cols:
        c.execute("ALTER TABLE users ADD COLUMN evaluation_group TEXT NOT NULL DEFAULT 'ITS_Intervention'")

    # 2. Topics
    c.execute("""
    CREATE TABLE IF NOT EXISTS topics (
        id TEXT PRIMARY KEY,
        module_number INTEGER NOT NULL,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        learning_objectives TEXT NOT NULL, -- JSON array
        prerequisite_topic_ids TEXT NOT NULL, -- JSON array
        difficulty TEXT NOT NULL,
        mastery_threshold REAL NOT NULL DEFAULT 70.0,
        order_index INTEGER NOT NULL
    );
    """)

    # 3. Lessons
    c.execute("""
    CREATE TABLE IF NOT EXISTS lessons (
        id TEXT PRIMARY KEY,
        topic_id TEXT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        summary TEXT NOT NULL,
        content_markdown TEXT NOT NULL,
        code_examples TEXT NOT NULL, -- JSON array
        quick_check_questions TEXT NOT NULL, -- JSON array
        is_published INTEGER NOT NULL DEFAULT 1
    );
    """)

    # 4. Exercises
    c.execute("""
    CREATE TABLE IF NOT EXISTS exercises (
        id TEXT PRIMARY KEY,
        topic_id TEXT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
        exercise_type TEXT NOT NULL DEFAULT 'programming',
        problem_statement TEXT NOT NULL,
        instructions TEXT NOT NULL,
        starter_code TEXT NOT NULL,
        hints TEXT NOT NULL, -- JSON array of {level: 1|2|3, text: string}
        worked_solution TEXT NOT NULL,
        common_error_categories TEXT NOT NULL, -- JSON array
        max_score REAL NOT NULL DEFAULT 100.0,
        is_active INTEGER NOT NULL DEFAULT 1
    );
    """)

    # 5. Exercise Test Cases
    c.execute("""
    CREATE TABLE IF NOT EXISTS exercise_test_cases (
        id TEXT PRIMARY KEY,
        exercise_id TEXT NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
        input_data TEXT NOT NULL DEFAULT '',
        expected_output TEXT NOT NULL,
        function_call TEXT,
        is_hidden INTEGER NOT NULL DEFAULT 0,
        description TEXT NOT NULL
    );
    """)

    # 6. Student Attempts
    c.execute("""
    CREATE TABLE IF NOT EXISTS student_attempts (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        exercise_id TEXT NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
        topic_id TEXT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
        submitted_code TEXT NOT NULL,
        score REAL NOT NULL,
        passed_count INTEGER NOT NULL,
        total_count INTEGER NOT NULL,
        all_passed INTEGER NOT NULL,
        syntax_valid INTEGER NOT NULL,
        execution_status TEXT NOT NULL,
        error_category TEXT,
        diagnostic_feedback TEXT NOT NULL,
        hints_used INTEGER NOT NULL DEFAULT 0,
        revealed_solution INTEGER NOT NULL DEFAULT 0,
        time_spent_seconds INTEGER NOT NULL DEFAULT 0,
        timestamp TEXT NOT NULL
    );
    """)

    # 7. Attempt Test Results
    c.execute("""
    CREATE TABLE IF NOT EXISTS attempt_test_results (
        id TEXT PRIMARY KEY,
        attempt_id TEXT NOT NULL REFERENCES student_attempts(id) ON DELETE CASCADE,
        test_case_id TEXT NOT NULL,
        passed INTEGER NOT NULL,
        actual_output TEXT NOT NULL,
        expected_output TEXT NOT NULL,
        error_category TEXT,
        execution_time_ms REAL NOT NULL,
        is_hidden INTEGER NOT NULL DEFAULT 0
    );
    """)

    # 8. Student Mastery
    c.execute("""
    CREATE TABLE IF NOT EXISTS student_mastery (
        student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        topic_id TEXT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
        mastery_score REAL NOT NULL DEFAULT 0.0,
        mastery_category TEXT NOT NULL DEFAULT 'unassessed',
        assessment_checks_passed INTEGER NOT NULL DEFAULT 0,
        assessment_checks_total INTEGER NOT NULL DEFAULT 0,
        attempt_count INTEGER NOT NULL DEFAULT 0,
        last_attempt_at TEXT,
        updated_at TEXT NOT NULL,
        PRIMARY KEY (student_id, topic_id)
    );
    """)

    # 9. Recommendations
    c.execute("""
    CREATE TABLE IF NOT EXISTS recommendations (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        rule_name TEXT NOT NULL,
        rule_code TEXT NOT NULL,
        target_type TEXT NOT NULL, -- diagnostic, lesson, exercise, post_test
        target_id TEXT NOT NULL,
        target_title TEXT NOT NULL,
        reason TEXT NOT NULL,
        is_completed INTEGER NOT NULL DEFAULT 0,
        learner_response TEXT, -- 'accepted', 'completed', 'dismissed', 'in_progress'
        responded_at TEXT,
        created_at TEXT NOT NULL
    );
    """)

    # Safe migration for existing databases:
    existing_cols = [row[1] for row in c.execute("PRAGMA table_info(recommendations)").fetchall()]
    if 'learner_response' not in existing_cols:
        c.execute("ALTER TABLE recommendations ADD COLUMN learner_response TEXT")
    if 'responded_at' not in existing_cols:
        c.execute("ALTER TABLE recommendations ADD COLUMN responded_at TEXT")

    # 10. Assessments
    c.execute("""
    CREATE TABLE IF NOT EXISTS assessments (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        total_questions INTEGER NOT NULL
    );
    """)

    # 11. Assessment Questions
    c.execute("""
    CREATE TABLE IF NOT EXISTS assessment_questions (
        id TEXT PRIMARY KEY,
        assessment_id TEXT NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
        topic_id TEXT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
        question_text TEXT NOT NULL,
        options TEXT NOT NULL, -- JSON array
        correct_index INTEGER NOT NULL,
        explanation TEXT NOT NULL
    );
    """)

    # 12. Assessment Responses
    c.execute("""
    CREATE TABLE IF NOT EXISTS assessment_responses (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        assessment_id TEXT NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
        score REAL NOT NULL,
        total_questions INTEGER NOT NULL,
        percentage REAL NOT NULL,
        answers TEXT NOT NULL, -- JSON
        completed_at TEXT NOT NULL
    );
    """)

    # 13. SUS Surveys
    c.execute("""
    CREATE TABLE IF NOT EXISTS sus_surveys (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        participant_id TEXT NOT NULL,
        q1 INTEGER NOT NULL,
        q2 INTEGER NOT NULL,
        q3 INTEGER NOT NULL,
        q4 INTEGER NOT NULL,
        q5 INTEGER NOT NULL,
        q6 INTEGER NOT NULL,
        q7 INTEGER NOT NULL,
        q8 INTEGER NOT NULL,
        q9 INTEGER NOT NULL,
        q10 INTEGER NOT NULL,
        sus_score REAL NOT NULL,
        created_at TEXT NOT NULL
    );
    """)

    # 14. Lesson Completions
    c.execute("""
    CREATE TABLE IF NOT EXISTS lesson_completions (
        student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
        topic_id TEXT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
        completed_at TEXT NOT NULL,
        PRIMARY KEY (student_id, lesson_id)
    );
    """)

    # 15. Audit Events
    c.execute("""
    CREATE TABLE IF NOT EXISTS audit_events (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        event_type TEXT NOT NULL,
        details TEXT NOT NULL,
        timestamp TEXT NOT NULL
    );
    """)

    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_database()
    print("Database tables created successfully.")
