//----------------------------------------------------------------
//  GLOBAL SETTINGS + ASSET PATH
//----------------------------------------------------------------

const ASSET = "https://raw.githubusercontent.com/mario-runners/mario-game/main/assets/";

// Title elements
const titleScreen = document.getElementById("titleScreen");
const startButton = document.getElementById("startButton");

// Canvas + controls
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const controls = document.getElementById("controls");

canvas.width = innerWidth;
canvas.height = innerHeight;

// Music
const overworldMusic = new Audio(ASSET + "music/overworld.mp3");
overworldMusic.volume = 0.6;

let gameStarted = false;

//----------------------------------------------------------------
// START BUTTON → DESTROY TITLE → PLAY INTRO → START GAME
//----------------------------------------------------------------

startButton.onclick = () => {
    titleScreen.remove();

    const intro = document.createElement("video");
    intro.src = ASSET + "intros/1-1.mp4";
    intro.autoplay = true;
    intro.style.position = "fixed";
    intro.style.inset = "0";
    intro.style.width = "100%";
    intro.style.height = "100%";
    intro.style.objectFit = "contain";
    intro.style.zIndex = "9999";
    intro.style.background = "black";

    document.body.appendChild(intro);

    intro.onended = () => {
        intro.remove();
        setTimeout(() => startGame(), 500);
    };
};

//----------------------------------------------------------------
// GAME START
//----------------------------------------------------------------

function startGame() {
    canvas.style.display = "block";
    controls.style.display = "grid";

    overworldMusic.currentTime = 0;
    overworldMusic.loop = true;
    overworldMusic.play();

    gameStarted = true;
    gameLoop();
}

//----------------------------------------------------------------
// LOAD IMAGES
//----------------------------------------------------------------

const imgMarioSmall = new Image();
imgMarioSmall.src = ASSET + "sprites/mario/small_mario.png";

const imgMarioBig = new Image();
imgMarioBig.src = ASSET + "sprites/mario/big_mario.png";

const imgMarioFire = new Image();
imgMarioFire.src = ASSET + "sprites/mario/fire_mario.png";

const imgGround = new Image();
imgGround.src = ASSET + "sprites/blocks/ground.png";

const imgBrick = new Image();
imgBrick.src = ASSET + "sprites/blocks/brick.png";

const imgQuestion = new Image();
imgQuestion.src = ASSET + "sprites/blocks/?block.png";

const imgFireFlower = new Image();
imgFireFlower.src = ASSET + "sprites/powerups/fireflower.png";

const imgGoomba = new Image();
imgGoomba.src = ASSET + "sprites/enemies/goomba.png";

const imgKoopa = new Image();
imgKoopa.src = ASSET + "sprites/enemies/koopa.png";

const imgKoopaShell = new Image();
imgKoopaShell.src = ASSET + "sprites/enemies/koopashelled.png";

const imgGoal = new Image();
imgGoal.src = ASSET + "sprites/goal-poles/Regular_GoalPole.png";

//----------------------------------------------------------------
// PLAYER
//----------------------------------------------------------------

let player = {
    x: 100,
    y: canvas.height - 200,
    w: 40,
    h: 50,
    velX: 0,
    velY: 0,
    speed: 5,
    jumpPower: -15,
    jumping: false,
    facing: 1,
    state: "small" // small | big | fire
};

//----------------------------------------------------------------
// LEVEL GEOMETRY (GROUND + STAIRS + GOAL)
//----------------------------------------------------------------

const groundY = canvas.height - 80;
const platforms = [];

// Long ground
platforms.push({
    x: 0,
    y: groundY,
    width: 10000,
    height: 80,
    img: imgGround
});

// Staircase
const stairStartX = 9200;
const stairSteps = 8;
const stairSize = 40;

for (let i = 0; i < stairSteps; i++) {
    platforms.push({
        x: stairStartX + i * 40,
        y: groundY - (i + 1) * stairSize,
        width: 40,
        height: stairSize,
        img: imgBrick
    });
}

// Goal pole
const goalPole = {
    x: stairStartX + stairSteps * 40 + 120,
    y: groundY - 150,
    width: 40,
    height: 150
};

//----------------------------------------------------------------
// QUESTION BLOCK + FIRE FLOWER SPAWN
//----------------------------------------------------------------

let questionBlocks = [
    {
        x: 600,
        y: groundY - 160,
        hit: false
    }
];

let powerups = []; // holds fire flowers

//----------------------------------------------------------------
// ENEMIES
//----------------------------------------------------------------

let goombas = [
    { x: 1100, y: groundY - 50, w: 40, h: 50, alive: true }
];

let koopas = [
    { x: 1500, y: groundY - 50, w: 40, h: 50, mode: "walk" } // walk | shell | spin
];

