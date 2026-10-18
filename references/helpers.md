# 可选创作工具

这些函数从三段小动画中提炼，独立于播放器，按需导入 helpers.js。不注册新语言，不创建计时器，也不要求所有表现都使用它们。可以传自己的缓动函数或直接写原生 Canvas。

```js
import {progress, easing, lerp, randomAt, radialGlow} from './helpers.js';

function draw(ctx, {time}) {
  const arrival = progress(time, 3000, 4000, easing.smooth);
  const x = lerp(850, 680, arrival);
  radialGlow(ctx, x, 300, 100, '#aaddff55');
  // 随机值按索引确定，倒拖或改变绘制顺序不会改变位置。
  const starX = randomAt(10, 42) * 1280;
  ctx.fillRect(starX, 80, 2, 2);
}
```

| 方法 | 约定 |
|---|---|
| progress(time, start, duration, ease?) | time 来自主时间轴；start/duration 为毫秒。开始前 0，结束后 1，duration 必须为正。默认线性，不负责显隐。 |
| easing.linear / smooth / inCubic / outCubic / inOutCubic | 输入进度钳制为 0–1。smooth 为平滑起止；也可直接传自己的函数给 progress。 |
| lerp(from, to, amount) | 数值插值；不钳制 amount，允许弹性缓动超调。 |
| clamp01(value) | 钳制到 0–1；非有限值报错。 |
| randomAt(index, seed=0) | 返回 0≤n<1，index 和 seed 为安全整数；无可变随机状态。仅用于视觉分布，不承诺跨 JS 引擎逐位一致。 |
| radialGlow(ctx, x, y, radius, color, edgeColor?) | 径向光晕；默认边缘透明。保存并恢复画布状态，不重置当前路径；0 半径不绘制，负半径报错，颜色沿用原生 Canvas 规则。 |

progress 只在区间内部调用自定义 ease；起止端点固定 0/1。自定义 ease 必须返回有限数值，但允许超过 0–1。这些都是可信作品 JS 辅助函数，不改变安全边界。

不会封装水母、楼房或花朵等题材。复杂路径、形变、材质和角色动作继续留在作品中。只有重复出现且含义稳定的工作才考虑加入工具箱。
