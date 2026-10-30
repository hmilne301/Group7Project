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
    .select("activity_date, co2_kg_emitted")
    .order("activity_date", {ascending: false})
    .limit(8);

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

async function showLast7Days() {
    const start = new Date();
    start.setDate(start.getDate() - 6);
    const from = start.toLocaleDateString('en-CA'); // Format as YYYY-MM-DD

    const { data, error } = await db
    .from("activity")
    .select("co2_kg_emitted")
    .gte("activity_date", from);

    if (error) {
        console.error("Error fetching last 7 days data:", error.message);
        return;
    }
    if (data.length === 0) {
        return;
    }

    let total = 0;
    data.forEach((item) => {
        total += number(item.co2_kg_emitted);
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
                    title: {display: true, text: "7 days to"},
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
