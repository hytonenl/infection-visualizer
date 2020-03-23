'use strict';

const WIDTH = 500;
const HEIGHT = 800;

const Y_MARGINAL_TOP = 200; // Marginal size at the top of the canvas
const Y_MARGINAL_BOTTOM = 100; // Marginal size at the bottom of the canvas

// Variables for DOM elements at the top of the canvas
let startButton;
let clearAllButton;

let sickSlider;
let stationaryProbabilitySlider;
let infectionRadiusSlider;
let healingTimeSlider;

// Runtime variables
let runId;                  // Each run is assigned a unique runId to store run specific history.
let particles = [];         // Array to store all the particles visible in the canvas.
let particleCount = 100;    // Total number of particles in the canvas.

let startSickCount;         // Sick count at the beginning of the simulation.
let stationaryProbability;  // Probability for a particle to be a stationary particle.
let infectionRadius;        // Radius where the sick may contract the disease
let healingTime;            // Time it takes to heal from the infection (seconds)

let currentSickCount = 0;   // Count of sick particles at each frame.
let sickHistory = {};       // Object to store history of previous runs.

// Update the statistics shown at the bottom of the canvas
function updateStats() {
  // Add text to show the current count of sick people
  strokeWeight(2);
  stroke(0, 0, 0);
  fill(255, 0, 0);
  textSize(20);
  text(currentSickCount, 10, height - 75);

  // Refresh the sickHistory array only every 20th frame so that it does not get too expensive to
  // draw
  if (frameCount % 20 === 0 && currentSickCount) {
    sickHistory[runId].values.push(currentSickCount);
  }

  // Draw a bar chart at the bottom of the page plotting time vs. sick count
  strokeWeight(2);
  strokeCap(ROUND);
  Object.values(sickHistory).forEach((run) => {
    stroke(run.color);
    for (let i = 0; i < run.values.length; i++) {
      if (i) {
        const yPrevious = run.values[i - 1] / particles.length * Y_MARGINAL_BOTTOM;
        const yCurrent = run.values[i] / particles.length * Y_MARGINAL_BOTTOM;
        const xPrevious = (i - 1) * 3;
        const xCurrent = i * 3;
        line(xPrevious, height - yPrevious, xCurrent, height - yCurrent);
      }
    }
  });
}

// Reset particles and start the simulation
function reset() {
  // Assign new runId
  runId = getRunId(10);

  // Clear the timeouts of any particles from previous run
  particles.forEach(particle => clearTimeout(particle.timeoutId));

  // Reset particles and statistics
  particles = [];
  sickHistory[runId] = {};
  sickHistory[runId].color = getRandomColor();
  sickHistory[runId].values = [];
  currentSickCount = 0;

  // Read the initial particle & sick counts from the slider values
  stationaryProbability = stationaryProbabilitySlider.value();
  startSickCount = sickSlider.value();
  infectionRadius = infectionRadiusSlider.value();
  healingTime = healingTimeSlider.value();

  // Create healthy particles
  Array(particleCount - startSickCount).fill().forEach(() => particles.push(new Particle()));
  // Create sick particles
  Array(startSickCount).fill().forEach(() => particles.push(new Particle(true)));
}

// Clear the state, including the drawn sick history
function clearAll() {
  sickHistory = {};

  // Clear the timeouts of any particles from previous run
  particles.forEach(particle => clearTimeout(particle.timeoutId));

  // Reset particles
  particles = [];
}

// p5.js setup function. Called once when the program starts.
function setup() {
  // Create a start button which upon pressed resets the state and starts the simulation
  startButton = createButton('START NEW');
  startButton.size(100)
  startButton.position(WIDTH / 3 - 50, Y_MARGINAL_TOP - 25);
  startButton.mousePressed(reset);

  // Create a button to clean all
  clearAllButton = createButton('CLEAR ALL');
  clearAllButton.size(100)
  clearAllButton.position(2 * WIDTH / 3 - 50, Y_MARGINAL_TOP - 25);
  clearAllButton.mousePressed(clearAll);

  // Create a slider to let user input the sick count at the beginning of simulation
  sickSlider = createSlider(1, 20, 5, 1);
  sickSlider.size(100)
  sickSlider.position(WIDTH/6 - 50, Y_MARGINAL_TOP/5);

  // Create a slider to let user input the probability for a particle to start as a stationary
  // particle
  stationaryProbabilitySlider = createSlider(0.05, 0.95, 0.1, 0.1);
  stationaryProbabilitySlider.size(100)
  stationaryProbabilitySlider.position(3*WIDTH/6 - 50, Y_MARGINAL_TOP/5);

  // Create a slider to let user input the interaction radius between two particles
  infectionRadiusSlider = createSlider(10, 30, 20, 5);
  infectionRadiusSlider.size(100)
  infectionRadiusSlider.position(5*WIDTH/6 - 50, Y_MARGINAL_TOP/5);

  // Create a slider to let user input the healing time of the disease
  healingTimeSlider = createSlider(10, 50, 20, 5);
  healingTimeSlider.size(100);
  healingTimeSlider.position(WIDTH/6 - 50, 3*Y_MARGINAL_TOP/5);

  // Create the actual canvas
  createCanvas(WIDTH, HEIGHT);
}

// p5.js draw function. Continuously executes to update the canvas.
function draw() {
  background('rgb(255, 255, 255)');

  // For each particle, we will
  //  * calculate new position
  //  * check whether it should be infected or not
  //  * update its graphics in the canvas
  particles.forEach((particle, index) => {
    particle.move();
    particle.infect(particles.slice(index + 1));
    particle.update();
  });

  // Update current sick count
  currentSickCount = particles.filter(p => p.isInfected).length;

  // Set text properties
  fill(0, 0, 0);
  strokeWeight(0.5);
  textSize(14);

  // Draw the text fields
  text(`sick count: ${sickSlider.value()}`, sickSlider.x + 12, sickSlider.y - 10);
  text(`stationary: ${floor(stationaryProbabilitySlider.value() * 100)}%`,
    stationaryProbabilitySlider.x + 8, sickSlider.y - 10);
  text(`infection radius: ${infectionRadiusSlider.value()}`, infectionRadiusSlider.x, infectionRadiusSlider.y - 10);
  text(`healing time: ${healingTimeSlider.value()} s`, healingTimeSlider.x, healingTimeSlider.y - 10);

  textSize(12);
  text("1", sickSlider.x - 15, sickSlider.y + 15);
  text("20", sickSlider.x + sickSlider.width + 15, sickSlider.y + 15);
  text("5%", stationaryProbabilitySlider.x - 20, stationaryProbabilitySlider.y + 15);
  text("95%", stationaryProbabilitySlider.x + stationaryProbabilitySlider.width + 10, stationaryProbabilitySlider.y + 15);
  text("10", infectionRadiusSlider.x - 15, infectionRadiusSlider.y + 15);
  text("30", infectionRadiusSlider.x + infectionRadiusSlider.width + 15, infectionRadiusSlider.y + 15);
  text("10s", healingTimeSlider.x - 25, healingTimeSlider.y + 15);
  text("50s", healingTimeSlider.x + healingTimeSlider.width + 15, healingTimeSlider.y + 15);

  // Finally, update the run specific statistics
  updateStats();
}
