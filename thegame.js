// --- Canvas setup ---
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = innerWidth;
canvas.height = innerHeight;

// --- Core values ---
const gravity = 0.67;
let isMuted = false;

// --- Music ---
const music = new Audio("https://raw.githubusercontent.com/con-aga-tent/Mario-runners/main/assets/music/overworld.mp3");
music.loop = true;
music.volume = 0.5;
music.play();
document.getElementById("muteBtn").onclick = () => {
  isMuted = !isMuted;
  music.muted = isMuted;
  muteBtn.textContent = isMuted ? "🔇" : "🔊";
};

// --- Images ---
const prefix = "https://raw.githubusercontent.com/con-aga-tent/Mario-runners/main/assets/sprites";
const marioSmallR = new Image(); marioSmallR.src = `${prefix}/mario/small_mario.png`;
const marioBigR = new Image(); marioBigR.src = `${prefix}/mario/big_mario.png`;
const marioFireR = new Image(); marioFireR.src = `${prefix}/mario/fire_mario.png`;
const groundImg = new Image(); groundImg.src = `${prefix}/blocks/ground.png`;
const brickImg = new Image(); brickImg.src = `${prefix}/blocks/brick.png`;
const qBlockImg = new Image(); qBlockImg.src = `${prefix}/blocks/?block.png`;
const goalPoleImg = new Image(); goalPoleImg.src = `${prefix}/goal-poles/Regular_GoalPole.png`;
const goombaImg = new Image(); goombaImg.src = `${prefix}/enemies/goomba.png`;
const fireFlowerImg = new Image(); fireFlowerImg.src = `${prefix}/powerups/fireflower.png`;

// --- Player setup ---
const player = {
  x: 100,
  y: canvas.height - 300,
  w: 40,
  h: 50,
  velX: 0,
  velY: 0,
  speed: 5,
  jumpPower: -15,
  jumping: false,
  facingRight: true,
  form: "small", // "small" | "big" | "fire"
  slidingFlag: false,
  canShoot: false
};

const fireballs = [];
const goombas = [
  { x: 700, y: canvas.height - 130, w: 40, h: 40, alive: true }
];
const qBlocks = [
  { x: 400, y: canvas.height - 200, w: 40, h: 40, used: false, contains: "fireflower" }
];

const platforms = [];
for (let i = 0; i < 10000; i += 40) {
  platforms.push({ x: i, y: canvas.height - 80, width: 40, height: 80, img: groundImg });
}

// staircase
for (let i = 0; i < 6; i++) {
  platforms.push({
    x: 9300 + i * 40,
    y: canvas.height - 80 - i * 40,
    width: 40,
    height: 40,
    img: brickImg
  });
}

const goalPole = { x: 9600, y: canvas.height - 400, w: 40, h: 400 };

let keys = {};
onkeydown = e => keys[e.code] = true;
onkeyup = e => keys[e.code] = false;

// --- Touch buttons ---
document.getElementById("left").ontouchstart = () => keys["ArrowLeft"] = true;
document.getElementById("left").ontouchend = () => keys["ArrowLeft"] = false;
document.getElementById("right").ontouchstart = () => keys["ArrowRight"] = true;
document.getElementById("right").ontouchend = () => keys["ArrowRight"] = false;
document.getElementById("jump").ontouchstart = () => keys["Space"] = true;
document.getElementById("jump").ontouchend = () => keys["Space"] = false;

document.getElementById("fire").ontouchstart = () => shootFireball();
document.getElementById("fire").ontouchend = () => keys["ControlLeft"] = false;

// --- Fireball shooting ---
function shootFireball() {
  if (!player.canShoot) return;
  const fb = {
    x: player.x + (player.facingRight ? player.w : -10),
    y: player.y + player.h / 2,
    w: 10,
    h: 10,
    velX: player.facingRight ? 8 : -8,
    velY: -3
  };
  fireballs.push(fb);
}

