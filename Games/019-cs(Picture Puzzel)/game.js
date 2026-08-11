import {
  auth,
  db,
  onAuthStateChanged,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp
} from "../../firebase-config.js";

const translations = {
  en: {
    eyebrow: "LOOK · THINK · SOLVE",
    title: "Picture Puzzle",
    subtitle: "Rebuild the gurukula scene, one piece at a time.",
    difficulty: "Difficulty",
    easy: "Easy",
    medium: "Medium",
    hard: "Hard",
    time: "Time",
    moves: "Moves",
    score: "Score",
    progress: "Progress",
    choosePuzzle: "Choose puzzle",
    newGame: "New puzzle",
    hint: "Show a hint",
    preview: "Hold to preview",
    shuffle: "Shuffle pieces",
    saveHint: "Sign in to save your best score.",
    leaderboard: "View leaderboard →",
    readyTitle: "Ready to assemble?",
    readyCopy: "Drag one piece onto another to swap them.",
    start: "Start puzzle",
    boardMessage: "Drag pieces, tap two pieces, or use arrow keys and Enter.",
    placed: "placed",
    completeEyebrow: "PUZZLE COMPLETE",
    congratulations: "Congratulations!",
    playAgain: "Play again",
    saved: "Best score saved to the leaderboard.",
    saveFailed: "Score could not be saved. Please try again.",
    hintMessage: "Gold is the piece. Green is where it belongs.",
    shuffleMessage: "Pieces shuffled. Keep going!",
    selectedMessage: "Piece selected. Choose where to move it.",
    correctMessage: "Perfect placement!",
    swappedMessage: "Pieces swapped.",
    winSummary: (score, time, moves) => `${score.toLocaleString()} points · ${time} · ${moves} moves`
  },
  sa: {
    eyebrow: "पश्य · चिन्तय · पूरय",
    title: "चित्र-समस्या",
    subtitle: "गुरुकुलस्य चित्रं खण्डशः पुनर्निर्मीयताम्।",
    difficulty: "काठिन्यम्",
    easy: "सरलम्",
    medium: "मध्यमम्",
    hard: "कठिनम्",
    time: "समयः",
    moves: "चालाः",
    score: "अङ्काः",
    progress: "प्रगतिः",
    newGame: "नूतनं चित्रम्",
    hint: "सङ्केतं दर्शय",
    preview: "चित्रं पश्य",
    shuffle: "खण्डान् मिश्रय",
    saveHint: "श्रेष्ठाङ्करक्षणाय प्रवेशं कुरुत।",
    leaderboard: "श्रेष्ठसूचीं पश्य →",
    readyTitle: "आरम्भाय सज्जः?",
    readyCopy: "एकं खण्डम् अन्यस्मिन् स्थापयित्वा परिवर्तय।",
    start: "आरभस्व",
    boardMessage: "खण्डान् कर्षय, द्वौ खण्डौ स्पृश, अथवा कीबोर्डं प्रयोजय।",
    placed: "यथास्थाने",
    completeEyebrow: "चित्रं पूर्णम्",
    congratulations: "अभिनन्दनम्!",
    playAgain: "पुनः क्रीड",
    saved: "श्रेष्ठाङ्कः श्रेष्ठसूच्यां रक्षितः।",
    saveFailed: "अङ्कः रक्षितुं न शक्यते।",
    hintMessage: "सुवर्णः खण्डः, हरितं तस्य स्थानम्।",
    shuffleMessage: "खण्डाः पुनः मिश्रिताः।",
    selectedMessage: "खण्डः चितः। तस्य स्थानं चिनुत।",
    correctMessage: "समीचीनं स्थानम्!",
    swappedMessage: "खण्डौ परिवर्तितौ।",
    winSummary: (score, time, moves) => `${score.toLocaleString()} अङ्काः · ${time} · ${moves} चालाः`
  }
};

