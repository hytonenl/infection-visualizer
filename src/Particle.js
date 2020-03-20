// Class to represent a single particle.
class Particle {
  constructor(isInfected = false) {
    // Start at a random position in the canvas
    this.x = random(0, width);
    this.y = random(0 + Y_MARGINAL_TOP, height - Y_MARGINAL_BOTTOM);
    this.r = 10;

    // Create a unit vector to guarantee same speed for every particle
    const { x, y } = p5.Vector.random2D();
    this.xSpeed = SPEED_SCALE * x;
    this.ySpeed = SPEED_SCALE * y;

    // Roll the dice for the particle being a stationary particle
    if (random(0, 1) <= stationaryProbability) {
      this.xSpeed = 0;
      this.ySpeed = 0;
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
    if(this.x <= 0 || this.x >= width)
      this.xSpeed *= -1;
    if(this.y <= 0 + Y_MARGINAL_TOP + this.r / 2 || this.y >= height - Y_MARGINAL_BOTTOM - this.r / 2)
      this.ySpeed *= -1;
    this.x += this.xSpeed;
    this.y += this.ySpeed;
  }

  // Infect this particle
  getInfection() {
    currentSickCount += 1;
    this.color = SICK_COLOR;
    this.isInfected = true;

    // Store pointer to this instance since the anonymous function inside the setTimeout has
    // different this scope.
    const that = this;
    this.timeoutId = setTimeout(() => {
      that.color = IMMUNE_COLOR;
      that.isImmune = true;
      that.isInfected = false;
      currentSickCount -= 1;
    }, random(0.5, 1) * HEALING_TIME * 1000);
  }

  // Draw a line between this particle and its nearby particles. If any nearby particle is
  // infected, there is a chance also this particle gets infected.
  infect(particleArray) {
    particleArray.forEach(neighbor =>{
      const distance = dist(this.x, this.y, neighbor.x, neighbor.y);
      if(distance < INFECTION_RADIUS) {
        // Draw a black line between the point and the neighbor
        strokeWeight(2);
        stroke('rgba(0, 0, 0, 1)');
        line(this.x, this.y, neighbor.x, neighbor.y);

        // Roll the dice for receiving infection
        if (!this.isImmune && !this.isInfected && neighbor.isInfected && (random(0, 1) < INFECTION_THRESHOLD)) {
          this.getInfection();
        }
      }
    });
  }
}