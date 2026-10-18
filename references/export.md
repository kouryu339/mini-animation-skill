# HTML 导出入口

最终预览 HTML 默认提供 MP4 / GIF 导出面板、独立的“包含字幕”选项、进度、取消和下载链接。

```js
import {mountExportControls} from './export-controls.js';
const controls = mountExportControls(host, () => ({
  player,
  options: {canvasDrawers}, // 同一作品的绘图函数、素材解析器和字幕样式
  filename: 'my-animation',
}));
// 页面卸载时调用 controls.destroy()，取消导出并释放下载 URL。
```

打开面板时默认沿用预览字幕设置，此后独立选择。点击导出会暂停当前预览，但不会跳转或重置其位置；导出从零开始采样完整作品，不抓屏、不捕获页面按钮。切换预览作品不会改变已经捕获的导出来源。

“不含字幕”只关闭 runtime 的旁白字幕。画布内的标题、图表文字、作者自行绘制的文字仍保留。JSON 和 Canvas 自定义绘制均可导出；Canvas 之外的 DOM 不会录入。

- MP4：控件默认 720p、30 fps、静音；需要浏览器支持 WebCodecs 的 H.264 编码。失败会显示原因，不悄悄改格式。
- GIF：控件默认宽 480 像素、10 fps、循环播放、无声音。每帧最多 256 色，颜色和清晰度会有损失。API 还可选宽 320/640 和 15 fps。建议长片用 MP4。
- 两种格式都在本地生成，动态加载本地模块，不依赖 CDN、上传或屏幕录制。
- 编码按帧推进，可取消。GIF 最多 1800 帧、3 亿输出像素工作量和 128 MiB 编码结果；超额明确报错。原始帧逐帧处理，不保存整部片子的 RGBA。

## 直接调用

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

MP4 使用 exportAnimationMp4，相同 options 中 fps 为 24/30，maxHeight 为 720/1080。自定义函数属于可信代码，必须是按绝对时间重绘的同步函数；两个导出器共用帧渲染、图片解码和字幕合成路径。用户自行修改的闭包状态不在播放器控制范围。

GIF 编码格式参考 [GIF89a 规范](https://www.w3.org/Graphics/GIF/spec-gif89a.txt)。采用逐帧局部调色板与 LZW；调色板可能使渐变或相近颜色产生量化变化。