const puzzles = [
  { id: "gurukula", name: "Gurukula", src: "assets/gurukula.png" },
  { id: "acharya", name: "Acharya", src: "assets/acharya.png" },
  { id: "agni", name: "Agni", src: "assets/agni.png" },
  { id: "akasha", name: "Akasha", src: "assets/akasha.png" },
  { id: "ananda", name: "Ananda", src: "assets/ananda.png" },
  { id: "bala", name: "Bala", src: "assets/bala.png" },
  { id: "chandra", name: "Chandra", src: "assets/chandra.png" },
  { id: "chatra", name: "Chatra", src: "assets/chatra.png" },
  { id: "gaja", name: "Gaja", src: "assets/gaja.png" },
  { id: "gau", name: "Gau", src: "assets/gau.png" },
  { id: "griham", name: "Griham", src: "assets/griham.png" },
  { id: "gyanam", name: "Gyanam", src: "assets/gyanam.png" },
  { id: "jalam", name: "Jalam", src: "assets/jalam.png" },
  { id: "kala", name: "Kala", src: "assets/kala.png" },
  { id: "karuna", name: "Karuna", src: "assets/karuna.png" },
  { id: "mana", name: "Mana", src: "assets/mana.png" },
  { id: "mata", name: "Mata", src: "assets/mata.png" },
  { id: "mitram", name: "Mitram", src: "assets/mitram.png" },
  { id: "nadi", name: "Nadi", src: "assets/nadi.png" },
  { id: "pakshi", name: "Pakshi", src: "assets/pakshi.png" },
  { id: "parvata", name: "Parvata", src: "assets/parvata.png" },
  { id: "phalam", name: "Phalam", src: "assets/phalam.png" },
  { id: "pita", name: "Pita", src: "assets/pita.png" },
  { id: "prithivi", name: "Prithivi", src: "assets/prithivi.png" },
  { id: "pushpam", name: "Pushpam", src: "assets/pushpam.png" },
  { id: "pustakam", name: "Pustakam", src: "assets/pustakam.png" },
  { id: "raja", name: "Raja", src: "assets/raja.png" },
  { id: "rani", name: "Rani", src: "assets/rani.png" },
  { id: "samudra", name: "Samudra", src: "assets/samudra.png" },
  { id: "satya", name: "Satya", src: "assets/satya.png" },
  { id: "shakti", name: "Shakti", src: "assets/shakti.png" },
  { id: "surya", name: "Surya", src: "assets/surya.png" },
  { id: "swatantryam", name: "Swatantryam", src: "assets/swatantryam.png" },
  { id: "vak", name: "Vak", src: "assets/vak.png" },
  { id: "vishvam", name: "Vishvam", src: "assets/vishvam.png" },
  { id: "vriksha", name: "Vriksha", src: "assets/vriksha.png" }
];

const board = document.getElementById("puzzleBoard");
const timerEl = document.getElementById("timer");
const movesEl = document.getElementById("moves");
const scoreEl = document.getElementById("score");
const progressText = document.getElementById("progressText");
const progressBar = document.getElementById("progressBar");
const correctCountEl = document.getElementById("correctCount");
const pieceCountEl = document.getElementById("pieceCount");
const boardMessage = document.getElementById("boardMessage");
const startOverlay = document.getElementById("startOverlay");
const previewImage = document.getElementById("previewImage");
const puzzlePicker = document.getElementById("puzzlePicker");
const selectedPuzzleName = document.getElementById("selectedPuzzleName");
const winModal = document.getElementById("winModal");
const winSummary = document.getElementById("winSummary");
const saveStatus = document.getElementById("saveStatus");

let size = 4;
let order = [];
let moves = 0;
let seconds = 0;
let hintsUsed = 0;
let shufflesUsed = 0;
let running = false;
let finished = false;
let selectedIndex = null;
let focusIndex = 0;
let timerId = null;
let currentUser = null;
let scoreUploaded = false;
let language = localStorage.getItem("picturePuzzleLanguage") || "en";
let soundEnabled = localStorage.getItem("picturePuzzleSound") !== "off";
let selectedPuzzle = puzzles.find((puzzle) => puzzle.id === localStorage.getItem("picturePuzzleImage")) || puzzles[0];

