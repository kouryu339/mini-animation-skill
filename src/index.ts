import {CaptionRenderer} from './captions.js';
import type {AnimationOptions,AnimationDocument} from './model.js';
import {EffectsRenderer} from './effects.js';
import {compileAnimation} from './compile.js';
import {AnimationPlayer} from './player.js';
import {CanvasRenderer} from './canvas.js';
import {SvgRenderer} from './svg.js';
import {ImageResources} from './images.js';
export {compileAnimation,CompiledAnimation} from './compile.js';
export {parseAnimation,AnimationError,LIMITS} from './validate.js';
export {DEFAULT_CAPTION_STYLE,resolveCaptionStyle} from './captions.js';
export {cameraMatrix,resolveCamera,cameraIdAt} from './camera.js';
export {createTransform,transformMatrix} from './transform.js';
export {createEntity,createCameraEntity,createCameraEntities} from './components.js';
export {AnimationPlayer} from './player.js';
export {AnimationTimeline,sampleTime,clipTime} from './timeline.js';
export type {TimeSnapshot,TimelineStatus} from './timeline.js';
export type * from './model.js';
/** JSON stays data-only; optional callbacks are trusted project code, never deserialized. */
export function createAnimation(host:HTMLElement,json:string,options:AnimationOptions={}){
 const compiled=compileAnimation(json),doc=host.ownerDocument,win=doc.defaultView;if(!win)throw new Error('Animation needs a document window');if(options.canvasDrawers?.length&&compiled.document.surface.type!=='canvas')throw new Error('Canvas drawers require a canvas surface');
 const root=doc.createElement('div');root.style.cssText='position:relative;width:100%;height:100%;overflow:hidden;isolation:isolate;pointer-events:none;';
 root.style.containerType='inline-size';
 const caption=new CaptionRenderer(root,compiled.document,options.captionStyle);
 const images=new ImageResources(compiled.document,doc,options);
 try{const renderer=compiled.document.surface.type==='svg'?new SvgRenderer(root,compiled,images):new CanvasRenderer(root,compiled,images,options.canvasDrawers);const effects=compiled.document.effects?.length?new EffectsRenderer(root,compiled.document):undefined;host.appendChild(root);
 const player=new AnimationPlayer(compiled,{prepare:()=>images.prepare(),render(frame){renderer.render(frame);effects?.render(frame);caption.render(frame);},destroy(){images.destroy();renderer.destroy();effects?.destroy();caption.destroy();root.remove();}},{now:()=>win.performance.now(),request:fn=>win.requestAnimationFrame(fn),cancel:id=>win.cancelAnimationFrame(id)},options);
 let resumeOnVisible=false;const pause=player.pause.bind(player);player.pause=()=>{resumeOnVisible=false;pause();};const hidden=()=>{if(doc.hidden){resumeOnVisible=player.snapshot().status==='playing';pause();}else if(resumeOnVisible){resumeOnVisible=false;void player.play().catch(error=>console.error('Animation resume failed',error));}};doc.addEventListener('visibilitychange',hidden);const destroy=player.destroy.bind(player);player.destroy=()=>{resumeOnVisible=false;doc.removeEventListener('visibilitychange',hidden);destroy();};return player;
 }catch(error){images.destroy();root.remove();throw error;}
}

/** Recommended open canvas host: reuse playback/cameras/layers, draw anything in project JS. */
export function createCanvasAnimation(host:HTMLElement,scene:Omit<AnimationDocument,'format'|'surface'>,options:AnimationOptions={}){
 return createAnimation(host,JSON.stringify({...scene,format:'rusie.motion/1',surface:{type:'canvas',nodes:[]}}),options);
}
