'use strict';

const resetForm = document.getElementById("resetForm");
const resetMessage = document.getElementById("resetMessage");
const linkMessage = document.getElementById("linkMessage");
const newPassword = document.getElementById("password");
const confirmPassword = document.getElementById("confirm_password");
const toggleBtn = document.querySelector(".toggle_password");

// shows both passwords when clicked
toggleBtn.addEventListener("click", () => {
    const isHidden = newPassword.type === "password";
    newPassword.type = confirmPassword.type = isHidden ? "text" : "password";
    toggleBtn.textContent = isHidden ? "Hide" : "Show";
    toggleBtn.setAttribute("aria-label", isHidden ? "Hide passwords" : "Show passwords");
    toggleBtn.setAttribute("aria-pressed", String(isHidden));
});

// Supabase reads the reset link from the address bar and logs the user in for this reset.
// If there's no session, the link is missing, already used or expired.
db.auth.getSession().then(function(result) {
    if (result.data.session === null) {
        linkMessage.innerHTML = 'This reset link is invalid or has expired. <a href="Forgot_Password.html">Request a new one</a>.';
        return;
    }

    // valid link, so show the form
    linkMessage.hidden = true;
    resetForm.hidden = false;
});

resetForm.addEventListener("submit", saveNewPassword);

async function saveNewPassword(evt) {
    // stops page from reloading
    evt.preventDefault();
    resetMessage.textContent = "";
    resetMessage.classList.remove("success");

    // same rules as the register page
    if (newPassword.value.length < 8) {
        resetMessage.textContent = "Password must be at least 8 characters long.";
        return;
    }

    if (newPassword.value !== confirmPassword.value) {
        resetMessage.textContent = "Passwords do not match.";
        return;
    }

    const { error } = await db.auth.updateUser({ password: newPassword.value });

    if (error) {
        console.error(error);
        resetMessage.textContent = "Could not update your password: " + error.message;
        return;
    }

    // signs out so they log in with the new password
    await db.auth.signOut();

    resetForm.hidden = true;
    linkMessage.hidden = false;
    linkMessage.classList.add("success");
    linkMessage.innerHTML = 'Your password has been reset. <a href="Login.html">Sign in</a> with your new password.';
}