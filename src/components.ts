import type {CanvasNode,MotionEntity,LegacyCanvasNode,AnimationDocument,CameraEntity,CameraDefinition} from './model.js';
import {createTransform,TRANSFORM_PROPERTIES} from './transform.js';
/** Compatibility is confined here; the renderer receives composed entities only. */
export function createEntity(node:CanvasNode):MotionEntity {
 if(!('type' in node))return {id:node.id,...(node.parent?{parent:node.parent}:{}),...(node.layer?{layer:node.layer}:{}),components:{transform:createTransform(node.components?.transform),...(node.components?.graphic?{graphic:{...node.components.graphic}}:{})}};
 const transform=createTransform();for(const key of TRANSFORM_PROPERTIES)if(node[key]!==undefined)transform[key]=node[key]!;
 const {id,parent,layer,type,...rest}=node as LegacyCanvasNode;
 for(const key of TRANSFORM_PROPERTIES)delete rest[key];
 return {id,...(parent?{parent}:{}),...(layer?{layer}:{}),components:{transform,...(type!=='group'?{graphic:{...rest,type}}:{})}};
}
export function createCameraEntity(doc:Readonly<AnimationDocument>,definition:CameraDefinition|undefined=doc.camera):CameraEntity {
 const c=definition,components=c?.components;
 return {components:{transform:createTransform({x:doc.width/2,y:doc.height/2,...(components?components.transform:{x:c?.x??doc.width/2,y:c?.y??doc.height/2,scale:c?.zoom??1})}),camera:{width:components?.camera?.width??c?.width??doc.width,height:components?.camera?.height??c?.height??doc.height}}};
}

/** Named cameras are independent entities, sharing only the scene clock. */
export function createCameraEntities(doc:Readonly<AnimationDocument>):Record<string,CameraEntity>{
 const result:Record<string,CameraEntity>=Object.create(null);
 if(doc.cameras)for(const [id,definition]of Object.entries(doc.cameras))result[id]=createCameraEntity(doc,definition);
 else result['$default']=createCameraEntity(doc);
 return result;
}
