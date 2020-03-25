'use strict';

const HEALTHY_COLOR = 'rgba(200, 200, 200, 0.7)';
const SICK_COLOR = 'rgba(200, 50, 50, 0.7)';
const IMMUNE_COLOR = 'rgba(0, 255, 0, 0.7)';

const SPEED_SCALE = 1.2;          // Particle speed scale

// Class to represent a single particle.
class Particle {
  constructor(isInfected = false) {
    // Start at a random position in the canvas
    this.x = random(5, width - 5);
    this.y = random(0 + Y_MARGINAL_TOP + 5, height - Y_MARGINAL_BOTTOM - 5);
    this.r = 10;

    // Roll the dice for the particle being a stationary particle
    if (random(0, 1) <= stationaryProbability) {
      this.xSpeed = 0;
      this.ySpeed = 0;
    } else {
      // Create a unit vector to guarantee same speed for every particle
      const { x, y } = p5.Vector.random2D();
      this.xSpeed = SPEED_SCALE * x;
      this.ySpeed = SPEED_SCALE * y;
    }

    // Set a variable to store whether this particle has already been infected or not
    this.isImmune = false;

    // Set the infected status and color of the particle
    this.isInfected = isInfected;
    this.color = isInfected ? SICK_COLOR : HEALTHY_COLOR;
    if (isInfected) {
      this.getInfection();
    }
  }

  // Update a particle.
  update() {
    strokeWeight(0.5);
    stroke(0, 0, 0);
    fill(this.color);
    circle(this.x, this.y, this.r);
  }

  // Move the particle to the direction of the speed
  move() {
    // Invert the x-speed if the particle hits the walls
    if(this.x <= this.r / 2 || this.x >= width - this.r / 2) {
      this.xSpeed *= -1;
    }

    // Invert the y-speed if the particle hits the ceiling or the floor
    if(this.y <= 0 + Y_MARGINAL_TOP + this.r / 2 || this.y >= height - Y_MARGINAL_BOTTOM - this.r / 2) {
      this.ySpeed *= -1;
    }

    // Calculate new position
    this.x += this.xSpeed;
    this.y += this.ySpeed;
  }

  // Infect this particle
  getInfection() {
    this.color = SICK_COLOR;
    this.isInfected = true;

    // Create a timeout function to set the recovery of this particle.
    this.timeoutId = setTimeout(() => {
      this.color = IMMUNE_COLOR;
      this.isImmune = true;
      this.isInfected = false;
    }, random(0.7, 1) * healingTime * 1000);
  }

  // Draw a line between this particle and its nearby particles. If any nearby particle is
  // infected, there is a chance also this particle gets infected.
  infect(particleArray) {
    particleArray.forEach((neighbor) => {
      const distance = dist(this.x, this.y, neighbor.x, neighbor.y);
      if(distance < infectionRadius) {
        // Draw a black line between the point and the neighbor
        strokeWeight(2);
        stroke('rgba(0, 0, 0, 1)');
        line(this.x, this.y, neighbor.x, neighbor.y);

        // Roll the dice for receiving infection
        if (!this.isImmune && !this.isInfected && neighbor.isInfected && (random(0, 1) < infectivity)) {
          this.getInfection();
        }
      }
    });
  }
}
