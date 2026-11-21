
// ==========================================
// UNIFORM TRACKER - GRADES MANAGEMENT
// ==========================================

// Check logged-in user
const currentUser = JSON.parse(
    localStorage.getItem("currentUser")
);

if (!currentUser) {
    window.location.replace("index.html");
}

const isOfficer = currentUser?.role === "officer";
const isCommander = currentUser?.role === "commander";

if (!isOfficer && !isCommander) {
    localStorage.removeItem("currentUser");
    window.location.replace("index.html");
}

// LocalStorage
let commanders = JSON.parse(
    localStorage.getItem("commanders") || "[]"
);

let gradeRecords = JSON.parse(
    localStorage.getItem("gradeRecords") || "[]"
);

// HTML Elements
const gradeForm = document.getElementById("gradeForm");
const editIdInput = document.getElementById("gradeEditId");
const commanderSelect = document.getElementById("gradeCommander");
const assessmentInput = document.getElementById("gradeAssessment");
const dateInput = document.getElementById("gradeDate");
const marksInput = document.getElementById("gradeMarks");

const tableBody = document.getElementById("gradeTableBody");
const searchInput = document.getElementById("searchGrade");
const messageBox = document.getElementById("gradeMessage");

const formSection = document.getElementById("gradeFormSection");
const formTitle = document.getElementById("formTitle");
const saveButton = document.getElementById("saveGradeBtn");
const clearButton = document.getElementById("clearGradeBtn");
const actionHeader = document.getElementById("gradeActionHeader");


// ==========================================
// USER INFORMATION
// ==========================================

document.getElementById("usernameDisplay").textContent =
    currentUser.username;

document.getElementById("roleDisplay").textContent =
    currentUser.role.toUpperCase();


// ==========================================
// LOGOUT
// ==========================================

document.getElementById("logoutBtn").addEventListener("click", function () {
    localStorage.removeItem("currentUser");
    localStorage.removeItem("pendingCommanderId");

    window.location.replace("index.html");
});


// ==========================================
// SAVE DATA
// ==========================================

function saveGradeRecords() {
    localStorage.setItem(
        "gradeRecords",
        JSON.stringify(gradeRecords)
    );
}


// ==========================================
// MIGRATE OLD RECORDS
// ==========================================

function migrateGradeRecords() {

    let changed = false;

    gradeRecords = gradeRecords.map(record => {

        if (!record.id) {
            record.id = "GRD-" + Date.now() + "-" +
                Math.random().toString(36).slice(2, 7);

            changed = true;
        }

        if (!record.commanderId && record.memberId) {
            record.commanderId = record.memberId;
            changed = true;
        }

        return record;
    });

    if (changed) {
        saveGradeRecords();
    }
}

migrateGradeRecords();


// ==========================================
// ROLE-BASED INTERFACE
// ==========================================

if (isCommander) {

    formSection.style.display = "none";
    actionHeader.style.display = "none";

    document.getElementById("gradeTableDescription").textContent =
        "View your personal assessment records only.";

}


// ==========================================
// POPULATE COMMANDER DROPDOWN
// ==========================================

function populateCommanderDropdown() {

    commanderSelect.innerHTML =
        '<option value="">Select Commander</option>';

    commanders
        .filter(commander => commander.status === "Active")
        .forEach(commander => {

            const option = document.createElement("option");

            option.value = commander.commanderId;

            option.textContent =
                commander.name + " (" + commander.commanderId + ")";

            commanderSelect.appendChild(option);

        });
}

populateCommanderDropdown();


// ==========================================
// DEFAULT DATE
// ==========================================

function getTodayDate() {

    const today = new Date();

    return new Date(
        today.getTime() - today.getTimezoneOffset() * 60000
    ).toISOString().split("T")[0];

}

dateInput.value = getTodayDate();


// ==========================================
// GRADE CALCULATION
// ==========================================

function calculateGrade(marks) {

    const score = Number(marks);

    if (score >= 80) return "A";
    if (score >= 65) return "B";
    if (score >= 50) return "C";
    if (score >= 40) return "D";

    return "F";

}


// ==========================================
// DISPLAY GRADE RECORDS
// ==========================================

function renderGrades() {

    let filteredRecords = [...gradeRecords];

    // Commander sees own records only
    if (isCommander) {

        filteredRecords = filteredRecords.filter(record =>
            record.commanderId === currentUser.memberId
        );

    }

    // Search
    const keyword = searchInput.value.toLowerCase().trim();

    if (keyword) {

        filteredRecords = filteredRecords.filter(record => {

            const commander = commanders.find(c =>
                c.commanderId === record.commanderId
            );

            const name = commander?.name || "";

            return (
                name.toLowerCase().includes(keyword) ||
                String(record.commanderId || "").includes(keyword) ||
                String(record.assessment || "").toLowerCase().includes(keyword) ||
                String(record.date || "").includes(keyword) ||
                String(record.marks || "").includes(keyword) ||
                calculateGrade(record.marks).toLowerCase().includes(keyword)
            );

        });

    }

    // Sort by date
    filteredRecords.sort((a, b) =>
        String(b.date).localeCompare(String(a.date))
    );

    tableBody.innerHTML = "";

    if (filteredRecords.length === 0) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4">
                    No grade records found.
                </td>
            </tr>
        `;

        return;
    }

    filteredRecords.forEach(record => {

        const commander = commanders.find(c =>
            c.commanderId === record.commanderId
        );

        const commanderName = commander
            ? commander.name
            : "Unknown Commander";

        const grade = calculateGrade(record.marks);

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${escapeHTML(record.date || "-")}</td>

            <td>${escapeHTML(commanderName)}</td>

            <td>${escapeHTML(record.commanderId || "-")}</td>

            <td>${escapeHTML(record.assessment || "-")}</td>

            <td>${escapeHTML(record.marks)}</td>

            <td>
                <strong>${grade}</strong>
            </td>

            ${
                isOfficer
                    ? `<td>
                        <button
                            class="btn btn-sm btn-warning me-1"
                            data-action="edit"
                            data-id="${escapeHTML(record.id)}">

                            <i class="bi bi-pencil"></i>
                        </button>

                        <button
                            class="btn btn-sm btn-danger"
                            data-action="delete"
                            data-id="${escapeHTML(record.id)}">

                            <i class="bi bi-trash"></i>
                        </button>
                    </td>`
                    : ""
            }
        `;

        tableBody.appendChild(row);

    });

}


