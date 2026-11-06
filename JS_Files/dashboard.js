const summary = document.getElementById("summary")
const overTime = document.getElementById("overTime")
const categories = document.getElementById("categories")

// setting id as null initially
let myId = null;

// checks who is logged in
db.auth.getSession().then(function(result) {

    if (result.data.session === null){
        // no user is logged in
        window.location.href = "Login.html";
        return;
    }

    // storing user id
    myId = result.data.session.user.id;
});

// Load data from activity table in database
async function loadData() {
    const { data, error } = await db
    .from("activity")
    .select("activity_date, co2_kg_emitted, category ( category_name )")
    .neq("category_id", "85a649bb-75de-420b-88fd-9751002f2794")
    .order("activity_date", {ascending: false})
    .limit(4);

    if (error) {
        console.error("Error fetching data:", error.message);
        return;
    }
    console.log(data)
    return data;
}

//Inputs activity into overTime 
loadData().then((data) => {
    console.log("Data:", data);
    if (data) {
        const fragment = document.createDocumentFragment();
        const table = document.querySelector('table');
        const tableBody = document.getElementById('trend-rows');
        data.forEach((item) => {
            const tr = document.createElement("tr");
            const dateCell = document.createElement("td");
            dateCell.textContent = item.activity_date;

            const amountCell = document.createElement("td");
            amountCell.textContent = item.co2_kg_emitted;

            tr.append(dateCell, amountCell)
            tableBody.appendChild(tr);
    });

} else {
    console.log("Nothing Currently Logged");
}
}).catch((error) => {
    console.error("Error loading data:", error)
});

async function showCategoryBreakdown() {

    const {data: {user }, error: authError} = await db.auth.getUser();
    if (authError || !user) {
        console.error("Error fetching user data:", authError.message);
        return;
    }

    const start = new Date();
    start.setDate(start.getDate() - 6);

    const { data, error } = await db
        .from("activity")
        .select("co2_kg_emitted, category ( category_name)")
        .eq("user_id", myId)
        .neq("category_id", "85a649bb-75de-420b-88fd-9751002f2794")
        .gte("activity_date", start.toLocaleDateString('en-CA'));

    if (error) {
        console.error("Error fetching category data:", error.message);
        return;
    }

        const tableBody2 = document.getElementById('category-rows');
        tableBody2.innerHTML = "";
        if ( !data || data.length === 0) {
            const tr = document.createElement("tr");
            const td = document.createElement("td");
            td.colspan = 3;
            td.textContent = "Nothing logged in the last 7 days";
            tr.appendChild(td);
            tableBody2.appendChild(tr);

            return;
        }
    const categoryTotals = {};
    let fullTotal = 0;
    data.forEach((item) => {
        const category = item.category.category_name;
        const amount = Number(item.co2_kg_emitted) || 0;
        categoryTotals[category] = (categoryTotals[category] || 0) + amount;
        fullTotal += amount;
    });
    
    Object.entries(categoryTotals)
    .sort ((a, b) => b[1] - a[1])
    .forEach(([category, amount]) => {
        const tr = document.createElement("tr");
        const categoryCell = document.createElement("td");
        categoryCell.textContent = category;

        const amountCell = document.createElement("td");
        amountCell.textContent = amount.toFixed(1);

        tr.append(categoryCell, amountCell)
        tableBody2.appendChild(tr);
        console.log(`Category: ${category}, Amount: ${amount.toFixed(1)}`);
    }
    );
}
        
showCategoryBreakdown();


async function showLast7Days() {
    const start = new Date();
    start.setDate(start.getDate() - 6);
    const from = start.toLocaleDateString('en-CA'); // Format as YYYY-MM-DD

    const { data, error } = await db
        .from("activity")
        .select("co2_kg_emitted")
        .neq("category_id", "85a649bb-75de-420b-88fd-9751002f2794")
        .gte("activity_date", from);

    if (error) {
        console.error("Error fetching last weeks data:", error.message);
        return;
    }
    if (data.length === 0) {
        return;
    }

    let total = 0;
    data.forEach((item) => {
        total += Number(item.co2_kg_emitted);
    });

    document.getElementById("last7Days").textContent = total.toFixed(1);
}

// Makes "view all" buttons redirect to the correct page
document.querySelectorAll('.view_all').forEach(button => {
    button.addEventListener('click', () => {
        window.location.href = button.dataset.href;
    });
});

