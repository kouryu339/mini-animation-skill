import type {TransformComponent,TransformDefinition} from './model.js';
export const TRANSFORM_PROPERTIES = ['x','y','rotate','scale','scaleX','scaleY','opacity','pivotX','pivotY'] as const;
/** Each entity owns a fresh component. No inheritance or shared mutable defaults. */
export function createTransform(config:TransformDefinition = {}):TransformComponent {
 return {x:0,y:0,rotate:0,scale:1,scaleX:1,scaleY:1,opacity:1,pivotX:0,pivotY:0,...config};
}
/** Local pixel pivot; identity scale/rotation preserves position. */
export function transformMatrix(p:TransformComponent):[number,number,number,number,number,number] {
 const angle=p.rotate*Math.PI/180,cos=Math.cos(angle),sin=Math.sin(angle);
 const a=cos*p.scale*p.scaleX,b=sin*p.scale*p.scaleX,c=-sin*p.scale*p.scaleY,d=cos*p.scale*p.scaleY;
 return [a,b,c,d,p.x+p.pivotX-a*p.pivotX-c*p.pivotY,p.y+p.pivotY-b*p.pivotX-d*p.pivotY];
}
