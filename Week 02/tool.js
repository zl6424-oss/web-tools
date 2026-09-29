let colorSlider = document.getElementById("colorSlider");
let sizeSlider = document.getElementById("sizeSlider");
let downloadButton = document.getElementById("downloadButton");

colorSlider.addEventListener("input", function () {
  window.letterHue = Number(colorSlider.value);
});

sizeSlider.addEventListener("input", function () {
  window.letterSize = Number(sizeSlider.value);
});

downloadButton.addEventListener("click", function () {
  saveCanvas("letter-scatter", "png");
});
