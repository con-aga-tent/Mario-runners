const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const prefix = "https://raw.githubusercontent.com/con-aga-tent/Mario-runners/main/assets";

// 🎵 Music
const music = new Audio(`${prefix}/music/overworld.mp3`);
music.loop = true;
window.addEventListener("click", () => music.play().catch(()=>{}), { once: true });

// 🖼️ Sprites
const marioSmall = new Image(); marioSmall.src = `${prefix}/sprites/mario/small_mario.png`;
const marioBig = new Image(); marioBig.src = `${prefix}/sprites/mario/big_mario.png`;
const marioFire = new Image(); marioFire.src = `${prefix}/sprites/mario/fire_mario.png`;

const groundImg = new Image(); groundImg.src = `${prefix}/sprites/blocks/ground.png`;
const brickImg = new Image(); brickImg.src = `${prefix}/sprites/blocks/brick.png`;
const qBlockImg = new Image(); qBlockImg.src = `${prefix}/sprites/blocks/%3Fblock.png`;
const goalPoleImg = new Image(); goalPoleImg.src = `${prefix}/sprites/goal-poles/GoalPole_Normal.png`;
const goombaImg = new Image(); goombaImg.src = `${prefix}/sprites/enemies/goomba.png`;
const fireFlowerImg = new Image(); fireFlowerImg.src = `${prefix}/sprites/powerups/fireflower.png`;
const cloudBg = new Image(); cloudBg.src = `${prefix}/sprites/bg/cloud.png`;

// 🧍 Mario
let player = {
  x: 100,
  y: 0,
  w: 32,
  h: 32,
  velX: 0,
  velY: 0,
  speed: 4,
  jumpForce: 10,
  grounded: false,
  state: "small", // small | big | fire
  facingRight: true,
  slidingFlag: false
};

// 🔥 Fireballs
let fireballs = [];

// 🌍 Level Setup
const gravity = 0.5;
const groundHeight = 64;
const levelWidth = 10000;
const camera = { x: 0, y: 0 };

let platforms = [];
for (let i = 0; i < levelWidth; i += 64) {
  platforms.push({ x: i, y: canvas.height - groundHeight, w: 64, h: 64, img: groundImg });
}

// Staircase to goal
for (let i = 0; i < 5; i++) {
  platforms.push({ x: 9400 + i * 64, y: canvas.height - groundHeight - i * 64, w: 64, h: 64, img: brickImg });
}

// Question block
const qBlock = { x: 600, y: 300, w: 32, h: 32, hit: false };

// Fire flower
let fireFlower = null;

// Goal pole
const goalPole = { x: 9700, y: canvas.height - 320, w: 32, h: 320 };

// Enemies
let goombas = [{ x: 800, y: canvas.height - groundHeight - 32, w: 32, h: 32, dir: -1 }];

// 🎮 Controls
let keys = {};
document.addEventListener("keydown", e => keys[e.key] = true);
document.addEventListener("keyup", e => keys[e.key] = false);

document.getElementById("left").ontouchstart = () => keys["ArrowLeft"] = true;
document.getElementById("left").ontouchend = () => keys["ArrowLeft"] = false;
document.getElementById("right").ontouchstart = () => keys["ArrowRight"] = true;
document.getElementById("right").ontouchend = () => keys["ArrowRight"] = false;
document.getElementById("jump").ontouchstart = () => jump();
document.getElementById("fire").ontouchstart = () => shootFire();

function jump() {
  if (player.grounded && !player.slidingFlag) {
    player.velY = -player.jumpForce;
    player.grounded = false;
  }
}

function shootFire() {
  if (player.state === "fire" && fireballs.length < 3) {
    const dir = player.facingRight ? 1 : -1;
    fireballs.push({
      x: player.x + player.w / 2,
      y: player.y + player.h / 2,
      velX: 8 * dir,
      radius: 8
    });
  }
}

