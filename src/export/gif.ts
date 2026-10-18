/** Small local GIF89a encoder: per-frame median-cut palette and bounded LZW dictionary.
 * Format reference: https://www.w3.org/Graphics/GIF/spec-gif89a.txt
 */
function quantize(rgba:Uint8ClampedArray){
 const histogram=new Uint32Array(32768),red=new Float64Array(32768),green=new Float64Array(32768),blue=new Float64Array(32768);
 for(let i=0;i<rgba.length;i+=4){const r=rgba[i]!,g=rgba[i+1]!,b=rgba[i+2]!,key=((r>>3)<<10)|((g>>3)<<5)|(b>>3);histogram[key]!++;red[key]!+=r;green[key]!+=g;blue[key]!+=b;}
 type Bin={key:number;r:number;g:number;b:number;count:number};
 const bins:Bin[]=[];for(let i=0;i<histogram.length;i++)if(histogram[i])bins.push({key:i,r:red[i]!/histogram[i]!,g:green[i]!/histogram[i]!,b:blue[i]!/histogram[i]!,count:histogram[i]!});
 function box(items:Bin[]){
  const ranges=([ 'r','g','b'] as const).map(channel=>{let lo=255,hi=0;for(const item of items){lo=Math.min(lo,item[channel]);hi=Math.max(hi,item[channel]);}return hi-lo;});
  const axis=([ 'r','g','b'] as const)[ranges.indexOf(Math.max(...ranges))]!;
  const weight=items.reduce((sum,item)=>sum+item.count,0);
  return {items,axis,weight,score:items.length>1?Math.max(...ranges)*Math.sqrt(weight):0};
 }
 const boxes=[box(bins)];
 while(boxes.length<256){let at=0;for(let i=1;i<boxes.length;i++)if(boxes[i]!.score>boxes[at]!.score)at=i;const current=boxes[at]!;if(!current.score)break;
  current.items.sort((a,b)=>a[current.axis]-b[current.axis]);let sum=0,split=1;
  for(;split<current.items.length;split++){sum+=current.items[split-1]!.count;if(sum>=current.weight/2)break;}
  split=Math.min(split,current.items.length-1);boxes[at]=box(current.items.slice(0,split));boxes.push(box(current.items.slice(split)));
 }
 const palette=new Uint8Array(768),lookup=new Uint8Array(32768);
 boxes.forEach((group,index)=>{let r=0,g=0,b=0;for(const item of group.items){r+=item.r*item.count;g+=item.g*item.count;b+=item.b*item.count;lookup[item.key]=index;}palette[index*3]=Math.round(r/group.weight);palette[index*3+1]=Math.round(g/group.weight);palette[index*3+2]=Math.round(b/group.weight);});
 const pixels=new Uint8Array(rgba.length/4);for(let i=0;i<pixels.length;i++)pixels[i]=lookup[((rgba[i*4]!>>3)<<10)|((rgba[i*4+1]!>>3)<<5)|(rgba[i*4+2]!>>3)]!;
 return {palette,pixels};
}
function lzw(pixels:Uint8Array){
 const bytes:number[]=[];let bits=9,next=258,buffer=0,used=0;const dictionary=new Map<number,number>();
 const write=(code:number)=>{buffer|=code<<used;used+=bits;while(used>=8){bytes.push(buffer&255);buffer>>>=8;used-=8;}};
 const emit=(code:number)=>{write(code);if(next===(1<<bits)&&bits<12)bits++;};
 write(256);let prefix=pixels[0]!;
 for(let i=1;i<pixels.length;i++){
  const value=pixels[i]!,key=prefix*256+value,match=dictionary.get(key);
  if(match!==undefined){prefix=match;continue;}
  emit(prefix);
  if(next<4096)dictionary.set(key,next++);
  else{write(256);dictionary.clear();bits=9;next=258;}
  prefix=value;
 }
 emit(prefix);write(257);if(used)bytes.push(buffer&255);return new Uint8Array(bytes);
}
export class GifEncoder {
 private parts:BlobPart[]=[];private bytes=0;private frames=0;private finished=false;
 constructor(private width:number,private height:number,private maxBytes=128*1024*1024){
  if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||width>960||height>960)throw new Error('GIF 尺寸必须在 1–960 像素范围');
  this.append(new Uint8Array([71,73,70,56,57,97,width&255,width>>8,height&255,height>>8,0x70,0,0,0x21,0xff,11,...Array.from('NETSCAPE2.0',c=>c.charCodeAt(0)),3,1,0,0,0]));
 }
 private append(bytes:Uint8Array<ArrayBuffer>){if(this.bytes+bytes.length>this.maxBytes)throw new Error('GIF 超过 128 MB，请降低分辨率或缩短片段');this.bytes+=bytes.length;this.parts.push(bytes);}
 add(rgba:Uint8ClampedArray,delayCs:number){
  if(this.finished)throw new Error('GIF already finalized');
  if(rgba.length!==this.width*this.height*4||!Number.isInteger(delayCs)||delayCs<1||delayCs>65535)throw new Error('Invalid GIF frame');
  const {palette,pixels}=quantize(rgba),compressed=lzw(pixels);
  this.append(new Uint8Array([0x21,0xf9,4,4,delayCs&255,delayCs>>8,0,0,0x2c,0,0,0,0,this.width&255,this.width>>8,this.height&255,this.height>>8,0x87]));
  this.append(palette);
  const blocks=new Uint8Array(2+compressed.length+Math.ceil(compressed.length/255));blocks[0]=8;let offset=1;
  for(let i=0;i<compressed.length;i+=255){const block=compressed.subarray(i,i+255);blocks[offset++]=block.length;blocks.set(block,offset);offset+=block.length;}
  this.append(blocks);this.frames++;
 }
 finish(){if(this.finished||!this.frames)throw new Error('GIF requires frames and a single finalize');this.append(new Uint8Array([0x3b]));this.finished=true;const blob=new Blob(this.parts,{type:'image/gif'});this.parts=[];return blob;}
}
