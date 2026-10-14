export const MEMORY_CONNECT_GAME_ID = "memoryc";
export const MEMORY_CONNECT_GAME_NAME = "Memory Connect";

export function getScoreDate(date = new Date()) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    throw new TypeError("A valid completion date is required.");
  }

  return date.toISOString().slice(0, 10);
}

export function normalizeScore(score) {
  const value = Math.round(Number(score));

  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError("Score must be a positive number.");
  }

  return value;
}

export function getDailyScoreId(userId, scoreDate) {
  if (typeof userId !== "string" || !userId.trim()) {
    throw new TypeError("A signed-in player is required.");
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(scoreDate)) {
    throw new TypeError("Score date must use YYYY-MM-DD.");
  }

  return `${userId}_${MEMORY_CONNECT_GAME_ID}_${scoreDate}`;
}

export function createScoreData(user, score, date = new Date()) {
  if (!user?.uid) {
    throw new TypeError("A signed-in player is required.");
  }

  const scoreDate = getScoreDate(date);
  const playerName =
    user.displayName || user.email?.split("@")[0] || "Player";

  return {
    userId: user.uid,
    playerName,
    email: user.email || "",
    photoURL: user.photoURL || "",
    gameId: MEMORY_CONNECT_GAME_ID,
    gameName: MEMORY_CONNECT_GAME_NAME,
    score: normalizeScore(score),
    scoreDate,
  };
}

export function shouldReplaceDailyBest(existingScore, candidateScore) {
  const current = Number(existingScore);
  const candidate = normalizeScore(candidateScore);

  return !Number.isFinite(current) || candidate > current;
}
