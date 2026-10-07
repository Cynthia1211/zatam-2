import { vocabularySets } from "../Games/MemoryConnect-app/src/gameData.js";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const issues = [];
const ids = new Set();
const bundledImages = new Set();
const vocabularyDirectory = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../Games/MemoryConnect-app/public/vocabulary"
);

for (const [setIndex, entries] of vocabularySets.entries()) {
  const words = new Set();
  const images = new Set();

  if (entries.length < 8 || entries.length > 12) {
    issues.push(`Set ${setIndex} has ${entries.length} usable pairs; expected 8–12.`);
  }

  for (const [itemIndex, entry] of entries.entries()) {
    const expectedId = `${setIndex}-${itemIndex}`;
    if (entry.id !== expectedId || ids.has(entry.id)) {
      issues.push(`Invalid or duplicate id: ${entry.id}.`);
    }
    ids.add(entry.id);

    if (!entry.word || entry.word === "-" || words.has(entry.word)) {
      issues.push(`Invalid or duplicate word in set ${setIndex}: ${entry.word}.`);
    }
    words.add(entry.word);

    const hasSymbol = typeof entry.symbol === "string" && entry.symbol.length > 0;
    const expectedImage = `./vocabulary/${entry.id}.png`;
    const hasBundledImage = entry.image === expectedImage;
    if (!hasSymbol && !hasBundledImage) {
      issues.push(`Missing visual for ${entry.id} (${entry.word}).`);
    }
    if (hasBundledImage && images.has(entry.image)) {
      issues.push(`Duplicate image in set ${setIndex}: ${entry.image}.`);
    }
    if (hasBundledImage) {
      images.add(entry.image);
      bundledImages.add(entry.image);
      if (!existsSync(resolve(vocabularyDirectory, `${entry.id}.png`))) {
        issues.push(`Bundled image is missing for ${entry.id} (${entry.word}).`);
      }
    }
  }
}

if (issues.length) {
  console.error(`Memory Connect QA failed:\n- ${issues.join("\n- ")}`);
  process.exit(1);
}

console.log(
  `Memory Connect QA passed: ${vocabularySets.length} sets, ${ids.size} unique pairs, ` +
  `${bundledImages.size} local images, and ${ids.size - bundledImages.size} built-in symbols.`
);
