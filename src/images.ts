import type {AnimationDocument,AnimationOptions} from './model.js';
import {LIMITS,fail} from './validate.js';
export interface DecodedImage {image:HTMLImageElement;dataURL:string;width:number;height:number}
/** Inspect dimensions before invoking a browser decoder. SVG/HTML and animated formats are not accepted. */
export function inspectImage(bytes:Uint8Array):{mime:string;width:number;height:number}{
 const b=bytes,v=new DataView(b.buffer,b.byteOffset,b.byteLength),ascii=(at:number,n:number)=>String.fromCharCode(...b.slice(at,at+n));
 const bad=():never=>fail('assets','invalid, animated or unsupported raster image');
 if(b.length<24||b.length>LIMITS.imageBytes)return bad();
 let width=0,height=0,mime='';
 if(b[0]===137&&ascii(1,7)==='PNG\r\n\x1a\n'&&ascii(12,4)==='IHDR'){
  width=v.getUint32(16);height=v.getUint32(20);mime='image/png';
  for(let at=8;at+12<=b.length;){const length=v.getUint32(at);if(at+12+length>b.length)return bad();if(ascii(at+4,4)==='acTL')return bad();at+=12+length;}
 }else if(b[0]===255&&b[1]===216){
  mime='image/jpeg';let at=2;
  while(at+4<=b.length){if(b[at++]!==255)return bad();while(b[at]===255)at++;const marker=b[at++]!;if(marker===0xda||marker===0xd9)break;if(at+2>b.length)return bad();const length=v.getUint16(at);if(length<2||at+length>b.length)return bad();if([0xc0,0xc1,0xc2].includes(marker)){if(length<8)return bad();height=v.getUint16(at+3);width=v.getUint16(at+5);break;}at+=length;}
 }else if(ascii(0,4)==='RIFF'&&ascii(8,4)==='WEBP'){
  mime='image/webp';const tag=ascii(12,4);if(b.length<30)return bad();
  if(tag==='VP8X'){if(b[20]!&2)return bad();width=1+b[24]!+(b[25]!<<8)+(b[26]!<<16);height=1+b[27]!+(b[28]!<<8)+(b[29]!<<16);}
  else if(tag==='VP8L'&&b[20]===47){const bits=v.getUint32(21,true);width=(bits&0x3fff)+1;height=((bits>>>14)&0x3fff)+1;}
  else if(tag==='VP8 '&&ascii(23,3)==='\x9d\x01\x2a'){width=v.getUint16(26,true)&0x3fff;height=v.getUint16(28,true)&0x3fff;}
 }
 if(!mime||!width||!height||width>4096||height>4096||width*height>LIMITS.imagePixels)fail('assets','unsupported image or decoded pixel budget exceeded');
 return {mime,width,height};
}
async function fetchBlob(url:URL,signal:AbortSignal):Promise<Blob>{
 const response=await fetch(url,{signal,credentials:'omit',mode:'same-origin',redirect:'error'});
 if(!response.ok||!response.body)throw new Error('Image load failed: '+response.status);
 const reader=response.body.getReader(),chunks:Uint8Array<ArrayBuffer>[]=[];let length=0;
 try{for(;;){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>LIMITS.imageBytes)fail('assets','image byte budget exceeded');chunks.push(value);}}finally{await reader.cancel().catch(()=>{});reader.releaseLock();}
 return new Blob(chunks);
}
/** One cache and abort controller per player/export; no globals, external fetch or author callbacks. */
export class ImageResources {
 private items=new Map<string,DecodedImage>();private controller=new AbortController();private pending?:Promise<void>;private disposed=false;
 constructor(private document:Readonly<AnimationDocument>,private owner:Document,private options:AnimationOptions={}){}
 get(id:string){return this.items.get(id);}
 prepare():Promise<void>{return this.pending??=this.load();}
 private async load(){
  let bytesTotal=0,pixelsTotal=0;const signal=this.controller.signal;
  for(const [id,asset]of Object.entries(this.document.assets??{})){
   signal.throwIfAborted();const timer=setTimeout(()=>this.controller.abort(new Error('Image preparation timed out')),15000);
   try{
    let blob:Blob;
    if(this.options.resolveImage){
     blob=await new Promise<Blob>((resolve,reject)=>{const abort=()=>reject(signal.reason);signal.addEventListener('abort',abort,{once:true});Promise.resolve().then(()=>this.options.resolveImage!(id,asset,signal)).then(resolve,reject).finally(()=>signal.removeEventListener('abort',abort));});
    }else{
     const base=new URL(this.options.assetBaseURL??this.owner.baseURI,this.owner.baseURI),origin=new URL(this.owner.baseURI).origin,url=new URL(asset.src,base);
     if(!['http:','https:'].includes(url.protocol)||base.origin!==origin||url.origin!==origin||url.username||url.password)fail('assets.'+id,'images must be local same-origin resources');
     blob=await fetchBlob(url,signal);
    }
    signal.throwIfAborted();if(!(blob instanceof Blob)||blob.size>LIMITS.imageBytes)fail('assets.'+id,'invalid blob or image byte budget exceeded');
    bytesTotal+=blob.size;if(bytesTotal>LIMITS.totalImageBytes)fail('assets','total image byte budget exceeded');
    const bytes=new Uint8Array(await blob.arrayBuffer()),info=inspectImage(bytes);pixelsTotal+=info.width*info.height;if(pixelsTotal>LIMITS.totalImagePixels)fail('assets','total decoded pixel budget exceeded');
    let binary='';for(let i=0;i<bytes.length;i+=32768)binary+=String.fromCharCode(...bytes.subarray(i,i+32768));const dataURL='data:'+info.mime+';base64,'+btoa(binary),image=this.owner.createElement('img');
    try{await new Promise<void>((resolve,reject)=>{const finish=(error?:unknown)=>{image.onload=null;image.onerror=null;signal.removeEventListener('abort',abort);error?reject(error):resolve();};const abort=()=>finish(signal.reason);image.onload=()=>finish();image.onerror=()=>finish(new Error('Image decode failed: '+id));signal.addEventListener('abort',abort,{once:true});if(signal.aborted){abort();return;}image.src=dataURL;});signal.throwIfAborted();
     // JPEG orientation can swap the decoded dimensions. Both orientations have the same pixel budget.
     if(image.naturalWidth*image.naturalHeight!==info.width*info.height)fail('assets.'+id,'decoded size differs from header');
     this.items.set(id,{image,dataURL,width:image.naturalWidth,height:image.naturalHeight});
    }catch(error){image.src='';throw error;}
   }catch(error){if(!this.disposed)this.clear();throw new Error('Image asset '+id+': '+(error instanceof Error?error.message:String(error)));}finally{clearTimeout(timer);}
  }
 }
 private clear(){for(const item of this.items.values())item.image.src='';this.items.clear();}
 destroy(){this.disposed=true;this.controller.abort(new DOMException('Animation destroyed','AbortError'));this.clear();}
}
