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
let infectivitySlider;

// Runtime variables
let runId;                  // Each run is assigned a unique runId to store run specific history.
let particles = [];         // Array to store all the particles visible in the canvas.
let particleCount = 100;    // Total number of particles in the canvas.

// Simulation parameters
let startSickCount;         // Sick count at the beginning of the simulation.
let stationaryProbability;  // Probability for a particle to be a stationary particle.
let infectionRadius;        // Radius where the sick may contract the disease
let healingTime;            // Time it takes to heal from the infection (seconds)
let infectivity;            // How well the infection spreads.

let currentSickCount = 0;   // Count of sick particles at each frame.
let sickHistory = {};       // Object to store history of previous runs.

let sliderTextsAbove = [];
let sliderTextsSides = [];

function createSliderWithText(values) {
  const { min, max, start, step, unit, row, col, text } = values;
  const slider = createSlider(min, max, start, step);
  slider.size(100)
  slider.position((2 * col - 1) * WIDTH / 6 - 50, (2 * row - 1) * Y_MARGINAL_TOP / 5);

  sliderTextsAbove.push({ text, target: slider, x: slider.x + 50, y: slider.y - 10, unit })
  sliderTextsSides.push(
    { text: `${min}${unit}`, x: slider.x - 15, y: slider.y + 15 },
    { text: `${max}${unit}`, x: slider.x + slider.width + 15, y: slider.y + 15 }
  );
  return slider;
}

// Update the statistics shown at the bottom of the canvas
function updateStats() {
  strokeWeight(2);
  stroke(0, 0, 0);
  fill(255, 0, 0);

  // Refresh the sickHistory array only every 20th frame so that it does not get too expensive to
  // draw
  if (frameCount % 20 === 0 && currentSickCount) {
    sickHistory[runId].values.push(currentSickCount);
  }

  // Draw a bar chart at the bottom of the page plotting time vs. sick count
  strokeWeight(2);
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
  stationaryProbability = stationaryProbabilitySlider.value()/100;
  startSickCount = sickSlider.value();
  infectionRadius = infectionRadiusSlider.value();
  healingTime = healingTimeSlider.value();
  infectivity = infectivitySlider.value()/50;

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

  // Define sliders
  const sliders = [
    { min: 1, max: 20, start: 5, step: 1, unit: '', row: 1, col: 1, text: 'sick count' },
    { min: 5, max: 95, start: 10, step: 10, unit: '%', row: 1, col: 2, text: 'stationary' },
    { min: 10, max: 30, start: 20, step: 5, unit: '', row: 1, col: 3, text: 'infection radius' },
    { min: 10, max: 50, start: 20, step: 5, unit: 's', row: 2, col: 1, text: 'healing time' },
    { min: 1, max: 10, start: 5, step: 1, unit: '', row: 2, col: 2, text: 'infectivity' },
  ];
  [
    sickSlider,
    stationaryProbabilitySlider,
    infectionRadiusSlider,
    healingTimeSlider,
    infectivitySlider
  ] = sliders.map(slider => createSliderWithText(slider))

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
  textAlign(CENTER)
  textSize(14);

  // Draw the text fields
  sliderTextsAbove.forEach(t => text(`${t.text}: ${t.target.value()}${t.unit}`, t.x, t.y));

  textSize(12);
  sliderTextsSides.forEach(t => text(t.text, t.x, t.y));

  // Finally, update the run specific statistics
  updateStats();
}
