
// ==========================================
// UNIFORM TRACKER - REPORTS & ANALYTICS
// ==========================================

// ==========================================
// AUTHENTICATION
// ==========================================

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


// ==========================================
// LOAD DATA FROM LOCALSTORAGE
// ==========================================

let commanders = JSON.parse(
    localStorage.getItem("commanders") || "[]"
);

let attendanceRecords = JSON.parse(
    localStorage.getItem("attendanceRecords") || "[]"
);

let gradeRecords = JSON.parse(
    localStorage.getItem("gradeRecords") || "[]"
);


// ==========================================
// HTML ELEMENTS
// ==========================================

const commanderFilter = document.getElementById("reportCommander");
const commanderFilterGroup = document.getElementById("reportCommanderGroup");

const startDateInput = document.getElementById("reportStartDate");
const endDateInput = document.getElementById("reportEndDate");

const applyFilterBtn = document.getElementById("applyFilterBtn");
const resetFilterBtn = document.getElementById("resetFilterBtn");
const printReportBtn = document.getElementById("printReportBtn");

const reportMessage = document.getElementById("reportMessage");
const reportSearch = document.getElementById("reportSearch");
const reportTableBody = document.getElementById("reportTableBody");

const totalCommandersElement = document.getElementById("totalCommanders");
const commanderCountLabel = document.getElementById("commanderCountLabel");
const attendanceRateElement = document.getElementById("attendanceRate");
const averageMarksElement = document.getElementById("averageMarks");
const totalAssessmentsElement = document.getElementById("totalAssessments");


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
// DATA MIGRATION
// ==========================================

function migrateRecords() {

    let attendanceChanged = false;
    let gradesChanged = false;

    attendanceRecords = attendanceRecords.map(record => {

        if (!record.commanderId && record.memberId) {
            record.commanderId = record.memberId;
            attendanceChanged = true;
        }

        if (!record.id) {
            record.id = "ATT-" + Date.now() + "-" +
                Math.random().toString(36).slice(2, 7);

            attendanceChanged = true;
        }

        return record;

    });


    gradeRecords = gradeRecords.map(record => {

        if (!record.commanderId && record.memberId) {
            record.commanderId = record.memberId;
            gradesChanged = true;
        }

        if (!record.id) {
            record.id = "GRD-" + Date.now() + "-" +
                Math.random().toString(36).slice(2, 7);

            gradesChanged = true;
        }

        return record;

    });


    if (attendanceChanged) {
        localStorage.setItem(
            "attendanceRecords",
            JSON.stringify(attendanceRecords)
        );
    }

    if (gradesChanged) {
        localStorage.setItem(
            "gradeRecords",
            JSON.stringify(gradeRecords)
        );
    }

}

migrateRecords();


// ==========================================
// ROLE-BASED INTERFACE
// ==========================================

if (isCommander) {

    commanderFilterGroup.style.display = "none";

    document.getElementById("reportDescription").textContent =
        "View your personal attendance and assessment performance.";

    commanderCountLabel.textContent = "Your Commander Profile";

}


// ==========================================
// POPULATE COMMANDER FILTER
// ==========================================

function populateCommanderFilter() {

    commanderFilter.innerHTML =
        '<option value="all">All Commanders</option>';

    commanders.forEach(commander => {

        const option = document.createElement("option");

        option.value = commander.commanderId;

        option.textContent =
            `${commander.name} (${commander.commanderId})`;

        commanderFilter.appendChild(option);

    });

}

populateCommanderFilter();


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
// CHART VARIABLES
// ==========================================

let attendanceChart = null;
let gradeChart = null;
let performanceChart = null;


// ==========================================
// FILTER DATA
// ==========================================

function getFilteredData() {

    let selectedCommander = "all";

    if (isCommander) {

        selectedCommander = currentUser.memberId;

    } else {

        selectedCommander = commanderFilter.value;

    }

    const startDate = startDateInput.value;
    const endDate = endDateInput.value;


    // Filter attendance
    const filteredAttendance = attendanceRecords.filter(record => {

        const commanderMatch =
            selectedCommander === "all" ||
            record.commanderId === selectedCommander;

        const startMatch =
            !startDate || record.date >= startDate;

        const endMatch =
            !endDate || record.date <= endDate;

        return commanderMatch && startMatch && endMatch;

    });


    // Filter grades
    const filteredGrades = gradeRecords.filter(record => {

        const commanderMatch =
            selectedCommander === "all" ||
            record.commanderId === selectedCommander;

        const startMatch =
            !startDate || record.date >= startDate;

        const endMatch =
            !endDate || record.date <= endDate;

        return commanderMatch && startMatch && endMatch;

    });


    // Filter commanders
    let filteredCommanders = commanders.filter(commander => {

        return (
            selectedCommander === "all" ||
            commander.commanderId === selectedCommander
        );

    });


    return {
        selectedCommander,
        filteredAttendance,
        filteredGrades,
        filteredCommanders
    };

}


