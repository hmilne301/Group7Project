'use strict';

// 0.17 is the average for petrol and diesels
const CAR_KG_PER_KM = 0.17;
// 0.05 per passenger
const PTRANSPORT_KG_PER_KM = 0.05;

// 0.182 and 0.131 are the gas and electric values according to https://carbonrecycling.co.uk/guides/conversion-factors-2026
const GAS_KG_PER_KWH = 0.182;
const ELECTRIC_KG_PER_KWH = 0.131;

// other covers heating types such as LPG and Oil - 4000kg per year is an inbetween value
const OTHER_HEATING_KG = 4000;

// simplified estimate of UK average based on the categories
const AVERAGE_UK_CO2 = 6800

let form = document.getElementById("questionnaireForm");

// run calculation when form is submitted
form.addEventListener("submit", emissionCalcUpdate);

// shows or hides section depending on heating method selected
document.getElementById("gas").addEventListener("change", showGas)
document.getElementById("electricity").addEventListener("change", showElectricity)
document.getElementById("other").addEventListener("change", hideHeatingSections)

function getCheckedValue(radioBtnName) {
  // returns value of radio button checked
  let radioBtns = document.getElementsByName(radioBtnName);
  for (let i = 0; i < radioBtns.length; i++) {
    if (radioBtns[i].checked == true) {
      return radioBtns[i].value;
    }
  }
  // returns null if nothing is selected
  return null
}

// Clears the energy usage answer
function clearUsage(){
  const usageBtns = document.getElementsByName("energy_usage");
  for (let i = 0; i < usageBtns.length; i++) {
    usageBtns[i].checked = false;
  }
}

// show gas section in Carbon_Emission_Calculator.html
function showGas(){
  clearUsage();
  const gas = document.getElementById("gasHeating");
  const electricity = document.getElementById("electricHeating"); 
  gas.style.display = "block";
  electricity.style.display = "none";
}

// shows electricity section in Carbon_Emission_Calculator.html
function showElectricity(){
  clearUsage();
  const gas = document.getElementById("gasHeating");
  const electricity = document.getElementById("electricHeating"); 
  gas.style.display = "none";
  electricity.style.display = "block";
}

// hides both gas and electric sections when other is selected
function hideHeatingSections(){
  clearUsage();
  const gas = document.getElementById("gasHeating");
  const electricity = document.getElementById("electricHeating"); 
  gas.style.display = "none";
  electricity.style.display = "none";
}

function emissionCalcUpdate(evt) {
  // stops page from being reloaded when form is submitted
  evt.preventDefault();

  let result = document.getElementById("calcResult");

  // clears the previous results
  result.innerHTML = "";

  // getting user inputs
  let car = getCheckedValue("car_travel");
  let transport = getCheckedValue("public_transport");
  let plane = getCheckedValue("plane_travel");
  let heating = getCheckedValue("heating_type");
  let usage = getCheckedValue("energy_usage");
  let diet = getCheckedValue("diet");
  let clothes = getCheckedValue("clothes");
  let recycle = getCheckedValue("recycle");

  // clears previous error messages
  document.querySelectorAll(".validation_error").forEach(function(error) {
    error.textContent = "";
  });

  // checks for unanswered questions
  if (car === null) {
    document.getElementById("carError").textContent = "Please select your car travel distance.";
    return;
  }

  if (transport === null) {
    document.getElementById("transportError").textContent = "Please select your public transport distance.";
    return;
  }

  if (plane === null) {
    document.getElementById("planeError").textContent = "Please select your flight frequency.";
    return;
  }

  if (heating === null) {
    document.getElementById("heatingError").textContent = "Please select your heating type.";
    return;
  }

  if ((heating === "Gas" || heating === "Electricity") && usage === null) {
    document.getElementById("usageError").textContent = "Please select your energy usage.";
    return;
  }

  if (diet === null) {
    document.getElementById("dietError").textContent = "Please select your diet.";
    return;
  }

  if (clothes === null) {
    document.getElementById("clothesError").textContent = "Please select how often you buy clothes.";
    return;
  }

  if (recycle === null) {
    document.getElementById("recycleError").textContent = "Please select your recycling frequency.";
    return;
  }

  // calling the emissionCalculator function and passing parameters
  emissionCalculator(car, transport, plane, heating, usage, diet, clothes, recycle, result);
}

// Transport
function calculateTransport(car, transport, plane) {
  // Calc for car and public 
  let total = (Number(car) * CAR_KG_PER_KM * 52) + (Number(transport) * PTRANSPORT_KG_PER_KM * 52)

  // https://www.evertreen.com/news/how-much-co2-does-a-flight-emit
  if (plane === "1/2") {
    total += 450; // about 1 and a half short-haul return flights
  } else if (plane === "3") {
    total += 1200; // 3 to 4 short-haul returns
  } else if (plane === "longHaul"){
    total += 1800; // a typical long-haul
  }
  return total;
}

