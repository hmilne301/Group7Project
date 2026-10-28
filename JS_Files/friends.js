'use strict';

const message = document.getElementById("friendsMessage");
const addFriendMessage = document.getElementById("addMessage");
const friendsList = document.getElementById("friendsList");
const friendForm = document.getElementById("addFriendForm");
const requestList = document.getElementById("requestList");
const requestMessage = document.getElementById("requestsMessage");

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
    loadRequests();
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
                        message.textContent = "Could not load the requests list.";
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
        const removeButton = document.createElement("button");
        const span = document.createElement("span");

        removeButton.textContent = "Remove Friend";
        removeButton.className = "remove_friend_button";

        removeButton.addEventListener("click", function() {
            removeFriend(user.user_id, li)
        })

        span.textContent = user.username;
        li.appendChild(span);
        li.appendChild(removeButton);
        friendsList.appendChild(li);
    }
}

// creates event listener for when the add friends form is submitted
friendForm.addEventListener("submit", addFriends)

// allows users to send a friend request to other user
function addFriends(evt){
    // stops page from reloading
    evt.preventDefault();
    addFriendMessage.textContent = "";

    const username = document.getElementById("username").value.trim();

    if (username === ""){
        addFriendMessage.textContent = "Please enter a username.";
        return;
    }

    db.from("userinfo")
        .select("user_id, username")
        .ilike("username", username) // ignores capitalisation
        .maybeSingle() // returns a single row or null if nobody matches search
        .then(function(result) {
            if(result.error) {
                addFriendMessage.textContent = "Could not look up that user.";
                return;
            }

            // checks if no one has that username and if so message is returned
            if (result.data === null) {
                addFriendMessage.textContent = "No user found with that username."
                return;
            }

            // storing the found users details
            const foundUser = result.data;

            // checking if friend requested user is the logged in user
            if (foundUser.user_id === myId){
                addFriendMessage.textContent = "Cannot add yourself"
                return;
            }

            db.from("friends")
                .select("status, requester_id")
                .or(
                    "and(requester_id.eq." + myId + ",receiver_id.eq." + foundUser.user_id + ")," +
                    "and(requester_id.eq." + foundUser.user_id + ",receiver_id.eq." + myId + ")"
                )
                .maybeSingle()
                .then(function(existing) {
                    if(existing.error) {
                        addFriendMessage.textContent = "Could not check existing friends.";
                        return;
                    }

                if (existing.data !== null) {
                    const row = existing.data;

                    if (row.status === "accepted") {
                        addFriendMessage.textContent = "You are already Friends."
                    } else if (row.status === "pending" && row.requester_id === myId) {
                        addFriendMessage.textContent = "A request has already been sent."
                    } else if (row.status === "pending") {
                        addFriendMessage.textContent = "This user has already sent you a friend request, check below."
                    } else {
                        addFriendMessage.textContent = "You can't send a request to this user."
                    }
                    return;
                }

                db.from("friends")
                    .insert({ requester_id:  myId, receiver_id: foundUser.user_id})
                    .then(function(result) {
                        if(result.error) {
                            addFriendMessage.textContent = "Could not send friend request.";
                            return;
                        }

                        addFriendMessage.textContent = "Request Sent to " + username;
                        friendForm.reset();
                    })
                });
            })
        .catch(function() {
            addFriendMessage.textContent = "Could not connect, please try again later";
        })
    }

// gets requests
function loadRequests(){
    // finds the pending friendship which involves logged in user
    db.from("friends")
        .select("requester_id")
        .eq("status", "pending")
        .eq("receiver_id", myId)
        .then(function(result) {
            if (result.error) {
                requestMessage.textContent = "Could not load requests.";
                return;
            }
            
            // builds list of ids which includes the other person in the pending friendship
            const ids = [];
            for (let i = 0; i < result.data.length; i++) {
                const row = result.data[i];
                ids.push(row.requester_id);
            }

            // no friends requests yet
            if (ids.length === 0) {
                requestList.replaceChildren();
                requestMessage.textContent = "You have no requests.";
                return;
            }

            // gets just those users
            db.from("userinfo")
                .select("user_id, username")
                .in("user_id", ids)
                .then(function(result) {
                    if (result.error) {
                        requestMessage.textContent = "Could not load the friends list.";
                        return;
                    }
                    showRequests(result.data);
            });
        });
}

// shows requests
function showRequests(users){
    requestList.replaceChildren();
    requestMessage.textContent = "";

    // checking if any users are found
    if (users.length === 0) {
        message.textContent = "No Requests";
        return;
    }

    for (let i = 0; i < users.length; i++) {
        const user = users[i];
        const li = document.createElement("li");
        const acceptButton = document.createElement("button");
        const rejectButton = document.createElement("button");
        const span = document.createElement("span");

        acceptButton.textContent = "Accept";
        acceptButton.className = "accept_request_button";
        
        // creating event listener for each accept button
        acceptButton.addEventListener("click", function() {
            acceptRequest(user.user_id, li)
        })

        rejectButton.textContent = "Reject";
        rejectButton.className = "reject_request_button";

        // creating event listener for each reject button
        rejectButton.addEventListener("click", function() {
            rejectRequest(user.user_id, li)
        })

        span.textContent = user.username;

        li.appendChild(span)
        li.appendChild(acceptButton);
        li.appendChild(rejectButton);
        requestList.appendChild(li);
    }
}

// allows users to accept requests
function acceptRequest(requesterId, listItem){
    db.from("friends")
        .update({ status: "accepted", response_date: new Date().toISOString })
        .eq("requester_id", requesterId)
        .eq("receiver_id", myId)
        .then(function(result) {
            if (result.error) {
                requestMessage.textContent = "Could not accept request."
                return;
            }
            // remove the pending list
            listItem.remove();
            // refreshs the active friends
            loadFriends();
        })
}

// allows users to reject requests
function rejectRequest(requesterId, listItem){
    db.from("friends")
        .update({ status: "rejected", response_date: new Date().toISOString })
        .eq("requester_id", requesterId)
        .eq("receiver_id", myId)
        .then(function(result) {
            if (result.error) {
                requestMessage.textContent = "Could not reject request."
                return;
            }
            // remove the pending list
            listItem.remove();
        })
}

// allows users to remove friends
function removeFriend(friendId, listItem){

}