function t(key) {
  return translations[language][key];
}

function shuffledOrder() {
  const values = Array.from({ length: size * size }, (_, index) => index);
  do {
    for (let index = values.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [values[index], values[swapIndex]] = [values[swapIndex], values[index]];
    }
  } while (values.every((value, index) => value === index));
  return values;
}

function buildBoard() {
  board.innerHTML = "";
  board.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
  board.style.setProperty("--puzzle-image", `url("${selectedPuzzle.src}")`);
  order.forEach((pieceId, position) => {
    const piece = document.createElement("button");
    const row = Math.floor(pieceId / size);
    const col = pieceId % size;
    piece.className = "puzzle-piece";
    piece.type = "button";
    piece.dataset.position = String(position);
    piece.dataset.piece = String(pieceId);
    piece.draggable = true;
    piece.setAttribute("role", "gridcell");
    piece.setAttribute("aria-label", `Puzzle piece ${pieceId + 1}`);
    piece.style.backgroundSize = `${size * 100}% ${size * 100}%`;
    piece.style.backgroundPosition = `${size === 1 ? 0 : (col * 100) / (size - 1)}% ${size === 1 ? 0 : (row * 100) / (size - 1)}%`;
    piece.classList.toggle("correct", pieceId === position);
    piece.classList.toggle("keyboard-focus", position === focusIndex);
    board.appendChild(piece);
  });
  updateStats();
}

function updatePuzzleAssets() {
  previewImage.src = selectedPuzzle.src;
  previewImage.alt = `${selectedPuzzle.name} completed puzzle`;
  selectedPuzzleName.textContent = selectedPuzzle.name;
  board.style.setProperty("--puzzle-image", `url("${selectedPuzzle.src}")`);
}

function renderPuzzlePicker() {
  puzzlePicker.innerHTML = "";
  puzzles.forEach((puzzle) => {
    const choice = document.createElement("button");
    const isActive = puzzle.id === selectedPuzzle.id;
    choice.className = "puzzle-choice";
    choice.type = "button";
    choice.dataset.puzzle = puzzle.id;
    choice.classList.toggle("active", isActive);
    choice.setAttribute("aria-label", `Choose ${puzzle.name} puzzle`);
    choice.setAttribute("aria-pressed", String(isActive));
    choice.innerHTML = `<img src="${puzzle.src}" alt=""><span>${puzzle.name}</span>`;
    puzzlePicker.appendChild(choice);
  });
  updatePuzzleAssets();
}

function choosePuzzle(puzzleId) {
  const nextPuzzle = puzzles.find((puzzle) => puzzle.id === puzzleId);
  if (!nextPuzzle || nextPuzzle.id === selectedPuzzle.id) return;
  selectedPuzzle = nextPuzzle;
  localStorage.setItem("picturePuzzleImage", selectedPuzzle.id);
  renderPuzzlePicker();
  newGame(false);
  boardMessage.textContent = `${selectedPuzzle.name} selected.`;
}

function updateStats() {
  const correct = order.reduce((total, piece, index) => total + Number(piece === index), 0);
  const percent = Math.round((correct / order.length) * 100);
  const score = calculateScore(false);
  movesEl.textContent = moves.toLocaleString();
  scoreEl.textContent = score.toLocaleString();
  correctCountEl.textContent = correct;
  pieceCountEl.textContent = order.length;
  progressText.textContent = `${percent}%`;
  progressBar.style.width = `${percent}%`;
}

