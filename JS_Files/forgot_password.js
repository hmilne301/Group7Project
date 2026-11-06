'use strict';

const forgotForm = document.getElementById("forgotForm");
const forgotMessage = document.getElementById("forgotMessage");
const sendButton = forgotForm.querySelector("button[type=submit]");

forgotForm.addEventListener("submit", sendResetLink);

async function sendResetLink(evt) {
    // stops page from reloading
    evt.preventDefault();
    forgotMessage.textContent = "";
    forgotMessage.classList.remove("success");

    const email = document.getElementById("email").value.trim();

    // checks an email has been entered
    if (email === "" || !email.includes("@")) {
        forgotMessage.textContent = "Please enter a valid email address.";
        return;
    }

    sendButton.disabled = true;
    forgotMessage.textContent = "Sending...";

    // the link in the email opens Reset_Password.html in the same folder as this page
    const resetPage = new URL("Reset_Password.html", window.location.href).href;

    try {
        const { error } = await db.auth.resetPasswordForEmail(email, { redirectTo: resetPage });

        if (error) {
            console.error(error);
            forgotMessage.textContent = "Could not send the email, please try again later.";
            sendButton.disabled = false;
            return;
        }

        // same message whether or not the account exists, so people can't check who has signed up
        forgotMessage.textContent = "If an account exists for " + email + ", a reset link has been sent. Check your inbox and spam folder.";
        forgotMessage.classList.add("success");
        forgotForm.reset();
    } catch (err) {
        console.error(err);
        forgotMessage.textContent = "Could not connect, please try again later.";
    }

    sendButton.disabled = false;
}