// 🧠 Game Loop
function update() {
  if (player.slidingFlag) return;

  // Movement
  if (keys["ArrowRight"]) {
    player.velX = player.speed;
    player.facingRight = true;
  } else if (keys["ArrowLeft"]) {
    player.velX = -player.speed;
    player.facingRight = false;
  } else {
    player.velX = 0;
  }

  // Jump
  if (keys[" "]) jump();

  // Gravity
  player.velY += gravity;
  player.x += player.velX;
  player.y += player.velY;
  player.grounded = false;

  // Collisions
  for (let p of platforms) {
    if (
      player.x < p.x + p.w &&
      player.x + player.w > p.x &&
      player.y < p.y + p.h &&
      player.y + player.h > p.y
    ) {
      if (player.velY > 0) {
        player.y = p.y - player.h;
        player.velY = 0;
        player.grounded = true;
      }
    }
  }

  // Question block hit
  if (!qBlock.hit && player.velY < 0 && player.y < qBlock.y + qBlock.h &&
      player.x + player.w > qBlock.x && player.x < qBlock.x + qBlock.w) {
    qBlock.hit = true;
    fireFlower = { x: qBlock.x, y: qBlock.y - 32, w: 32, h: 32, vy: -2 };
  }

  // Fire flower float up
  if (fireFlower) {
    fireFlower.y += fireFlower.vy;
    if (fireFlower.y <= qBlock.y - 64) fireFlower.vy = 0;

    // Pickup
    if (
      player.x < fireFlower.x + fireFlower.w &&
      player.x + player.w > fireFlower.x &&
      player.y < fireFlower.y + fireFlower.h &&
      player.y + player.h > fireFlower.y
    ) {
      fireFlower = null;
      player.state = "fire";
    }
  }

  // Fireballs move
  for (let f of fireballs) f.x += f.velX;

  // Goombas move
  for (let g of goombas) {
    g.x += g.dir * 1.5;
    if (g.x < 700 || g.x > 1000) g.dir *= -1;
  }

  // Fireball hits goomba
  goombas = goombas.filter(g => {
    for (let f of fireballs) {
      if (f.x > g.x && f.x < g.x + g.w && f.y > g.y && f.y < g.y + g.h) {
        return false;
      }
    }
    return true;
  });

  // Flagpole detection
  if (
    !player.slidingFlag &&
    player.x + player.w > goalPole.x &&
    player.x < goalPole.x + goalPole.w &&
    player.y + player.h > goalPole.y &&
    player.y < goalPole.y + goalPole.h
  ) {
    player.slidingFlag = true;
    player.velX = player.velY = 0;
    player.x = goalPole.x - player.w + 5;
    const slide = setInterval(() => {
      player.y += 3;
      if (player.y + player.h >= canvas.height - groundHeight) {
        clearInterval(slide);
        setTimeout(() => {
          alert("✅ Level Complete!");
          location.reload();
        }, 500);
      }
    }, 16);
  }

  // Camera follow
  camera.x = Math.max(0, player.x - canvas.width / 2);
}

// 🎨 Draw
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Sky
  ctx.fillStyle = "#5c94fc";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < levelWidth; i += 400) {
    ctx.drawImage(cloudBg, i - camera.x * 0.5, 80, 128, 64);
  }

  // Ground and blocks
  for (let p of platforms) ctx.drawImage(p.img, p.x - camera.x, p.y, p.w, p.h);

  // Question block
  ctx.drawImage(qBlock.hit ? brickImg : qBlockImg, qBlock.x - camera.x, qBlock.y, qBlock.w, qBlock.h);

  // Fire flower
  if (fireFlower) ctx.drawImage(fireFlowerImg, fireFlower.x - camera.x, fireFlower.y, fireFlower.w, fireFlower.h);

  // Goal pole
  ctx.drawImage(goalPoleImg, goalPole.x - camera.x, goalPole.y, goalPole.w, goalPole.h);

  // Goombas
  for (let g of goombas) ctx.drawImage(goombaImg, g.x - camera.x, g.y, g.w, g.h);

  // Fireballs
  ctx.fillStyle = "orange";
  for (let f of fireballs) ctx.beginPath(), ctx.arc(f.x - camera.x, f.y, f.radius, 0, Math.PI * 2), ctx.fill();

  // Mario sprite
  ctx.save();
  ctx.translate(player.x - camera.x + player.w / 2, player.y + player.h / 2);
  ctx.scale(player.facingRight ? 1 : -1, 1);
  const marioImg = player.state === "fire" ? marioFire : player.state === "big" ? marioBig : marioSmall;
  ctx.drawImage(marioImg, -player.w / 2, -player.h / 2, player.w, player.h);
  ctx.restore();
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}
gameLoop();
