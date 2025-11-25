import pkgutil
import importlib.util

# --- Патч для Python 3.14: добавляем get_loader (нужно Flask) ---
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

app = Flask(__name__)
CORS(app)

DB_PATH = "database.db"


# -------------------------------------------------------------------
#   INIT DATABASE (с нуля)
# -------------------------------------------------------------------
def init_db():
    """Создаёт базу, если её нет, и накатывает миграцию."""
    if not os.path.exists(DB_PATH):
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        with open("migrations/001_init.sql", "r", encoding="utf-8") as f:
            cursor.executescript(f.read())

        conn.commit()
        conn.close()


init_db()


# -------------------------------------------------------------------
#   HELPERS
# -------------------------------------------------------------------
def query_db(query, args=(), one=False):
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute(query, args)
    rv = cur.fetchall()
    conn.commit()
    conn.close()
    return (rv[0] if rv else None) if one else rv


# -------------------------------------------------------------------
#   API ENDPOINTS
# -------------------------------------------------------------------

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
            "category": r[5],
            "priority": r[6],
        }
        for r in rows
    ]
    return jsonify(tasks), 200


@app.route("/tasks/<int:task_id>", methods=["GET"])
def get_task(task_id):
    r = query_db("SELECT * FROM tasks WHERE id = ?", (task_id,), one=True)
    if not r:
        return jsonify({"error": "Task not found"}), 404

    task = {
        "id": r[0],
        "title": r[1],
        "description": r[2],
        "due_date": r[3],
        "status": r[4],
        "category": r[5],
        "priority": r[6],
    }
    return jsonify(task), 200


@app.route("/tasks", methods=["POST"])
def create_task():
    data = request.get_json() or {}

    if not data.get("title"):
        return jsonify({"error": "Title is required"}), 400

    query_db(
        """
        INSERT INTO tasks (title, description, due_date, status, category, priority)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (
            data["title"],
            data.get("description"),
            data.get("due_date"),
            data.get("status", "todo"),
            data.get("category", "general"),
            data.get("priority", "medium")
        ),
    )

    return jsonify({"message": "Task created"}), 201


@app.route("/tasks/<int:task_id>", methods=["PUT"])
def update_task(task_id):
    r = query_db("SELECT * FROM tasks WHERE id = ?", (task_id,), one=True)
    if not r:
        return jsonify({"error": "Task not found"}), 404

    data = request.get_json() or {}

    query_db(
        """
        UPDATE tasks
        SET title=?, description=?, due_date=?, status=?, category=?, priority=?
        WHERE id=?
        """,
        (
            data.get("title", r[1]),
            data.get("description", r[2]),
            data.get("due_date", r[3]),
            data.get("status", r[4]),
            data.get("category", r[5]),
            data.get("priority", r[6]),
            task_id,
        ),
    )

    return jsonify({"message": "Updated"}), 200


@app.route("/tasks/<int:task_id>", methods=["DELETE"])
def delete_task(task_id):
    query_db("DELETE FROM tasks WHERE id=?", (task_id,))
    return jsonify({"message": "Deleted"}), 200


# -------------------------------------------------------------------
#   FRONTEND ROUTE
# -------------------------------------------------------------------
@app.route("/")
def index():
    return render_template("index.html")


# -------------------------------------------------------------------
#   RUN
# -------------------------------------------------------------------
if __name__ == "__main__":
    app.run(debug=True)
