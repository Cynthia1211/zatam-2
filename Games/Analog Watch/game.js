/**
 * game.js — कः समयः ZimJS Clock Game
 *
 * Uses ZimJS for the interactive analog clock canvas.
 * Two game modes:
 *   Mode 1 — Guess the Time: read the clock, pick the Sanskrit answer
 *   Mode 2 — Set the Clock: given Sanskrit text, drag the hands
 *
 * Depends on: sanskrit-time.js (SanskritTime global)
 */

/* ================================================================
   GLOBALS
   ================================================================ */
let currentMode = "guess";
let score = 0;
let total = 0;
let streak = 0;
let bestStreak = 0;
let currentQuestion = null;
let answered = false;
let frame = null;
let clockContainer = null;
let hourHand = null;
let minuteHand = null;
let feedbackTimer = null;
let stageRef = null;

function devaDigit(n) {
  return SanskritTime.toDevanagari(n);
}

/* ================================================================
   INIT ZimJS FRAME
   ================================================================ */
function initGame() {
  // Wire up HTML UI first (these don't depend on canvas)
  wireUI();
  updateRules();
  updateScoreDisplay();

  // Create the ZimJS frame in tag mode using a config object
  frame = new Frame({
    scaling: "gameCanvasWrap",
    width: 500,
    height: 500,
    color: "#fdf8f1",
    outerColor: "#fdf8f1",
    ready: onFrameReady
  });
}

function onFrameReady() {
  stageRef = frame.stage;
  
  // Style the canvas ZimJS created
  const canvas = frame.canvas;
  if (canvas) {
    canvas.style.borderRadius = "16px";
    canvas.style.display = "block";
    canvas.style.margin = "0 auto";
  }

  // Enable touch support for mobile/tablets
  createjs.Touch.enable(stageRef);

  // Add Ticker for smooth tween rendering and stage updates
  createjs.Ticker.addEventListener("tick", stageRef);

  buildClock();
  newQuestion();
}

/* ================================================================
   BUILD CLOCK
   ================================================================ */
function buildClock() {
  clockContainer = new Container(500, 500).addTo(stageRef);

  const cx = 250;
  const cy = 235;
  const R = 185;

  // Outer ring (teal)
  var outerRing = new Shape().addTo(clockContainer);
  outerRing.graphics.beginFill("#1a5c4a").drawCircle(cx, cy, R + 10).endFill();

  // Gold accent ring
  var goldRing = new Shape().addTo(clockContainer);
  goldRing.graphics.beginFill("#f4c430").drawCircle(cx, cy, R + 5).endFill();

  // Clock face
  var face = new Shape().addTo(clockContainer);
  face.graphics.beginFill("#fffef8").drawCircle(cx, cy, R).endFill();
  face.shadow = new createjs.Shadow("rgba(0,0,0,0.12)", 0, 2, 10);

  // Tick marks
  for (var i = 0; i < 60; i++) {
    var angle = (i * 6 - 90) * Math.PI / 180;
    var isHour = i % 5 === 0;
    var len = isHour ? 16 : 8;
    var w = isHour ? 3 : 1.5;
    var color = isHour ? "#1a5c4a" : "#c0c0c0";
    var outerR = R - 6;
    var innerR = outerR - len;

    var tick = new Shape().addTo(clockContainer);
    tick.graphics
      .setStrokeStyle(w, "round")
      .beginStroke(color)
      .moveTo(cx + Math.cos(angle) * outerR, cy + Math.sin(angle) * outerR)
      .lineTo(cx + Math.cos(angle) * innerR, cy + Math.sin(angle) * innerR)
      .endStroke();
  }

  // Devanagari numerals
  for (var n = 1; n <= 12; n++) {
    var ang = (n * 30 - 90) * Math.PI / 180;
    var numR = R - 38;
    var nx = cx + Math.cos(ang) * numR;
    var ny = cy + Math.sin(ang) * numR;

    var txt = new createjs.Text(devaDigit(n), "bold 26px Asap", "#1a5c4a");
    txt.textAlign = "center";
    txt.textBaseline = "middle";
    txt.x = nx;
    txt.y = ny;
    clockContainer.addChild(txt);
  }

  // "कः समयः ?" label
  var questionLabel = new createjs.Text("कः समयः ?", "bold 16px Asap", "rgba(26,92,74,0.5)");
  questionLabel.textAlign = "center";
  questionLabel.textBaseline = "middle";
  questionLabel.x = cx;
  questionLabel.y = cy + 55;
  clockContainer.addChild(questionLabel);

  // Hour hand (teal)
  hourHand = new Shape().addTo(clockContainer);
  hourHand.graphics
    .beginFill("#1a5c4a")
    .drawRoundRect(-5, -90, 10, 100, 5)
    .endFill();
  hourHand.x = cx;
  hourHand.y = cy;
  hourHand.rotation = 0;

  // Minute hand (gold)
  minuteHand = new Shape().addTo(clockContainer);
  minuteHand.graphics
    .beginFill("#d4a017")
    .drawRoundRect(-3.5, -125, 7, 135, 4)
    .endFill();
  minuteHand.x = cx;
  minuteHand.y = cy;
  minuteHand.rotation = 0;

  // Center cap
  var capOuter = new Shape().addTo(clockContainer);
  capOuter.graphics.beginFill("#1a5c4a").drawCircle(cx, cy, 12).endFill();
  var capInner = new Shape().addTo(clockContainer);
  capInner.graphics.beginFill("#f4c430").drawCircle(cx, cy, 6).endFill();
}

