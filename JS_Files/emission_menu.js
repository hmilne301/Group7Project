let emissions = [];        // the list of emission amounts
let editingIndex = null;   // set intial editing index to null so it can be switched on and off when a user clicks edit button

// data for testing the table, will be removed when the database is connected to the table and the user can add their own emissions
emissions = [3, 4, 123, 5, 12, 451, 142, 34, 234, 2, 432].map((amount, i) => ({
    name: `Test ${i + 1}`,
    category: "Other",
    amount
}));

// function to add a new emission amount
function addEmission(entry) {
    emissions.push(entry);
    renderTable();
}

// function to remove an emission amount by looking at the index of the row in the table
function removeEmission(index) {
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
function saveEdit(index) {
    const newAmount = parseFloat(document.getElementById("editInput").value);

    // if the new amount is not a number or less than or equal to 0 show an alert to user and return 
    if (isNaN(newAmount) || newAmount <= 0) {
        alert("Please enter a valid emission amount.");
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

async function loadEmissions() {
    const { data, error } = await db
    .from("activity")
    .select("*")
    .order("activity_date", { ascending: true });

    if (error) {
        console.error("Error loading emissions:", error);
        return;
    }

    emissions = data;
    // create table when the page loads
    renderTable();
}