// ==========================================
// SUMMARY STATISTICS
// ==========================================

function updateSummary(data) {

    const attendance = data.filteredAttendance;
    const grades = data.filteredGrades;
    const commanderList = data.filteredCommanders;

    const presentCount = attendance.filter(record =>
        String(record.status || "").toLowerCase() === "present"
    ).length;

    const absentCount = attendance.filter(record =>
        String(record.status || "").toLowerCase() === "absent"
    ).length;

    const totalAttendance = presentCount + absentCount;

    const rate = totalAttendance > 0
        ? (presentCount / totalAttendance) * 100
        : 0;

    const marks = grades
        .map(record => Number(record.marks))
        .filter(mark => Number.isFinite(mark));

    const average = marks.length > 0
        ? marks.reduce((sum, mark) => sum + mark, 0) / marks.length
        : 0;

    totalCommandersElement.textContent =
        isCommander ? "1" : commanderList.length;

    attendanceRateElement.textContent =
        rate.toFixed(1) + "%";

    averageMarksElement.textContent =
        average.toFixed(1);

    totalAssessmentsElement.textContent =
        grades.length;

}


// ==========================================
// ATTENDANCE CHART
// ==========================================

function updateAttendanceChart(attendance) {

    const present = attendance.filter(record =>
        String(record.status || "").toLowerCase() === "present"
    ).length;

    const absent = attendance.filter(record =>
        String(record.status || "").toLowerCase() === "absent"
    ).length;

    const canvas = document.getElementById("attendanceChart");

    if (attendanceChart) {
        attendanceChart.destroy();
    }

    attendanceChart = new Chart(canvas, {

        type: "doughnut",

        data: {

            labels: ["Present", "Absent"],

            datasets: [{

                data: [present, absent],

                backgroundColor: [
                    "#16A34A",
                    "#DC2626"
                ],

                borderWidth: 2

            }]

        },

        options: {

            responsive: true,
            maintainAspectRatio: false,

            plugins: {

                legend: {
                    position: "bottom"
                }

            }

        }

    });

}


// ==========================================
// GRADE DISTRIBUTION CHART
// ==========================================

function updateGradeChart(grades) {

    const gradeCounts = {
        A: 0,
        B: 0,
        C: 0,
        D: 0,
        F: 0
    };

    grades.forEach(record => {

        const grade = calculateGrade(record.marks);

        gradeCounts[grade]++;

    });

    const canvas = document.getElementById("gradeChart");

    if (gradeChart) {
        gradeChart.destroy();
    }

    gradeChart = new Chart(canvas, {

        type: "bar",

        data: {

            labels: ["A", "B", "C", "D", "F"],

            datasets: [{

                label: "Number of Assessments",

                data: [
                    gradeCounts.A,
                    gradeCounts.B,
                    gradeCounts.C,
                    gradeCounts.D,
                    gradeCounts.F
                ],

                backgroundColor: [
                    "#16A34A",
                    "#2563EB",
                    "#D97706",
                    "#EA580C",
                    "#DC2626"
                ],

                borderRadius: 6

            }]

        },

        options: {

            responsive: true,
            maintainAspectRatio: false,

            scales: {

                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }

            },

            plugins: {

                legend: {
                    display: false
                }

            }

        }

    });

}


// ==========================================
// ASSESSMENT PERFORMANCE CHART
// ==========================================

function updatePerformanceChart(grades) {

    const assessmentGroups = {};

    grades.forEach(record => {

        const assessment = record.assessment || "Other";
        const marks = Number(record.marks);

        if (!Number.isFinite(marks)) return;

        if (!assessmentGroups[assessment]) {

            assessmentGroups[assessment] = {
                total: 0,
                count: 0
            };

        }

        assessmentGroups[assessment].total += marks;
        assessmentGroups[assessment].count++;

    });


    const labels = Object.keys(assessmentGroups);

    const averages = labels.map(assessment => {

        const group = assessmentGroups[assessment];

        return group.total / group.count;

    });


    const canvas = document.getElementById("performanceChart");

    if (performanceChart) {
        performanceChart.destroy();
    }

    performanceChart = new Chart(canvas, {

        type: "bar",

        data: {

            labels,

            datasets: [{

                label: "Average Marks",

                data: averages,

                backgroundColor: "#991B1B",

                borderRadius: 6

            }]

        },

        options: {

            responsive: true,
            maintainAspectRatio: false,

            scales: {

                y: {

                    beginAtZero: true,
                    max: 100,

                    title: {
                        display: true,
                        text: "Marks (%)"
                    }

                },

                x: {

                    ticks: {
                        autoSkip: false,
                        maxRotation: 35,
                        minRotation: 0
                    }

                }

            },

            plugins: {

                legend: {
                    display: false
                }

            }

        }

    });

}


