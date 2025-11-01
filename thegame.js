const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = innerWidth;
canvas.height = innerHeight;

const gravity = 0.67;
let isMuted = false;
let inSecret = false;

// 🎵 Music
const music = new Audio("assets/music/overworld.mp3");
music.loop = true;
music.volume = 0.5;
music.play();
document.getElementById("muteBtn").onclick = () => {
  isMuted = !isMuted;
  music.muted = isMuted;
  muteBtn.textContent = isMuted ? "🔇" : "🔊";
};

// 🎨 Images
const marioImg = new Image(); marioImg.src = "assets/sprites/mario/small_mario.png";
const brickImg = new Image(); brickImg.src = "assets/sprites/blocks/brick.png";
const groundImg = new Image(); groundImg.src = "assets/sprites/blocks/ground.png";
const doorImg = new Image(); doorImg.src = "assets/sprites/blocks/door.png";
const goalImg = new Image(); goalImg.src = "assets/sprites/goal-poles/Regular_GoalPole.png";
const fakeGoalImg = new Image(); fakeGoalImg.src = "assets/sprites/goal-poles/GoalPole_Fake.png";
const secretGoalImg = new Image(); secretGoalImg.src = "assets/sprites/goal-poles/SecretExitFlagpole.png";
const cloudBg = new Image(); cloudBg.src = "assets/sprites/bg/cloud.png";

// 👇 Level setup
const groundHeight = 80;
const player = {
  x: 100,
  y: canvas.height - 200,
  w: 40,
  h: 50,
  velX: 0,
  velY: 0,
  speed: 5,
  jumpPower: -15,
  jumping: false
};

const camera = { y: 0 };

const platforms = [
  { x: 0, y: canvas.height - 80, width: 1000, height: 80, img: groundImg },
  { x: 400, y: canvas.height - 250, width: 200, height: 40, img: brickImg },
  { x: 650, y: canvas.height - 400, width: 200, height: 40, img: brickImg },
  { x: 850, y: canvas.height - 550, width: 400, height: 40, img: brickImg },
  { x: 0, y: canvas.height - 700, width: 200, height: 40, img: brickImg }, // dead-end room floor
];

const fakeWall = { x: 200, y: canvas.height - 740, width: 150, height: 120 }; // looks solid but passable
const door = { x: 300, y: canvas.height - 740 - 60, width: 50, height: 60 };
const fakeGoal = { x: 900, y: canvas.height - 550 - 150, width: 40, height: 150 };
const realGoal = { x: 600, y: canvas.height - 800 - 150, width: 40, height: 150 };
const secretGoal = { x: 1200, y: canvas.height - 200, width: 40, height: 150 };

let keys = {};
onkeydown = e => keys[e.code] = true;
onkeyup = e => keys[e.code] = false;

// D-pad
document.getElementById("left").ontouchstart = () => keys["ArrowLeft"] = true;
document.getElementById("left").ontouchend = () => keys["ArrowLeft"] = false;
document.getElementById("right").ontouchstart = () => keys["ArrowRight"] = true;
document.getElementById("right").ontouchend = () => keys["ArrowRight"] = false;
document.getElementById("up").ontouchstart = () => keys["Space"] = true;
document.getElementById("up").ontouchend = () => keys["Space"] = false;

// 🚪 Door mechanic
function enterDoor() {
  if (
    player.x + player.w > door.x &&
    player.x < door.x + door.width &&
    player.y + player.h > door.y &&
    player.y < door.y + door.height
  ) {
    inSecret = true;
    player.x = 200;
    player.y = canvas.height - 300;
  }
}

// 🧱 Update
function update() {
  // Move
  if (keys["ArrowRight"]) player.velX = player.speed;
  else if (keys["ArrowLeft"]) player.velX = -player.speed;
  else player.velX = 0;

  if (keys["Space"] && !player.jumping) {
    player.velY = player.jumpPower;
    player.jumping = true;
  }

  player.velY += gravity;
  player.x += player.velX;
  player.y += player.velY;

  // Ground collision
  let onGround = false;
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
      onGround = true;
    }
  }

  // Fake wall — can pass through
  if (
    player.x + player.w > fakeWall.x &&
    player.x < fakeWall.x + fakeWall.width &&
    player.y + player.h > fakeWall.y &&
    player.y < fakeWall.y + fakeWall.height
  ) {
    document.body.style.background = "rgba(0,0,0,0.7)";
  } else {
    document.body.style.background = "";
  }

  // Enter door if pressed down inside fake wall
  if (keys["ArrowDown"]) enterDoor();

  // Goals
  if (inSecret) {
    if (
      player.x + player.w > secretGoal.x &&
      player.x < secretGoal.x + secretGoal.width &&
      player.y + player.h > secretGoal.y
    ) {
      alert("🎉 Secret Exit Found!");
      location.reload();
    }
  } else {
    if (
      player.x + player.w > fakeGoal.x &&
      player.x < fakeGoal.x + fakeGoal.width &&
      player.y + player.h > fakeGoal.y
    ) {
      alert("❌ Fake Exit! Try again...");
      player.x = 100;
      player.y = canvas.height - 200;
    }
    if (
      player.x + player.w > realGoal.x &&
      player.x < realGoal.x + realGoal.width &&
      player.y + player.h > realGoal.y
    ) {
      alert("✅ Level Complete!");
      location.reload();
    }
  }

  // Scroll up
  camera.y = Math.max(0, player.y - canvas.height / 2);
}

// 🖼️ Draw
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (inSecret) ctx.drawImage(cloudBg, 0, 0, canvas.width, canvas.height);
  else ctx.fillStyle = "#444", ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Platforms
  for (let plat of platforms) {
    ctx.drawImage(plat.img, plat.x, plat.y - camera.y, plat.width, plat.height);
  }

  // Fake wall (still visible)
  ctx.drawImage(groundImg, fakeWall.x, fakeWall.y - camera.y, fakeWall.width, fakeWall.height);
  ctx.drawImage(doorImg, door.x, door.y - camera.y, door.width, door.height);

  if (inSecret)
    ctx.drawImage(secretGoalImg, secretGoal.x, secretGoal.y - camera.y, secretGoal.width, secretGoal.height);
  else {
    ctx.drawImage(fakeGoalImg, fakeGoal.x, fakeGoal.y - camera.y, fakeGoal.width, fakeGoal.height);
    ctx.drawImage(goalImg, realGoal.x, realGoal.y - camera.y, realGoal.width, realGoal.height);
  }

  ctx.drawImage(marioImg, player.x, player.y - camera.y, player.w, player.h);
}

// 🎮 Loop
function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}
gameLoop();
