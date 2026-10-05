let phrase = "web tool is so good! web tool is so good!";
let chars = [];

window.letterHue = 30;
window.letterSize = 40;

function setup() {
  let canvas = createCanvas(600, 600);
  canvas.parent("canvasArea");

  colorMode(HSB, 360, 100, 100);

  chars = phrase.split("");

  frameRate(8);
}

function draw() {
  background(0, 0, 40);

  fill(window.letterHue, 80, 100);
  textSize(window.letterSize);
  noStroke();

  for (let i = 0; i < 40; i++) {
    let c = random(chars);
    let x = random(width);
    let y = random(height);

    text(c, x, y);
  }
}
