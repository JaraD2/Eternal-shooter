var canvas = document.querySelector("canvas");
var ctx = canvas.getContext("2d");

console.log(`
#   hhhhhh                                   llllll  llllll             
#   h::::h                                   l::::l  l::::l                  
#   h::::h                                   l::::l  l::::l                  
#   h::::h                                   l::::l  l::::l                  
#   h::::h hhhhh            eeeeeeeeeeee     l::::l  l::::l     ooooooooooo   
#   h::::hh:::::hhh       ee::::::::::::ee   l::::l  l::::l   oo:::::::::::oo 
#   h::::::::::::::hh    e::::::eeeee:::::ee l::::l  l::::l  o:::::::::::::::o
#   h:::::::hhh::::::h  e::::::e     e:::::e l::::l  l::::l  o:::::ooooo:::::o
#   h::::::h   h::::::h e:::::::eeeee::::::e l::::l  l::::l  o::::o     o::::o
#   h:::::h     h:::::h e:::::::::::::::::e  l::::l  l::::l  o::::o     o::::o
#   h:::::h     h:::::h e::::::eeeeeeeeeee   l::::l  l::::l  o::::o     o::::o
#   h:::::h     h:::::h e:::::::e            l::::l  l::::l  o::::o     o::::o
#   h:::::h     h:::::h e::::::::e           l::::l  l::::l  o:::::ooooo:::::o
#   h:::::h     h:::::h  e::::::::eeeeeeee   l::::l  l::::l  o:::::::::::::::o
#   h:::::h     h:::::h   ee:::::::::::::e   l::::l  l::::l   oo:::::::::::oo 
#   hhhhhhh     hhhhhhh     eeeeeeeeeeeeee   llllll  llllll     ooooooooooo   `);

