let audioContext = null;
let audioBuffers = [];
let nextNoteTime = 0.0;
let currentBeat = 1;
let timerID = null;
let isPlaying = false;

const bpmInput = document.getElementById('bpmInput');
const bpmValue = document.getElementById('bpmValue');
const startBtn = document.getElementById('startBtn');
const btnIcon = document.getElementById('btnIcon');
const plusBtn = document.getElementById('plusBtn');
const minusBtn = document.getElementById('minusBtn');

// 1. ボイスファイルを読み込む
async function loadSamples() {
    for (let i = 1; i <= 4; i++) {
        // GitHub Pagesでも動くよう、パスに ./ を追加
        const response = await fetch(`./v${i}.mp3`);
        const arrayBuffer = await response.arrayBuffer();
        audioBuffers[i] = await audioContext.decodeAudioData(arrayBuffer);
    }
}

// 電子音（ピッ）を生成して鳴らす関数
function playElectronicSound(time, beatNumber) {
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();

    osc.connect(gain);
    gain.connect(audioContext.destination);

    // 1拍目だけ少し高い音にする（キッカケが分かりやすい）
    osc.frequency.value = (beatNumber === 1) ? 1000 : 800;
    
    // 音の形（短いピッという音）
    gain.gain.setValueAtTime(0.1, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.1);

    osc.start(time);
    osc.stop(time + 0.1);
}

// 2. 音を鳴らす
function scheduleNote(beatNumber, time) {
    const mode = document.querySelector('input[name="soundMode"]:checked').value;

    if (mode === 'voice') {
        // ボイスモード（150ms早めに予約）
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffers[beatNumber];
        source.connect(audioContext.destination);
        source.start(time - 0.15);
    } else {
        // 電子音モード（ジャストのタイミング）
        playElectronicSound(time, beatNumber);
    }

    // 見た目の更新
    const delay = (time - audioContext.currentTime) * 1000;
    setTimeout(() => { updateDots(beatNumber); }, delay);
}

function updateDots(beatNumber) {
    for (let i = 1; i <= 4; i++) {
        document.getElementById(`dot${i}`).classList.remove('active');
    }
    if (isPlaying) {
        document.getElementById(`dot${beatNumber}`).classList.add('active');
    }
}

function nextNote() {
    const secondsPerBeat = 60.0 / bpmInput.value;
    nextNoteTime += secondsPerBeat;
    currentBeat = (currentBeat % 4) + 1;
}

function scheduler() {
    while (nextNoteTime < audioContext.currentTime + 0.1) {
        scheduleNote(currentBeat, nextNoteTime);
        nextNote();
    }
    timerID = setTimeout(scheduler, 25.0);
}

startBtn.addEventListener('click', async () => {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        await loadSamples();
    }

    if (!isPlaying) {
        isPlaying = true;
        currentBeat = 1;
        nextNoteTime = audioContext.currentTime + 0.2;
        btnIcon.classList.add('playing');
        scheduler();
    } else {
        isPlaying = false;
        btnIcon.classList.remove('playing');
        for (let i = 1; i <= 4; i++) {
            document.getElementById(`dot${i}`).classList.remove('active');
        }
        clearTimeout(timerID);
    }
});

bpmInput.addEventListener('input', () => { bpmValue.textContent = bpmInput.value; });
plusBtn.addEventListener('click', () => { bpmInput.value++; bpmValue.textContent = bpmInput.value; });
minusBtn.addEventListener('click', () => { bpmInput.value--; bpmValue.textContent = bpmInput.value; });