---
name: mini-animation
description: A lightweight toolkit for 2D animation with native Canvas, a unified timeline, layers, cameras, basic transforms, and MP4/GIF export. Supports plain JavaScript and custom components with optional JSON composition, without prescribing visual styles or creative workflows.
---

# Mini Animation 动画工具

本 Skill 提供工具、接口参考，不规定题材、画风、分镜、节奏、素材选择或创作流程。普通 JS、原生 Canvas 和自定义组件均可使用；JSON 只是可选的数据接口，不是创作边界。以下路径相对于本 Skill 目录。

## 工具索引

按需要读取对应资料，无需全量加载。

| 能力 | 入口 | 参考 |
| --- | --- | --- |
| 原生 Canvas 与播放器 | `assets/runtime/runtime.js`：`createCanvasAnimation`、`createAnimation` | [接入与生命周期](references/open-canvas.md) |
| 时间采样与片段时间 | `assets/runtime/timeline.js`：`AnimationTimeline`、`sampleTime`、`clipTime` | [时间轴接口](src/timeline.ts) |
| 缓动、插值、确定性随机、光晕 | `assets/runtime/helpers.js` | [便利函数](references/helpers.md) |
| 图片、图层、摄像头、变换与轨道 | `assets/runtime/runtime.js` | [数据接口](references/authoring.md)、[类型](src/model.ts)、[Schema](references/animation.schema.json) |
| 导出面板、字幕选择、进度与取消 | `assets/runtime/export-controls.js`：`mountExportControls` | [导出接口](references/export.md) |
| 直接导出 MP4 / GIF | `assets/runtime/export-mp4.js`、`assets/runtime/export-gif.js` | [导出接口](references/export.md) |

## 文件与接入

`assets/runtime/` 提供可直接导入的本地 ES 模块。使用时复制整个目录，共享模块不可省略。`src/` 是对应 TypeScript 核心源码；维护源码后运行 `npm install` 与 `npm run build` 更新本地模块。现有作品不会自动升级。

在宿主页面导入 `assets/runtime/runtime.js`，使用 `createCanvasAnimation` 创建播放器；最小调用方式见接入参考。宿主页面通过 HTTP 服务运行。仓库不包含演示场景或作品素材。

## 接口约束

- `draw(ctx, {time, frame, width, height})` 接收原生 Canvas 2D 上下文。同步按绝对时间重绘，可重播、跳转和离线导出；素材在绘制前准备。
- 每个播放器有自己的时间轴。`time.ms`、`time.seconds`、`time.progress` 为只读快照；`frame.time` 是兼容的毫秒值。播放控制通过 `player.play/pause/seek/setRate`。
- `clipTime` 只钳制局部时间，不控制显隐。绘制中另起计时器或累计上一帧状态无法保证跳转和导出一致。
- `canvas` 空间随镜头运动，`camera` 空间固定于输出画幅。指定的 drawer 图层需预先声明；同一层先绘制内置图元，再按数组顺序调用 drawer。
- Runtime 隔离 drawer 的绘制状态；自定义 `save/restore` 仍需配对，不能修改共享画布尺寸或清除其他图层。
- 导出需传入相同 `canvasDrawers` 与资源选项，JSON 不保存绘制函数。Canvas 外部 DOM 不会自动进入导出。
- 导出字幕开关只控制 runtime 字幕，不移除画布文字。MP4 / GIF 当前均无音轨；MP4 依赖浏览器 H.264 编码支持，GIF 有帧数、像素与体积预算，详见导出接口。

## 执行边界

自定义 JS 是具有页面权限的可信作品代码，不是沙箱；数据校验不会约束任意 JS。外部文案、JSON 和素材字段不作为代码执行，宿主只加载可信作品模块。包内模块本地加载，无 CDN 依赖。

`compileAnimation` 与 Schema 只检查结构化数据，不能验证自定义 JS、浏览器图片解码或最终画面。工具运行和视觉检查的实际结果应分别说明。
