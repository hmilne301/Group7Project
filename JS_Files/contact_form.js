let contactForm = document.getElementById("contactForm");
let successMessage = document.getElementById("successMessage");
let errorMessage = document.getElementById("errorMessage");

// runs the sendContact function when form is submitted
contactForm.addEventListener("submit", sendContact);

// async lets us use await, so you can wait for Formsprees reply
async function sendContact(event) {
    // stops page from being reloaded when form is submitted
    event.preventDefault();

    // hides any messages from a previous attempt
    successMessage.style.display = "none";
    errorMessage.style.display = "none";

    // gets inputs
    let name = document.getElementById("name").value.trim()
    let email = document.getElementById("email").value.trim()
    let message = document.getElementById("message").value.trim()

    // error message elements
    let nameError = document.getElementById("nameError");
    let emailError = document.getElementById("emailError");
    let messageError = document.getElementById("messageError");

    let validInput = true;

    // checking name input
    if (name === "") {
        nameError.textContent = "Please enter your name."
        validInput = false;
    }

    // checking email input
    if (email === "") {
        emailError.textContent = "Please enter your email address."
        validInput = false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        document.getElementById("emailError").textContent = "Please enter a valid email address.";
        validInput = false;
    }

    // checking message input
    if (message === "") {
        messageError.textContent = "Please enter a message."
        validInput = false;
    }

    if (!validInput) {
        return;
    }

    // tries to run code that could fail
    try {
        // sends form data to Formspree, await pauses until reply is found
        // FormData collects all the fields within the form
        let response = await fetch("https://formspree.io/f/mnpjeyzb", {
            method: "POST",
            body: new FormData(contactForm),
            headers: { "Accept": "application/json" }
        });

        // if Formspree accepted the message
        if (response.ok) {
            // only shown if the message was actually sent
            successMessage.style.display = "block";
            nameError.textContent = "";
            emailError.textContent = "";
            messageError.textContent = "";
            contactForm.reset();
        } else {
            // Formspree replied but rejected message
            errorMessage.style.display = "block";
        }
    } catch (error) {
        // runs if the network is down or the request is blocked
        errorMessage.style.display = "block";
    }
}