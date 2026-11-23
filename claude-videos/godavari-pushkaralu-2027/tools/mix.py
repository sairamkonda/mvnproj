"""Build the soundtrack: narration placed per scene, a synthesized tanpura
drone, temple bells, a soft drum pulse and a few sound effects, with the
music ducked under the voice. Everything except the voice is synthesized
here, so there are no third-party audio assets.

Writes build/audio/mix.wav (48 kHz stereo).
"""
import json
import os

import numpy as np
from scipy.io import wavfile
from scipy.signal import resample_poly, butter, sosfilt

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
B = os.path.join(ROOT, "build")
SR = 48000
plan = json.load(open(os.path.join(B, "plan.json")))
tl = {s["id"]: s for s in json.load(open(os.path.join(B, "timeline.json")))["scenes"]}
P = {s["id"]: s for s in plan["scenes"]}
N = int((plan["total"] + 0.5) * SR)
rng = np.random.default_rng(7)

voice = np.zeros(N)
music = np.zeros((N, 2))
sfx = np.zeros((N, 2))


def at(t):
    return int(t * SR)


def word(sid, i):
    return P[sid]["start"] + P[sid]["lead"] + tl[sid]["words"][i]["start"]


def add(buf, sig, t, pan=0.0, gain=1.0):
    i = at(t)
    if i >= len(buf):
        return
    sig = sig[: len(buf) - i] * gain
    if buf.ndim == 1:
        buf[i:i + len(sig)] += sig
    else:
        buf[i:i + len(sig), 0] += sig * np.sqrt(0.5 * (1 - pan))
        buf[i:i + len(sig), 1] += sig * np.sqrt(0.5 * (1 + pan))


def lp(x, f, order=2):
    return sosfilt(butter(order, f, "low", fs=SR, output="sos"), x)


def hp(x, f, order=2):
    return sosfilt(butter(order, f, "high", fs=SR, output="sos"), x)


# ---- narration ----
for sid, s in P.items():
    sr, x = wavfile.read(os.path.join(B, "audio", f"scene_{sid:02d}.wav"))
    x = resample_poly(x.astype(np.float64) / 32768.0, SR // sr, 1) if sr != SR else x / 32768.0
    x = hp(x, 70)
    add(voice, x, s["start"] + s["lead"])

# ---- tanpura drone (D) ----
SA = 146.83


def pluck(f, dur=4.6, bright=1.0):
    t = np.arange(int(dur * SR)) / SR
    out = np.zeros_like(t)
    for n in range(1, 28):
        amp = (1 / n ** 0.9) * (1 + 0.6 * np.sin(n * 1.7)) * np.exp(-t * (0.35 + 0.05 * n / bright))
        # jawari: slowly sweeping emphasis on upper partials
        sweep = 1 + 0.8 * np.exp(-((n - (4 + 14 * (1 - np.exp(-t * 0.8)))) ** 2) / 6)
        out += amp * sweep * np.sin(2 * np.pi * f * n * t * (1 + 0.0004 * rng.standard_normal()) + rng.random() * 6.28)
    env = np.minimum(1, t / 0.01)
    return out * env / 12


strings = [(SA * 0.75, -0.3), (SA, 0.2), (SA, -0.1), (SA / 2, 0.3)]
cache = {f: pluck(f) for f, _ in strings}
t = 0.0
k = 0
while t < plan["total"]:
    f, pan = strings[k % 4]
    add(music, cache[f], t, pan=pan, gain=0.55)
    t += 1.15
    k += 1

# soft sustained pad an octave down for warmth
tt = np.arange(N) / SR
pad = 0.06 * (np.sin(2 * np.pi * SA / 2 * tt) + 0.5 * np.sin(2 * np.pi * SA * 0.75 * tt + 1) + 0.3 * np.sin(2 * np.pi * SA * tt + 2))
pad *= 0.7 + 0.3 * np.sin(2 * np.pi * 0.07 * tt)
music[:, 0] += pad
music[:, 1] += pad


# ---- drum pulse (thom + ta), only in the brisker scenes ----
def thom():
    t = np.arange(int(0.5 * SR)) / SR
    f = 70 + 60 * np.exp(-t * 25)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7) * 0.9


def ta():
    t = np.arange(int(0.18 * SR)) / SR
    n = hp(rng.standard_normal(len(t)), 1800) * np.exp(-t * 40) * 0.25
    return n + 0.3 * np.sin(2 * np.pi * 520 * t) * np.exp(-t * 30)


BPM = 84
beat = 60 / BPM
drum_scenes = {1, 2, 3, 7, 10, 13, 16, 17, 19}
for sid in drum_scenes:
    s = P[sid]
    t = s["start"] + 0.05
    i = 0
    while t < s["start"] + s["dur"] - 0.1:
        if i % 4 in (0, 3) or (i % 8 == 6):
            add(music, thom(), t, gain=0.5)
        if i % 2 == 1:
            add(music, ta(), t, pan=0.25 if i % 4 == 1 else -0.25, gain=0.35)
        t += beat / 2
        i += 1


