'use strict'

const passwordInput = document.getElementById("password");
const toggleBtn = document.querySelector(".toggle_password");
const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage")

// shows password when clicked
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

    // logs in to account and runs Supabase replies
    db.auth.signInWithPassword({
        email: email,
        password: password.value
    }).then(function(result) {
        if (result.error) {
            loginMessage.textContent = "Incorrect email or password.";
        } else {
            // user is logged in
            window.location.href = getRedirectPage();
        }
    }).catch(function() {
        loginMessage.textContent = "Could not connect, please try again later."
    })
}

// Works out where to send the user after they log in / sign up
function getRedirectPage() {
    const fallback = "Home.html"; // where to go if there's no redirect
    const redirect = new URLSearchParams(window.location.search).get("redirect");
    if (!redirect) return fallback;

    try {
        const url = new URL(redirect, window.location.origin);
        // Only allow pages on our own site, and never loop back to login/register
        if (url.origin !== window.location.origin) return fallback;
        if (/\/(Login|Register)\.html$/i.test(url.pathname)) return fallback;
        return url.pathname + url.search + url.hash;
    } catch {
        return fallback;
    }
}