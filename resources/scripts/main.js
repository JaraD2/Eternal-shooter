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
        level: 1,
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
      EXPmultiplier: {
        active: false,
        level: 1,
      },
      shotgun: {
        active: false,
        spread: 0.5,
      },
      cannon: {
        active: false,
        level: 1,
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
        this.velocity[0] -= (this.speed * deltaTime) / 10;
      }
    }
    if (this.keys["d"]) {
      if (this.velocity[0] < this.speed) {
        this.velocity[0] += (this.speed * deltaTime) / 10;
      }
    }
    if (this.keys["w"]) {
      if (this.velocity[1] > -this.speed) {
        this.velocity[1] -= (this.speed * deltaTime) / 10;
      }
    }
    if (this.keys["s"]) {
      if (this.velocity[1] < this.speed) {
        this.velocity[1] += (this.speed * deltaTime) / 10;
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
        player.posX,
        player.posY,
        10 * player.activeUpgrades.cannon.level,
        player.gunAngle,
        speed,
      );
      player.bullets.push(bullet);
      if (player.activeUpgrades.shotgun.active) {
        for (let i = 1; i <= 3; i++) {
          const bullet = new Bullet(
            player.posX,
            player.posY,
            10 * player.activeUpgrades.cannon.level,
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
            player.posX,
            player.posY,
            10 * player.activeUpgrades.cannon.level,
            player.gunAngle + i * angleBetweenProjectiles,
            speed,
          );
          player.bullets.push(bullet);
        }
      }
      if (player.activeUpgrades.shootBehind) {
        const angleBetweenProjectiles = (2 * Math.PI) / 2;
        const bullet = new Bullet(
          player.posX,
          player.posY,
          10 * player.activeUpgrades.cannon.level,
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
  constructor(posX, posY, size, angle, speed) {
    this.posX = posX;
    this.posY = posY;
    this.speed = speed || 1.5;
    this.angle = angle;
    this.width = size || 10;
    this.height = size || 10;
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
    maxLevel: 4,
    currentLevel: 0,
    effect: function () {
      player.fireRate -= 100;
      upgrades.fireRate.currentLevel++;
      if (upgrades.fireRate.currentLevel >= upgrades.fireRate.maxLevel)
        delete upgrades.fireRate;
      closeMenu();
    },
  },
  addLife: {
    name: "Add life",
    disc: "add a life",
    maxLevel: "None",
    currentLevel: 0,
    effect: function () {
      upgrades.addLife.currentLevel++;
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
    maxLevel: 3,
    currentLevel: 0,
    effect: function () {
      upgrades.shootingRing.currentLevel++;
      player.activeUpgrades.shootingRing.active = true;
      player.activeUpgrades.shootingRing.level++;
      console.log(upgrades.shootingRing.currentLevel);
      if (upgrades.shootingRing.currentLevel >= upgrades.shootingRing.maxLevel)
        delete upgrades.shootingRing;
      closeMenu();
    },
  },
  shootBehind: {
    name: "Shoot behind",
    disc: "shoot a bullet behind you",
    maxLevel: 1,
    currentLevel: 0,
    effect: function () {
      player.activeUpgrades.shootBehind = true;
      // not setting a level because it's a one time use
      delete upgrades.shootBehind;
      closeMenu();
    },
  },
  doubleShot: {
    name: "Double shot",
    disc: "shoot two bullets at once",
    maxLevel: 1,
    currentLevel: 0,
    effect: function () {
      player.activeUpgrades.doubleShot = true;
      delete upgrades.doubleShot;
      closeMenu();
    },
  },
  speedUpgrade: {
    name: "Speed upgrade",
    disc: "increase your speed",
    maxLevel: 2,
    currentLevel: 0,
    effect: function () {
      player.speed += 1;
      upgrades.speedUpgrade.currentLevel++;
      player.activeUpgrades.speedUpgrade.level++;
      if (
        upgrades.speedUpgrade.currentLevel >= upgrades.speedUpgrade.maxLevel
      ) {
        delete upgrades.speedUpgrade;
      }
      closeMenu();
    },
  },
  EXPmultiplier: {
    name: "EXP multiplier",
    disc: "increase the amount of exp you get",
    maxLevel: 3,
    currentLevel: 0,
    effect: function () {
      player.activeUpgrades.EXPmultiplier.active = true;
      player.activeUpgrades.EXPmultiplier.level++;
      upgrades.EXPmultiplier.currentLevel++;
      if (
        upgrades.EXPmultiplier.currentLevel >= upgrades.EXPmultiplier.maxLevel
      ) {
        delete upgrades.EXPmultiplier;
      }
      closeMenu();
    },
  },
  bulletSpeed: {
    name: "Bullet speed",
    disc: "increase the speed of your bullets",
    maxLevel: 3,
    currentLevel: 0,
    effect: function () {
      player.activeUpgrades.bulletSpeed.active = true;
      player.activeUpgrades.bulletSpeed.level++;
      upgrades.bulletSpeed.currentLevel++;
      if (upgrades.bulletSpeed.currentLevel >= upgrades.bulletSpeed.maxLevel) {
        delete upgrades.bulletSpeed;
      }
      if (upgrades.bulletSpeedDecrease) delete upgrades.bulletSpeedDecrease;
      closeMenu();
    },
  },
  // has sub upgrades
  shotgun: {
    name: "Shotgun",
    disc: "shoot multiple bullets at once.",
    maxLevel: 1,
    currentLevel: 0,
    effect: function () {
      player.activeUpgrades.shotgun.active = true;
      // not setting a level because it's a one time use
      delete upgrades.shotgun;
      delete upgrades.cannon;

      (upgrades.shotgunSpreadIncrease = {
        name: "spread increase",
        disc: "increase the spread of the shotgun",
        maxLevel: 3,
        currentLevel: 0,
        effect: function () {
          player.activeUpgrades.shotgun.spread += 0.5;
          upgrades.shotgunSpreadIncrease.currentLevel++;
          if (
            upgrades.shotgunSpreadIncrease.currentLevel >=
            upgrades.shotgunSpreadIncrease.maxLevel
          ) {
            delete upgrades.shotgunSpreadIncrease;
          }
          if (upgrades.shotgunSpreadDecrease)
            delete upgrades.shotgunSpreadDecrease;
          closeMenu();
        },
      }),
        (upgrades.shotgunSpreadDecrease = {
          name: "spread decrease",
          disc: "decrease the spread of the shotgun",
          maxLevel: 3,
          currentLevel: 0,
          effect: function () {
            upgrades.shotgunSpreadDecrease.currentLevel++;

            player.activeUpgrades.shotgun.spread -= 0.1;
            if (
              upgrades.shotgunSpreadDecrease.maxLevel >=
              upgrades.shotgun.shotgunSpreadDecrease.currentLevel
            ) {
              delete upgrades.shotgunSpreadDecrease;
            }
            if (upgrades.shotgunSpreadIncrease)
              delete upgrades.shotgunSpreadIncrease;
            closeMenu();
          },
        });
      closeMenu();
    },
  },
  cannon: {
    name: "Cannon",
    disc: "increase the size of your bullets",
    maxLevel: 3,
    currentLevel: 0,
    effect: function () {
      player.activeUpgrades.cannon.active = true;
      player.activeUpgrades.cannon.level++;
      upgrades.cannon.currentLevel++;
      closeMenu();
      if (upgrades.cannon.maxLevel >= upgrades.cannon.currentLevel) {
        delete upgrades.cannon;
      }
      delete upgrades.shotgun;
    },
  },
};

var safeX = 0;
var safeY = 0;
function checksafespawn() {
  randomX = Math.random() * canvasWidth;
  randomY = Math.random() * canvasHeight;
  let isSafeSpawn = false;
  while (!isSafeSpawn) {
    randomX = Math.random() * canvasWidth;
    randomY = Math.random() * canvasHeight;

    isSafeSpawn = true;
    obstacles.forEach((obstacle) => {
      if (
        randomX + 64 >= obstacle.posX &&
        randomX <= obstacle.posX + obstacle.width &&
        randomY + 64 >= obstacle.posY &&
        randomY <= obstacle.posY + obstacle.height
      ) {
        isSafeSpawn = false;
      }
    });
  }
  safeX = randomX;
  safeY = randomY;
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
      new Obstacle(700, 500, 96, 82, image),
      new Obstacle(950, 350, 96, 82, image),
      new Obstacle(1350, 200, 96, 82, image),
      new Obstacle(1700, 600, 96, 82, image),
      new Obstacle(1300, 700, 96, 82, image),
      new Obstacle(100, 600, 96, 82, image),
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
    if (
      enemy.posX < player.posX &&
      !collidesWithObjects(enemy.posX + deltaTime * 0.15, enemy.posY, enemy)
    ) {
      enemy.posX += deltaTime * 0.15;
    }
    if (
      enemy.posX > player.posX &&
      !collidesWithObjects(enemy.posX - deltaTime * 0.15, enemy.posY, enemy)
    ) {
      enemy.posX -= deltaTime * 0.15;
    }
    if (
      enemy.posY < player.posY &&
      !collidesWithObjects(enemy.posX, enemy.posY + deltaTime * 0.15, enemy)
    ) {
      enemy.posY += deltaTime * 0.15;
    }
    if (
      enemy.posY > player.posY &&
      !collidesWithObjects(enemy.posX, enemy.posY - deltaTime * 0.15, enemy)
    ) {
      enemy.posY -= deltaTime * 0.15;
    }
  });
  function collidesWithObjects(posX, posY, enemy) {
    for (let obstacle of obstacles) {
      if (
        posX <= obstacle.posX + obstacle.width &&
        posX + enemy.width >= obstacle.posX &&
        posY <= obstacle.posY + obstacle.height &&
        posY + enemy.height >= obstacle.posY
      ) {
        return true; // Collision detected
      }
    }
    return false; // No collision
  }
}

var enemies = [];
var lastSpawnTime = 0;
var stage = 0;
var spawnRates = [1000, 750, 500, 500, 250, 100];
function createEnemy() {
  if (enemies.length >= 40) return;
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
  // check if inside an obstacle
  for (let obstacle of obstacles) {
    if (
      EnemyX + 42 >= obstacle.posX &&
      EnemyX <= obstacle.posX + obstacle.width &&
      EnemyY + 48 >= obstacle.posY &&
      EnemyY <= obstacle.posY + obstacle.height
    ) {
      return;
    }
  }
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
        bullet.posX <= enemy.posX + enemy.width &&
        bullet.posX + bullet.width >= enemy.posX &&
        bullet.posY <= enemy.posY + enemy.height &&
        bullet.posY + bullet.height >= enemy.posY
      ) {
        enemies.splice(enemies.indexOf(enemy), 1);

        player.bullets.splice(player.bullets.indexOf(bullet), 1);

        const expBar = document.getElementById("expBar");
        expBar.value +=
          enemy.expValue * (player.activeUpgrades.EXPmultiplier.level + 1);

        if (expBar.value == expBar.max) {
          player.level++;
          document.getElementById("level").innerText = player.level;
          expBar.value = 0;
          expBar.max += 15;
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

  draw(lastMouseX - 5, lastMouseY - 5, 10, 10, "red");

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
  if (player.level % 2 == 0) {
    stage += 1;
  }

  for (let i = 0; i < 3; i++) {
    var upgrade = document.getElementsByClassName("upgrade")[i].children;
    let randomUpgrade = chooseRandomUpgrade();
    upgrade[0].innerText = upgrades[randomUpgrade].name;
    upgrade[1].innerText = upgrades[randomUpgrade].disc;
    upgrade[2].innerText = `Max level: ${upgrades[randomUpgrade].maxLevel}`;
    upgrade[3].innerText = `Level: ${upgrades[randomUpgrade].currentLevel}`;
    upgrade[4].onclick = upgrades[randomUpgrade].effect; // Assign the function reference to onclick
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
  if (e.key === "r") {
    // Reset the game
    location.reload();
  }
  if (e.key === " ") {
    player.firing = true;

  }
});
document.addEventListener("keyup", function (e) {
  player.keys[e.key.toLowerCase()] = false;
  if (e.key === " ") player.firing = false;
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
