
/* ==========================================
   UNIFORM TRACKER - COMMANDER MANAGEMENT
========================================== */

const currentUser = JSON.parse(localStorage.getItem("currentUser"));

if (!currentUser || currentUser.role !== "officer") {
    window.location.href = "index.html";
}

const STORAGE_KEY = "commanders";

function getCommanders() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
}

function saveCommanders(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// HTML ELEMENTS
const commanderForm = document.getElementById("commanderForm");
const commanderId = document.getElementById("commanderId");
const commanderName = document.getElementById("commanderName");
const company = document.getElementById("company");
const commanderStatus = document.getElementById("commanderStatus");
const editIndex = document.getElementById("editIndex");

const commanderTableBody = document.getElementById("commanderTableBody");
const searchCommander = document.getElementById("searchCommander");
const commanderMessage = document.getElementById("commanderMessage");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const saveCommanderBtn = document.getElementById("saveCommanderBtn");

const usernameDisplay = document.getElementById("usernameDisplay");
const roleDisplay = document.getElementById("roleDisplay");
const logoutBtn = document.getElementById("logoutBtn");

usernameDisplay.textContent = currentUser.username;
roleDisplay.textContent = "Officer";

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

function showMessage(message, type = "success") {
    commanderMessage.hidden = false;
    commanderMessage.className = `alert alert-${type} mt-3`;
    commanderMessage.textContent = message;
}

function clearMessage() {
    commanderMessage.hidden = true;
    commanderMessage.textContent = "";
}

function resetForm() {
    commanderForm.reset();
    editIndex.value = "";
    commanderId.disabled = false;
    commanderStatus.value = "Active";

    saveCommanderBtn.innerHTML =
        '<i class="bi bi-save me-2"></i>Save Commander';
}

function renderCommanders(searchText = "") {
    const search = searchText.toLowerCase();

    const filtered = getCommanders().filter(item =>
        String(item.commanderId).toLowerCase().includes(search) ||
        String(item.name).toLowerCase().includes(search) ||
        String(item.company).toLowerCase().includes(search)
    );

    if (!filtered.length) {
        commanderTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-secondary py-4">
                    No Commander records found.
                </td>
            </tr>`;
        return;
    }

    commanderTableBody.innerHTML = filtered.map((item, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${escapeHTML(item.commanderId)}</td>
            <td>${escapeHTML(item.name)}</td>
            <td>${escapeHTML(item.company)}</td>
            <td>
                <span class="status-badge ${
                    item.status === "Active" ? "status-active" : "status-inactive"
                }">
                    ${escapeHTML(item.status)}
                </span>
                <br>
                <small class="text-secondary">
                    ${item.password ? "Password Set" : "Password Pending"}
                </small>
            </td>
            <td>
                <button class="btn btn-sm btn-warning me-1"
                    data-action="edit" data-id="${escapeHTML(item.commanderId)}"
                    title="Edit">
                    <i class="bi bi-pencil-square"></i>
                </button>

                <button class="btn btn-sm btn-info me-1"
                    data-action="reset" data-id="${escapeHTML(item.commanderId)}"
                    title="Reset Password">
                    <i class="bi bi-key"></i>
                </button>

                <button class="btn btn-sm btn-danger"
                    data-action="delete" data-id="${escapeHTML(item.commanderId)}"
                    title="Delete">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        </tr>
    `).join("");
}

// ADD / UPDATE COMMANDER
commanderForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const id = commanderId.value.trim();
    const name = commanderName.value.trim();
    const selectedCompany = company.value;
    const status = commanderStatus.value;

    if (!/^\d{10}$/.test(id)) {
        showMessage("Commander ID must contain exactly 10 digits.", "danger");
        return;
    }

    if (!name || !selectedCompany) {
        showMessage("Please complete all required fields.", "danger");
        return;
    }

    const commanders = getCommanders();
    const editingId = editIndex.value;

    if (!editingId) {
        if (commanders.some(item => String(item.commanderId) === id)) {
            showMessage("This Commander ID already exists.", "danger");
            return;
        }

        commanders.push({
            commanderId: id,
            username: id,
            name,
            company: selectedCompany,
            password: "",
            mustSetPassword: true,
            status
        });

        saveCommanders(commanders);
        renderCommanders(searchCommander.value);
        resetForm();
        showMessage("Commander account created. Commander must set their own password.");
        return;
    }

    const index = commanders.findIndex(
        item => String(item.commanderId) === String(editingId)
    );

    if (index === -1) {
        showMessage("Commander record could not be found.", "danger");
        return;
    }

    commanders[index].name = name;
    commanders[index].company = selectedCompany;
    commanders[index].status = status;

    saveCommanders(commanders);
    renderCommanders(searchCommander.value);
    resetForm();
    showMessage("Commander information successfully updated.");
});

// EDIT COMMANDER
function editCommander(id) {
    const item = getCommanders().find(
        commander => String(commander.commanderId) === String(id)
    );

    if (!item) return;

    commanderId.value = item.commanderId;
    commanderName.value = item.name;
    company.value = item.company;
    commanderStatus.value = item.status;

    commanderId.disabled = true;
    editIndex.value = item.commanderId;

    saveCommanderBtn.innerHTML =
        '<i class="bi bi-pencil-square me-2"></i>Update Commander';

    clearMessage();
    window.scrollTo({ top: 0, behavior: "smooth" });
}

// RESET COMMANDER PASSWORD
function resetCommanderPassword(id) {
    if (!confirm("Reset this Commander's password? They must set a new password at next login.")) {
        return;
    }

    const commanders = getCommanders();
    const item = commanders.find(
        commander => String(commander.commanderId) === String(id)
    );

    if (!item) return;

    item.password = "";
    item.mustSetPassword = true;

    saveCommanders(commanders);
    renderCommanders(searchCommander.value);

    showMessage("Password reset. Commander must set a new password at next login.");
}

// DELETE COMMANDER
function deleteCommander(id) {
    if (!confirm("Are you sure you want to delete this Commander account?")) {
        return;
    }

    const commanders = getCommanders();
    const updated = commanders.filter(
        item => String(item.commanderId) !== String(id)
    );

    saveCommanders(updated);
    renderCommanders(searchCommander.value);
    resetForm();

    showMessage("Commander account successfully deleted.");
}

// TABLE ACTIONS
commanderTableBody.addEventListener("click", function(event) {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const id = button.dataset.id;

    if (button.dataset.action === "edit") editCommander(id);
    if (button.dataset.action === "reset") resetCommanderPassword(id);
    if (button.dataset.action === "delete") deleteCommander(id);
});

searchCommander.addEventListener("input", function() {
    renderCommanders(this.value);
});

cancelEditBtn.addEventListener("click", function() {
    resetForm();
    clearMessage();
});

logoutBtn.addEventListener("click", function(event) {
    event.preventDefault();

    if (confirm("Are you sure you want to logout?")) {
        localStorage.removeItem("currentUser");
        window.location.href = "index.html";
    }
});

renderCommanders();
