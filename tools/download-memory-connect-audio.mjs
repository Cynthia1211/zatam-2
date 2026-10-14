import { mkdir, readFile, rename, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { vocabularySets } from "../Games/MemoryConnect-app/src/gameData.js";

const YOURVOIC_API_URL = "https://yourvoic.com/api/v1/tts/generate";
const projectRoot = process.cwd();
const audioDirectory = path.join(
  projectRoot,
  "Games",
  "MemoryConnect-app",
  "public",
  "audio",
);
const argumentsSet = new Set(process.argv.slice(2));
const limitArgument = process.argv.find((argument) => argument.startsWith("--limit="));
const onlyArgument = process.argv.find((argument) => argument.startsWith("--only="));
const concurrencyArgument = process.argv.find((argument) => argument.startsWith("--concurrency="));
const requestedLimit = limitArgument
  ? Number(limitArgument.slice("--limit=".length))
  : Number.POSITIVE_INFINITY;
const requestedConcurrency = concurrencyArgument
  ? Number(concurrencyArgument.slice("--concurrency=".length))
  : 1;
const requestedIds = onlyArgument
  ? new Set(
      onlyArgument
        .slice("--only=".length)
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean),
    )
  : null;
const isDryRun = argumentsSet.has("--dry-run") || !argumentsSet.has("--confirm");
const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function loadEnvironmentFile() {
  const environmentFile =
    process.env.SANSKRIT_TTS_ENV_FILE ||
    process.env.YOURVOIC_ENV_FILE ||
    path.join(projectRoot, ".env.local");
  const content = await readFile(environmentFile, "utf8").catch(() => "");

  for (const rawLine of content.split(/\r?\n/u)) {
    const line = rawLine.trim();
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/u);
    if (!match || process.env[match[1]] !== undefined) continue;

    const value = match[2].trim().replace(/^['"]|['"]$/gu, "");
    process.env[match[1]] = value;
  }
}

await loadEnvironmentFile();

const apiKey = process.env.YOURVOIC_API_KEY;
const voice = process.env.YOURVOIC_VOICE || "Deepti";
const model = process.env.YOURVOIC_MODEL || "aura-lite";
const endpoint = process.env.SANSKRIT_TTS_ENDPOINT?.trim();
const modalProxyKey = process.env.MODAL_PROXY_AUTH_KEY?.trim();
const modalProxySecret = process.env.MODAL_PROXY_AUTH_SECRET?.trim();
const providerName = endpoint ? "the Sanskrit TTS endpoint" : "YourVoic";
const allClips = vocabularySets
  .flat()
  .map((entry) => ({ id: entry.id, text: entry.word }));
const clips = allClips
  .filter((clip) => !requestedIds || requestedIds.has(clip.id))
  .slice(0, requestedLimit);

if (
  requestedLimit !== Number.POSITIVE_INFINITY &&
  (!Number.isSafeInteger(requestedLimit) || requestedLimit <= 0)
) {
  throw new Error("--limit must be a positive whole number.");
}

if (requestedIds && clips.length !== requestedIds.size) {
  throw new Error("--only includes an unknown Memory Connect word ID.");
}

if (!Number.isSafeInteger(requestedConcurrency) || requestedConcurrency <= 0 || requestedConcurrency > 4) {
  throw new Error("--concurrency must be a whole number from 1 to 4.");
}

if (isDryRun) {
  console.log(`Preview: ${clips.length} Sanskrit MP3 files would be generated in ${audioDirectory}.`);
  console.log("No API requests were made. Add --confirm to generate missing files.");
  process.exit(0);
}

if (!endpoint && (!apiKey || apiKey === "paste_your_key_here")) {
  throw new Error("YOURVOIC_API_KEY is missing. Copy .env.example to .env.local and add your key.");
}

if ((modalProxyKey && !modalProxySecret) || (!modalProxyKey && modalProxySecret)) {
  throw new Error("MODAL_PROXY_AUTH_KEY and MODAL_PROXY_AUTH_SECRET must be set together.");
}

async function removePartialFile(filePath) {
  await unlink(`${filePath}.part`).catch(() => {});
}

async function retryDelaySeconds(response) {
  const headerDelay = Number(response.headers.get("retry-after"));
  if (Number.isFinite(headerDelay) && headerDelay > 0) return headerDelay;

  const payload = await response.clone().json().catch(() => null);
  const payloadDelay = Number(payload?.error?.retry_after);
  return Number.isFinite(payloadDelay) && payloadDelay > 0 ? payloadDelay : 60;
}

function requestAudio(clip) {
  if (endpoint) {
    const headers = { "Content-Type": "application/json" };
    if (modalProxyKey && modalProxySecret) {
      headers["Modal-Key"] = modalProxyKey;
      headers["Modal-Secret"] = modalProxySecret;
    }

    return fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({ text: clip.text }),
    });
  }

  return fetch(YOURVOIC_API_URL, {
    method: "POST",
    headers: {
      "X-API-Key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: clip.text,
      voice,
      language: "sa-IN",
      model,
      speed: 1,
      pitch: 1,
      format: "mp3",
    }),
  });
}

