# Mini Animation

A lightweight 2D animation toolkit packaged as a Codex skill. It provides a canvas, unified timeline, layers, cameras, basic transforms, and local MP4/GIF export. Use native Canvas, plain JavaScript, or custom components; JSON composition is optional.

The skill supplies tools and API references without prescribing visual styles, storyboards, pacing, or creative workflows.

## Install in Codex

Ask Codex:

```text
Use $skill-installer to install this GitHub skill:
Repository: kouryu339/mini-animation-skill
Skill path: . (repository root)
Install name: mini-animation
Preserve the references, assets/runtime, and src directories.
```

The install name is explicit because the skill is at the repository root. No npm publication or npm installation is needed to use the bundled runtime. After installation, invoke the skill on the next turn:

```text
Use $mini-animation to create a 10-second animation of a star falling into
an ocean and turning into a glowing jellyfish. Include an HTML player
with MP4/GIF export and an optional subtitle setting.
```

For manual installation, clone the repository into the Codex skills directory:

```sh
git clone https://github.com/kouryu339/mini-animation-skill.git ~/.codex/skills/mini-animation
```

On Windows PowerShell:

```powershell
git clone https://github.com/kouryu339/mini-animation-skill.git "$env:USERPROFILE\.codex\skills\mini-animation"
```

If `CODEX_HOME` is configured, use its `skills/mini-animation` directory instead. `SKILL.md` must sit directly inside that directory, not another nested repository folder. Use a destination that does not already exist.

## Use the Runtime Directly

Copy the complete `assets/runtime/` directory into your project. Its shared modules are required. No package installation or CDN is needed for playback or export.

A host page can import the runtime and provide a synchronous Canvas drawing callback:

```html
<div id="stage" style="width:100%;max-width:960px;aspect-ratio:16/9"></div>
<div id="exports"></div>
<script type="module">
  import {createCanvasAnimation} from './assets/runtime/runtime.js';
  import {mountExportControls} from './assets/runtime/export-controls.js';

  const canvasDrawers = [{draw(ctx, {time, width, height}) {
    ctx.fillStyle = '#101827';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#9ce8d0';
    ctx.beginPath();
    ctx.arc(80 + time.progress * (width - 160), height / 2, 30, 0, Math.PI * 2);
    ctx.fill();
  }}];
  const player = createCanvasAnimation(document.querySelector('#stage'), {
    width:1280, height:720, duration:5000,
  }, {canvasDrawers});
  const controls = mountExportControls(document.querySelector('#exports'), () => ({
    player, options:{canvasDrawers}, filename:'mini-animation',
  }));
  await player.play();
  // On teardown: controls.destroy(); player.destroy();
</script>
```

Serve the project over local HTTP; opening it through `file://` is not supported. Use localhost or HTTPS for browser APIs that require a secure context.

## Capabilities and Boundaries

- Each player owns one timeline, shared by drawing, cameras, captions, and offline export. Drawing uses absolute time for deterministic seeking and replay.
- `canvas` layers follow camera motion; `camera` layers stay fixed to the output frame. Both support multiple layers.
- Static PNG/JPEG/WebP assets, structured Canvas/SVG graphics, transforms, tracks, and custom Canvas drawers are available.
- Export includes progress, cancellation, download, and a separate subtitle option. That option controls runtime captions, not text drawn in the artwork.
- Both export formats are currently silent. MP4 needs browser H.264 encoding support; GIF uses palette quantization and has resource limits.
- Custom JavaScript has page privileges and is not sandboxed. Untrusted prose, JSON, and assets must not be executed as code. DOM outside the runtime rendering path is not automatically exported.

## Reference

- [Skill entry point](SKILL.md)
- [Open Canvas API and lifecycle](references/open-canvas.md)
- [Image and layer data interface](references/authoring.md)
- [Optional helpers](references/helpers.md)
- [Export API](references/export.md)
- [TypeScript model](src/model.ts)
- [Timeline implementation and interfaces](src/timeline.ts)
- [JSON schema](references/animation.schema.json)

## Build the Runtime

Only maintainers changing the runtime source need build dependencies. With a Node.js version supported by Vite 8 (20.19.x or >=22.12):

```sh
npm install
npm run build
```

The build regenerates `assets/runtime/` from `src/`. It does not build a demo application. The existing structured document format remains `rusie.motion/1`.

## Repository Contents

```text
SKILL.md          Codex skill entry point
README.md         Installation and usage
references/       API documentation and JSON schema
src/              TypeScript runtime core
assets/runtime/   Ready-to-use local ES modules
vite.config.ts    Standalone runtime build
package.json      Build dependencies and command
LICENSE           Apache License 2.0
```

No demo scenes, artwork, music, videos, editor application, or project history are included.

## License

[Apache License 2.0](LICENSE).
