import type {AnimationSnapshot,FrameRenderer,Scheduler,AnimationOptions} from './model.js';
import type {CompiledAnimation} from './compile.js';
import {AnimationTimeline} from './timeline.js';
/** Owns preparation/render scheduling. Time calculation belongs to the per-work timeline. */
export class AnimationPlayer {
 private readonly timeline:AnimationTimeline;
 private captionsEnabled=true;private terminal:'error'|'destroyed'|undefined;private error:string|undefined;
 private frame:number|null=null;private epoch=0;private loading=false;
 private listeners=new Set<(state:AnimationSnapshot)=>void>();
 constructor(readonly compiled:CompiledAnimation,private renderer:FrameRenderer,private scheduler:Scheduler,options:Pick<AnimationOptions,'captionsEnabled'>={}){
  this.timeline=new AnimationTimeline(compiled.document.duration);
  if(options.captionsEnabled!==undefined&&typeof options.captionsEnabled!=='boolean')throw new Error('captionsEnabled must be boolean');
  this.captionsEnabled=options.captionsEnabled??true;this.paint();
 }
 /** Read-only sampled master time. Use player controls so painting and async cancellation stay coordinated. */
 get time(){return this.timeline.snapshot();}
 snapshot():AnimationSnapshot{const time=this.time;return {time:time.ms,duration:time.duration,rate:time.rate,captionsEnabled:this.captionsEnabled,status:this.terminal??time.status,...(this.error?{error:this.error}:{})};}
 subscribe(fn:(state:AnimationSnapshot)=>void){this.listeners.add(fn);fn(this.snapshot());return()=>this.listeners.delete(fn);}
 private notify(){for(const fn of this.listeners){try{fn(this.snapshot());}catch(error){console.error('Animation listener failed',error);}}}
 private alive(){if(this.terminal==='destroyed')throw new Error('Animation player destroyed');}
 private paint(){const frame=this.compiled.sample(this.time.ms);this.renderer.render(this.captionsEnabled?frame:{...frame,caption:null});}
 private stopFrame(){if(this.frame!==null)this.scheduler.cancel(this.frame);this.frame=null;}
 private fail(error:unknown){this.epoch++;this.loading=false;this.stopFrame();this.timeline.seek(this.time.ms);this.error=error instanceof Error?error.message:String(error);this.terminal='error';this.notify();}
 async prepare(){this.alive();try{await this.renderer.prepare?.();this.alive();this.paint();}catch(error){if(this.terminal!=='destroyed')this.fail(error);throw error;}}
 async play():Promise<void>{
  this.alive();if(this.time.status==='playing'||this.loading)return;if(this.terminal==='error')throw new Error(this.error??'Animation failed');
  const epoch=++this.epoch;this.loading=true;
  try{
   await this.renderer.prepare?.();if(epoch!==this.epoch)return;
   this.loading=false;this.timeline.play(this.scheduler.now());this.paint();this.notify();this.schedule();
  }catch(error){if(epoch===this.epoch){this.fail(error);throw error;}}
 }
 private schedule(){if(!this.terminal&&this.time.status==='playing'&&this.frame===null)this.frame=this.scheduler.request(this.tick);}
 private tick=()=>{this.frame=null;if(this.terminal||this.time.status!=='playing')return;try{this.timeline.advance(this.scheduler.now());this.paint();this.notify();this.schedule();}catch(error){this.fail(error);}};
 pause(){
  this.alive();this.epoch++;this.loading=false;this.stopFrame();
  try{const playing=this.time.status==='playing';this.timeline.pause(this.scheduler.now());if(playing)this.paint();this.notify();}catch(error){this.fail(error);throw error;}
 }
 seek(ms:number){
  this.alive();if(!Number.isFinite(ms))throw new Error('Animation time must be finite');
  this.epoch++;this.loading=false;this.stopFrame();this.timeline.seek(ms);this.terminal=undefined;this.error=undefined;
  try{this.paint();this.notify();}catch(error){this.fail(error);throw error;}
 }
 setCaptionsEnabled(enabled:boolean){this.alive();if(typeof enabled!=='boolean')throw new Error('字幕开关必须是布尔值');if(enabled===this.captionsEnabled)return;this.captionsEnabled=enabled;try{this.paint();this.notify();}catch(error){this.fail(error);throw error;}}
 setRate(rate:number){
  this.alive();if(!Number.isFinite(rate)||rate<.25||rate>4)throw new Error('Rate outside .25..4');
  try{const playing=this.time.status==='playing';this.timeline.setRate(rate,this.scheduler.now());if(this.time.status==='ended')this.stopFrame();if(playing)this.paint();this.notify();}catch(error){this.fail(error);throw error;}
 }
 destroy(){if(this.terminal==='destroyed')return;this.epoch++;this.loading=false;this.stopFrame();this.timeline.seek(this.time.ms);this.terminal='destroyed';try{this.renderer.destroy();}finally{this.notify();this.listeners.clear();}}
}
