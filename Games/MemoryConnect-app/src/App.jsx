import { useEffect, useMemo, useRef, useState } from "react";
import {
  calculateScore,
  createRound,
  DIFFICULTIES,
  formatTime,
  isMatch,
} from "./gameLogic";

const confettiPieces = Array.from({ length: 48 }, (_, index) => ({
  color: ["#d35c2c", "#f5a623", "#2e9a65", "#6e3aa7", "#159cba"][index % 5],
  delay: `${(index % 12) * 35}ms`,
  left: `${(index * 37) % 100}%`,
  rotation: `${(index * 47) % 360}deg`,
  size: `${7 + (index % 4) * 3}px`,
}));

const tutorialStorageKey = "memory-connect-tutorial-seen";

function ImageCard({ entry, selected, matched, onSelect, highlighted }) {
  const [failed, setFailed] = useState(false);
  const fallback = entry.symbol || entry.word;

  return (
    <button
      className={`picture-card ${selected ? "is-selected" : ""} ${matched ? "is-matched" : ""} ${highlighted ? "is-hinted" : ""}`}
      type="button"
      aria-label="Picture card"
      aria-pressed={selected}
      disabled={matched}
      onClick={onSelect}
    >
      {entry.symbol || failed || !entry.image ? (
        <span className="image-fallback" aria-hidden="true">
          {fallback}
        </span>
      ) : (
        <img src={entry.image} alt="" onError={() => setFailed(true)} />
      )}
      {matched && (
        <span className="match-mark" aria-hidden="true">
          ✓
        </span>
      )}
    </button>
  );
}

