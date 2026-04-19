let audioContext = null;
let audioBuffers = [];
let nextNoteTime = 0.0;
let currentBeat = 1;
let timerID = null;
let isPlaying = false;

// パーツの取得
const bpmInput = document.getElementById('bpmInput');
const bpmValue = document.getElementById('bpmValue');
const volumeInput = document.getElementById('volumeInput');
const startBtn = document.getElementById('startBtn');
const btnIcon = document.getElementById('btnIcon');
const plusBtn = document.getElementById('plusBtn');
const minusBtn = document.getElementById('minusBtn');

// 1. ボイスファイルを読み込む
async function loadSamples() {
    for (let i = 1; i <= 4; i++) {
        const response = await fetch(`./v${i}.mp3`);
        const arrayBuffer = await response.arrayBuffer();
        audioBuffers[i] = await audioContext.decodeAudioData(arrayBuffer);
    }
}

// 電子音を生成して鳴らす
function playElectronicSound(time, beatNumber) {
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();

    osc.connect(gain);
    gain.connect(audioContext.destination);

    // 音量スライダーの値を反映
    const volume = parseFloat(volumeInput.value);

    osc.frequency.value = (beatNumber === 1) ? 1000 : 800;
    
    gain.gain.setValueAtTime(volume * 0.2, time); // 爆音防止のため少し抑える
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.1);

    osc.start(time);
    osc.stop(time + 0.1);
}

// 2. 音を鳴らす
function scheduleNote(beatNumber, time) {
    const mode = document.querySelector('input[name="soundMode"]:checked').value;
    const volume = parseFloat(volumeInput.value);

    if (mode === 'voice') {
        const source = audioContext.createBufferSource();
        const gainNode = audioContext.createGain(); // ボイス用音量調節
        
        source.buffer = audioBuffers[beatNumber];
        
        // 音量設定を繋ぐ
        source.connect(gainNode);
        gainNode.connect(audioContext.destination);
        gainNode.gain.value = volume;

        source.start(time - 0.15);
    } else {
        playElectronicSound(time, beatNumber);
    }

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