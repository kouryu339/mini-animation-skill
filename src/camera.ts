import type {AnimationDocument,CameraState,CameraEntity} from './model.js';
import {createCameraEntities} from './components.js';
/** Compatibility view, derived from the camera entity rather than a second state store. */
export function cameraState(entity:CameraEntity):CameraState {const {transform:t,camera:v}=entity.components;return {width:v.width,height:v.height,x:t.x,y:t.y,zoom:t.scale};}
export function cameraIdAt(doc:Readonly<AnimationDocument>,time:number):string{
 if(!doc.cameras)return '$default';let id=doc.cameraCuts![0]!.camera;
 for(const cut of doc.cameraCuts!){if(cut.at>time)break;id=cut.camera;}return id;
}
export function isCameraTarget(target:string):boolean{return target==='$camera'||target.startsWith('$camera:');}
export function cameraTargetId(target:string):string{return target==='$camera'?'$default':target.slice('$camera:'.length);}
export function resolveCamera(doc:Readonly<AnimationDocument>,time=0):CameraState{return cameraState(createCameraEntities(doc)[cameraIdAt(doc,time)]!);}
/** Shared world-to-screen projection for SVG, Canvas, effects and MP4. */
export function cameraMatrix(camera:CameraState,width:number,height:number){const scale=width/camera.width*camera.zoom;return {scale,x:width/2-camera.x*scale,y:height/2-camera.y*scale};}
export function applyCamera(context:CanvasRenderingContext2D,camera:CameraState,width:number,height:number){const m=cameraMatrix(camera,width,height);context.transform(m.scale,0,0,m.scale,m.x,m.y);}
