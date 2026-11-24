"""Write a voice-over script that matches the rendered video's timing, for
recording the narration elsewhere (e.g. HeyGen).

Writes voiceover-script.md and voiceover-cues.srt next to the video.
"""
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
B = os.path.join(ROOT, "build")
plan = json.load(open(os.path.join(B, "plan.json")))
tl = {s["id"]: s for s in json.load(open(os.path.join(B, "timeline.json")))["scenes"]}
narr = {s["id"]: s for s in json.load(open(os.path.join(ROOT, "narration.json")))["scenes"]}
spec = {s["id"]: s for s in json.load(open(os.path.join(ROOT, "scenes.json")))["scenes"]}

# Telugu-script spellings a TTS voice reads more reliably than the caption form
SPOKEN = {"గోదావరి పుష్కరాలు టీ జీ": "గోదావరి పుష్కరాలు టీ జీ", "లోగో": "లోగో", "ట్యాగ్లైన్": "ట్యాగ్‌లైన్"}

# visual moments tied to a word: scene -> [(word index, use word end?, what happens)]
SYNC = {
    1: [(7, True, "the pencil finishes the wave-and-diya sketch"), (8, False, "gold coins burst, RS 1,00,000 badge pops")],
    2: [(2, False, "RS 1,00,000 appears over podium 1"), (5, False, "RS 50,000 appears over podium 2"), (9, False, "RS 25,000 appears over podium 3")],
    3: [(6, False, "envelope flies down; the email card appears 0.5 s later and stays to the end")],
    4: [(8, False, "camera dives into the river (starts 0.35 s before this word)")],
    6: [(2, False, "SIMHA RAASI label appears"), (5, True, "Jupiter settles into Simha and the sector lights up")],
    7: [(6, True, "the glowing river reaches the sea (city pins pop as it passes)")],
    8: [(4, False, "the woman in the river takes her dip")],
    10: [(4, True, "the counter reaches 10,00,00,000+")],
    13: [(4, True, "the last of the 96 pins pops"), (5, False, "devotee lights start moving toward the river")],
    14: [(4, False, "UTTARA VAHINI label appears")],
    16: [(4, False, "470 M NEW GHATS label appears")],
}


def tc(t, srt=False):
    m, s = divmod(max(0.0, t), 60)
    if srt:
        return f"00:{int(m):02d}:{int(s):02d},{int(round((s - int(s)) * 1000)):03d}"
    return f"{int(m)}:{s:04.1f}"


def lines(sid):
    """(Telugu script for the voice, romanized line) built from narration.json."""
    te_parts, ro_parts = [], []
    phrases = narr[sid]["phrases"]
    for pi, ph in enumerate(phrases):
        te_w, ro_w = [], []
        for cap, te in ph["words"]:
            punct = re.match(r"^.*?([,.?!]*)$", cap).group(1)
            te_w.append(SPOKEN.get(te, te) + punct)
            ro_w.append(cap)
        last_has_punct = bool(re.search(r"[,.?!]$", ph["words"][-1][0]))
        sep = "" if last_has_punct or pi == len(phrases) - 1 else " —"
        te_parts.append(" ".join(te_w) + sep)
        ro_parts.append(" ".join(ro_w) + sep)
    return " ".join(te_parts), " ".join(ro_parts)


md = [
    "# Voice-over script — Godavari Pushkaralu 2027",
    "",
    "Timed to [`godavari-pushkaralu-2027.mp4`](godavari-pushkaralu-2027.mp4) "
    f"({tc(plan['total'] + 2.2)} with the end card). Each scene's line has to be spoken inside its window, "
    "because the captions and a few animations are timed to it.",
    "",
    "## How to record it in HeyGen",
    "",
    "1. Make **one clip per scene** (19 clips) from the Telugu lines below, in the same voice and speed.",
    "   One long take drifts, because every scene has its own fixed length.",
    "2. Keep each clip **no longer than “Max”**. “Target” is how long the current captions expect;",
    "   being close to it keeps the word-by-word highlight in step.",
    "3. Place each clip at its **Start** time over `godavari-pushkaralu-2027-no-voice.mp4`",
    "   (music and effects only). `voiceover-cues.srt` has the same windows as subtitle cues, which",
    "   CapCut, Premiere and DaVinci can import as guides.",
    "4. Or send the clips back and the captions and animations can be re-timed to your voice exactly,",
    "   then the video re-rendered.",
    "",
    "Numbers are spelled out in Telugu so the voice reads them correctly; the on-screen captions show digits.",
    "The email address is spelled for speaking: గోదావరి పుష్కరాలు టీ జీ ఎట్ జీమెయిల్ డాట్ కామ్ "
    "(godavaripushkaralutg@gmail.com).",
    "",
    "## At a glance",
    "",
    "| # | Scene | Start | End | Target | Max |",
    "| --- | --- | --- | --- | --- | --- |",
]
srt = []
for i, s in enumerate(plan["scenes"]):
    sid, t = s["id"], tl[s["id"]]
    st = s["start"] + s["lead"]
    mx = s["dur"] - s["lead"] - 0.15
    md.append(f"| {sid} | {spec[sid]['title']} | {tc(st)} | {tc(st + mx)} | {t['speech']:.1f} s | {mx:.1f} s |")
md += ["", "## Scene by scene", ""]
for i, s in enumerate(plan["scenes"]):
    sid, t = s["id"], tl[s["id"]]
    st = s["start"] + s["lead"]
    mx = s["dur"] - s["lead"] - 0.15
    te, ro = lines(sid)
    sp = spec[sid]
    md += [
        f"### {sid}. {sp['title']}",
        "",
        f"**Scene** {tc(s['start'])}–{tc(s['start'] + s['dur'])} · **Speak** from {tc(st)} · "
        f"**Target** {t['speech']:.1f} s · **Max** {mx:.1f} s"
        + (" · *calm, respectful tone*" if sid == 11 else "")
        + (" · *energetic hook — first 2 seconds matter*" if sid == 1 else ""),
        "",
        f"> {te}",
        "",
        f"*{ro}*",
        "",
    ]
    if sid in SYNC:
        md.append("Sync points:")
        for wi, use_end, what in SYNC[sid]:
            w = t["words"][wi]
            at = s["start"] + s["lead"] + (w["end"] if use_end else w["start"])
            md.append(f"- “{w['text'].rstrip(',.?!')}” at {tc(at)} — {what}")
        md.append("")
    srt += [str(i + 1), f"{tc(st, True)} --> {tc(st + t['speech'], True)}", f"[{sid}] {te}", ""]
md += [
    "## Changed from the storyboard",
    "",
    "- Scene 16 says *nalugu vandala **debbai*** (470 m) to match the title, callout and source; "
    "the storyboard narration said *muppai* (430 m).",
    "",
]
open(os.path.join(ROOT, "voiceover-script.md"), "w").write("\n".join(md))
open(os.path.join(ROOT, "voiceover-cues.srt"), "w").write("\n".join(srt))
print("wrote voiceover-script.md and voiceover-cues.srt")