//draw chart for footprint over time
async function showTrendChart() {
    // chart.js code to draw the chart
    if (typeof Chart === 'undefined') {
        console.error("Chart.js is not loaded. Please check the script source.");
        return;
    }

    const WEEKS = 8;
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to midnight for consistency

    const start = new Date(today);
    start.setDate(start.getDate() - (WEEKS *7) -1);

    const { data, error } = await db
        .from("activity")
        .select("activity_date, co2_kg_emitted")
        .neq("category_id", "85a649bb-75de-420b-88fd-9751002f2794")
        .gte("activity_date", start.toLocaleDateString('en-CA'));

    if (error) {
        console.error("Error fetching trend Chart data:", error.message);
        return;
    }

    const totals = new Array(WEEKS).fill(0);
    data.forEach((item) => {
        const[year, month, day] = item.activity_date.slice(0, 10).split('-').map(Number);
        const daysAgo = Math.round((today - new Date(year, month - 1, day)) / (1000 * 60 * 60 * 24));
        if (daysAgo <0 || daysAgo >= WEEKS * 7){
            return;
        }
        totals[WEEKS - 1 - Math.floor(daysAgo / 7)] += Number(item.co2_kg_emitted);
    });

    // label point with date week end
    const labels = totals.map((total, i) => {
        const weekEnd = new Date(today);
        weekEnd.setDate(weekEnd.getDate() - (i * 7));
        return weekEnd.toLocaleDateString('en-CA');
    });

    Chart.defaults.font.family = 'Arial, sans-serif';
    Chart.defaults.font.size = 14;

    new Chart(document.getElementById('trend-chart'), {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: "kg C02e",
                data: totals.map((total) => Math.round(total * 10) / 10), // Round to 1 decimal place
                borderColor: "DarkGreen",
                backgroundColor: "DarkGreen",
                borderWidth: 2,
                pointRadius: 4,
            }]

        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
            },
            scales: {
                x: {
                    title: {display: true, text: "Week Ending"},
                    grid: { display: false },
                },
                y: {
                    beginAtZero: true,
                    title: {display: true, text: "kg C02e"},
                    grid: { color: "#E5EBDD"}
                }
            }
        }
    });
}

showTrendChart();

//Tree picture change

const TREE_LOW_LIMIT = 70;
const TREE_HIGH_LIMIT = 100;

const TREE_levels = {
    low: { image: "../Images/tree_1.png", text: "Low emissions this week! Your Trees are thriving! Keep up the good work!" },
    medium: { image: "../Images/tree_2.png", text: "Moderate emissions this week. Your Trees are losing leaves. Consider more sustainable options!" },
    high: { image: "../Images/tree_3.png", text: "High emissions this week. Your Trees are on fire! Consider more sustainable options!" }
};

async function updateTreeImage() {
    const start = new Date();
    start.setDate(start.getDate() - 6);

    const { data, error } = await db
        .from("activity")
        .select("co2_kg_emitted")
        .neq("category_id", "85a649bb-75de-420b-88fd-9751002f2794")
        .gte("activity_date", start.toLocaleDateString('en-CA'));

    if (error) {
        console.error("Error fetching last week's data for tree image:", error.message);
        return;
    }

    // nothing logged in the last week
    if (data.length === 0) {
        return;
    }

    let total = 0;
    data.forEach((item) => {
        total += Number(item.co2_kg_emitted);
    });

    let level = "medium";
    if (total < TREE_LOW_LIMIT) {
        level = "low";
    } else if (total > TREE_HIGH_LIMIT) {
        level = "high";
    }

    const treeImage = document.getElementById("treeImage");
    treeImage.src = TREE_levels[level].image;
    treeImage.alt = TREE_levels[level].text;
    document.getElementById("treeText").textContent = TREE_levels[level].text;
}

updateTreeImage();

// load the dashboard summary data
// goals on track
async function showGoalsOnTrack() {
    const today = new Date().toLocaleDateString('en-CA');

    const { data: goals, error } = await db
    .from("goal")
    .select("goal_id, target_co2_kg, start_date, end_date")
    .eq("user_id", myId)
    .lte("start_date", today)
    .gte("end_date", today);

    if (error) {
        console.error("Error fetching goals:", error.message);
        return;
    }

    let count = 0;

    for (const goal of goals) {
        const { data: activities, error: activityError } = await db
        .from("activity")
        .select("co2_kg_emitted")
        .gte("activity_date", goal.start_date)
        .lte("activity_date", goal.end_date);

        if (activityError) {
            console.error("Error fetching activities for goal:", activityError.message);
            continue;
        }

        const total = activities.reduce(
            (sum, item) => sum + Number(item.co2_kg_emitted),
             0);

        if (total <= Number(goal.target_co2_kg)) {
            count++;
        }
    }

    document.getElementById("goalsOnTrack").textContent = 
    `${count}/${goals.length}`;
}

//leaderboard position
async function showLeaderboardPosition() {

    const { data, error } = await db
    .from("userinfo")
    .select("user_id, emission_points")
    .order("emission_points", { ascending: false }  
    );
    
    if (error) {
        console.error("Error fetching leaderboard data:", error.message);
        return;
    }

    const myUser = data.find(user => user.user_id === myId);

    if (!myUser) {
        document.getElementById("leaderboard-rank").textContent = "N/A";
        return;
    }

    const rank = data.filter(
        user=> Number(user.emission_points) > 
               Number(myUser.emission_points)
    ).length+1;

    document.getElementById("leaderboard-rank").textContent = 
    `#${rank}`;
}