let fireballs = [];

//----------------------------------------------------------------
// INPUT
//----------------------------------------------------------------

let keys = {};
onkeydown = e => keys[e.code] = true;
onkeyup = e => keys[e.code] = false;

// Mobile controls
document.getElementById("leftBtn").ontouchstart = () => keys["ArrowLeft"] = true;
document.getElementById("leftBtn").ontouchend = () => keys["ArrowLeft"] = false;

document.getElementById("rightBtn").ontouchstart = () => keys["ArrowRight"] = true;
document.getElementById("rightBtn").ontouchend = () => keys["ArrowRight"] = false;

document.getElementById("jumpBtn").ontouchstart = () => keys["Space"] = true;
document.getElementById("jumpBtn").ontouchend = () => keys["Space"] = false;

document.getElementById("fireBtn").ontouchstart = () => keys["KeyF"] = true;
document.getElementById("fireBtn").ontouchend = () => keys["KeyF"] = false;

//----------------------------------------------------------------
// FIREBALL SHOOT
//----------------------------------------------------------------

function shootFire() {
    if (player.state !== "fire") return;

    fireballs.push({
        x: player.x + (player.facing === 1 ? 30 : -10),
        y: player.y + 20,
        velX: player.facing === 1 ? 8 : -8
    });
}

//----------------------------------------------------------------
// UPDATE LOOP
//----------------------------------------------------------------

function update() {

    //------------------------------------------------------------
    // MOVEMENT
    //------------------------------------------------------------
    
    if (keys["ArrowRight"]) {
        player.velX = player.speed;
        player.facing = 1;
    }
    else if (keys["ArrowLeft"]) {
        player.velX = -player.speed;
        player.facing = -1;
    }
    else {
        player.velX = 0;
    }

    if (keys["Space"] && !player.jumping) {
        player.velY = player.jumpPower;
        player.jumping = true;
    }

    if (keys["KeyF"]) shootFire();

    player.velY += 0.6;

    player.x += player.velX;
    player.y += player.velY;

    //------------------------------------------------------------
    // COLLISION WITH PLATFORMS
    //------------------------------------------------------------

    for (let p of platforms) {
        if (
            player.x + player.w > p.x &&
            player.x < p.x + p.width &&
            player.y + player.h > p.y &&
            player.y + player.h < p.y + 40 &&
            player.velY >= 0
        ) {
            player.y = p.y - player.h;
            player.velY = 0;
            player.jumping = false;
        }
    }

    //------------------------------------------------------------
    // QUESTION BLOCKS
    //------------------------------------------------------------

    questionBlocks.forEach(q => {
        // Hit from below
        if (
            player.x + player.w > q.x &&
            player.x < q.x + 40 &&
            player.y < q.y + 40 &&
            player.y > q.y + 20 &&
            player.velY < 0 &&
            !q.hit
        ) {
            q.hit = true;

            // Spawn fire flower above block
            powerups.push({
                x: q.x,
                y: q.y - 40,
                w: 40,
                h: 40,
            });
        }
    });

    //------------------------------------------------------------
    // POWERUP PICKUP
    //------------------------------------------------------------

    powerups.forEach((p, i) => {
        if (
            player.x + player.w > p.x &&
            player.x < p.x + p.w &&
            player.y + player.h > p.y &&
            player.y < p.y + p.h
        ) {
            player.state = "fire";
            powerups.splice(i, 1);
        }
    });

    //------------------------------------------------------------
    // FIREBALL UPDATE
    //------------------------------------------------------------

    fireballs.forEach((f, i) => {
        f.x += f.velX;

        // Hit goombas
        goombas.forEach(g => {
            if (
                g.alive &&
                f.x > g.x &&
                f.x < g.x + g.w &&
                f.y > g.y &&
                f.y < g.y + g.h
            ) {
                g.alive = false;
                fireballs.splice(i, 1);
            }
        });

        // Hit koopas
        koopas.forEach(k => {
            if (
                f.x > k.x &&
                f.x < k.x + k.w &&
                f.y > k.y &&
                f.y < k.y + k.h
            ) {
                k.mode = "shell";
                fireballs.splice(i, 1);
            }
        });
    });

    //------------------------------------------------------------
    // GOOMBA
    //------------------------------------------------------------

    goombas.forEach(g => {
        if (!g.alive) return;

        g.x -= 1;

        // Stomp
        if (
            player.x + player.w > g.x &&
            player.x < g.x + g.w &&
            player.y + player.h > g.y &&
            player.y + player.h < g.y + 20 &&
            player.velY > 0
        ) {
            g.alive = false;
            player.velY = player.jumpPower / 2;
        }

        // Damage
        if (
            g.alive &&
            player.x + player.w > g.x &&
            player.x < g.x + g.w &&
            player.y + player.h > g.y &&
            player.y < g.y + g.h
        ) {
            overworldMusic.pause();
            alert("💀 You Died!");
            location.reload();
        }
    });

    //------------------------------------------------------------
    // KOOPA
    //------------------------------------------------------------

    koopas.forEach(k => {
        if (k.mode === "walk") {
            k.x -= 1;
        }

        // Stomp koopa → shell
        if (
            player.x + player.w > k.x &&
            player.x < k.x + k.w &&
            player.y + player.h > k.y &&
            player.y + player.h < k.y + 20 &&
            player.velY > 0
        ) {
            k.mode = "shell";
            player.velY = player.jumpPower / 2;
        }

        // Kick shell
        if (k.mode === "shell") {
            if (
                player.x + player.w > k.x &&
                player.x < k.x + k.w &&
                player.y + player.h > k.y &&
                player.y < k.y + k.h
            ) {
                k.mode = "spin";
                k.vel = player.facing * 8;
            }
        }

        // Spinning shell movement
        if (k.mode === "spin") {
            k.x += k.vel;

            // Shell hits enemies
            goombas.forEach(g => {
                if (
                    g.alive &&
                    g.x < k.x + k.w &&
                    g.x + g.w > k.x &&
                    g.y < k.y + k.h &&
                    g.y + g.h > k.y
                ) {
                    g.alive = false;
                }
            });
        }
    });

    //------------------------------------------------------------
    // FALL DEATH
    //------------------------------------------------------------

    if (player.y > canvas.height + 200) {
        overworldMusic.pause();
        alert("💀 You Died!");
        location.reload();
    }

    //------------------------------------------------------------
    // GOAL POLE
    //------------------------------------------------------------

    if (
        player.x + player.w > goalPole.x &&
        player.x < goalPole.x + goalPole.width &&
        player.y + player.h > goalPole.y
    ) {
        overworldMusic.pause();
        alert("🏁 Course Clear!");
        location.reload();
    }
}

