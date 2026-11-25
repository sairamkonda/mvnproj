I'm making a vertical Telugu explainer reel about Godavari Pushkaralu 2027 for my channel "The Ramu Swift Facts". A first version exists in this repo, but I don't like its visuals or colours. Build a new version with a fresh visual style, keeping the script, facts, voice approach and branding below.

## Repo and what to reuse
Repo `sairamkonda/mvnproj`, branch `ccr-836bd842-8urh3l` (`git fetch origin ccr-836bd842-8urh3l && git checkout ccr-836bd842-8urh3l`), folder `claude-videos/godavari-pushkaralu-2027/`. Read its README first. Reuse what helps:
- `assets/the-ramu-swift-facts-logo.webp`: my logo (white/green/yellow on navy).
- `tools/voice_clone.py` and `tools/fluent_ref.py`: voice cloning with AI4Bharat IndicF5. This works; read the comments.
- `tools/mix.py` (soundtrack: tanpura drone, bells, effects, ducking), `tools/brand.py` (logo badge and end card), `data/map.json` (Natural Earth state outlines and the Godavari course, public domain).
- Do NOT reuse the old low-poly 3D look or its colours.

## Output
- 1080×1920, 30 fps, H.264 with AAC 48 kHz, about 1.5–2 minutes, loudness −14 LUFS (true peak ≤ −1.5 dB), under 50 MB.
- Also export a music-and-effects-only version (for re-recording the voice) and an .srt of the captions.

## Visual style: ask me first
Before building, propose 3 clearly different visual styles and show me one 1080×1920 still per style for scenes 1, 7 and 13. Wait for my pick, then build every scene in that style.
- Keep text inside the safe area: the top ~250 px and bottom ~400 px are covered by the Reels/Shorts UI, and the right edge has buttons.
- Only use visuals you create or that are clearly licensed for reuse. Don't imitate any government logo or emblem.

## Captions and on-screen text
- Word-by-word captions synced to the voice, with the current word highlighted.
- Telugu script in the **Ramabhadra** font (Google Fonts / `@fontsource/ramabhadra`, OFL). Keep these in English letters: numbers, the email address, and English words (creative, person, logo, and, tagline, design, first, second, third, prize, one, lakh, thousand, last date, November, June, July, mail, life, comments).
- Each scene has a short bold English title (and the Telugu subtitle where given below).
- Small disclosure tag on scenes: "Illustration", "Recreation" (2015 scenes), or "Map: Natural Earth (public domain)" on map scenes.

## Branding
My logo as a small badge in the top-right of every scene, and a ~2 s end card with the logo on its navy background.

