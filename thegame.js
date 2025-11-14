/***********************
 * ASSET PATHS
 ************************/
const BASE = "https://raw.githubusercontent.com/mario-runners/mario-game/main/assets/";

const ASSETS = {
    music: {
        title: BASE + "music/title.mp3",
        overworld: BASE + "music/overworld.mp3"
    },
    sprites: {
        mario: {
            small: BASE + "sprites/mario/small_mario.png",
            big:   BASE + "sprites/mario/big_mario.png",
            fire:  BASE + "sprites/mario/fire_mario.png"
        },
        blocks: {
            ground: BASE + "sprites/blocks/ground.png",
            brick: BASE + "sprites/blocks/brick.png",
            qblock: BASE + "sprites/blocks/?block.png"
        },
        enemies: {
            goomba: BASE + "sprites/enemies/goomba.png"
        },
        powerups: {
            fireflower: BASE + "sprites/powerups/fireflower.png"
        },
        goal: BASE + "sprites/goal-poles/Regular_GoalPole.png"
    }
};


/***********************
 * DOM ELEMENTS
 ************************/
const titleScreen = document.getElementById("title-screen");
const startButton = document.getElementById("start-button");
const introVideo = document.getElementById("intro-video");
const canvas = document.getElementById("gameCanvas");
const controls = document.getElementById("controls");

const ctx = canvas.getContext("2d");
canvas.width = innerWidth;
canvas.height = innerHeight;


/***********************
 * AUDIO
 ************************/
const titleMusic = new Audio(ASSETS.music.title);
titleMusic.loop = true;

const overworldMusic = new Audio(ASSETS.music.overworld);
overworldMusic.loop = true;


/***********************
 * TITLE LOGIC
 ************************/
titleMusic.play();

startButton.onclick = async () => {
    titleMusic.pause();
    titleScreen.classList.add("hidden");

    introVideo.classList.remove("hidden");

    try {
        await introVideo.play();
    } catch {
        startGame();
        return;
    }

    introVideo.onended = () => {
        introVideo.classList.add("hidden");
        startGame();
    };
};


/***********************
 * GAME STATE
 ************************/
let gravity = 0.7;

let mario = {
    x: 200,
    y: canvas.height - 200,
    w: 48,
    h: 52,
    vx: 0,
    vy: 0,
    speed: 6,
    jumping: false,
    facing: 1, // 1 = right, -1 = left
    state: "small" // small | big | fire
};

let keys = {};
document.onkeydown = e => keys[e.code] = true;
document.onkeyup = e => keys[e.code] = false;

document.getElementById("left").ontouchstart = () => keys["ArrowLeft"] = true;
document.getElementById("left").ontouchend   = () => keys["ArrowLeft"] = false;

document.getElementById("right").ontouchstart = () => keys["ArrowRight"] = true;
document.getElementById("right").ontouchend   = () => keys["ArrowRight"] = false;

document.getElementById("jump").ontouchstart = () => keys["Space"] = true;
document.getElementById("jump").ontouchend   = () => keys["Space"] = false;

document.getElementById("fire-button").ontouchstart = () => shootFire();


/***********************
 * LOAD IMAGES
 ************************/
const imgMarioSmall = new Image(); imgMarioSmall.src = ASSETS.sprites.mario.small;
const imgMarioBig = new Image();   imgMarioBig.src = ASSETS.sprites.mario.big;
const imgMarioFire = new Image();  imgMarioFire.src = ASSETS.sprites.mario.fire;

const groundImg = new Image(); groundImg.src = ASSETS.sprites.blocks.ground;
const brickImg = new Image();  brickImg.src = ASSETS.sprites.blocks.brick;
const qblockImg = new Image(); qblockImg.src = ASSETS.sprites.blocks.qblock;

const goombaImg = new Image(); goombaImg.src = ASSETS.sprites.enemies.goomba;

const fireflowerImg = new Image(); fireflowerImg.src = ASSETS.sprites.powerups.fireflower;

const goalImg = new Image(); goalImg.src = ASSETS.sprites.goal;


/***********************
 * LEVEL GEOMETRY
 ************************/
let platforms = [];
const groundY = canvas.height - 80;

// Main ground runs 10,000px long
platforms.push({
    x: 0,
    y: groundY,
    width: 10000,
    height: 80,
    img: groundImg
});

// Fireflower block
let flowerBlock = {
    x: 800,
    y: groundY - 200,
    w: 40,
    h: 40,
    used: false
};

// Enemy
let goombas = [
    { x: 1200, y: groundY - 50, w: 40, h: 50, vx: -1 }
];

// -----------------------------
// STAIRCASE
// -----------------------------
const stairStart = 9200;
const steps = 8;
for (let i = 0; i < steps; i++) {
    platforms.push({
        x: stairStart + i * 40,
        y: groundY - (i + 1) * 40,
        width: 40,
        height: 40,
        img: brickImg
    });
}

// -----------------------------
// GOAL POLE
// -----------------------------
const goalPole = {
    x: stairStart + steps * 40 + 120,
    y: groundY - 150,
    w: 40,
    h: 150
};


/***********************
 * START GAME
 ************************/
function startGame() {
    canvas.classList.remove("hidden");
    controls.style.display = "block";
    overworldMusic.play();
    requestAnimationFrame(gameLoop);
}


/***********************
 * FIREBALL LOGIC
 ************************/
