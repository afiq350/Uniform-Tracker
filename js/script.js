
document.addEventListener("DOMContentLoaded", function () {

    const currentUser = JSON.parse(localStorage.getItem("currentUser"));

    const currentPage = window.location.pathname
        .split("/")
        .pop()
        .toLowerCase();

    const publicPages = [
        "index.html",
        "",
        "set-password.html"
    ];

    // Allow public pages
    if (publicPages.includes(currentPage)) {
        return;
    }

    // Check login session
    if (!currentUser) {
        window.location.href = "index.html";
        return;
    }

    const role = String(currentUser.role || "")
        .trim()
        .toLowerCase();

    // Only Officer and Commander are allowed
    if (role !== "officer" && role !== "commander") {
        localStorage.removeItem("currentUser");
        window.location.href = "index.html";
        return;
    }

    // Prevent Commander from accessing Commander Management
    if (role === "commander" && currentPage === "commanders.html") {
        window.location.href = "dashboard.html";
        return;
    }

    // Display user information
    const usernameDisplay = document.getElementById("usernameDisplay");
    const roleDisplay = document.getElementById("roleDisplay");

    if (usernameDisplay) {
        usernameDisplay.textContent =
            currentUser.username || currentUser.commanderId || "User";
    }

    if (roleDisplay) {
        roleDisplay.textContent =
            role === "officer" ? "Officer" : "Commander";
    }

    // Control Commander Management menu
    const commanderMenu = document.getElementById("commanderMenu");

    if (commanderMenu) {
        commanderMenu.style.display =
            role === "officer" ? "" : "none";
    }

    // Logout
    const logoutBtn = document.getElementById("logoutBtn");

    if (logoutBtn) {
        logoutBtn.addEventListener("click", function () {
            localStorage.removeItem("currentUser");
            window.location.href = "index.html";
        });
    }

});
