---
name: mini-animation
description: A lightweight toolkit for 2D animation with native Canvas, a unified timeline, layers, cameras, basic transforms, and MP4/GIF export. Supports plain JavaScript and custom components with optional JSON composition, without prescribing visual styles or creative workflows.
---

# Mini Animation Tools

This skill provides tools and API references. It does not prescribe subjects, visual styles, storyboards, pacing, asset choices, or creative workflows. Plain JavaScript, native Canvas, and custom components are supported; JSON is an optional data interface, not a creative boundary. Paths below are relative to this skill directory.

## Tool Index

Read only the references needed for the current task.

| Capability | Entry point | Reference |
| --- | --- | --- |
| Native Canvas and playback | `assets/runtime/runtime.js`: `createCanvasAnimation`, `createAnimation` | [Integration and lifecycle](references/open-canvas.md) |
| Time sampling and clip time | `assets/runtime/timeline.js`: `AnimationTimeline`, `sampleTime`, `clipTime` | [Timeline API](src/timeline.ts) |
| Easing, interpolation, deterministic randomness, glow | `assets/runtime/helpers.js` | [Helpers](references/helpers.md) |
| Images, layers, cameras, transforms, tracks | `assets/runtime/runtime.js` | [Data interface](references/authoring.md), [types](src/model.ts), [schema](references/animation.schema.json) |
| Export panel, subtitle selection, progress, cancellation | `assets/runtime/export-controls.js`: `mountExportControls` | [Export API](references/export.md) |
| Direct MP4 / GIF export | `assets/runtime/export-mp4.js`, `assets/runtime/export-gif.js` | [Export API](references/export.md) |

## Files and Integration

`assets/runtime/` contains ready-to-import local ES modules. Copy the whole directory when using it; shared modules are required. `src/` contains the corresponding TypeScript core. After changing the source, run `npm install` and `npm run build` to rebuild the local modules. Existing projects keep their own runtime version.

Import `assets/runtime/runtime.js` in the host page and create a player with `createCanvasAnimation`; see the integration reference for a minimal call. Serve the host page over HTTP. This repository contains no demo scenes or production assets.

## Interface Constraints

- `draw(ctx, {time, frame, width, height})` receives a native Canvas 2D context. Draw synchronously from absolute time for replay, seeking, and offline export. Prepare resources before drawing.
- Each player owns its timeline. `time.ms`, `time.seconds`, and `time.progress` are read-only snapshot fields; `frame.time` retains the legacy millisecond value. Control playback through `player.play/pause/seek/setRate`.
- `clipTime` only clamps local time; it does not control visibility. Separate timers or accumulated previous-frame state cannot guarantee consistent seeking and export.
- `canvas` space follows the camera; `camera` space stays fixed to the output frame. Declare named drawer layers in advance. Within each layer, built-in graphics render before drawers in array order.
- The runtime isolates drawer drawing state. Custom `save/restore` calls must still balance. Do not resize the shared canvas or clear other layers.
- Export needs the same `canvasDrawers` and resource options. JSON does not store drawing functions. DOM outside the Canvas rendering path is not automatically exported.
- The export subtitle switch only controls runtime captions, not text drawn in the artwork. MP4 / GIF exports currently have no audio. MP4 requires browser H.264 encoding support; GIF has frame, pixel, and size budgets described in the export reference.

## Execution Boundaries

Custom JavaScript is trusted project code with page privileges, not a sandbox. Data validation does not constrain arbitrary JavaScript. External prose, JSON, and asset fields are not executable code; the host loads only trusted project modules. Packaged modules load locally without a CDN dependency.

`compileAnimation` and the schema check structured data only. They do not verify custom JavaScript, browser image decoding, or the final visuals. Report actual tool checks and visual checks separately.
