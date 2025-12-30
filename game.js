const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// RESIZE
function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener("resize", resize);
resize();

// STATES
const STATE_START = 0;
const STATE_PLAY = 1;
const STATE_WIN = 2;
let state = STATE_START;

// PLAYER
let player = {
  x: 0,
  y: 0,
  r: 15,
  vy: 0,
  jumps: 0
};

const gravity = 0.7;
const jumpStrength = -16;

// AUDIO
let audioCtx = null;
function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}
function playCrunch() {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = "square";
  osc.frequency.value = 200 + Math.random() * 400;

  gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start();
  osc.stop(audioCtx.currentTime + 0.12);
}

// PICKLES
const pickleImg = new Image();
pickleImg.src = "pickle.png";

let pickles = [];
let collected = 0;
let scrollSpeed = 3;

// CONFETTI WORDS
let confetti = [];

function createConfetti() {
  confetti = [];
  const words = ["sort", "of", "confetti", "pickle", "crunch", "yum"];
  for (let i = 0; i < 40; i++) {
    confetti.push({
      text: words[Math.floor(Math.random() * words.length)],
      x: Math.random() * canvas.width,
      y: canvas.height + Math.random() * canvas.height,
      vy: 1 + Math.random() * 2,
      size: 12 + Math.random() * 10,
      rot: Math.random() * Math.PI * 2
    });
  }
}

// CREATE PICKLES
function createPickles() {
  pickles = [];
  collected = 0;
  scrollSpeed = 3;

  const spacing = canvas.width * 0.65;
  const minY = canvas.height * 0.35;
  const maxY = canvas.height * 0.65;

  for (let i = 0; i < 10; i++) {
    pickles.push({
      x: spacing * (i + 1),
      baseY: minY + Math.random() * (maxY - minY),
      y: 0,
      bobOffset: Math.random() * Math.PI * 2,
      size: 40,
      collected: false
    });
  }

  player.x = canvas.width * 0.2;
  player.y = canvas.height * 0.7;
  player.vy = 0;
  player.jumps = 0;
}

createPickles();

// INPUT
function jump() {
  initAudio();

  if (state === STATE_START) {
    state = STATE_PLAY;
    createPickles();
    return;
  }

  if (state === STATE_WIN) return;

  if (player.jumps < 2) {
    player.vy = jumpStrength;
    player.jumps++;
  }
}

canvas.addEventListener("touchstart", jump);
canvas.addEventListener("mousedown", jump);

// UPDATE
function update() {
  if (state !== STATE_PLAY) return;

  player.vy += gravity;
  player.y += player.vy;

  const groundY = canvas.height * 0.7;
  if (player.y > groundY) {
    player.y = groundY;
    player.vy = 0;
    player.jumps = 0;
  }

  pickles.forEach(p => {
    p.x -= scrollSpeed;
    p.bobOffset += 0.05;
    p.y = p.baseY + Math.sin(p.bobOffset) * 20;
  });

  pickles.forEach(p => {
    if (!p.collected) {
      const dx = player.x - p.x;
      const dy = player.y - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < player.r + p.size / 2) {
        p.collected = true;
        collected++;
        scrollSpeed += 0.25;
        playCrunch();

        if (collected === 10) {
          state = STATE_WIN;
          createConfetti();
        }
      }
    }
  });

  if (pickles.some(p => !p.collected && p.x + p.size < 0)) {
    state = STATE_START;
  }
}

// DRAW
function draw() {
  ctx.fillStyle = "#f6b7c8";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.textAlign = "center";

  if (state === STATE_START) {
    ctx.fillStyle = "black";
    ctx.font = "28px sans-serif";
    ctx.fillText("Collect all the pickles", canvas.width / 2, canvas.height / 2 - 20);
    ctx.fillText("Tap the screen to jump", canvas.width / 2, canvas.height / 2 + 20);
    return;
  }

  if (state === STATE_WIN) {
    // CONFETTI
    ctx.fillStyle = "black";
    confetti.forEach(c => {
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(c.rot);
      ctx.font = `${c.size}px sans-serif`;
      ctx.fillText(c.text, 0, 0);
      ctx.restore();

      c.y -= c.vy;
      if (c.y < -20) c.y = canvas.height + 20;
    });

    // TEXT
    ctx.fillStyle = "black";
    ctx.font = "54px sans-serif";
    ctx.fillText("Pickletastic!", canvas.width / 2, canvas.height * 0.35);

    ctx.font = "36px sans-serif";
    ctx.fillText("CODE", canvas.width / 2, canvas.height * 0.48);

    ctx.font = "48px sans-serif";
    ctx.fillText("1 3 7", canvas.width / 2, canvas.height * 0.58);

    return;
  }

  // PLAYER
  ctx.fillStyle = "black";
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
  ctx.fill();

  // PICKLES
  pickles.forEach(p => {
    if (!p.collected) {
      ctx.drawImage(
        pickleImg,
        p.x - p.size / 2,
        p.y - p.size / 2,
        p.size,
        p.size
      );
    }
  });
}

// LOOP
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}
loop();
