import pkgutil
import importlib.util

# --- Patch for Python 3.14 ---
if not hasattr(pkgutil, "get_loader"):
    def get_loader(name):
        try:
            return importlib.util.find_spec(name)
        except Exception:
            return None
    pkgutil.get_loader = get_loader

from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import sqlite3
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)

DB_PATH = "database.db"


# ---------- INIT DB ----------
def init_db():
    if not os.path.exists(DB_PATH):
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        with open("migrations/001_init.sql", "r", encoding="utf-8") as f:
            cursor.executescript(f.read())

        conn.commit()
        conn.close()

init_db()


# ---------- DB Helper ----------
def query_db(query, args=(), one=False):
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute(query, args)
    rows = cur.fetchall()
    conn.commit()
    conn.close()
    return (rows[0] if rows else None) if one else rows


# ---------- API ----------
@app.route("/tasks", methods=["GET"])
def get_tasks():
    rows = query_db("SELECT * FROM tasks ORDER BY id DESC")
    tasks = [
        {
            "id": r[0],
            "title": r[1],
            "description": r[2],
            "due_date": r[3],
            "status": r[4],
            "priority": r[5],
            "category": r[6],
        }
        for r in rows
    ]
    return jsonify(tasks), 200


@app.route("/tasks/<int:task_id>", methods=["GET"])
def get_task(task_id):
    r = query_db("SELECT * FROM tasks WHERE id = ?", (task_id,), one=True)
    if not r:
        return jsonify({"error": "Task not found"}), 404

    return jsonify({
        "id": r[0],
        "title": r[1],
        "description": r[2],
        "due_date": r[3],
        "status": r[4],
        "priority": r[5],
        "category": r[6],
    }), 200


@app.route("/tasks", methods=["POST"])
def create_task():
    data = request.get_json() or {}

    if not data.get("title"):
        return jsonify({"error": "Title is required"}), 400

    query_db(
        """
        INSERT INTO tasks (title, description, due_date, status, priority, category)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (
            data["title"],
            data.get("description"),
            data.get("due_date"),
            data.get("status"),
            data.get("priority"),
            data.get("category"),
        ),
    )

    return jsonify({"message": "Task created"}), 201


@app.route("/tasks/<int:task_id>", methods=["PUT"])
def update_task(task_id):
    data = request.get_json() or {}
    r = query_db("SELECT * FROM tasks WHERE id = ?", (task_id,), one=True)

    if not r:
        return jsonify({"error": "Task not found"}), 404

    query_db(
        """
        UPDATE tasks
        SET title=?, description=?, due_date=?, status=?, priority=?, category=?
        WHERE id=?
        """,
        (
            data.get("title", r[1]),
            data.get("description", r[2]),
            data.get("due_date", r[3]),
            data.get("status", r[4]),
            data.get("priority", r[5]),
            data.get("category", r[6]),
            task_id,
        ),
    )

    return jsonify({"message": "Updated"}), 200


@app.route("/tasks/<int:task_id>", methods=["DELETE"])
def delete_task(task_id):
    query_db("DELETE FROM tasks WHERE id=?", (task_id,))
    return jsonify({"message": "Deleted"}), 200


# ---------- FRONTEND ----------
@app.route("/")
def index():
    return render_template("index.html")


if __name__ == "__main__":
    app.run(debug=True)
