'use strict';

const message = document.getElementById("friendsMessage");
const friendsList = document.getElementById("friendsList");

// setting id as null initially
let myId = null;

// checks who is logged in
db.auth.getSession().then(function(result) {

    if (result.data.session === null){
        // no user is logged in
        window.location.href = "Login.html";
        return;
    }

    // storing user id and calling loadFriends function
    myId = result.data.session.user.id;
    loadFriends();
});

function loadFriends() {
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
            
            // builds list of ids which includes the other person in the friendship
            const ids = [];
            for (let i = 0; i < result.data.length; i++) {
                const row = result.data[i];
                if (row.requester_id === myId) {
                    ids.push(row.receiver_id);
                } else {
                    ids.push(row.requester_id);
                }
            }

            // no friends yet
            if (ids.length === 0) {
                friendsList.replaceChildren();
                message.textContent = "You have no friends.";
                return;
            }

            // gets just those users
            db.from("userinfo")
                .select("user_id, username")
                .in("user_id", ids)
                .then(function(result) {
                    if (result.error) {
                        message.textContent = "Could not load the friends list.";
                        return;
                    }
                    showFriends(result.data);
            });
        });
}

function showFriends(users){
    friendsList.replaceChildren();
    message.textContent = "";

    // checking if any users are found
    if (users.length === 0) {
        message.textContent = "No Friends";
        return;
    }

    for (let i = 0; i < users.length; i++) {
        const user = users[i];
        const li = document.createElement("li");

        li.textContent = user.username;
        friendsList.appendChild(li);
    }
}

// allows users to send a friend request to other user
function addFriends(){

}

// displays requests
function showRequests(){

}

// allows users to accept requests
function acceptRequest(){

}

// allows users to reject requests
function rejectRequest(){

}