"""Shorten the pauses inside a voice sample so the cloned voice learns a fluent rhythm.

Usage: python tools/fluent_ref.py sample.wav sample_fluent.wav  (keeps 0.45 s of silence at the end)
"""
import sys
import numpy as np
import soundfile as sf

src, dst = sys.argv[1], sys.argv[2]
x, sr = sf.read(src, dtype="float32")
hop = int(0.01 * sr)
db = 20 * np.log10(np.sqrt(np.lib.stride_tricks.sliding_window_view(np.pad(x, (0, hop)), hop)[::hop].__pow__(2).mean(1)) + 1e-9)
voiced = db > -38
idx = np.where(voiced)[0]
start, end = idx[0], idx[-1] + 1
out, i, fade = [], start, int(0.01 * sr)
while i < end:
    j = i
    while j < end and voiced[j]:
        j += 1
    k = j
    while k < end and not voiced[k]:
        k += 1
    seg = x[i * hop: j * hop]
    out.append(seg)
    gap = (k - j) * 0.01
    if k < end:
        keep = min(gap, 0.06 if gap < 0.3 else 0.1)  # word joins stay tight, phrase breaks get a short breath
        out.append(x[j * hop: j * hop + int(keep * sr)])
    i = k
y = np.concatenate(out)
y = np.concatenate([np.zeros(int(0.05 * sr), np.float32), y, np.zeros(int(0.45 * sr), np.float32)])
sf.write(dst, y, sr)
print(f"{len(x)/sr:.2f}s -> {len(y)/sr:.2f}s")