function calculateScore(final) {
  const pieceCount = size * size;
  const correctPieces = order.reduce((total, piece, index) => total + Number(piece === index), 0);
  const difficulty = {
    3: { base: 900, piece: 70, targetMoves: 16, targetSeconds: 90, completion: 700 },
    4: { base: 1800, piece: 95, targetMoves: 42, targetSeconds: 180, completion: 1400 },
    5: { base: 3100, piece: 125, targetMoves: 82, targetSeconds: 330, completion: 2400 }
  }[size];
  const progressScore = correctPieces * difficulty.piece;
  const movePenalty = Math.max(0, moves - difficulty.targetMoves) * Math.ceil(difficulty.piece * .42);
  const timePenalty = Math.max(0, seconds - difficulty.targetSeconds) * Math.ceil(size * 2.4);
  const hintPenalty = hintsUsed * Math.ceil(difficulty.piece * 1.35);
  const shufflePenalty = shufflesUsed * Math.ceil(difficulty.piece * 2.5);
  const completionBonus = final ? difficulty.completion : 0;
  const cleanBonus = final && hintsUsed === 0 && shufflesUsed === 0 ? Math.round(difficulty.completion * .35) : 0;
  const efficientBonus = final && moves <= difficulty.targetMoves && seconds <= difficulty.targetSeconds
    ? Math.round(difficulty.completion * .25)
    : 0;
  const rawScore = difficulty.base + progressScore + completionBonus + cleanBonus + efficientBonus - movePenalty - timePenalty - hintPenalty - shufflePenalty;
  return Math.max(final ? Math.round(pieceCount * difficulty.piece * .4) : 0, rawScore);
}

function formatTime(value) {
  const minutes = Math.floor(value / 60).toString().padStart(2, "0");
  const secs = (value % 60).toString().padStart(2, "0");
  return `${minutes}:${secs}`;
}

function todayString() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function startGame() {
  if (running) return;
  running = true;
  startOverlay.hidden = true;
  timerId = window.setInterval(() => {
    seconds += 1;
    timerEl.textContent = formatTime(seconds);
  }, 1000);
  board.children[focusIndex]?.focus();
}

function newGame(autoStart = false) {
  window.clearInterval(timerId);
  order = shuffledOrder();
  moves = 0;
  seconds = 0;
  hintsUsed = 0;
  shufflesUsed = 0;
  running = false;
  finished = false;
  selectedIndex = null;
  focusIndex = 0;
  scoreUploaded = false;
  timerEl.textContent = "00:00";
  winModal.hidden = true;
  startOverlay.hidden = autoStart;
  boardMessage.textContent = t("boardMessage");
  buildBoard();
  if (autoStart) startGame();
}

function swapPieces(first, second, countMove = true) {
  if (!running || finished || first === second) return;
  [order[first], order[second]] = [order[second], order[first]];
  if (countMove) moves += 1;
  focusIndex = second;
  selectedIndex = null;
  buildBoard();
  board.children[focusIndex]?.focus();
  const correctlyPlaced = order[first] === first || order[second] === second;
  boardMessage.textContent = correctlyPlaced ? t("correctMessage") : t("swappedMessage");
  playTone(correctlyPlaced ? 620 : 410, .08);
  checkWin();
}

function selectPiece(position) {
  if (!running) startGame();
  if (selectedIndex === null) {
    selectedIndex = position;
    focusIndex = position;
    boardMessage.textContent = t("selectedMessage");
    buildBoard();
    board.children[position]?.focus();
    return;
  }
  swapPieces(selectedIndex, position);
}

function checkWin() {
  if (!order.every((piece, index) => piece === index)) return;
  finished = true;
  running = false;
  window.clearInterval(timerId);
  buildBoard();
  const finalScore = calculateScore(true);
  scoreEl.textContent = finalScore.toLocaleString();
  winSummary.textContent = t("winSummary")(finalScore, formatTime(seconds), moves);
  window.setTimeout(() => {
    winModal.hidden = false;
    playWinSound();
  }, 450);
  uploadScore(finalScore);
}

function showHint() {
  if (!running || finished) return;
  const wrongPositions = order.map((piece, index) => piece === index ? -1 : index).filter((index) => index >= 0);
  if (!wrongPositions.length) return;
  const currentPosition = wrongPositions[Math.floor(Math.random() * wrongPositions.length)];
  const destination = order[currentPosition];
  hintsUsed += 1;
  updateStats();
  boardMessage.textContent = t("hintMessage");
  const piece = board.children[currentPosition];
  const target = board.children[destination];
  piece?.classList.add("hint-piece");
  target?.classList.add("hint-target");
  window.setTimeout(() => {
    piece?.classList.remove("hint-piece");
    target?.classList.remove("hint-target");
  }, 2100);
  playTone(760, .12);
}