// Activity streak
async function showActivityStreak() {
    const { data, error } = await db
    .from("activity")
    .select("activity_date")
    .eq("user_id", myId)
    .order("activity_date", { ascending: false });

    if (error) {
        console.error("Error fetching activity streak data:", error.message);
        return;
    }

    const element = document.getElementById("streak-days");

    if (data.length === 0) {
        element.textContent = "0";
        return;
    }

    const dates = [...new Set(
        data.map(item => item.activity_date.slice(0, 10))
    )];

    function formatDate(date){
        return date.getFullYear() + '-' +
            String(date.getMonth() + 1).padStart(2, '0') + '-' +
            String(date.getDate()).padStart(2, '0');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (
        dates[0] === formatDate(today) || 
        dates[0] === formatDate(yesterday)
    ){
        element.textContent = "0";
        return;
    }

    let streak = 0;
    const expected = new Date(dates[0] + "T00:00:00Z");

    for (const date of dates) {

        if (date !== formatDate(expected)) {
            break;
        }

        streak++;
        expected.setDate(expected.getDate() - 1);
    }
    element.textContent = streak;

}

// Call the functions to display the dashboard summary data
const summaryCheck = setInterval(() => {

    if (myId !== null) {

        clearInterval(summaryCheck);

        showLast7Days();
        showGoalsOnTrack();
        showLeaderboardPosition();
        showActivityStreak();

        // previews
        showGoalPreview();
        showLeaderboardPreview();
        showFriendPreview();
    }
}, 100);

// ---------- Dashboard previews ----------

// puts a single "Nothing to show here" item in a list
function showNothing(list) {
    list.replaceChildren();
    const li = document.createElement("li");
    li.textContent = "Nothing to show here";
    li.classList.add("empty_preview");
    list.appendChild(li);
}

// adds one line of text to a list
function addListItem(list, text) {
    const li = document.createElement("li");
    li.textContent = text;
    list.appendChild(li);
    return li;
}

// Goals preview - shows 1 goal that isn't completed yet
async function showGoalPreview() {
    const list = document.getElementById("goals-list");

    const { data, error } = await db
        .from("goal")
        .select("goal_name, target_co2_kg, end_date")
        .eq("user_id", myId)
        .neq("goal_status", "completed")
        .order("start_date", { ascending: false })
        .limit(1);

    if (error || data.length === 0) {
        if (error) console.error("Error fetching goal preview:", error.message);
        showNothing(list);
        return;
    }

    const goal = data[0];
    list.replaceChildren();

    let text = goal.goal_name + " - Target: " + goal.target_co2_kg + " kg CO2";
    if (goal.end_date) {
        const endText = new Date(goal.end_date + "T00:00:00")
            .toLocaleDateString("en-GB", { day: "numeric", month: "short" });
        text += " by " + endText;
    }
    addListItem(list, text);
}

// Leaderboard preview - top 3 users
async function showLeaderboardPreview() {
    const list = document.getElementById("leaderboard-list");

    const { data, error } = await db
        .from("userinfo")
        .select("user_id, username, emission_points")
        .order("emission_points", { ascending: false })
        .limit(3);

    if (error || data.length === 0) {
        if (error) console.error("Error fetching leaderboard preview:", error.message);
        showNothing(list);
        return;
    } 

    list.replaceChildren();

    for (const user of data) {
        let name = user.username;
        if (user.user_id === myId) {
            name += " (you)";
        }
        addListItem(list, name + " - " + user.emission_points + " points");
    }
}

// Friends preview - the friend with the most points
async function showFriendPreview() {
    const list = document.getElementById("friends-list");

    // finds accepted friendships involving the logged in user
    const { data: friendships, error } = await db
        .from("friends")
        .select("requester_id, receiver_id")
        .eq("status", "accepted")
        .or("requester_id.eq." + myId + ",receiver_id.eq." + myId);

    if (error || friendships.length === 0) {
        if (error) console.error("Error fetching friends:", error.message);
        showNothing(list);
        return;
    }

    // gets the other person's id from each friendship
    const ids = friendships.map(row =>
        row.requester_id === myId ? row.receiver_id : row.requester_id
    );

    // gets the friend with the highest points
    const { data: topFriend, error: userError } = await db
        .from("userinfo")
        .select("username, emission_points")
        .in("user_id", ids)
        .order("emission_points", { ascending: false })
        .limit(1);

    if (userError || topFriend.length === 0) {
        if (userError) console.error("Error fetching top friend:", userError.message);
        showNothing(list);
        return;
    }

    list.replaceChildren();
    addListItem(list, topFriend[0].username + " - " + topFriend[0].emission_points + " points");
}