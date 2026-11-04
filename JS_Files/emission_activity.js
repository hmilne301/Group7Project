
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

    // checks who is logged in 
    const { data: { session } } = await db.auth.getSession();

    // storing user id from the session
    const myId = session.user.id;


    // insert the new emission activity into the database
    const { error } = await db.from("activity").insert([{
        activity_name: name,
        activity_date: new Date().toISOString().slice(0, 10), 
        quantity: amount,
        co2_kg_emitted: amount,
        category_id: category, 
        user_id: myId
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
    nameInput.value = "";
}   

// hides the message if the user starts typing in the input box 
document.getElementById("emissionAmount").addEventListener("input", function () {
    document.getElementById("activityMessage").style.display = "none";
});

// fade elements in when they scroll into view
const revealItems = document.querySelectorAll('.reveal');

const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target); // only animate once
        }
    });
}, { threshold: 0.15 });

revealItems.forEach((item) => observer.observe(item));

// redirect to login automatically if nobody is signed in
(async function () {
    try {
        const { data: { session } } = await db.auth.getSession();
        if (session === null) {
            window.location.href = "Login.html";
        }
    } catch (err) {
        const msg = document.getElementById("activityMessage");
        msg.textContent = "Redirect check failed: " + err.message;
        msg.style.display = "block";
    }
})();

