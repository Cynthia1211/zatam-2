import {
  createScoreData,
  getDailyScoreId,
  shouldReplaceDailyBest,
} from "./leaderboardLogic";
import { db, doc, runTransaction, serverTimestamp } from "./zatamFirebase";

const LEADERBOARD_COLLECTION = "leaderboard-zatamgame";

export async function saveMemoryConnectDailyBest(user, score, completedAt) {
  const scoreData = createScoreData(user, score, completedAt);
  const scoreRef = doc(
    db,
    LEADERBOARD_COLLECTION,
    getDailyScoreId(scoreData.userId, scoreData.scoreDate),
  );

  return runTransaction(db, async (transaction) => {
    const existingSnapshot = await transaction.get(scoreRef);
    const existingScore = existingSnapshot.exists()
      ? Number(existingSnapshot.data().score)
      : null;

    if (
      existingSnapshot.exists() &&
      !shouldReplaceDailyBest(existingScore, scoreData.score)
    ) {
      return { status: "kept", score: existingScore };
    }

    const timestampFields = { updatedAt: serverTimestamp() };

    if (existingSnapshot.exists()) {
      transaction.update(scoreRef, { ...scoreData, ...timestampFields });
    } else {
      transaction.set(scoreRef, {
        ...scoreData,
        createdAt: serverTimestamp(),
        ...timestampFields,
      });
    }

    return { status: "saved", score: scoreData.score };
  });
}
