import {compileAnimation} from './compile.js';
import type {AnimationOptions} from './model.js';
import {Mp4VideoMuxer} from './export/mp4.js';
export interface Mp4ExportOptions extends AnimationOptions {fps?:24|30;maxHeight?:720|1080;signal?:AbortSignal;onProgress?:(progress:number)=>void}
import {checkAbort,createExportFrames} from './export/frames.js';
/** Optional export module. Trusted canvas drawers share offline sampling; JSON never contains code. */
export async function exportAnimationMp4(json:string,options:Mp4ExportOptions={}):Promise<Blob>{
 checkAbort(options.signal);if(typeof VideoEncoder==='undefined'||typeof VideoFrame==='undefined')throw new Error('此浏览器不支持 MP4 编码，请使用支持 WebCodecs 的 Chrome、Edge 或 WebView2。');
 const compiled=compileAnimation(json),d=compiled.document,fps=options.fps??30;if(options.canvasDrawers?.length&&d.surface.type!=='canvas')throw new Error('Canvas drawers require a canvas surface');if(![24,30].includes(fps))throw new Error('导出帧率只支持 24 或 30');if(options.maxHeight!==undefined&&![720,1080].includes(options.maxHeight))throw new Error('导出尺寸无效');if(options.captionsEnabled!==undefined&&typeof options.captionsEnabled!=='boolean')throw new Error('字幕开关必须是布尔值');
 const ratio=Math.min(1,1920/d.width,(options.maxHeight??1080)/d.height),width=Math.max(2,Math.floor(d.width*ratio/2)*2),height=Math.max(2,Math.floor(d.height*ratio/2)*2),count=Math.ceil(d.duration*fps/1000),total=Math.round(d.duration*1000);
 const config:VideoEncoderConfig={codec:'avc1.420028',width,height,framerate:fps,bitrate:Math.max(1500000,Math.min(10000000,width*height*fps*.15)),latencyMode:'realtime',avc:{format:'avc'}};
 const supported=await VideoEncoder.isConfigSupported(config);checkAbort(options.signal);if(!supported.supported)throw new Error('当前浏览器没有可用的 H.264 编码器，无法导出 MP4。');
 const surface=createExportFrames(compiled,width,height,options,options.signal);
 let encoder:VideoEncoder|undefined,failure:Error|undefined;const muxer=new Mp4VideoMuxer(width,height),durations=new Map<number,number>();
 try{
  await surface.prepare();
  encoder=new VideoEncoder({error:error=>{failure=error;},output:(chunk,meta)=>{try{const description=meta?.decoderConfig?.description;if(description){const bytes=ArrayBuffer.isView(description)?new Uint8Array(description.buffer,description.byteOffset,description.byteLength):new Uint8Array(description);muxer.setDecoderConfig(bytes);}const data=new Uint8Array(chunk.byteLength);chunk.copyTo(data);const duration=durations.get(chunk.timestamp);if(duration===undefined)throw new Error('编码器返回未知帧时间');durations.delete(chunk.timestamp);muxer.add(data,chunk.timestamp,duration,chunk.type==='key');}catch(error){failure=error instanceof Error?error:new Error(String(error));}}});encoder.configure(config);
  let lastProgress=-1;
  for(let i=0;i<count;i++){
   checkAbort(options.signal);if(failure)throw failure;const timestamp=Math.round(i*1000000/fps),duration=Math.min(total,Math.round((i+1)*1000000/fps))-timestamp;await surface.render(i===count-1?d.duration:i*1000/fps);
   const video=new VideoFrame(surface.canvas,{timestamp,duration});try{durations.set(timestamp,duration);encoder.encode(video,{keyFrame:i%(fps*2)===0});}finally{video.close();}
   // Bound the encoder queue even when SVG rasterization finishes unusually quickly.
   if(encoder.encodeQueueSize>=4)await encoder.flush();if(failure)throw failure;
   const progress=Math.floor((i+1)/count*99);if(progress!==lastProgress){options.onProgress?.(progress/100);lastProgress=progress;}
   if(i%8===0)await new Promise<void>(resolve=>setTimeout(resolve,0));
  }
  await encoder.flush();checkAbort(options.signal);if(failure)throw failure;if(durations.size)throw new Error('编码器遗漏了视频帧');const blob=muxer.finalize();options.onProgress?.(1);return blob;
 }finally{if(encoder&&encoder.state!=='closed')encoder.close();surface.destroy();}
}
