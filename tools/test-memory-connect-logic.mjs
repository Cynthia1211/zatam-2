import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  calculateScore,
  createRound,
  DIFFICULTIES,
  formatTime,
  isMatch
} from "../Games/MemoryConnect-app/src/gameLogic.js";
import {
  createScoreData,
  getDailyScoreId,
  getScoreDate,
  MEMORY_CONNECT_GAME_ID,
  MEMORY_CONNECT_GAME_NAME,
  normalizeScore,
  shouldReplaceDailyBest,
} from "../Games/MemoryConnect-app/src/leaderboardLogic.js";

const fixedRandom = () => 0.4;

for (const [difficulty, option] of Object.entries(DIFFICULTIES)) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const round = createRound(difficulty);
    const ids = round.entries.map((entry) => entry.id);

    assert.equal(round.entries.length, option.pairs, `${difficulty} has the correct pair count`);
    assert.equal(new Set(ids).size, ids.length, `${difficulty} does not repeat an answer`);
    assert.deepEqual(new Set(round.words.map((entry) => entry.id)), new Set(ids));
    assert.deepEqual(new Set(round.pictures.map((entry) => entry.id)), new Set(ids));
    assert.ok(round.entries.every((entry) => entry.image || entry.symbol));
  }
}

const fixedRound = createRound("easy", fixedRandom);
assert.ok(isMatch(fixedRound.entries[0].id, fixedRound.entries[0].id));
assert.equal(isMatch(fixedRound.entries[0].id, fixedRound.entries[1].id), false);
assert.equal(isMatch(null, fixedRound.entries[0].id), false);
assert.equal(formatTime(0), "0:00");
assert.equal(formatTime(65), "1:05");
assert.equal(calculateScore({ matches: 0, mistakes: 0, difficulty: "easy" }), 0);
assert.equal(calculateScore({ matches: 3, mistakes: 0, difficulty: "easy" }), 300);
assert.equal(calculateScore({ matches: 3, mistakes: 1, difficulty: "easy" }), 275);
assert.ok(calculateScore({ matches: 3, mistakes: 0, difficulty: "easy" }) >
  calculateScore({ matches: 2, mistakes: 0, difficulty: "easy" }));
assert.ok(calculateScore({ matches: 3, mistakes: 1, difficulty: "easy" }) <
  calculateScore({ matches: 3, mistakes: 0, difficulty: "easy" }));
assert.equal(calculateScore({ matches: 0, mistakes: 999, difficulty: "hard" }), 0);

const completionDate = new Date("2026-10-08T16:25:00.000Z");
const scoreData = createScoreData(
  {
    uid: "player-123",
    displayName: "Somya",
    email: "somya@example.com",
    photoURL: "https://example.com/avatar.png",
  },
  10456.8,
  completionDate,
);
assert.equal(getScoreDate(completionDate), "2026-10-08");
assert.equal(
  getDailyScoreId("player-123", "2026-10-08"),
  "player-123_memoryc_2026-10-08",
);
assert.equal(scoreData.gameId, MEMORY_CONNECT_GAME_ID);
assert.equal(scoreData.gameName, MEMORY_CONNECT_GAME_NAME);
assert.equal(scoreData.score, 10457);
assert.equal(shouldReplaceDailyBest(10456, 10457), true);
assert.equal(shouldReplaceDailyBest(10457, 10457), false);
assert.equal(shouldReplaceDailyBest("invalid", 10457), true);
assert.throws(() => normalizeScore(0), /positive/);
assert.throws(() => createScoreData(null, 100, completionDate), /signed-in/);

const leaderboardPage = readFileSync(
  new URL("../leaderboard.html", import.meta.url),
  "utf8",
);
const gamePage = readFileSync(
  new URL("../Games/MemoryConnect-app/src/App.jsx", import.meta.url),
  "utf8",
);
const loginPage = readFileSync(new URL("../login.html", import.meta.url), "utf8");
assert.match(leaderboardPage, /data-game="memoryc"/);
assert.match(leaderboardPage, /data-side-game="memoryc"/);
assert.match(leaderboardPage, /function keepAllTimeBestScores\(scores\)/);
assert.match(leaderboardPage, /requestedGame === "memoryc"/);
assert.match(leaderboardPage, /where\("gameId", "==", currentGameFilter\)/);
assert.match(gamePage, /<span>Score<\/span>/);
assert.match(gamePage, /View Memory Connect leaderboard/);
assert.match(loginPage, /getPostLoginDestination/);
assert.match(loginPage, /destination\.origin === window\.location\.origin/);

console.log("Memory Connect logic tests passed: rounds, matching, timer, scoring, leaderboard records, and site links.");