// Home energy
function calculateEnergy(heating, usage){
  let kwh = 0;

  // https://www.britishgas.co.uk/energy/guides/average-bill.html
  if (heating === "Gas") {
    if (usage === "Low") {
      kwh = 500;
    } else if (usage === "Medium") {
      kwh = 800;
    } else if (usage === "High") {
      kwh = 1200;
    }
    return kwh * 12 * GAS_KG_PER_KWH;
  } else if (heating === "Electricity") {
    if (usage === "Low") {
      kwh = 133;
    } else if (usage === "Medium") {
      kwh = 208;
    } else if (usage === "High") {
      kwh = 317;
    }
    return kwh * 12 * ELECTRIC_KG_PER_KWH;
  } else if (heating === "Other") {
    // since there is no other choices, uses average of gas and electric
    return OTHER_HEATING_KG;
  }
  // when nothing is selected
  return 0;
}

//food
function calculateFood(diet) {
  // https://pmc.ncbi.nlm.nih.gov/articles/PMC12030518/
  if (diet === "Vegan") {
    return 900;
  } else if (diet === "Veg") {
    return 1500;
  } else if (diet === "SomeMeat") {
    return 2600; // medium meat
  } else if (diet === "Meat") {
    return 3800; // high meat
  }
  return 0;
}

// Lifestyle - clothes and recycling
function calculateLifestyle(clothes, recycle) {
  let total = 0;
  
  // https://www.carbontrust.com/sites/default/files/documents/resource/public/International%20Carbon%20Flows%20-%20Clothing%20-%20REPORT.pdf
  if (clothes === "Rarely") {
    total = 60; // 0 to 1 items
  } else if (clothes === "Sometimes") {
    total = 300; // 2 to 3 items
  } else if (clothes === "Often") {
    total = 600; // 4 or more items
  }

  // rough estimates since there is no single number on recycling
  if (recycle === "Sometimes") {
    total += 100;
  } else if (recycle === "Never") {
    total += 250;
  }
  return total;
}

function emissionCalculator(car, transport, plane, heating, usage, diet, clothes, recycle, result) {

  // finding out each section of the calculation
  let transportTotal = calculateTransport(car, transport, plane);
  let energyTotal = calculateEnergy(heating, usage);
  let foodTotal = calculateFood(diet);
  let lifestyleTotal = calculateLifestyle(clothes, recycle);
  let total = transportTotal + energyTotal + foodTotal + lifestyleTotal;

  // initialising elements and assigning tags
  let resultContainer = document.createElement("section");
  resultContainer.classList.add("result_container");

  let resultHeading = document.createElement("h2");
  resultHeading.textContent = "Carbon Footprint Estimate:";
  resultHeading.classList.add("result_heading");

  let emissionTotalDisplay = document.createElement("p");
  emissionTotalDisplay.textContent = "Estimated Total: " + total.toFixed(0) + " kg CO2 per year";
  emissionTotalDisplay.classList.add("total");

  // comparison with UK average
  let comparisonDisplay = document.createElement("p");
  let diff = total - AVERAGE_UK_CO2;
  let percent = Math.abs(diff / AVERAGE_UK_CO2 * 100).toFixed(0);

  // displaying message if user is above or below UK average
  if (diff > 0) {
    comparisonDisplay.textContent = "That's " + percent + "% above the UK average of " + AVERAGE_UK_CO2 + " kg per year.";
  } else {
    comparisonDisplay.textContent = "That's " + percent + "% below the UK average of " + AVERAGE_UK_CO2 + " kg per year.";
  }
  comparisonDisplay.classList.add("result_details");

  let transportDisplay = document.createElement("p");
  transportDisplay.textContent = "Transport: " + transportTotal.toFixed(0) + " kg CO2 per Year";
  transportDisplay.classList.add("result_details");

  let energyDisplay = document.createElement("p");
  energyDisplay.textContent = "Home energy: " + energyTotal.toFixed(0) + " kg CO2 per year";
  energyDisplay.classList.add("result_details");

  let foodDisplay = document.createElement("p");
  foodDisplay.textContent = "Food: " + foodTotal.toFixed(0) + " kg CO2 per year";
  foodDisplay.classList.add("result_details");

  let lifestyleDisplay = document.createElement("p");
  lifestyleDisplay.textContent = "Lifestyle: " + lifestyleTotal.toFixed(0) + " kg CO2 per year";
  lifestyleDisplay.classList.add("result_details");

  // appending attributes to result container
  resultContainer.appendChild(resultHeading);
  resultContainer.appendChild(emissionTotalDisplay);
  resultContainer.appendChild(comparisonDisplay);
  resultContainer.appendChild(transportDisplay);
  resultContainer.appendChild(energyDisplay);
  resultContainer.appendChild(foodDisplay);
  resultContainer.appendChild(lifestyleDisplay);

  // appending the container to the calcResult section
  result.appendChild(resultContainer);

  // displaying the result section
  result.style.display = "flex";
}