/* ================================================================
   SET CLOCK HANDS
   ================================================================ */
function getShortestRotation(current, target) {
  var diff = (target - current) % 360;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  return current + diff;
}

function setClockHands(hr, min, animate) {
  var hAngle = SanskritTime.hourAngle(hr, min);
  var mAngle = SanskritTime.minuteAngle(min);

  if (animate) {
    var targetHRot = getShortestRotation(hourHand.rotation, hAngle);
    var targetMRot = getShortestRotation(minuteHand.rotation, mAngle);
    createjs.Tween.get(hourHand).to({ rotation: targetHRot }, 600, createjs.Ease.backOut);
    createjs.Tween.get(minuteHand).to({ rotation: targetMRot }, 600, createjs.Ease.backOut);
  } else {
    hourHand.rotation = hAngle;
    minuteHand.rotation = mAngle;
  }
}

/* ================================================================
   DRAGGABLE HANDS (Mode 2)
   ================================================================ */
var _lastDragAngle = 0;
var _hourListeners = [];
var _minuteListeners = [];

function enableDragHands() {
  // Add hit area for easier grabbing
  var hitHour = new createjs.Shape();
  hitHour.graphics.beginFill("#000").drawRect(-20, -100, 40, 110);
  hourHand.hitArea = hitHour;

  var hitMin = new createjs.Shape();
  hitMin.graphics.beginFill("#000").drawRect(-18, -135, 36, 145);
  minuteHand.hitArea = hitMin;

  hourHand.cursor = "grab";
  minuteHand.cursor = "grab";

  _hourListeners.push(hourHand.on("mousedown", startDragHandler));
  _hourListeners.push(hourHand.on("pressmove", dragRotateHandler));
  _hourListeners.push(hourHand.on("pressup", snapHandler));

  _minuteListeners.push(minuteHand.on("mousedown", startDragHandler));
  _minuteListeners.push(minuteHand.on("pressmove", dragRotateHandler));
  _minuteListeners.push(minuteHand.on("pressup", snapHandler));
}

function disableDragHands() {
  try {
    hourHand.cursor = "default";
    minuteHand.cursor = "default";
    hourHand.hitArea = null;
    minuteHand.hitArea = null;

    _hourListeners.forEach(function(l) { hourHand.off("mousedown", l); hourHand.off("pressmove", l); hourHand.off("pressup", l); });
    _minuteListeners.forEach(function(l) { minuteHand.off("mousedown", l); minuteHand.off("pressmove", l); minuteHand.off("pressup", l); });
    _hourListeners = [];
    _minuteListeners = [];
  } catch(e) {}
}

