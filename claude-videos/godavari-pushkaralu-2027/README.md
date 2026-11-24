# Godavari Pushkaralu 2027 — explainer reel

A 1080×1920, 30 fps vertical video with Telugu narration in the creator's own (cloned) voice and
word-by-word captions, rendered from the storyboard in [`scenes.json`](scenes.json).

**Output:** [`godavari-pushkaralu-2027.mp4`](godavari-pushkaralu-2027.mp4)

| | |
| --- | --- |
| Visuals | Low-poly 3D built in code with three.js, rendered headless in Chromium |
| Voice | The creator's own voice, cloned from a short sample with AI4Bharat [IndicF5](https://huggingface.co/ai4bharat/IndicF5) (MIT) in [`tools/voice_clone.py`](tools/voice_clone.py). Word timings for the captions come from pauses in the speech and word lengths. The earlier synthetic voice (Meta MMS-TTS, CC-BY-NC) is still made by `tools/tts.py`. |
| Captions | Telugu script in Ramabhadra, word by word, current word in orange with a white outline. Numbers, the email address and a few English words (logo, tagline, design, month names, comment) stay in English letters; the list is `keep_english` in `narration.json` |
| Music and effects | Synthesized in [`tools/mix.py`](tools/mix.py): tanpura drone, temple bells, drum pulse, whooshes |
| Map data | [Natural Earth](https://www.naturalearthdata.com/) 1:10m (public domain), simplified in `data/map.json` |
| Fonts | Ramabhadra for Telugu text; Anton and Inter for English titles and labels (all SIL Open Font License, via Fontsource) |
| Branding | The Ramu Swift Facts logo (`assets/`) as a corner badge on every scene and a 2-second end card |

## Check before publishing

- **Scene 16 narration:** the original script said *nalugu vandala muppai*
  (430 m), but the title, callout and source say 470 m. The voice says
  *debbai* (470) to match. Change it in `narration.json` if 430 was intended.
- **Scene 11:** no death toll appears on screen. The storyboard note asks to verify
  the official figure before publishing if one is added.
- **Voice:** AI-generated from the creator's sample. Listen through for
  mispronunciations, especially English words (logo, tagline, design, gmail)
  and numbers, and for words the captions highlight early or late.
- **Voice samples** are personal data and are not stored in this repository.

## Re-recording the voice

[`voiceover-script.md`](voiceover-script.md) has the narration line for every scene with its time
window and sync points; [`voiceover-cues.srt`](voiceover-cues.srt) has the same windows as subtitle
cues. Record one clip per scene and lay them over the music-and-effects-only version
(`OUTRO=2.2 VOICE=0 python tools/mix.py`, then swap that audio onto the video).

## Rebuild

```bash
npm install                      # three.js and fonts
pip install torch transformers scipy numpy
python tools/tts.py              # synthetic narration + word timings -> build/ (or, for a cloned voice:)
INDICF5_DIR=<IndicF5 snapshot> python tools/voice_clone.py --ref sample.wav --ref-text "<exact words>"
#   then copy build/audio_clone/* over build/audio/ and build/audio_clone/timeline.json to build/timeline.json
node render.mjs stills --scenes 1,7 --at 0.2,0.9   # preview frames -> build/stills/
python tools/brand.py            # logo badge + end card -> build/brand/
OUTRO=2.2 python tools/mix.py    # soundtrack incl. end card -> build/audio/mix.wav
node render.mjs video --workers 3                  # full render, watermark, end card, mux
```

`render.mjs` serves `web/` locally, drives `window.api.frame(t)` in headless
Chromium and pipes JPEG frames into ffmpeg. Each scene lives in
`web/scenes_a.js` (1–7), `web/scenes_b.js` (8–13) and `web/scenes_c.js` (14–19).
Shared models (water, ghats, gopuram, diyas, people, calendar) are in
`web/kit.js`. The text layer is in `web/overlay.js`.

| File | What it holds |
| --- | --- |
| `scenes.json` | The storyboard (titles, narration, visual notes, sources) |
| `narration.json` | Telugu-script text for the voice, paired word-for-word with the captions |
| `data/map.json` | State outlines and the Godavari course |
| `build/` | Generated audio, timings, stills and segments (not committed) |