export default function App() {
  const [difficulty, setDifficulty] = useState("medium");
  const [phase, setPhase] = useState("welcome");
  const [round, setRound] = useState(() => createRound("medium"));
  const [selectedWord, setSelectedWord] = useState(null);
  const [selectedPicture, setSelectedPicture] = useState(null);
  const [matchedIds, setMatchedIds] = useState([]);
  const [mistakes, setMistakes] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [startedAt, setStartedAt] = useState(null);
  const [message, setMessage] = useState(
    "Choose a word and its matching picture.",
  );
  const [hintId, setHintId] = useState(null);
  const [result, setResult] = useState(null);
  const [bestScore, setBestScore] = useState(
    () => Number(localStorage.getItem("memory-connect-best-medium")) || 0,
  );
  const [showTutorial, setShowTutorial] = useState(
    () => localStorage.getItem(tutorialStorageKey) !== "true",
  );
  const hintTimeout = useRef(null);

  useEffect(() => {
    if (phase !== "playing" || !startedAt) return undefined;

    const timer = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    }, 250);

    return () => window.clearInterval(timer);
  }, [phase, startedAt]);

  useEffect(() => () => window.clearTimeout(hintTimeout.current), []);

  const matchedSet = useMemo(() => new Set(matchedIds), [matchedIds]);
  const pairCount = DIFFICULTIES[difficulty].pairs;

  function setRoundDifficulty(nextDifficulty) {
    setDifficulty(nextDifficulty);
    setBestScore(
      Number(localStorage.getItem(`memory-connect-best-${nextDifficulty}`)) ||
        0,
    );
  }

  function dismissTutorial() {
    localStorage.setItem(tutorialStorageKey, "true");
    setShowTutorial(false);
  }

  function startGame() {
    dismissTutorial();
    window.clearTimeout(hintTimeout.current);
    setRound(createRound(difficulty));
    setSelectedWord(null);
    setSelectedPicture(null);
    setMatchedIds([]);
    setMistakes(0);
    setElapsed(0);
    setStartedAt(Date.now());
    setHintId(null);
    setResult(null);
    setMessage("Tap a word, then tap its matching picture.");
    setPhase("playing");
  }

  function finishGame(nextMatchedIds) {
    const finalElapsed = startedAt
      ? Math.floor((Date.now() - startedAt) / 1000)
      : elapsed;
    const score = calculateScore({
      elapsed: finalElapsed,
      mistakes,
      difficulty,
    });
    const storageKey = `memory-connect-best-${difficulty}`;
    const previousBest = Number(localStorage.getItem(storageKey)) || 0;
    const isNewBest = score > previousBest;

    if (isNewBest) {
      localStorage.setItem(storageKey, String(score));
      setBestScore(score);
    }

    setElapsed(finalElapsed);
    setResult({ score, isNewBest, time: finalElapsed, mistakes });
    setStartedAt(null);
    setPhase("finished");
    setMessage("उत्तमम्! All pairs are connected.");
  }

  function tryMatch(wordId, pictureId) {
    if (!wordId || !pictureId) return;

    if (isMatch(wordId, pictureId)) {
      const nextMatchedIds = [...matchedIds, wordId];
      setMatchedIds(nextMatchedIds);
      setSelectedWord(null);
      setSelectedPicture(null);
      setHintId(null);
      setMessage("Correct match — उत्कृष्टम्!");

      if (nextMatchedIds.length === round.entries.length) {
        finishGame(nextMatchedIds);
      }
      return;
    }

    setMistakes((count) => count + 1);
    setSelectedWord(null);
    setSelectedPicture(null);
    setMessage("Not quite. Try another connection.");
  }

  function chooseWord(id) {
    if (phase !== "playing" || matchedSet.has(id)) return;
    setSelectedWord(id);
    setMessage(
      selectedPicture
        ? "Now check this connection."
        : "Now choose the matching picture.",
    );
    if (selectedPicture) tryMatch(id, selectedPicture);
  }

  function choosePicture(id) {
    if (phase !== "playing" || matchedSet.has(id)) return;
    setSelectedPicture(id);
    setMessage(
      selectedWord
        ? "Now check this connection."
        : "Now choose the matching word.",
    );
    if (selectedWord) tryMatch(selectedWord, id);
  }

  function showHint() {
    const unmatched = round.entries.filter(
      (entry) => !matchedSet.has(entry.id),
    );
    if (!unmatched.length) return;
    const entry = unmatched[Math.floor(Math.random() * unmatched.length)];
    window.clearTimeout(hintTimeout.current);
    setHintId(entry.id);
    setMessage(`Hint: find the picture for ${entry.word}.`);
    hintTimeout.current = window.setTimeout(() => setHintId(null), 1800);
  }

  function pronounce(word) {
    if (!("speechSynthesis" in window)) {
      setMessage("Pronunciation is not supported by this browser.");
      return;
    }
    window.speechSynthesis.cancel();
    const speech = new SpeechSynthesisUtterance(word);
    speech.lang = "sa-IN";
    speech.rate = 0.75;
    window.speechSynthesis.speak(speech);
  }

  return (
    <main className="game-shell">
      <header className="topbar">
        <a className="home-button" href="../../#gamesSection">
          Back
        </a>
        <div>
          <h1>Memory Connect</h1>
        </div>
      </header>

      {phase === "welcome" && (
        <section className="welcome-card" aria-labelledby="welcome-title">
          <p className="kicker">Word · Picture · Memory</p>
          <h2 id="welcome-title">Connect Sanskrit words to their pictures.</h2>
          {showTutorial && (
            <aside className="tutorial-card" aria-label="How to play">
              <strong>How to play</strong>
              <p>Choose a word, then choose its picture.</p>
              <button type="button" onClick={dismissTutorial}>
                Got it
              </button>
            </aside>
          )}
          <fieldset className="difficulty-picker">
            <legend>Choose a level</legend>
            {Object.entries(DIFFICULTIES).map(([key, option]) => (
              <button
                className={
                  difficulty === key ? "difficulty active" : "difficulty"
                }
                key={key}
                type="button"
                onClick={() => setRoundDifficulty(key)}
              >
                <strong>{option.label}</strong>
                <span>{option.pairs} pairs</span>
              </button>
            ))}
          </fieldset>
          <button className="primary-button" type="button" onClick={startGame}>
            Start game
          </button>
        </section>
      )}

      {phase !== "welcome" && (
        <>
          <section className="scoreboard" aria-label="Game status">
            <div>
              <span>Matches</span>
              <strong>
                {matchedIds.length} / {pairCount}
              </strong>
            </div>
            <div>
              <span>Mistakes</span>
              <strong>{mistakes}</strong>
            </div>
            <div>
              <span>Time</span>
              <strong>{formatTime(elapsed)}</strong>
            </div>
            <div>
              <span>Best</span>
              <strong>{bestScore || "—"}</strong>
            </div>
          </section>

          <p className="live-message" aria-live="polite">
            {message}
          </p>

          <section className="board" aria-label="Matching board">
            <div className="card-column">
              <div className="column-heading">
                <h2>Words</h2>
                <span>शब्दाः</span>
              </div>
              {round.words.map((entry) => (
                <button
                  className={`word-card ${selectedWord === entry.id ? "is-selected" : ""} ${matchedSet.has(entry.id) ? "is-matched" : ""}`}
                  key={entry.id}
                  type="button"
                  aria-pressed={selectedWord === entry.id}
                  disabled={matchedSet.has(entry.id) || phase === "finished"}
                  onClick={() => chooseWord(entry.id)}
                >
                  <span>{entry.word}</span>
                  {matchedSet.has(entry.id) && <b aria-hidden="true">✓</b>}
                </button>
              ))}
            </div>

            <div className="board-actions" aria-label="Learning tools">
              <button
                type="button"
                onClick={showHint}
                disabled={phase === "finished"}
              >
                Hint
              </button>
              <button
                type="button"
                onClick={() => {
                  const selected = round.entries.find(
                    (entry) => entry.id === selectedWord,
                  );
                  if (selected) pronounce(selected.word);
                  else setMessage("Select a word first to hear it.");
                }}
                disabled={phase === "finished"}
              >
                Hear word
              </button>
            </div>

            <div className="card-column">
              <div className="column-heading">
                <h2>Pictures</h2>
                <span>चित्राणि</span>
              </div>
              {round.pictures.map((entry) => (
                <ImageCard
                  entry={entry}
                  highlighted={hintId === entry.id}
                  key={entry.id}
                  matched={matchedSet.has(entry.id)}
                  onSelect={() => choosePicture(entry.id)}
                  selected={selectedPicture === entry.id}
                />
              ))}
            </div>
          </section>

          <div className="round-controls">
            <div
              className="compact-difficulties"
              aria-label="Change difficulty"
            >
              {Object.entries(DIFFICULTIES).map(([key, option]) => (
                <button
                  className={difficulty === key ? "active" : ""}
                  key={key}
                  type="button"
                  onClick={() => {
                    setRoundDifficulty(key);
                    setDifficulty(key);
                    setPhase("welcome");
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <button
              className="restart-button"
              type="button"
              onClick={startGame}
            >
              New round
            </button>
          </div>
        </>
      )}

      {phase === "finished" && result && (
        <section
          className="result-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="result-title"
        >
          <div className="confetti" aria-hidden="true">
            {confettiPieces.map((piece, index) => (
              <span
                key={index}
                style={{
                  "--confetti-color": piece.color,
                  "--confetti-delay": piece.delay,
                  "--confetti-left": piece.left,
                  "--confetti-rotation": piece.rotation,
                  "--confetti-size": piece.size,
                }}
              />
            ))}
          </div>
          <div className="result-card">
            <p className="kicker">Round complete</p>
            <h2 id="result-title">उत्तमम्!</h2>
            <p>You connected every pair.</p>
            <div className="result-score">{result.score}</div>
            <p>
              {formatTime(result.time)} · {result.mistakes} mistakes
            </p>
            {result.isNewBest && <p className="new-best">New personal best!</p>}
            <button
              className="primary-button"
              type="button"
              onClick={startGame}
            >
              Play another round
            </button>
          </div>
        </section>
      )}
    </main>
  );
}
