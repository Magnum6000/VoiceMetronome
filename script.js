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

// 1. 音声ファイルを読み込む
async function loadSamples() {
    for (let i = 1; i <= 4; i++) {
        const response = await fetch(`v${i}.mp3`);
        const arrayBuffer = await response.arrayBuffer();
        audioBuffers[i] = await audioContext.decodeAudioData(arrayBuffer);
    }
}

// 2. 音を鳴らす & 見た目を光らせる
function scheduleNote(beatNumber, time) {
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffers[beatNumber];
    source.connect(audioContext.destination);

    // 150ms早めに予約再生
    const offset = 0.15; 
    source.start(time - offset);

    // 見た目の更新を予約（音のタイミングに合わせる）
    const delay = (time - audioContext.currentTime) * 1000;
    setTimeout(() => {
        updateDots(beatNumber);
    }, delay);
}

// 丸の色を更新する関数
function updateDots(beatNumber) {
    // 一旦全部の色を消す
    for (let i = 1; i <= 4; i++) {
        document.getElementById(`dot${i}`).classList.remove('active');
    }
    // 今の拍だけ色をつける
    if (isPlaying) {
        document.getElementById(`dot${beatNumber}`).classList.add('active');
    }
}

// 3. 次の拍の計算
function nextNote() {
    const secondsPerBeat = 60.0 / bpmInput.value;
    nextNoteTime += secondsPerBeat;
    currentBeat = (currentBeat % 4) + 1;
}

// 4. ループ処理
function scheduler() {
    while (nextNoteTime < audioContext.currentTime + 0.1) {
        scheduleNote(currentBeat, nextNoteTime);
        nextNote();
    }
    timerID = setTimeout(scheduler, 25.0);
}

// 5. イベント
startBtn.addEventListener('click', async () => {
    if (!audioContext) {
        audioContext = new AudioContext();
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
        // 全部消す
        for (let i = 1; i <= 4; i++) {
            document.getElementById(`dot${i}`).classList.remove('active');
        }
        clearTimeout(timerID);
    }
});

bpmInput.addEventListener('input', () => { bpmValue.textContent = bpmInput.value; });
plusBtn.addEventListener('click', () => { bpmInput.value++; bpmValue.textContent = bpmInput.value; });
minusBtn.addEventListener('click', () => { bpmInput.value--; bpmValue.textContent = bpmInput.value; });