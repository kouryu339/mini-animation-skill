import {compileAnimation} from './compile.js';
import {checkAbort,createExportFrames} from './export/frames.js';
import {GifEncoder} from './export/gif.js';
import type {AnimationOptions} from './model.js';
export interface GifExportOptions extends AnimationOptions {fps?:10|15;maxWidth?:320|480|640;signal?:AbortSignal;onProgress?:(progress:number)=>void}
/** Offline, local-only GIF export. No frames retained after encoding; finite work/output budgets. */
export async function exportAnimationGif(json:string,options:GifExportOptions={}):Promise<Blob>{
 checkAbort(options.signal);const compiled=compileAnimation(json),d=compiled.document,fps=options.fps??10,maxWidth=options.maxWidth??480;
 if(![10,15].includes(fps)||![320,480,640].includes(maxWidth))throw new Error('GIF supports 10/15 fps and widths of 320/480/640 pixels');
 const ratio=Math.min(1,maxWidth/d.width,960/d.height),width=Math.max(1,Math.round(d.width*ratio)),height=Math.max(1,Math.round(d.height*ratio));
 const totalCs=Math.max(1,Math.round(d.duration/10)),count=Math.min(totalCs,Math.ceil(d.duration*fps/1000));
 if(count>1800||count*width*height>300000000)throw new Error('GIF exceeds frame or pixel limits; reduce resolution or duration');
 const frames=createExportFrames(compiled,width,height,options,options.signal),encoder=new GifEncoder(width,height);
 try{
  await frames.prepare();
  for(let i=0;i<count;i++){
   checkAbort(options.signal);await frames.render(i===count-1?d.duration:i*1000/fps);
   const start=Math.round(i*totalCs/count),end=Math.round((i+1)*totalCs/count);
   encoder.add(frames.context.getImageData(0,0,width,height).data,end-start);
   options.onProgress?.((i+1)/count*.99);
   // Yield every frame: allows cancellation and avoids a long uninterrupted encode task.
   await new Promise<void>(resolve=>setTimeout(resolve,0));
  }
  checkAbort(options.signal);const blob=encoder.finish();options.onProgress?.(1);return blob;
 }finally{frames.destroy();}
}
