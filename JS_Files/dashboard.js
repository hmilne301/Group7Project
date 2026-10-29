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
