import assert from "node:assert/strict";
import {
  calculateScore,
  createRound,
  DIFFICULTIES,
  formatTime,
  isMatch
} from "../Games/MemoryConnect-app/src/gameLogic.js";

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
assert.ok(calculateScore({ elapsed: 10, mistakes: 0, difficulty: "easy" }) >
  calculateScore({ elapsed: 80, mistakes: 3, difficulty: "easy" }));
assert.equal(calculateScore({ elapsed: 999_999, mistakes: 999, difficulty: "hard" }), 100);

console.log("Memory Connect logic tests passed: round creation, matching, timer, and scoring.");
