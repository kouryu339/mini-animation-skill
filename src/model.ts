import type {TimeSnapshot} from './timeline.js';
/** Author input is data, never an executable module. All times are milliseconds. */
export interface TransformComponent {x:number;y:number;rotate:number;scale:number;scaleX:number;scaleY:number;opacity:number;pivotX:number;pivotY:number}
export type TransformDefinition=Partial<TransformComponent>;
export type TransformProperty=keyof TransformComponent;
export type MotionProperty=TransformProperty|'width'|'height'|'x2'|'y2'|'progress';
/** Multi-property action. Missing from values continue the state at the action start. */
export interface TransformTrack {type:'transform';target:string;at?:number;duration:number;to:TransformDefinition;from?:TransformDefinition;ease?:Ease}
export type Ease='linear'|'in'|'out'|'inOut';
export interface TweenTrack {type:'tween';target:string;property:MotionProperty;at?:number;duration:number;from:number;to:number;ease?:Ease;repeat?:number;yoyo?:boolean}
export interface WaveTrack {type:'wave';target:string;property:MotionProperty;at?:number;duration:number;center:number;amplitude:number;period:number;phase?:number}
export interface FollowTrack {type:'follow';target:string;at?:number;duration:number;points:[number,number][];orient?:boolean;ease?:Ease}
export interface ColorTrack {type:'color';target:string;property:'fill'|'stroke';at?:number;duration:number;from:string;to:string;ease?:Ease}
/** Camera position is its world-space center. Width/height are a paired base view, not video resolution. */
export interface CameraViewportComponent {width:number;height:number}
export interface CameraComponents {transform?:Pick<TransformDefinition,'x'|'y'|'scale'>;camera?:CameraViewportComponent}
/** Flat fields are compatibility input; new input uses component composition. */
export interface CameraDefinition {width?:number;height?:number;x?:number;y?:number;zoom?:number;components?:CameraComponents}
export interface CameraEntity {components:{transform:TransformComponent;camera:CameraViewportComponent}}
export interface CameraState {width:number;height:number;x:number;y:number;zoom:number}
export interface CameraCut {at:number;camera:string}
export interface CameraTrack {type:'camera';camera?:string;property:'x'|'y'|'zoom';at?:number;duration:number;from:number;to:number;ease?:Ease}
export type MotionTrack=TweenTrack|WaveTrack|FollowTrack|ColorTrack|CameraTrack|TransformTrack;
export interface SceneEffect {id:string;type:'rain'|'dust'|'ripple'|'vignette';at?:number;duration?:number;seed?:number;count?:number;color?:string;opacity?:number;speed?:number;size?:number;area?:{x:number;y:number;width:number;height:number}}
export interface EffectParticle {x:number;y:number;size:number;opacity:number;stretch:number}
export interface EffectFrame {id:string;type:SceneEffect['type'];color:string;opacity:number;particles:EffectParticle[]}
export interface GraphicComponent {type:'rect'|'circle'|'path'|'text'|'line'|'image';asset?:string;fit?:'contain'|'cover'|'stretch';fill?:string;stroke?:string;strokeWidth?:number;progress?:number;dash?:number[];width?:number;height?:number;r?:number;radius?:number;d?:string;x2?:number;y2?:number;text?:string;fontSize?:number;font?:'sans'|'serif'|'mono';align?:'left'|'center'|'right'}
/** A layer assignment belongs to a root; its descendants inherit its coordinate space. */
export interface EntityDefinition {id:string;parent?:string;layer?:string;components?:{transform?:TransformDefinition;graphic?:GraphicComponent}}
export interface AnimationLayer {id:string;space:'canvas'|'camera'}
export interface ImageAsset {type:'image';src:string}
/** Legacy input is normalized once; it is not the runtime entity. */
export type LegacyCanvasNode={id:string;type:'group'|'rect'|'circle'|'path'|'text'|'line'|'image';parent?:string;layer?:string}&TransformDefinition&Omit<GraphicComponent,'type'>;
export type CanvasNode=EntityDefinition|LegacyCanvasNode;
export interface MotionEntity {id:string;parent?:string;layer?:string;components:{transform:TransformComponent;graphic?:GraphicComponent}}
/** Optional fixed style fields. Sizes use a shared 1280-wide reference canvas; inset/offset use percentages. */
export interface CaptionStyle {fontSize?:number;font?:'sans'|'serif'|'mono';color?:string;background?:string;align?:'left'|'center'|'right';position?:'top'|'bottom';inset?:number;offset?:number;padding?:number;radius?:number;lineHeight?:number;shadow?:boolean;showSpeaker?:boolean}
/** Trusted project source only. Native Canvas is deliberately available, not sandboxed. */
export interface CanvasDrawer {layer?:string;draw:(context:CanvasRenderingContext2D,view:{frame:AnimationFrame;time:TimeSnapshot;width:number;height:number})=>void}
export interface AnimationOptions {captionStyle?:CaptionStyle;captionsEnabled?:boolean;assetBaseURL?:string;canvasDrawers?:readonly CanvasDrawer[];/** Trusted host only; never comes from animation JSON. */resolveImage?:(id:string,asset:ImageAsset,signal:AbortSignal)=>Promise<Blob>}
export interface AnimationDocument {format:'rusie.motion/1';width:number;height:number;duration:number;background?:string;assets?:{[id:string]:ImageAsset};layers?:AnimationLayer[];captionTheme?:'cinema'|'paper';captionStyle?:CaptionStyle;camera?:CameraDefinition;cameras?:{[id:string]:CameraDefinition};cameraCuts?:CameraCut[];surface:{type:'svg';source:string;entities?:EntityDefinition[]}|{type:'canvas';nodes:CanvasNode[]};tracks?:MotionTrack[];effects?:SceneEffect[];markers?:{at:number;title:string}[];captions?:{at:number;duration:number;text:string;speaker?:string;fade?:number}[]}
export type Pose=TransformComponent&{width?:number;height?:number;x2?:number;y2?:number;progress?:number;fill?:string;stroke?:string}
export interface AnimationFrame {time:number;clock:TimeSnapshot;camera:CameraState;cameraEntity:CameraEntity;cameraId:string;cameras:Readonly<Record<string,CameraEntity>>;effects:EffectFrame[];poses:Readonly<Record<string,Pose>>;caption:{text:string;speaker:string;opacity:number}|null}
export interface AnimationSnapshot {time:number;duration:number;rate:number;captionsEnabled:boolean;status:'ready'|'playing'|'paused'|'ended'|'destroyed'|'error';error?:string}
export interface FrameRenderer {prepare?():Promise<void>;render(frame:AnimationFrame):void;destroy():void}
export interface Scheduler {now():number;request(callback:(time:number)=>void):number;cancel(id:number):void}
