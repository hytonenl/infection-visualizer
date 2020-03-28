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
let startinfectedCount;         // Sick count at the beginning of the simulation.
let stationaryProbability;  // Probability for a particle to be a stationary particle.
let infectionRadius;        // Radius where the sick may contract the disease
let healingTime;            // Time it takes to heal from the infection (seconds)
let infectivity;            // How well the infection spreads.
let capacity;               // Hospital capacity. Infected outside capacity may die.

let stats = {};             // Object to store the history of the run.

let sliderTextsAbove = [];
let sliderTextsSides = [];

// Utility function to create template slider with text on top and limits on both sides
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
  const stepSize = 4;
  const statsMaxLength = width / stepSize;

  strokeWeight(2);
  stroke(0, 0, 0);
  fill(255, 0, 0);

  // Refresh the stats only every 20th frame so that it does not get too expensive to draw
  if (frameCount % 20 === 0) {
    let deathCount = 0;
    let immuneCount = 0;
    let infectedCount = 0;

    particles.forEach((p) => {
      if (p.isDead) {
        deathCount += 1;
      } else if (p.isImmune) {
        immuneCount += 1;
      } else if (p.isInfected) {
        infectedCount += 1;
      }
    });

    stats.infected.push(infectedCount);
    stats.immune.push(immuneCount);
    stats.dead.push(deathCount);

    // Cut out the stats arrays when they reach the maximum length that can be drawn to the canvas
    if (stats.infected.length > statsMaxLength) {
      stats.infected.shift();
      stats.immune.shift();
      stats.dead.shift();
    }
  }

  // Draw a bar chart at the bottom of the page plotting time vs. sick count
  strokeWeight(stepSize);
  strokeCap(SQUARE);
  for (let i = 0; i < stats.infected.length; i++) {
    const x = i * stepSize;

    // Draw a bar for the sick
    const ySick = stats.infected[i] / particles.length * Y_MARGINAL_BOTTOM;
    stroke(color(SICK_COLOR));
    line(x, height, x, height - ySick);

    // Draw a bar for the immune
    const yImmune = ySick + (stats.immune[i] / particles.length * Y_MARGINAL_BOTTOM);
    if (height - ySick !== height - yImmune) {
      stroke(color(IMMUNE_COLOR));
      line(x, height - ySick, x, height - yImmune);
    }

    // Draw a bar for the dead
    const yDead = yImmune + (stats.dead[i] / particles.length * Y_MARGINAL_BOTTOM);
    if (height - yImmune !== height - yDead) {
      stroke(color(DEAD_COLOR));
      line(x, height - yImmune, x, height - yDead);
    }

    // Draw a bar for the uninfected
    stroke(color(HEALTHY_COLOR));
    line(x, height - yDead, x, height - Y_MARGINAL_BOTTOM);
  }
}

// Reset stats object
function resetStats() {
  stats = {};
  stats.infected = [];
  stats.immune = [];
  stats.dead = [];
}

// Reset particles and start the simulation
function reset() {
  // Clear the timeouts of any particles from previous run
  particles.forEach(particle => clearTimeout(particle.timeoutId));

  // Reset particles and statistics
  particles = [];
  resetStats();

  // Read the initial particle & sick counts from the slider values
  stationaryProbability = stationaryProbabilitySlider.value()/100;
  startinfectedCount = sickSlider.value();
  infectionRadius = infectionRadiusSlider.value();
  healingTime = healingTimeSlider.value();
  infectivity = infectivitySlider.value()/200;
  capacity = capacitySlider.value();

  // Create healthy particles
  Array(particleCount - startinfectedCount).fill().forEach(() => particles.push(new Particle()));
  // Create sick particles
  Array(startinfectedCount).fill().forEach(() => particles.push(new Particle(true)));
}

// Clear the state, including the drawn sick history
function clearAll() {
  resetStats();

  // Clear the timeouts of any particles from previous run
  particles.forEach(particle => clearTimeout(particle.timeoutId));

  // Reset particles
  particles = [];
}

// p5.js setup function. Called once when the program starts.
function setup() {
  // Reset stats
  resetStats();

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
    { min: 10, max: 50, start: 25, step: 5, unit: 's', row: 2, col: 1, text: 'healing time' },
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

  // Update particle depending on its current status
  particles.forEach((particle, index) => {
    if (!particle.isDead) {
      particle.move();
      if (!particle.isImmune || particle.isInfected) {
        particle.infect(particles.slice(index + 1));
      }
    }
    particle.update();
  });

  // If there are more infected particles that the hospital capacity, roll the dice for killing any
  // of the particles above the capacity
  const currentinfectedCount = particles.filter(p => p.isInfected).length;
  const outsideCapacity = currentinfectedCount - (capacity/100) * particleCount;
  if (outsideCapacity > 0) {
    particles.slice(particles.length - outsideCapacity).forEach((p) => {
      if (random(0, 1) < 0.001) {
        p.kill();
      }
    });
  }

  // Set text properties
  strokeWeight(0.2);
  fill(0, 0, 0);
  stroke(0, 0, 0);
  textAlign(CENTER)

  // Draw the text fields
  textSize(14);
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
