"""Narrate the video in a cloned voice with AI4Bharat IndicF5 (MIT licence).

IndicF5 copies a voice from one short reference clip plus its exact
transcript. Only clone a voice you have permission to use.

  INDICF5_DIR=/path/to/ai4bharat/IndicF5/snapshot \
  python tools/voice_clone.py --ref my_sample.wav --ref-text "exact words in the clip" [--scenes 1,2] [--nfe 32]

Writes build/audio_clone/scene_XX.wav and build/audio_clone/timeline.json
(same layout as tools/tts.py), so they can replace build/audio and
build/timeline.json for the mix and the render. Reference recordings are
personal data: keep them out of the repository.
"""
import argparse
import json
import os
import re
import sys
import time

import numpy as np
import soundfile as sf
import torch

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INDICF5 = os.environ["INDICF5_DIR"]
sys.path.insert(0, INDICF5)

import torchaudio  # noqa: E402


def _sf_load(path, *a, **k):  # newer torchaudio needs torchcodec for load(); soundfile is enough here
    data, sr = sf.read(path, dtype="float32", always_2d=True)
    return torch.from_numpy(data.T.copy()), sr


torchaudio.load = _sf_load

from f5_tts.infer import utils_infer as U  # noqa: E402
from f5_tts.model import CFM, DiT  # noqa: E402
from f5_tts.model.utils import get_tokenizer  # noqa: E402
from huggingface_hub import hf_hub_download  # noqa: E402
from safetensors.torch import load_file  # noqa: E402
from vocos import Vocos  # noqa: E402

SR = 24000


def load_models():
    sd = load_file(os.path.join(INDICF5, "model.safetensors"))
    vocab_map, vocab_size = get_tokenizer(os.path.join(INDICF5, "checkpoints", "vocab.txt"), "custom")
    model = CFM(
        transformer=DiT(dim=1024, depth=22, heads=16, ff_mult=2, text_dim=512, conv_layers=4,
                        text_num_embeds=vocab_size, mel_dim=U.n_mel_channels),
        mel_spec_kwargs=dict(n_fft=U.n_fft, hop_length=U.hop_length, win_length=U.win_length,
                             n_mel_channels=U.n_mel_channels, target_sample_rate=SR, mel_spec_type="vocos"),
        odeint_kwargs=dict(method=U.ode_method),
        vocab_char_map=vocab_map,
    )
    pre = "ema_model._orig_mod."
    missing, unexpected = model.load_state_dict({k[len(pre):]: v for k, v in sd.items() if k.startswith(pre)}, strict=False)
    if [m for m in missing if "mel_spec" not in m] or unexpected:
        raise RuntimeError(f"weights did not match: missing={missing[:5]} unexpected={unexpected[:5]}")
    voc = Vocos.from_hparams(hf_hub_download("charactr/vocos-mel-24khz", "config.yaml"))
    pre = "vocoder._orig_mod."
    voc.load_state_dict({k[len(pre):]: v for k, v in sd.items() if k.startswith(pre)})
    voc.eval()
    decode = voc.decode

    def decode_fp32(mel, *args, **kwargs):  # the transformer runs in bfloat16; the vocoder's complex math needs float32
        with torch.autocast("cpu", enabled=False):
            return decode(mel.float(), *args, **kwargs)

    voc.decode = decode_fp32
    return model.eval(), voc


def caption(cap, te, keep):
    """On-screen text: Telugu script, except numbers and listed English words (same rule as tools/tts.py)."""
    core, punct = re.match(r"^(.*?)([,.?!]*)$", cap).groups()
    return cap if re.search(r"\d", core) or core.lower() in keep else te + punct


def scene_text(sc):
    """Telugu line for the voice plus, per phrase, its caption words and weights."""
    phrases = []
    for ph in sc["phrases"]:
        words = []
        for cap, te in ph["words"]:
            punct = re.match(r"^.*?([,.?!]*)$", cap).group(1)
            words.append((cap, te, punct))
        phrases.append(words)
    parts = []
    for i, words in enumerate(phrases):
        s = " ".join(te + p for _, te, p in words)
        if i < len(phrases) - 1 and not re.search(r"[,.?!]$", s):
            s += ","
        parts.append(s)
    return " ".join(parts), phrases