async function generateClip(clip) {
  const destination = path.join(audioDirectory, `${clip.id}.mp3`);
  const partialDestination = `${destination}.part`;

  try {
    const existing = await stat(destination);
    if (existing.size > 0) {
      console.log(`Skipping existing recording: ${clip.id}.mp3`);
      return;
    }
  } catch {
    // The recording is not present yet.
  }

  console.log(`Generating ${clip.id}.mp3…`);
  let response;
  let retryableErrorAttempts = 0;

  while (true) {
    response = await requestAudio(clip);

    const retryableStatus = response.status === 429 || response.status === 504;
    if (!retryableStatus) break;

    retryableErrorAttempts += 1;
    if (retryableErrorAttempts >= 5) {
      throw new Error(
        `${providerName} is still unable to generate ${clip.id}.mp3 after ${retryableErrorAttempts} attempts. Resume later to continue from the saved recordings.`,
      );
    }

    const retryAfter = await retryDelaySeconds(response);
    const reason = response.status === 429 ? "Rate limited" : "Service timed out";
    console.log(`${reason}. Retrying ${clip.id}.mp3 in ${retryAfter} seconds.`);
    await sleep((retryAfter + 5) * 1000);
  }

  if (!response.ok) {
    const details = (await response.text()).slice(0, 300);
    throw new Error(`${providerName} rejected ${clip.id}.mp3 (${response.status}): ${details}`);
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.startsWith("audio/")) {
    throw new Error(`${providerName} returned ${contentType || "an unknown response"} for ${clip.id}.mp3.`);
  }

  const audio = Buffer.from(await response.arrayBuffer());
  if (audio.length === 0) throw new Error(`${providerName} returned an empty recording for ${clip.id}.mp3.`);

  await writeFile(partialDestination, audio);
  await rename(partialDestination, destination);
  console.log(`Saved ${clip.id}.mp3 (${audio.length} bytes).`);
}

try {
  await mkdir(audioDirectory, { recursive: true });
  let nextClipIndex = 0;
  const workerCount = Math.min(requestedConcurrency, clips.length);
  const workers = Array.from({ length: workerCount }, async () => {
    while (nextClipIndex < clips.length) {
      const clip = clips[nextClipIndex];
      nextClipIndex += 1;
      await generateClip(clip);
    }
  });
  const results = await Promise.allSettled(workers);
  const failedWorker = results.find((result) => result.status === "rejected");
  if (failedWorker) {
    throw failedWorker.reason;
  }
} catch (error) {
  await Promise.all(
    clips.map((clip) => removePartialFile(path.join(audioDirectory, `${clip.id}.mp3`))),
  );
  throw error;
}

console.log(`Audio ready for ${clips.length} Memory Connect words.`);
