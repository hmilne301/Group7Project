'use strict';

const body = document.getElementById("leaderboardBody");
const message = document.getElementById("leaderboardMessage");
const yourRank = document.getElementById("yourRank");

// setting id as null initially
let myId = null;

// checks who is logged in
db.auth.getSession().then(function(result) {

    if (result.data.session === null){
        // no user is logged in
        window.location.href = "Login.html";
        return;
    }

    // storing user id and calling loadLeaderboard function
    myId = result.data.session.user.id;
    loadLeaderboard();
});

// highest points selected first
// only the important columns are selected for use
function loadLeaderboard() {
    db.from("userinfo")
        .select("user_id, username, emission_points")
        .order("emission_points", { ascending: false})
        .then(function(result) {
            if (result.error) {
                message.textContent = "Could not load the leaderboard.";
                return;
            }
            showLeaderboard(result.data);
        });
}

// builds table
function showLeaderboard(users) {
    body.replaceChildren();
    yourRank.textContent = "";
    message.textContent = "";

    // checking if any users are found
    if (users.length === 0) {
        message.textContent = "No users"
        return;
    }

    let rank = 0;
    let previousPoints = null;

    for (let i = 0; i < users.length; i++) {
        const user = users[i];

        if (user.emission_points !== previousPoints) {
            rank = i + 1;
            previousPoints = user.emission_points;
        }

        const row = document.createElement("tr");
        const rankCell = document.createElement("td");
        const nameCell = document.createElement("td");
        const pointsCell = document.createElement("td");

        rankCell.textContent = rank;
        nameCell.textContent = user.username;
        pointsCell.textContent = user.emission_points;

        row.appendChild(rankCell);
        row.appendChild(nameCell);
        row.appendChild(pointsCell);

        if (user.user_id === myId) {
            row.classList.add("my_row");
            nameCell.textContent = user.username + " (you)";
            yourRank.textContent = "Your rank: " + rank + " with " + user.emission_points + " points";
        }

        body.appendChild(row);
    }
}