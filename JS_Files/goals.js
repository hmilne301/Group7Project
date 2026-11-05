const goalForm = document.getElementById("goal-form")
const goalsList = document.getElementById("goals-list")
const formMessage = document.getElementById("form-result")
const categorySelect = document.getElementById("goal-category")

//Date format for the dates created on the cards
const goalDateFormat = { day: "numeric", month: "short", year: "numeric" };

//The word the database uses for a completed goal
const completedStatus = "completed";

//Shows the message saved before page is reloaded
const savedMessage = sessionStorage.getItem("goalMessage");

if (savedMessage) {
    formMessage.textContent = savedMessage;
    sessionStorage.removeItem("goalMessage");
}

//Gets the logged in user
const { data: { user } } = await db.auth.getUser();

//Sends any user that isnt logged in to the login page
if (!user) {
    location.replace("Login.html");
}

//Loads the categories from supabase
const { data: categories, error: categoryError } = await db
    .from("category")
    .select("*")
    .order("category_name", { ascending: true});

if (categoryError) {
    formMessage.textContent = "Could not load categories";
    console.error(categoryError);
}

//Lookup so a category_id can be found by name

const categoryNames = {};

for (const category of categories || []) {
    categoryNames[category.category_id] = category.category_name;

    const option = document.createElement("option");
    option.value = category.category_id;
    option.textContent = category.category_name;
    categorySelect.appendChild(option);
}

//Following line of code is performed when user presses create goal button

goalForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    //Gather form values

    const title = document.getElementById("goal-title").value.trim();
    const category = document.getElementById("goal-category").value;
    const description = document.getElementById("goal-description").value.trim();
    const target = Number(document.getElementById("goal-target").value);
    const endDate = document.getElementById("goal-end-date").value;

    //Start date as YYYY/MM/DD
    const startDate = new Date().toLocaleDateString("en-CA");

    // clears old messages
    goalForm.querySelectorAll(".validation_error").forEach(function (error) {
        error.textContent = ""
    });
    formMessage.textContent = ""

    // every check runs so messages show at once
    let validInput = true;

    // title check
    if (title.length < 3 || title.length > 60) {
        document.getElementById("titleError").textContent = "Title must be between 3 to 60 characters long.";
        validInput = false;
    }

    // category check
    if (!category) {
        document.getElementById("categoryError").textContent = "Please select a category.";
        validInput = false;
    }

    // description check
    if (description.length > 200) {
        document.getElementById("descriptionError").textContent = "Description must be below 200 characters long.";
        validInput = false;
    }

    // target check - checking if 0 or empty
    if (!target || target <= 0) {
        document.getElementById("targetError").textContent = "Please enter a CO2 target above 0kg.";
        validInput = false;
    }

    // date check only when entered
    if (endDate && endDate < startDate) {
        document.getElementById("dateError").textContent = "The target date can't be in the past.";
        validInput = false;
    }

    // stops after all checks have ran
    if (!validInput) {
        return;
    }
    
    //Save goal to supabase
    const { error } = await db
        .from("goal")
        .insert({
            goal_name: title,
            goal_description: description || null,
            category_id: category,
            target_co2_kg: target,
            start_date: startDate,
            goal_status: "active",
            end_date: endDate || null,
            user_id: user.id
        });

    if (error) {
        formMessage.textContent = "Could not save goal";
        console.error(error.code, error.message, error.details, error.hint);
        return;
    }

    sessionStorage.setItem("goalMessage", "Goal Created successfully");
    location.reload();

});

   
//Loads user goals from supabase
let goals =[];

if (user) {
    const { data, error: loadError } = await db
        .from("goal")
        .select("*")
        .eq("user_id", user.id)
        .order("start_date", { ascending: true })
        .order("goal_id", { ascending: true });

    if (loadError) {
        formMessage.textContent = "Could not load goals"
        console.error(loadError);
    }

    goals = data || [];

} else {
    formMessage.textContent = "Please login to see your goals";

}

//Removes the empty message while awiting a new goal
if (goals.length > 0) {
    const emptyMessage = goalsList.querySelector(".empty-message");

    if (emptyMessage) {
        emptyMessage.remove();
    }
}

