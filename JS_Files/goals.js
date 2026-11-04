const goalFrom = document.getElementById("goal-form")
const goalsList = document.getElementById("goals-list")
const formMessage = document.getElementById("form-result")

//Date format for the dates created on the cards
const goalDateFormat = { day: "numeric", month: "short", year: "numeric" };

//Following line of code is performed when user presses create goal button

goalFrom.addEventListener("submit", function (event) {
    event.preventDefault();

    //Gather form values

    const title = document.getElementById("goal-title").value.trim();
    const category = document.getElementById("goal-category").value;
    const description = document.getElementById("goal-description").value.trim();
    const target = Number(document.getElementById("goal-target").value);
    const endDate = document.getElementById("goal-end-date").value;

    //Start date as YYYY/MM/DD
    const startDate = new Date().toLocaleDateString("en-CA");

    //Check required fields are filled out

    if (!title || !category || !target || target < 0) {
        formMessage.textContent = "Please enter a title and select a category, and a CO2 value above 0";
        return;
    }

    if (endDate && endDate < startDate) {
        formMessage.textContent = "The target date cant be in the past"
        return;
    }

    //Remove empty message awaiting new goal
    const emptyMessage = goalsList.querySelector(".empty-message");

    if (emptyMessage) {
        emptyMessage.remove();
    }

    //Keep current values that can change when edited
    let currentTarget = target;
    let currentEndDate = endDate;

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

    //Adds the targeted reduced amount to the card
    const goalTarget = document.createElement("p");
    goalTarget.className = "goal-target";
    goalTarget.textContent = `Target: ${currentTarget} kg CO2`;
    goalCard.appendChild(goalTarget);

    //Adds the dates to the card
    const startText = new Date(startDate + "T00:00:00").toLocaleDateString("en-GB", goalDateFormat);

    const goalDates = document.createElement("p");
    goalDates.className = "goal-dates";
    goalDates.textContent = currentEndDate
        ? `${startText} to ${new Date(currentEndDate + "T00:00:00").toLocaleDateString("en-GB", goalDateFormat)}`
        : `Started ${startText}`;
    goalCard.appendChild(goalDates);

    //Adds the label in preperation for the checkbot
    const statusLabel = document.createElement("p");
    statusLabel.className = "goal-status";
    statusLabel.textContent = "Completed: No";
    goalCard.appendChild(statusLabel);

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

    //Edit CO2 Target
    const editTargetLabel = document.createElement("label");
    editTargetLabel.textContent = "CO2 Target Reduction (kg)";

    const editTarget = document.createElement("input");
    editTarget.type = "number";
    editTarget.min = "0";
    editTarget.step = "0.1";
    editTargetLabel.appendChild(editTarget);

    //Edit Target Date
    const editEndDateLabel = document.createElement("label");
    editEndDateLabel.textContent = "Target Date"

    const editEndDate = document.createElement("input");
    editEndDate.type = "date";
    editEndDateLabel.appendChild(editEndDate);

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
        editTargetLabel,
        editEndDateLabel,
        editMessage,
        saveButton,
        cancelButton
    );

    goalCard.appendChild(editForm);

    //Add a checkbox which acts as the goal status being completed or not like a boolean field
    const completeLabel = document.createElement("label");
    completeLabel.className = "goal-complete-label";

    const completeCheckbox = document.createElement("input");
    completeCheckbox.type = "checkbox";

    completeLabel.append(completeCheckbox, " Mark as complete");
    goalCard.appendChild(completeLabel)

    //Updates the status when the checkbox is interactacted with
    completeCheckbox.addEventListener("change", function () {
        statusLabel.textContent = `Completed: ${completeCheckbox.checked ? "Yes" : "No"}`;
        goalCard.classList.toggle("goal-completed", completeCheckbox.checked);
    });


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
        editTarget.value = currentTarget;
        editEndDate.value = currentEndDate;
        editMessage.textContent = "";

        goalTitle.hidden = true;
        goalCategory.hidden = true;
        goalTarget.hidden = true;
        goalDates.hidden = true;

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
        goalTarget.hidden = false;
        goalDates.hidden = false;

        if (goalDescription) {
            goalDescription.hidden = false;
        }
    });

    //Update the Goal Card when new values are entered
    saveButton.addEventListener("click", function () {
        const newGoalTitle = editTitle.value.trim();
        const newGoalDescription = editDescription.value.trim();
        const newTarget = Number(editTarget.value);
        const newEndDate = editEndDate.value;

        if (!newGoalTitle) {
            editMessage.textContent = "Enter a title";
            return;
        }

        if (!newTarget || newTarget < 0) {
            editMessage.textContent = "Enter a CO2 Value above 0";
            return;
        }

        //End Date cant be before the starting date
        if (newEndDate && newEndDate < startDate) {
            editMessage.textContent = "The target date cannot be before the start date";
            return;
        }

        goalTitle.textContent = newGoalTitle;
        goalCategory.textContent = editCategory.value;

        currentTarget = newTarget;
        currentEndDate = newEndDate;

        goalTarget.textContent = `Target: ${currentTarget} kg CO2`;
        goalDates.textContent = currentEndDate
            ? `${startText} to ${new Date(currentEndDate + "T00:00:00").toLocaleDateString("en-GB", goalDateFormat)}`
            : `Started ${startText}`;


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
        goalTarget.hidden = false;
        goalDates.hidden = false;
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