## Voice: my own cloned voice, in Telugu
- Clone with IndicF5 (Hugging Face `ai4bharat/IndicF5`, MIT licence, gated; I've accepted the terms). Log in with `huggingface-cli login`.
- Reference clip: my recording "Sample_rec2" (I'll give you the file). Its exact transcript: పన్నెండు సంవత్సరాలకు ఒక్కసారి వచ్చే ఈ పండుగకి, లక్షలాది మంది భక్తులు నదీ స్నానం చేయడానికి వస్తారు.
- Lessons from the first attempt (important):
  1. Don't set the model's `speed` below ~0.95, and don't time-stretch heavily. When given extra time, the model fills it by repeating the end of my sample ("…స్నానం చేయడానికి వస్తారు") at the start of lines. Generate at natural speed.
  2. Keep ~0.45 s of silence at the end of the reference clip. The default preprocessing strips it, so don't use it.
  3. My sample was read slowly with pauses, and the model copies that rhythm. Shorten the pauses inside the reference (`tools/fluent_ref.py`) and cap long pauses in the output at ~0.2 s. I want smooth, conversational, slightly fast reel delivery, not a pause after every word.
  4. Check every clip automatically for the repeated sample ending (MFCC-DTW against the sample's last 2 s: clean clips score about 4+, leaks about 3.4 or lower) and regenerate any that leak. Whisper is unreliable on Telugu numbers, so don't rely on it alone.
  5. In the text sent to the voice, spell numbers as Telugu words (captions still show digits) and spell the email for speech: గోదావరి పుష్కరాలు టీ జీ ఎట్ జీమెయిల్ డాట్ కామ్.
  6. Use a GPU if there is one. On CPU, bfloat16 autocast is fast, but run the Vocos vocoder in float32.
- Send me a one-scene voice preview and wait for my OK before generating all scenes.
- Never commit my voice recordings to the repo.

## Script: final, 18 scenes
Narration exactly as written (Telugu script). Visual notes are ideas to adapt to the new style; keep the sync points.

| # | Title (Telugu subtitle) | Narration | Visual and sync |
| --- | --- | --- | --- |
| 1 | LOGO & TAGLINE CONTEST, kicker "TELANGANA ENDOWMENTS DEPT" (గోదావరి పుష్కరాల లోగో పోటీ) | మీరు క్రియేటివ్ పర్సన్ ఆ? అయితే గోదావరి పుష్కరాలు కి లోగో అండ్ ట్యాగ్‌లైన్ డిజైన్ చేస్తే — లక్ష రూపాయలు గెలిచే అవకాశం! | Hook in the first 2 s. A logo frame over the Godavari; a wave-and-diya mark sketches itself in; "RS 1,00,000" bursts in on "లక్ష". |
| 2 | TOP 3 PRIZES: RS 1 LAKH · 50,000 · 25,000 | ఫస్ట్ ప్రైజ్ వన్ లాక్, సెకండ్ ప్రైజ్ 50 థౌజండ్, థర్డ్ ప్రైజ్ 25 థౌజండ్. | Three prize amounts appear as each is said. |
| 3 | LAST DATE: 30 NOVEMBER, 5 PM (నవంబర్ 30 సాయంత్రం 5 గంటల లోపు) | అయితే లాస్ట్ డేట్ నవంబర్ 30 సాయంత్రం ఐదింటి లోపు, godavaripushkaralutg@gmail.com కి మెయిల్ చేయండి. | Calendar on 30 Nov 2026, clock at 5:00. Email card on screen for at least 3.5 s so people can screenshot it. |
| 4 | ASALU PUSHKARALU ANTE? | అసలు ఈ పుష్కరాలు ఏంటి? ఎందుకు ఇంత పెద్ద పండుగలాగా జరుపుకుంటాం? | Transition into the river on the last word. |
| 5 | ONCE IN 12 YEARS: GODAVARI PUSHKARALU | పన్నెండు సంవత్సరాలకు ఒక్కసారి వచ్చే మహా పండుగ — గోదావరి పుష్కరాలు. | Sunrise on the river, temple gopuram, floating diyas. |
| 6 | WHY 12 YEARS? JUPITER ENTERS SIMHA | గురు గ్రహం సింహ రాశి లోకి ప్రవేశించినప్పుడు, గోదావరి కి పుష్కరాలు వస్తాయి. | Jupiter moving into Simha (Leo) on a zodiac wheel; labels JUPITER, SIMHA RAASI. |
| 7 | THE RIVER: DAKSHINA GANGA | మహారాష్ట్ర నుంచి తెలంగాణ, ఆంధ్ర మీదుగా సముద్రం వరకు — దక్షిణ గంగ గోదావరి. | Map of Maharashtra, Telangana and Andhra Pradesh; the river line draws to the sea. Pins: Basara, Dharmapuri (highlighted), Bhadrachalam, Rajahmundry. |
| 8 | THE BELIEF: A HOLY DIP | ఈ పన్నెండు రోజుల్లో స్నానం చేస్తే, పాపాలు పోతాయని నమ్మకం. | Devotees on ghat steps taking a dip. |
| 9 | 14 – 25 JULY 2015: MAHA PUSHKARAM (Recreation) | 2015 లో జరిగింది మహా పుష్కరం — 144 సంవత్సరాలకు ఒక్కసారి వస్తుందని నమ్మకం. | Calendar on 14 July 2015. |
| 10 | 2015: OVER 10 CRORE DIPS (Recreation) | పన్నెండు రోజుల్లో పది కోట్ల మంది పైగా పుష్కర స్నానం చేశారు. | Huge crowds; counter ticking to 10,00,00,000+. |
| 11 | ADI PUSHKARALU: 26 JUNE – 7 JULY 2027 (2027 జూన్ 26 నుంచి జూలై 7 వరకు) | ఇప్పుడు మళ్ళీ 2027 లో — జూన్ 26 నుంచి జూలై 7 వరకు. | Calendar on 26 June 2027, festive marigolds. |
| 12 | TELANGANA PLAN: 96 LOCATIONS · 8 CRORE DEVOTEES | తెలంగాణ లో తొంభై ఆరు ప్రదేశాలు, ఎనిమిది కోట్ల మంది భక్తులు వస్తారని అంచనా. | Telangana map with 96 pins popping up along the river. |
| 13 | JAGTIAL DISTRICT: DHARMAPURI (ధర్మపురి) | మన ధర్మపురి లో గోదావరి దక్షిణ వాహిని గా ప్రవహిస్తుంది — అందుకే ఇక్కడ స్నానం ఎంతో పుణ్యం. | The river visibly turns to flow SOUTH past the Dharmapuri ghat; label DAKSHINA VAHINI. |
| 14 | DHARMAPURI: SRI LAKSHMI NARASIMHA SWAMY | శ్రీ లక్ష్మీ నరసింహ స్వామి దర్శనం, గోదావరి స్నానం — రెండు ఒక్కచోటే. | Temple in lamplight, bells, devotees walking up from the ghat. |
| 15 | DHARMAPURI WORKS: RS 226 CRORE · 470 M NEW GHATS | ధర్మపురి లో నాలుగు వందల డెబ్బై మీటర్ల కొత్త ఘాట్లు, రెండు వందల ఇరవై ఆరు కోట్ల పనులు. | New ghat steps with a 470 m measuring line. |
| 16 | ON KUMBH MELA LINES: RS 1,000 CRORE WORKS | కుంభ్ మేళా లాగా, వెయ్యి కోట్ల రూపాయలతో పని మొదలైంది. | Construction: cranes, CCTV poles, barricades, tent city. |
| 17 | 2028: ANTYA PUSHKARALU | చివరి అంత్య పుష్కరాలు 2028 జూలై లో. | A single diya floating away at sunset. |
| 18 | DHARMAPURI LO KALUDDAAM (ధర్మపురిలో కలుద్దాం!) | మీరు మీ లైఫ్ లో ఎన్ని పుష్కరాలు చూశారు, వెళ్ళారు? కామెంట్స్ లో పెట్టండి. | Godavari Harathi at night on the ghat. Lower third: "Logo contest - last date 30 Nov, 5 PM". |

## Facts (checked November 2026) and what to leave out
- Contest by the Telangana Endowments Department: logo plus tagline (max 5 words), individuals or teams of up to 3. Prizes ₹1,00,000 / ₹50,000 / ₹25,000. Entries by 30 Nov 2026, 5 PM, to godavaripushkaralutg@gmail.com (The Hans India).
- Godavari Pushkaralu 2027: 26 June – 7 July 2027 (AP government order and latest reports; some older reports said 23 July – 3 August). Antya Pushkaralu: 13–24 July 2028.
- 2015 Maha Pushkaram: 14–25 July 2015, 10–11 crore dips. The "once in 144 years" claim is a disputed belief, so the script phrases it as a belief.
- Telangana plan: 96 locations, about 8 crore devotees, ₹1,000 crore allocated, organised on Kumbh Mela lines. One later headline says ₹1,115 crore was sanctioned; check this if you can. Dharmapuri: ₹226 crore and 470 m of new ghats (Deccan Chronicle).
- At Dharmapuri the Godavari flows north to south, so it is **Dakshina Vahini** (not Uttara Vahini). Show it flowing south there.
- Do NOT include the 2015 Rajahmundry stampede or any deaths.

## How to work with me
1. Read the repo folder and its README.
2. Show me 3 style stills; wait for my choice.
3. Send a one-scene voice preview; wait for my OK.
4. Build, render, check the result (frames, caption sync, loudness), and send me the video.
5. Ask before committing large files; never commit my voice recordings.
