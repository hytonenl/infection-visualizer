const HEALTHY_COLOR = 'rgba(200, 200, 200, 0.7)';
const SICK_COLOR = 'rgba(200, 50, 50, 0.7)';
const IMMUNE_COLOR = 'rgba(0, 255, 0, 0.7)';

const HEALING_TIME = 20; // Time it takes to heal from the infection (seconds)
const INFECTION_THRESHOLD = 0.1; // Chance to contract the disease
const INFECTION_RADIUS = 20; // Radius where the sick may contract the disease
const SPEED_SCALE = 1.5; // Particle speed scale
const Y_MARGINAL_TOP = 100; // Marginal size at the top of the canvas
const Y_MARGINAL_BOTTOM = 100; // Marginal size at the bottom of the canvas

// Variables for DOM elements on the top of the canvas
let startButton;
let clearHistoryButton;
let sickSlider;
let stationaryProbabilitySlider;

// Array containing all the particles in the canvas
let runId;
let particles = [];
let particleCount = 100;
let sickCount = 3;
let stationaryProbability;
let currentSickCount = 0;
let sickHistory = {};

function makeid(length) {
  var result = '';
  var characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for ( var i = 0; i < length; i++ ) {
     result += characters.charAt(floor(random(0, 1) * charactersLength));
  }
  return result;
}

// Update the statistics shown at the bottom of the canvas
function updateStats() {
  // Add text to show the current count of sick people
  strokeWeight(2);
  stroke(0, 0, 0);
  fill(255, 0, 0);
  textSize(20);
  text(currentSickCount, 10, height - 75);

  // Refresh the sickHistory array every 20th frame so that it does not get too expensive to draw
  if (frameCount % 20 === 0 && currentSickCount) {
    sickHistory[runId].values.push(currentSickCount);
  }

  // Draw a bar chart at the bottom of the page plotting time vs. sick count
  strokeWeight(2);
  strokeCap(SQUARE);
  Object.values(sickHistory).forEach((run) => {
    stroke(run.color);
    for (let i = 0; i < run.values.length; i++) {
      if (i) {
        y_previous = run.values[i - 1] / particles.length * Y_MARGINAL_BOTTOM;
        y_current = run.values[i] / particles.length * Y_MARGINAL_BOTTOM;
        x_previous = (i - 1) * 3;
        x_current = i * 3;
        line(x_previous, height - y_previous, x_current, height - y_current);
      }
    }
  });
}

function setup() {
  // Create a start button which upon pressed resets the state and starts the simulation
  startButton = createButton('START NEW');
  startButton.position(10, Y_MARGINAL_TOP - 80);
  startButton.mousePressed(reset);

  // Create button to clean graphs
  clearHistoryButton = createButton('CLEAR ALL');
  clearHistoryButton.position(10, Y_MARGINAL_TOP - 50);
  clearHistoryButton.mousePressed(clearAll);

  // Create a slider to let user input the sick count at the beginning of simulation
  sickSlider = createSlider(1, 20, 5, 1);
  sickSlider.position(125, Y_MARGINAL_TOP/3);
  
  // Create a slider to let user input the total particlecount of the simulation
  stationaryProbabilitySlider = createSlider(0.05, 0.95, 0.1, 0.1);
  stationaryProbabilitySlider.position(325, Y_MARGINAL_TOP/3);
  
  createCanvas(500, 700);
}

function clearAll() {
  sickHistory = {};
  reset();
}

function getRandomColor() {
  return color(random(0, 255), random(0, 255), random(0, 255));
}

// Reset particles and start the simulation
function reset() {
  // Assign new runId
  runId = makeid(10);

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
  sickCount = sickSlider.value();
  
  // Create healthy particles
  Array(particleCount - sickCount).fill().forEach(() => particles.push(new Particle()));
  // Create sick particles
  Array(sickCount).fill().forEach(() => particles.push(new Particle(true)));
}

function draw() {
  background('rgb(255, 255, 255)');
  particles.forEach((particle, index) => {
    particle.move();
    particle.infect(particles.slice(index + 1));
    particle.update();
  });
  strokeWeight(1)
  stroke(0, 0, 0)
  fill(0, 0, 0);
  line(0, height - Y_MARGINAL_BOTTOM, width, height - Y_MARGINAL_BOTTOM);
  line(0, height - Y_MARGINAL_BOTTOM, width, height - Y_MARGINAL_BOTTOM);
  
  textSize(18);
  text(`sick count: ${sickSlider.value()}`, sickSlider.x + 20, Y_MARGINAL_TOP/4);
  text(`stationary: ${floor(stationaryProbabilitySlider.value() * 100)}%`, stationaryProbabilitySlider.x + 10, Y_MARGINAL_TOP/4);
  textSize(12);
  text("1", sickSlider.x - 15, Y_MARGINAL_TOP/2);
  text("20", sickSlider.x + sickSlider.width + 15, Y_MARGINAL_TOP/2);
  text("5%", stationaryProbabilitySlider.x - 25, Y_MARGINAL_TOP/2);
  text("95%", stationaryProbabilitySlider.x + stationaryProbabilitySlider.width + 15, Y_MARGINAL_TOP/2);
  
  updateStats();
}