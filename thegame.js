const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = innerWidth;
canvas.height = innerHeight;

const gravity = 0.67;
let scrollOffsetX = 0;
let scrollOffsetY = 0;
let isMuted = false;

// Player
const player = {
  x: 100,
  y: canvas.height - 64,
  width: 50,
  height: 64,
  velocityX: 0,
  velocityY: 0,
  speed: 5,
  jumping: false,
  state: "small"
};

// Fireballs
const fireballs = [];

// Platforms (vertical climbing)
const platforms = [
  { x: 0, y: canvas.height - 100, width: 600, height: 20 },
  { x: 50, y: canvas.height - 200, width: 200, height: 20 },
  { x: 300, y: canvas.height - 350, width: 200, height: 20 },
  { x: 100, y: canvas.height - 500, width: 250, height: 20 },
  { x: 250, y: canvas.height - 650, width: 300, height: 20 },
  { x: 400, y: canvas.height - 800, width: 50, height: 20 }, // Secret room
  { x: 450, y: canvas.height - 1000, width: 300, height: 20 } // Regular exit
];

// Fake wall (secret exit room)
const fakeWall = { x: 400, y: canvas.height - 800, width: 50, height: 50 };

// Secret exit (behind fake wall)
const secretExit = { x: 460, y: canvas.height - 850, width: 40, height: 150 };

// Regular exit
const regularExit = { x: 500, y: canvas.height - 1000, width: 40, height: 150 };

// D-pad & keyboard controls
let keys = {};
onkeydown = (e) => keys[e.code] = true;
onkeyup = (e) => keys[e.code] = false;

// D-pad mapping
const buttonMap = { left:"ArrowLeft", right:"ArrowRight", up:"ArrowUp", down:"ArrowDown" };
for(let id in buttonMap){
  const key = buttonMap[id];
  const btn = document.getElementById(id);
  btn.addEventListener("touchstart", () => keys[key] = true);
  btn.addEventListener("touchend", () => keys[key] = false);
  btn.addEventListener("mousedown", () => keys[key] = true);
  btn.addEventListener("mouseup", () => keys[key] = false);
}

// Music
const music = new Audio("assets/music/overworld.mp3");
music.loop = true;
music.volume = 0.5;
music.play();

document.getElementById("muteBtn").onclick = () => {
  isMuted = !isMuted;
  music.muted = isMuted;
  document.getElementById("muteBtn").textContent = isMuted ? "🔇" : "🔊";
};

// Fireball button
document.getElementById("fireBtn").onclick = () => {
  if(player.state === "fire") fireballs.push({x: player.x+player.width, y: player.y+20, radius:10, speed:10});
};

// Update
function update(){
  player.velocityX = 0;
  if(keys["ArrowRight"]) player.velocityX = player.speed;
  if(keys["ArrowLeft"]) player.velocityX = -player.speed;
  if(keys["ArrowUp"] && !player.jumping){ player.velocityY = -15; player.jumping = true; }

  player.velocityY += gravity;
  player.x += player.velocityX;
  player.y += player.velocityY;

  // Camera follows player vertically
  scrollOffsetX = player.x - 100;
  scrollOffsetY = player.y - canvas.height + 200;

  // Platform collisions
  for(const plat of platforms){
    if(player.x + player.width > plat.x &&
       player.x < plat.x + plat.width &&
       player.y + player.height > plat.y &&
       player.y + player.height < plat.y + 20 &&
       player.velocityY >= 0){
      player.y = plat.y - player.height;
      player.velocityY = 0;
      player.jumping = false;
    }
  }

  // Fireball update
  for(let i=fireballs.length-1;i>=0;i--){
    fireballs[i].x += fireballs[i].speed;
    if(fireballs[i].x > canvas.width + scrollOffsetX) fireballs.splice(i,1);
  }

  // Fake wall collision
  if(player.x + player.width > fakeWall.x &&
     player.x < fakeWall.x + fakeWall.width &&
     player.y + player.height > fakeWall.y &&
     player.y < fakeWall.y + fakeWall.height){
    alert("🚫 Fake wall! Try exploring the hidden path!");
  }

  // Secret exit
  if(player.x + player.width > secretExit.x &&
     player.x < secretExit.x + secretExit.width &&
     player.y + player.height > secretExit.y){
    alert("🎉 Secret Exit Found!");
  }

  // Regular exit
  if(player.x + player.width > regularExit.x &&
     player.x < regularExit.x + regularExit.width &&
     player.y + player.height > regularExit.y){
    alert("🏰 Level Complete!");
  }

  // Respawn if falls
  if(player.y > canvas.height + 200){
    player.x = 100;
    player.y = canvas.height - 64;
    player.velocityY = 0;
  }
}

// Draw
function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);

  // Platforms
  ctx.fillStyle = "#8B4513";
  for(const plat of platforms) ctx.fillRect(plat.x - scrollOffsetX, plat.y - scrollOffsetY, plat.width, plat.height);

  // Fake wall
  ctx.fillStyle = "lightgray";
  ctx.fillRect(fakeWall.x - scrollOffsetX, fakeWall.y - scrollOffsetY, fakeWall.width, fakeWall.height);

  // Exits
  ctx.fillStyle = "blue";
  ctx.fillRect(regularExit.x - scrollOffsetX, regularExit.y - scrollOffsetY, regularExit.width, regularExit.height);
  ctx.fillStyle = "red";
  ctx.fillRect(secretExit.x - scrollOffsetX, secretExit.y - scrollOffsetY, secretExit.width, secretExit.height);

  // Player
  ctx.fillStyle = "green";
  ctx.fillRect(player.x - scrollOffsetX, player.y - scrollOffsetY, player.width, player.height);

  // Fireballs
  ctx.fillStyle = "orange";
  for(const f of fireballs){
    ctx.beginPath();
    ctx.arc(f.x - scrollOffsetX, f.y - scrollOffsetY, f.radius, 0, Math.PI*2);
    ctx.fill();
  }
}

// Loop
function gameLoop(){
  update();
  draw();
  requestAnimationFrame(gameLoop);
}
gameLoop();
