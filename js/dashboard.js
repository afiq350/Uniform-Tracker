
const currentUser = JSON.parse(
    localStorage.getItem("currentUser")
);

if (!currentUser) {
    window.location.replace("index.html");
}

const commanders = JSON.parse(
    localStorage.getItem("commanders") || "[]"
);

const attendance = JSON.parse(
    localStorage.getItem("attendanceRecords") || "[]"
);

const grades = JSON.parse(
    localStorage.getItem("gradeRecords") || "[]"
);

const isOfficer = currentUser.role === "officer";
const isCommander = currentUser.role === "commander";

if (!isOfficer && !isCommander) {
    localStorage.removeItem("currentUser");
    window.location.replace("index.html");
}

// User information
document.getElementById("usernameDisplay").textContent =
    currentUser.username;

document.getElementById("roleDisplay").textContent =
    currentUser.role.toUpperCase();

document.getElementById("accountId").textContent =
    currentUser.username;

document.getElementById("accountRole").textContent =
    currentUser.role.toUpperCase();

// Role-based menu
document.getElementById("commanderMenu").style.display =
    isOfficer ? "flex" : "none";

document.getElementById("passwordMenu").style.display =
    "flex";

// Logout function
const logoutButton = document.getElementById("logoutBtn");

if (logoutButton) {
    logoutButton.addEventListener("click", function () {
        localStorage.removeItem("currentUser");
        localStorage.removeItem("pendingCommanderId");
        window.location.replace("index.html");
    });
}

// Commander personal records
const ownAttendance = attendance.filter(record =>
    (record.commanderId || record.memberId) === currentUser.memberId
);

const ownGrades = grades.filter(record =>
    (record.commanderId || record.memberId) === currentUser.memberId
);

// Dashboard information
if (isOfficer) {
    document.getElementById("welcomeMessage").textContent =
        "Welcome, Officer!";

    document.getElementById("statOneLabel").textContent =
        "Total Commanders";

    document.getElementById("statTwoLabel").textContent =
        "Attendance Records";

    document.getElementById("statThreeLabel").textContent =
        "Grade Records";

    document.getElementById("statFourLabel").textContent =
        "Average Marks";

    const activeCommanders = commanders.filter(
        c => c.status === "Active"
    );

    const validMarks = grades
        .map(g => Number(g.marks))
        .filter(mark => Number.isFinite(mark));

    const averageMarks = validMarks.length
        ? validMarks.reduce((a, b) => a + b, 0) / validMarks.length
        : 0;

    document.getElementById("statOne").textContent =
        activeCommanders.length;

    document.getElementById("statTwo").textContent =
        attendance.length;

    document.getElementById("statThree").textContent =
        grades.length;

    document.getElementById("statFour").textContent =
        averageMarks.toFixed(1);

    document.getElementById("accessLevel").textContent =
        "Full System Access";

    document.getElementById("companyDisplay").textContent =
        "All Companies";
}

if (isCommander) {
    const commander = commanders.find(
        c => c.commanderId === currentUser.memberId
    );

    document.getElementById("welcomeMessage").textContent =
        "Welcome, " + (commander ? commander.name : "Commander") + "!";

    document.getElementById("statOneLabel").textContent =
        "My Attendance";

    document.getElementById("statTwoLabel").textContent =
        "Present";

    document.getElementById("statThreeLabel").textContent =
        "My Grade Records";

    document.getElementById("statFourLabel").textContent =
        "Average Marks";

    const presentCount = ownAttendance.filter(
        record => record.status === "Present"
    ).length;

    const validMarks = ownGrades
        .map(g => Number(g.marks))
        .filter(mark => Number.isFinite(mark));

    const averageMarks = validMarks.length
        ? validMarks.reduce((a, b) => a + b, 0) / validMarks.length
        : 0;

    document.getElementById("statOne").textContent =
        ownAttendance.length;

    document.getElementById("statTwo").textContent =
        presentCount;

    document.getElementById("statThree").textContent =
        ownGrades.length;

    document.getElementById("statFour").textContent =
        averageMarks.toFixed(1);

    document.getElementById("accessLevel").textContent =
        "Personal Access";

    document.getElementById("companyDisplay").textContent =
        commander ? commander.company : "-";
}
