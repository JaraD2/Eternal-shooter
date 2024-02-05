var canvas = document.querySelector("canvas");
var ctx = canvas.getContext("2d");

const game = {
  ready: false,
  paused: false,
  start: Date.now(),
  cheats: {
    spawnEnemies: true,
    invulnerability: false,
  },
  audio: {
    soundToggled: localStorage.getItem("soundToggled") || true,
    volume: localStorage.getItem("volume") || 25,
  },
  highscore: {
    level: localStorage.getItem("highscoreLevel") || 1,
    time: localStorage.getItem("highscoreTime") || "0:0",
  },
};

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
canvasWidth = canvas.width;
canvasHeight = canvas.height;

// TODO endgame statistics
var collisions = 0;

function draw(posX, posY, width, height, color) {
  ctx.fillStyle = color;
  ctx.fillRect(posX, posY, width, height);
}
function drawTexture(posX, posY, width, height, texture) {
  ctx.drawImage(texture, posX, posY, width, height);
}
function loadimage(url) {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      resolve(image);
    };
    image.src = url;
  });
}
function playSound(name) {
  if (!game.audio.soundToggled) return;
  switch (name) {
    case "shoot":
      audio = new Audio("resources/sound/shoot.wav");
      audio.volume = game.audio.volume / 100;
      audio.play();
      break;
    case "hit":
      audio = new Audio("resources/sound/explosion.wav");
      audio.volume = game.audio.volume / 100;
      audio.play();
      break;
    case "levelUp":
      audio = new Audio("resources/sound/levelup.wav");
      audio.volume = game.audio.volume / 100;
      audio.play();
      break;
    default:
      console.error(`Sound ${name} not found`);
  }
}

class Player {
  constructor(posX, posY, width, height, color) {
    this.posX = posX || canvasWidth / 2;
    this.posY = posY || canvasHeight / 2;
    this.width = width || 32;
    this.height = height || 32;
    this.color = color || "red";
    this.lives = 3;
    this.speed = 4; // lower is faster
    this.velocity = [0, 0];
    this.lastJumpTime = 0;
    this.jumpRate = 1000; // lower is faster
    this.keys = {
      w: false,
      a: false,
      s: false,
      d: false,
      " ": false,
    };
    this.level = 1;
    this.firing = false;
    this.projectilesPerShot = 8;
    this.activeUpgrades = {
      shootBehind: false,
      shootingRing: {
        active: false,
        level: 0,
      },
      doubleShot: false,
      speedUpgrade: {
        active: false,
        level: 0,
      },
      bulletSpeed: {
        active: false,
        level: 0,
      },
      shotgun: {
        active: false,
        spread: 0.5,
      },
    };
    this.bullets = [];
    this.lastShotTime = 0;
    this.fireRate = 750; // lower is faster
    this.gunWidth = 22;
    this.gunHeight = 10;
    this.gunColor = "black";
    this.gunAngle = 0;
    this.ammo = 1; // TODO add Realoading
  }

