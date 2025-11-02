// ========== SETUP ==========
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = innerWidth;
canvas.height = innerHeight;

const BASE = "https://raw.githubusercontent.com/con-aga-tent/Mario-runners/main/assets";
const gravity = 0.67;

// ========== AUDIO ==========
const music = new Audio(`${BASE}/music/overworld.mp3`);
music.loop = true;
music.volume = 0.5;
music.play();

const muteBtn = document.getElementById("muteBtn");
muteBtn.onclick = () => {
  music.muted = !music.muted;
  muteBtn.textContent = music.muted ? "🔇" : "🔊";
};

// ========== IMAGES ==========
const marioSmall = new Image(); marioSmall.src = `${BASE}/sprites/mario/small_mario.png`;
const marioBig = new Image(); marioBig.src = `${BASE}/sprites/mario/big_mario.png`;
const marioFire = new Image(); marioFire.src = `${BASE}/sprites/mario/fire_mario.png`;

const brickImg = new Image(); brickImg.src = `${BASE}/sprites/blocks/brick.png`;
const groundImg = new Image(); groundImg.src = `${BASE}/sprites/blocks/ground.png`;
const qblockImg = new Image(); qblockImg.src = `${BASE}/sprites/blocks/%3Fblock.png`;

const fireFlowerImg = new Image(); fireFlowerImg.src = `${BASE}/sprites/powerups/fireflower.png`;
const goombaImg = new Image(); goombaImg.src = `${BASE}/sprites/enemies/goomba.png`;
const cloudBg = new Image(); cloudBg.src = `${BASE}/sprites/bg/cloud.png`;

// ========== GAME OBJECTS ==========

const player = {
  x: 100,
  y: canvas.height - 200,
  w: 40,
  h: 50,
  velX: 0,
  velY: 0,
  speed: 5,
  jumpPower: -15,
  jumping: false,
  state: "small", // "small", "big", or "fire"
  img: marioSmall
};

const goombas = [
  { x: 700, y: canvas.height - 130, w: 40, h: 40, dir: -1, alive: true },
  { x: 1200, y: canvas.height - 130, w: 40, h: 40, dir: -1, alive: true }
];

const platforms = [
  { x: 0, y: canvas.height - 80, width: 10000, height: 80, img: groundImg },
  { x: 400, y: canvas.height - 250, width: 80, height: 80, img: qblockImg, type: "powerup", hit: false }
];

const fireballs = [];
const powerups = []; // holds spawned fire flowers
const keys = {};
const camera = { x: 0, y: 0 };

// ========== INPUT ==========
onkeydown = e => keys[e.code] = true;
onkeyup = e => keys[e.code] = false;

// Touch controls
document.getElementById("left").ontouchstart = () => keys["ArrowLeft"] = true;
document.getElementById("left").ontouchend = () => keys["ArrowLeft"] = false;
document.getElementById("right").ontouchstart = () => keys["ArrowRight"] = true;
document.getElementById("right").ontouchend = () => keys["ArrowRight"] = false;
document.getElementById("up").ontouchstart = () => keys["Space"] = true;
document.getElementById("up").ontouchend = () => keys["Space"] = false;

// Fire button for iPad/iPhone
const fireBtn = document.getElementById("fire");
fireBtn.ontouchstart = () => shootFireball();
fireBtn.ontouchend = () => {};

// ========== FUNCTIONS ==========

// Shoot fireball
function shootFireball() {
  if (player.state !== "fire") return;
  if (fireballs.length > 3) return; // limit

  const ball = {
    x: player.x + player.w / 2,
    y: player.y + player.h / 2,
    w: 16,
    h: 16,
    velX: player.velX >= 0 ? 8 : -8,
    velY: -2
  };
  fireballs.push(ball);
}

