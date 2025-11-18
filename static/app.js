const API = "/tasks";

const taskList = document.getElementById("task-list");
const emptyState = document.getElementById("empty-state");
const statusFilter = document.getElementById("status-filter");

const form = document.getElementById("task-form");
const formTitle = document.getElementById("form-title");
const idInput = document.getElementById("task-id");
const titleInput = document.getElementById("title");
const descInput = document.getElementById("description");
const statusInput = document.getElementById("status");
const dueDateInput = document.getElementById("due_date");
const errorsBox = document.getElementById("form-errors");
const saveBtn = document.getElementById("save-btn");
const cancelEditBtn = document.getElementById("cancel-edit-btn");
const newTaskBtn = document.getElementById("new-task-btn");

let tasks = [];

// ----------- Helpers -----------

function resetForm() {
  idInput.value = "";
  titleInput.value = "";
  descInput.value = "";
  statusInput.value = "todo";
  dueDateInput.value = "";
  errorsBox.textContent = "";
  formTitle.textContent = "New task";
  saveBtn.textContent = "Save task";
}

function fillForm(task) {
  idInput.value = task.id;
  titleInput.value = task.title;
  descInput.value = task.description || "";
  statusInput.value = task.status || "todo";
  dueDateInput.value = task.due_date || "";
  errorsBox.textContent = "";
  formTitle.textContent = "Edit task";
  saveBtn.textContent = "Update task";
}

function formatDueDate(iso) {
  if (!iso) return "No due date";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString();
  } catch {
    return iso;
  }
}

function statusClass(status) {
  switch (status) {
    case "done":
      return "status-pill done";
    case "in_progress":
      return "status-pill in-progress";
    default:
      return "status-pill todo";
  }
}

function statusLabel(status) {
  switch (status) {
    case "done":
      return "Done";
    case "in_progress":
      return "In progress";
    default:
      return "Todo";
  }
}

// ----------- Rendering -----------

function renderTasks() {
  const filter = statusFilter.value;
  const visible = tasks.filter(t =>
    filter === "all" ? true : (t.status || "todo") === filter
  );

  taskList.innerHTML = "";
  if (visible.length === 0) {
    emptyState.style.display = "flex";
    return;
  }

  emptyState.style.display = "none";

  visible.forEach(task => {
    const row = document.createElement("div");
    row.className = "task-row";

    row.innerHTML = `
      <div class="task-main">
        <div class="task-title-row">
          <span class="task-title">${escapeHtml(task.title)}</span>
          <span class="${statusClass(task.status)}">
            ${statusLabel(task.status)}
          </span>
        </div>
        <div class="task-meta">
          <span>${escapeHtml(task.description || "No description")}</span>
        </div>
        <div class="task-meta">
          <span class="meta-pill">Due: ${formatDueDate(task.due_date)}</span>
          <span class="meta-id">#${task.id}</span>
        </div>
      </div>
      <div class="task-actions">
        <button class="icon-btn" data-action="edit" title="Edit task">
          ✏️
        </button>
        <button class="icon-btn danger" data-action="delete" title="Delete task">
          🗑
        </button>
      </div>
    `;

    const editBtn = row.querySelector('[data-action="edit"]');
    const deleteBtn = row.querySelector('[data-action="delete"]');

    editBtn.addEventListener("click", () => fillForm(task));
    deleteBtn.addEventListener("click", () => handleDelete(task.id));

    taskList.appendChild(row);
  });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// ----------- API calls -----------

async function loadTasks() {
  const res = await fetch(API);
  if (!res.ok) {
    console.error("Failed to load tasks", res.statusText);
    return;
  }
  tasks = await res.json();
  renderTasks();
}

async function handleDelete(id) {
  if (!confirm(`Delete task #${id}?`)) return;
  const res = await fetch(`${API}/${id}`, { method: "DELETE" });
  if (!res.ok) {
    alert("Failed to delete task");
    return;
  }
  tasks = tasks.filter(t => t.id !== id);
  renderTasks();
}

// ----------- Form events -----------

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorsBox.textContent = "";

  const payload = {
    title: titleInput.value.trim(),
    description: descInput.value.trim() || null,
    status: statusInput.value,
    due_date: dueDateInput.value || null,
  };

  const id = idInput.value;
  const method = id ? "PUT" : "POST";
  const url = id ? `${API}/${id}` : API;

  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let msg = "Validation error";
    try {
      const data = await res.json();
      if (data.error) msg = data.error;
      if (data.errors) msg = JSON.stringify(data.errors);
    } catch (_) {}
    errorsBox.textContent = msg;
    return;
  }

  // обновим список с сервера, чтобы не думать о локальном состоянии
  resetForm();
  await loadTasks();
});

cancelEditBtn.addEventListener("click", (e) => {
  e.preventDefault();
  resetForm();
});

newTaskBtn.addEventListener("click", () => {
  resetForm();
  titleInput.focus();
});

statusFilter.addEventListener("change", renderTasks);

// ----------- Initial load -----------

loadTasks();
resetForm();
