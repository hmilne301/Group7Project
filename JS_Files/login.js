'use strict'

const passwordInput = document.getElementById("password");
const toggleBtn = document.querySelector(".toggle_password");
const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage")

toggleBtn.addEventListener("click", () => {
    const isHidden = passwordInput.type === "password";
    passwordInput.type = isHidden ? "text" : "password";
    toggleBtn.textContent = isHidden ? "Hide" : "Show";
    toggleBtn.setAttribute("aria-label", isHidden ? "Hide password" : "Show password");
    toggleBtn.setAttribute("aria-pressed", String(isHidden));
});

loginForm.addEventListener("submit", loginUser)

function loginUser(evt) {
    // stops page from reloading
    evt.preventDefault();
    loginMessage.textContent = "";

    const email = document.getElementById("email").value.trim();

    // creates the account and runs Supabase replies
    db.auth.signInWithPassword({
        email: email,
        password: password.value
    }).then(function(result) {
        if (result.error) {
            loginMessage.textContent = "Incorrect email or password.";
        } else {
            // user is logged in
            window.location.href = "Home.html"
        }
    }).catch(function() {
        loginMessage.textContent = "Could not connect, please try again later."
    })
}