import type {AnimationDocument,AnimationFrame,CaptionStyle} from './model.js';
import {validateCaptionStyle} from './validate.js';
/** One shared default for every surface and subject. Assets only specify their exceptions. */
export const DEFAULT_CAPTION_STYLE:Readonly<Required<CaptionStyle>>=Object.freeze({fontSize:24,font:'sans',color:'#f5eedc',background:'#0b171ecc',align:'center',position:'bottom',inset:8,offset:2,padding:8,radius:6,lineHeight:1.4,shadow:true,showSpeaker:false});
export function resolveCaptionStyle(asset?:CaptionStyle,host?:CaptionStyle,legacyTheme?:AnimationDocument['captionTheme']):Readonly<Required<CaptionStyle>>{
 const style={...DEFAULT_CAPTION_STYLE,...(legacyTheme==='paper'?{color:'#252e2b',background:'#e8ebdf',shadow:false}:{} )};
 for(const override of [asset,host])if(override!==undefined){validateCaptionStyle(override);for(const [key,value]of Object.entries(override))if(value!==undefined)(style as unknown as Record<string,unknown>)[key]=value;}
 return Object.freeze(style);
}
const fonts={sans:'"Microsoft YaHei",sans-serif',serif:'SimSun,serif',mono:'monospace'};
/** Subtitle DOM is separate from authored graphics, with no author CSS or HTML entry point. */
export class CaptionRenderer {
 readonly element:HTMLDivElement;private style:Readonly<Required<CaptionStyle>>;
 constructor(root:HTMLElement,doc:Readonly<AnimationDocument>,override?:CaptionStyle){
  this.style=resolveCaptionStyle(doc.captionStyle,override,doc.captionTheme);const s=this.style,el=root.ownerDocument.createElement('div');this.element=el;
  el.setAttribute('data-motion-caption','');el.setAttribute('aria-live','off');const unit=(n:number)=>`${n/1280*100}cqw`;
  el.style.cssText='position:absolute;box-sizing:border-box;z-index:1;white-space:pre-wrap;overflow-wrap:anywhere;pointer-events:none;';
  el.style.fontFamily=fonts[s.font];el.style.fontSize=`clamp(12px,${unit(s.fontSize)},${s.fontSize}px)`;el.style.lineHeight=String(s.lineHeight);el.style.color=s.color;el.style.backgroundColor=s.background;el.style.textAlign=s.align;
  el.style.left=el.style.right=s.inset+'%';el.style[s.position]=s.offset+'%';el.style.padding=unit(s.padding);el.style.borderRadius=unit(s.radius);el.style.textShadow=s.shadow?'0 1px 4px #00000099':'none';root.appendChild(el);
 }
 render(frame:AnimationFrame){const cue=frame.caption;this.element.hidden=!cue;this.element.style.opacity=String(cue?.opacity??0);this.element.textContent=cue?`${this.style.showSpeaker&&cue.speaker?cue.speaker+'\n':''}${cue.text}`:'';}
 destroy(){this.element.remove();}
}