// --- Update loop ---
function update() {
  if (player.slidingFlag) return;

  // Move left/right
  if (keys["ArrowRight"]) {
    player.velX = player.speed;
    player.facingRight = true;
  } else if (keys["ArrowLeft"]) {
    player.velX = -player.speed;
    player.facingRight = false;
  } else {
    player.velX = 0;
  }

  if (keys["Space"] && !player.jumping) {
    player.velY = player.jumpPower;
    player.jumping = true;
  }

  if (keys["ControlLeft"]) shootFireball();

  player.velY += gravity;
  player.x += player.velX;
  player.y += player.velY;

  // Ground/platform collisions
  for (let plat of platforms) {
    if (
      player.x + player.w > plat.x &&
      player.x < plat.x + plat.width &&
      player.y + player.h > plat.y &&
      player.y + player.h < plat.y + 30 &&
      player.velY >= 0
    ) {
      player.y = plat.y - player.h;
      player.velY = 0;
      player.jumping = false;
    }
  }

  // Hitting question blocks
  for (let block of qBlocks) {
    if (
      player.x + player.w > block.x &&
      player.x < block.x + block.w &&
      player.y < block.y + block.h &&
      player.y > block.y &&
      player.velY < 0 &&
      !block.used
    ) {
      block.used = true;
      player.velY = 0;
      // Spawn fireflower
      block.powerup = {
        x: block.x,
        y: block.y - 40,
        w: 40,
        h: 40,
        type: "fireflower",
        collected: false
      };
    }
    // Collect powerup
    if (block.powerup && !block.powerup.collected) {
      if (
        player.x + player.w > block.powerup.x &&
        player.x < block.powerup.x + block.powerup.w &&
        player.y + player.h > block.powerup.y &&
        player.y < block.powerup.y + block.powerup.h
      ) {
        block.powerup.collected = true;
        player.form = "fire";
        player.canShoot = true;
      }
    }
  }

  // Fireballs move
  fireballs.forEach(fb => {
    fb.x += fb.velX;
    fb.y += fb.velY;
    fb.velY += 0.3;
    // bounce
    if (fb.y + fb.h > canvas.height - 80) {
      fb.y = canvas.height - 80 - fb.h;
      fb.velY = -6;
    }
  });

  // Fireball-Goomba collision
  goombas.forEach(g => {
    fireballs.forEach(fb => {
      if (
        g.alive &&
        fb.x + fb.w > g.x &&
        fb.x < g.x + g.w &&
        fb.y + fb.h > g.y &&
        fb.y < g.y + g.h
      ) {
        g.alive = false;
      }
    });
  });

  // Goal pole
  if (
    player.x + player.w > goalPole.x &&
    player.x < goalPole.x + goalPole.w &&
    player.y + player.h > goalPole.y &&
    player.y < goalPole.y + goalPole.h
  ) {
    player.slidingFlag = true;
    player.velX = 0;
    player.velY = 0;
    player.x = goalPole.x - player.w + 5;
    const slideDown = setInterval(() => {
      player.y += 3;
      if (player.y + player.h >= canvas.height - 80) {
        clearInterval(slideDown);
        setTimeout(() => {
          alert("✅ Level Complete!");
          location.reload();
        }, 500);
      }
    }, 16);
  }
}

// --- Draw loop ---
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Background
  ctx.fillStyle = "#5c94fc";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Platforms
  platforms.forEach(p => {
    ctx.drawImage(p.img, p.x, p.y, p.width, p.height);
  });

  // Question blocks
  qBlocks.forEach(b => {
    ctx.drawImage(b.used ? brickImg : qBlockImg, b.x, b.y, b.w, b.h);
    if (b.powerup && !b.powerup.collected)
      ctx.drawImage(fireFlowerImg, b.powerup.x, b.powerup.y, b.powerup.w, b.powerup.h);
  });

  // Goombas
  goombas.forEach(g => {
    if (g.alive) ctx.drawImage(goombaImg, g.x, g.y, g.w, g.h);
  });

  // Fireballs
  fireballs.forEach(fb => {
    ctx.fillStyle = "orange";
    ctx.beginPath();
    ctx.arc(fb.x, fb.y, fb.w / 2, 0, Math.PI * 2);
    ctx.fill();
  });

  // Goal pole
  ctx.drawImage(goalPoleImg, goalPole.x, goalPole.y, goalPole.w, goalPole.h);

  // Player (flip for facing)
  const marioImg =
    player.form === "fire" ? marioFireR :
    player.form === "big" ? marioBigR : marioSmallR;

  ctx.save();
  ctx.translate(player.x + player.w / 2, player.y + player.h / 2);
  ctx.scale(player.facingRight ? 1 : -1, 1);
  ctx.drawImage(marioImg, -player.w / 2, -player.h / 2, player.w, player.h);
  ctx.restore();
}

// --- Game loop ---
function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}
gameLoop();