  position() {
    if (this.keys["a"]) {
      if (this.velocity[0] > -this.speed) {
        this.velocity[0] -= deltaTime / 2;
      }
    }
    if (this.keys["d"]) {
      if (this.velocity[0] < this.speed) {
        this.velocity[0] += deltaTime / 3;
      }
    }
    if (this.keys["w"]) {
      if (this.velocity[1] > -this.speed) {
        this.velocity[1] -= deltaTime / 3;
      }
    }
    if (this.keys["s"]) {
      if (this.velocity[1] < this.speed) {
        this.velocity[1] += deltaTime / 3;
      }
    }
    if (this.firing) {
      this.shoot();
    }

    this.posX += this.velocity[0];
    this.posY += this.velocity[1];
    if (this.keys["a"] === false && this.keys["d"] === false) {
      this.velocity[0] *= 0.1;
    }
    if (this.keys["w"] === false && this.keys["s"] === false) {
      this.velocity[1] *= 0.1;
    }
  }
  draw() {
    ctx.beginPath();
    ctx.fillStyle = this.color;
    ctx.arc(this.posX, this.posY, this.width / 2, 0, 2 * Math.PI);
    ctx.fill();

    // Draw the rotated gun
    ctx.save();
    ctx.beginPath();
    ctx.translate(this.posX, this.posY);
    ctx.rotate(this.gunAngle);
    ctx.fillStyle = this.gunColor;
    ctx.fillRect(0, -this.gunHeight / 2, this.gunWidth, this.gunHeight);
    ctx.restore();
  }
  shoot() {
    const currentTime = Date.now();
    if (currentTime - this.lastShotTime < this.fireRate) {
      return;
    }
    if (player.activeUpgrades.doubleShot) {
      const timeBetweenShots = 200;
      setTimeout(() => {
        shoot();
      }, timeBetweenShots);
    }
    shoot();
    function shoot() {
      playSound("shoot");
      var speed = 1.5;
      if (player.activeUpgrades.bulletSpeed.active) {
        speed += 1 * player.activeUpgrades.bulletSpeed.level;
      }
      const bullet = new Bullet(
        player.posX + player.width / 10,
        player.posY + player.height / 10,
        player.gunAngle,
        speed,
      );
      player.bullets.push(bullet);
      if (player.activeUpgrades.shotgun.active) {
        for (let i = 1; i <= 3; i++) {
          const bullet = new Bullet(
            player.posX + player.width / 10,
            player.posY + player.height / 10,
            player.gunAngle + (i - 2) * player.activeUpgrades.shotgun.spread,
            speed,
          );
          player.bullets.push(bullet);
        }
      }

      if (player.activeUpgrades.shootingRing.active) {
        var projectilesPerShot = 2 * player.activeUpgrades.shootingRing.level;
        const angleBetweenProjectiles = (2 * Math.PI) / projectilesPerShot;
        for (let i = 1; i < projectilesPerShot; i++) {
          const bullet = new Bullet(
            player.posX + player.width / 10,
            player.posY + player.height / 10,
            player.gunAngle + i * angleBetweenProjectiles,
            speed,
          );
          player.bullets.push(bullet);
        }
      }
      if (player.activeUpgrades.shootBehind) {
        const angleBetweenProjectiles = (2 * Math.PI) / 2;
        const bullet = new Bullet(
          player.posX - player.width / 10,
          player.posY - player.height / 10,
          player.gunAngle + 1 * angleBetweenProjectiles,
          speed,
        );
        player.bullets.push(bullet);
      }
    }
    player.lastShotTime = currentTime;
  }
}

class Bullet {
  constructor(posX, posY, angle, speed) {
    this.posX = posX;
    this.posY = posY;
    this.speed = speed || 1.5;
    this.angle = angle;
    this.width = 10;
    this.height = 10;
    this.color = "green";
  }
  move() {
    this.posX += deltaTime * this.speed * Math.cos(this.angle);
    this.posY += deltaTime * this.speed * Math.sin(this.angle);
  }
  draw() {
    draw(this.posX, this.posY, this.width, this.height, this.color);
  }
}

// handle removing lives and game over screen
function removeLife() {
  var lives = document.getElementById("lives").children;
  if (player.lives <= 0) {
    playSound("hit");
    document.getElementById("gameOver").style.display = "grid";
    document.getElementById("endscreenLevel").innerText = player.level;

    document.getElementById("endscreenTime").innerText = time;
    clearInterval(timer);
    document.getElementById("endscreenCollisions").innerText = collisions;

    document.getElementById("restart").addEventListener("click", function () {
      location.reload();
    });

    if (player.level > game.highscore.level) {
      game.highscore.level = player.level;
      localStorage.setItem("highscoreLevel", player.level);
    }

    time = time
      .split(":")
      .map(Number)
      .reduce((acc, time) => acc * 60 + time);

    game.highscore.time = game.highscore.time
      .split(":")
      .map(Number)
      .reduce((acc, time) => acc * 60 + time);

    if (time > game.highscore.time) {
      game.highscore.time = time;
      localStorage.setItem("highscoreTime", game.highscore.time);
    }
    document.getElementById("highscoreLevel").innerHTML = game.highscore.level;
    document.getElementById("highscoreTime").innerHTML = `${Math.floor(
      game.highscore.time / 60,
    )}:${game.highscore.time % 60}`;
  }
  lives[lives.length - 1].remove();
}

