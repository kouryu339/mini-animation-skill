/** One clock per work, with no DOM, timers or rendering dependencies. Units are milliseconds. */
export interface TimeSnapshot {readonly ms:number;readonly seconds:number;readonly duration:number;readonly progress:number}
export type TimelineStatus='ready'|'playing'|'paused'|'ended';
const finite=(value:number,name:string)=>{if(!Number.isFinite(value))throw new Error(`${name} must be finite`);return value;};
export function sampleTime(ms:number,duration:number):TimeSnapshot{
 finite(ms,'Time');finite(duration,'Duration');if(duration<=0)throw new Error('Duration must be positive');
 const time=Math.max(0,Math.min(duration,ms));
 return Object.freeze({ms:time,seconds:time/1000,duration,progress:time/duration});
}
/** A clip derives its time from the master; it never starts another clock. */
export function clipTime(time:TimeSnapshot,start:number,duration:number):TimeSnapshot{
 return sampleTime(time.ms-finite(start,'Clip start'),duration);
}
export class AnimationTimeline {
 private ms=0;private rate=1;private status:TimelineStatus='ready';private last=0;
 constructor(readonly duration:number){sampleTime(0,duration);}
 snapshot(){return Object.freeze({...sampleTime(this.ms,this.duration),rate:this.rate,status:this.status});}
 play(now:number){
  finite(now,'Clock');if(this.status==='playing')return this.snapshot();
  if(this.ms>=this.duration)this.ms=0;
  this.last=now;this.status='playing';return this.snapshot();
 }
 advance(now:number){
  finite(now,'Clock');
  if(this.status==='playing'){
   // A regressing source must not be counted twice when it catches up.
   const next=Math.max(this.last,now);
   this.ms=Math.min(this.duration,this.ms+(next-this.last)*this.rate);this.last=next;
   if(this.ms===this.duration)this.status='ended';
  }
  return this.snapshot();
 }
 pause(now:number){this.advance(now);if(this.status!=='ended')this.status='paused';return this.snapshot();}
 seek(ms:number){this.ms=sampleTime(ms,this.duration).ms;this.status=this.ms===this.duration?'ended':'paused';return this.snapshot();}
 setRate(rate:number,now:number){
  finite(rate,'Rate');if(rate<.25||rate>4)throw new Error('Rate outside .25..4');
  this.advance(now);this.rate=rate;return this.snapshot();
 }
}
