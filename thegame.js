/* ==========================================================================
   Super Mario Runners — Hybrid 1-1 (D)
   - Title screen + optional title.mp3
   - Preloader (sanitizes URLs)
   - Intro video (1-1.mp4)
   - Zoomed camera
   - Full level: blocks, q-blocks, goombas, koopas, shell kicking & revival
   - Fireflower powerup -> Fire Mario -> fireballs
   - Goal pole slide + level end
   ========================================================================== */

/* ---------- Config & Asset base ---------- */
const BASE = "https://raw.githubusercontent.com/mario-runners/mario-game/main/assets/";

// helper to clean any stray whitespace/newlines or %0A
function clean(path) {
  return String(path).replace(/\s+/g, "").replace(/%0A/g, "");
}

/* assets list (images, audio, video) */
const ASSET_LIST = {
  images: {
    titleImg: BASE + "sprites/title.png",
    cloud: BASE + "sprites/bg/cloud.png",
    mario_small: BASE + "sprites/mario/small_mario.png",
    mario_big: BASE + "sprites/mario/big_mario.png",
    mario_fire: BASE + "sprites/mario/fire_mario.png",
    qblock: BASE + "sprites/blocks/%3Fblock.png", // encoded ?
    brick: BASE + "sprites/blocks/brick.png",
    ground: BASE + "sprites/blocks/ground.png",
    goomba: BASE + "sprites/enemies/goomba.png",
    koopa: BASE + "sprites/enemies/koopa.png",
    koopa_shell: BASE + "sprites/enemies/koopashelled.png",
    fireflower: BASE + "sprites/powerups/fireflower.png",
    mushroom: BASE + "sprites/powerups/mushroom.png",
    flag: BASE + "sprites/goal-poles/GoalPole_Normal.png"
  },
  audio: {
    title: BASE + "music/title.mp3",
    overworld: BASE + "music/overworld.mp3"
  },
  video: {
    intro: BASE + "intros/1-1.mp4"
  }
};

/* ---------- DOM ---------- */
const titleScreen = document.getElementById("titleScreen");
const startBtn = document.getElementById("startBtn");
const preloaderEl = document.getElementById("preloader");
const loaderText = document.getElementById("loaderText");
const loaderProgress = document.getElementById("loaderProgress");
const introVideo = document.getElementById("introVideo");
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const controls = document.getElementById("controls");
const muteBtn = document.getElementById("muteBtn");

/* responsive canvas */
function resizeCanvas(){
  canvas.width = innerWidth;
  canvas.height = innerHeight;
}
resizeCanvas();
addEventListener("resize", resizeCanvas);

/* ---------- Preloader ---------- */
let IMGS = {}, AUDS = {}, VIDEO_EL = null;
async function preloadAll(){
  preloaderEl.classList.remove("hidden");
  // list counts
  const images = ASSET_LIST.images;
  const audios = ASSET_LIST.audio;
  const videos = ASSET_LIST.video;
  const total = Object.keys(images).length + Object.keys(audios).length + Object.keys(videos).length;
  let done = 0;
  function progress(){
    done++;
    const pct = Math.round((done/total)*100);
    loaderText.textContent = `Loading assets... ${pct}%`;
    loaderProgress.style.width = pct + "%";
    if(done >= total) {
      setTimeout(()=>preloaderEl.classList.add("hidden"), 250);
    }
  }

  // load images
  await Promise.all(Object.entries(images).map(([k, p]) => new Promise(res=>{
    const img = new Image();
    img.onload = () => { IMGS[k] = img; progress(); res(); };
    img.onerror = () => { console.warn("Image failed:", k, p); IMGS[k] = null; progress(); res(); };
    img.src = clean(p);
  })));

  // load audio
  await Promise.all(Object.entries(audios).map(([k,p]) => new Promise(res=>{
    const a = new Audio();
    a.preload = "auto";
    a.oncanplaythrough = () => { AUDS[k] = a; progress(); res(); };
    a.onerror = () => { console.warn("Audio failed:", k, p); AUDS[k] = null; progress(); res(); };
    a.src = clean(p);
  })));

  // load video element (only metadata to be ready)
  await Promise.all(Object.entries(videos).map(([k,p]) => new Promise(res=>{
    const v = document.createElement("video");
    v.preload = "metadata";
    v.onloadeddata = () => { VIDEO_EL = v; progress(); res(); };
    v.onerror = () => { console.warn("Video failed:", k, p); VIDEO_EL = null; progress(); res(); };
    v.src = clean(p);
  })));

  return { IMGS, AUDS, VIDEO_EL };
}

