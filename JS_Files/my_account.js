// =====================================================================
// My Account page
//  - Not logged in  -> shows the "please sign up or log in" message + buttons
//  - Logged in      -> shows ONLY the current user's details, which they
//                      can view and edit, plus change password and log out
// =====================================================================

// Everything is wrapped in a function so these variable names can't clash
// with ones declared in supabase_client.js or navbar.js
(() => {
   
    // details saved in the user's auth metadata (options.data at sign-up).
    const PROFILE_TABLE = "userinfo";
    const PROFILE_COLUMNS = {
        id: "user_id",            // links to auth.users.id
        username: "username",
        firstName: "fname",
        lastName: "lname",
        points: "emission_points" // shown on the page but not editable
    };
    // -----------------------------------------------------------------------------

    // "db" is the Supabase client created in supabase_client.js

    // ---------- Grab elements from the page ----------
    const loadingView   = document.getElementById("accountLoading");
    const loggedOutView = document.getElementById("loggedOutView");
    const loggedInView  = document.getElementById("loggedInView");

    const detailsForm    = document.getElementById("detailsForm");
    const usernameInput  = document.getElementById("username");
    const fnameInput     = document.getElementById("fname");
    const lnameInput     = document.getElementById("lname");
    const emailInput     = document.getElementById("email");
    const emailHint      = document.getElementById("emailHint");
    const memberSince    = document.getElementById("memberSince");
    const emissionPoints = document.getElementById("emissionPoints");
    const detailsMessage = document.getElementById("detailsMessage");
    const editButton     = document.getElementById("editButton");
    const editActions    = document.getElementById("editActions");
    const cancelButton   = document.getElementById("cancelButton");
    const saveButton     = document.getElementById("saveButton");

    const passwordForm    = document.getElementById("passwordForm");
    const newPassword     = document.getElementById("new_password");
    const confirmPassword = document.getElementById("confirm_new_password");
    const passwordMessage = document.getElementById("passwordMessage");
    const togglePassword  = passwordForm.querySelector(".toggle_password");

    const logoutButton = document.getElementById("logoutButton");

    const editableInputs = [usernameInput, fnameInput, lnameInput, emailInput];

    // The logged-in user and their details as they are saved right now
    let currentUser = null;
    let savedDetails = { username: "", firstName: "", lastName: "", email: "" };
    let usingProfileTable = false; // true if details came from the profiles table

    // ---------- Helper functions ----------
    function showView(view) {
        loadingView.hidden   = view !== "loading";
        loggedOutView.hidden = view !== "loggedOut";
        loggedInView.hidden  = view !== "loggedIn";
    }

    function showMessage(element, text, type) {
        element.textContent = text;
        element.classList.remove("success", "error");
        if (type) element.classList.add(type);
    }

    function fillForm(details) {
        usernameInput.value = details.username;
        fnameInput.value    = details.firstName;
        lnameInput.value    = details.lastName;
        emailInput.value    = details.email;
    }

    function setEditing(isEditing) {
        editableInputs.forEach(input => { input.readOnly = !isEditing; });
        editActions.hidden = !isEditing;
        emailHint.hidden   = !isEditing;
        editButton.hidden  = isEditing;
        if (isEditing) usernameInput.focus();
    }

    // ---------- Load the logged-in user's details ----------
    async function loadAccount() {
        showView("loading");

        if (!db) {
            showView("loggedOut");
            return;
        }

        // getUser() checks the session with Supabase, so it can't be faked locally
        const { data, error } = await db.auth.getUser();
        if (error || !data || !data.user) {
            showView("loggedOut");
            return;
        }

        currentUser = data.user;
        const meta = currentUser.user_metadata || {};

        // Start with what's saved in the auth metadata
        savedDetails = {
            username:  meta.username   || "",
            firstName: meta.first_name || meta.fname || "",
            lastName:  meta.last_name  || meta.lname || "",
            email:     currentUser.email || ""
        };

        // Then try the profiles table - only ever for THIS user's id
        const { data: profile, error: profileError } = await db
            .from(PROFILE_TABLE)
            .select("*")
            .eq(PROFILE_COLUMNS.id, currentUser.id)
            .maybeSingle();

        if (!profileError && profile) {
            usingProfileTable = true;
            savedDetails.username  = profile[PROFILE_COLUMNS.username]  ?? savedDetails.username;
            savedDetails.firstName = profile[PROFILE_COLUMNS.firstName] ?? savedDetails.firstName;
            savedDetails.lastName  = profile[PROFILE_COLUMNS.lastName]  ?? savedDetails.lastName;
            emissionPoints.textContent = profile[PROFILE_COLUMNS.points] ?? 0;
        } else if (profileError) {
            console.warn("Couldn't read profile table, using auth metadata instead:", profileError.message);
        }

        fillForm(savedDetails);
        memberSince.textContent = new Date(currentUser.created_at).toLocaleDateString("en-GB", {
            day: "numeric", month: "long", year: "numeric"
        });

        setEditing(false);
        showView("loggedIn");
    }

    // ---------- Edit / cancel / save details ----------
    editButton.addEventListener("click", () => {
        showMessage(detailsMessage, "");
        setEditing(true);
    });

    cancelButton.addEventListener("click", () => {
        fillForm(savedDetails);
        showMessage(detailsMessage, "");
        setEditing(false);
    });

    detailsForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        if (!currentUser) return;

        const updated = {
            username:  usernameInput.value.trim(),
            firstName: fnameInput.value.trim(),
            lastName:  lnameInput.value.trim(),
            email:     emailInput.value.trim()
        };

        // Basic checks
        if (!updated.username || !updated.firstName || !updated.lastName || !updated.email) {
            showMessage(detailsMessage, "Please fill in all of the fields.", "error");
            return;
        }
        if (!emailInput.checkValidity()) {
            showMessage(detailsMessage, "Please enter a valid email address.", "error");
            return;
        }

        saveButton.disabled = true;
        showMessage(detailsMessage, "Saving...");

        try {
            // 1. Update the profiles table (only this user's row)
            if (usingProfileTable) {
                const { error } = await db
                    .from(PROFILE_TABLE)
                    .update({
                        [PROFILE_COLUMNS.username]:  updated.username,
                        [PROFILE_COLUMNS.firstName]: updated.firstName,
                        [PROFILE_COLUMNS.lastName]:  updated.lastName
                    })
                    .eq(PROFILE_COLUMNS.id, currentUser.id);
                if (error) throw error;
            }

            // 2. Keep the auth metadata in sync, and change the email if it changed
            const authUpdate = {
                data: {
                    username:   updated.username,
                    first_name: updated.firstName,
                    last_name:  updated.lastName
                }
            };
            const emailChanged = updated.email.toLowerCase() !== savedDetails.email.toLowerCase();
            if (emailChanged) authUpdate.email = updated.email;

            const { error: authError } = await db.auth.updateUser(authUpdate);
            if (authError) throw authError;

            // Email only actually changes once the user clicks the confirmation link
            savedDetails = { ...updated, email: emailChanged ? savedDetails.email : updated.email };
            fillForm(savedDetails);
            setEditing(false);

            showMessage(
                detailsMessage,
                emailChanged
                    ? "Details saved. Check your new email inbox to confirm the change of email address."
                    : "Your details have been saved.",
                "success"
            );
        } catch (err) {
            // 23505 = unique constraint, e.g. username already taken
            const text = err.code === "23505"
                ? "That username is already taken, please choose another."
                : "Sorry, we couldn't save your details: " + err.message;
            showMessage(detailsMessage, text, "error");
        } finally {
            saveButton.disabled = false;
        }
    });

    // ---------- Change password ----------
    togglePassword.addEventListener("click", () => {
        const show = newPassword.type === "password";
        newPassword.type = confirmPassword.type = show ? "text" : "password";
        togglePassword.textContent = show ? "Hide" : "Show";
        togglePassword.setAttribute("aria-pressed", String(show));
        togglePassword.setAttribute("aria-label", show ? "Hide passwords" : "Show passwords");
    });

    passwordForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        if (newPassword.value.length < 8) {
            showMessage(passwordMessage, "Your password must be at least 8 characters long.", "error");
            return;
        }
        if (newPassword.value !== confirmPassword.value) {
            showMessage(passwordMessage, "The passwords don't match.", "error");
            return;
        }

        showMessage(passwordMessage, "Updating password...");
        const { error } = await db.auth.updateUser({ password: newPassword.value });

        if (error) {
            showMessage(passwordMessage, "Sorry, we couldn't update your password: " + error.message, "error");
        } else {
            passwordForm.reset();
            showMessage(passwordMessage, "Your password has been updated.", "success");
        }
    });

    // ---------- Log out ----------
    logoutButton.addEventListener("click", async () => {
        await db.auth.signOut();
        window.location.href = "Login.html";
    });

    // If the user logs out in another tab, switch to the logged-out message
    if (db) {
        db.auth.onAuthStateChange((authEvent) => {
            if (authEvent === "SIGNED_OUT") {
                currentUser = null;
                showView("loggedOut");
            }
        });
    }

    loadAccount();
})();
