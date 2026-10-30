const logoutButton = document.getElementById("logoutButton")

// allows user to log out and redirects then to login page
function logoutUser() {
    db.auth.signOut().then(function() {
        window.location.href = "Login.html";
    });
}

logoutButton.addEventListener("click", logoutUser);