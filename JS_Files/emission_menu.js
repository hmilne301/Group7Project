let emissions = [];        // the list of emission amounts
let editingIndex = null;   // set intial editing index to null so it can be switched on and off when a user clicks edit button

// function to add a new emission amount
function addEmission(entry) {
    emissions.push(entry);
    renderTable();
}

// function to remove an emission amount by looking at the index of the row in the table
async function removeEmission(index) {
    const id = emissions[index].id;

    const { error } = await db.from("activity").delete().eq("activity_id", id);

    if (error) {
        console.error("Error deleting emission:", error);
        alert("There was an error deleting the emission. Please try again.");
        return;
    }
    emissions.splice(index, 1);
    editingIndex = null;
    renderTable();
}

// function to start editing a row
function startEdit(index) {
    editingIndex = index;
    renderTable();
}

// function to save the edited emission amount
async function saveEdit(index) {
    const newAmount = parseFloat(document.getElementById("editInput").value);

    // if the new amount is not a number or less than or equal to 0 show an alert to user and return 
    if (isNaN(newAmount) || newAmount <= 0) {
        alert("Please enter a valid emission amount.");
        return;
    }

    // id of emission entry
    const id = emissions[index].id;

    // update the emission amount in the database
    const { error } = await db.from("activity")
    .update({ co2_kg_emitted: newAmount })
    .eq("activity_id", id);

    // if error then error message
    if (error) {
        console.error("Error updating emission:", error);
        alert("There was an error updating the emission. Please try again.");
        return;
    }
    // update the emission amount in the array and reset editing index
    emissions[index].amount = newAmount;
    editingIndex = null;
    renderTable();
}

// function to cancel editing
function cancelEdit() {
    editingIndex = null;
    renderTable();
}

// function to make a button element in the table 
function makeButton(text, className, onClick) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = text;
    button.className = className;
    button.addEventListener("click", onClick);
    return button;
}

// function to render the table of emissions
function renderTable() {
    const body = document.getElementById("emissionTableBody");
    body.innerHTML = "";

    // if no emissions has been entered then show message 
    if (emissions.length === 0) {
        const cell = body.insertRow().insertCell();
        cell.colSpan = 5;
        cell.textContent = "No emissions added yet.";
    }

    // loops through each emissions entry from the sample array and adds them to the table 
    emissions.forEach((entry, i) => {
        const row = body.insertRow();
        row.insertCell().textContent = i + 1;
        row.insertCell().textContent = entry.name;
        row.insertCell().textContent = entry.category;
        const amountCell = row.insertCell();
        const actionsCell = row.insertCell();

        // if the index equals the editing index then show input box and save and cancel button otherwise show the edit and remove buttons as default
        if (i === editingIndex) {
            amountCell.innerHTML = `<input type="number" id="editInput" class="editInput" value="${entry.amount}" min="0" step="any">`;
            actionsCell.append(
                makeButton("Save", "tableButton saveButton", () => saveEdit(i)),
                makeButton("Cancel", "tableButton", cancelEdit)
            );
        } else {
            amountCell.textContent = entry.amount;
            actionsCell.append(
                makeButton("Edit", "tableButton", () => startEdit(i)),
                makeButton("Remove", "tableButton removeButton", () => removeEmission(i))
            );
        }
    });

    const total = emissions.reduce((sum, entry) => sum + entry.amount, 0);
    document.getElementById("emissionTotal").textContent = total;
}

// function to load emissions from the database and fill the table
async function loadEmissions() {
    // get the signed in user so the row belongs to them
    const { data: { user } } = await db.auth.getUser();
    console.log("user:", user);

    // if the user is not signed in show an alert to user and return
    const { data, error } = await db
    .from("activity")
    .select("*, category(category_name)")
    .order("activity_date", { ascending: true });


    // just for debugging the errors
    console.log("data:", data);
    console.log("error:", error);

    // if error then show error message
    if (error) {
        console.error("Error loading emissions:", error);
        return;
    }

    // map the data to the emissions array
    emissions = data.map(row => ({
        id: row.activity_id,
        name: row.activity_name,
        category: row.category ? row.category.category_name : "Other",
        amount: row.co2_kg_emitted
    }));
    // create table when the page loads
    renderTable();
}
loadEmissions();