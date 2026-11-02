# Rizwan, Halloween edition

A Halloween toy for the team: a holographic, half-machine 3D version of Rizwan on a flying villain's throne, wired by neural threads into his digital command centre and doing a trillion things at once. Click any screen, agent node, the brain, a pumpkin or a candle and he comments, snobbily, mutters some space-time agent lingo, sighs, and then helps. About a third of the time his first idea is a terrible one ("delete production and start a fresh universe"), which he laughs about like a villain and takes straight back before giving the proper answer. Drag him off his throne and he complains all the way, then floats back. Ask him anything in the box and, after a sigh, he answers in character.

The scene is built in the browser with Three.js. He is a real mesh: Tripo H3.1 image-to-3D, run through Higgsfield on the Halloween portrait, 2 million faces packed down to a 3.3 MB GLB (see "The mesh" below). The winged throne, the screens, the agent nodes on their neural threads, the pumpkins, the fog, the bloom and the ambience are built in code, and a procedural figure (glasses, beard, chrome endoskeleton plate, red optic, mechanical forearm) stands in if the model is removed. His voice is ElevenLabs: 156 recorded lines (voice "Timothy Pemberton Smythe", model eleven_v4) ship with the site, and "Talk to him" opens a live ElevenLabs conversational agent with the same voice and persona. Nothing else leaves the page.

## Run

Requires Node 22 or later.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # static site in dist/
npm run preview    # serve dist/
npm test           # browser smoke test against dist/ (build first); screenshots in tests/shots/
```

If Playwright's own browser is not installed, point the test at one you have: `PW_CHROMIUM=/path/to/chrome npm test`.

## Deploy

A ready-built copy lives in `docs/`. In the repository settings, open Pages, choose "Deploy from a branch", pick the branch and the `/docs` folder. The site then lives at `https://<owner>.github.io/Halloween-special/`. If Pages is set to the root folder instead, the root `index.html` forwards to `docs/`, so the site still loads (at `.../Halloween-special/docs/`). Rebuild after any change with `npm run build:docs` and commit the result.

The source page is `site/index.html`; the root `index.html` is only that forwarder.

## Controls