/* ---------- Title / Start flow ---------- */
let audioTitle = null;
let audioOver = null;
(async function initPreload(){
  // preload but allow title screen visible immediately
  const pre = preloadAll(); // start preloading async
  // set title music if exists (play later when ready)
  // we don't wait for full preload to show title screen
  (await pre).AUDS && (audioTitle = (await pre).AUDS.title || null);
  (await pre).AUDS && (audioOver = (await pre).AUDS.overworld || null);
})();

// show title music if available when preloader finishes
// start button triggers intro -> game
startBtn.addEventListener("click", async()=>{
  // if title audio is loaded, play it (if not already)
  if(audioTitle && audioTitle.paused) {
    try { audioTitle.loop = true; audioTitle.volume = 0.9; await audioTitle.play(); } catch(e){}
  }
  // hide title immediately, show preloader until assets finish
  titleScreen.classList.add("hidden");
  // wait for full assets
  const loaded = await preloadAll();
  // play title music if present
  if(loaded.AUDS && loaded.AUDS.title){
    audioTitle = loaded.AUDS.title;
    try{ audioTitle.loop = true; audioTitle.volume = 0.9; audioTitle.play().catch(()=>{}); } catch(e){}
  }
  // play intro video if available, else skip
  if(loaded.VIDEO_EL){
    introVideo.src = clean(ASSET_LIST.video.intro);
    introVideo.classList.remove("hidden");
    try{ await introVideo.play(); } catch(e){ /* autoplay blocked - wait for user gesture*/ }
    introVideo.onended = () => {
      introVideo.classList.add("hidden");
      beginGame(loaded);
    };
  } else {
    // no intro -> start game now
    beginGame(loaded);
  }
});

/* ---------- Game constants & level generation (Hybrid D) ---------- */
const GRAV = 0.7;
let camera = { x: 0, y: 0, zoom: 1.5 }; // zoom 1.5 = smaller FOV (bigger world)
let player = null;
let platforms = [], qblocks = [], bricks = [], goombas = [], koopas = [], shells = [], fireflowers = [], fireballs = [];
let goalPole = null;
let shellCombo = 0; // hits counted by shell
let oneUpSpawns = []; // placeholder 1up pickups

/* create a classic-feel 1-1 hybrid level */
function generateLevel(){
  platforms = [];
  qblocks = []; bricks = []; goombas = []; koopas = []; shells = []; fireflowers = []; fireballs = []; oneUpSpawns = [];

  const groundY = canvas.height - 120;
  // ground tiles will be drawn procedurally (not stored explicitly)
  // place q-blocks and bricks
  qblocks.push({ x: 600, y: groundY - 160, used:false, contains:"fireflower" });
  qblocks.push({ x: 900, y: groundY - 160, used:false, contains:"coin" });
  qblocks.push({ x: 1300, y: groundY - 160, used:false, contains:"fireflower" });
  // bricks clusters
  bricks.push({ x: 760, y: groundY - 160 });
  bricks.push({ x: 800, y: groundY - 200 });
  bricks.push({ x: 840, y: groundY - 160 });

  // staircases + pits
  // staircase near 3000
  for(let i=0;i<6;i++){
    platforms.push({ x: 3000 + i*48, y: groundY - i*48, w: 48, h: 48, type:"brick" });
  }
  // pits: create gaps by leaving ground unrendered at those x intervals (we will skip drawing there)
  // goombas spread
  goombas.push({ x: 1100, y: groundY - 48, w:40, h:40, vx:-0.9, alive:true });
  goombas.push({ x: 1700, y: groundY - 48, w:40, h:40, vx:-1.0, alive:true });
  goombas.push({ x: 2500, y: groundY - 48, w:40, h:40, vx:-1.0, alive:true });
  goombas.push({ x: 3400, y: groundY - 48, w:40, h:40, vx:-1.2, alive:true });

  // Koopas - walking
  koopas.push({ x: 2100, y: groundY - 48, w:40, h:48, vx:-1.0, state:"walking", reviveTimer:0 });
  koopas.push({ x: 3200, y: groundY - 48, w:40, h:48, vx:1.0, state:"walking", reviveTimer:0 });

  // shelled koopas placeholders (empty until stomped)
  shells = [];

  // goal pole (closer - around x=4200)
  goalPole = { x: 4200, y: groundY - 240, w: 40, h: 240 };

  // player spawn
  player = {
    x: 120,
    y: groundY - 48,
    w: 40, h: 48,
    vx: 0, vy: 0,
    speed: 5, jumpPower: -15, jumping:false,
    facingRight: true, form: "small", inv:0
  };
}