function startDragHandler(e) {
  var hand = e.currentTarget;
  var cx = 250, cy = 235;
  var pt = stageRef.globalToLocal(e.stageX, e.stageY);
  var dx = pt.x - cx;
  var dy = pt.y - cy;
  _lastDragAngle = Math.atan2(dy, dx) * 180 / Math.PI;
}

function dragRotateHandler(e) {
  var hand = e.currentTarget;
  var cx = 250, cy = 235;
  var pt = stageRef.globalToLocal(e.stageX, e.stageY);
  var dx = pt.x - cx;
  var dy = pt.y - cy;
  var currentAngle = Math.atan2(dy, dx) * 180 / Math.PI;
  var delta = currentAngle - _lastDragAngle;
  
  if (delta > 180) delta -= 360;
  if (delta < -180) delta += 360;
  
  hand.rotation += delta;
  _lastDragAngle = currentAngle;
  stageRef.update();
}

function snapHandler(e) {
  var hand = e.currentTarget;
  var rot = ((hand.rotation % 360) + 360) % 360;

  if (hand === minuteHand) {
    var snaps = [0, 90, 180, 270];
    var closest = 0;
    var minDist = 360;
    for (var i = 0; i < snaps.length; i++) {
      var d = Math.abs(rot - snaps[i]);
      if (d > 180) d = 360 - d;
      if (d < minDist) { minDist = d; closest = snaps[i]; }
    }
    var targetRot = getShortestRotation(hand.rotation, closest);
    createjs.Tween.get(hand).to({ rotation: targetRot }, 200, createjs.Ease.backOut);
  } else {
    var snap = Math.round(rot / 7.5) * 7.5;
    var targetRot = getShortestRotation(hand.rotation, snap);
    createjs.Tween.get(hand).to({ rotation: targetRot }, 200, createjs.Ease.backOut);
  }
}

/* ================================================================
   NEW QUESTION
   ================================================================ */
function newQuestion() {
  answered = false;
  currentQuestion = SanskritTime.getRandomTime();

  if (currentMode === "guess") {
    setupGuessMode();
  } else {
    setupSetMode();
  }

  updateScoreDisplay();
  if (stageRef) stageRef.update();
}

/* ================================================================
   MODE 1: GUESS THE TIME
   ================================================================ */
function setupGuessMode() {
  setClockHands(currentQuestion.hr, currentQuestion.min, true);

  document.getElementById("sanskritPrompt").classList.remove("visible");
  document.getElementById("dragHint").classList.remove("visible");
  document.getElementById("checkRow").classList.remove("visible");
  document.getElementById("answerArea").classList.add("visible");

  var distractors = SanskritTime.getDistractors(currentQuestion.hr, currentQuestion.min, 3);
  var options = [
    { sanskrit: currentQuestion.sanskrit, en: currentQuestion.displayEN, correct: true }
  ];
  for (var i = 0; i < distractors.length; i++) {
    options.push({ sanskrit: distractors[i].sanskrit, en: distractors[i].displayEN, correct: false });
  }

  // Shuffle
  for (var i = options.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = options[i]; options[i] = options[j]; options[j] = tmp;
  }

  var grid = document.getElementById("answerGrid");
  grid.innerHTML = "";
  for (var i = 0; i < options.length; i++) {
    (function(opt) {
      var btn = document.createElement("button");
      btn.className = "answer-btn";
      btn.innerHTML = '<span class="trans-sa">' + opt.sanskrit + '</span><span class="trans-en">' + opt.sanskrit + '<br><small style="font-size: 0.8em; opacity: 0.8;">' + opt.en + '</small></span>';
      btn.setAttribute("data-correct", String(opt.correct));
      btn.addEventListener("click", function() { handleGuessAnswer(btn, opt); });
      grid.appendChild(btn);
    })(options[i]);
  }
}

