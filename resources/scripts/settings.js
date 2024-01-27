const sound = {
  onOrOff: true,
  toggle: document.getElementById("toggle"),
  toggleText: document.getElementById("toggle-text"),
  slider: document.getElementById("sound-slider"),
  sliderValue: document.getElementById("sound-slider-value"),
};
sound.toggle.addEventListener("change", () => {
  if (sound.toggle.checked) {
    sound.onOrOff = true;
    sound.toggleText.innerHTML = "On";
  } else {
    sound.onOrOff = false;
    sound.toggleText.innerHTML = "Off";
		sound.slider.value = 0;
  }
});
sound.slider.addEventListener("input", () => {
  sound.sliderValue.value = sound.slider.value;
});

// update slider value when input is changed
sound.sliderValue.addEventListener("input", () => {
	if (sound.sliderValue.value > 100) {
    sound.sliderValue.value = 100;
  } else if (sound.sliderValue.value < 0) {
    sound.sliderValue.value = 0;
  }
  sound.slider.value = sound.sliderValue.value;
	sound.slider.value = sound.sliderValue.value;
});
// block non-numeric input
sound.sliderValue.addEventListener("keypress", (e) => {
	if (e.key == "1", "2", "3", "4", "5", "6", "7", "8", "9", "0") {
		// do nothing
	} else {
		e.preventDefault();
	}
});

// load settings from local storage
document.addEventListener("DOMContentLoaded", () => {
	if (localStorage.getItem("soundToggled") === "true") {
		sound.toggle.checked = true;
		sound.toggleText.innerHTML = "On";
	} else {
		sound.toggle.checked = false;
		sound.toggleText.innerHTML = "Off";
	}
	sound.slider.value = localStorage.getItem("volume");
	sound.sliderValue.value = localStorage.getItem("volume");
});

// save settings to local storage
function populateStorage() {
  localStorage.setItem("volume", sound.slider.value);
  localStorage.setItem("soundToggled", sound.toggle.checked);
}

console.log(localStorage);



// delete everything in local storage
// localStorage.clear();
