const API = "/tasks";

// DOM Elements
const taskList = document.getElementById("task-list");
const emptyState = document.getElementById("empty-state");
const statusFilter = document.getElementById("status-filter");

// Form elements
const form = document.getElementById("task-form");
const formTitle = document.getElementById("form-title");
const idInput = document.getElementById("task-id");

const titleInput = document.getElementById("title");
const descInput = document.getElementById("description");
const statusInput = document.getElementById("status");
const categoryInput = document.getElementById("category");
const priorityInput = document.getElementById("priority");
const dueDateInput = document.getElementById("due_date");

const errorsBox = document.getElementById("form-errors");
const saveBtn = document.getElementById("save-btn");
const cancelEditBtn = document.getElementById("cancel-edit-btn");
const newTaskBtn = document.getElementById("new-task-btn");

let tasks = [];


// -----------------------------------------------------------
// HELPER FUNCTIONS
// -----------------------------------------------------------

function resetForm() {
  idInput.value = "";
  titleInput.value = "";
  descInput.value = "";
  statusInput.value = "todo";
  categoryInput.value = "general";
  priorityInput.value = "medium";
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
  categoryInput.value = task.category || "general";
  priorityInput.value = task.priority || "medium";
  dueDateInput.value = task.due_date || "";
  errorsBox.textContent = "";
  formTitle.textContent = "Edit task";
  saveBtn.textContent = "Update task";
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function formatDueDate(date) {
  if (!date) return "No due date";
  const d = new Date(date);
  if (isNaN(d.getTime())) return date;
  return d.toLocaleDateString();
}


// CATEGORY pills
function categoryClass(cat) {
  switch (cat) {
    case "work": return "pill cat-work";
    case "study": return "pill cat-study";
    case "home": return "pill cat-home";
    case "hobby": return "pill cat-hobby";
    case "sport": return "pill cat-sport";
    case "other": return "pill cat-other";
    default: return "pill cat-general";
  }
}

function categoryLabel(cat) {
  return {
    general: "General",
    work: "Work",
    study: "Study",
    home: "Home",
    hobby: "Hobby",
    sport: "Sport",
    other: "Other",
  }[cat] || "General";
}


// PRIORITY pills
function priorityClass(p) {
  switch (p) {
    case "high": return "pill pr-high";
    case "medium": return "pill pr-medium";
    case "low": return "pill pr-low";
    default: return "pill pr-medium";
  }
}

function priorityLabel(p) {
  return {
    high: "High",
    medium: "Medium",
    low: "Low",
  }[p] || "Medium";
}


// STATUS pills
function statusClass(status) {
  switch (status) {
    case "done": return "status-pill done";
    case "in_progress": return "status-pill in-progress";
    default: return "status-pill todo";
  }
}

function statusLabel(status) {
  switch (status) {
    case "done": return "Done";
    case "in_progress": return "In progress";
    default: return "Todo";
  }
}


// -----------------------------------------------------------
// RENDER TASK LIST
// -----------------------------------------------------------

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
          <span class="${statusClass(task.status)}">${statusLabel(task.status)}</span>
        </div>

        <div class="task-meta">
          <span>${escapeHtml(task.description || "No description")}</span>
        </div>

        <div class="task-meta tags-row">
          <span class="${categoryClass(task.category)}">${categoryLabel(task.category)}</span>
          <span class="${priorityClass(task.priority)}">${priorityLabel(task.priority)}</span>
        </div>

        <div class="task-meta">
          <span class="meta-pill">Due: ${formatDueDate(task.due_date)}</span>
          <span class="meta-id">#${task.id}</span>
        </div>

      </div>

      <div class="task-actions">
        <button class="icon-btn" data-action="edit">✏️</button>
        <button class="icon-btn danger" data-action="delete">🗑</button>
      </div>
    `;

    row.querySelector('[data-action="edit"]').onclick = () => fillForm(task);
    row.querySelector('[data-action="delete"]').onclick = () => handleDelete(task.id);

    taskList.appendChild(row);
  });
}


// -----------------------------------------------------------
// API CALLS
// -----------------------------------------------------------

async function loadTasks() {
  const res = await fetch(API);
  tasks = await res.json();
  renderTasks();
}

async function handleDelete(id) {
  if (!confirm(`Delete task #${id}?`)) return;

  const res = await fetch(`${API}/${id}`, { method: "DELETE" });
  if (res.ok) {
    tasks = tasks.filter(t => t.id !== id);
    renderTasks();
  }
}


// -----------------------------------------------------------
// FORM SUBMIT HANDLER
// -----------------------------------------------------------

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorsBox.textContent = "";

  const payload = {
    title: titleInput.value.trim(),
    description: descInput.value.trim() || null,
    status: statusInput.value,
    category: categoryInput.value,
    priority: priorityInput.value,
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
    const data = await res.json().catch(() => null);
    errorsBox.textContent = data?.error || "Validation error";
    return;
  }

  resetForm();
  await loadTasks();
});


// -----------------------------------------------------------
// UI EVENTS
// -----------------------------------------------------------

cancelEditBtn.onclick = resetForm;

newTaskBtn.onclick = () => {
  resetForm();
  titleInput.focus();
};

statusFilter.onchange = renderTasks;


// -----------------------------------------------------------
// INITIAL LOAD
// -----------------------------------------------------------

loadTasks();
resetForm();
