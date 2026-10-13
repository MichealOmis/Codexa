#!/usr/bin/env python3
"""
PyTutor Database Bridge: Parameterized SQLite operations runner for Node/Express.
Handles safe query execution, transactions, and JSON data transformations.
"""

import sys
import os
import json
import sqlite3

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "pytutor.db")

def get_connection():
    conn = sqlite3.connect(DB_PATH, timeout=30.0)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    conn.execute("PRAGMA journal_mode = WAL;")
    conn.execute("PRAGMA busy_timeout = 30000;")
    return conn

def handle_request(req):
    action = req.get("action")
    conn = get_connection()
    try:
        if action == "query":
            sql = req.get("sql")
            params = req.get("params", [])
            cursor = conn.cursor()
            cursor.execute(sql, params)
            rows = [dict(r) for r in cursor.fetchall()]
            return {"status": "ok", "rows": rows}

        elif action == "execute":
            sql = req.get("sql")
            params = req.get("params", [])
            cursor = conn.cursor()
            cursor.execute(sql, params)
            conn.commit()
            return {"status": "ok", "changes": cursor.rowcount, "lastrowid": cursor.lastrowid}

        elif action == "transaction":
            statements = req.get("statements", [])
            cursor = conn.cursor()
            for stmt in statements:
                sql = stmt.get("sql")
                params = stmt.get("params", [])
                cursor.execute(sql, params)
            conn.commit()
            return {"status": "ok"}

        elif action == "reset_seed":
            import seed_curriculum
            seed_curriculum.seed()
            return {"status": "ok", "message": "Database successfully reset to pristine seed state"}

        else:
            return {"status": "error", "message": f"Unknown action '{action}'"}

    except Exception as e:
        return {"status": "error", "message": str(e)}
    finally:
        conn.close()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        raw_input = sys.stdin.read()
    else:
        raw_input = sys.argv[1]
    
    try:
        req = json.loads(raw_input)
        res = handle_request(req)
        print(json.dumps(res))
    except Exception as ex:
        print(json.dumps({"status": "error", "message": str(ex)}))
