# Riz, Halloween edition

A Halloween toy for the team: a holographic 3D version of Riz, wired into his digital command centre and floating at work. Click any screen, agent node, the brain, a pumpkin or a candle and he comments, snobbily, then sighs and actually helps. Drag him away from his desk and he complains all the way, then floats back. Ask him anything in the box and, after a sigh, he answers in character.

The scene is built in the browser with Three.js: the figure, the throne, the screens, the agent nodes on their neural threads, the pumpkins, the fog, the bloom and the ambience. His voice is ElevenLabs: 116 recorded lines (voice "Timothy Pemberton Smythe", model eleven_v4) ship with the site, and "Talk to him" opens a live ElevenLabs conversational agent with the same voice and persona. Nothing else leaves the page.

## Run

Requires Node 22 or later.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # static site in dist/
npm run preview    # serve dist/
npm test           # browser smoke test against dist/ (build first); screenshots in tests/shots/
```

## Deploy

A ready-built copy lives in `docs/`. In the repository settings, open Pages, choose "Deploy from a branch", pick `main` and the `/docs` folder. The site then lives at `https://<owner>.github.io/Halloween-special/`. Rebuild after any change with `npm run build:docs` and commit the result.

## Controls

- **Click** a screen, an agent, the brain, a pumpkin, a candle, the throne or him.
- **Drag him** (press on him and move) to carry him away from his work. Release to let him float back.
- **Orbit** by dragging empty space; scroll to zoom. **Reset view** puts the camera back.
- **Voice** plays his recorded ElevenLabs lines (the browser's own voice fills in for any line without a recording). **Talk to him** loads the live ElevenLabs agent widget so he can answer in his own voice; that is the one thing that reaches outside the page, and only on that click. **Sound** adds wind and a low drone from WebAudio. **Mesh** shows him as wireframe. All of them start only from a click.
- **Ask him something** in the box at the bottom.

## His voice

- Lines live in `src/quips.js`. Recordings live in `public/voice/<id>.mp3`, mapped by text in `src/voice-manifest.json`. A line whose text changes loses its recording until it is regenerated.
- They were generated in thirteen batches on an ElevenLabs flow ("Riz Halloween edition: voice lines"), transcribed with Scribe for word timestamps, and cut per line with ffmpeg. About 9,100 credits for speech and 5,600 for the transcripts.
- The live agent is "Riz, Halloween edition" (`agent_5201m6eq1ew0erk908bj3v1nyd89`): Claude Sonnet 5.5 at temperature 0.6, the same voice, a daily cap of 60 conversations and 4 at once, allowed from rizqureshy.github.io and localhost, low trust context. Conversations are recorded in the ElevenLabs workspace. Edit the persona in the ElevenLabs agent prompt; the page only carries the id.

## Making him more like the real one

The figure is procedural (see `src/avatar.js`): glasses, beard, neural headset, circuit coat, gauntlets, floating throne, with head and eye tracking and three moods (idle, annoyed, helping) plus the drag flail. To use a real meshed model instead:

1. Generate or scan a GLB of him. The reference image in this project's brief works well with an image-to-3D model such as Tripo (through Higgsfield) or any photogrammetry pipeline. A seated or standing figure both work; the throne stays.
2. Put the file in `public/` (for example `public/avatar.glb`).
3. In `index.html`, set `<meta name="avatar-glb" content="avatar.glb" />`.

The model is scaled to about 2.1 units tall and seated on the throne; the procedural body hides, the moods still move the throne, threads and bubble. Head tracking needs a rigged model and is not wired for GLBs.

## Where things live

```text
index.html         the page: canvas, header, bubble, log, question box
src/main.js        scene, camera, pointer, drag, bubble, controls, loop
src/avatar.js      the figure and the throne, poses and moods
src/world.js       screens, agent nodes, neural threads, brain, pumpkins, candles, fog, lights
src/textures.js    everything painted on canvas: circuits, screens, icons, pumpkin faces
src/quips.js       what he says: touches, sighs, help, dragging, idle, the question box
src/voice.js       the browser voice and the WebAudio ambience
tests/smoke.mjs    the browser check
```

Lines are in `src/quips.js`; add a few in your own voice. Keep them fond.