//Builds a goal card for each saved gol
for (const goal of goals) {

    //Creates a goal card
    const goalCard = document.createElement("article");
    goalCard.className = "goal-card";

    //Add title to the card

    const goalTitle = document.createElement("h3");
    goalTitle.textContent = goal.goal_name;
    goalCard.appendChild(goalTitle);

    //Add the category to the card

    const goalCategory = document.createElement("p");
    goalCategory.className = "goal-category";
    goalCategory.textContent = categoryNames[goal.category_id] || "Uncategorised";
    goalCard.appendChild(goalCategory);

    //If a description was entered then it is added to the card
    let goalDescription = null;

    if (goal.goal_description) {
        goalDescription = document.createElement("p");
        goalDescription.className = "goal-description";
        goalDescription.textContent = goal.goal_description;
        goalCard.appendChild(goalDescription);
    }

    //Adds the targeted reduced amount to the card
    const goalTarget = document.createElement("p");
    goalTarget.className = "goal-target";
    goalTarget.textContent = `Target: ${goal.target_co2_kg} kg CO2`;
    goalCard.appendChild(goalTarget);

    //Adds the dates to the card
    const startText = new Date(goal.start_date + "T00:00:00").toLocaleDateString("en-GB", goalDateFormat);

    const goalDates = document.createElement("p");
    goalDates.className = "goal-dates";
    goalDates.textContent = goal.end_date
        ? `${startText} to ${new Date(goal.end_date + "T00:00:00").toLocaleDateString("en-GB", goalDateFormat)}`
        : `Started ${startText}`;
    goalCard.appendChild(goalDates);

    //Adds the label in preperation for the checkbot
    const statusLabel = document.createElement("p");
    statusLabel.className = "goal-status";
    statusLabel.textContent = `Completed: ${goal.goal_status === completedStatus ? "Yes" : "No"}`;
    goalCard.appendChild(statusLabel);

    if (goal.goal_status === completedStatus) {
        goalCard.classList.add("goal-completed");
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

    for (const formOption of categorySelect.options) {
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

    //Adds a checkbox which acts as the completion of goal_status which is being treated like a boolean value with appropriate text
    const completeLabel = document.createElement("label");
    completeLabel.className = "goal-complete-label";

    const completeCheckbox = document.createElement("input");
    completeCheckbox.type = "checkbox";
    completeCheckbox.checked = goal.goal_status === completedStatus;

    completeLabel.append(completeCheckbox, " Mark as complete");
    goalCard.appendChild(completeLabel)

    //Saves the interaction to supabase
    completeCheckbox.addEventListener("change", async function () {
        const status = completeCheckbox.checked ? completedStatus : "active";

        const { error } = await db
            .from("goal")
            .update({ goal_status: status})
            .eq("goal_id", goal.goal_id);
        if (error) {
            //Put the status back if it failed to update
            completeCheckbox.checked = !completeCheckbox.checked;
            formMessage.textContent = "Could not update status";
            console.error(error.code, error.message, error.details, error.hint);
            return;
        }

        goal.goal_status = status;
        statusLabel.textContent = `Completed: ${completeCheckbox.checked ? "Yes" : "No"}`;
        goalCard.classList.toggle("goal-completed", completeCheckbox.checked);
    });

    //Add edit button
    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.textContent = "Edit Goal";
    editButton.className = "goal-edit-button";

    editButton.addEventListener("click", function () {
        editTitle.value = goal.goal_name;
        editCategory.value = goal.category_id;
        editDescription.value = goal.goal_description || "";
        editTarget.value = goal.target_co2_kg;
        editEndDate.value = goal.end_date || "";
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
    saveButton.addEventListener("click", async function () {
        const newGoalTitle = editTitle.value.trim();
        const newGoalDescription = editDescription.value.trim();
        const newTarget = Number(editTarget.value);
        const newEndDate = editEndDate.value;

        // collects every problem
        const problems = [];

        if (newGoalTitle.length < 3 || newGoalTitle.length > 60) {
            problems.push("Title must be 3 to 60 characters long.")
        }

        if (!newTarget || newTarget <= 0) {
            problems.push("Enter a CO2 target over 0kg.")
        }

        //End Date cant be before the starting date
        if (newEndDate && newEndDate < goal.start_date) {
            problems.push("The target date cannot be before start date.")
        }

        if (problems.length > 0){
            editMessage.textContent = problems.join(" ");
            editMessage.setAttribute("rule", "alert");
            return;
        }

        editMessage.textContent = "";

        const { error } = await db
            .from("goal")
            .update({
                goal_name: newGoalTitle,
                category_id: editCategory.value,
                goal_description: newGoalDescription || null,
                target_co2_kg: newTarget,
                end_date: newEndDate || null
            })
            .eq("goal_id", goal.goal_id);
        
        if (error) {
            editMessage.textContent = "Could not save changes";
            console.error(error.code, error.message, error.details, error.hint);
            return;
        }

        goal.goal_name = newGoalTitle;
        goal.category_id = editCategory.value;
        goal.goal_description = newGoalDescription || null;
        goal.target_co2_kg = newTarget;
        goal.end_date = newEndDate || null;

        goalTitle.textContent = goal.goal_name;
        goalCategory.textContent = categoryNames[goal.category_id] || "Uncategorised";
        goalTarget.textContent = `Target: ${goal.target_co2_kg} kg CO2`;
        goalDates.textContent = goal.end_date
            ? `${startText} to ${new Date(goal.end_date + "T00:00:00").toLocaleDateString("en-GB", goalDateFormat)}`
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

    //Add option to delete a goal via a button
    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.textContent = "Delete Goal";
    deleteButton.className = "goal-delete";

    //Delete the goal from supabase and remove the card

    deleteButton.addEventListener("click", async function () {
        const { error } = await db
            .from("goal")
            .delete()
            .eq("goal_id", goal.goal_id);
        
        if (error) {
            formMessage.textContent = "Could not delete goal";
            console.error(error.code, error.message, error.details, error.hint);
            return;
        }

        goalCard.remove();

        //Shows the empty message if that was the only goal
        if (!goalsList.querySelector(".goal-card")) {
            const emptyMessage = document.createElement("p");
            emptyMessage.className = "empty-message";
            emptyMessage.textContent = "No goals have been created yet";
            goalsList.appendChild(emptyMessage);
        }
    });

    goalCard.appendChild(deleteButton);



    goalsList.appendChild(goalCard);

}