//----------------------------------------------------------------
// DRAW LOOP
//----------------------------------------------------------------

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Sky
    ctx.fillStyle = "#67c1ff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Camera follow
    const camX = Math.max(0, player.x - canvas.width / 2);

    //------------------------------------------------------------
    // DRAW PLATFORMS
    //------------------------------------------------------------
    platforms.forEach(p => {
        ctx.drawImage(p.img, p.x - camX, p.y, p.width, p.height);
    });

    //------------------------------------------------------------
    // QUESTION BLOCKS
    //------------------------------------------------------------
    questionBlocks.forEach(q => {
        ctx.drawImage(q.hit ? imgBrick : imgQuestion, q.x - camX, q.y, 40, 40);
    });

    //------------------------------------------------------------
    // POWERUPS
    //------------------------------------------------------------
    powerups.forEach(p => {
        ctx.drawImage(imgFireFlower, p.x - camX, p.y, 40, 40);
    });

    //------------------------------------------------------------
    // ENEMIES
    //------------------------------------------------------------
    goombas.forEach(g => {
        if (g.alive)
            ctx.drawImage(imgGoomba, g.x - camX, g.y, g.w, g.h);
    });

    koopas.forEach(k => {
        if (k.mode === "walk")
            ctx.drawImage(imgKoopa, k.x - camX, k.y, k.w, k.h);
        else
            ctx.drawImage(imgKoopaShell, k.x - camX, k.y, k.w, k.h);
    });

    //------------------------------------------------------------
    // FIREBALLS
    //------------------------------------------------------------
    fireballs.forEach(f => {
        ctx.fillStyle = "orange";
        ctx.beginPath();
        ctx.arc(f.x - camX, f.y, 5, 0, Math.PI * 2);
        ctx.fill();
    });

    //------------------------------------------------------------
    // GOAL
    //------------------------------------------------------------
    ctx.drawImage(imgGoal, goalPole.x - camX, goalPole.y, goalPole.width, goalPole.height);

    //------------------------------------------------------------
    // PLAYER (FLIP WHEN LEFT)
    //------------------------------------------------------------

    ctx.save();
    ctx.translate(player.x - camX + (player.facing === -1 ? player.w : 0), player.y);
    ctx.scale(player.facing, 1);

    const img =
        player.state === "fire" ? imgMarioFire :
        player.state === "big" ? imgMarioBig :
        imgMarioSmall;

    ctx.drawImage(img, 0, 0, player.w, player.h);
    ctx.restore();
}

//----------------------------------------------------------------
// MAIN LOOP
//----------------------------------------------------------------

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}
