const registerForm = document.getElementById("registerForm");
const messageBox = document.getElementById("registerMessage")
const password = document.getElementById("password");
const confirmPassword = document.getElementById("confirm_password");
const matchMessage = document.querySelector(".match_message");

// Checking password matches
function checkMatch() {
    if (confirmPassword.value === "") {
        confirmPassword.setCustomValidity("");
        matchMessage.textContent = "";
        return;
    }

    if (password.value !== confirmPassword.value) {
        confirmPassword.setCustomValidity("Passwords do not match");
        matchMessage.textContent = "Passwords do not match";
        matchMessage.className = "match_message no_match";
    } else {
        confirmPassword.setCustomValidity("");
        matchMessage.textContent = "Passwords match ✓";
        matchMessage.className = "match_message match";
    }
};

// Re-check whenever either box changes
password.addEventListener("input", checkMatch);
confirmPassword.addEventListener("input", checkMatch);

// Show/hide toggle (reveals both boxes together)
const toggleBtn = document.querySelector(".toggle_password");
toggleBtn.addEventListener("click", () => {
    const isHidden = password.type === "password";
    const newType = isHidden ? "text" : "password";
    password.type = newType;
    confirmPassword.type = newType;
    toggleBtn.textContent = isHidden ? "Hide" : "Show";
    toggleBtn.setAttribute("aria-label", isHidden ? "Hide passwords" : "Show passwords");
    toggleBtn.setAttribute("aria-pressed", String(isHidden));
});

registerForm.addEventListener("submit", registerUser)

function registerUser(evt) {
    // stops page from reloading
    evt.preventDefault();
    messageBox.textContent = "";

    const username = document.getElementById("username").value.trim();
    const fname = document.getElementById("fname").value.trim();
    const lname = document.getElementById("lname").value.trim();
    const email = document.getElementById("email").value.trim();

    // creates the account and runs Supabase replies
    db.auth.signUp({
        email: email,
        password: password.value,
        options: {data: { username: username, fname: fname, lname: lname} }
    }).then(function(result) {
        if (result.error) {
            messageBox.textContent = result.error.message;
        } else {
            // user is logged in
            window.location.href = "Home.html"
        }
    }).catch(function() {
        messageBox.textContent = "Could not connect, please try again later."
    })
}