upgrades = {
  fireRate: {
    name: "FireRate increase",
    disc: "increase the fire rate of your gun",
    effect: function () {
      player.fireRate -= 100;
      closeMenu();
      if (player.fireRate <= 300) delete upgrades.fireRate;
    },
  },
  addLife: {
    name: "Add life",
    disc: "add a life",
    effect: function () {
      var lives = document.getElementById("lives");
      const img = document.createElement("img");
      img.src = "./resources/images/heart2.png";
      img.alt = "";
      // Add the new img element to the first child of the "lives" container
      lives.appendChild(img);
      player.lives++;
      closeMenu();
    },
  },
  shootingRing: {
    name: "Shooting ring",
    disc: "shoot a ring of bullets",
    effect: function () {
      player.activeUpgrades.shootingRing.active = true;
      closeMenu();
      // delete this upgrade from the list
      player.activeUpgrades.shootingRing.level++;
      if (player.activeUpgrades.shootingRing.level == 3)
        delete upgrades.shootingRing;
    },
  },
  shootBehind: {
    name: "Shoot behind",
    disc: "shoot a bullet behind you",
    effect: function () {
      player.activeUpgrades.shootBehind = true;
      closeMenu();
      delete upgrades.shootBehind;
    },
  },
  doubleShot: {
    name: "Double shot",
    disc: "shoot two bullets at once",
    effect: function () {
      player.activeUpgrades.doubleShot = true;
      closeMenu();
      delete upgrades.doubleShot;
    },
  },
  speedUpgrade: {
    name: "Speed upgrade",
    disc: "increase your speed",
    effect: function () {
      player.speed += 1;
      closeMenu();
      player.activeUpgrades.speedUpgrade.level++;
      if (player.activeUpgrades.speedUpgrade.level == 2)
        delete upgrades.speedUpgrade;
    },
  },
  bulletSpeed: {
    name: "Bullet speed",
    disc: "increase the speed of your bullets",
    effect: function () {
      player.activeUpgrades.bulletSpeed.active = true;
      player.activeUpgrades.bulletSpeed.level++;
      closeMenu();
      if (player.activeUpgrades.bulletSpeed.level >= 3)
        delete upgrades.bulletSpeed;
    },
  },
  shotgun: {
    name: "Shotgun",
    disc: "shoot multiple bullets at once",
    effect: function () {
      player.activeUpgrades.shotgun.active = true;
      closeMenu();
      delete upgrades.shotgun;

      (upgrades.shotgunSpreadIncrease = {
        name: "spread increase",
        disc: "increase the spread of the shotgun",
        effect: function () {
          player.activeUpgrades.shotgun.spread += 0.5;
          closeMenu();
          if (player.activeUpgrades.shotgun.spread >= 2) {
            delete upgrades.shotgunSpreadIncrease;
          }
          if (upgrades.shotgunSpreadDecrease)
            delete upgrades.shotgunSpreadDecrease;
        },
      }),
        (upgrades.shotgunSpreadDecrease = {
          name: "spread decrease",
          disc: "decrease the spread of the shotgun",
          effect: function () {
            console.log(player.activeUpgrades.shotgun.spread);
            player.activeUpgrades.shotgun.spread -= 0.1;
            console.log(player.activeUpgrades.shotgun.spread);
            closeMenu();
            if (player.activeUpgrades.shotgun.spread <= 0.3) {
              delete upgrades.shotgunSpreadDecrease;
            }
            if (upgrades.shotgunSpreadIncrease)
              delete upgrades.shotgunSpreadIncrease;
          },
        });
    },
  },
};

