# HTML Export API

`mountExportControls` provides an MP4 / GIF panel with an independent Include subtitles option, progress, cancellation, and a download link.

```js
import {mountExportControls} from './export-controls.js';
const controls = mountExportControls(host, () => ({
  player,
  options: {canvasDrawers}, // The same drawers, asset resolver, and caption style.
  filename: 'my-animation',
}));
// On teardown, controls.destroy() cancels export and releases the download URL.
```

When first opened, the panel initializes its subtitle setting from the preview, then allows independent selection. Starting export pauses the current preview without seeking or resetting it. Export samples the entire animation from zero rather than recording the screen or page controls. Switching preview projects does not replace an export source already captured at the start of a job.

Disabling subtitles only removes runtime narration captions. Titles, chart labels, and other text drawn in the artwork remain. JSON graphics and Canvas drawers are supported; unrelated DOM is not captured.

- MP4: panel defaults to 720p, 30 fps, silent. Requires browser WebCodecs support for H.264 encoding. Errors are shown without silently changing formats.
- GIF: panel defaults to 480 pixels wide, 10 fps, looping, and silent. Each frame uses up to 256 colors, with reduced fidelity. The API also supports widths of 320/640 and 15 fps.
- Both formats are generated locally with dynamically loaded local modules; no CDN, upload, or screen recording is required.
- Encoding proceeds frame by frame and can be cancelled. GIF is limited to 1,800 frames, 300 million output pixels across all frames, and 128 MiB of encoded data. Exceeding limits produces an error. Raw RGBA frames are processed individually rather than retaining the entire animation.

## Direct Calls

```js
import {exportAnimationGif} from './export-gif.js';
const gif = await exportAnimationGif(JSON.stringify(player.compiled.document), {
  canvasDrawers,
  captionsEnabled: false,
  fps: 10, maxWidth: 480,
  signal: abortController.signal,
  onProgress(value) { /* 0–1 */ },
});
```

MP4 uses `exportAnimationMp4`; its options support fps 24/30 and maxHeight 720/1080. Custom functions are trusted code and must redraw synchronously from absolute time. Both exporters share frame rendering, image decoding, and caption composition. Mutations to user-owned closure state remain outside player control.

GIF uses per-frame local palettes and LZW, following the [GIF89a specification](https://www.w3.org/Graphics/GIF/spec-gif89a.txt). Palette quantization can alter gradients and similar colors.