- **Click** a screen, an agent, the brain, a pumpkin, a candle, the throne or him.
- **Drag him** (press on him and move) to carry him away from his work. Release to let him float back.
- **Orbit** by dragging empty space; scroll to zoom. **Reset view** puts the camera back.
- **Make him laugh** does what it says. He catches himself afterwards.
- **Voice** plays his recorded ElevenLabs lines (the browser's own voice fills in for any line without a recording). **Talk to him** loads the live ElevenLabs agent widget so he can answer in his own voice; that is the one thing that reaches outside the page, and only on that click. **Sound** adds wind and a low drone from WebAudio. **Mesh** shows him as wireframe, the GLB included. All of them start only from a click.
- **Ask him something** in the box at the bottom. Try "are you a terminator?", "are you evil?", "delete everything" or "boo".

## His voice

- Lines live in `src/quips.js`: touches, sighs, help, drag, return, idle, and the terminator edition's laughs, lingo, dangerous advice, boot lines and new question-box replies. Recordings live in `public/voice/<id>.mp3`, mapped by text in `src/voice-manifest.json`. A line whose text changes loses its recording until it is regenerated.
- The first 116 lines were generated in thirteen batches on an ElevenLabs flow ("Riz Halloween edition: voice lines"), transcribed with Scribe for word timestamps and cut per line with ffmpeg (about 9,100 credits for speech and 5,600 for the transcripts). The 40 terminator-edition lines were generated one per line on the same flow with eleven_v4 audio tags ([evil laugh], [clears throat], [gleeful], [flat, robotic, posh]), about 4,600 credits, and trimmed with ffmpeg. The manifest keeps each line's direction.
- Chained lines (snob, lingo, sigh, danger or help, laugh) wait for each other: with Voice on, each holds for its recording's length.
- The live agent is "Rizwan, Halloween edition" (`agent_5201m6eq1ew0erk908bj3v1nyd89`): Claude Sonnet 5.5 at temperature 0.6, the same voice, a daily cap of 60 conversations and 4 at once, allowed from rizqureshy.github.io and localhost, low trust context. Its prompt carries the same character: one line of complaint, space-time lingo, an absurd shortcut retracted in the same breath, a short villain laugh, then real and specific help; never genuinely harmful instructions. Conversations are recorded in the ElevenLabs workspace. Edit the persona in the ElevenLabs agent prompt; the page only carries the id.

## The mesh

`public/avatar.glb` is him. It was generated on 2 November 2026 with Tripo H3.1 image-to-3D through the Higgsfield connector (job `507c33da-0c21-447b-bb78-5152bce1890a`, 18 credits: detailed geometry and textures, PBR, orientation aligned to the image) from `assets/reference-figure.png`, which is the Halloween portrait `assets/reference.webp` cropped to the figure and his chair. The raw result is 68.6 MB and 1.98 million faces with base colour, normal and metallic-roughness textures; `scripts/pack-avatar.mjs` simplified it to about 300,000 faces, resized the textures to 2K WebP and meshopt-compressed it to 3.3 MB. Tripo kept his block seat but not the throne back, so the page keeps its own throne back, wings, spikes and rings behind him as a frame (`avatar-glb-throne="seat"`), and turns the model to face the camera (`avatar-glb-yaw="-90"`).

To regenerate or swap him:

1. **Higgsfield.** Run Tripo H3.1 image-to-3D on `assets/reference-figure.png` (or a plain photo as a second view with multiview-to-3D for a closer face). The generation connector can do it from a Claude session; the read-only connector can only list the result afterwards. Download the GLB.
2. **Tripo3D directly.** With an API key from https://platform.tripo3d.ai:

   ```bash
   TRIPO_API_KEY=tsk_... npm run avatar:tripo
   ```

   This uploads the figure crop, runs image-to-model (v3.1, detailed, PBR), keeps the raw download at `assets/avatar-raw.glb` (ignored by git) and packs it into `public/avatar.glb`.
3. **Any other GLB** (Meshy, Hunyuan, a scan).

Then pack it and rebuild:

```bash
npm run avatar:pack -- path/to/model.glb      # simplify, 2K WebP textures, meshopt → public/avatar.glb
npm run build:docs
```

In `site/index.html`: `avatar-glb` names the file (empty content falls back to the procedural figure); `avatar-glb-throne` is `procedural` (he sits on the built throne), `seat` (the model has its own seat, the throne frames it) or `included` (the model is the whole chair); `avatar-glb-yaw` turns the model in degrees. The model is tinted faintly blue as a hologram, joins the Mesh toggle, is poked and dragged like the procedural figure, and the bubble hangs above its head. Head tracking needs a rigged model and is not wired for GLBs. The smoke test checks that the named GLB loads.

## Where things live

```text
site/index.html        the page: canvas, header, bubble, log, question box, GLB slot
index.html             forwards to docs/ for a root Pages deployment
src/main.js            scene, environment, camera, pointer, drag, speech queue, controls, loop
src/avatar.js          the figure and the throne, poses and moods (idle, annoyed, helping, laughing, dragged)
src/world.js           screens, agent nodes, neural threads, brain, pumpkins, candles, fog, lights
src/textures.js        everything painted on canvas: circuits, screens, icons, pumpkin faces
src/quips.js           what he says
src/voice.js           the browser voice and the WebAudio ambience
src/lines-audio.js     the recorded lines and their durations
scripts/tripo-avatar.mjs   reference image → Tripo3D → packed public/avatar.glb
scripts/pack-avatar.mjs    any GLB → web-sized public/avatar.glb
assets/reference.webp  the Halloween portrait
assets/reference-figure.png  the portrait cropped to him and his chair: the image the mesh was generated from
public/avatar.glb      the mesh of him (Tripo H3.1, packed)
tests/smoke.mjs        the browser check
```

Lines are in `src/quips.js`; add a few in your own voice. Keep them fond.
