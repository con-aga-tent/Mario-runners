import { startGameEngine } from "../thegame.js";

const titleScreen = document.getElementById("titleScreen");
const startBtn = document.getElementById("startBtn");
const intro = document.getElementById("levelIntro");
const canvas = document.getElementById("gameCanvas");
const controls = document.getElementById("controls");

const LEVEL_INTRO_PATH = "assets/intros/1-1.mp4";

async function playIntro() {
    intro.src = LEVEL_INTRO_PATH;
    intro.style.display = "block";

    // iOS workaround — must play muted first
    try {
        await intro.play();
    } catch (e) {
        console.warn("Video blocked. Trying again muted.");
        intro.muted = true;
        await intro.play();
    }

    return new Promise(resolve => {
        intro.onended = () => {
            intro.style.display = "none";
            resolve();
        };
    });
}

async function startGame() {
    canvas.style.display = "block";
    controls.style.display = "flex";
    await startGameEngine(canvas);
}

startBtn.addEventListener("click", async () => {
    startBtn.disabled = true;

    // hide title
    titleScreen.style.opacity = 1;
    titleScreen.style.transition = "0.4s";
    titleScreen.style.opacity = 0;

    setTimeout(async () => {
        titleScreen.style.display = "none";

        // PLAY INTRO
        await playIntro();

        // START GAME
        await startGame();

    }, 400);
});
