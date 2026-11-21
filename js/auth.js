
// =====================================
// UNIFORM TRACKER - AUTHENTICATION
// OFFICER & COMMANDER
// =====================================

// DEFAULT OFFICER ACCOUNT
const DEFAULT_OFFICER = {
    username: "2026000001",
    password: "officer123",
    role: "officer"
};

// CREATE DEFAULT OFFICER IF NOT EXISTS
if (!localStorage.getItem("officerAccount")) {
    localStorage.setItem(
        "officerAccount",
        JSON.stringify(DEFAULT_OFFICER)
    );
}

// GET LOGIN ELEMENTS
const loginForm = document.getElementById("loginForm");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const loginError = document.getElementById("loginError");
const togglePassword = document.getElementById("togglePassword");

// =====================================
// SHOW / HIDE PASSWORD
// =====================================

if (togglePassword && passwordInput) {
    togglePassword.addEventListener("click", function () {

        const icon = this.querySelector("i");

        if (passwordInput.type === "password") {
            passwordInput.type = "text";

            if (icon) {
                icon.classList.replace("bi-eye", "bi-eye-slash");
            }

        } else {
            passwordInput.type = "password";

            if (icon) {
                icon.classList.replace("bi-eye-slash", "bi-eye");
            }
        }

    });
}

// =====================================
// VALIDATE 10-DIGIT USER ID
// =====================================

if (usernameInput) {
    usernameInput.addEventListener("input", function () {
        this.value = this.value.replace(/\D/g, "").slice(0, 10);
    });
}

// =====================================
// LOGIN PROCESS
// =====================================

if (loginForm) {

    loginForm.addEventListener("submit", function (event) {

        event.preventDefault();

        const username = usernameInput.value.trim();
        const password = passwordInput.value;

        if (loginError) {
            loginError.textContent = "";
            loginError.style.display = "none";
            loginError.hidden = true;
        }

        // VALIDATE USER ID
        if (!/^\d{10}$/.test(username)) {
            showLoginError("User ID must contain exactly 10 digits.");
            return;
        }

        // =================================
        // CHECK OFFICER ACCOUNT
        // =================================

        let officer;

        try {
            officer = JSON.parse(
                localStorage.getItem("officerAccount")
            );
        } catch (error) {
            officer = null;
        }

        if (
            officer &&
            username === String(officer.username) &&
            password === officer.password
        ) {

            localStorage.setItem(
                "currentUser",
                JSON.stringify({
                    username: officer.username,
                    role: "officer",
                    memberId: null
                })
            );

            window.location.href = "dashboard.html";
            return;
        }

        // =================================
        // CHECK COMMANDER ACCOUNT
        // =================================

        let commanders = [];

        try {
            commanders = JSON.parse(
                localStorage.getItem("commanders") || "[]"
            );
        } catch (error) {
            commanders = [];
        }

        const commander = commanders.find(item =>
            String(item.commanderId) === username &&
            String(item.status).toLowerCase() === "active"
        );

        if (!commander) {
            showLoginError("Account not found or inactive.");
            return;
        }

        // =================================
        // FIRST-TIME PASSWORD SETUP
        // =================================

        if (!commander.password || commander.mustSetPassword) {

            localStorage.setItem(
                "pendingCommanderId",
                username
            );

            window.location.href = "set-password.html";
            return;
        }

        // =================================
        // VERIFY COMMANDER PASSWORD
        // =================================

        if (commander.password !== password) {
            showLoginError("Incorrect password.");
            return;
        }

        // =================================
        // COMMANDER LOGIN SUCCESSFUL
        // =================================

        localStorage.setItem(
            "currentUser",
            JSON.stringify({
                username: username,
                role: "commander",
                memberId: commander.commanderId
            })
        );

        window.location.href = "dashboard.html";

    });

}

// =====================================
// DISPLAY LOGIN ERROR
// =====================================

function showLoginError(message) {

    if (!loginError) return;

    loginError.textContent = message;
    loginError.style.display = "block";
    loginError.hidden = false;

}
