import { vocabularySets } from "./gameData.js";

export const DIFFICULTIES = Object.freeze({
  easy: { label: "Easy", pairs: 4, multiplier: 1 },
  medium: { label: "Medium", pairs: 6, multiplier: 1.15 },
  hard: { label: "Hard", pairs: 8, multiplier: 1.3 }
});

export function shuffle(items, random = Math.random) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const replacementIndex = Math.floor(random() * (index + 1));
    [copy[index], copy[replacementIndex]] = [copy[replacementIndex], copy[index]];
  }
  return copy;
}

export function createRound(difficulty, random = Math.random) {
  const option = DIFFICULTIES[difficulty];
  if (!option) throw new Error(`Unknown difficulty: ${difficulty}`);

  const usableEntries = (set) => set.filter((entry) => entry.image || entry.symbol);
  const suitableSets = vocabularySets.filter((set) => usableEntries(set).length >= option.pairs);
  if (!suitableSets.length) throw new Error(`No usable ${difficulty} rounds are available.`);

  const category = suitableSets[Math.floor(random() * suitableSets.length)];
  const entries = shuffle(usableEntries(category), random).slice(0, option.pairs);

  return {
    entries,
    words: shuffle(entries, random),
    pictures: shuffle(entries, random)
  };
}

export function isMatch(wordId, pictureId) {
  return Boolean(wordId && pictureId && wordId === pictureId);
}

export function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function calculateScore({ matches, mistakes, difficulty }) {
  const option = DIFFICULTIES[difficulty];
  if (!option) throw new Error(`Unknown difficulty: ${difficulty}`);

  const correctMatches = Math.max(0, Math.floor(Number(matches) || 0));
  const wrongAnswers = Math.max(0, Math.floor(Number(mistakes) || 0));
  const pointsPerMatch = Math.round((10_000 * option.multiplier) / option.pairs);
  const mistakePenalty = Math.round(300 * option.multiplier);

  return Math.max(0, correctMatches * pointsPerMatch - wrongAnswers * mistakePenalty);
}
