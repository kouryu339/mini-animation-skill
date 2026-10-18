import type {AnimationPlayer} from './player.js';
import type {AnimationOptions} from './model.js';
export interface ExportSource {player:AnimationPlayer;options?:AnimationOptions;filename?:string}
/** Optional reusable HTML controls. Encoders load only when requested; no automatic upload. */
export function mountExportControls(host:HTMLElement,getSource:()=>ExportSource){
 const container=host.ownerDocument.createElement('div'),root=container.attachShadow({mode:'open'});host.appendChild(container);
 root.innerHTML=`<style>
 :host{display:block;font:14px system-ui;color:inherit}button,select,input{font:inherit}button,select{border:1px solid #65738a;border-radius:5px;padding:8px 13px;background:#172231;color:#edf2fa}button{cursor:pointer}button:disabled{opacity:.5;cursor:default}button:focus-visible,select:focus-visible,input:focus-visible,a:focus-visible{outline:2px solid #91c7ff;outline-offset:3px}section{padding:14px 0}fieldset{border:1px solid #65738a;border-radius:6px;margin:12px 0;padding:16px;display:flex;gap:14px;align-items:center;flex-wrap:wrap}fieldset[hidden]{display:none}legend{padding:0 7px}label{display:flex;gap:8px;align-items:center}small{display:block;opacity:.75;margin:10px 0;line-height:1.6}progress{width:140px;accent-color:#82e5c4}a{color:#8fd8ff}output{font-size:13px}button[hidden],a[hidden],progress[hidden]{display:none}
 </style><section><button id="toggle" aria-expanded="false">导出 MP4 / GIF</button>
 <fieldset hidden><legend>导出整段动画</legend><label>格式 <select id="format"><option value="mp4">MP4 · 720p / 30 fps</option><option value="gif">GIF · 480px / 10 fps</option></select></label><label><input id="captions" type="checkbox" checked> 包含字幕</label><button id="start">开始导出</button><button id="cancel" hidden>取消</button><progress hidden max="1" value="0" aria-label="导出进度"></progress><output role="status" aria-live="polite"></output><a id="download" hidden>再次下载</a></fieldset>
 <small>本地生成，无音轨。字幕选项控制旁白字幕，画面标题与图表文字会保留。GIF 色彩与清晰度低于 MP4。</small></section>`;
 const get=<T extends Element>(selector:string)=>root.querySelector<T>(selector)!;
 const toggle=get<HTMLButtonElement>('#toggle'),panel=get<HTMLFieldSetElement>('fieldset'),format=get<HTMLSelectElement>('#format'),captions=get<HTMLInputElement>('#captions'),start=get<HTMLButtonElement>('#start'),cancel=get<HTMLButtonElement>('#cancel'),bar=get<HTMLProgressElement>('progress'),status=get<HTMLOutputElement>('output'),download=get<HTMLAnchorElement>('#download');
 let active:AbortController|undefined,url:string|undefined,destroyed=false,initialized=false;
 const revoke=()=>{if(url){URL.revokeObjectURL(url);url=undefined;}download.hidden=true;download.removeAttribute('href');};
 toggle.onclick=()=>{
  panel.hidden=!panel.hidden;toggle.setAttribute('aria-expanded',String(!panel.hidden));
  if(!initialized&&!panel.hidden){captions.checked=getSource().player.snapshot().captionsEnabled;initialized=true;}
 };
 cancel.onclick=()=>{active?.abort();cancel.disabled=true;status.textContent='正在取消…';};
 start.onclick=async()=>{
  if(active||destroyed)return;
  const controller=new AbortController();active=controller;
  start.disabled=true;format.disabled=true;captions.disabled=true;cancel.hidden=false;cancel.disabled=false;bar.hidden=false;bar.value=0;status.textContent='准备画面…';revoke();
  try{
   const source=getSource();source.player.pause();
   const json=JSON.stringify(source.player.compiled.document),kind=format.value;
   const options={...source.options,canvasDrawers:source.options?.canvasDrawers?.map(drawer=>({...drawer})),captionsEnabled:captions.checked,signal:controller.signal,onProgress:(value:number)=>{if(!destroyed&&!controller.signal.aborted){bar.value=value;status.textContent=`正在导出 ${Math.round(value*100)}%`;}}};
   // Do not set undefined optional fields: preserve host-defined resource resolvers and strict typing.
   const {canvasDrawers,...rest}=options;
   const resolved={...rest,...(canvasDrawers?{canvasDrawers}:{})};
   const blob=kind==='gif'?await (await import('./export-gif.js')).exportAnimationGif(json,{...resolved,fps:10,maxWidth:480}):await (await import('./export-mp4.js')).exportAnimationMp4(json,{...resolved,fps:30,maxHeight:720});
   if(destroyed||controller.signal.aborted)return;
   const filename=(source.filename??'animation').replace(/[<>:"/\\|?*\u0000-\u001f]/g,'-');
   url=URL.createObjectURL(blob);download.href=url;download.download=`${filename}${captions.checked?'-subtitles':'-clean'}.${kind}`;download.hidden=false;
   status.textContent=`导出完成 · ${(blob.size/1024/1024).toFixed(1)} MB`;download.click();
  }catch(error){if(!destroyed)status.textContent=controller.signal.aborted?'已取消导出':`导出失败：${error instanceof Error?error.message:String(error)}`;}
  finally{active=undefined;if(!destroyed){start.disabled=false;format.disabled=false;captions.disabled=false;cancel.hidden=true;bar.hidden=true;}}
 };
 return {destroy(){destroyed=true;active?.abort();revoke();container.remove();}};
}