// ==========================================
// HTML ESCAPE
// ==========================================

function escapeHTML(value) {

    return String(value ?? "").replace(/[&<>"']/g, character => ({

        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"

    })[character]);

}


// ==========================================
// ADD / UPDATE GRADE
// ==========================================

gradeForm.addEventListener("submit", function (e) {

    e.preventDefault();

    if (!isOfficer) return;

    const commanderId = commanderSelect.value;
    const assessment = assessmentInput.value;
    const date = dateInput.value;
    const marks = Number(marksInput.value);
    const editId = editIdInput.value;

    if (!commanderId || !assessment || !date || marksInput.value === "") {

        showMessage(
            "Please complete all required fields.",
            "danger"
        );

        return;
    }

    if (!Number.isFinite(marks) || marks < 0 || marks > 100) {

        showMessage(
            "Marks must be between 0 and 100.",
            "danger"
        );

        return;
    }

    // Prevent duplicate assessment
    const duplicate = gradeRecords.some(record =>

        record.commanderId === commanderId &&
        record.assessment === assessment &&
        record.date === date &&
        String(record.id) !== String(editId)

    );

    if (duplicate) {

        showMessage(
            "This assessment record already exists for this Commander.",
            "warning"
        );

        return;
    }

    // Update existing record
    if (editId) {

        const index = gradeRecords.findIndex(record =>
            String(record.id) === String(editId)
        );

        if (index === -1) {

            showMessage("Grade record not found.", "danger");
            return;

        }

        gradeRecords[index] = {

            ...gradeRecords[index],

            commanderId,
            assessment,
            date,
            marks

        };

        showMessage(
            "Grade record updated successfully.",
            "success"
        );

    }

    // Add new record
    else {

        const newRecord = {

            id: "GRD-" + Date.now() + "-" +
                Math.random().toString(36).slice(2, 7),

            commanderId,
            assessment,
            date,
            marks

        };

        gradeRecords.push(newRecord);

        showMessage(
            "Grade record added successfully.",
            "success"
        );

    }

    saveGradeRecords();

    resetGradeForm();

    renderGrades();

});


// ==========================================
// EDIT GRADE
// ==========================================

function editGrade(id) {

    if (!isOfficer) return;

    const record = gradeRecords.find(item =>
        String(item.id) === String(id)
    );

    if (!record) {

        showMessage("Grade record not found.", "danger");
        return;

    }

    editIdInput.value = record.id;

    commanderSelect.value = record.commanderId;

    assessmentInput.value = record.assessment;

    dateInput.value = record.date;

    marksInput.value = record.marks;

    formTitle.innerHTML =
        '<i class="bi bi-pencil-square text-danger"></i> Edit Grade Record';

    saveButton.innerHTML =
        '<i class="bi bi-save"></i> Update Grade';

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


// ==========================================
// DELETE GRADE
// ==========================================

function deleteGrade(id) {

    if (!isOfficer) return;

    const index = gradeRecords.findIndex(record =>
        String(record.id) === String(id)
    );

    if (index === -1) {

        showMessage("Grade record not found.", "danger");
        return;

    }

    const confirmed = confirm(
        "Are you sure you want to delete this grade record?"
    );

    if (!confirmed) return;

    gradeRecords.splice(index, 1);

    saveGradeRecords();

    renderGrades();

    resetGradeForm();

    showMessage(
        "Grade record deleted successfully.",
        "success"
    );

}


// ==========================================
// TABLE ACTION BUTTONS
// ==========================================

tableBody.addEventListener("click", function (e) {

    const button = e.target.closest("button[data-action]");

    if (!button || !isOfficer) return;

    const id = button.dataset.id;

    if (button.dataset.action === "edit") {
        editGrade(id);
    }

    if (button.dataset.action === "delete") {
        deleteGrade(id);
    }

});


// ==========================================
// RESET FORM
// ==========================================

function resetGradeForm() {

    gradeForm.reset();

    editIdInput.value = "";

    formTitle.innerHTML =
        '<i class="bi bi-plus-circle text-danger"></i> Add Grade Record';

    saveButton.innerHTML =
        '<i class="bi bi-save"></i> Save Grade';

    dateInput.value = getTodayDate();

}

clearButton.addEventListener("click", resetGradeForm);


// ==========================================
// SEARCH
// ==========================================

searchInput.addEventListener("input", renderGrades);


// ==========================================
// MESSAGE
// ==========================================

function showMessage(text, type) {

    messageBox.innerHTML = "";

    const alert = document.createElement("div");

    alert.className = `alert alert-${type} py-2`;

    alert.textContent = text;

    messageBox.appendChild(alert);

}


// ==========================================
// INITIAL DISPLAY
// ==========================================

renderGrades();