function shuffleRemaining() {
  if (!running || finished) return;
  const wrongPositions = order.map((piece, index) => piece === index ? -1 : index).filter((index) => index >= 0);
  if (wrongPositions.length < 2) return;
  const pieces = wrongPositions.map((position) => order[position]);
  for (let index = pieces.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [pieces[index], pieces[swapIndex]] = [pieces[swapIndex], pieces[index]];
  }
  wrongPositions.forEach((position, index) => { order[position] = pieces[index]; });
  moves += Math.max(2, Math.ceil(wrongPositions.length / size));
  shufflesUsed += 1;
  boardMessage.textContent = t("shuffleMessage");
  buildBoard();
}

function showPreview(show) {
  if (finished) return;
  previewImage.classList.toggle("visible", show);
}

function playTone(frequency, duration) {
  if (!soundEnabled) return;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  const context = new AudioContext();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(.08, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(.001, context.currentTime + duration);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + duration);
}

function playWinSound() {
  [523, 659, 784].forEach((frequency, index) => {
    window.setTimeout(() => playTone(frequency, .22), index * 130);
  });
}

async function uploadScore(finalScore) {
  if (scoreUploaded || !currentUser) return;
  scoreUploaded = true;
  try {
    const today = todayString();
    const gameId = "picturePuzzle";
    const scoreRef = doc(db, "leaderboard-zatamgame", `${currentUser.uid}_${gameId}_${today}`);
    const existing = await getDoc(scoreRef);
    const scoreData = {
      userId: currentUser.uid,
      playerName: currentUser.displayName || "Player",
      email: currentUser.email || "",
      photoURL: currentUser.photoURL || "",
      gameId,
      gameName: "Picture Puzzle",
      score: finalScore,
      scoreDate: today,
      updatedAt: serverTimestamp(),
    };

    if (!existing.exists()) {
      await setDoc(scoreRef, {
        ...scoreData,
        createdAt: serverTimestamp()
      });
      saveStatus.textContent = t("saved");
      return;
    }

    const previousBest = Number(existing.data()?.score || 0);
    if (finalScore > previousBest) {
      await updateDoc(scoreRef, scoreData);
    }
    saveStatus.textContent = t("saved");
  } catch (error) {
    scoreUploaded = false;
    saveStatus.textContent = t("saveFailed");
    console.error("Picture Puzzle score save failed:", error);
  }
}

function applyLanguage() {
  document.documentElement.lang = language === "sa" ? "sa" : "en";
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const value = t(element.dataset.i18n);
    if (typeof value === "string") element.textContent = value;
  });
  document.querySelectorAll(".lang-btn").forEach((button) => {
    button.classList.toggle("active", button.dataset.lang === language);
  });
  renderPuzzlePicker();
  boardMessage.textContent = t("boardMessage");
  if (!currentUser) saveStatus.textContent = t("saveHint");
}

puzzlePicker.addEventListener("click", (event) => {
  const choice = event.target.closest(".puzzle-choice");
  if (choice) choosePuzzle(choice.dataset.puzzle);
});

board.addEventListener("click", (event) => {
  const piece = event.target.closest(".puzzle-piece");
  if (piece) selectPiece(Number(piece.dataset.position));
});

board.addEventListener("dragstart", (event) => {
  const piece = event.target.closest(".puzzle-piece");
  if (!piece || !running) {
    event.preventDefault();
    return;
  }
  selectedIndex = Number(piece.dataset.position);
  piece.classList.add("dragging");
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", piece.dataset.position);
});

