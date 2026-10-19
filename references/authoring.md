# Image and Layer Data Interface

This reference covers optional structured data using `rusie.motion/1`. Free-form JavaScript drawing is documented in the [open Canvas API](open-canvas.md). Artwork does not have to use JSON or built-in primitives.

## Coordinate Spaces

- `canvas`: entities follow the active camera's position, zoom, and cuts.
- `camera`: coordinates use the output width/height and stay fixed to the output frame, unaffected by camera motion, view dimensions, or cuts. The entity's own transform can still animate.

`layers` declares up to 64 layers. All canvas layers render before all camera layers; each space follows declaration order from back to front. Entities without a layer use the bottom default canvas layer. Camera-space layers belong to the whole animation, not an individual camera, so cuts do not clear them.

Only root Canvas nodes may declare a layer; descendants inherit their root's space and stacking position. In SVG, only top-level shapes or groups under the source root may declare a layer. Each layer preserves entity order. Containers can animate groups through their transforms.

Legacy `effects` remain a separate post-processing overlay; captions remain a separate viewing preference. Effects that must appear below a camera-space layer need ordinary graphics or image entities rather than the legacy overlay.

## Image Assets

```json
{
  "assets": {
    "panel": {"type":"image","src":"images/panel.png"},
    "alternate": {"type":"image","src":"images/panel-alternate.png"}
  },
  "layers": [
    {"id":"scenery","space":"canvas"},
    {"id":"foreground","space":"canvas"},
    {"id":"labels","space":"camera"},
    {"id":"transition","space":"camera"}
  ]
}
```

This is a top-level field fragment. Static PNG, JPEG, and WebP are supported, including transparent PNG/WebP. The structured image loader rejects APNG, animated WebP, GIF, image scripts, and external SVG. Vector SVG uses the restricted `surface.source` interface.

Canvas image entity:

```json
{"id":"panelImage","layer":"scenery","components":{
  "transform":{"x":120,"y":80},
  "graphic":{"type":"image","asset":"panel","width":1000,"height":560,"fit":"contain"}
}}
```

`contain` (default) centers the whole image; `cover` centers and crops to fill; `stretch` resizes freely. Image entities support x/y/rotate/scale/opacity and width/height tracks. Opacity 0/1 controls visibility; interpolated opacity produces fades. Images do not have an independent playback clock.

Equivalent SVG:

```xml
<image id="panelImage" href="asset:panel" x="120" y="80"
       width="1000" height="560" preserveAspectRatio="xMidYMid meet"/>
```

Assign space through `{"id":"panelImage","layer":"scenery"}` in `surface.entities`. Supported `preserveAspectRatio` values are `xMidYMid meet`, `xMidYMid slice`, and `none`. Image href values must reference declared asset IDs, not URLs, data URLs, blob URLs, or file paths.

## Trusted Hosts and Resource Lifecycle

By default, `src` resolves relative to the host page. When loading a separate JSON document, pass its URL as `assetBaseURL` to playback and export APIs. Remote origins, redirects, URL schemes, query strings, encoded bypasses, and `..` paths are rejected.

Project bundles, desktop files, or offline caches can use a trusted host callback, `resolveImage(id, asset, signal): Promise<Blob>`, that resolves safely within the project root. The callback is host code and cannot appear in JSON. It must honor cancellation and avoid forwarding author paths to unrestricted filesystem access.

`await player.prepare()` validates/decodes images and redraws the current frame; `play()` also waits for preparation. Repeated preparation shares one loading task. Playback and seeking do not refetch prepared images. `destroy()` aborts pending resources and releases references. Missing/invalid images report errors with the asset ID instead of silently producing blank frames.

Limits: 8 MiB per image; maximum 4096 pixels per side and 4,194,304 pixels per image; up to 32 images with a combined 32 MiB of files and 16,777,216 decoded pixels. Headers and dimensions are checked before decoding, rather than trusting extensions or MIME types. Resource preparation has a 15-second timeout. SVG rendering and export use internally generated validated bitmap data URLs; structured author data cannot supply arbitrary data URLs.
