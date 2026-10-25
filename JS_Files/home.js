'use strict'

const links = document.getElementById("links")
const welcomeContent = document.getElementById("userWelcome")
const welcomeMessage = document.getElementById("welcomeMessage")

// checks if anyone is logged in
db.auth.getSession().then(function(result) {
    const session = result.data.session;

    if (session === null) {
        // not logged in
        links.style.display = "block";
    } else {
        const details = session.user.user_metadata;
        const username = details.username;
        welcomeMessage.textContent = "Welcome, " + username + "!";
        welcomeContent.style.display = "block";
        links.style.display = "none";
    }
})