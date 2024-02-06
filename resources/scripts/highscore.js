console.log("highscore.js loaded");

console.log(localStorage.getItem("highscoreLevel"));

document.getElementById("highscoreLevel").innerHTML =
  localStorage.getItem("highscoreLevel");

time = localStorage.getItem("highscoreTime");
minutes = Math.floor(time / 60);
seconds = time - minutes * 60;
if (seconds < 10) {
  seconds = "0" + seconds;
}
document.getElementById("highscoreTime").innerHTML = minutes + ":" + seconds;

function resetHighscore() {
  localStorage.setItem("highscoreLevel", 0);
  localStorage.setItem("highscoreTime", 0);
  location.reload();
}