let fireballs = [];

function shootFire() {
    if (mario.state !== "fire") return;

    fireballs.push({
        x: mario.x + (mario.facing === 1 ? 30 : -10),
        y: mario.y + 20,
        vx: mario.facing * 8,
        w: 12,
        h: 12
    });
}


/***********************
 * UPDATE LOOP
 ************************/
function update() {

    // Movement
    if (keys["ArrowRight"]) {
        mario.vx = mario.speed;
        mario.facing = 1;
    } else if (keys["ArrowLeft"]) {
        mario.vx = -mario.speed;
        mario.facing = -1;
    } else {
        mario.vx = 0;
    }

    // Jump
    if (keys["Space"] && !mario.jumping) {
        mario.vy = -15;
        mario.jumping = true;
    }

    mario.vy += gravity;
    mario.x += mario.vx;
    mario.y += mario.vy;

    // Platform collisions
    let onGround = false;
    for (let p of platforms) {
        if (
            mario.x + mario.w > p.x &&
            mario.x < p.x + p.width &&
            mario.y + mario.h > p.y &&
            mario.y + mario.h < p.y + 30 &&
            mario.vy >= 0
        ) {
            mario.y = p.y - mario.h;
            mario.vy = 0;
            mario.jumping = false;
            onGround = true;
        }
    }

    // Hitting ? Block
    if (
        !flowerBlock.used &&
        mario.x + mario.w > flowerBlock.x &&
        mario.x < flowerBlock.x + flowerBlock.w &&
        mario.y < flowerBlock.y + flowerBlock.h &&
        mario.y > flowerBlock.y - 20 &&
        mario.vy < 0
    ) {
        flowerBlock.used = true;
        powerup = { x: flowerBlock.x, y: flowerBlock.y - 50, w: 40, h: 40, vy: -2 };
    }

    // Powerup movement
    if (typeof powerup !== "undefined") {
        powerup.y += powerup.vy;
        if (powerup.vy < 0) powerup.vy += 0.1;

        // Collect
        if (
            mario.x + mario.w > powerup.x &&
            mario.x < powerup.x + powerup.w &&
            mario.y + mario.h > powerup.y &&
            mario.y < powerup.y + powerup.h
        ) {
            mario.state = "fire";
            delete powerup;
        }
    }

    // Goomba movement
    for (let g of goombas) {
        g.x += g.vx;

        // Collision with Mario
        if (
            mario.x + mario.w > g.x &&
            mario.x < g.x + g.w &&
            mario.y + mario.h > g.y &&
            mario.y < g.y + g.h
        ) {
            // Stomp
            if (mario.vy > 0) {
                g.dead = true;
                mario.vy = -10;
            } else {
                // Damage Mario
                mario.state = "small";
            }
        }
    }
    goombas = goombas.filter(g => !g.dead);

    // Fireball movement
    for (let f of fireballs) {
        f.x += f.vx;
        for (let g of goombas) {
            if (
                f.x + f.w > g.x &&
                f.x < g.x + g.w &&
                f.y + f.h > g.y &&
                f.y < g.y + g.h
            ) {
                g.dead = true;
                f.dead = true;
            }
        }
    }
    fireballs = fireballs.filter(f => !f.dead);

    // Goal pole
    if (
        mario.x + mario.w > goalPole.x &&
        mario.x < goalPole.x + goalPole.w &&
        mario.y + mario.h > goalPole.y
    ) {
        alert("🏁 LEVEL COMPLETE!");
        location.reload();
    }
}


/***********************
 * DRAW LOOP
 ************************/
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background
    ctx.fillStyle = "#70c0ff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Camera follows Mario
    let cameraX = mario.x - canvas.width / 2;
    if (cameraX < 0) cameraX = 0;

    // Draw platforms
    for (let p of platforms) {
        ctx.drawImage(p.img, p.x - cameraX, p.y, p.width, p.height);
    }

    // Flower block
    ctx.drawImage(flowerBlock.used ? brickImg : qblockImg,
        flowerBlock.x - cameraX, flowerBlock.y, 40, 40);

    // Powerup
    if (typeof powerup !== "undefined") {
        ctx.drawImage(fireflowerImg, powerup.x - cameraX, powerup.y, 40, 40);
    }

    // Goombas
    for (let g of goombas) {
        ctx.drawImage(goombaImg, g.x - cameraX, g.y, g.w, g.h);
    }

    // Fireballs
    ctx.fillStyle = "orange";
    for (let f of fireballs) {
        ctx.fillRect(f.x - cameraX, f.y, f.w, f.h);
    }

    // Mario sprite selection
    let sprite = imgMarioSmall;
    if (mario.state === "big") sprite = imgMarioBig;
    if (mario.state === "fire") sprite = imgMarioFire;

    // Flip Mario if facing left
    ctx.save();
    if (mario.facing === -1) {
        ctx.scale(-1, 1);
        ctx.drawImage(sprite, -(mario.x + mario.w - cameraX), mario.y, mario.w, mario.h);
    } else {
        ctx.drawImage(sprite, mario.x - cameraX, mario.y, mario.w, mario.h);
    }
    ctx.restore();

    // Goal pole
    ctx.drawImage(goalImg, goalPole.x - cameraX, goalPole.y, goalPole.w, goalPole.h);
}


/***********************
 * GAME LOOP
 ************************/
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}
