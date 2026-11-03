'use strict';

// =====================================================================
// Achievements page
//  - The list of achievements comes from the "achievement" table
//  - Progress is worked out from the logged-in user's rows in "activity"
//    and "userinfo"
//  - Earned achievements are recorded in the "earns" table
//  - Not logged in -> everything shows as not earned, with a log in prompt
// =====================================================================

// Wrapped in a function so these names can't clash with supabase_client.js or navbar.js
(() => {

    // "db" is the Supabase client created in supabase_client.js

    // Icons live in the Images folder; the file name is stored in achievement.icon
    const ICON_FOLDER = "../Images/";

    // Achievements that need an account show a button instead of a progress bar
    // when the user hasn't earned them. Keys match achievement.criteria_type.
    const ACCOUNT_BUTTONS = {
        registered:         { label: "Create an Account",           href: "Register.html" },
        joined_leaderboard: { label: "Sign Up To Join Leaderboard", href: "Register.html" }
    };

    // ---------- Grab elements from the page ----------
    const earnedList = document.getElementById("earnedList");
    const nextList   = document.getElementById("nextList");
    const summary    = document.getElementById("pointsSummary");
    const message    = document.getElementById("achievementsMessage");

    // ---------- Helper functions ----------
    function showMessage(text, withLoginLink) {
        message.textContent = text;
        if (withLoginLink) {
            // send the user back to this page after logging in (login.js supports ?redirect=)
            const back = encodeURIComponent(window.location.pathname + window.location.search);
            const link = document.createElement("a");
            link.href = "Login.html?redirect=" + back;
            link.textContent = "Log in";
            message.appendChild(document.createTextNode(" "));
            message.appendChild(link);
        }
    }

    function addEmptyMessage(list, text) {
        const item = document.createElement("li");
        item.className = "empty_message";
        item.textContent = text;
        list.appendChild(item);
    }

    // ---------- Load data from Supabase ----------
    async function loadAchievements() {
        const { data, error } = await db
            .from("achievement")
            .select("*")
            .order("points", { ascending: true });
        if (error) throw error;

        // Only keep achievements that have a usable target number
        return (data || []).filter(function (row) {
            if (!Number(row.criteria_value)) {
                console.warn("Skipping achievement with no criteria_value:", row.achievement_name);
                return false;
            }
            return true;
        });
    }

    async function loadStats(user) {
        const stats = {
            activities_logged: 0,
            days_logged: 0,
            registered: 0,
            emission_points: 0,
            joined_leaderboard: 0
        };
        if (!user) return stats;

        // Having an account counts as registered and as being on the leaderboard
        stats.registered = 1;
        stats.joined_leaderboard = 1;

        // Only ever this user's rows
        const { data: activities, error: activityError } = await db
            .from("activity")
            .select("activity_date")
            .eq("user_id", user.id);
        if (activityError) throw activityError;

        stats.activities_logged = activities.length;
        stats.days_logged = new Set(activities.map(function (a) { return a.activity_date; })).size;

        const { data: profile, error: profileError } = await db
            .from("userinfo")
            .select("emission_points")
            .eq("user_id", user.id)
            .maybeSingle();
        if (profileError) throw profileError;

        stats.emission_points = profile ? Number(profile.emission_points) || 0 : 0;
        return stats;
    }

    async function loadEarnedIds(user) {
        if (!user) return new Set();

        const { data, error } = await db
            .from("earns")
            .select("achievement_id")
            .eq("user_id", user.id);
        if (error) throw error;

        return new Set(data.map(function (row) { return row.achievement_id; }));
    }

    // Saves achievements the user has just reached into the "earns" table.
    // If the database refuses (e.g. a policy only allows reading) the page still
    // shows them as earned, it just can't save them.
    async function recordNewlyEarned(user, newlyEarned) {
        if (!user || newlyEarned.length === 0) return 0;

        const rows = newlyEarned.map(function (a) {
            return { user_id: user.id, achievement_id: a.achievement_id };
        });

        // .select() gives back only the rows that were really inserted,
        // so achievements already saved are never counted twice
        const { data: saved, error } = await db
            .from("earns")
            .upsert(rows, { onConflict: "user_id,achievement_id", ignoreDuplicates: true })
            .select("achievement_id");
        if (error) {
            console.warn("Couldn't save earned achievements:", error.message);
            return 0;
        }

        // add up the points for the achievements that were just saved
        let added = 0;
        saved.forEach(function (row) {
            const match = newlyEarned.find(function (a) {
                return a.achievement_id === row.achievement_id;
            });
            if (match) added += Number(match.points) || 0;
        });
        if (added === 0) return 0;

        // read the current total, then save the new one
        const { data: profile } = await db
            .from("userinfo")
            .select("emission_points")
            .eq("user_id", user.id)
            .single();
        const newTotal = (Number(profile.emission_points) || 0) + added;

        const { data: updated, error: updateError } = await db
            .from("userinfo")
            .update({ emission_points: newTotal })
            .eq("user_id", user.id)
            .select();

        // RLS can block an update without an error, so check a row came back
        if (updateError || !updated || updated.length === 0) {
            console.warn("Couldn't update emission points");
            return 0;
        }
        return added;
    }

    // ---------- Build the page ----------
    function buildCard(achievement, current, earned) {
        const target = Number(achievement.criteria_value);
        const button = ACCOUNT_BUTTONS[achievement.criteria_type];

        const item = document.createElement("li");
        item.className = "achievement_card";
        if (earned) {
            item.classList.add("earned");
        } else if (button) {
            item.classList.add("locked");
        }

        if (achievement.icon) {
            const icon = document.createElement("img");
            icon.className = "achievement_icon";
            icon.src = ICON_FOLDER + achievement.icon;
            icon.alt = "";            // decorative, the title says it all
            icon.width = 48;
            icon.height = 48;
            // if the file is missing, hide the broken image instead of showing a gap
            icon.addEventListener("error", function () { icon.hidden = true; });
            item.appendChild(icon);
        }

        const title = document.createElement("h3");
        title.textContent = achievement.achievement_name;
        item.appendChild(title);

        const description = document.createElement("p");
        description.className = "achievement_description";
        description.textContent = achievement.achievement_description || "";
        item.appendChild(description);

        const points = document.createElement("p");
        points.className = "achievement_points";
        points.textContent = achievement.points + " points";
        item.appendChild(points);

        if (!earned && button) {
            const link = document.createElement("a");
            link.className = "achievement_button";
            link.href = button.href;
            link.textContent = button.label;
            item.appendChild(link);
            return item;
        }

        const shown = Math.min(current, target);

        const bar = document.createElement("progress");
        bar.max = target;
        bar.value = shown;
        bar.setAttribute("aria-label", achievement.achievement_name + " progress");
        item.appendChild(bar);

        const label = document.createElement("p");
        label.className = "progress_label";
        label.textContent = earned ? "Completed" : shown + " / " + target;
        item.appendChild(label);

        return item;
    }

    function render(achievements, stats, earnedIds, user) {
        earnedList.innerHTML = "";
        nextList.innerHTML = "";

        let totalPoints = 0;
        let earnedCount = 0;

        achievements.forEach(function (achievement) {
            const current = Number(stats[achievement.criteria_type]) || 0;
            const earned = earnedIds.has(achievement.achievement_id);

            if (earned) {
                totalPoints += Number(achievement.points) || 0;
                earnedCount++;
                earnedList.appendChild(buildCard(achievement, current, true));
            } else {
                nextList.appendChild(buildCard(achievement, current, false));
            }
        });

        if (earnedCount === 0) {
            addEmptyMessage(earnedList, user
                ? "No achievements yet. Log an emission activity to earn your first one."
                : "Log in to start earning achievements.");
        }
        if (achievements.length > 0 && earnedCount === achievements.length) {
            addEmptyMessage(nextList, "You have earned every achievement. Nice work!");
        }

        let text = earnedCount + " of " + achievements.length + " achievements earned | " +
                   totalPoints + " achievement points";
        if (user) text += " | " + stats.emission_points + " emission points";
        summary.textContent = text;
    }

    // ---------- Start ----------
    async function init() {
        if (typeof db === "undefined" || !db) {
            showMessage("Sorry, we couldn't connect to the database. Please try again later.");
            return;
        }

        showMessage("Loading your achievements...");

        try {
            // getUser() checks the session with Supabase, so it can't be faked locally
            const { data: authData } = await db.auth.getUser();
            const user = authData && authData.user ? authData.user : null;

            const achievements = await loadAchievements();
            const stats = await loadStats(user);
            const savedIds = await loadEarnedIds(user);

            // Earned = already saved, or the user's progress now meets the target
            const earnedIds = new Set(savedIds);
            const newlyEarned = [];
            achievements.forEach(function (a) {
                const reached = (Number(stats[a.criteria_type]) || 0) >= Number(a.criteria_value);
                if (user && reached && !savedIds.has(a.achievement_id)) {
                    earnedIds.add(a.achievement_id);
                    newlyEarned.push(a);
                }
            });

            const added = await recordNewlyEarned(user, newlyEarned);
            stats.emission_points += added;
            render(achievements, stats, earnedIds, user);

            if (user) {
                showMessage("");
            } else {
                showMessage("Log in or create an account to track your own progress.", true);
            }
        } catch (err) {
            console.error(err);
            showMessage("Sorry, we couldn't load your achievements: " + err.message);
        }
    }

    init();
})();