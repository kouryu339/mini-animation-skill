import type {AnimationDocument,AnimationLayer} from './model.js';
/** Bottom to top: implicit legacy canvas, declared canvas layers, declared camera layers. */
export function orderedLayers(document:Readonly<AnimationDocument>):AnimationLayer[]{
 return [{id:'$default',space:'canvas'},...(document.layers??[]).filter(l=>l.space==='canvas'),...(document.layers??[]).filter(l=>l.space==='camera')];
}
