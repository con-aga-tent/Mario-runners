//
// --- ASSET PATHS ---
//

const ROOT = "https://raw.githubusercontent.com/mario-runners/mario-game/main/assets/";

const ASSETS = {
    titleMusic: ROOT + "music/title.mp3",
    intro: ROOT + "intros/1-1.mp4",
    overworld: ROOT + "music/overworld.mp3",

    clouds: ROOT + "sprites/bg/cloud.png",

    marioSmall: ROOT + "sprites/mario/small_mario.png",
    marioBig: ROOT + "sprites/mario/big_mario.png",
    marioFire: ROOT + "sprites/mario/fire_mario.png",

    qBlock: ROOT + "sprites/blocks/?block.png",
    brick: ROOT + "sprites/blocks/brick.png",
    ground: ROOT + "sprites/blocks/ground.png",

    goomba: ROOT + "sprites/enemies/goomba.png",

    fireFlower: ROOT + "sprites/powerups/fireflower.png",

    flagNormal: ROOT + "sprites/goal-poles/GoalPole_Normal.png"
};


//
// --- ELEMENTS ---
//
const titleScreen = document.getElementById("title-screen");
const introVideo = document.getElementById("intro-video");
const canvas = document.getElementById("gameCanvas");
const controls = document.getElementById("controls");
const startButton = document.getElementById("start-button");

const ctx = canvas.getContext("2d");
canvas.width = innerWidth;
canvas.height = innerHeight;


//
// --- TITLE MUSIC ---
//
let titleMusic = new Audio(ASSETS.titleMusic);
titleMusic.loop = true;
titleMusic.volume = 0.5;

titleMusic.onerror = () => {
    console.warn("No title.mp3 found — starting silent.");
};
titleMusic.play().catch(()=>{});


//
// --- START BUTTON ---
//
startButton.onclick = () => {

    titleMusic.pause();
    titleScreen.classList.add("hidden");

    introVideo.src = ASSETS.intro;
    introVideo.classList.remove("hidden");
    introVideo.play();

    introVideo.onended = () => {
        introVideo.classList.add("hidden");
        canvas.classList.remove("hidden");
        controls.classList.remove("hidden");
        startGame();
    };
};


//
// --- GAME VARIABLES ---
//

let gravity = 0.67;
let keys = {};

let player = {
    x: 100,
    y: 0,
    w: 40,
    h: 50,
    velX: 0,
    velY: 0,
    speed: 5,
    jumpPower: -15,
    jumping: false,
    facing: 1,
    form: "small" // small, big, fire
};

let qBlock = { x: 300, y: 300, hit: false };
let fireballs = [];
let goombas = [{ x: 500, y: 350, w:40, h:40, alive:true }];

let marioImg = new Image();
marioImg.src = ASSETS.marioSmall;

//
// --- CONTROLS (Keyboard + Touch Buttons) ---
//

onkeydown = e => keys[e.code] = true;
onkeyup = e => keys[e.code] = false;

document.getElementById("btnLeft").ontouchstart  = () => keys["ArrowLeft"] = true;
document.getElementById("btnLeft").ontouchend    = () => keys["ArrowLeft"] = false;

document.getElementById("btnRight").ontouchstart = () => keys["ArrowRight"] = true;
document.getElementById("btnRight").ontouchend   = () => keys["ArrowRight"] = false;

document.getElementById("btnUp").ontouchstart    = () => keys["Space"] = true;
document.getElementById("btnUp").ontouchend      = () => keys["Space"] = false;

document.getElementById("btnFire").ontouchstart  = () => shootFire();


//
// --- POWERUP CHANGES ---
//

function setForm(form) {
    player.form = form;

    if (form === "small") marioImg.src = ASSETS.marioSmall;
    if (form === "big")   marioImg.src = ASSETS.marioBig;
    if (form === "fire")  marioImg.src = ASSETS.marioFire;
}

//
// --- SHOOT FIREBALL ---
//

