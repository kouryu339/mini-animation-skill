import type {TimeSnapshot} from './timeline.js';

/** Optional, stateless authoring helpers. Native Canvas and custom functions remain available. */
export type EasingFunction = (progress:number)=>number;
const finite=(value:number,name:string)=>{if(!Number.isFinite(value))throw new Error(`${name} must be finite`);return value;};
export function clamp01(value:number){return Math.max(0,Math.min(1,finite(value,'Progress')));}
export const easing = Object.freeze({
 linear:(p:number)=>clamp01(p),
 smooth:(p:number)=>{p=clamp01(p);return p*p*(3-2*p);},
 inCubic:(p:number)=>clamp01(p)**3,
 outCubic:(p:number)=>1-(1-clamp01(p))**3,
 inOutCubic:(p:number)=>{p=clamp01(p);return p<.5?4*p*p*p:1-(-2*p+2)**3/2;},
});

/** start/duration use milliseconds. Before start => 0; at/after end => 1.
 * Custom easing may overshoot inside the interval. This does not control visibility.
 */
export function progress(time:Pick<TimeSnapshot,'ms'>,start:number,duration:number,ease:EasingFunction=easing.linear){
 finite(time.ms,'Time');finite(start,'Start');finite(duration,'Duration');
 if(duration<=0)throw new Error('Duration must be positive');
 const p=clamp01((time.ms-start)/duration);
 if(p===0||p===1)return p;
 return finite(ease(p),'Easing result');
}

/** Unclamped interpolation supports overshooting custom easing. */
export function lerp(from:number,to:number,amount:number){
 finite(from,'From');finite(to,'To');finite(amount,'Amount');
 return finite(from+(to-from)*amount,'Interpolated value');
}

/** Indexed randomness: stable across seek/order, no mutable generator or frame state.
 * Suitable for visual scatter, not cryptography or cross-engine bit-identical simulation.
 */
export function randomAt(index:number,seed=0){
 if(!Number.isSafeInteger(index)||!Number.isSafeInteger(seed))throw new Error('Random index and seed must be safe integers');
 const n=Math.sin(index*127.1+311.7+seed*74.7)*43758.5453;
 return n-Math.floor(n);
}

/** Draw a radial glow without leaking Canvas style or altering the current path.
 * Uses native color parsing. Negative/nonfinite radius is rejected; zero is a no-op.
 */
export function radialGlow(ctx:CanvasRenderingContext2D,x:number,y:number,radius:number,color:string,edgeColor='#00000000'){
 finite(x,'X');finite(y,'Y');finite(radius,'Radius');
 if(radius<0)throw new Error('Radius cannot be negative');if(radius===0)return;
 ctx.save();
 try{
  const gradient=ctx.createRadialGradient(x,y,0,x,y,radius);
  gradient.addColorStop(0,color);gradient.addColorStop(1,edgeColor);
  ctx.fillStyle=gradient;ctx.fillRect(x-radius,y-radius,radius*2,radius*2);
 }finally{ctx.restore();}
}
