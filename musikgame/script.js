const notesData = [
    { note: 'C', freq: 261.63 },
    { note: 'D', freq: 293.66 },
    { note: 'E', freq: 329.63 },
    { note: 'F', freq: 349.23 },
    { note: 'G', freq: 392.00 },
    { note: 'A', freq: 440.00 },
    { note: 'B', freq: 493.88 },
    { note: 'C', freq: 523.25 }
];

let currentLevel = 1;
let lives = 3;
let sequence = [];
let playerSequence = [];
let canPlay = false;

const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx;

function initAudio() {
    if (!audioCtx) audioCtx = new AudioContext();
}

// Sintesis Suara Xylophone / Glockenspiel Asli (Jernih, Pas, Tanpa Fals)
function playAuthenticXylophone(freq) {
    initAudio();
    const now = audioCtx.currentTime;

    const masterGain = audioCtx.createGain();
    masterGain.connect(audioCtx.destination);
    masterGain.gain.setValueAtTime(0.7, now);
    masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);

    // 1. Nada Utama Bilah (Pure Sine Wave agar 100% pas dan in-tune)
    const osc = audioCtx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    const gainNode = audioCtx.createGain();
    gainNode.gain.setValueAtTime(0.9, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

    osc.connect(gainNode);
    gainNode.connect(masterGain);

    // 2. Efek Ketukan Stik Kayu (Mallet Click Attack di awal suara)
    const malletOsc = audioCtx.createOscillator();
    malletOsc.type = 'triangle';
    malletOsc.frequency.setValueAtTime(freq * 2, now);
    
    const malletGain = audioCtx.createGain();
    malletGain.gain.setValueAtTime(0.12, now);
    malletGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.025);

    malletOsc.connect(malletGain);
    malletGain.connect(masterGain);

    osc.start(now);
    malletOsc.start(now);

    osc.stop(now + 0.7);
    malletOsc.stop(now + 0.03);
}

function playWrongSound() {
    initAudio();
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.setValueAtTime(95, now + 0.2);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    gain.gain.setValueAtTime(0.45, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    
    osc.start(now);
    osc.stop(now + 0.35);
}

function initLevelGrid() {
    const grid = document.getElementById('level-grid');
    grid.innerHTML = '';
    for (let i = 1; i <= 10; i++) {
        let btn = document.createElement('button');
        btn.className = 'level-btn';
        btn.innerText = i;
        btn.onclick = () => startLevel(i);
        grid.appendChild(btn);
    }
}

// Inisialisasi Xylophone untuk Challenge Mode
function initXylophone() {
    const container = document.getElementById('xylophone-container');
    container.innerHTML = '';
    notesData.forEach((item, index) => {
        let bar = document.createElement('div');
        bar.className = `xylo-bar bar-${index}`;
        bar.innerHTML = `<span class="bar-label">${item.note}</span>`;
        bar.onmousedown = () => handleBarClick(index);
        bar.ontouchstart = (e) => { e.preventDefault(); handleBarClick(index); };
        container.appendChild(bar);
    });
}

// Inisialisasi Xylophone untuk Free Play Mode
function initFreePlayXylophone() {
    const container = document.getElementById('freeplay-xylophone-container');
    container.innerHTML = '';
    notesData.forEach((item, index) => {
        let bar = document.createElement('div');
        bar.className = `xylo-bar bar-${index}`;
        bar.innerHTML = `<span class="bar-label">${item.note}</span>`;
        bar.onmousedown = () => {
            bar.classList.add('playing');
            playAuthenticXylophone(item.freq);
            setTimeout(() => bar.classList.remove('playing'), 200);
        };
        bar.ontouchstart = (e) => {
            e.preventDefault();
            bar.classList.add('playing');
            playAuthenticXylophone(item.freq);
            setTimeout(() => bar.classList.remove('playing'), 200);
        };
        container.appendChild(bar);
    });
}

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

function showMenu() {
    showScreen('menu-screen');
}

function showLevelSelect() {
    initLevelGrid();
    showScreen('level-screen');
}

function startFreePlay() {
    initAudio();
    showScreen('freeplay-screen');
    initFreePlayXylophone();
}

function startLevel(lvl) {
    initAudio();
    currentLevel = lvl;
    lives = 3;
    updateHearts();
    document.getElementById('level-display').innerText = `Level: ${currentLevel}`;
    showScreen('gameplay-screen');
    initXylophone();
    
    setTimeout(() => {
        generateSequence();
        playSequence();
    }, 600);
}

function updateHearts() {
    let hearts = '❤️'.repeat(lives) + '🖤'.repeat(3 - lives);
    document.getElementById('hearts-display').innerText = hearts;
}

function generateSequence() {
    sequence = [];
    playerSequence = [];
    for (let i = 0; i < currentLevel; i++) {
        let randIdx = Math.floor(Math.random() * notesData.length);
        sequence.push(randIdx);
    }
}

function playSequence() {
    canPlay = false;
    playerSequence = [];
    document.getElementById('instruction-banner').innerText = "Perhatikan nada yang menyala...";
    
    let i = 0;
    let interval = setInterval(() => {
        if (i < sequence.length) {
            let noteIdx = sequence[i];
            highlightAndPlayBar(noteIdx);
            i++;
        } else {
            clearInterval(interval);
            canPlay = true;
            document.getElementById('instruction-banner').innerText = "Giliranmu! Ulangi nadanya.";
        }
    }, 850);
}

function highlightAndPlayBar(index) {
    const bars = document.querySelectorAll('#gameplay-screen .xylo-bar');
    if (bars[index]) {
        bars[index].classList.add('playing');
        playAuthenticXylophone(notesData[index].freq);
        setTimeout(() => {
            bars[index].classList.remove('playing');
        }, 450);
    }
}

function handleBarClick(index) {
    if (!canPlay) return;
    
    highlightAndPlayBar(index);
    playerSequence.push(index);
    
    let currentStep = playerSequence.length - 1;
    
    if (playerSequence[currentStep] !== sequence[currentStep]) {
        canPlay = false;
        playWrongSound();
        lives--;
        updateHearts();
        
        if (lives <= 0) {
            document.getElementById('gameover-text').innerText = `Sayang sekali kamu gagal dan hanya sampai level ${currentLevel}.`;
            setTimeout(() => showScreen('gameover-screen'), 700);
        } else {
            document.getElementById('instruction-banner').innerText = "Ups, salah! Mendengarkan ulang...";
            setTimeout(() => {
                playSequence();
            }, 1300);
        }
        return;
    }
    
    if (playerSequence.length === sequence.length) {
        canPlay = false;
        if (currentLevel >= 10) {
            document.getElementById('win-text').innerText = "Luar biasa! Kamu berhasil menamatkan hingga Level 10!";
            document.getElementById('btn-next-level').style.display = 'none';
        } else {
            document.getElementById('win-text').innerText = `Hebat! Kamu Berhasil Menyelesaikan Level ${currentLevel}!`;
            document.getElementById('btn-next-level').style.display = 'inline-block';
        }
        setTimeout(() => showScreen('win-screen'), 900);
    }
}

function nextLevel() {
    if (currentLevel < 10) {
        currentLevel++;
        startLevel(currentLevel);
    } else {
        showLevelSelect();
    }
}

function restartCurrentLevel() {
    startLevel(currentLevel);
}

window.onload = () => {
    showMenu();
};