const goalFrom = document.getElementById("goal-form")
const goalsList = document.getElementById("goals-list")
const formMessage = document.getElementById("form-result")

//Following line of code is performed when user presses create goal button

goalFrom.addEventListener("submit", function (event) {
    event.preventDefault();

    //Gather form values

    const title = document.getElementById("goal-title").value.trim();
    const category = document.getElementById("goal-category").value;
    const description = document.getElementById("goal-description").value.trim();

    //Check required fields are filled out

    if (!title || !category) {
        formMessage.textContent = "Please enter a title and select a category";
        return;
    }

    //Remove empty message awaiting new goal
    const emptyMessage = goalsList.querySelector(".empty-message");

    if (emptyMessage) {
        emptyMessage.remove();
    }

    //Creates a goal card
    const goalCard = document.createElement("article");
    goalCard.className = "goal-card";

    //Add title to the card

    const goalTitle = document.createElement("h3");
    goalTitle.textContent = title;
    goalCard.appendChild(goalTitle);

    //Add the category to the card

    const goalCategory = document.createElement("p");
    goalCategory.className = "goal-category";
    goalCategory.textContent = category;
    goalCard.appendChild(goalCategory);

    //If a description was entered then it is added to the card
    if (description) {
        const goalDescription = document.createElement("p");
        goalDescription.className = "goal-description";
        goalDescription.textContent = description;
        goalCard.appendChild(goalDescription);
    }

    //Add Progress Label
    const progressLabel = document.createElement("p");
    progressLabel.className = "progress-label";
    progressLabel.textContent = "Progress: 0%";
    goalCard.appendChild(progressLabel);

    //Create the progress bar
    const progressBar = document.createElement("div");
    progressBar.className = "progress-bar";

    const progressFill = document.createElement("div");
    progressFill.className = "progress-fill";

    progressBar.appendChild(progressFill);
    goalCard.appendChild(progressBar);

    //Range Slider for increments of 25

    const progressSlider = document.createElement("input");
    progressSlider.type = "range";
    progressSlider.min = "0";
    progressSlider.max = "100";
    progressSlider.step = "25";
    progressSlider.value = "0";
    progressSlider.className = "goal-slider"
    progressSlider.setAttribute("aria-label", "Goal Progress")

    //Update the slider when the slider moves

    progressSlider.addEventListener("input", function () {
        const progress = Number(progressSlider.value);

        progressLabel.textContent = `Progress: ${progress}%`;
        progressFill.style.width = `${progress}%`;
    });

    //Adds slider to the goal card
    goalCard.appendChild(progressSlider)

    //Add option to delete via a button
    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.textContent = "Delete Goal";
    deleteButton.className = "goal-delete";

    //Delete the goal after confirmation through window

    deleteButton.addEventListener("click", function () {
        goalCard.remove();
      
    });

    goalCard.appendChild(deleteButton)

    //Displays the new created goal
    goalsList.appendChild(goalCard);

    goalFrom.reset();

    formMessage.textContent = "Goal Created Successfully"

});