function shootFire() {
    if (player.form !== "fire") return;

    fireballs.push({
        x: player.x + (player.facing === 1 ? 30 : -10),
        y: player.y + 20,
        vel: player.facing === 1 ? 8 : -8
    });
}

//
// --- GAME LOOP ---
//

function update() {

    // Left/right
    if (keys["ArrowLeft"]) {
        player.velX = -player.speed;
        player.facing = -1;
    } else if (keys["ArrowRight"]) {
        player.velX = player.speed;
        player.facing = 1;
    } else {
        player.velX = 0;
    }

    // Jump
    if (keys["Space"] && !player.jumping) {
        player.velY = player.jumpPower;
        player.jumping = true;
    }

    // Gravity
    player.velY += gravity;
    player.x += player.velX;
    player.y += player.velY;

    // Ground
    if (player.y + player.h > canvas.height - 50) {
        player.y = canvas.height - 50 - player.h;
        player.velY = 0;
        player.jumping = false;
    }

    // Q BLOCK COLLISION
    if (!qBlock.hit) {
        if (
            player.x < qBlock.x + 40 &&
            player.x + player.w > qBlock.x &&
            player.y < qBlock.y + 40 &&
            player.y + player.h > qBlock.y
        ) {
            // Hit from below?
            if (player.velY < 0 && player.y > qBlock.y + 20) {
                qBlock.hit = true;
                spawnFireflower(qBlock.x, qBlock.y - 40);
            }
        }
    }

    // Fire flowers
    fireflowers?.forEach(f => {
        if (!f.collected &&
            player.x < f.x + 30 &&
            player.x + player.w > f.x &&
            player.y < f.y + 30 &&
            player.y + player.h > f.y) {
                f.collected = true;
                setForm("fire");
        }
    });

    // Goombas
    goombas.forEach(g => {
        if (!g.alive) return;

        g.x -= 1.2;

        // Fireball hit
        fireballs.forEach(f => {
            if (
                f.x < g.x + g.w &&
                f.x + 12 > g.x &&
                f.y < g.y + g.h &&
                f.y + 12 > g.y
            ) {
                g.alive = false;
            }
        });
    });

    // Update fireballs
    fireballs.forEach(f => f.x += f.vel);
}

let fireflowers = [];

function spawnFireflower(x, y) {
    fireflowers.push({
        x, y,
        collected: false,
        img: (() => {
            let i = new Image();
            i.src = ASSETS.fireFlower;
            return i;
        })()
    });
}

function draw() {
    ctx.clearRect(0,0,canvas.width,canvas.height);

    // Ground
    ctx.fillStyle = "#6bb5ff";
    ctx.fillRect(0,0,canvas.width,canvas.height);

    // Draw Q block
    if (!qBlock.hit) {
        let img = new Image();
        img.src = ASSETS.qBlock;
        ctx.drawImage(img, qBlock.x, qBlock.y, 40, 40);
    } else {
        let img = new Image();
        img.src = ASSETS.brick;
        ctx.drawImage(img, qBlock.x, qBlock.y, 40, 40);
    }

    // Fire flowers
    fireflowers.forEach(f => {
        if (!f.collected)
            ctx.drawImage(f.img, f.x, f.y, 30, 30);
    });

    // Goombas
    goombas.forEach(g => {
        if (!g.alive) return;
        let img = new Image();
        img.src = ASSETS.goomba;
        ctx.drawImage(img, g.x, g.y, g.w, g.h);
    });

    // Fireballs
    ctx.fillStyle = "orange";
    fireballs.forEach(f => {
        ctx.beginPath();
        ctx.arc(f.x, f.y, 6, 0, Math.PI*2);
        ctx.fill();
    });

    // Draw Mario (flipped for left)
    ctx.save();
    ctx.translate(player.x + (player.facing === -1 ? player.w : 0), player.y);
    ctx.scale(player.facing, 1);
    ctx.drawImage(marioImg, 0, 0, player.w, player.h);
    ctx.restore();
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

function startGame() {
    let music = new Audio(ASSETS.overworld);
    music.loop = true;
    music.volume = 0.45;
    music.play();

    loop();
}
