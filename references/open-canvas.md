# 开放画布接口

Runtime 封装重复率高的工作：标准画布、播放时钟、暂停/跳转、图层、镜头、基础变换和导出。可使用这张画布，也可按需使用独立工具；作品不必全部通过固定图元、轨道或 JSON 实现。AI 可写普通 JS 函数、组件和算法，直接调用 Canvas 2D 绘图；已有移动与缩放工具按需使用。

## 接入示例

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
    ctx.fillText('固定于镜头的文字',width/2,70);
  }},
];
const player = createCanvasAnimation(host,scene,{canvasDrawers});
await player.play();
```

draw 获得原生 CanvasRenderingContext2D；可使用贝塞尔路径、渐变、裁剪、混合、文字、预加载图片和自行定义的绘图函数。不需要先把这些效果注册成 runtime 图元。

## 最小接入约定

### 独立主时间轴

每部作品有独立 AnimationTimeline，不使用页面级单例。时间轴没有 DOM、RAF 或资源加载依赖，负责播放位置、倍率、暂停与跳转；播放器只负责资源准备、驱动时间和绘制调度。导出通过相同 sampleTime 生成快照，不推进预览时间轴。

draw(ctx, {time, frame}) 中，time 与 frame.clock 是同一个冻结快照：ms 为毫秒，seconds 为秒，duration 为总毫秒，progress 为 0–1 进度。旧 frame.time 保留毫秒值。所有图层、镜头和字幕按同一时间采样。

```js
import {clipTime} from './timeline.js';
function draw(ctx, {time}) {
  const clip = clipTime(time, 10000, 2000);
  // 片段 10–12 秒：clip.ms 从 0 到 2000，不另开计时器。
  ctx.globalAlpha = clip.progress;
}
```

clipTime 会钳制到片段首尾，不自动控制显隐；需要显隐时用主时间判断。player.time 提供只读时间轴状态；绑定播放器后仍通过 player.play/pause/seek/setRate 控制，保证资源取消、绘制与调度一致。独立使用 AnimationTimeline 时由宿主显式传入单调时钟给 play/advance/pause/setRate，时间轴自身不启动计时器。

音频主时钟适配尚未实现；不要一边启动播放器实时推进，一边用音频反复 seek 来制造双重驱动。

- 所有 draw 使用同一个毫秒时间 `frame.time`。frame 同时给出当前 camera/cameraId、实体 poses、字幕等采样结果。
- 每次从绝对时间重绘完整当前状态。不要在 draw 里追加 DOM、请求素材、创建计时器或依赖前一帧累计位置。随机效果使用预生成数据或有种子算法，保证倒拖和导出一致。
- canvas 空间自动应用镜头矩阵，camera 空间保持输出坐标。默认 layer 是 `$default`；指定的 layer 必须在 scene.layers 中声明。
- 同一层先画内置图元，再按数组顺序执行自定义 drawer；需要其他叠放顺序就拆层。
- Runtime 在每个 drawer 外 save/restore 并清空当前路径；作者自己的 save/restore 也必须配对。不要改变 ctx.canvas 的尺寸或清除其他层。
- draw 为同步函数；图片等资源由作品代码预加载再挂载。资源卸载由作品负责，player.destroy() 释放播放器和 drawer 引用。
- 自定义绘制与 JSON 图元可混用：用 createAnimation(host,json,{canvasDrawers})；纯自定义作品可直接用 createCanvasAnimation，不需手写节点 JSON。
- SVG/CSS/其他表现方式可独立用于作品，但画布外的 DOM 不会自动进入MP4 / GIF 导出。

## 导出

```js
import {exportAnimationMp4} from './export-mp4.js';
const video = await exportAnimationMp4(
  JSON.stringify(player.compiled.document),
  {canvasDrawers, captionsEnabled:false}
);
```

导出必须传相同 drawer 和已准备好的素材，离线采样调用同一绘制函数，不使用预览播放位置。JSON 不保存函数；仅拿 JSON 导出会缺失自定义画面。MP4 仍为静音，受浏览器编码能力约束。

## 安全边界

canvasDrawers 是可信作品源码，不是沙箱。普通 JS 具有宿主页面权限，无法用 JSON 校验或执行步数预算约束它；耗时无限循环也不能被同线程播放器抢占。这个边界必须公开，不宣称任意 JS 可安全执行。

不把外部文案、JSON、素材字段或未知上传脚本送入 eval、Function、动态 import。宿主只显式加载可信作品模块。审查来源不明的作品后再运行；若未来需要托管不可信作品，应另做隔离宿主及资源策略。

## 验证与 Skill

Skill 提供工具索引、API 和模板，不规定作品的创作方法。普通 JS 自定义组件与可选 JSON 模式均可接入。

JSON 校验只能覆盖结构化部分；JS 作品还应验证绘制异常、首中尾帧、跳转重播、镜头层固定、多个 drawer 状态隔离，以及导出是否包含自定义画面。
