import { mkdir, readFile, rename, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { vocabularySets } from "../Games/MemoryConnect-app/src/gameData.js";

const API_URL = "https://yourvoic.com/api/v1/tts/generate";
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
const requestedLimit = limitArgument
  ? Number(limitArgument.slice("--limit=".length))
  : Number.POSITIVE_INFINITY;
const isDryRun = argumentsSet.has("--dry-run") || !argumentsSet.has("--confirm");
const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function loadEnvironmentFile() {
  const environmentFile = path.join(projectRoot, ".env.local");
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
const clips = vocabularySets
  .flat()
  .map((entry) => ({ id: entry.id, text: entry.word }))
  .slice(0, requestedLimit);

if (
  requestedLimit !== Number.POSITIVE_INFINITY &&
  (!Number.isSafeInteger(requestedLimit) || requestedLimit <= 0)
) {
  throw new Error("--limit must be a positive whole number.");
}

if (isDryRun) {
  console.log(`Preview: ${clips.length} Sanskrit MP3 files would be generated in ${audioDirectory}.`);
  console.log("No API requests were made. Add --confirm to generate missing files.");
  process.exit(0);
}

if (!apiKey || apiKey === "paste_your_key_here") {
  throw new Error("YOURVOIC_API_KEY is missing. Copy .env.example to .env.local and add your key.");
}

async function removePartialFile(filePath) {
  await unlink(`${filePath}.part`).catch(() => {});
}

try {
  await mkdir(audioDirectory, { recursive: true });

  for (const clip of clips) {
    const destination = path.join(audioDirectory, `${clip.id}.mp3`);
    const partialDestination = `${destination}.part`;

    try {
      const existing = await stat(destination);
      if (existing.size > 0) {
        console.log(`Skipping existing recording: ${clip.id}.mp3`);
        continue;
      }
    } catch {
      // The recording is not present yet.
    }

    console.log(`Generating ${clip.id}.mp3…`);
    let response;

    while (true) {
      response = await fetch(API_URL, {
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

      if (response.status !== 429) break;
      const retryAfter = Number(response.headers.get("retry-after")) || 60;
      console.log(`Rate limited. Retrying ${clip.id}.mp3 in ${retryAfter} seconds.`);
      await sleep((retryAfter + 5) * 1000);
    }

    if (!response.ok) {
      const details = (await response.text()).slice(0, 300);
      throw new Error(`YourVoic rejected ${clip.id}.mp3 (${response.status}): ${details}`);
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.startsWith("audio/")) {
      throw new Error(`YourVoic returned ${contentType || "an unknown response"} for ${clip.id}.mp3.`);
    }

    const audio = Buffer.from(await response.arrayBuffer());
    if (audio.length === 0) throw new Error(`YourVoic returned an empty recording for ${clip.id}.mp3.`);

    await writeFile(partialDestination, audio);
    await rename(partialDestination, destination);
    console.log(`Saved ${clip.id}.mp3 (${audio.length} bytes).`);
  }
} catch (error) {
  await Promise.all(
    clips.map((clip) => removePartialFile(path.join(audioDirectory, `${clip.id}.mp3`))),
  );
  throw error;
}

console.log(`Audio ready for ${clips.length} Memory Connect words.`);
