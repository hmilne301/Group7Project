
'use strict';

// =====================================================================
// Achievements page
//  - Achievements are loaded from the achievement table
//  - Progress is calculated using the user's activity and userinfo
//  - Earned achievements are saved in the earns table
//  - Users must log in to save achievements and earn emission points
// =====================================================================

(() => {

    const ICON_FOLDER = "../Images/";

    // ---------- Grab elements from the page ----------

    const earnedList = document.getElementById("earnedList");
    const nextList = document.getElementById("nextList");
    const summary = document.getElementById("pointsSummary");
    const message = document.getElementById("achievementsMessage");


    // ---------- Helper functions ----------

    function showMessage(text, withLoginLink) {
        message.textContent = text;

        if (withLoginLink) {
            const back = encodeURIComponent(
                window.location.pathname + window.location.search
            );

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


    // ---------- Load achievements from Supabase ----------

    async function loadAchievements() {
        const { data, error } = await db
            .from("achievement")
            .select("*")
            .order("points", { ascending: true });

        if (error) throw error;

        // Remove achievements without a valid target
        return (data || []).filter(function (row) {
            return Number(row.criteria_value) > 0;
        });
    }


    // ---------- Load user progress ----------

    async function loadStats(user) {

        const stats = {
            activities_logged: 0,
            days_logged: 0,
            registered: 0,
            emission_points: 0,
            joined_leaderboard: 0
        };

        if (!user) return stats;

        // An account counts as registered and joined
        stats.registered = 1;
        stats.joined_leaderboard = 1;

        // Load the user's activities
        const { data: activities, error: activityError } = await db
            .from("activity")
            .select("activity_date")
            .eq("user_id", user.id);

        if (activityError) throw activityError;

        stats.activities_logged = activities.length;

        stats.days_logged = new Set(
            activities.map(function (activity) {
                return activity.activity_date;
            })
        ).size;

        // Load the user's emission points
        const { data: profile, error: profileError } = await db
            .from("userinfo")
            .select("emission_points")
            .eq("user_id", user.id)
            .maybeSingle();

        if (profileError) throw profileError;

        stats.emission_points = profile
            ? Number(profile.emission_points) || 0
            : 0;

        return stats;
    }


    // ---------- Load previously earned achievements ----------

    async function loadEarnedIds(user) {

        if (!user) return new Set();

        const { data, error } = await db
            .from("earns")
            .select("achievement_id")
            .eq("user_id", user.id);

        if (error) throw error;

        return new Set(
            data.map(function (row) {
                return row.achievement_id;
            })
        );
    }


    // ---------- Save newly earned achievements ----------

    async function recordNewlyEarned(user, newlyEarned) {

        if (!user || newlyEarned.length === 0) return 0;

        const rows = newlyEarned.map(function (achievement) {
            return {
                user_id: user.id,
                achievement_id: achievement.achievement_id
            };
        });

        // Save achievements without duplicating existing records
        const { data: saved, error } = await db
            .from("earns")
            .upsert(rows, {
                onConflict: "user_id,achievement_id",
                ignoreDuplicates: true
            })
            .select("achievement_id");

        if (error) {
            console.error("Couldn't save earned achievements:", error);
            return 0;
        }

        // Calculate points for achievements successfully saved
        let added = 0;

        (saved || []).forEach(function (row) {

            const match = newlyEarned.find(function (achievement) {
                return achievement.achievement_id === row.achievement_id;
            });

            if (match) {
                added += Number(match.points) || 0;
            }
        });

        if (added === 0) return 0;

        // Get the current emission points
        const { data: profile, error: profileError } = await db
            .from("userinfo")
            .select("emission_points")
            .eq("user_id", user.id)
            .single();

        if (profileError) {
            console.error("Couldn't retrieve emission points:", profileError);
            return 0;
        }

        const newTotal = (Number(profile.emission_points) || 0) + added;

        // Update the user's emission points
        const { data: updated, error: updateError } = await db
            .from("userinfo")
            .update({ emission_points: newTotal })
            .eq("user_id", user.id)
            .select("user_id");

        if (updateError || !updated || updated.length === 0) {
            console.error("Couldn't update emission points:", updateError);
            return 0;
        }

        return added;
    }


    // ---------- Build achievement cards ----------

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

        // Achievement icon
        if (achievement.icon) {

            const icon = document.createElement("img");
            icon.className = "achievement_icon";
            icon.src = ICON_FOLDER + achievement.icon;
            icon.alt = "";
            icon.width = 48;
            icon.height = 48;

            icon.addEventListener("error", function () {
                icon.hidden = true;
            });

            item.appendChild(icon);
        }

        // Achievement name
        const title = document.createElement("h3");
        title.textContent = achievement.achievement_name;
        item.appendChild(title);

        // Achievement description
        const description = document.createElement("p");
        description.className = "achievement_description";
        description.textContent = achievement.achievement_description || "";
        item.appendChild(description);

        // Emission point reward
        const points = document.createElement("p");
        points.className = "achievement_points";
        points.textContent = achievement.points + " emission points";
        item.appendChild(points);

        // Account-related achievements
        if (!earned && button) {

            const link = document.createElement("a");
            link.className = "achievement_button";
            link.href = button.href;
            link.textContent = button.label;

            item.appendChild(link);

            return item;
        }

        // Achievement progress
        const shown = Math.min(current, target);

        const bar = document.createElement("progress");
        bar.max = target;
        bar.value = shown;
        bar.setAttribute(
            "aria-label",
            achievement.achievement_name + " progress"
        );

        item.appendChild(bar);

        // Progress label
        const label = document.createElement("p");
        label.className = "progress_label";
        label.textContent = earned ? "Completed" : shown + " / " + target;

        item.appendChild(label);

        return item;
    }


    // ---------- Display achievements ----------

    function render(achievements, stats, earnedIds) {

        earnedList.innerHTML = "";
        nextList.innerHTML = "";

        let earnedCount = 0;

        achievements.forEach(function (achievement) {

            const current = Number(stats[achievement.criteria_type]) || 0;
            const earned = earnedIds.has(achievement.achievement_id);

            if (earned) {

                earnedCount++;

                earnedList.appendChild(
                    buildCard(achievement, current, true)
                );

            } else {

                nextList.appendChild(
                    buildCard(achievement, current, false)
                );
            }
        });

        // No achievements earned yet
        if (earnedCount === 0) {

            addEmptyMessage(
                earnedList,
                "No achievements yet. Log an emission activity to earn your first one."
            );
        }

        // All achievements completed
        if (achievements.length > 0 && earnedCount === achievements.length) {

            addEmptyMessage(
                nextList,
                "You have earned every achievement. Nice work!"
            );
        }

        // Update summary
        let text = earnedCount + " of " + achievements.length +
            " achievements earned";

        text += " | " + stats.emission_points + " emission points";

        summary.textContent = text;
    }


    // ---------- Start the achievements page ----------

    async function init() {

        if (typeof db === "undefined" || !db) {
            showMessage("Sorry, we couldn't connect to the database. Please try again later.");
            return;
        }

        // checks who is logged in
        db.auth.getSession().then(async function(result) {

            if (result.data.session === null) {
                // no user is logged in
                window.location.href = "Login.html";
                return;
            }

            // storing user id
            const user = result.data.session.user;

            try {

                // Load achievements and user progress
                const achievements = await loadAchievements();
                const stats = await loadStats(user);
                const savedIds = await loadEarnedIds(user);

                // Check which achievements have been reached
                const earnedIds = new Set(savedIds);
                const newlyEarned = [];

                achievements.forEach(function (achievement) {

                    const reached =
                        (Number(stats[achievement.criteria_type]) || 0) >=
                        Number(achievement.criteria_value);

                    if (reached && !savedIds.has(achievement.achievement_id)) {

                        earnedIds.add(achievement.achievement_id);
                        newlyEarned.push(achievement);
                    }
                });

                // Save new achievements and award emission points
                const added = await recordNewlyEarned(user, newlyEarned);

                stats.emission_points += added;

                // Display the results
                render(achievements, stats, earnedIds);

                showMessage("");

            } catch (err) {

                console.error("Achievements page error:", err);

                showMessage(
                    "Sorry, we couldn't load your achievements: " + err.message
                );
            }
        });
    }

    init();

})();