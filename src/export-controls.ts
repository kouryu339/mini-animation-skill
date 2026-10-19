import type {AnimationPlayer} from './player.js';
import type {AnimationOptions} from './model.js';
export interface ExportSource {player:AnimationPlayer;options?:AnimationOptions;filename?:string}
/** Optional reusable HTML controls. Encoders load only when requested; no automatic upload. */
export function mountExportControls(host:HTMLElement,getSource:()=>ExportSource){
 const container=host.ownerDocument.createElement('div'),root=container.attachShadow({mode:'open'});host.appendChild(container);
 root.innerHTML=`<style>
 :host{display:block;font:14px system-ui;color:inherit}button,select,input{font:inherit}button,select{border:1px solid #65738a;border-radius:5px;padding:8px 13px;background:#172231;color:#edf2fa}button{cursor:pointer}button:disabled{opacity:.5;cursor:default}button:focus-visible,select:focus-visible,input:focus-visible,a:focus-visible{outline:2px solid #91c7ff;outline-offset:3px}section{padding:14px 0}fieldset{border:1px solid #65738a;border-radius:6px;margin:12px 0;padding:16px;display:flex;gap:14px;align-items:center;flex-wrap:wrap}fieldset[hidden]{display:none}legend{padding:0 7px}label{display:flex;gap:8px;align-items:center}small{display:block;opacity:.75;margin:10px 0;line-height:1.6}progress{width:140px;accent-color:#82e5c4}a{color:#8fd8ff}output{font-size:13px}button[hidden],a[hidden],progress[hidden]{display:none}
 </style><section><button id="toggle" aria-expanded="false">Export MP4 / GIF</button>
 <fieldset hidden><legend>Export full animation</legend><label>Format <select id="format"><option value="mp4">MP4 · 720p / 30 fps</option><option value="gif">GIF · 480px / 10 fps</option></select></label><label><input id="captions" type="checkbox" checked> Include subtitles</label><button id="start">Start export</button><button id="cancel" hidden>Cancel</button><progress hidden max="1" value="0" aria-label="Export progress"></progress><output role="status" aria-live="polite"></output><a id="download" hidden>Download again</a></fieldset>
 <small>Generated locally, without audio. The subtitle option controls narration captions; artwork titles and chart labels remain. GIF has lower color fidelity and resolution than MP4.</small></section>`;
 const get=<T extends Element>(selector:string)=>root.querySelector<T>(selector)!;
 const toggle=get<HTMLButtonElement>('#toggle'),panel=get<HTMLFieldSetElement>('fieldset'),format=get<HTMLSelectElement>('#format'),captions=get<HTMLInputElement>('#captions'),start=get<HTMLButtonElement>('#start'),cancel=get<HTMLButtonElement>('#cancel'),bar=get<HTMLProgressElement>('progress'),status=get<HTMLOutputElement>('output'),download=get<HTMLAnchorElement>('#download');
 let active:AbortController|undefined,url:string|undefined,destroyed=false,initialized=false;
 const revoke=()=>{if(url){URL.revokeObjectURL(url);url=undefined;}download.hidden=true;download.removeAttribute('href');};
 toggle.onclick=()=>{
  panel.hidden=!panel.hidden;toggle.setAttribute('aria-expanded',String(!panel.hidden));
  if(!initialized&&!panel.hidden){captions.checked=getSource().player.snapshot().captionsEnabled;initialized=true;}
 };
 cancel.onclick=()=>{active?.abort();cancel.disabled=true;status.textContent='Cancelling…';};
 start.onclick=async()=>{
  if(active||destroyed)return;
  const controller=new AbortController();active=controller;
  start.disabled=true;format.disabled=true;captions.disabled=true;cancel.hidden=false;cancel.disabled=false;bar.hidden=false;bar.value=0;status.textContent='Preparing frames…';revoke();
  try{
   const source=getSource();source.player.pause();
   const json=JSON.stringify(source.player.compiled.document),kind=format.value;
   const options={...source.options,canvasDrawers:source.options?.canvasDrawers?.map(drawer=>({...drawer})),captionsEnabled:captions.checked,signal:controller.signal,onProgress:(value:number)=>{if(!destroyed&&!controller.signal.aborted){bar.value=value;status.textContent=`Exporting ${Math.round(value*100)}%`;}}};
   // Do not set undefined optional fields: preserve host-defined resource resolvers and strict typing.
   const {canvasDrawers,...rest}=options;
   const resolved={...rest,...(canvasDrawers?{canvasDrawers}:{})};
   const blob=kind==='gif'?await (await import('./export-gif.js')).exportAnimationGif(json,{...resolved,fps:10,maxWidth:480}):await (await import('./export-mp4.js')).exportAnimationMp4(json,{...resolved,fps:30,maxHeight:720});
   if(destroyed||controller.signal.aborted)return;
   const filename=(source.filename??'animation').replace(/[<>:"/\\|?*\u0000-\u001f]/g,'-');
   url=URL.createObjectURL(blob);download.href=url;download.download=`${filename}${captions.checked?'-subtitles':'-clean'}.${kind}`;download.hidden=false;
   status.textContent=`Export complete · ${(blob.size/1024/1024).toFixed(1)} MB`;download.click();
  }catch(error){if(!destroyed)status.textContent=controller.signal.aborted?'Export cancelled':`Export failed: ${error instanceof Error?error.message:String(error)}`;}
  finally{active=undefined;if(!destroyed){start.disabled=false;format.disabled=false;captions.disabled=false;cancel.hidden=true;bar.hidden=true;}}
 };
 return {destroy(){destroyed=true;active?.abort();revoke();container.remove();}};
}