var safeX = 0;
var safeY = 0;
function checksafespawn() {
  randomX = Math.random() * canvasWidth;
  randomY = Math.random() * canvasHeight;
  obstacles.forEach((obstacle) => {
    if (
      console.log("checking safe spawn") &&
      randomX >= obstacle.posX &&
      randomX <= obstacle.posX + obstacle.width &&
      randomY >= obstacle.posY &&
      randomY <= obstacle.posY + obstacle.height
    ) {
      checksafespawn();
    } else {
      safeX = randomX;
      safeY = randomY;
    }
  });
}

class Obstacle {
  constructor(posX, posY, width, height, texture) {
    this.posX = posX;
    this.posY = posY;
    this.width = width;
    this.height = height;
    this.texture = texture;
  }

  draw() {
    drawTexture(this.posX, this.posY, this.width, this.height, this.texture);
  }

  collidesWith(player) {
    return (
      this.posX <= player.posX + player.width / 2 &&
      this.posX + this.width >= player.posX - player.width / 2 &&
      this.posY <= player.posY + player.height / 2 &&
      this.posY + this.height >= player.posY - player.height / 2
    );
  }
}

const borderWidth = 10000;
const expectedObstacles = 2 + 4;
var obstaclesLoaded = 0;
const obstacles = [];
function loadObstacles() {
  loadimage("./resources/images/ruin.png").then((image) => {
    obstacles.push(
      new Obstacle(100, 100, 96, 82, image),
      new Obstacle(400, 300, 96, 82, image),
    );
    obstaclesLoaded += 2;
  });
  // border
  loadimage("./resources/images/black-pixel.png").then((blackBorderImage) => {
    // border obstacles
    obstacles.push(
      new Obstacle(
        -borderWidth,
        -borderWidth,
        canvasWidth + 2 * borderWidth,
        borderWidth,
        blackBorderImage,
      ), // Top border
      new Obstacle(
        -borderWidth,
        canvasHeight,
        canvasWidth + 2 * borderWidth,
        borderWidth,
        blackBorderImage,
      ), // Bottom border
      new Obstacle(
        -borderWidth,
        0,
        borderWidth,
        canvasHeight,
        blackBorderImage,
      ), // Left border
      new Obstacle(canvasWidth, 0, borderWidth, canvasHeight, blackBorderImage),
      // Right border
    );
    obstaclesLoaded += 4;
  });
}
loadObstacles();
class Enemy {
  constructor(posX, posY, width, height, texture) {
    this.posX = posX;
    this.posY = posY;
    this.width = width;
    this.height = height;
    this.texture = texture;
    this.expValue = 1;
  }

  draw() {
    drawTexture(this.posX, this.posY, this.width, this.height, this.texture);
  }

  collidesWith(player) {
    return (
      this.posX <= player.posX + player.width / 2 &&
      this.posX + this.width >= player.posX - player.width / 2 &&
      this.posY <= player.posY + player.height / 2 &&
      this.posY + this.height >= player.posY - player.height / 2
    );
  }
}

function moveTowardsPlayer() {
  enemies.forEach((enemy) => {
    if (enemy.posX < player.posX) {
      enemy.posX += deltaTime * 0.15;
    }
    if (enemy.posX > player.posX) {
      enemy.posX -= deltaTime * 0.15;
    }
    if (enemy.posY < player.posY) {
      enemy.posY += deltaTime * 0.15;
    }
    if (enemy.posY > player.posY) {
      enemy.posY -= deltaTime * 0.15;
    }
  });
}

var enemies = [];
var lastSpawnTime = 0;
var stage = 0;
var spawnRates = [1000, 750, 500, 500, 250, 100];
function createEnemy() {
  if (game.paused) return;
  if (!game.cheats.spawnEnemies) return;
  const now = Date.now();
  if (now - lastSpawnTime < spawnRates[stage]) {
    return;
  }
  const EnemyX = Math.random() * canvasWidth;
  const EnemyY = Math.random() * canvasHeight;
  const nonoZone = 200;
  if (
    EnemyX >= player.posX - player.width - nonoZone &&
    EnemyX <= player.posX + player.width + nonoZone &&
    EnemyY >= player.posY - player.height - nonoZone &&
    EnemyY <= player.posY + player.height + nonoZone
  )
    return;
  loadimage("./resources/images/enemy.png").then((image) => {
    enemies.push(new Enemy(EnemyX, EnemyY, 42, 48, image));
  });
  lastSpawnTime = Date.now(); // lower is faster
}
var time = "0:0";

