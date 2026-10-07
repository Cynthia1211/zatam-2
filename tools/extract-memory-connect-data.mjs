import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const legacyFile = fileURLToPath(
  new URL("../Games/MemoryConnect/MemoryConnect.html", import.meta.url)
);
const outputFile = fileURLToPath(
  new URL("../Games/MemoryConnect-app/src/gameData.js", import.meta.url)
);
const source = await readFile(legacyFile, "utf8");
const wordsStart = source.indexOf("var wlist=");
const imagesStart = source.indexOf("var ilist=");
const imagesEnd = source.indexOf("</script>", imagesStart);

if (wordsStart < 0 || imagesStart < 0 || imagesEnd < 0) {
  throw new Error("The legacy vocabulary data could not be found.");
}

const wordsSource = source.slice(wordsStart, imagesStart);
const imagesSource = source.slice(imagesStart, imagesEnd);
const { wlist, ilist } = new Function(
  `${wordsSource}\n${imagesSource}\nreturn { wlist, ilist };`
)();

// The original source referenced twelve zodiac images that were never added to
// the project, and used the same fort image for both "pit" and "fort". Keep
// the migrated game self-contained and make every pair visually distinct.
const visualOverrides = new Map([
  ["0-0", { image: null, symbol: "♈" }],
  ["0-1", { image: null, symbol: "♉" }],
  ["0-2", { image: null, symbol: "♊" }],
  ["0-3", { image: null, symbol: "♋" }],
  ["0-4", { image: null, symbol: "♌" }],
  ["0-5", { image: null, symbol: "♍" }],
  ["0-6", { image: null, symbol: "♎" }],
  ["0-7", { image: null, symbol: "♏" }],
  ["0-8", { image: null, symbol: "♐" }],
  ["0-9", { image: null, symbol: "♑" }],
  ["0-10", { image: null, symbol: "♒" }],
  ["0-11", { image: null, symbol: "♓" }],
  ["27-11", { image: null, symbol: "🍇" }],
  ["37-7", { image: null, symbol: "🕳️" }],
  ["47-1", { image: null, symbol: "🪜" }]
]);

const vocabularySets = wlist.map((words, index) =>
  words
    .map((word, itemIndex) => {
      const id = `${index}-${itemIndex}`;
      return {
        id,
        word: word.trim(),
        image: ilist[index][itemIndex] === "-" ? "-" : `./vocabulary/${id}.png`,
        ...visualOverrides.get(id)
      };
    })
    .filter((entry) => entry.word !== "-" && entry.image !== "-")
);

await writeFile(
  outputFile,
  `// Generated from the original game data. Run npm run extract:memory-data after changing it.\nexport const vocabularySets = ${JSON.stringify(vocabularySets, null, 2)};\n`,
  "utf8"
);
