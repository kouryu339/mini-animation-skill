import {compileAnimation} from '../compile.js';
import {CanvasRenderer} from '../canvas.js';
import {SvgRenderer} from '../svg.js';
import {EffectsRenderer} from '../effects.js';
import {ImageResources} from '../images.js';
import {resolveCaptionStyle} from '../captions.js';
import {drawCaption} from './captions.js';
import type {AnimationOptions} from '../model.js';

export const checkAbort=(signal?:AbortSignal)=>{if(signal?.aborted)throw new DOMException('Export cancelled','AbortError');};
/** Shared offline render surface. Does not touch the preview instance or its playhead. */
export function createExportFrames(compiled:ReturnType<typeof compileAnimation>,width:number,height:number,options:AnimationOptions,signal?:AbortSignal){
 checkAbort(signal);const d=compiled.document;
 if(options.canvasDrawers?.length&&d.surface.type!=='canvas')throw new Error('Canvas drawers require a canvas surface');
 if(options.captionsEnabled!==undefined&&typeof options.captionsEnabled!=='boolean')throw new Error('captionsEnabled must be a boolean');
 const style=resolveCaptionStyle(d.captionStyle,options.captionStyle,d.captionTheme);
 const host=document.createElement('div');host.style.cssText=`position:fixed;left:-10000px;top:0;width:${d.width}px;height:${d.height}px;pointer-events:none;`;host.setAttribute('aria-hidden','true');document.body.appendChild(host);
 const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
 const context=canvas.getContext('2d',{alpha:false,willReadFrequently:true});if(!context){host.remove();throw new Error('Canvas unavailable');}
 const images=new ImageResources(d,document,options),abortImages=()=>images.destroy();
 let renderer:CanvasRenderer|SvgRenderer|undefined,effects:EffectsRenderer|undefined;
 const destroy=()=>{signal?.removeEventListener('abort',abortImages);images.destroy();effects?.destroy();renderer?.destroy();host.remove();};
 try{renderer=d.surface.type==='svg'?new SvgRenderer(host,compiled,images):new CanvasRenderer(host,compiled,images,options.canvasDrawers);effects=d.effects?.length?new EffectsRenderer(host,d):undefined;signal?.addEventListener('abort',abortImages,{once:true});}
 catch(error){destroy();throw error;}
 return {
  canvas,context,
  async prepare(){checkAbort(signal);await images.prepare();checkAbort(signal);},
  async render(ms:number){
   checkAbort(signal);const frame=compiled.sample(ms);renderer!.render(frame);effects?.render(frame);
   context.fillStyle=d.background&&d.background!=='none'?d.background:'#000000';context.fillRect(0,0,width,height);
   if(renderer instanceof SvgRenderer){
    const svg=renderer.element.cloneNode(true) as SVGSVGElement;svg.setAttribute('width',String(d.width));svg.setAttribute('height',String(d.height));svg.removeAttribute('style');
    const url=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)],{type:'image/svg+xml'})),img=new Image();
    try{await loadImage(img,url,signal);checkAbort(signal);context.drawImage(img,0,0,width,height);}finally{img.src='';URL.revokeObjectURL(url);}
   }else context.drawImage(renderer!.element,0,0,width,height);
   if(effects)context.drawImage(effects.element,0,0,width,height);
   if(options.captionsEnabled!==false)drawCaption(context,frame,style,width,height);
   return canvas;
  },destroy,
 };
}
function loadImage(image:HTMLImageElement,url:string,signal?:AbortSignal){return new Promise<void>((resolve,reject)=>{let timer:ReturnType<typeof setTimeout>;const finish=(error?:Error|DOMException)=>{clearTimeout(timer);signal?.removeEventListener('abort',abort);image.onload=null;image.onerror=null;error?reject(error):resolve();};const abort=()=>finish(new DOMException('Export cancelled','AbortError'));image.onload=()=>finish();image.onerror=()=>finish(new Error('Could not render animation frame'));timer=setTimeout(()=>finish(new Error('Animation frame rendering timed out')),10000);signal?.addEventListener('abort',abort,{once:true});if(signal?.aborted){abort();return;}image.src=url;});}
