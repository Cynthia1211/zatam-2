import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const toolsDirectory = dirname(fileURLToPath(import.meta.url));
const legacyFile = resolve(toolsDirectory, "../Games/MemoryConnect/MemoryConnect.html");
const outputDirectory = resolve(toolsDirectory, "../Games/MemoryConnect-app/public/vocabulary");
const symbolVisuals = new Set([
  "0-0", "0-1", "0-2", "0-3", "0-4", "0-5", "0-6", "0-7", "0-8", "0-9", "0-10", "0-11",
  "27-11", "37-7", "47-1"
]);

const source = await readFile(legacyFile, "utf8");
const wordsStart = source.indexOf("var wlist=");
const imagesStart = source.indexOf("var ilist=");
const imagesEnd = source.indexOf("</script>", imagesStart);
const { ilist } = new Function(`${source.slice(wordsStart, imagesEnd)}\nreturn { ilist };`)();

const images = ilist.flatMap((set, setIndex) =>
  set.map((url, itemIndex) => ({ id: `${setIndex}-${itemIndex}`, url })).filter(
    ({ id, url }) => typeof url === "string" && url.startsWith("https://") && !symbolVisuals.has(id)
  )
);

await mkdir(outputDirectory, { recursive: true });

async function existsWithContent(path) {
  try {
    return (await stat(path)).size > 0;
  } catch {
    return false;
  }
}

let nextImage = 0;
let downloaded = 0;
let reused = 0;
const failures = [];

async function downloadNext() {
  while (nextImage < images.length) {
    const image = images[nextImage++];
    const destination = resolve(outputDirectory, `${image.id}.png`);

    if (await existsWithContent(destination)) {
      reused += 1;
      continue;
    }

    try {
      const response = await fetch(image.url, {
        redirect: "follow",
        signal: AbortSignal.timeout(30_000)
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const bytes = new Uint8Array(await response.arrayBuffer());
      if (!bytes.length) throw new Error("empty response");
      await writeFile(destination, bytes);
      downloaded += 1;
    } catch (error) {
      failures.push(`${image.id}: ${error.message}`);
    }
  }
}

await Promise.all(Array.from({ length: 8 }, downloadNext));

if (failures.length) {
  console.error(`Could not bundle ${failures.length} image(s):\n- ${failures.join("\n- ")}`);
  process.exit(1);
}

console.log(`Bundled ${images.length} Memory Connect images (${downloaded} downloaded, ${reused} already present).`);
