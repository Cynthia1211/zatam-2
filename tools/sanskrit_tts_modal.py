"""Offline Sanskrit MP3 generator for Memory Connect.

Deploy this file with Modal, then point SANSKRIT_TTS_ENDPOINT in .env.local to
the printed endpoint URL and run `npm run generate:memory-audio` locally.
The game only receives the generated MP3 files; it never calls this service.
"""

import io
import wave

import modal


image = (
    modal.Image.debian_slim(python_version="3.10")
    .apt_install("ffmpeg")
    .pip_install(
        "torch",
        "numpy",
        "fastapi",
        "pydantic",
        "snac",
        "unsloth",
        "transformers",
        "accelerate",
        "pydub",
    )
)

app = modal.App("memory-connect-sanskrit-tts")


@app.cls(image=image, gpu="T4", max_containers=8, scaledown_window=300)
class SanskritTTSService:
    """Loads the Sanskrit model only when an audio-generation request arrives."""

    @modal.enter()
    def load_models(self):
        import torch
        from snac import SNAC
        from unsloth import FastLanguageModel

        self.torch = torch
        self.model, self.tokenizer = FastLanguageModel.from_pretrained(
            "rverma0631/Sanskrit_TTS",
            max_seq_length=2048,
            dtype=None,
            load_in_4bit=False,
        )
        self.model = self.model.to("cuda")
        FastLanguageModel.for_inference(self.model)
        self.snac_model = SNAC.from_pretrained("hubertsiuzdak/snac_24khz").eval().to("cpu")

    def redistribute_codes(self, code_list):
        torch = self.torch
        layer_1, layer_2, layer_3 = [], [], []
        for index in range(len(code_list) // 7):
            offset = 7 * index
            layer_1.append(code_list[offset])
            layer_2.append(code_list[offset + 1] - 4096)
            layer_3.extend(
                [
                    code_list[offset + 2] - (2 * 4096),
                    code_list[offset + 3] - (3 * 4096),
                ]
            )
            layer_2.append(code_list[offset + 4] - (4 * 4096))
            layer_3.extend(
                [
                    code_list[offset + 5] - (5 * 4096),
                    code_list[offset + 6] - (6 * 4096),
                ]
            )

        return self.snac_model.decode(
            [
                torch.tensor(layer_1).unsqueeze(0),
                torch.tensor(layer_2).unsqueeze(0),
                torch.tensor(layer_3).unsqueeze(0),
            ]
        )

    @modal.method()
    def generate_mp3(self, sanskrit_text: str) -> bytes:
        import numpy as np
        from pydub import AudioSegment

        torch = self.torch
        prompt = f"1070: {sanskrit_text}"
        input_ids = self.tokenizer(prompt, return_tensors="pt").input_ids
        start_token = torch.tensor([[128259]], dtype=torch.int64)
        end_tokens = torch.tensor([[128009, 128260]], dtype=torch.int64)
        input_ids = torch.cat([start_token, input_ids, end_tokens], dim=1).to("cuda")
        attention_mask = torch.ones_like(input_ids)

        generated_ids = self.model.generate(
            input_ids=input_ids,
            attention_mask=attention_mask,
            max_new_tokens=1200,
            do_sample=False,
            repetition_penalty=1.1,
            num_return_sequences=1,
            eos_token_id=128258,
            use_cache=True,
        )

        marker_indices = (generated_ids == 128257).nonzero(as_tuple=True)
        audio_tokens = (
            generated_ids[:, marker_indices[1][-1].item() + 1 :]
            if len(marker_indices[1])
            else generated_ids
        )
        audio_tokens = audio_tokens[0][audio_tokens[0] != 128258]
        token_count = (audio_tokens.size(0) // 7) * 7
        if token_count == 0:
            raise ValueError("The model did not return valid audio codes.")

        codes = (audio_tokens[:token_count] - 128266).tolist()
        audio_sample = self.redistribute_codes(codes).detach().squeeze().to("cpu").numpy()
        peak = np.max(np.abs(audio_sample))
        if peak > 0:
            audio_sample = (audio_sample / peak) * 0.98

        wav_buffer = io.BytesIO()
        with wave.open(wav_buffer, "wb") as wav_file:
            wav_file.setnchannels(1)
            wav_file.setsampwidth(2)
            wav_file.setframerate(24000)
            wav_file.writeframes((audio_sample * 32767).astype(np.int16).tobytes())

        wav_buffer.seek(0)
        mp3_buffer = io.BytesIO()
        AudioSegment.from_wav(wav_buffer).export(mp3_buffer, format="mp3", bitrate="192k")
        return mp3_buffer.getvalue()


@app.function(image=image, timeout=600)
@modal.fastapi_endpoint(method="POST", requires_proxy_auth=True)
def tts(item: dict):
    """Accept {"text": "संस्कृतम्"} and return an audio/mpeg response."""

    from fastapi import HTTPException
    from fastapi.responses import Response

    text = str(item.get("text", "")).strip()
    if not text:
        raise HTTPException(status_code=400, detail="Text is empty")
    if len(text) > 200:
        raise HTTPException(status_code=400, detail="Text must be 200 characters or fewer")

    mp3_bytes = SanskritTTSService().generate_mp3.remote(text)
    return Response(content=mp3_bytes, media_type="audio/mpeg")
