# Optional Helpers

Import these functions from `helpers.js` as needed. They are independent of the player, introduce no language or timers, and do not require all artwork to use them. Custom easing and native Canvas remain available.

```js
import {progress, easing, lerp, randomAt, radialGlow} from './helpers.js';

function draw(ctx, {time}) {
  const arrival = progress(time, 3000, 4000, easing.smooth);
  const x = lerp(850, 680, arrival);
  radialGlow(ctx, x, 300, 100, '#aaddff55');
  // Index-based randomness stays stable across seeks and draw order changes.
  const starX = randomAt(10, 42) * 1280;
  ctx.fillRect(starX, 80, 2, 2);
}
```

| Function | Contract |
| --- | --- |
| `progress(time, start, duration, ease?)` | Uses master time; start/duration are milliseconds. Returns 0 before the interval and 1 after it. Duration must be positive. Linear by default; does not control visibility. |
| `easing.linear / smooth / inCubic / outCubic / inOutCubic` | Input progress is clamped to 0–1. `smooth` eases both endpoints. Custom functions can be passed to `progress`. |
| `lerp(from, to, amount)` | Interpolates numbers without clamping amount, allowing overshoot. |
| `clamp01(value)` | Clamps to 0–1; rejects non-finite values. |
| `randomAt(index, seed=0)` | Returns 0 <= n < 1. Index and seed must be safe integers. No mutable random state; intended for visual distribution, without a bit-for-bit cross-engine guarantee. |
| `radialGlow(ctx, x, y, radius, color, edgeColor?)` | Draws a radial glow with a transparent edge by default. Saves/restores context state without resetting the current path. Zero radius draws nothing; negative radius is invalid. Colors follow native Canvas rules. |

`progress` calls custom easing only inside the interval; endpoints remain 0/1. Custom easing must return a finite value but may overshoot. These helpers are trusted project JavaScript and do not change execution boundaries. Subject-specific paths, deformations, materials, and actions remain project code.