// ==========================================
// BUILD COMMANDER REPORT DATA
// ==========================================

function buildCommanderReports(data) {

    return data.filteredCommanders.map(commander => {

        const commanderAttendance =
            data.filteredAttendance.filter(record =>
                record.commanderId === commander.commanderId
            );

        const commanderGrades =
            data.filteredGrades.filter(record =>
                record.commanderId === commander.commanderId
            );


        const present = commanderAttendance.filter(record =>
            String(record.status || "").toLowerCase() === "present"
        ).length;

        const absent = commanderAttendance.filter(record =>
            String(record.status || "").toLowerCase() === "absent"
        ).length;


        const total = present + absent;

        const attendanceRate = total > 0
            ? (present / total) * 100
            : 0;


        const marks = commanderGrades
            .map(record => Number(record.marks))
            .filter(mark => Number.isFinite(mark));

        const averageMarks = marks.length > 0
            ? marks.reduce((sum, mark) => sum + mark, 0) / marks.length
            : null;


        const overallGrade = averageMarks === null
            ? "-"
            : calculateGrade(averageMarks);


        return {

            name: commander.name,
            commanderId: commander.commanderId,
            company: commander.company || "-",

            present,
            absent,

            attendanceRate,
            averageMarks,

            overallGrade

        };

    });

}


// ==========================================
// DISPLAY REPORT TABLE
// ==========================================

function renderReportTable(reports) {

    const keyword = reportSearch.value.toLowerCase().trim();

    const filteredReports = reports.filter(report => {

        const searchableText = [

            report.name,
            report.commanderId,
            report.company,
            report.present,
            report.absent,
            report.attendanceRate.toFixed(1),
            report.averageMarks === null
                ? "-"
                : report.averageMarks.toFixed(1),
            report.overallGrade

        ].join(" ").toLowerCase();

        return searchableText.includes(keyword);

    });


    reportTableBody.innerHTML = "";


    if (filteredReports.length === 0) {

        reportTableBody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-4">
                    No report records found.
                </td>
            </tr>
        `;

        document.getElementById("reportRecordCount").textContent =
            "0 records";

        return;

    }


    filteredReports.forEach(report => {

        const row = document.createElement("tr");

        const averageText = report.averageMarks === null
            ? "-"
            : report.averageMarks.toFixed(1);

        row.innerHTML = `

            <td>${escapeHTML(report.name)}</td>

            <td>${escapeHTML(report.commanderId)}</td>

            <td>${escapeHTML(report.company)}</td>

            <td>${report.present}</td>

            <td>${report.absent}</td>

            <td>${report.attendanceRate.toFixed(1)}%</td>

            <td>${averageText}</td>

            <td><strong>${report.overallGrade}</strong></td>

        `;

        reportTableBody.appendChild(row);

    });


    document.getElementById("reportRecordCount").textContent =
        `${filteredReports.length} record(s)`;

}


// ==========================================
// REFRESH ALL REPORTS
// ==========================================

function refreshReports() {

    const data = getFilteredData();

    updateSummary(data);

    updateAttendanceChart(data.filteredAttendance);

    updateGradeChart(data.filteredGrades);

    updatePerformanceChart(data.filteredGrades);

    const reports = buildCommanderReports(data);

    renderReportTable(reports);

}


// ==========================================
// APPLY FILTER
// ==========================================

applyFilterBtn.addEventListener("click", function () {

    const startDate = startDateInput.value;
    const endDate = endDateInput.value;

    if (startDate && endDate && startDate > endDate) {

        showMessage(
            "Start Date cannot be later than End Date.",
            "danger"
        );

        return;

    }

    reportSearch.value = "";

    showMessage("Report filter applied successfully.", "success");

    refreshReports();

});


// ==========================================
// RESET FILTER
// ==========================================

resetFilterBtn.addEventListener("click", function () {

    if (isOfficer) {
        commanderFilter.value = "all";
    }

    startDateInput.value = "";
    endDateInput.value = "";
    reportSearch.value = "";

    showMessage("Report filters have been reset.", "success");

    refreshReports();

});


// ==========================================
// SEARCH REPORT
// ==========================================

reportSearch.addEventListener("input", function () {

    const data = getFilteredData();

    const reports = buildCommanderReports(data);

    renderReportTable(reports);

});


// ==========================================
// PRINT REPORT
// ==========================================

printReportBtn.addEventListener("click", function () {

    window.print();

});


// ==========================================
// MESSAGE
// ==========================================

function showMessage(message, type) {

    reportMessage.innerHTML = "";

    const alert = document.createElement("div");

    alert.className = `alert alert-${type} py-2 mb-0`;

    alert.textContent = message;

    reportMessage.appendChild(alert);

}


// ==========================================
// INITIAL DISPLAY
// ==========================================

refreshReports();
