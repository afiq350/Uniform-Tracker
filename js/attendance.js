
"use strict";

document.addEventListener("DOMContentLoaded", function () {

    // ==========================================
    // 1. GET HTML ELEMENTS
    // ==========================================

    const $ = (id) => document.getElementById(id);

    const form = $("attendanceForm");
    const editIdInput = $("attendanceEditId");
    const commanderSelect = $("attendanceCommander");
    const dateInput = $("attendanceDate");
    const activitySelect = $("attendanceActivity");
    const statusSelect = $("attendanceStatus");

    const tableBody = $("attendanceTableBody");
    const messageBox = $("attendanceMessage");
    const systemStatus = $("systemStatus");

    const submitButton = $("saveAttendanceBtn");
    const clearButton = $("clearAttendanceBtn");
    const formTitle = $("formTitle");

    // ==========================================
    // 2. SYSTEM STATUS / ERROR DISPLAY
    // ==========================================

    function setSystemStatus(message, type = "normal") {
        if (!systemStatus) return;

        systemStatus.className = "attendance-status";

        if (type === "success") {
            systemStatus.classList.add("success");
        } else if (type === "error") {
            systemStatus.classList.add("error");
        } else if (type === "warning") {
            systemStatus.classList.add("warning");
        }

        systemStatus.textContent = message;
    }

    function showMessage(message, type = "info") {
        if (!messageBox) return;

        messageBox.hidden = false;
        messageBox.className = "alert alert-" + type + " mt-3";
        messageBox.textContent = message;
    }

    function hideMessage() {
        if (!messageBox) return;

        messageBox.hidden = true;
        messageBox.textContent = "";
    }

    // ==========================================
    // 3. LOCAL STORAGE FUNCTIONS
    // ==========================================

    function readArray(key) {
        try {
            const value = localStorage.getItem(key);

            if (!value) return [];

            const parsed = JSON.parse(value);

            return Array.isArray(parsed) ? parsed : [];

        } catch (error) {
            console.error("LocalStorage error:", key, error);

            throw new Error(
                "Unable to read " + key + " from browser storage."
            );
        }
    }

    function writeArray(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;

        } catch (error) {
            console.error("LocalStorage save error:", error);

            throw new Error(
                "Unable to save data. Browser storage may be full or blocked."
            );
        }
    }

    // ==========================================
    // 4. GET CURRENT USER
    // ==========================================

    let currentUser;

    try {
        currentUser = JSON.parse(
            localStorage.getItem("currentUser")
        );

    } catch (error) {
        console.error("Current user data error:", error);

        setSystemStatus(
            "Login data is invalid. Please login again.",
            "error"
        );

        return;
    }

    if (!currentUser) {
        window.location.href = "index.html";
        return;
    }

    const role = String(currentUser.role || "")
        .trim()
        .toLowerCase();

    const isOfficer = role === "officer" || role === "admin";
    const isCommander = role === "commander";

    if (!isOfficer && !isCommander) {
        setSystemStatus(
            "Unknown account role: " + role,
            "error"
        );

        return;
    }

    const currentCommanderId = String(
        currentUser.commanderId ||
        currentUser.memberId ||
        currentUser.username ||
        currentUser.id ||
        ""
    ).trim();

    // ==========================================
    // 5. DATA FUNCTIONS
    // ==========================================

    function getCommanders() {
        return readArray("commanders");
    }

    function getAttendance() {
        return readArray("attendanceRecords").map(function (record) {
            return {
                ...record,
                commanderId: String(
                    record.commanderId || record.memberId || ""
                ).trim()
            };
        });
    }

    function getCommanderId(commander) {
        return String(
            commander.commanderId ||
            commander.memberId ||
            commander.username ||
            commander.id ||
            ""
        ).trim();
    }

    function findCommander(id) {
        return getCommanders().find(function (commander) {
            return getCommanderId(commander) === String(id).trim();
        });
    }

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, function (char) {
            return {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#039;"
            }[char];
        });
    }

    function createId() {
        return "ATT-" + Date.now() + "-" +
            Math.floor(Math.random() * 10000);
    }

    function formatDate(value) {
        if (!value) return "-";

        const date = new Date(value + "T00:00:00");

        if (Number.isNaN(date.getTime())) {
            return value;
        }

        return date.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    }

    // ==========================================
    // 6. SETUP USER INTERFACE
    // ==========================================

    if ($("usernameDisplay")) {
        $("usernameDisplay").textContent =
            currentUser.name ||
            currentUser.username ||
            "User";
    }

    if ($("roleDisplay")) {
        $("roleDisplay").textContent =
            isOfficer ? "Officer" : "Commander";
    }

    if ($("commanderMenu")) {
        $("commanderMenu").style.display =
            isOfficer ? "" : "none";
    }

    if (isCommander) {
        $("commanderSelectGroup").style.display = "none";
        $("actionHeader").style.display = "none";

        formTitle.innerHTML =
            '<i class="bi bi-clipboard-check"></i> Submit My Attendance';
    }

    // ==========================================
    // 7. LOAD COMMANDER DROPDOWN
    // ==========================================

    function loadCommanderDropdown() {
        if (!isOfficer) return;

        const commanders = getCommanders();

        commanderSelect.innerHTML =
            '<option value="">Select Commander</option>';

        commanders.forEach(function (commander) {

            const status = String(
                commander.status || "Active"
            ).toLowerCase();

            if (status !== "active") return;

            const id = getCommanderId(commander);

            if (!id) return;

            const option = document.createElement("option");

            option.value = id;

            option.textContent =
                (commander.name || "Unnamed Commander") +
                " (" + id + ")";

            commanderSelect.appendChild(option);
        });

        if (commanderSelect.options.length === 1) {
            setSystemStatus(
                "No active Commander accounts found. Add or activate a Commander first.",
                "warning"
            );
        }
    }

    // ==========================================
    // 8. GET RECORDS BASED ON ROLE
    // ==========================================

    function getVisibleRecords() {
        const records = getAttendance();

        if (isOfficer) {
            return records;
        }

        return records.filter(function (record) {
            return record.commanderId === currentCommanderId;
        });
    }

    // ==========================================
    // 9. DISPLAY ATTENDANCE RECORDS
    // ==========================================

    function renderRecords() {
        const records = getVisibleRecords();

        records.sort(function (a, b) {
            return String(b.date || "").localeCompare(
                String(a.date || "")
            );
        });

        if (records.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="attendance-empty">
                        No attendance records found.
                    </td>
                </tr>
            `;

            return;
        }

        tableBody.innerHTML = records.map(function (record, index) {

            const commander = findCommander(record.commanderId);

            const name = commander
                ? commander.name || "-"
                : "Commander not found";

            const company = commander
                ? commander.company || "-"
                : "-";

            const status = String(record.status || "");

            const badgeClass =
                status.toLowerCase() === "present"
                    ? "bg-success"
                    : "bg-danger";

            let actions = "";

            if (isOfficer) {
                actions = `
                    <div class="attendance-actions">

                        <button
                            type="button"
                            class="btn btn-warning btn-sm edit-record"
                            data-id="${escapeHTML(record.id)}"
                            title="Edit">
                            <i class="bi bi-pencil-square"></i>
                        </button>

                        <button
                            type="button"
                            class="btn btn-danger btn-sm delete-record"
                            data-id="${escapeHTML(record.id)}"
                            title="Delete">
                            <i class="bi bi-trash"></i>
                        </button>

                    </div>
                `;
            }

            return `
                <tr>
                    <td>${index + 1}</td>
                    <td>${escapeHTML(formatDate(record.date))}</td>
                    <td>${escapeHTML(record.commanderId)}</td>
                    <td>${escapeHTML(name)}</td>
                    <td>${escapeHTML(company)}</td>
                    <td>${escapeHTML(record.activity || "-")}</td>

                    <td>
                        <span class="badge ${badgeClass}">
                            ${escapeHTML(status)}
                        </span>
                    </td>

                    <td style="${isCommander ? "display:none" : ""}">
                        ${actions}
                    </td>
                </tr>
            `;

        }).join("");
    }

    // ==========================================
    // 10. CLEAR FORM
    // ==========================================

    function resetForm() {
        form.reset();

        editIdInput.value = "";

        dateInput.value = new Date().toLocaleDateString("en-CA");

        submitButton.innerHTML =
            '<i class="bi bi-save"></i> Submit Attendance';

        formTitle.innerHTML = isOfficer
            ? '<i class="bi bi-clipboard-check"></i> Manage Attendance'
            : '<i class="bi bi-clipboard-check"></i> Submit My Attendance';

        hideMessage();
    }

    // ==========================================
    // 11. SUBMIT ATTENDANCE
    // ==========================================

    form.addEventListener("submit", function (event) {

        event.preventDefault();

        hideMessage();

        try {
            const date = dateInput.value;
            const activity = activitySelect.value;
            const status = statusSelect.value;
            const editId = editIdInput.value;

            const commanderId = isOfficer
                ? commanderSelect.value
                : currentCommanderId;

            // Validate required fields.
            if (!commanderId || !date || !activity || !status) {
                showMessage(
                    "Please complete all required fields before submitting.",
                    "warning"
                );

                return;
            }

            // Commander can only submit own attendance.
            if (
                isCommander &&
                commanderId !== currentCommanderId
            ) {
                showMessage(
                    "You are not allowed to submit attendance for another Commander.",
                    "danger"
                );

                return;
            }

            // Verify Commander account.
            const commander = findCommander(commanderId);

            if (!commander) {
                showMessage(
                    "Commander account not found. Please check the Commander ID in your account data.",
                    "danger"
                );

                return;
            }

            let records = getAttendance();

            // Prevent duplicate records.
            const duplicate = records.some(function (record) {

                return (
                    record.commanderId === commanderId &&
                    record.date === date &&
                    record.activity === activity &&
                    String(record.id) !== String(editId)
                );

            });

            if (duplicate) {
                showMessage(
                    "Attendance for this date and activity has already been recorded.",
                    "warning"
                );

                return;
            }

            // UPDATE EXISTING RECORD
            if (editId) {

                if (!isOfficer) {
                    showMessage(
                        "Only Officer can edit attendance records.",
                        "danger"
                    );

                    return;
                }

                const index = records.findIndex(function (record) {
                    return String(record.id) === String(editId);
                });

                if (index === -1) {
                    showMessage(
                        "Attendance record not found.",
                        "danger"
                    );

                    return;
                }

                records[index] = {
                    ...records[index],
                    commanderId: commanderId,
                    date: date,
                    activity: activity,
                    status: status
                };

                writeArray("attendanceRecords", records);

                resetForm();
                renderRecords();

                showMessage(
                    "Attendance updated successfully.",
                    "success"
                );

                setSystemStatus(
                    "Attendance record updated successfully.",
                    "success"
                );

            } else {

                // CREATE NEW RECORD
                const newRecord = {
                    id: createId(),
                    commanderId: commanderId,
                    date: date,
                    activity: activity,
                    status: status
                };

                records.push(newRecord);

                writeArray("attendanceRecords", records);

                // Verify saved record.
                const savedRecords = getAttendance();

                const saved = savedRecords.some(function (record) {
                    return record.id === newRecord.id;
                });

                if (!saved) {
                    throw new Error(
                        "Record could not be verified after saving."
                    );
                }

                resetForm();
                renderRecords();

                showMessage(
                    "Attendance submitted successfully.",
                    "success"
                );

                setSystemStatus(
                    "Attendance system is working. Record saved successfully.",
                    "success"
                );
            }

        } catch (error) {

            console.error(
                "Attendance submission failed:",
                error
            );

            showMessage(
                "Unable to submit attendance: " + error.message,
                "danger"
            );

            setSystemStatus(
                "Attendance submission failed. Check the error message above.",
                "error"
            );
        }

    });

    // ==========================================
    // 12. EDIT AND DELETE RECORDS
    // ==========================================

    tableBody.addEventListener("click", function (event) {

        if (!isOfficer) return;

        const editButton = event.target.closest(".edit-record");
        const deleteButton = event.target.closest(".delete-record");

        // EDIT
        if (editButton) {

            const id = editButton.dataset.id;

            const record = getAttendance().find(function (item) {
                return String(item.id) === String(id);
            });

            if (!record) {
                showMessage(
                    "Attendance record not found.",
                    "danger"
                );

                return;
            }

            editIdInput.value = record.id;
            commanderSelect.value = record.commanderId;
            dateInput.value = record.date;
            activitySelect.value = record.activity;
            statusSelect.value = record.status;

            submitButton.innerHTML =
                '<i class="bi bi-save"></i> Update Attendance';

            formTitle.innerHTML =
                '<i class="bi bi-pencil-square"></i> Edit Attendance';

            hideMessage();

            form.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }

        // DELETE
        if (deleteButton) {

            const id = deleteButton.dataset.id;

            const confirmed = confirm(
                "Are you sure you want to delete this attendance record?"
            );

            if (!confirmed) return;

            try {
                const updatedRecords = getAttendance().filter(
                    function (record) {
                        return String(record.id) !== String(id);
                    }
                );

                writeArray("attendanceRecords", updatedRecords);

                resetForm();
                renderRecords();

                showMessage(
                    "Attendance record deleted successfully.",
                    "success"
                );

                setSystemStatus(
                    "Attendance record deleted successfully.",
                    "success"
                );

            } catch (error) {

                console.error(error);

                showMessage(
                    error.message,
                    "danger"
                );
            }
        }

    });

    // ==========================================
    // 13. CLEAR BUTTON
    // ==========================================

    clearButton.addEventListener("click", function () {
        resetForm();
    });

    // ==========================================
    // 14. LOGOUT
    // ==========================================

    const logoutButton = $("logoutBtn");

    if (logoutButton) {

        logoutButton.addEventListener("click", function () {

            if (confirm("Are you sure you want to logout?")) {

                localStorage.removeItem("currentUser");

                window.location.href = "index.html";
            }

        });
    }

    // ==========================================
    // 15. INITIALISE ATTENDANCE
    // ==========================================

    try {

        if (isCommander && !currentCommanderId) {

            setSystemStatus(
                "Commander ID is missing from the current login session. Please check auth.js.",
                "error"
            );

            submitButton.disabled = true;

            return;
        }

        loadCommanderDropdown();

        resetForm();

        renderRecords();

        setSystemStatus(
            "Attendance system loaded successfully. You are logged in as " +
            (isOfficer ? "Officer." : "Commander."),
            "success"
        );

    } catch (error) {

        console.error(
            "Attendance initialisation failed:",
            error
        );

        setSystemStatus(
            "Attendance could not initialise: " + error.message,
            "error"
        );
    }

});
