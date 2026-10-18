import type {AnimationFrame,CaptionStyle} from '../model.js';
const fonts={sans:'"Microsoft YaHei",sans-serif',serif:'SimSun,serif',mono:'monospace'};
/** Paint the same bounded style/content as the DOM subtitle layer. No HTML rasterizer. */
export function drawCaption(c:CanvasRenderingContext2D,frame:AnimationFrame,s:Readonly<Required<CaptionStyle>>,width:number,height:number){const cue=frame.caption;if(!cue)return;
 const font=Math.max(12,Math.min(s.fontSize,s.fontSize*width/1280)),padding=s.padding*width/1280,boxWidth=width*(1-s.inset*2/100),maxWidth=boxWidth-padding*2,lineHeight=font*s.lineHeight;
 c.save();c.globalAlpha=cue.opacity;c.font=`${font}px ${fonts[s.font]}`;c.textBaseline='middle';c.textAlign=s.align;
 const content=`${s.showSpeaker&&cue.speaker?cue.speaker+'\n':''}${cue.text}`,lines:string[]=[];
 for(const paragraph of content.split('\n')){let line='';for(const char of Array.from(paragraph)){const next=line+char;if(line&&c.measureText(next).width>maxWidth){lines.push(line);line=char;}else line=next;}lines.push(line);}
 const boxHeight=lines.length*lineHeight+padding*2,x=width*s.inset/100,y=s.position==='top'?height*s.offset/100:height*(1-s.offset/100)-boxHeight;
 c.fillStyle=s.background;c.beginPath();c.roundRect(x,y,boxWidth,boxHeight,s.radius*width/1280);c.fill();c.fillStyle=s.color;
 if(s.shadow){c.shadowColor='#00000099';c.shadowBlur=4;c.shadowOffsetY=1;}
 const textX=s.align==='center'?width/2:s.align==='right'?x+boxWidth-padding:x+padding;
 lines.forEach((line,i)=>c.fillText(line,textX,y+padding+lineHeight*(i+.5)));c.restore();
}