board.addEventListener("dragover", (event) => {
  const piece = event.target.closest(".puzzle-piece");
  if (!piece) return;
  event.preventDefault();
  board.querySelectorAll(".drop-target").forEach((item) => item.classList.remove("drop-target"));
  piece.classList.add("drop-target");
});

board.addEventListener("drop", (event) => {
  event.preventDefault();
  const target = event.target.closest(".puzzle-piece");
  const source = Number(event.dataTransfer.getData("text/plain"));
  if (target) swapPieces(source, Number(target.dataset.position));
});

board.addEventListener("dragend", () => {
  board.querySelectorAll(".dragging, .drop-target").forEach((piece) => piece.classList.remove("dragging", "drop-target"));
});

let pointerStart = null;
board.addEventListener("pointerdown", (event) => {
  const piece = event.target.closest(".puzzle-piece");
  if (!piece || event.pointerType === "mouse") return;
  pointerStart = Number(piece.dataset.position);
  piece.setPointerCapture(event.pointerId);
  piece.classList.add("dragging");
});

board.addEventListener("pointerup", (event) => {
  if (pointerStart === null || event.pointerType === "mouse") return;
  const target = document.elementFromPoint(event.clientX, event.clientY)?.closest(".puzzle-piece");
  board.querySelectorAll(".dragging").forEach((piece) => piece.classList.remove("dragging"));
  if (target) swapPieces(pointerStart, Number(target.dataset.position));
  pointerStart = null;
});

board.addEventListener("keydown", (event) => {
  if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Enter", " "].includes(event.key)) return;
  event.preventDefault();
  if (event.key === "Enter" || event.key === " ") {
    selectPiece(focusIndex);
    return;
  }
  const row = Math.floor(focusIndex / size);
  const col = focusIndex % size;
  if (event.key === "ArrowLeft") focusIndex = row * size + Math.max(0, col - 1);
  if (event.key === "ArrowRight") focusIndex = row * size + Math.min(size - 1, col + 1);
  if (event.key === "ArrowUp") focusIndex = Math.max(0, row - 1) * size + col;
  if (event.key === "ArrowDown") focusIndex = Math.min(size - 1, row + 1) * size + col;
  buildBoard();
  board.children[focusIndex]?.focus();
});

document.getElementById("startButton").addEventListener("click", startGame);
document.getElementById("newGameButton").addEventListener("click", () => newGame(false));
document.getElementById("hintButton").addEventListener("click", showHint);
document.getElementById("shuffleButton").addEventListener("click", shuffleRemaining);
document.getElementById("playAgainButton").addEventListener("click", () => newGame(true));

const previewButton = document.getElementById("previewButton");
["pointerdown", "focus"].forEach((name) => previewButton.addEventListener(name, () => showPreview(true)));
["pointerup", "pointerleave", "blur", "pointercancel"].forEach((name) => previewButton.addEventListener(name, () => showPreview(false)));

document.querySelectorAll(".difficulty-btn").forEach((button) => {
  button.addEventListener("click", () => {
    size = Number(button.dataset.size);
    document.querySelectorAll(".difficulty-btn").forEach((item) => item.classList.toggle("active", item === button));
    newGame(false);
  });
});

document.querySelectorAll(".lang-btn").forEach((button) => {
  button.addEventListener("click", () => {
    language = button.dataset.lang;
    localStorage.setItem("picturePuzzleLanguage", language);
    applyLanguage();
  });
});

document.getElementById("soundButton").addEventListener("click", (event) => {
  soundEnabled = !soundEnabled;
  localStorage.setItem("picturePuzzleSound", soundEnabled ? "on" : "off");
  event.currentTarget.textContent = soundEnabled ? "♪" : "×";
  event.currentTarget.setAttribute("aria-pressed", String(!soundEnabled));
  if (soundEnabled) playTone(520, .08);
});

onAuthStateChanged(auth, (user) => {
  currentUser = user;
  if (user) saveStatus.textContent = `${user.displayName || "Player"} · ${t("saveHint")}`;
});

document.getElementById("soundButton").textContent = soundEnabled ? "♪" : "×";
applyLanguage();
newGame(false);
