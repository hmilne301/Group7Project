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
    let goalDescription = null;

    if (description) {
        goalDescription = document.createElement("p");
        goalDescription.className = "goal-description";
        goalDescription.textContent = description;
        goalCard.appendChild(goalDescription);
    }

    //Opens edit form when user pressed edit goal button
    const editForm = document.createElement("div");
    editForm.className = "edit-goal";
    editForm.hidden = true;

    //Edit Title
    const editTitle = document.createElement("input");
    editTitle.type = "text";
    editTitle.setAttribute("aria-label", "Goal Title");

    //Copy the alreadye existing categories to remain constistant across
    const editCategory = document.createElement("select");
    editCategory.setAttribute("aria-label", "Goal Category");

    for (const formOption of document.getElementById("goal-category").options) {
        if (formOption.value) {
            const option = document.createElement("option");
            option.value = formOption.value;
            option.textContent = formOption.textContent;
            editCategory.appendChild(option);
        }
    }

    //Edit Description
    const editDescription = document.createElement("textarea");
    editDescription.setAttribute("aria-label", "Goal Description");

    //Sets edit message
    const editMessage = document.createElement("p");
    editMessage.className = "edit-message";

    //Creates the save changes button for edits
    const saveButton = document.createElement("button");
    saveButton.type = "button";
    saveButton.textContent = "Save Changes";
    saveButton.className = "save-goal";

    //Creates the cancel button incase user decides they wish not to edit no longer
    const cancelButton = document.createElement("button");
    cancelButton.type = "button";
    cancelButton.textContent = "Cancel";
    cancelButton.className = "cancel-goal-edit"

    editForm.append(
        editTitle,
        editCategory,
        editDescription,
        editMessage,
        saveButton,
        cancelButton
    );

    goalCard.appendChild(editForm);

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

    //Add edit button
    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.textContent = "Edit Goal";
    editButton.className = "goal-edit-button";

    editButton.addEventListener("click", function () {
        editTitle.value = goalTitle.textContent;
        editCategory.value = goalCategory.textContent;
        editDescription.value = goalDescription ? goalDescription.textContent : "";
        editMessage.textContent = "";

        goalTitle.hidden = true;
        goalCategory.hidden = true;

        if (goalDescription) {
            goalDescription.hidden = true;
        }

        editForm.hidden = false;
    });

    //Add the cancel button on the edit form;
    cancelButton.addEventListener("click", function () {
        editForm.hidden = true;
        goalTitle.hidden = false;
        goalCategory.hidden = false;

        if (goalDescription) {
            goalDescription.hidden = false;
        }
    });

    //Update the Goal Card when new values are entered
    saveButton.addEventListener("click", function () {
        const newGoalTitle = editTitle.value.trim();
        const newGoalDescription = editDescription.value.trim();

        if (!newGoalTitle) {
            editMessage.textContent = "Enter a title";
            return;
        }

        goalTitle.textContent = newGoalTitle;
        goalCategory.textContent = editCategory.value;

        if (newGoalDescription) {
            //If there was no description and user wanted to create one
            if (!goalDescription) {
                goalDescription = document.createElement("p");
                goalDescription.className = "goal-description";
                goalCategory.after(goalDescription);
            }
            goalDescription.textContent = newGoalDescription;
            goalDescription.hidden = false;
        } else if (goalDescription) {
            //Remove if it was to be cleared
            goalDescription.remove();
            goalDescription = null;
        }

        editForm.hidden = true;
        goalTitle.hidden = false;
        goalCategory.hidden = false;

    });

    goalCard.appendChild(editButton);

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