function handleGuessAnswer(btn, opt) {
  if (answered) return;
  answered = true;
  total++;

  var btns = document.querySelectorAll(".answer-btn");
  for (var i = 0; i < btns.length; i++) btns[i].classList.add("disabled");

  if (opt.correct) {
    btn.classList.add("correct");
    score++;
    streak++;
    if (streak > bestStreak) bestStreak = streak;
    showFeedback(true);
  } else {
    btn.classList.add("wrong");
    streak = 0;
    for (var i = 0; i < btns.length; i++) {
      if (btns[i].getAttribute("data-correct") === "true") {
        btns[i].classList.add("correct");
      }
    }
    showFeedback(false);
  }

  updateScoreDisplay();
  setTimeout(newQuestion, 1800);
}

/* ================================================================
   MODE 2: SET THE CLOCK
   ================================================================ */
function setupSetMode() {
  var prompt = document.getElementById("sanskritPrompt");
  prompt.classList.add("visible");
  prompt.querySelector(".prompt-text").textContent = currentQuestion.sanskrit;
  prompt.querySelector(".prompt-english").textContent = currentQuestion.displayEN;

  document.getElementById("answerArea").classList.remove("visible");
  document.getElementById("dragHint").classList.add("visible");
  document.getElementById("checkRow").classList.add("visible");

  setClockHands(12, 0, true);

  setTimeout(function() {
    enableDragHands();
    if (stageRef) stageRef.update();
  }, 700);
}

function handleCheckAnswer() {
  if (answered) return;
  answered = true;
  total++;

  var hRot = ((hourHand.rotation % 360) + 360) % 360;
  var mRot = ((minuteHand.rotation % 360) + 360) % 360;
  var userTime = SanskritTime.angleToTime(hRot, mRot);

  var isCorrect = userTime.hr === currentQuestion.hr && userTime.min === currentQuestion.min;

  disableDragHands();

  if (isCorrect) {
    score++;
    streak++;
    if (streak > bestStreak) bestStreak = streak;
    showFeedback(true);
  } else {
    streak = 0;
    setClockHands(currentQuestion.hr, currentQuestion.min, true);
    showFeedback(false, currentQuestion.display + " (" + currentQuestion.displayEN + ")");
  }

  updateScoreDisplay();
  setTimeout(newQuestion, 2200);
}

/* ================================================================
   FEEDBACK
   ================================================================ */
function showFeedback(correct, detail) {
  var overlay = document.getElementById("feedbackOverlay");
  var card = overlay.querySelector(".feedback-card");
  card.querySelector(".feedback-emoji").textContent = correct ? "🎉" : "😅";
  
  var textSa = correct ? "सम्यक्!" : "पुनः प्रयत्नताम्!";
  var textEn = correct ? "Correct!" : "Try Again!";
  
  card.querySelector(".feedback-text").innerHTML = 
    '<span class="trans-sa">' + textSa + '</span>' +
    '<span class="trans-en">' + textSa + ' ' + textEn + '</span>';
    
  var detailText = "";
  if (correct) {
    detailText = currentQuestion.sanskrit;
  } else {
    if (document.body.classList.contains("hide-translation")) {
      detailText = "शुद्धसमयः : " + currentQuestion.sanskrit;
    } else {
      detailText = "Correct: " + currentQuestion.sanskrit + " (" + (detail || currentQuestion.displayEN) + ")";
    }
  }
  card.querySelector(".feedback-detail").textContent = detailText;
  card.className = "feedback-card " + (correct ? "correct" : "wrong");

  overlay.classList.add("show");

  if (correct && stageRef) spawnParticles();

  clearTimeout(feedbackTimer);
  feedbackTimer = setTimeout(function() { overlay.classList.remove("show"); }, 1500);
}

function spawnParticles() {
  var colors = ["#f4c430", "#1a5c4a", "#e87722", "#16a34a", "#f5c518"];
  for (var i = 0; i < 16; i++) {
    var size = 4 + Math.random() * 8;
    var dot = new createjs.Shape();
    dot.graphics.beginFill(colors[Math.floor(Math.random() * colors.length)])
      .drawCircle(0, 0, size).endFill();
    dot.x = 250 + (Math.random() - 0.5) * 100;
    dot.y = 235 + (Math.random() - 0.5) * 100;
    stageRef.addChild(dot);

    var tx = dot.x + (Math.random() - 0.5) * 300;
    var ty = dot.y - 100 - Math.random() * 200;

    (function(d) {
      createjs.Tween.get(d).to(
        { x: tx, y: ty, alpha: 0, scaleX: 0.2, scaleY: 0.2 },
        600 + Math.random() * 400,
        createjs.Ease.quadOut
      ).call(function() { stageRef.removeChild(d); });
    })(dot);
  }
}