// Update player position
function updatePlayer() {
  // Movement
  if (keys["ArrowRight"]) player.velX = player.speed;
  else if (keys["ArrowLeft"]) player.velX = -player.speed;
  else player.velX = 0;

  if (keys["Space"] && !player.jumping) {
    player.velY = player.jumpPower;
    player.jumping = true;
  }

  // Fire key (Ctrl)
  if (keys["ControlLeft"]) shootFireball();

  player.velY += gravity;
  player.x += player.velX;
  player.y += player.velY;

  // Collision with platforms
  for (let plat of platforms) {
    // From top
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

    // Hit block from below
    if (
      player.x + player.w > plat.x &&
      player.x < plat.x + plat.width &&
      player.y < plat.y + plat.height &&
      player.y > plat.y + plat.height - 20 &&
      player.velY < 0 &&
      plat.type === "powerup" &&
      !plat.hit
    ) {
      plat.hit = true;
      plat.img = brickImg;
      powerups.push({
        x: plat.x + 20,
        y: plat.y - 40,
        w: 32,
        h: 32,
        type: "fireflower",
        collected: false
      });
      player.velY = 0;
    }
  }

  // Power-up collection
  for (let p of powerups) {
    if (!p.collected &&
      player.x + player.w > p.x &&
      player.x < p.x + p.w &&
      player.y + player.h > p.y &&
      player.y < p.y + p.h
    ) {
      p.collected = true;
      player.state = "fire";
      player.img = marioFire;
    }
  }

  // Camera follow
  camera.x = player.x - canvas.width / 2;
  if (camera.x < 0) camera.x = 0;
}

// Update fireballs
function updateFireballs() {
  for (let f of fireballs) {
    f.x += f.velX;
    f.y += f.velY;
    f.velY += 0.3;

    // Bounce on ground
    if (f.y + f.h > canvas.height - 80) {
      f.y = canvas.height - 80 - f.h;
      f.velY = -8;
    }

    // Remove off-screen
    if (f.x < camera.x - 200 || f.x > camera.x + canvas.width + 200) {
      fireballs.splice(fireballs.indexOf(f), 1);
      continue;
    }

    // Collision with goombas
    for (let g of goombas) {
      if (g.alive &&
        f.x + f.w > g.x &&
        f.x < g.x + g.w &&
        f.y + f.h > g.y &&
        f.y < g.y + g.h
      ) {
        g.alive = false;
        fireballs.splice(fireballs.indexOf(f), 1);
      }
    }
  }
}

// Update goombas
function updateGoombas() {
  for (let g of goombas) {
    if (!g.alive) continue;
    g.x += g.dir * 1.5;
    // Reverse when hitting block edges
    if (g.x < 0 || g.x > 10000 - g.w) g.dir *= -1;

    // Player stomp
    if (
      g.alive &&
      player.x + player.w > g.x &&
      player.x < g.x + g.w &&
      player.y + player.h > g.y &&
      player.y < g.y + g.h
    ) {
      if (player.velY > 0) {
        g.alive = false;
        player.velY = -10;
      } else {
        alert("☠️ You got hit!");
        location.reload();
      }
    }
  }
}

// ========== DRAW ==========
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(cloudBg, -camera.x, 0, canvas.width * 2, canvas.height);

  // Platforms
  for (let plat of platforms) {
    ctx.drawImage(plat.img, plat.x - camera.x, plat.y, plat.width, plat.height);
  }

  // Powerups
  for (let p of powerups) {
    if (!p.collected)
      ctx.drawImage(fireFlowerImg, p.x - camera.x, p.y, p.w, p.h);
  }

  // Goombas
  for (let g of goombas) {
    if (g.alive)
      ctx.drawImage(goombaImg, g.x - camera.x, g.y, g.w, g.h);
  }

  // Fireballs
  for (let f of fireballs) {
    ctx.fillStyle = "orange";
    ctx.beginPath();
    ctx.arc(f.x - camera.x + f.w / 2, f.y + f.h / 2, f.w / 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Player
  ctx.drawImage(player.img, player.x - camera.x, player.y, player.w, player.h);
}

// ========== LOOP ==========
function loop() {
  updatePlayer();
  updateFireballs();
  updateGoombas();
  draw();
  requestAnimationFrame(loop);
}
loop();
