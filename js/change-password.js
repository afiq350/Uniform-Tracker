
const currentUser = JSON.parse(
    localStorage.getItem("currentUser")
);

const form = document.getElementById("changePasswordForm");
const message = document.getElementById("passwordMessage");

if (!currentUser) {
    window.location.href = "index.html";
}

document.getElementById("usernameDisplay").textContent =
    currentUser.username;

document.getElementById("roleDisplay").textContent =
    currentUser.role.toUpperCase();

// Logout
document.getElementById("logoutBtn").addEventListener("click", logout);

function logout() {
    localStorage.removeItem("currentUser");
    localStorage.removeItem("pendingCommanderId");
    window.location.replace("index.html");
}

// Change Password
form.addEventListener("submit", function (e) {
    e.preventDefault();

    const oldPassword =
        document.getElementById("currentPassword").value;

    const newPassword =
        document.getElementById("newPassword").value;

    const confirmPassword =
        document.getElementById("confirmPassword").value;

    if (newPassword.length < 6) {
        showMessage("Password must contain at least 6 characters.", "danger");
        return;
    }

    if (newPassword !== confirmPassword) {
        showMessage("New passwords do not match.", "danger");
        return;
    }

    if (newPassword === oldPassword) {
        showMessage("New password must be different.", "danger");
        return;
    }

    // Officer password
    if (currentUser.role === "officer") {
        const officer = JSON.parse(
            localStorage.getItem("officerAccount")
        );

        if (officer.password !== oldPassword) {
            showMessage("Current password is incorrect.", "danger");
            return;
        }

        officer.password = newPassword;

        localStorage.setItem(
            "officerAccount",
            JSON.stringify(officer)
        );
    }

    // Commander password
    else if (currentUser.role === "commander") {
        let commanders = JSON.parse(
            localStorage.getItem("commanders") || "[]"
        );

        const index = commanders.findIndex(
            c => c.commanderId === currentUser.memberId
        );

        if (index === -1) {
            showMessage("Commander account not found.", "danger");
            return;
        }

        if (commanders[index].password !== oldPassword) {
            showMessage("Current password is incorrect.", "danger");
            return;
        }

        commanders[index].password = newPassword;
        commanders[index].mustSetPassword = false;

        localStorage.setItem(
            "commanders",
            JSON.stringify(commanders)
        );
    }

    else {
        showMessage("Invalid account role.", "danger");
        return;
    }

    form.reset();
    showMessage("Password successfully updated.", "success");
});

function showMessage(text, type) {
    message.innerHTML = "";

    const alert = document.createElement("div");
    alert.className = `alert alert-${type} py-2`;
    alert.textContent = text;

    message.appendChild(alert);
}