var timer = setInterval(() => {
  diff = Date.now() - game.start;
  minutes = Math.floor(diff / 60000);
  seconds = Math.floor(diff / 1000) % 60;
  if (seconds < 10) {
    seconds = "0" + seconds;
  }
  time = `${minutes}:${seconds}`;
  document.getElementById("timer").innerText = time;
}, 1000);

// assinged in the imageTimer
var player = undefined;
var lastFrameTime = undefined;
// timer for checking if the images are ready to be drawn and the game can start
var imageTimer = setInterval(() => {
  if (obstaclesLoaded === expectedObstacles) {
    game.ready = true;
    checksafespawn();
    player = new Player(safeX, safeY, 32, 32, "red");
    update();
    clearInterval(imageTimer);
  } else if (obstaclesLoaded > expectedObstacles) {
    console.error("obstaclesLoaded is higher than expectedObstacles");
  } else if (obstaclesLoaded < expectedObstacles) {
    console.error("obstaclesLoaded is lower than expectedObstacles");
  }
  lastFrameTime = performance.now();
}, 100);

var deltaTime = 0;

function update() {
  if (game.ready === false) return;
  clearInterval(imageTimer);
  if (player.lives <= 0 || game.paused) return;

  var currentTime = performance.now();
  deltaTime = currentTime - lastFrameTime;
  lastFrameTime = currentTime;

  requestAnimationFrame(update);
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  // Translate the canvas based on the player's position
  // transformX = -player.posX + canvasWidth / 2;
  // transformY = -player.posY + canvasHeight / 2;
  // ctx.setTransform(1, 0, 0, 1, transformX, transformY);

  // if firing shoot
  if (player.firing) {
    player.shoot();
  }

  // draw and move bullets
  player.bullets.forEach((bullet) => {
    bullet.move();
    bullet.draw();
  });

  // remove bullets when it leaves the canvas
  player.bullets = player.bullets.filter(
    (bullet) =>
      bullet.posX >= 0 &&
      bullet.posX <= canvasWidth &&
      bullet.posY >= 0 &&
      bullet.posY <= canvasHeight,
  );

  // check each object for a collision with player and moves back player
  obstacles.forEach((obstacle) => {
    obstacle.draw();
    if (obstacle.collidesWith(player) === true) {
      player.velocity[0] = player.velocity[0] - player.velocity[0] * 2;
      player.velocity[1] = player.velocity[1] - player.velocity[1] * 2;
      player.keys["a"] = false;
      player.keys["d"] = false;
      player.keys["w"] = false;
      player.keys["s"] = false;
      collisions++;
      playSound("hit");
      if (!game.cheats.invulnerability) {
        player.lives--;
        removeLife();
      }
    }
  });
  // check each enemy for a collision with player and moves back the player and enemy*
  // TODO *move back all enemies in a radius around the player
  enemies.forEach((enemy) => {
    enemy.draw();
    if (enemy.collidesWith(player) === true) {
      player.velocity[0] = player.velocity[0] - player.velocity[0] * 2;
      player.velocity[1] = player.velocity[1] - player.velocity[1] * 2;
      player.keys["a"] = false;
      player.keys["d"] = false;
      player.keys["w"] = false;
      player.keys["s"] = false;
      playSound("hit");
      moveback = 200;
      if (enemy.posX < player.posX) {
        enemy.posX -= moveback;
      }
      if (enemy.posX > player.posX) {
        enemy.posX += moveback;
      }
      if (enemy.posY < player.posY) {
        enemy.posY -= moveback;
      }
      if (enemy.posY > player.posY) {
        enemy.posY += moveback;
      }
      collisions++;
      if (!game.cheats.invulnerability) {
        player.lives--;
        removeLife();
      }
    }
  });
  // check if the the bullet collided with a enemy and remove the enemy
  // also remove the bullet if it hits a enemy or obstacle
  player.bullets.forEach((bullet) => {
    enemies.forEach((enemy) => {
      if (
        bullet.posX >= enemy.posX &&
        bullet.posX <= enemy.posX + enemy.width &&
        bullet.posY >= enemy.posY &&
        bullet.posY <= enemy.posY + enemy.height
      ) {
        enemies.splice(enemies.indexOf(enemy), 1);
        player.bullets.splice(player.bullets.indexOf(bullet), 1);
        const expBar = document.getElementById("expBar");
        expBar.value = expBar.value + enemy.expValue;
        if (expBar.value == expBar.max) {
          player.level++;
          document.getElementById("level").innerText = player.level;
          expBar.value = 0;
          expBar.max += 10;
          ChooseUpgrade();
        }
      }
    });
    obstacles.forEach((obstacle) => {
      if (
        bullet.posX >= obstacle.posX &&
        bullet.posX <= obstacle.posX + obstacle.width &&
        bullet.posY >= obstacle.posY &&
        bullet.posY <= obstacle.posY + obstacle.height
      ) {
        player.bullets.splice(player.bullets.indexOf(bullet), 1);
      }
    });
  });

  draw(lastMouseX, lastMouseY, 20, 20, "red");

  createEnemy();
  // not able to use Enemy.createEnemy because there is no instence of Enemy available at the start
  moveTowardsPlayer();

  player.position();
  player.draw();

  aim(lastMouseX, lastMouseY);
}