# ---- sound effects ----
def bell(f=520, dur=4.5):
    t = np.arange(int(dur * SR)) / SR
    out = np.zeros_like(t)
    for ratio, a, d in [(1, 1, 1.2), (2.0, 0.6, 1.6), (2.76, 0.5, 2.2), (5.4, 0.3, 3.5), (8.93, 0.15, 5)]:
        out += a * np.sin(2 * np.pi * f * ratio * t) * np.exp(-t * d)
    return out * np.minimum(1, t / 0.002) * 0.35


def whoosh(dur=1.0, up=True):
    n = rng.standard_normal(int(dur * SR))
    t = np.linspace(0, 1, len(n))
    env = np.sin(np.pi * t) ** 2
    out = np.zeros_like(n)
    for j, seg in enumerate(np.array_split(np.arange(len(n)), 20)):
        f = 300 + (2500 if up else -0) * (j / 20) if up else 2500 - 2200 * (j / 20)
        out[seg] = lp(n, max(200, f))[seg]
    return out * env * 0.5


def coins(dur=1.2):
    out = np.zeros(int(dur * SR))
    for _ in range(26):
        st = int(rng.random() * 0.8 * SR)
        f = 2500 + rng.random() * 4000
        t = np.arange(int(0.25 * SR)) / SR
        ping = np.sin(2 * np.pi * f * t) * np.exp(-t * 22) * (0.3 + rng.random() * 0.5)
        out[st:st + len(ping)] += ping[: len(out) - st]
    return out * 0.35


def splash():
    t = np.arange(int(0.9 * SR)) / SR
    return lp(rng.standard_normal(len(t)), 1400) * np.exp(-t * 5) * 0.8


def flip():
    t = np.arange(int(0.12 * SR)) / SR
    return hp(rng.standard_normal(len(t)), 2500) * np.exp(-t * 35) * 0.35


def inv_inout(y):
    # inverse of the cubic ease-in-out used by the renderer
    return (y / 4) ** (1 / 3) if y < 0.5 else 1 - ((2 - 2 * y) ** (1 / 3)) / 2


S = lambda sid: P[sid]["start"]
add(sfx, whoosh(1.1), S(1), gain=0.9)
add(sfx, bell(520), S(1) + 0.05, gain=0.8)
add(sfx, coins(), word(1, 8) - 0.05, gain=1.0)
add(sfx, bell(780, 3), word(1, 8) - 0.05, gain=0.4)
for sid, (a, b) in {3: (0.25, 2.3), 9: (0.25, 2.2), 12: (0.25, 2.2)}.items():
    for i in range(4):
        add(sfx, flip(), S(sid) + a + inv_inout((i + 0.5) / 4) * (b - a), pan=0.2)
# scene 4: shimmer while the logo dissolves, then the dive
add(sfx, coins(1.6), S(4) + 0.4, gain=0.4)
dive = word(4, 8) - 0.35 - S(4)
end = P[4]["dur"] - 0.05
add(sfx, whoosh(end - dive + 0.1), S(4) + dive, gain=0.9)
add(sfx, splash(), S(4) + dive + 0.903 * (end - dive), gain=1.0)
add(sfx, bell(440, 5), S(5) + 0.1, gain=0.6)
add(sfx, bell(392, 5), S(15) + 0.15, gain=0.6)
add(sfx, bell(520, 3.5), S(15) + 2.4, gain=0.35)
add(sfx, whoosh(0.8), S(7), gain=0.5)
add(sfx, whoosh(0.8), S(14), gain=0.5)
for i in range(3):
    add(sfx, bell(440 + i * 70, 4), S(19) + 0.2 + i * 1.6, gain=0.45)

# ---- music level per scene (quieter for the memorial and the sunset) ----
lvl = np.ones(N)
for sid, g in {11: 0.45, 18: 0.7}.items():
    s = P[sid]
    a, b = at(s["start"]), at(s["start"] + s["dur"])
    ramp = int(0.4 * SR)
    lvl[a:b] = g
    lvl[max(0, a - ramp):a] = np.linspace(1, g, a - max(0, a - ramp))
    lvl[b:b + ramp] = np.linspace(g, 1, len(lvl[b:b + ramp]))
# fade the music in and out
lvl[: int(0.3 * SR)] *= np.linspace(0, 1, int(0.3 * SR))
fo = int(1.8 * SR)
lvl[-fo:] *= np.linspace(1, 0, fo)

# ---- duck under the voice ----
def moving_avg(x, win):
    c = np.cumsum(np.concatenate([np.zeros(win // 2 + 1), x, np.zeros(win // 2 + 1)]))
    return (c[win:win + len(x)] - c[:len(x)]) / win


win = int(0.25 * SR)
env = moving_avg(np.abs(voice), win)
duck = moving_avg(1 - 0.62 * np.clip(env / (env.max() * 0.25 + 1e-9), 0, 1), win)

music_gain = 0.22
mix = music * (music_gain * lvl * duck)[:, None] + sfx * 0.5 + np.stack([voice, voice], 1) * 0.95
mix /= max(1e-9, np.abs(mix).max()) / 0.89
wavfile.write(os.path.join(B, "audio", "mix.wav"), SR, (mix * 32767).astype(np.int16))
print(f"mix.wav: {N / SR:.2f} s")
