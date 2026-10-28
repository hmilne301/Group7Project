// function for handling emission activity form submit
async function addEmissionActivity(event) {
    event.preventDefault();

    const input = document.getElementById("emissionAmount");
    const message = document.getElementById("activityMessage");
    const category = document.getElementById("emissionCategory").value;
    const nameInput = document.getElementById("emissionName");
    const name = nameInput.value.trim();
    const amount = Number(input.value);

    // if the amount is not a number or less than or equal to 0 show an alert to user and return
    if (isNaN(amount) || amount <= 0) {
        message.textContent = "Please enter a valid emission amount.";
        message.style.display = "block";
        return;
    // if the category is empty show an alert to user and return
    }else if (category === "") {
        message.textContent = "Please select a category.";
        message.style.display = "block";
        return;
    // if the name is empty show an alert to user and return
    }else if (name === "") {
        message.textContent = "Please enter a name.";
        message.style.display = "block";
        return;
    }
   
    const { error } = await db.from("activity").insert([{
        activity_date: new Date().toISOString(),
        quantity: amount,
        co2_kg_emitted: amount
    }]);

    if (error) {
        console.error("Error adding emission:", error);
        message.textContent = "There was an error adding the emission. Please try again.";
        message.style.display = "block";
        return;
    }

    // gives user an message 
    message.textContent = `Added emission: ${amount}`;
    message.style.display = "block";
    input.value = "";
}   

// hides the message if the user starts typing in the input box 
document.getElementById("emissionAmount").addEventListener("input", function () {
    document.getElementById("activityMessage").style.display = "none";
});