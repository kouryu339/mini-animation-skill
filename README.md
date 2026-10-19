# Mini Animation

A lightweight 2D animation toolkit packaged as a portable Agent Skill for Codex, Claude Code, WorkBuddy, and other coding assistants. It provides a canvas, unified timeline, layers, cameras, basic transforms, and local MP4/GIF export. Use native Canvas, plain JavaScript, or custom components; JSON composition is optional.

The skill supplies tools and API references without prescribing visual styles, storyboards, pacing, or creative workflows.

## Installation Overview

The same `SKILL.md`, references, source, and bundled runtime are used across hosts. Installation and invocation depend on the assistant:

| Assistant | Installation | Invocation |
| --- | --- | --- |
| Codex | Skill installer or `~/.codex/skills/mini-animation/` | `$mini-animation` |
| Claude Code | `~/.claude/skills/mini-animation/` or project `.claude/skills/mini-animation/` | `/mini-animation` |
| WorkBuddy | Import a local skill ZIP through the Skills UI | Enable the installed skill and request it by name |
| Other assistants | Use the host's documented Skill import/directory, or load `SKILL.md` explicitly | Use the host's invocation syntax or a plain-language request |

No npm publication or npm installation is needed to use the bundled runtime. Keep `SKILL.md` at the skill root and preserve `references/`, `assets/runtime/`, and `src/`. Host-specific automatic discovery and execution permissions still apply.

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

## Install in Claude Code

For a personal skill available across local projects:

```sh
git clone https://github.com/kouryu339/mini-animation-skill.git ~/.claude/skills/mini-animation
```

On Windows PowerShell:

```powershell
git clone https://github.com/kouryu339/mini-animation-skill.git "$env:USERPROFILE\.claude\skills\mini-animation"
```

For a project-only skill, run this from the project root instead:

```sh
git clone https://github.com/kouryu339/mini-animation-skill.git .claude/skills/mini-animation
```

Choose one scope and a destination that does not already exist. After Claude Code discovers the skill, invoke it with:

```text
/mini-animation Create a 10-second animation of a star falling into an ocean
and turning into a glowing jellyfish. Include an HTML player with MP4/GIF
export and an optional subtitle setting.
```

Claude Code supports personal and project Skill directories and `/skill-name` invocation. See the [official Claude Code skills documentation](https://code.claude.com/docs/en/skills). These local directory instructions do not install an account-level skill for cloud or Cowork sessions.

## Install in WorkBuddy

WorkBuddy documents custom skill installation through local package upload. It does not require a Codex installer or Claude Code's slash-command syntax.

1. Clone or download this repository.
2. Create a ZIP with `SKILL.md`, `references/`, `assets/runtime/`, `src/`, and `LICENSE` at its root. Preserve relative paths; do not upload only `SKILL.md`.
3. Open WorkBuddy's Skills area, choose **Add skill > Upload skill**, and select the local ZIP.
4. Confirm `mini-animation` appears in the installed list and is enabled, then request it by name in a conversation.

From a Git checkout, this command creates the package from the current committed version, excluding Git metadata, build dependencies, and unrelated files:

```sh
git archive --format=zip --output=../mini-animation.zip HEAD SKILL.md references assets/runtime src LICENSE
```

Example request:

```text
Use the installed mini-animation skill to create a 10-second animation of
a star falling into an ocean and turning into a glowing jellyfish. Create
an HTML player with MP4/GIF export and an optional subtitle setting.
```

See WorkBuddy's [official skill installation and upload documentation](https://www.workbuddy.cn/docs/workbuddy/From-Beginner-to-Expert-Guide/Function-Description/Skills-Market). Conversation-based marketplace installation is separate from importing this custom GitHub package; these instructions do not imply a WorkBuddy marketplace listing.

## Other Coding Assistants

For assistants supporting directory-based Agent Skills, copy this complete skill into the location documented by that host. Do not assume Codex's `$mini-animation` or Claude Code's `/mini-animation` syntax is universal.

Without native Skill discovery, keep the repository accessible to the assistant and explicitly ask it to read `SKILL.md`:

```text
Read <local-path>/mini-animation/SKILL.md and use its local runtime to build
the requested animation. Resolve references relative to that directory.
```

The assistant needs access to project files and the ability to author JavaScript/HTML. Playback and export run in a browser; browser verification needs a suitable browser tool or a person opening the result. A text-only assistant cannot execute or verify the runtime itself.

The runtime and README integration example have been checked locally in Chrome. Claude Code and WorkBuddy installation routes above follow their official documentation; this repository has not been tested end to end inside those hosts. Other hosts require their own discovery and execution checks.

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
SKILL.md          Portable Agent Skill entry point
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
