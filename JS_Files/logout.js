const logout = document.getElementById("logout")

// allows user to log out and redirects then to login page
function logoutUser() {
    db.auth.signOut().then(function() {
        window.location.href = "Login.html";
    });
}

logout.addEventListener("click", logoutUser);