DROP TABLE IF EXISTS tasks;

CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    due_date TEXT,
    status TEXT DEFAULT 'todo',
    category TEXT DEFAULT 'general',
    priority TEXT DEFAULT 'medium'
);