/* ================================================================
   SCORE DISPLAY
   ================================================================ */
function updateScoreDisplay() {
  var el;
  el = document.getElementById("scoreValue");
  if (el) el.textContent = devaDigit(score) + " (" + score + ")";
  el = document.getElementById("totalValue");
  if (el) el.textContent = devaDigit(total) + " (" + total + ")";
  el = document.getElementById("streakValue");
  if (el) el.textContent = devaDigit(streak);
  el = document.getElementById("bestValue");
  if (el) el.textContent = devaDigit(bestStreak);
}

/* ================================================================
   UI WIRING
   ================================================================ */
function wireUI() {
  var tabs = document.querySelectorAll(".mode-tab");
  for (var i = 0; i < tabs.length; i++) {
    tabs[i].addEventListener("click", function() {
      var mode = this.getAttribute("data-mode");
      if (mode === currentMode) return;
      currentMode = mode;
      for (var j = 0; j < tabs.length; j++) tabs[j].classList.remove("active");
      this.classList.add("active");
      updateRules();
      score = 0; total = 0; streak = 0; bestStreak = 0;
      disableDragHands();
      newQuestion();
    });
  }

  document.getElementById("checkBtn").addEventListener("click", handleCheckAnswer);

  document.getElementById("skipBtn").addEventListener("click", function() {
    if (answered) return;
    total++; streak = 0;
    updateScoreDisplay();
    disableDragHands();
    newQuestion();
  });

  document.getElementById("resetBtn").addEventListener("click", function() {
    score = 0; total = 0; streak = 0; bestStreak = 0;
    disableDragHands();
    newQuestion();
  });

  // Language Toggle Button
  var langBtn = document.getElementById("langToggleBtn");
  if (langBtn) {
    langBtn.addEventListener("click", function() {
      document.body.classList.toggle("hide-translation");
      var isHidden = document.body.classList.contains("hide-translation");
      localStorage.setItem("sanskritClockHideTranslation", isHidden ? "true" : "false");
    });
    
    // Load saved preference
    var savedPref = localStorage.getItem("sanskritClockHideTranslation");
    if (savedPref === "true") {
      document.body.classList.add("hide-translation");
    } else {
      document.body.classList.remove("hide-translation");
    }
  }
}

function updateRules() {
  var rl = document.querySelector(".rules-list");
  if (currentMode === "guess") {
    rl.innerHTML =
      '<li>घटिकां पश्यतु।<span class="rule-en">Look at the clock.</span></li>' +
      '<li>संस्कृतसमयं चिनोतु।<span class="rule-en">Choose the correct Sanskrit time.</span></li>' +
      '<li>सम्यक् उत्तरे अङ्कः लभ्यते।<span class="rule-en">Score a point for each correct answer.</span></li>' +
      '<li>क्रमबद्धम् उत्तरं ददातु!<span class="rule-en">Build a streak of correct answers!</span></li>';
  } else {
    rl.innerHTML =
      '<li>संस्कृतसमयं पठतु।<span class="rule-en">Read the Sanskrit time shown.</span></li>' +
      '<li>सूचीम् आकर्षतु।<span class="rule-en">Drag the clock hands to match.</span></li>' +
      '<li>"परीक्ष्यताम्" इति नुदतु।<span class="rule-en">Press "Check" to verify your answer.</span></li>' +
      '<li>सम्यक् उत्तरे अङ्कः लभ्यते।<span class="rule-en">Score a point for each correct answer.</span></li>';
  }
}

if (document.readyState === "complete" || document.readyState === "interactive") {
  setTimeout(initGame, 1);
} else {
  window.addEventListener("DOMContentLoaded", initGame);
}