function ChooseUpgrade() {
  game.paused = true;
  playSound("levelUp");
  document.getElementById("background").style.display = "grid";
  document.getElementById("upgrades").style.display = "grid";
  if (player.level % 3 == 0) {
    stage += 1;
  }

  for (let i = 0; i < 3; i++) {
    var upgrade = document.getElementsByClassName("upgrade")[i].children;
    let randomUpgrade = chooseRandomUpgrade();
    upgrade[0].innerText = upgrades[randomUpgrade].name;
    upgrade[1].innerText = upgrades[randomUpgrade].disc;
    upgrade[2].onclick = upgrades[randomUpgrade].effect; // Assign the function reference to onclick
  }

  function chooseRandomUpgrade() {
    const keys = Object.keys(upgrades);
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    return randomKey;
  }
}

function closeMenu() {
  document.getElementById("background").style.display = "none";
  document.getElementById("upgrades").style.display = "none";
  document.getElementById("pauseMenu").style.display = "none";
  game.paused = false;
  lastFrameTime = performance.now();
  update();
}

document.addEventListener("keydown", function (e) {
  player.keys[e.key.toLowerCase()] = true;
  if (e.key === "Escape") {
    game.paused = !game.paused;
    if (game.paused) {
      document.getElementById("background").style.display = "grid";
      document.getElementById("pauseMenu").style.display = "grid";
      clearInterval(timer);
    } else {
      closeMenu();
      timer = setInterval(() => {
        diff = Date.now() - game.start;
        document.getElementById("timer").innerText = `${Math.floor(
          diff / 60000,
        )}:${Math.floor(diff / 1000) % 60}`;
        time = `${Math.floor(diff / 60000)}:${Math.floor(diff / 1000) % 60}`;
      }, 1000);
    }
  }
  if (e.key === "+") {
    player.level++;
    document.getElementById("level").innerText = player.level;
    expBar.value = 0;
    expBar.max += 10;

    ChooseUpgrade();
  }
  if (e.key === "R") {
    // Reset the game
    location.reload();
  }
});
document.addEventListener("keyup", function (e) {
  player.keys[e.key.toLowerCase()] = false;
});
var lastMouseX = 0;
var lastMouseY = 0;
document.addEventListener("mousemove", function (e) {
  lastMouseX = e.clientX;
  lastMouseY = e.clientY;
});
function aim(lastMouseX, lastMouseY) {
  var angle = Math.atan2(lastMouseY - player.posY, lastMouseX - player.posX);
  player.gunAngle = angle;
}
document.addEventListener("mousedown", function (e) {
  player.firing = true;
});
document.addEventListener("mouseup", function (e) {
  player.firing = false;
});
