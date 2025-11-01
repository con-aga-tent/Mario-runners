const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = innerWidth;
canvas.height = innerHeight;

const gravity = 0.67;
let scrollOffset = 0;
let isMuted = false;

// Load images
const marioImg = new Image();
marioImg.src = "https://art.pixilart.com/49f92202ce99ade.png";

const goombaImg = new Image();
goombaImg.src = "https://static.wikia.nocookie.net/mario/images/7/7d/SMBW_Goomba.png/revision/latest?cb=20240227211641";

const flagImg = new Image();
flagImg.src = "https://i.imgur.com/mD7RTeZ.png"; // sample flag image

// Music
const music = new Audio("https://lambda.vgmtreasurechest.com/soundtracks/super-mario-bros.-wonder-switch-gamerip-2023/lqwibiml/1-75.%20Ninji%20Disco.mp3");
music.loop = true;
music.volume = 0.5;
music.play();

// Mute button
const muteBtn = document.getElementById("muteBtn");
muteBtn.onclick = () => {
  isMuted = !isMuted;
  music.muted = isMuted;
  muteBtn.textContent = isMuted ? "🔇" : "🔊";
};

// Ground
const groundHeight = 100;

// Player
const player = {
  x: 100,
  y: canvas.height - groundHeight - 64,
  width: 50,
  height: 64,
  velocityX: 0,
  velocityY: 0,
  speed: 5,
  jumping: false,
  alive: true
};

// Goombas
const goombas = [
  { x: 700, y: canvas.height - groundHeight - 40, width: 40, height: 40, alive: true },
  { x: 1200, y: canvas.height - groundHeight - 40, width: 40, height: 40, alive: true }
];

// Platforms (ground, gap, slopes)
const platforms = [
  { x: 0, y: canvas.height - groundHeight, width: 600, height: groundHeight },
  { x: 700, y: canvas.height - groundHeight, width: 300, height: groundHeight },
  { x: 1300, y: canvas.height - groundHeight - 50, width: 400, height: groundHeight + 50 },
  { x: 1800, y: canvas.height - groundHeight - 100, width: 400, height: groundHeight + 100 },
  { x: 2300, y: canvas.height - groundHeight, width: 300, height: groundHeight }
];

// Goal
const goal = { x: 2600, y: canvas.height - groundHeight - 150, width: 40, height: 150 };

// Controls
let keys = {};
onkeydown = (e) => (keys[e.code] = true);
onkeyup = (e) => (keys[e.code] = false);

// Update
function update() {
  // Movement
  if (keys["ArrowRight"]) player.velocityX = player.speed;
  else if (keys["ArrowLeft"]) player.velocityX = -player.speed;
  else player.velocityX = 0;

  // Jump
  if (keys["Space"] && !player.jumping) {
    player.velocityY = -15;
    player.jumping = true;
  }

  // Gravity
  player.velocityY += gravity;
  player.x += player.velocityX;
  player.y += player.velocityY;

  // Camera scroll
  scrollOffset = player.x - 100;

  // Ground/platform collision
  let onGround = false;
  for (let plat of platforms) {
    const px = plat.x - scrollOffset;
    if (
      player.x + player.width > plat.x &&
      player.x < plat.x + plat.width &&
      player.y + player.height > plat.y &&
      player.y + player.height < plat.y + 20 &&
      player.velocityY >= 0
    ) {
      player.y = plat.y - player.height;
      player.velocityY = 0;
      player.jumping = false;
      onGround = true;
    }
  }

  // Respawn if falls
  if (player.y > canvas.height) {
    player.x = 100;
    player.y = canvas.height - groundHeight - 64;
    player.velocityY = 0;
  }

  // Goomba logic
  for (let g of goombas) {
    if (!g.alive) continue;
    g.x -= 1; // move left slowly
    const gx = g.x - scrollOffset;

    // Collision with player
    if (
      player.x + player.width > g.x &&
      player.x < g.x + g.width &&
      player.y + player.height > g.y &&
      player.y < g.y + g.height
    ) {
      if (player.velocityY > 0 && player.y + player.height - g.y < 20) {
        // Stomped
        g.alive = false;
        player.velocityY = -10; // bounce
      } else {
        // Hit from side
        player.x = 100;
        player.y = canvas.height - groundHeight - 64;
        player.velocityY = 0;
      }
    }
  }

  // Goal check
  if (
    player.x + player.width > goal.x &&
    player.x < goal.x + goal.width &&
    player.y + player.height > goal.y
  ) {
    alert("Level Complete!");
    player.x = 100;
    player.y = canvas.height - groundHeight - 64;
  }
}

// Draw
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw platforms
  ctx.fillStyle = "#8B4513";
  for (let plat of platforms) {
    ctx.fillRect(plat.x - scrollOffset, plat.y, plat.width, plat.height);
  }

  // Draw Goombas
  for (let g of goombas) {
    if (g.alive) ctx.drawImage(goombaImg, g.x - scrollOffset, g.y, g.width, g.height);
  }

  // Draw player
  ctx.drawImage(marioImg, player.x - scrollOffset, player.y, player.width, player.height);

  // Draw goal
  ctx.drawImage(flagImg, goal.x - scrollOffset, goal.y, goal.width, goal.height);
}

// Loop
function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

gameLoop();
