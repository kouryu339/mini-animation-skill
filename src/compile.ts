import {cameraState,cameraIdAt,isCameraTarget,cameraTargetId} from './camera.js';
import {createEntity,createCameraEntities} from './components.js';
import {createTransform} from './transform.js';
import {EffectsSampler} from './effects.js';
import type {AnimationDocument,AnimationFrame,MotionTrack,Pose,MotionEntity} from './model.js';
import {parseAnimation} from './validate.js';
import {sampleTime} from './timeline.js';
const clamp=(x:number)=>Math.max(0,Math.min(1,x));
const easing={linear:(x:number)=>x,in:(x:number)=>x*x*x,out:(x:number)=>1-(1-x)**3,inOut:(x:number)=>x<.5?4*x*x*x:1-(-2*x+2)**3/2};
const pose=():Pose=>createTransform();
function freeze<T>(value:T):T{if(value&&typeof value==='object'){Object.freeze(value);for(const child of Object.values(value))freeze(child);}return value;}
/** Compiled data is detached, immutable, dependency-free and independent of the DOM. */
export class CompiledAnimation {
 readonly document:Readonly<AnimationDocument>;
 readonly entities:readonly MotionEntity[];
 private tracks:Exclude<MotionTrack,{type:'transform'}>[]=[];private effects:EffectsSampler;
 private paths=new Map<MotionTrack,{lengths:number[];total:number}>();
 constructor(json:string){
 const document=parseAnimation(json);this.document=freeze(document);this.effects=new EffectsSampler(document);
 if(document.surface.type==='canvas')this.entities=freeze(document.surface.nodes.map(createEntity));else{
 const declared=document.surface.entities??[],ids=new Set(declared.map(e=>e.id));const defaults=(document.tracks??[]).flatMap(t=>t.type!=='camera'&&!isCameraTarget(t.target)&&!ids.has(t.target)?(ids.add(t.target),[{id:t.target}]):[]);this.entities=freeze([...declared,...defaults].map(createEntity));
 }
 for(const track of [...(document.tracks??[])].sort((a,b)=>(a.at??0)-(b.at??0))){
 if(track.type==='transform'){
 const frame=this.sample(track.at??0),base=isCameraTarget(track.target)?frame.cameras[cameraTargetId(track.target)]!.components.transform:frame.poses[track.target]??pose();
 for(const property of Object.keys(track.to) as (keyof typeof track.to)[]){const from=track.from?.[property]??base[property],to=track.to[property]!;
 this.tracks.push(isCameraTarget(track.target)?{type:'camera',...(this.document.cameras?{camera:cameraTargetId(track.target)}:{}),property:property==='scale'?'zoom':property as 'x'|'y',at:track.at??0,duration:track.duration,from,to,ease:track.ease??'linear'}:{type:'tween',target:track.target,property,at:track.at??0,duration:track.duration,from,to,ease:track.ease??'linear'});}
 }else{this.tracks.push(track);if(track.type==='follow'){let total=0;const lengths=[0];for(let i=1;i<track.points.length;i++){const a=track.points[i-1]!,b=track.points[i]!;total+=Math.hypot(b[0]-a[0],b[1]-a[1]);lengths.push(total);}this.paths.set(track,{lengths,total});}}
 }
 }

 sample(time:number):AnimationFrame{
  if(!Number.isFinite(time))throw new Error('Animation time must be finite');const t=Math.max(0,Math.min(this.document.duration,time)),poses:Record<string,Pose>=Object.create(null),written=new Set<string>(),cameras=createCameraEntities(this.document),cameraId=cameraIdAt(this.document,t),cameraEntity=cameras[cameraId]!;
  for(const entity of this.entities){const {transform,graphic:g}=entity.components;poses[entity.id]={...transform,...(g?.width!==undefined?{width:g.width}:{}),...(g?.height!==undefined?{height:g.height}:{}),...(g?.x2!==undefined?{x2:g.x2}:{}),...(g?.y2!==undefined?{y2:g.y2}:{}),...(g?.progress!==undefined?{progress:g.progress}:{})};}

  for(const track of this.tracks){if(track.type==='camera'){const cameraId=track.camera??'$default',cameraTransform=cameras[cameraId]!.components.transform,at=track.at??0,id='@camera:'+cameraId+':'+track.property;if(t>=at||!written.has(id)){const p=easing[track.ease??'linear'](clamp((t-at)/track.duration));cameraTransform[track.property==='zoom'?'scale':track.property]=track.from+(track.to-track.from)*p;written.add(id);}continue;}const target=poses[track.target]??=pose(),at=track.at??0;const write=(property:keyof Pose,value:number|string)=>{const id=track.target+':'+property;if(t>=at||!written.has(id)){(target as unknown as Record<string,number|string>)[property]=value;written.add(id);}};
   if(track.type==='color'){const p=easing[track.ease??'linear'](clamp((t-at)/track.duration));let value='#';for(const n of [1,3,5]){const a=parseInt(track.from.slice(n,n+2),16),b=parseInt(track.to.slice(n,n+2),16);value+=Math.round(a+(b-a)*p).toString(16).padStart(2,'0');}write(track.property,value);}
   else if(track.type==='tween'){const elapsed=Math.max(0,t-at),repeat=track.repeat??1,cycle=Math.min(repeat-1,Math.floor(elapsed/track.duration));let p=clamp((elapsed-cycle*track.duration)/track.duration);if(track.yoyo&&cycle%2)p=1-p;p=easing[track.ease??'linear'](p);write(track.property,track.from+(track.to-track.from)*p);}
   else if(track.type==='wave'){const elapsed=Math.max(0,Math.min(track.duration,t-at));write(track.property,track.center+track.amplitude*Math.sin(elapsed/track.period*2*Math.PI+(track.phase??0)));}
   else{const p=easing[track.ease??'linear'](clamp((t-at)/track.duration)),path=this.paths.get(track)!,distance=p*path.total;let i=1;while(i<path.lengths.length-1&&path.lengths[i]!<distance)i++;while(i<path.lengths.length-1&&path.lengths[i]===path.lengths[i-1])i++;const a=track.points[i-1]!,b=track.points[i]!,length=path.lengths[i]!-path.lengths[i-1]!,part=length?(distance-path.lengths[i-1]!)/length:0;write('x',a[0]+(b[0]-a[0])*part);write('y',a[1]+(b[1]-a[1])*part);if(track.orient)write('rotate',Math.atan2(b[1]-a[1],b[0]-a[0])*180/Math.PI);}
  }
  const cue=this.document.captions?.find(c=>t>=c.at&&t<c.at+c.duration);
  return {time:t,clock:sampleTime(t,this.document.duration),camera:cameraState(cameraEntity),cameraEntity,cameraId,cameras,effects:this.effects.sample(t),poses,caption:cue?{text:cue.text,speaker:cue.speaker??'',opacity:cue.fade?Math.min(1,(t-cue.at)/cue.fade,(cue.at+cue.duration-t)/cue.fade):1}:null};
 }
}
export function compileAnimation(json:string):CompiledAnimation{return new CompiledAnimation(json);}
