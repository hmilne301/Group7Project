'use strict';

const body = document.getElementById("leaderboardBody");
const message = document.getElementById("leaderboardMessage");
const yourRank = document.getElementById("yourRank");
const globalTab = document.getElementById("globalTab")
const friendsTab = document.getElementById("friendsTab")

// setting id as null initially
let myId = null;

// checks who is logged in
db.auth.getSession().then(function(result) {

    if (result.data.session === null){
        // no user is logged in
        window.location.href = "Login.html";
        return;
    }

    // storing user id and calling loadGlobalLeaderboard function
    myId = result.data.session.user.id;
    loadGlobalLeaderboard();
});

// global button clicked
globalTab.addEventListener("click", function(){
    setActiveTab(globalTab, friendsTab);
    loadGlobalLeaderboard();
})

// friends button clicked
friendsTab.addEventListener("click", function(){
    setActiveTab(friendsTab, globalTab);
    loadFriendsLeaderboard();
})

function setActiveTab(active, inactive){
    active.setAttribute("aria-pressed", "true");
    inactive.setAttribute("aria-pressed", "false");
}

// highest points selected first
// only the important columns are selected for use
function loadGlobalLeaderboard() {
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

// only loads users who are friends with the logged in user
function loadFriendsLeaderboard() {
    // finds the accepted friendship which involves logged in user
    db.from("friends")
        .select("requester_id, receiver_id")
        .eq("status", "accepted")
        .or("requester_id.eq." + myId + ",receiver_id.eq." + myId)
        .then(function(result) {
            if (result.error) {
                message.textContent = "Could not load friends.";
                return;
            }
            
            // builds list of ids which include user and the other person in the friendship
            const ids = [myId];
            for (let i = 0; i < result.data.length; i++) {
                const row = result.data[i];
                if (row.requester_id === myId) {
                    ids.push(row.receiver_id);
                } else {
                    ids.push(row.requester_id);
                }
            }

            // gets just those users (same way as global)
            db.from("userinfo")
                .select("user_id, username, emission_points")
                .in("user_id", ids)
                .order("emission_points", { ascending: false})
                .then(function(result) {
                    if (result.error) {
                        message.textContent = "Could not load the leaderboard.";
                        return;
                    }
                    showLeaderboard(result.data, "Your rank among friends");
                
                    // no friends yet
                    if (ids.length === 1) {
                        message.textContent = "You have no friends.";
                    }
            });
        });
}

// builds table
function showLeaderboard(users, rankMessage = "Your rank") {
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
            yourRank.textContent = rankMessage + ": #" + rank + " with " + user.emission_points + " points";
        }

        body.appendChild(row);
    }
}