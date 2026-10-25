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