def speech_spans(wav, thresh_db=-42, min_gap=0.12):
    """(start, end) of voiced regions, merging gaps shorter than min_gap."""
    hop = int(0.01 * SR)
    frames = np.lib.stride_tricks.sliding_window_view(np.pad(wav, (0, hop)), hop)[::hop]
    db = 20 * np.log10(np.sqrt((frames ** 2).mean(axis=1)) + 1e-9)
    voiced = db > thresh_db
    spans, start = [], None
    for i, v in enumerate(voiced):
        if v and start is None:
            start = i
        if not v and start is not None:
            spans.append([start * 0.01, i * 0.01]); start = None
    if start is not None:
        spans.append([start * 0.01, len(voiced) * 0.01])
    merged = []
    for s in spans:
        if merged and s[0] - merged[-1][1] < min_gap:
            merged[-1][1] = s[1]
        else:
            merged.append(s)
    return merged


def word_times(wav, phrases):
    """Spread caption words over the speech: phrase breaks at the longest pauses, words by text length."""
    spans = speech_spans(wav)
    t0, t1 = spans[0][0], spans[-1][1]
    gaps = sorted(((spans[i + 1][0] - spans[i][1], i) for i in range(len(spans) - 1)), reverse=True)
    cut_idx = sorted(i for _, i in gaps[: len(phrases) - 1])
    bounds = [t0] + [x for i in cut_idx for x in (spans[i][1], spans[i + 1][0])] + [t1]
    if len(cut_idx) < len(phrases) - 1:  # fewer pauses than phrases: split by text length instead
        total = sum(len(te) for ph in phrases for _, te, _ in ph)
        bounds, acc = [t0], 0
        for ph in phrases[:-1]:
            acc += sum(len(te) for _, te, _ in ph)
            b = t0 + (t1 - t0) * acc / total
            bounds += [b, b]
        bounds.append(t1)
    out = []
    for pi, ph in enumerate(phrases):
        a, b = bounds[2 * pi], bounds[2 * pi + 1]
        w = np.array([len(te) + 1.5 for _, te, _ in ph], dtype=float)
        edges = a + (b - a) * np.concatenate([[0], np.cumsum(w) / w.sum()])
        for k, (cap, te, _) in enumerate(ph):
            out.append({"text": cap, "te": te, "start": round(float(edges[k]), 3), "end": round(float(edges[k + 1]), 3)})
    return out, t0, t1


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--ref", required=True)
    ap.add_argument("--ref-text", required=True)
    ap.add_argument("--scenes", default="")
    ap.add_argument("--nfe", type=int, default=32)
    ap.add_argument("--speed", type=float, default=1.0)
    ap.add_argument("--out", default=os.path.join(ROOT, "build", "audio_clone"))
    a = ap.parse_args()
    torch.manual_seed(7)
    os.makedirs(a.out, exist_ok=True)
    narr = json.load(open(os.path.join(ROOT, "narration.json")))
    keep = set(narr.get("keep_english", []))
    model, voc = load_models()
    ref_audio, ref_text = U.preprocess_ref_audio_text(a.ref, a.ref_text, show_info=lambda *x: None)
    tl_path = os.path.join(a.out, "timeline.json")
    timeline = json.load(open(tl_path)) if os.path.exists(tl_path) else {"sample_rate": SR, "scenes": []}
    want = {int(x) for x in a.scenes.split(",") if x}
    for sc in narr["scenes"]:
        if want and sc["id"] not in want:
            continue
        text, phrases = scene_text(sc)
        t = time.time()
        with torch.inference_mode(), torch.autocast("cpu", dtype=torch.bfloat16):
            wav, sr, _ = U.infer_process(ref_audio, ref_text, text, model, voc, mel_spec_type="vocos",
                                         speed=a.speed, nfe_step=a.nfe, device="cpu", show_info=lambda *x: None)
        wav = np.asarray(wav, dtype=np.float32)
        words, s0, s1 = word_times(wav, phrases)
        pad = int(0.03 * SR)
        clip = wav[max(0, int(s0 * SR) - pad): int(s1 * SR) + pad]
        for w in words:
            w["start"] = round(max(0.0, w["start"] - s0 + 0.03), 3)
            w["end"] = round(w["end"] - s0 + 0.03, 3)
            w["show"] = caption(w["text"], w.pop("te"), keep)
        clip = clip / max(1e-6, np.abs(clip).max()) * 0.9
        sf.write(os.path.join(a.out, f"scene_{sc['id']:02d}.wav"), (clip * 32767).astype(np.int16), SR, subtype="PCM_16")
        timeline["scenes"] = [s for s in timeline["scenes"] if s["id"] != sc["id"]] + [
            {"id": sc["id"], "speech": round(len(clip) / SR, 3), "words": words}]
        timeline["scenes"].sort(key=lambda s: s["id"])
        json.dump(timeline, open(tl_path, "w"), ensure_ascii=False, indent=1)
        print(f"scene {sc['id']:2d}: {len(clip) / SR:5.2f}s speech, {time.time() - t:5.1f}s to generate", flush=True)


if __name__ == "__main__":
    main()
