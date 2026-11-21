
/* ==========================================
   UNIFORM TRACKER - FIRST TIME PASSWORD SETUP
========================================== */

const pendingId = localStorage.getItem("pendingCommanderId");

const form = document.getElementById("setPasswordForm");
const newPassword = document.getElementById("newPassword");
const confirmPassword = document.getElementById("confirmPassword");
const passwordMessage = document.getElementById("passwordMessage");

if (!pendingId) {
    window.location.href = "index.html";
}

form.addEventListener("submit", function(event) {
    event.preventDefault();

    const password = newPassword.value;
    const confirmation = confirmPassword.value;

    passwordMessage.hidden = true;

    if (password.length < 6) {
        showError("Password must contain at least 6 characters.");
        return;
    }

    if (password !== confirmation) {
        showError("Passwords do not match.");
        return;
    }

    const commanders = JSON.parse(
        localStorage.getItem("commanders") || "[]"
    );

    const index = commanders.findIndex(item =>
        String(item.commanderId) === String(pendingId)
    );

    if (index === -1) {
        showError("Commander account could not be found.");
        return;
    }

    if (commanders[index].status !== "Active") {
        showError("Your account is inactive. Please contact your Officer.");
        return;
    }

    commanders[index].password = password;
    commanders[index].mustSetPassword = false;

    localStorage.setItem("commanders", JSON.stringify(commanders));

    localStorage.setItem("currentUser", JSON.stringify({
        username: pendingId,
        role: "commander",
        memberId: pendingId
    }));

    localStorage.removeItem("pendingCommanderId");

    alert("Password successfully created. Welcome to Uniform Tracker!");

    window.location.href = "dashboard.html";
});

function showError(message) {
    passwordMessage.textContent = message;
    passwordMessage.hidden = false;
}
