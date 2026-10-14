# Generate Sanskrit audio for Memory Connect

This is an offline asset-generation step. GitHub Pages never calls the TTS
service: the finished MP3 files are saved under
`Games/MemoryConnect-app/public/audio/` and are served as ordinary game files.

## 1. Prepare Modal safely

Create a Modal account, add the required payment method for GPU access, then set
the usage and spend limits described in the deployment guide before deploying.

From the repository root, install and sign in to the Modal CLI:

```powershell
py -m pip install modal
modal setup
modal workspace proxy-tokens create --name memory-connect-generator
```

Save the printed `wk-...` and `ws-...` values privately. The proxy token keeps
the GPU endpoint from being called by anyone else.

## 2. Deploy the Sanskrit model

```powershell
modal deploy tools/sanskrit_tts_modal.py
```

The command prints the protected URL for the `tts` function. Copy that URL into
a local `.env.local` file. Do not commit this file.

```dotenv
SANSKRIT_TTS_ENDPOINT=https://your-workspace--memory-connect-sanskrit-tts-tts.modal.run
MODAL_PROXY_AUTH_KEY=wk-...
MODAL_PROXY_AUTH_SECRET=ws-...
```

## 3. Generate the game files

First run a no-cost check:

```powershell
npm run preview:memory-audio
```

Then generate the missing MP3 files. It resumes automatically, so an existing
recording is never replaced. For a faster controlled batch, use four workers;
the deployed service can run up to eight GPU containers when separate,
non-overlapping batches are needed.

```powershell
npm run generate:memory-audio
# Or: npm run generate:memory-audio -- --concurrency=4
```

When the command completes, verify the app and include the MP3 files in the
Memory Connect change:

```powershell
npm run test:memory-connect
npm run build:pages
git add Games/MemoryConnect-app/public/audio
```

## If generation is interrupted

Run `npm run generate:memory-audio` again. It skips every non-empty MP3 already
in the audio folder and continues at the first missing word.
