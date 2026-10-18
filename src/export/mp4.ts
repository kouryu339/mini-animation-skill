/** Minimal single-track AVC MP4 writer. No audio, edit lists, B-frames or external resources.
 * ISO BMFF timing uses integer microseconds. All byte offsets are checked below 32-bit limits.
 */
const u16=(n:number)=>new Uint8Array([n>>>8,n&255]);
const u32=(n:number)=>new Uint8Array([n>>>24,(n>>>16)&255,(n>>>8)&255,n&255]);
const ascii=(s:string)=>new TextEncoder().encode(s);
const zeros=(n:number)=>new Uint8Array(n);
function concat(...parts:Uint8Array[]):Uint8Array<ArrayBuffer>{const out=new Uint8Array(parts.reduce((n,p)=>n+p.length,0));let at=0;for(const p of parts){out.set(p,at);at+=p.length;}return out;}
const box=(name:string,...parts:Uint8Array[])=>{const data=concat(...parts);return concat(u32(data.length+8),ascii(name),data);};
const full=(name:string,flags:number,...parts:Uint8Array[])=>box(name,u32(flags),...parts);
const matrix=concat(...[0x10000,0,0,0,0x10000,0,0,0,0x40000000].map(u32));
interface Sample {data:Uint8Array<ArrayBuffer>;timestamp:number;duration:number;key:boolean}
export class Mp4VideoMuxer {
 private samples:Sample[]=[];private bytes=0;private duration=0;private description:Uint8Array<ArrayBuffer>|undefined;private finished=false;
 constructor(private width:number,private height:number,private maxBytes=256*1024*1024){if(!Number.isInteger(width)||!Number.isInteger(height)||width<2||height<2||width>1920||height>1080||width%2||height%2)throw new Error('MP4 dimensions must be even and within 1920×1080');}
 setDecoderConfig(description:Uint8Array){if(this.finished)throw new Error('MP4 already finalized');if(description.length<7||description.length>65536||description[0]!==1)throw new Error('Invalid AVC decoder configuration');if(this.description&&(description.length!==this.description.length||description.some((v,i)=>v!==this.description![i])))throw new Error('AVC configuration changed during export');this.description=description.slice();}
 add(data:Uint8Array,timestamp:number,duration:number,key:boolean){if(this.finished)throw new Error('MP4 already finalized');if(!data.length||!Number.isSafeInteger(timestamp)||!Number.isSafeInteger(duration)||duration<=0||timestamp!==this.duration)throw new Error('MP4 requires contiguous frames without reordering');if(!this.samples.length&&!key)throw new Error('MP4 must start with a key frame');if(this.samples.length>=18000||timestamp+duration>600000000||this.bytes+data.length>this.maxBytes)throw new Error('视频超过导出资源上限（10 分钟 / 256 MB）');this.bytes+=data.length;this.duration+=duration;this.samples.push({data:data.slice(),timestamp,duration,key});}
 private movie(offsets:number[]){const samples=this.samples,count=samples.length,scale=1000000;
  const mvhd=full('mvhd',0,u32(0),u32(0),u32(scale),u32(this.duration),u32(0x10000),u16(0x100),zeros(10),matrix,zeros(24),u32(2));
  const tkhd=full('tkhd',7,u32(0),u32(0),u32(1),u32(0),u32(this.duration),zeros(8),u16(0),u16(0),u16(0),u16(0),matrix,u32(this.width*65536),u32(this.height*65536));
  const mdhd=full('mdhd',0,u32(0),u32(0),u32(scale),u32(this.duration),u16(0x55c4),u16(0));
  const hdlr=full('hdlr',0,u32(0),ascii('vide'),zeros(12),ascii('Rusie video\0'));
  const avc1=box('avc1',zeros(6),u16(1),zeros(16),u16(this.width),u16(this.height),u32(0x480000),u32(0x480000),u32(0),u16(1),zeros(32),u16(24),u16(65535),box('avcC',this.description!));
  const timing:{count:number;delta:number}[]=[];for(const s of samples){const last=timing.at(-1);if(last?.delta===s.duration)last.count++;else timing.push({count:1,delta:s.duration});}
  const stts=full('stts',0,u32(timing.length),...timing.map(t=>concat(u32(t.count),u32(t.delta))));
  const stsz=full('stsz',0,u32(0),u32(count),...samples.map(s=>u32(s.data.length)));
  const stsc=full('stsc',0,u32(1),u32(1),u32(1),u32(1));
  const stco=full('stco',0,u32(offsets.length),...offsets.map(u32));
  const keys=samples.flatMap((s,i)=>s.key?[i+1]:[]),stss=full('stss',0,u32(keys.length),...keys.map(u32));
  const stbl=box('stbl',full('stsd',0,u32(1),avc1),stts,stsc,stsz,stco,stss);
  const dinf=box('dinf',full('dref',0,u32(1),full('url ',1)));
  const minf=box('minf',full('vmhd',1,zeros(8)),dinf,stbl);
  return box('moov',mvhd,box('trak',tkhd,box('mdia',mdhd,hdlr,minf)));
 }
 finalize():Blob {if(this.finished)throw new Error('MP4 already finalized');if(!this.samples.length||!this.description)throw new Error('No encoded video or AVC configuration');
  const ftyp=box('ftyp',ascii('isom'),u32(0x200),ascii('isomiso2avc1mp41'));const empty=this.movie(this.samples.map(()=>0));let offset=ftyp.length+empty.length+8;const offsets=this.samples.map(s=>{const value=offset;offset+=s.data.length;return value;});if(offset>0xffffffff)throw new Error('MP4 offset overflow');const moov=this.movie(offsets);
  const result=new Blob([ftyp.buffer,moov.buffer,concat(u32(this.bytes+8),ascii('mdat')).buffer,...this.samples.map(s=>s.data.buffer)],{type:'video/mp4'});this.finished=true;this.samples=[];return result;
 }
}
