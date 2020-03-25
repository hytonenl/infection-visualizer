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
let capacitySlider;

// Runtime variables
let particles = [];         // Array to store all the particles visible in the canvas.
let particleCount = 100;    // Total number of particles in the canvas.

// Simulation parameters defined by slider values
let startSickCount;         // Sick count at the beginning of the simulation.
let stationaryProbability;  // Probability for a particle to be a stationary particle.
let infectionRadius;        // Radius where the sick may contract the disease
let healingTime;            // Time it takes to heal from the infection (seconds)
let infectivity;            // How well the infection spreads.
let capacity;               // Hospital capacity. Infected outside capacity may die.

let currentSickCount = 0;   // Count of sick particles at each frame.
let currentHealedCount = 0; // Count of particles that have healed from the infection.
let stats = {};             // Object to store history of the run.

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
    { text: `${max}${unit}`, x: slider.x + slider.width + 17, y: slider.y + 15 }
  );
  return slider;
}

// Update the statistics shown at the bottom of the canvas
function updateStats() {
  const stepSize = 2;
  const statsMaxLength = width / stepSize;

  strokeWeight(2);
  stroke(0, 0, 0);
  fill(255, 0, 0);

  // Refresh the stats only every 20th frame so that it does not get too expensive to draw
  if (frameCount % 10 === 0 && currentSickCount) {
    stats.sick.push(currentSickCount);
    stats.healed.push(currentHealedCount);
    if (stats.sick.length > statsMaxLength) {
      stats.sick.shift();
      stats.healed.shift();
    }
  }

  if (stats.sick) {
    // Draw a bar chart at the bottom of the page plotting time vs. sick count
    strokeWeight(stepSize);
    strokeCap(SQUARE);
    for (let i = 0; i < stats.sick.length; i++) {
      const x = i * stepSize;
      const ySick = stats.sick[i] / particles.length * Y_MARGINAL_BOTTOM;
      stroke(color('rgba(200, 50, 50, 0.5)'));
      line(x, height, x, height - ySick);

      const yHealed = ySick + (stats.healed[i] / particles.length * Y_MARGINAL_BOTTOM);
      stroke(color('rgba(0, 255, 0, 0.5)'));
      if (height - ySick !== height - yHealed) {
        line(x, height - ySick, x, height - yHealed);
      }

      stroke(color('rgba(200, 200, 200, 0.5)'));
      line(x, height - yHealed, x, height - Y_MARGINAL_BOTTOM);
    }
  }
}

// Reset particles and start the simulation
function reset() {
  // Clear the timeouts of any particles from previous run
  particles.forEach(particle => clearTimeout(particle.timeoutId));

  // Reset particles and statistics
  particles = [];
  stats = {};
  stats.sick = [];
  stats.healed = [];

  // Read the initial particle & sick counts from the slider values
  stationaryProbability = stationaryProbabilitySlider.value()/100;
  startSickCount = sickSlider.value();
  infectionRadius = infectionRadiusSlider.value();
  healingTime = healingTimeSlider.value();
  infectivity = infectivitySlider.value()/50;
  capacity = capacitySlider.value();

  // Create healthy particles
  Array(particleCount - startSickCount).fill().forEach(() => particles.push(new Particle()));
  // Create sick particles
  Array(startSickCount).fill().forEach(() => particles.push(new Particle(true)));
}

// Clear the state, including the drawn sick history
function clearAll() {
  stats = {};

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
    { min: 50, max: 90, start: 75, step: 5, unit: '%', row: 2, col: 3, text: 'hospital capacity' },
  ];
  [
    sickSlider,
    stationaryProbabilitySlider,
    infectionRadiusSlider,
    healingTimeSlider,
    infectivitySlider,
    capacitySlider,
  ] = sliders.map(slider => createSliderWithText(slider))

  // Create the actual canvas
  createCanvas(WIDTH, HEIGHT);
}

// p5.js draw function. Continuously executes to update the canvas.
function draw() {
  background('rgb(255, 255, 255)');

  stroke(200, 200, 200);
  strokeWeight(2);
  line(0, Y_MARGINAL_TOP, width, Y_MARGINAL_TOP);
  line(0, height - Y_MARGINAL_BOTTOM, width, height - Y_MARGINAL_BOTTOM);
  line(1, Y_MARGINAL_TOP, 1, height - Y_MARGINAL_BOTTOM);
  line(width - 1, Y_MARGINAL_TOP, width - 1, height - Y_MARGINAL_BOTTOM);

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
  // Update current healed count
  currentHealedCount = particles.filter(p => p.isImmune).length;

  // Set text properties
  strokeWeight(0.2);
  fill(0, 0, 0);
  stroke(0, 0, 0);
  textAlign(CENTER)
  textSize(14);

  // Draw the text fields
  sliderTextsAbove.forEach(t => text(`${t.text}: ${t.target.value()}${t.unit}`, t.x, t.y));

  textSize(12);
  sliderTextsSides.forEach(t => text(t.text, t.x, t.y));

  // Finally, update the run specific statistics
  updateStats();

  // Draw a line for hospital capacity
  if (capacity) {
    strokeWeight(1);
    stroke(0, 0, 0);
    fill(0, 0, 0);
    line(0, height - capacity, width, height - capacity);
  }
}
