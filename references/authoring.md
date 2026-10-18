# 图片与图层数据接口

本文只针对可选的结构化数据模式。自由 JS 绘制见开放画布规范；不要求所有作品都用 JSON 或内置图元实现。

使用现有 `rusie.motion/1`，不改变既有动画默认行为。本文只定义 runtime 的数据接口与加载行为。

## 两种坐标空间

- `canvas`：画布空间，实体随当前摄像头的平移、缩放和切换改变画面位置。
- `camera`：镜头空间，像贴在镜头上的画面。坐标以输出 width/height 为基准，不受任何摄像头的运动、取景尺寸或切换影响；自身的 Transform 仍然可以动画。

`layers` 声明多层，最多 64 层。先画所有 canvas 层，再画所有 camera 层；同一空间按数组声明顺序从底至顶。未指定 layer 的实体位于最底部默认画布层。camera 层属于整段动画，不绑定某个镜头，所以切镜不会自动清除它。

Canvas 只允许根节点指定 layer，子孙继承根的坐标空间及绘制位置；SVG 仅允许 source 根下的顶层图形或组指定 layer。一个图层内维持原有实体/图形顺序。需要整组显隐或移动时，在该层建立容器，对容器 Transform 编排，不需要另造图层动画协议。

旧 effects 仍是独立后处理覆盖，字幕仍是独立观看偏好层。新分层作品应以普通图形/图片实体表达可排序的效果；不要用旧 effects 实现必须排在 camera 层下面的效果。

## 图片资产

```json
{
  "assets": {
    "qin": {"type":"image","src":"images/qin.png"},
    "broken": {"type":"image","src":"images/qin-broken.png"}
  },
  "layers": [
    {"id":"scenery","space":"canvas"},
    {"id":"foreground","space":"canvas"},
    {"id":"inscriptions","space":"camera"},
    {"id":"transition","space":"camera"}
  ]
}
```

以上为顶层字段片段。支持静态 PNG、JPEG、WebP，包括透明 PNG/WebP。不接受 APNG、动态 WebP、GIF、图片中的脚本或外链 SVG。SVG 矢量图继续使用受限 `surface.source`。

Canvas 图片实体：

```json
{"id":"qinFace","layer":"scenery","components":{
  "transform":{"x":120,"y":80},
  "graphic":{"type":"image","asset":"qin","width":1000,"height":560,"fit":"contain"}
}}
```

`contain`（默认）完整居中，`cover` 居中裁切填满，`stretch` 拉伸。图片也可使用已有 x/y/rotate/scale/opacity、width/height 轨道。显隐使用 opacity 0/1；淡入淡出使用 opacity 插值。图像本身不拥有独立播放时钟。

SVG 对应写法：

```xml
<image id="qinFace" href="asset:qin" x="120" y="80"
       width="1000" height="560" preserveAspectRatio="xMidYMid meet"/>
```

`surface.entities` 中用 `{"id":"qinFace","layer":"scenery"}` 分配空间。`preserveAspectRatio` 支持 `xMidYMid meet`、`xMidYMid slice`、`none`。图片 href 不接受 URL、data、blob 或本地文件路径，只接受已声明的资产 ID。

## 可信宿主与加载生命周期

默认 src 相对宿主页面解析；加载单独 JSON 文件时，宿主应将该 JSON 的地址作为 `assetBaseURL` 传入 `createAnimation` 和 `exportAnimationMp4`。相对目录依此解析。远程来源、重定向、URL 协议、查询参数、编码绕过和 `..` 路径均拒绝。

项目包、桌面文件或离线缓存可由宿主传入 `resolveImage(id, asset, signal): Promise<Blob>`，按项目根目录安全解析路径；该函数只存在于可信宿主，不写进 JSON。解析器须尊重 signal，不能将作者路径直接传给无限制文件系统接口。宿主需要接入自己的包资源解析器。

`await player.prepare()` 等待图片验证及解码后重绘当前帧；`play()` 也会等待准备完成。重复准备共享同一加载任务。准备完成后播放、跳转不再请求图片。destroy 中止待加载资源并释放引用；缺图/非法图报告包含资产 ID 的错误，不能默默用空白继续。

每图最多 8 MiB、4096×4096 边长且最多 4194304 像素；最多 32 张，总计 32 MiB 文件和 16777216 解码像素。解码前检查实际文件头及尺寸，不能只相信扩展名或 MIME。每次资源准备有 15 秒超时。SVG 渲染和 MP4 导出使用内部生成的已校验位图数据 URL，作者无权直接提供任意数据 URL。