const game = {
  paused: false,
  invulnerability: false,
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

class Player {
  constructor(posX, posY, width, height, color) {
    this.posX = canvasWidth / 2;
    this.posY = canvasHeight / 2;
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
    if (this.keys["m"]) {
      // just for debugging
      console.log(`player.posX: ${this.posX}`);
      console.log(`player.posY: ${this.posY}`);
      console.log(`player.velocity[0]: ${this.velocity[0]}`);
      console.log(`player.velocity[1]: ${this.velocity[1]}`);
      console.log(`player.gunAngle: ${this.gunAngle}`);
    }

    if (this.keys["a"]) {
      if (this.velocity[0] > -this.speed) {
        this.velocity[0] -= 0.5;
      }
    }
    if (this.keys["d"]) {
      if (this.velocity[0] < this.speed) {
        this.velocity[0] += 0.5;
      }
    }
    if (this.keys["w"]) {
      if (this.velocity[1] > -this.speed) {
        this.velocity[1] -= 0.5;
      }
    }
    if (this.keys["s"]) {
      if (this.velocity[1] < this.speed) {
        this.velocity[1] += 0.5;
      }
    }
    if (this.keys[" "]) {
      // TODO fix this
      // this.velocity[0] *= 1.1;
      // this.velocity[1] *= 1.1;
      // console.log(`player.posX: ${this.posX}`);
      // console.log(`player.posY: ${this.posY}`);
      const currentTime = Date.now();
      if (currentTime - this.lastJumpTime < this.jumpRate) {
        return;
      }

      if (this.keys["a"]) {
        this.posX -= this.speed;
        return;
      }
      if (this.keys["d"]) {
        this.posX += this.speed;
        return;
      }
      if (this.keys["w"]) {
        this.posY -= this.speed;
        return;
      }
      if (this.keys["s"]) {
        this.posY += this.speed;
        return;
      }
    }
    if (this.firing) {
      this.shoot();
    }

    this.posX += this.velocity[0];
    this.posY += this.velocity[1];
    if (this.keys["a"] === false && this.keys["d"] === false) {
      this.velocity[0] *= 0.9;
    }
    if (this.keys["w"] === false && this.keys["s"] === false) {
      this.velocity[1] *= 0.9;
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

    const bullet = new Bullet(
      this.posX + this.width / 10,
      this.posY + this.height / 10,
      this.gunAngle
    );
    this.bullets.push(bullet);

    this.firing = true;
    this.lastShotTime = currentTime;
  }
}

class Bullet {
  constructor(posX, posY, angle) {
    this.posX = posX;
    this.posY = posY;
    this.speed = 15;
    this.angle = angle;
    this.width = 10;
    this.height = 10;
    this.color = "green";
  }
  move() {
    this.posX += this.speed * Math.cos(this.angle);
    this.posY += this.speed * Math.sin(this.angle);
  }
  draw() {
    draw(this.posX, this.posY, this.width, this.height, this.color);
  }
}

// handle removing lives and game over screen
function removeLife() {
  var lives = document.getElementById("lives").children;
  if (player.lives <= 0) {
    console.log("game over");
    // TODO add game over screen
    document.getElementById("gameOver").style.display = "grid";
    document.getElementById("endscreenLevel").innerText = player.level;

    document.getElementById("endscreenTime").innerText = time;
    clearInterval(timer);
    document.getElementById("endscreenCollisions").innerText = collisions;

    document.getElementById("restart").addEventListener("click", function () {
      location.reload();
    });
  }
  lives[lives.length - 1].remove();
}

upgrades = {
  // TODO
  fireRate: {
    name: "FireRate increase",
    disc: "increase the fire rate of your gun",
    effect: function () {
      player.fireRate -= 100;
      console.log(player.fireRate);
      closeMenu();
    },
  },
  addLife: {
    name: "Add life",
    disc: "add a life",
    effect: function () {
      // TODO as an upgrade choice
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
};

var player = new Player();

class Obstacle {
  constructor(posX, posY, width, height, color) {
    this.posX = posX;
    this.posY = posY;
    this.width = width;
    this.height = height;
    this.color = color;
  }
  draw() {
    draw(this.posX, this.posY, this.width, this.height, this.color);
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
// TODO make a function that draws a bunch of obstacles
const obstacles = [
  new Obstacle(100, 100, 256, 256, "pink"),
  new Obstacle(400, 300, 256, 256, "pink"),

  // border obstacles
  new Obstacle(
    -borderWidth,
    -borderWidth,
    canvasWidth + 2 * borderWidth,
    borderWidth,
    "black"
  ), // Top border
  new Obstacle(
    -borderWidth,
    canvasHeight,
    canvasWidth + 2 * borderWidth,
    borderWidth,
    "black"
  ), // Bottom border
  new Obstacle(-borderWidth, 0, borderWidth, canvasHeight, "black"), // Left border
  new Obstacle(canvasWidth, 0, borderWidth, canvasHeight, "black"), // Right border
];
class Enemy {
  constructor(posX, posY, width, height, color) {
    this.posX = posX;
    this.posY = posY;
    this.width = width;
    this.height = height;
    this.color = color || "green";
    this.lastSpawnTime = 0;
    this.spawnRate = 1; // in milliseconds
    this.expValue = 1;
  }

  draw() {
    draw(this.posX, this.posY, this.width, this.height, this.color);
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
      enemy.posX += 1;
    }
    if (enemy.posX > player.posX) {
      enemy.posX -= 1;
    }
    if (enemy.posY < player.posY) {
      enemy.posY += 1;
    }
    if (enemy.posY > player.posY) {
      enemy.posY -= 1;
    }
  });
}

var enemies = [];
var lastSpawnTime = 0;
var spawnRate = 1000; // in milliseconds
function createEnemy() {
  const now = Date.now();
  if (now - lastSpawnTime < spawnRate) {
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
  enemies.push(new Enemy(EnemyX, EnemyY, 48, 48));
  lastSpawnTime = Date.now(); // lower is faster
}
var time = 0;
var start = Date.now();
var timer = setInterval(() => {
  diff = Date.now() - start;
  document.getElementById("timer").innerText = `${Math.floor(diff / 60000)}:${
    Math.floor(diff / 1000) % 60
  }`;
  time = `${Math.floor(diff / 60000)}:${Math.floor(diff / 1000) % 60}`;
}, 1000);

update();
function update() {
  if (player.lives <= 0 || game.paused) return;
  requestAnimationFrame(update);
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  // Translate the canvas based on the player's position
  // transformX = -player.posX + canvasWidth / 2;
  // transformY = -player.posY + canvasHeight / 2;
  // ctx.setTransform(1, 0, 0, 1, transformX, transformY);

  // if firing shoot
  if (player.firing) player.shoot();

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
      bullet.posY <= canvasHeight
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
      if (!game.invulnerability) {
        player.lives--;
        removeLife();
      }
      console.log(collisions);
    }
  });
  // check each enemy for a collision with player and moves back the player and enemies
  enemies.forEach((enemy) => {
    enemy.draw();
    if (enemy.collidesWith(player) === true) {
      player.velocity[0] = player.velocity[0] - player.velocity[0] * 2;
      player.velocity[1] = player.velocity[1] - player.velocity[1] * 2;
      player.keys["a"] = false;
      player.keys["d"] = false;
      player.keys["w"] = false;
      player.keys["s"] = false;

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
      if (!game.invulnerability) {
        player.lives--;
        removeLife();
      }
      console.log(collisions);
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
          console.log("expbar full");
          // TODO upgrades
          player.level++;
          document.getElementById("level").innerText = player.level;
          expBar.value = 0;
          expBar.max += 10;

          // upgrades.fireRate();
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
  document.getElementById("background").style.display = "grid";
  document.getElementById("upgrades").style.display = "grid";

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
    console.log(randomKey);
    return randomKey;
  }
}
function closeMenu() {
  document.getElementById("background").style.display = "none";
  document.getElementById("upgrades").style.display = "none";
  document.getElementById("pauseMenu").style.display = "none";
  game.paused = false;
  update();
}
document.addEventListener("keydown", function (e) {
  player.keys[e.key] = true;
  if (e.key === "Escape") {
    game.paused = !game.paused;
    if (game.paused) {
      document.getElementById("background").style.display = "grid";
      document.getElementById("pauseMenu").style.display = "grid";
      clearInterval(timer);
    } else {
      closeMenu();
      timer = setInterval(() => {
        diff = Date.now() - start;
        document.getElementById("timer").innerText = `${Math.floor(
          diff / 60000
        )}:${Math.floor(diff / 1000) % 60}`;
        time = `${Math.floor(diff / 60000)}:${Math.floor(diff / 1000) % 60}`;
      }, 1000);
      update();
    }
  }
});
document.addEventListener("keyup", function (e) {
  player.keys[e.key] = false;
});
var lastMouseX = 0;
var lastMouseY = 0;
document.addEventListener("mousemove", function (e) {
  lastMouseX = e.clientX;
  // console.log(lastMouseX);
  // var rect = canvas.getBoundingClientRect();
  lastMouseY = e.clientY;
  // lastMouseX -= rect.left - (-player.posX + canvasWidth / 2);
  // lastMouseY -= rect.top - (-player.posY + canvasHeight / 2);
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