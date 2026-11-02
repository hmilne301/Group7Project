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

    // clears previous error messages
    document.querySelectorAll(".validation_error").forEach(function(error) {
        error.textContent = "";
    });

    // checks username input
    if (username === "") {
        document.getElementById("usernameError").textContent = "Please enter a username";
        return;
    }

    // checks first name input
    if (fname === "") {
        document.getElementById("fnameError").textContent = "Please enter your first name";
        return;
    }

    // checks last name input
    if (lname === "") {
        document.getElementById("lnameError").textContent = "Please enter your last name";
        return;
    }

    // checks email input
    if (email === "") {
        document.getElementById("emailError").textContent = "Please enter your email address";
        return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        document.getElementById("emailError").textContent = "Please enter a valid email address.";
        return;
    }

    // checks password
    if (password.value === "") {
        document.getElementById("passwordError").textContent = "Please create a password";
        return;
    }

    if (password.value.length < 8) {
        document.getElementById("passwordError").textContent = "Password must be at least 8 characters long.";
        return;
    }

    if (password.isUpperCase){
        
    }


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