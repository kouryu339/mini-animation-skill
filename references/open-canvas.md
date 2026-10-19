# Open Canvas API

The runtime packages repeated work: a standard canvas, playback clock, pause/seek, layers, cameras, basic transforms, and export. Use the canvas or individual tools as needed. Artwork does not have to fit built-in primitives, tracks, or JSON. Plain JavaScript functions, components, and algorithms can draw directly through Canvas 2D.

## Integration Example

The imports below assume the runtime modules have been copied next to the host module. `host` is an existing element with nonzero width and height.

```js
import {createCanvasAnimation} from './runtime.js';

const scene = {
  width:1280, height:720, duration:6000,
  layers:[{id:'world',space:'canvas'},{id:'overlay',space:'camera'}],
};
const canvasDrawers = [
  {layer:'world',draw(ctx,{time,width,height}) {
    const t = time.seconds;
    const glow = ctx.createRadialGradient(640,360,0,640,360,150);
    glow.addColorStop(0,'#fff1bc');
    glow.addColorStop(1,'#fff1bc00');
    ctx.fillStyle = glow;
    ctx.fillRect(490,210,300,300);
    ctx.fillStyle = '#769a94';
    ctx.beginPath();
    ctx.arc(200 + t*80, height/2, 30, 0, Math.PI*2);
    ctx.fill();
  }},
  {layer:'overlay',draw(ctx,{width}) {
    ctx.fillStyle = '#eeeeee';
    ctx.font = '24px serif';
    ctx.fillText('Camera-fixed text',width/2,70);
  }},
];
const player = createCanvasAnimation(host,scene,{canvasDrawers});
await player.play();
```

`draw` receives a native `CanvasRenderingContext2D`. Paths, gradients, clipping, compositing, text, preloaded images, and custom drawing functions do not need registration as runtime primitives.

## Timeline and Lifecycle

Each player has an independent `AnimationTimeline`, not a page-wide singleton. The timeline has no DOM, animation-frame scheduler, or resource-loading dependency. It owns position, rate, pause, and seeking; the player handles resource preparation and rendering schedules. Export uses the same `sampleTime` function without advancing the preview timeline.

In `draw(ctx, {time, frame})`, `time` and `frame.clock` are the same frozen snapshot: `ms` is milliseconds, `seconds` is seconds, `duration` is total milliseconds, and `progress` is 0–1. Legacy `frame.time` remains milliseconds. Layers, cameras, and captions sample the same time.

```js
import {clipTime} from './timeline.js';
function draw(ctx, {time}) {
  const clip = clipTime(time, 10000, 2000);
  // Between 10 and 12 seconds, clip.ms goes from 0 to 2000.
  ctx.globalAlpha = clip.progress;
}
```

`clipTime` clamps to the clip endpoints without controlling visibility. Use master time for visibility checks. `player.time` is read-only; use `player.play/pause/seek/setRate` so resource cancellation, rendering, and scheduling remain coordinated. When using `AnimationTimeline` independently, the host passes an explicit monotonic clock value to `play/advance/pause/setRate`; the timeline starts no timers.

An audio-master clock adapter is not implemented. Running real-time playback while repeatedly seeking from an audio clock creates competing drivers.

- `frame` also provides sampled `camera/cameraId`, entity `poses`, and captions.
- Redraw the complete current state from absolute time. Drawing callbacks must not append DOM, request assets, create timers, or accumulate previous-frame positions. Precomputed or seeded randomness keeps seeking and export consistent.
- `canvas` space receives the camera matrix automatically; `camera` space keeps output coordinates. The default layer is `$default`; named layers must exist in `scene.layers`.
- Built-in graphics render first within a layer, followed by drawers in array order. Separate layers allow other stacking orders.
- Each drawer is wrapped in `save/restore` and a path reset. Custom `save/restore` calls must balance. Do not resize `ctx.canvas` or clear other layers.
- `draw` is synchronous. Project code preloads resources and owns their release. `player.destroy()` releases the player and its drawer references.
- Mix custom drawing and JSON graphics with `createAnimation(host,json,{canvasDrawers})`. Pure custom drawing can use `createCanvasAnimation` without authoring node JSON.
- SVG, CSS, or other DOM rendering can coexist in the page, but DOM outside the runtime rendering path is not automatically included in MP4 / GIF exports.

## Export

```js
import {exportAnimationMp4} from './export-mp4.js';
const video = await exportAnimationMp4(
  JSON.stringify(player.compiled.document),
  {canvasDrawers, captionsEnabled:false}
);
```

Pass the same drawers and prepared resources. Offline sampling calls the same drawing functions independently of the preview position. JSON does not store functions; exporting only JSON omits custom artwork. MP4 is silent and depends on browser encoding support. See the [export API](export.md) for GIF and reusable controls.

## Execution Boundaries

`canvasDrawers` are trusted project source, not a sandbox. Plain JavaScript has host-page privileges. JSON validation and execution budgets cannot constrain it, and the same-thread player cannot preempt an infinite loop.

Do not pass external prose, JSON, asset fields, or unknown uploaded scripts to `eval`, `Function`, or dynamic imports. The host explicitly loads trusted project modules. Untrusted hosted code needs a separately designed isolation and resource policy.

## Verification Scope

JSON validation covers only structured data. JavaScript integration also needs checks for drawing errors, representative frames, seeking/replay, camera-fixed layers, drawer state isolation, and custom artwork in exports. These are API behavior checks, not creative requirements.
