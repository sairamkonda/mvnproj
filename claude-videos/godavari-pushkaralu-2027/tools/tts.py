"""Synthesize the Telugu narration and word timings for the captions.

Uses Meta's MMS-TTS Telugu voice (facebook/mms-tts-tel, CC-BY-NC 4.0).
Word timings come from the model's own duration predictor, so the
word-by-word captions line up with the voice.

Writes:
  build/audio/scene_XX.wav   16 kHz mono narration per scene
  build/timeline.json        speech length and word timings per scene
"""
import json
import os
import sys

import numpy as np
import torch
from scipy.io import wavfile
from transformers import AutoTokenizer, VitsModel

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "build")
os.makedirs(os.path.join(OUT, "audio"), exist_ok=True)

model = VitsModel.from_pretrained("facebook/mms-tts-tel").eval()
tok = AutoTokenizer.from_pretrained("facebook/mms-tts-tel")
SR = model.config.sampling_rate
HOP = int(np.prod(model.config.upsample_rates))
vocab = tok.get_vocab()
GLOBAL_RATE = 1.1  # the voice is slow by default; reels need a brisker pace

captured = {}
model.duration_predictor.register_forward_hook(lambda m, i, o: captured.__setitem__("logdur", o))


def synth(text, rate, seed):
    """Return (waveform, [(start_s, end_s) per space-separated word])."""
    dropped = sorted({c for c in text if c not in vocab})
    if dropped:
        print(f"  warning: characters not in voice vocabulary, skipped: {dropped}", file=sys.stderr)
    torch.manual_seed(seed)
    model.speaking_rate = rate * GLOBAL_RATE
    inputs = tok(text, return_tensors="pt")
    with torch.no_grad():
        wav = model(**inputs).waveform[0].numpy()
    dur = torch.ceil(torch.exp(captured["logdur"]) * (1.0 / model.speaking_rate))[0, 0].numpy()
    ids = inputs.input_ids[0].tolist()
    assert abs(dur.sum() * HOP - len(wav)) <= HOP, (dur.sum() * HOP, len(wav))
    ends = np.cumsum(dur) * HOP / SR
    starts = ends - dur * HOP / SR
    # Word boundaries come from the space tokens. (Character/blank parity
    # can't be used: in this vocabulary the letter "ta" shares id 0 with
    # the blank token.)
    space = vocab[" "]
    cuts = [i for i, x in enumerate(ids) if x == space]
    bounds = [0] + [c + 1 for c in cuts]
    stops = [c - 1 for c in cuts] + [len(ids) - 1]
    words = [[float(starts[b]), float(ends[e])] for b, e in zip(bounds, stops)]
    return wav, words


def main():
    narr = json.load(open(os.path.join(ROOT, "narration.json")))
    timeline = {"sample_rate": SR, "scenes": []}
    for sc in narr["scenes"]:
        sid = sc["id"]
        pieces, cap_words, t = [], [], 0.0
        for pi, ph in enumerate(sc["phrases"]):
            text = " ".join(te for _, te in ph["words"])
            wav, tw = synth(text, sc.get("rate", 1.0), 1000 + sid * 10 + pi)
            n_expected = sum(len(te.split()) for _, te in ph["words"])
            assert len(tw) == n_expected, (sid, pi, len(tw), n_expected)
            k = 0
            for cap, te in ph["words"]:
                n = len(te.split())
                s, e = tw[k][0], tw[k + n - 1][1]
                cap_words.append({"text": cap, "start": round(t + s, 3), "end": round(t + e, 3)})
                k += n
            pieces.append(wav)
            t += len(wav) / SR
            if ph["pause"]:
                pieces.append(np.zeros(int(ph["pause"] * SR), dtype=np.float32))
                t += ph["pause"]
        audio = np.concatenate(pieces)
        audio = audio / max(1e-6, np.abs(audio).max()) * 0.9
        wavfile.write(os.path.join(OUT, "audio", f"scene_{sid:02d}.wav"), SR, (audio * 32767).astype(np.int16))
        timeline["scenes"].append({"id": sid, "speech": round(len(audio) / SR, 3), "words": cap_words})
        print(f"scene {sid:2d}: {len(audio)/SR:5.2f}s  {len(cap_words)} words")
    json.dump(timeline, open(os.path.join(OUT, "timeline.json"), "w"), ensure_ascii=False, indent=1)


if __name__ == "__main__":
    main()
