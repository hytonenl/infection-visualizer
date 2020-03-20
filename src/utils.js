'use strict';

// Get a random runId of the provided length
function getRunId(length) {
  var result = '';
  var characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
  for ( var i = 0; i < length; i++ ) {
     result += characters[(floor(random(0, 1) * characters.length))];
  }
  return result;
}

// Get a random RGB color
function getRandomColor() {
  return color(random(0, 255), random(0, 255), random(0, 255));
}
