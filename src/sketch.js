'use strict';

const Y_MARGINAL_TOP = 100; // Marginal size at the top of the canvas
const Y_MARGINAL_BOTTOM = 100; // Marginal size at the bottom of the canvas

// Variables for DOM elements at the top of the canvas
let startButton;
let clearAllButton;
let sickSlider;
let stationaryProbabilitySlider;

// Runtime variables
let runId;                  // Each run is assigned a unique runId to store run specific history.
let particles = [];         // Array to store all the particles visible in the canvas.
let particleCount = 100;    // Total number of particles in the canvas.
let startSickCount = 3;     // Sick count at the beginning of the simulation.
let stationaryProbability;  // Probability for a particle to be a stationary particle.
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

  // Create healthy particles
  Array(particleCount - startSickCount).fill().forEach(() => particles.push(new Particle()));
  // Create sick particles
  Array(startSickCount).fill().forEach(() => particles.push(new Particle(true)));
}

// Clear the state, including the drawn sick history
function clearAll() {
  sickHistory = {};
  reset();
}

// p5.js setup function. Called once when the program starts.
function setup() {
  // Create a start button which upon pressed resets the state and starts the simulation
  startButton = createButton('START NEW');
  startButton.position(10, Y_MARGINAL_TOP - 80);
  startButton.mousePressed(reset);

  // Create a button to clean all
  clearAllButton = createButton('CLEAR ALL');
  clearAllButton.position(10, Y_MARGINAL_TOP - 50);
  clearAllButton.mousePressed(clearAll);

  // Create a slider to let user input the sick count at the beginning of simulation
  sickSlider = createSlider(1, 20, 5, 1);
  sickSlider.position(125, Y_MARGINAL_TOP/3);

  // Create a slider to let user input the probability for a particle to start as a stationary
  // particle
  stationaryProbabilitySlider = createSlider(0.05, 0.95, 0.1, 0.1);
  stationaryProbabilitySlider.position(325, Y_MARGINAL_TOP/3);

  // Create the actual canvas
  createCanvas(500, 700);
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
  textSize(16);

  // Draw the text fields
  text(`sick count: ${sickSlider.value()}`, sickSlider.x + 20, Y_MARGINAL_TOP/4);
  text(`stationary: ${floor(stationaryProbabilitySlider.value() * 100)}%`,
    stationaryProbabilitySlider.x + 10, Y_MARGINAL_TOP/4);
  textSize(12);
  text("1", sickSlider.x - 15, Y_MARGINAL_TOP/2);
  text("20", sickSlider.x + sickSlider.width + 15, Y_MARGINAL_TOP/2);
  text("5%", stationaryProbabilitySlider.x - 25, Y_MARGINAL_TOP/2);
  text("95%", stationaryProbabilitySlider.x + stationaryProbabilitySlider.width + 15, Y_MARGINAL_TOP/2);

  // Finally, update the run specific statistics
  updateStats();
}