/* ---------- collision helpers ---------- */
function rects(a,b){
  return a.x < b.x + (b.w||b.width||b.w||0) && a.x + a.w > b.x && a.y < b.y + (b.h||b.height||b.h||0) && a.y + a.h > b.y;
}

/* ---------- Draw helpers with camera zoom ---------- */
function worldToScreenX(x){ return (x - camera.x) * camera.zoom; }
function worldToScreenY(y){ return (y - camera.y) * camera.zoom; }
function drawImage(img, x, y, w, h){
  if(!img) return;
  ctx.drawImage(img, worldToScreenX(x), worldToScreenY(y), w*camera.zoom, h*camera.zoom);
}

/* ---------- Game Start (after intro) ---------- */
async function beginGame(loadedAssets){
  // use preloaded images & audios if available
  const IMG = loadedAssets.IMGS || IMGS || {};
  const AUD = loadedAssets.AUDS || AUDS || {};
  // prefer preloaded auds
  if(loadedAssets.AUDS && loadedAssets.AUDS.overworld) {
    audioOver = loadedAssets.AUDS.overworld;
  } else {
    audioOver = new Audio(clean(ASSET_LIST.audio ? ASSET_LIST.audio?.overworld : (BASE+"music/overworld.mp3")));
  }

  try{ audioOver.loop = true; audioOver.volume = 0.5; audioOver.play().catch(()=>{}); } catch(e){}

  generateLevel();

  // wire up controls & visuals
  controls.classList.remove("hidden");
  document.getElementById("muteBtn").classList.remove("hidden");

  // Input mapping (keyboard + touch)
  const keys = { ArrowLeft:false, ArrowRight:false, Space:false, KeyX:false };
  addEventListener("keydown", e => { if(keys[e.code]!==undefined) keys[e.code]=true; });
  addEventListener("keyup", e => { if(keys[e.code]!==undefined) keys[e.code]=false; });

  // touch
  document.getElementById("btnLeft").ontouchstart  = ()=> keys.ArrowLeft = true;
  document.getElementById("btnLeft").ontouchend    = ()=> keys.ArrowLeft = false;
  document.getElementById("btnRight").ontouchstart = ()=> keys.ArrowRight = true;
  document.getElementById("btnRight").ontouchend   = ()=> keys.ArrowRight = false;
  document.getElementById("btnUp").ontouchstart    = ()=> keys.Space = true;
  document.getElementById("btnUp").ontouchend      = ()=> keys.Space = false;
  document.getElementById("btnFire").ontouchstart  = ()=> keys.KeyX = true;
  document.getElementById("btnFire").ontouchend    = ()=> keys.KeyX = false;

  // mouse fallback for desktop buttons
  document.getElementById("btnLeft").onmousedown = ()=> keys.ArrowLeft = true;
  document.getElementById("btnLeft").onmouseup   = ()=> keys.ArrowLeft = false;
  document.getElementById("btnRight").onmousedown= ()=> keys.ArrowRight = true;
  document.getElementById("btnRight").onmouseup  = ()=> keys.ArrowRight = false;
  document.getElementById("btnUp").onmousedown   = ()=> keys.Space = true;
  document.getElementById("btnUp").onmouseup     = ()=> keys.Space = false;
  document.getElementById("btnFire").onmousedown = ()=> keys.KeyX = true;
  document.getElementById("btnFire").onmouseup   = ()=> keys.KeyX = false;

  // mute
  let muted=false;
  muteBtn.onclick = ()=>{
    muted = !muted; audioOver.muted = muted; if(audioTitle) audioTitle.muted = muted;
    muteBtn.textContent = muted ? "🔇" : "🔊";
  };

  // game loop
  let last = performance.now();
  function step(now){
    const dt = Math.min(40,(now-last));
    last = now;
    update(dt/16, keys);
    render();
    requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

/* ---------- Update logic ---------- */
function update(dt, keys){
  // dt ~ 1 per 16ms
  // player movement
  if(keys.ArrowLeft){ player.vx = -player.speed; player.facingRight = false; }
  else if(keys.ArrowRight){ player.vx = player.speed; player.facingRight = true; }
  else player.vx = 0;

  if(keys.Space && !player.jumping){ player.vy = player.jumpPower; player.jumping = true; }

  // shooting
  if(keys.KeyX && player.form === "fire"){ spawnFireball(player.facingRight ? 1 : -1); keys.KeyX = false; }

  // physics
  player.vy += GRAV * (dt);
  player.x += player.vx * dt;
  player.y += player.vy * dt;

  // simple ground collision
  const groundY = canvas.height - 120;
  if(player.y + player.h > groundY){ player.y = groundY - player.h; player.vy = 0; player.jumping = false; }

  // camera centers on player
  camera.x = player.x - (canvas.width / (2*camera.zoom));
  camera.y = 0;

  // q-block collisions (head bump)
  qblocks.forEach(q=>{
    const headHit = (player.x + player.w > q.x && player.x < q.x + 40 &&
      player.y < q.y + 40 && player.y + player.h > q.y && player.vy < 0);
    if(!q.used && headHit && player.y > q.y + 10){
      // hit from below
      q.used = true;
      player.vy = 2; // bounce down a bit
      if(q.contains === "fireflower"){
        fireflowers.push({ x:q.x, y:q.y - 36, vy:-2, state:"rising", collected:false });
      } else if(q.contains === "coin"){
        // coins (for now, just console)
        console.log("coin popped!");
      }
    }
  });

  // animate fireflowers rising and pickup
  fireflowers.forEach(f=>{
    if(f.state === "rising"){
      f.y += f.vy;
      if(f.y <= f.y - 32) f.state="resting";
    }
    if(!f.collected && rects({x:player.x,y:player.y,w:player.w,h:player.h}, {x:f.x,y:f.y,w:28,h:28})){
      f.collected = true; player.form = "fire"; player.canShoot = true;
      console.log("Fire Mario!");
    }
  });

  // Goombas movement & collisions with player
  goombas.forEach(g=>{
    if(!g.alive) return;
    g.x += g.vx * dt;
    // simple bounds reverse
    if(g.x < 200) g.vx = Math.abs(g.vx);
    if(g.x > 3800) g.vx = -Math.abs(g.vx);

    // collision
    if(rects(player, g) && g.alive){
      if(player.vy > 0 && (player.y + player.h - g.y) < 18){
        // stomp
        g.alive = false;
        player.vy = player.jumpPower/1.6;
      } else {
        // hit player
        hurtPlayer();
      }
    }
  });

  // Koopas logic (walking, shelled, shellMoving, revive)
  koopas.forEach(k=>{
    if(k.state === "walking"){
      k.x += k.vx * dt;
      // bounds
      if(k.x < 200) k.vx = Math.abs(k.vx);
      if(k.x > 3800) k.vx = -Math.abs(k.vx);
      // stomp detection
      if(rects(player, k)){
        if(player.vy > 0 && (player.y + player.h - k.y) < 20){
          // stomp -> turn to shell
          k.state = "shelled";
          k.reviveTimer = 0;
          k.vx = 0;
        } else {
          // touch -> hurt
          hurtPlayer();
        }
      }
    } else if(k.state === "shelled"){
      // stationary until kicked or revive
      k.reviveTimer += 1;
      if(rects(player, k)){
        // kick
        k.state = "shellMoving";
        k.vx = player.facingRight ? 8 : -8;
        shellCombo = 0; // start combination
      }
      // revive after between 12s to 25s (approx frames)
      if(k.reviveTimer > (12*60) && Math.random() < 0.01) { k.state="walking"; k.vx = (Math.random()>0.5?1:-1); }
    } else if(k.state === "shellMoving"){
      k.x += k.vx * dt;
      // shell hits other enemies
      goombas.forEach(g=>{
        if(g.alive && rects(k,g)){
          g.alive = false;
          shellCombo++;
          if(shellCombo % 8 === 0){ spawn1Up(g.x, g.y); }
        }
      });
      // shells hit koopas
      koopas.forEach(k2=>{ if(k2 !== k && k2.state !== "shelled" && rects(k,k2)){
        k2.state = "dead";
        shellCombo++;
        if(shellCombo % 8 === 0) spawn1Up(k2.x, k2.y);
      }});
      // friction / bounds
      if(k.x < 0 || k.x > 9000) k.vx *= -1;
    }
  });

  // update shells array (not needed if koopas used directly)

  // fireballs movement & collisions
  fireballs.forEach((fb, i)=>{
    fb.x += fb.vx * dt;
    fb.y += fb.vy * dt;
    fb.vy += 0.25 * dt;
    // bounce on ground
    if(fb.y > canvas.height - 130){ fb.y = canvas.height - 130; fb.vy = -8 * dt; }
    // check collision with goombas/koopas
    goombas.forEach(g=>{ if(g.alive && rects({x:fb.x,y:fb.y,w:12,h:12}, g)){ g.alive=false; fb.hit=true; }});
    koopas.forEach(k=>{ if(k.state !== "dead" && rects({x:fb.x,y:fb.y,w:12,h:12}, k)){ k.state = "shelled"; k.reviveTimer=0; fb.hit=true; }});
    if(fb.x < camera.x - 200 || fb.x > camera.x + canvas.width + 200 || fb.hit) fireballs.splice(i,1);
  });

  // goal detection
  if(rects(player, goalPole)){
    // begin slide down (disable input)
    beginFlagSlide();
  }

  // invincibility frames
  if(player.inv && player.inv>0) player.inv--;
}

/* ---------- helper: hurt player ---------- */
function hurtPlayer(){
  if(player.inv && player.inv>0) return;
  if(player.form === "fire"){ player.form="big"; player.inv = 60; console.log("Lost fire -> big"); return; }
  if(player.form === "big"){ player.form="small"; player.inv = 60; console.log("Lost big -> small"); return; }
  // else die -> restart
  console.log("Player died"); location.reload();
}

/* ---------- spawn fireball ---------- */
function spawnFireball(dir){
  if(player.form !== "fire") return;
  fireballs.push({ x: player.x + (dir>0?player.w: -10), y: player.y + 20, vx: 8 * dir, vy:-2 });
}

/* ---------- spawn 1-up (placeholder) ---------- */
function spawn1Up(x,y){
  console.log("1-UP spawn at",x,y);
  oneUpSpawns.push({ x,y,time:180 });
}

/* ---------- flag slide ---------- */
let sliding = false;
function beginFlagSlide(){
  if(sliding) return;
  sliding = true;
  player.vx = 0; player.vy = 0;
  // lock player to pole x
  player.x = goalPole.x - 8;
  // slide down animation (simple)
  const slideInterval = setInterval(()=>{
    player.y += 4;
    if(player.y + player.h >= canvas.height - 120){
      clearInterval(slideInterval);
      setTimeout(()=>{ fadeOutAndEnd(); }, 600);
    }
  }, 16);
}

/* ---------- fade out / end level ---------- */
function fadeOutAndEnd(){
  let alpha = 0;
  const fade = setInterval(()=>{
    alpha += 0.03;
    ctx.fillStyle = `rgba(0,0,0,${alpha})`;
    ctx.fillRect(0,0,canvas.width,canvas.height);
    if(alpha >= 1){ clearInterval(fade); alert("✅ Level Complete!"); location.reload(); }
  }, 30);
}

/* ---------- Rendering ---------- */
function render(){
  // clear
  ctx.clearRect(0,0,canvas.width,canvas.height);
  // apply camera zoom transform
  ctx.save();
  ctx.scale(camera.zoom, camera.zoom);
  ctx.translate(-camera.x, -camera.y);

  // sky (simple fill)
  ctx.fillStyle = "#6bb5ff";
  ctx.fillRect(camera.x, camera.y, canvas.width/camera.zoom, canvas.height/camera.zoom);

  // draw clouds tiled
  const cloud = IMGS && IMGS.cloud ? IMGS.cloud : null;
  for(let cx = -200; cx < 9000; cx += 600){
    if(cloud) ctx.drawImage(cloud, cx, 60, 200, 80);
  }

  // ground tiles (draw wide)
  if(IMGS && IMGS.ground){
    const groundY = canvas.height - 120;
    for(let x = 0; x < 9000; x += 64){
      ctx.drawImage(IMGS.ground, x, groundY, 64, 64);
    }
  } else {
    // fallback ground rect
    ctx.fillStyle = "#8a5a2b";
    ctx.fillRect(0, canvas.height - 120, 9000, 120);
  }

  // draw qblocks & bricks
  qblocks.forEach(q=>{
    const img = (q.used && IMGS && IMGS.brick) ? IMGS.brick : (IMGS && IMGS.qblock ? IMGS.qblock : null);
    if(img) ctx.drawImage(img, q.x, q.y, 40, 40);
  });
  bricks.forEach(b=>{
    const img = IMGS && IMGS.brick ? IMGS.brick : null;
    if(img) ctx.drawImage(img, b.x, b.y, 40, 40);
  });

  // platforms (stair bricks)
  platforms.forEach(p => {
    const img = IMGS && IMGS.brick ? IMGS.brick : null;
    if(img) ctx.drawImage(img, p.x, p.y, p.w, p.h);
  });

  // fireflowers
  fireflowers.forEach(f => {
    if(!f.collected){
      const img = IMGS && IMGS.fireflower ? IMGS.fireflower : null;
      if(img) ctx.drawImage(img, f.x, f.y, 28, 28);
    }
  });

  // goombas
  goombas.forEach(g=>{
    if(g.alive){
      const img = IMGS && IMGS.goomba ? IMGS.goomba : null;
      if(img) ctx.drawImage(img, g.x, g.y, g.w, g.h);
    }
  });

  // koopas
  koopas.forEach(k=>{
    if(k.state === "walking"){
      const img = IMGS && IMGS.koopa ? IMGS.koopa : null;
      if(img) ctx.drawImage(img, k.x, k.y, k.w, k.h);
    } else if(k.state === "shelled" || k.state === "shellMoving"){
      const img = IMGS && IMGS.koopa_shell ? IMGS.koopa_shell : null;
      if(img) ctx.drawImage(img, k.x, k.y, k.w, k.h);
    }
  });

  // shells (explicit list, not used for this implementation)
  shells.forEach(s => {
    const img = IMGS && IMGS.koopa_shell ? IMGS.koopa_shell : null;
    if(img) ctx.drawImage(img, s.x, s.y, s.w, s.h);
  });

  // fireballs
  ctx.fillStyle = "orange";
  fireballs.forEach(f => {
    ctx.beginPath();
    ctx.arc(f.x, f.y, 6, 0, Math.PI*2);
    ctx.fill();
  });

  // player sprite (handle flip)
  let pimg = (player.form === "fire") ? (IMGS && IMGS.mario_fire) : (player.form === "big" ? (IMGS && IMGS.mario_big) : (IMGS && IMGS.mario_small));
  ctx.save();
  if(!pimg){
    ctx.fillStyle = "red";
    ctx.fillRect(player.x, player.y, player.w, player.h);
  } else {
    if(!player.facingRight){
      ctx.translate(player.x + player.w, player.y);
      ctx.scale(-1,1);
      ctx.drawImage(pimg, 0, 0, player.w, player.h);
    } else {
      ctx.drawImage(pimg, player.x, player.y, player.w, player.h);
    }
  }
  ctx.restore();

  // goal pole
  if(IMGS && IMGS.flag) ctx.drawImage(IMGS.flag, goalPole.x, goalPole.y, goalPole.w, goalPole.h);

  // restore transform
  ctx.restore();

  // draw HUD (scale independent)
  ctx.save();
  ctx.fillStyle = "#fff";
  ctx.font = "16px sans-serif";
  ctx.fillText(`Shell combo: ${shellCombo}`, 16, 26);
  ctx.restore();
}

/* ---------- small helpers ---------- */
function rects(a,b){
  return a.x < b.x + (b.w||b.width||0) && a.x + a.w > b.x && a.y < b.y + (b.h||b.height||0) && a.y + a.h > b.y;
}

/* ---------- 1-time global IMGS/AUD set (for render) ---------- */
let IMGS = {}; let AUDS = {}; let VIDEO = null;
/* Preload once more into IMGS for render usage at start */
(async function finalPreload(){
  // we reuse earlier preloadAll but ensure IMGS are available synchronously for render
  const imgKeys = ASSET_LIST.images;
  for(const k in imgKeys){
    const i = new Image();
    i.src = clean(imgKeys[k]);
    i.onload = ()=>{};
    IMGS[k] = i;
  }
})();

/* NOTE: This file uses some placeholders (console logs) for coin counts and 1up spawn.
   You can replace console messages with actual sprites/sounds easily. */


    loop();
}
