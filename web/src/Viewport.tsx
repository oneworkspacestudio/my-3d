import React,{useEffect,useRef,useState} from 'react';
import * as T from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {TransformControls} from 'three/examples/jsm/controls/TransformControls.js';
import {Icon} from './components/ui';
import {Part,V3} from './model';
const h=React.createElement;
export function Viewport(p:any){const [views,setViews]=useState(false);const el=useRef<HTMLDivElement>(null),world=useRef<any>(null),latest=useRef(p);latest.current=p;const dims=useRef<any[]>([]),markers=useRef<{el:HTMLElement;position:T.Vector3}[]>([]);
 useEffect(()=>{const dom=el.current!;const scene=new T.Scene();scene.background=new T.Color('#f3f9ff');scene.fog=new T.Fog('#f3f9ff',260,720);const camera=new T.PerspectiveCamera(40,1,.1,2000);camera.up.set(0,0,1);camera.position.set(145,-210,175);const renderer=new T.WebGLRenderer({antialias:true,alpha:false});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.0;dom.prepend(renderer.domElement);const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,0,40);controls.minDistance=1;controls.maxDistance=650;controls.mouseButtons={LEFT:null,MIDDLE:T.MOUSE.PAN,RIGHT:T.MOUSE.ROTATE};controls.zoomToCursor=true;controls.touches={ONE:T.TOUCH.ROTATE,TWO:T.TOUCH.DOLLY_PAN};const ambient=new T.HemisphereLight('#f4fbff','#8ba7ce',1.8);ambient.position.set(0,0,1);scene.add(ambient);const sun=new T.DirectionalLight('#ffffff',2.6);sun.position.set(-85,-60,180);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-160;sun.shadow.camera.right=160;sun.shadow.camera.top=160;sun.shadow.camera.bottom=-160;sun.shadow.bias=-.0001;sun.shadow.normalBias=.3;scene.add(sun);const fill=new T.DirectionalLight('#b3ddff',1.0);fill.position.set(80,60,80);scene.add(fill);
 const floor=new T.Mesh(new T.PlaneGeometry(420,420),new T.MeshStandardMaterial({color:'#f4fcff',roughness:.9,metalness:0}));floor.position.z=-.2;floor.receiveShadow=true;scene.add(floor);const grid=new T.GridHelper(420,84,'#9eddf7','#c7eafa');grid.rotation.x=Math.PI/2;grid.position.z=.02;grid.material.transparent=true;grid.material.opacity=.65;scene.add(grid);const fine=new T.GridHelper(420,420,'#cbeeff','#dcf3ff');fine.rotation.x=Math.PI/2;fine.position.z=.01;fine.material.transparent=true;fine.material.opacity=.45;scene.add(fine);const border=new T.LineSegments(new T.EdgesGeometry(floor.geometry),new T.LineBasicMaterial({color:'#98ddf6'}));border.position.z=.03;scene.add(border);
 const group=new T.Group(),selected=new T.Group();scene.add(group,selected);
 const canvas=renderer.domElement,transform=new TransformControls(camera,canvas);
 transform.setSize(.82);scene.add(transform.getHelper());
 const ray=new T.Raycaster(),pointer=new T.Vector2();
 const screenRay=(e:{clientX:number,clientY:number})=>{
  const r=canvas.getBoundingClientRect();
  pointer.set((e.clientX-r.left)/r.width*2-1,1-(e.clientY-r.top)/r.height*2);
  ray.setFromCamera(pointer,camera);
 };
 const roots=()=>[...group.children,...selected.children];
 const pick=(e:PointerEvent)=>{
  screenRay(e);
  return ray.intersectObjects(roots(),false)[0];
 };
 const defaultNormal=new T.Vector3(0,0,1);
 const workSurface=()=>{
  const wp=latest.current.workplane;
  return wp?new T.Plane().setFromNormalAndCoplanarPoint(new T.Vector3(...wp.normal),new T.Vector3(...wp.origin)):
   new T.Plane(defaultNormal,0);
 };
 const gridPoint=(q:T.Vector3,origin:T.Vector3)=>{
  if(!latest.current.snap)return q;
  const rotation=latest.current.workplane?.rotation??[0,0,0];
  const frame=new T.Quaternion().setFromEuler(new T.Euler(...rotation.map(T.MathUtils.degToRad) as V3,'ZYX'));
  return q.sub(origin).applyQuaternion(frame.clone().invert()).round().applyQuaternion(frame).add(origin);
 };
 const projectTo=(e:{clientX:number,clientY:number},surface:T.Plane)=>{
  screenRay(e);
  return ray.ray.intersectPlane(surface,new T.Vector3());
 };
 const ground=(e:{clientX:number,clientY:number}):V3=>{
  const wp=latest.current.workplane,origin=new T.Vector3(...(wp?.origin??[0,0,0]));
  const q=projectTo(e,workSurface());
  return q?gridPoint(q,origin).toArray():origin.toArray();
 };
 const marquee=document.createElement('div');
 marquee.className='selection-marquee';
 marquee.hidden=true;
 dom.append(marquee);
 type Gesture={
  id:number;x:number;y:number;touch:boolean;shift:boolean;alt:boolean;dragged:boolean;
  hit?:T.Intersection;ids:string[];origin?:T.Vector3;surface?:T.Plane;delta:T.Vector3;
  previews:Map<T.Object3D,T.Vector3>;
 };
 let gesture:Gesture|null=null,handlePointer:number|null=null;
 let gizmo:{pos:T.Vector3;rot:T.Euler;scale:T.Vector3;size:T.Vector3}|null=null;
 let cancelled=false,copyHandle=false,modifiers={shift:false,alt:false};
 const touches=new Set<number>();
 const endGesture=()=>{
  gesture?.previews.forEach((position,mesh)=>mesh.position.copy(position));
  gesture=null;marquee.hidden=true;
 };
 transform.addEventListener('dragging-changed',event=>{
  controls.enabled=!event.value;
  if(event.value){
   gizmo={pos:selected.position.clone(),rot:selected.rotation.clone(),scale:selected.scale.clone(),size:new T.Box3().setFromObject(selected).getSize(new T.Vector3())};
  }else if(gizmo){
   const start=gizmo;gizmo=null;
   if(cancelled)return;
   const delta=selected.position.clone().sub(start.pos),scale=selected.scale.clone().divide(start.scale);
   const rotation=[selected.rotation.x-start.rot.x,selected.rotation.y-start.rot.y,selected.rotation.z-start.rot.z].map(T.MathUtils.radToDeg) as V3;
   if(delta.lengthSq()>1e-8||rotation.some(v=>Math.abs(v)>1e-5)||scale.distanceToSquared(new T.Vector3(1,1,1))>1e-8){
    latest.current.transform(delta.toArray(),rotation,scale.toArray(),copyHandle&&transform.mode!=='scale',undefined,start.pos.toArray());
   }
  }
 });
 transform.addEventListener('objectChange',()=>{
  if(!gizmo||transform.mode!=='scale')return;
  const scale=selected.scale;
  const axis=transform.axis?.toLowerCase();
  if(modifiers.shift&&axis&&axis.length===1&&(axis==='x'||axis==='y'||axis==='z'))scale.setScalar(scale[axis]);
  if(!modifiers.alt){
   const offset=gizmo.size.clone().multiply(scale.clone().subScalar(1)).multiplyScalar(.5);
   selected.position.copy(gizmo.pos).add(offset);
  }else selected.position.copy(gizmo.pos);
 });
 const cancelHandle=()=>{
  if(!transform.dragging)return;
  cancelled=true;
  transform.reset();
  transform.pointerUp(null);
  cancelled=false;handlePointer=null;
 };
 const onBeforeDown=(e:PointerEvent)=>{
  if(e.pointerType==='touch'){
   touches.add(e.pointerId);
   if(touches.size>1){
    endGesture();cancelHandle();transform.enabled=false;
    controls.enableRotate=true;
    return;
   }
  }
  const orbit=e.ctrlKey||e.metaKey;
  const touch=e.pointerType==='touch';
  controls.mouseButtons.LEFT=orbit?T.MOUSE.PAN:null;
  controls.mouseButtons.MIDDLE=e.shiftKey||orbit?T.MOUSE.ROTATE:T.MOUSE.PAN;
  const left=e.button===0&&!orbit;
  transform.enabled=left&&!latest.current.helper;
  if(!touch)canvas.focus({preventScroll:true});
  if(!left)return;
  modifiers={shift:e.shiftKey,alt:e.altKey};copyHandle=e.altKey;
  transform.setRotationSnap(e.shiftKey?Math.PI/4:latest.current.snap?Math.PI/12:null);
  const hit=pick(e),surface=hit?new T.Plane().setFromNormalAndCoplanarPoint(workSurface().normal,hit.point):undefined;
  const part=latest.current.objects.find((o:Part)=>o.id===hit?.object.userData.id);
  const movable=part&&!part.locked&&part.kind!=='mesh'&&!latest.current.helper;
  controls.enableRotate=!touch||(!hit&&!latest.current.multi&&!latest.current.helper);
  gesture={id:e.pointerId,x:e.clientX,y:e.clientY,touch,shift:e.shiftKey,alt:e.altKey,dragged:false,hit,
   ids:hit?(latest.current.selected.includes(part?.id)?[...latest.current.selected]:[hit.object.userData.id]):[],
   surface,origin:movable&&surface?projectTo(e,surface)??undefined:undefined,delta:new T.Vector3(),previews:new Map()};
 };
 const onDown=(e:PointerEvent)=>{
  if(gesture?.id!==e.pointerId)return;
  if(transform.dragging){handlePointer=e.pointerId;endGesture()}
  if(!canvas.hasPointerCapture(e.pointerId))canvas.setPointerCapture(e.pointerId);
 };
 const boxRect=(x:number,y:number,g:Gesture)=>{
  const r=canvas.getBoundingClientRect();
  return {left:Math.min(g.x,x)-r.left,top:Math.min(g.y,y)-r.top,width:Math.abs(x-g.x),height:Math.abs(y-g.y)};
 };
 const onMove=(e:PointerEvent)=>{
  if(e.pointerId===handlePointer){
   modifiers={shift:e.shiftKey,alt:e.altKey};copyHandle||=e.altKey;
   transform.setRotationSnap(e.shiftKey?Math.PI/4:latest.current.snap?Math.PI/12:null);
  }
  const g=gesture;
  if(!g||e.pointerId!==g.id||latest.current.helper)return;
  if(!g.dragged&&Math.hypot(e.clientX-g.x,e.clientY-g.y)<(g.touch?7:4))return;
  g.dragged=true;
  if(g.hit&&g.origin&&g.surface){
   const q=projectTo(e,g.surface);
   if(!q)return;
   g.delta.copy(gridPoint(q,g.origin)).sub(g.origin);
   g.alt||=e.altKey;
   for(const mesh of roots()){
    const o=latest.current.objects.find((part:Part)=>part.id===mesh.userData.id);
    if(!o||!g.ids.includes(o.id)||o.locked||o.kind==='mesh')continue;
    if(!g.previews.has(mesh))g.previews.set(mesh,mesh.position.clone());
    mesh.position.copy(g.previews.get(mesh)!).add(g.delta);
   }
  }else if(!g.hit&&(!g.touch||latest.current.multi)){
   const {left,top,width,height}=boxRect(e.clientX,e.clientY,g);
   Object.assign(marquee.style,{left:left+'px',top:top+'px',width:width+'px',height:height+'px'});
   marquee.hidden=false;
  }
 };
 const onUp=(e:PointerEvent)=>{
  if(e.pointerId===handlePointer)handlePointer=null;
  if(e.pointerType==='touch')touches.delete(e.pointerId);
  if(!touches.size){controls.enableRotate=true;transform.enabled=!latest.current.helper}
  const g=gesture;
  if(!g||g.id!==e.pointerId)return;
  endGesture();
  if(!g.dragged){
   if(latest.current.helper){
    const hit=g.hit,normal=hit?.face?.normal.clone().applyNormalMatrix(new T.Matrix3().getNormalMatrix(hit.object.matrixWorld)).toArray();
    const pt=latest.current.helper==='ruler'?ground(e):hit?.point.toArray()??ground(e);
    latest.current.placeHelper(pt,normal,hit?.object.userData.id,e.shiftKey);return;
   }
   const ids=g.hit?[g.hit.object.userData.id]:[];
   latest.current.select(ids,g.shift||latest.current.multi?'toggle':'replace');
  }else if(g.hit&&g.delta.lengthSq()>1e-8){
   latest.current.moveShapes(g.ids,g.delta.toArray(),g.alt);
  }else if(!g.hit&&(!g.touch||latest.current.multi)){
   const {left,top,width,height}=boxRect(e.clientX,e.clientY,g);
   const ids=roots().filter(mesh=>{
    const b=new T.Box3().setFromObject(mesh),xs:number[]=[],ys:number[]=[];
    for(const x of [b.min.x,b.max.x])for(const y of [b.min.y,b.max.y])for(const z of [b.min.z,b.max.z]){
     const q=new T.Vector3(x,y,z).project(camera);
     if(q.z< -1||q.z>1)continue;
     xs.push((q.x+1)*canvas.clientWidth/2);ys.push((1-q.y)*canvas.clientHeight/2);
    }
    return xs.length&&Math.min(...xs)<=left+width&&Math.max(...xs)>=left&&Math.min(...ys)<=top+height&&Math.max(...ys)>=top;
   }).map(mesh=>mesh.userData.id);
   latest.current.select(ids,g.shift||latest.current.multi?'add':'replace');
  }
 };
 const onCancel=(e:PointerEvent)=>{
  if(gesture?.id===e.pointerId)endGesture();
  if(handlePointer===e.pointerId)cancelHandle();
  touches.delete(e.pointerId);
  if(!touches.size){controls.enableRotate=true;transform.enabled=!latest.current.helper}
 };
 const swallowContextMenu=(e:Event)=>e.preventDefault();
 canvas.tabIndex=-1;
 canvas.addEventListener('contextmenu',swallowContextMenu);
 canvas.addEventListener('pointerdown',onBeforeDown,true);
 canvas.addEventListener('pointerdown',onDown);
 canvas.addEventListener('pointermove',onMove,true);
 canvas.addEventListener('pointerup',onUp);
 canvas.addEventListener('pointercancel',onCancel);
 canvas.addEventListener('lostpointercapture',onCancel);
 const over=(e:any)=>{if(e.dataTransfer.types.includes('application/my3d-shape')){e.preventDefault();latest.current.setDropping(true);const pos=ground(e);preview.position.set(...pos).addScaledVector(workSurface().normal,10);preview.visible=true}};const drop=(e:any)=>{e.preventDefault();const kind=e.dataTransfer.getData('application/my3d-shape');if(kind)latest.current.add(kind,ground(e));latest.current.setDropping(false);preview.visible=false};const leave=()=>{latest.current.setDropping(false);preview.visible=false};const preview=new T.Mesh(new T.BoxGeometry(20,20,20),new T.MeshStandardMaterial({color:'#447fff',transparent:true,opacity:.3,depthWrite:false}));preview.visible=false;scene.add(preview);
 dom.addEventListener('dragover',over);dom.addEventListener('drop',drop);dom.addEventListener('dragleave',leave);
 const resize=()=>{const w=dom.clientWidth,height=dom.clientHeight,viewHeight=height;renderer.setSize(w,viewHeight,false);dom.style.setProperty('--workplane-height',viewHeight+'px');camera.fov=w<650?36:32;camera.aspect=w/viewHeight;camera.clearViewOffset();camera.updateProjectionMatrix()};const ro=new ResizeObserver(resize);ro.observe(dom);resize();let frame=0;const animate=()=>{frame=requestAnimationFrame(animate);controls.update();renderer.render(scene,camera);for(const list of [dims.current,markers.current])for(const d of list){const v=d.position.clone().project(camera);d.el.style.left=(v.x+1)*dom.clientWidth/2+'px';d.el.style.top=(-v.y+1)*canvas.clientHeight/2+'px';d.el.hidden=v.z< -1||v.z>1}};animate();
 const fit=(selectionOnly=true)=>{
  const b=new T.Box3().setFromObject(selected);
  if(!selectionOnly||b.isEmpty())b.union(new T.Box3().setFromObject(group));
  if(b.isEmpty())return;
  const c=b.getCenter(new T.Vector3()),r=b.getBoundingSphere(new T.Sphere()).radius;
  const vertical=T.MathUtils.degToRad(camera.fov/2),halfAngle=Math.min(vertical,Math.atan(Math.tan(vertical)*camera.aspect));
  const direction=camera.position.clone().sub(controls.target).normalize();
  controls.target.copy(c);
  camera.position.copy(c).addScaledVector(direction,Math.max(controls.minDistance,r*1.12/Math.sin(halfAngle)));
  controls.update();
 };
 const zoom=(factor:number)=>{
  const offset=camera.position.clone().sub(controls.target);
  offset.setLength(T.MathUtils.clamp(offset.length()*factor,controls.minDistance,controls.maxDistance));
  camera.position.copy(controls.target).add(offset);
  controls.update();
 };
 const dropToPlane=()=>{
  const offsets:Record<string,number>={},surface=workSurface(),v=new T.Vector3();
  for(const child of selected.children){
   const mesh=child as T.Mesh,positions=mesh.geometry.getAttribute('position');
   let bottom=Infinity;
   mesh.updateWorldMatrix(true,false);
   for(let i=0;i<positions.count;i++)bottom=Math.min(bottom,surface.distanceToPoint(v.fromBufferAttribute(positions,i).applyMatrix4(mesh.matrixWorld)));
   if(Number.isFinite(bottom))offsets[mesh.userData.id]=-bottom;
  }
  latest.current.dropShapes(offsets);
 };
 latest.current.viewCommands.current={fit,zoom,drop:dropToPlane};
 world.current={scene,camera,renderer,controls,group,selected,transform,resize,fit,zoom,home:()=>{camera.position.set(145,-210,175);controls.target.set(0,0,40);controls.update()},view:(v:string)=>{const target=controls.target.clone();camera.position.copy(target.add(v==='top'?new T.Vector3(0,-.01,220):v==='right'?new T.Vector3(220,0,40):new T.Vector3(0,-220,45)));controls.update()}};
 return()=>{latest.current.viewCommands.current=null;marquee.remove();canvas.removeEventListener('contextmenu',swallowContextMenu);canvas.removeEventListener('pointerdown',onBeforeDown,true);canvas.removeEventListener('pointerdown',onDown);canvas.removeEventListener('pointermove',onMove,true);canvas.removeEventListener('pointerup',onUp);canvas.removeEventListener('pointercancel',onCancel);canvas.removeEventListener('lostpointercapture',onCancel);cancelAnimationFrame(frame);ro.disconnect();transform.dispose();controls.dispose();scene.traverse((o:any)=>{o.geometry?.dispose();if(Array.isArray(o.material))o.material.forEach((m:any)=>m.dispose());else o.material?.dispose()});renderer.dispose();renderer.domElement.remove();dom.removeEventListener('dragover',over);dom.removeEventListener('drop',drop);dom.removeEventListener('dragleave',leave);world.current=null};},[]);
 useEffect(()=>{const w=world.current;if(!w)return;w.transform.detach();for(const group of [w.group,w.selected]){for(const c of [...group.children]){group.remove(c);c.traverse((o:any)=>{o.geometry?.dispose();o.material?.dispose()})}}w.selected.position.set(0,0,0);w.selected.rotation.set(0,0,0);w.selected.scale.set(1,1,1);dims.current.forEach(v=>v.el.remove());dims.current=[];const box=new T.Box3();for(const data of p.meshes){const o=p.objects.find((v:Part)=>v.id===data.id&&v.visible);if(!o)continue;const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(data.vertices,3));if(data.triangles)g.setIndex(data.triangles);if(data.normals?.length)g.setAttribute('normal',new T.Float32BufferAttribute(data.normals,3));else g.computeVertexNormals();const material=new T.MeshPhysicalMaterial({color:o.hole?'#a0acc2':o.color,roughness:.33,metalness:.05,clearcoat:.23,clearcoatRoughness:.45,transparent:o.hole,opacity:o.hole?.38:1,side:T.DoubleSide});const mesh=new T.Mesh(g,material);mesh.userData.id=o.id;mesh.castShadow=!o.hole;mesh.receiveShadow=true;w.group.add(mesh);if(o.hole){const edges=new T.LineSegments(new T.WireframeGeometry(g),new T.LineBasicMaterial({color:'#7d8ca9',transparent:true,opacity:.16}));mesh.add(edges)}if(p.selected.includes(o.id)){box.expandByObject(mesh);const outline=new T.LineSegments(new T.EdgesGeometry(g,35),new T.LineBasicMaterial({color:'#3264eb',transparent:true,opacity:.65}));mesh.add(outline)}}
 if(!box.isEmpty()){const center=box.getCenter(new T.Vector3());w.selected.position.copy(center);w.selected.updateMatrixWorld(true);for(const mesh of [...w.group.children])if(p.selected.includes(mesh.userData.id))w.selected.attach(mesh);if(['move','rotate','scale'].includes(p.mode)&&!p.objects.some((o:Part)=>p.selected.includes(o.id)&&o.locked)){w.transform.setMode(p.mode==='move'?'translate':p.mode);w.transform.setTranslationSnap(p.snap?1:null);w.transform.setRotationSnap(p.snap?Math.PI/12:null);w.transform.setScaleSnap(p.snap?.05:null);w.transform.attach(w.selected)}const size=box.getSize(new T.Vector3());const labels=[{value:size.x,pos:new T.Vector3(center.x,box.min.y-9,0)},{value:size.y,pos:new T.Vector3(box.max.x+11,center.y,0)},{value:size.z,pos:new T.Vector3(box.min.x-12,center.y,center.z)}];for(const d of labels){const label=document.createElement('span');label.className='dimension';label.textContent=Number(d.value.toFixed(1))+' mm';el.current!.append(label);dims.current.push({el:label,position:d.pos})}}
 },[p.meshes,p.objects,p.selected,p.mode,p.snap]);
 useEffect(()=>{
  const w=world.current;if(!w)return;
  const guides:T.GridHelper[]=[];
  for(const [plane,color,size] of [[p.workplane,'#df942b',120],[p.shapePlane,'#ab64eb',50]] as const){
   if(!plane)continue;
   const guide=new T.GridHelper(size,size/5,color,color);
   const rotation=new T.Euler(...plane.rotation.map(T.MathUtils.degToRad) as V3,'ZYX');
   guide.quaternion.setFromEuler(rotation).multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),Math.PI/2));
   guide.position.set(...plane.origin as V3).add(new T.Vector3(0,0,.04).applyEuler(rotation));
   guide.material.transparent=true;guide.material.opacity=.55;
   w.scene.add(guide);guides.push(guide);
  }
  return()=>guides.forEach(guide=>{guide.removeFromParent();guide.dispose()});
 },[p.workplane,p.shapePlane]);
 useEffect(()=>{
  const addMarker=(el:HTMLElement,pos:V3)=>{
   el.className='workplane-marker';
   markers.current.push({el,position:new T.Vector3(...pos)});
  };
  if(p.ruler){
   const marker=document.createElement('span');
   marker.textContent='Ruler origin';
   addMarker(marker,p.ruler);
  }
  for(const note of p.notes??[]){
   const marker=document.createElement('button');
   marker.type='button';marker.textContent=note.text;
   marker.setAttribute('aria-label','Edit note: '+note.text);
   marker.addEventListener('click',()=>latest.current.editNote(note));
   addMarker(marker,note.pos);
  }
  for(const marker of markers.current)el.current!.append(marker.el);
  return()=>{markers.current.forEach(v=>v.el.remove());markers.current=[]};
 },[p.notes,p.ruler]);
 useEffect(()=>world.current?.resize(),[p.panel]);
 useEffect(()=>{const w=world.current;if(!w)return;world.current.scene.getObjectByName('buildVolume')?.removeFromParent();if(!p.volume)return;const g=new T.EdgesGeometry(new T.BoxGeometry(p.volume,p.volume,p.volume));const lines=new T.LineSegments(g,new T.LineBasicMaterial({color:'#16b9ab',transparent:true,opacity:.45}));lines.name='buildVolume';lines.position.z=p.volume/2;w.scene.add(lines)},[p.volume]);
 const hasGeometry=p.meshes.some((m:any)=>p.objects.some((o:Part)=>o.id===m.id&&o.visible)),hasSelection=p.meshes.some((m:any)=>p.selected.includes(m.id)&&p.objects.some((o:Part)=>o.id===m.id&&o.visible));
 const tool=(label:string,icon:string,fn:any)=>h('button',{key:label,className:'round-tool',title:label,'aria-label':label,onClick:fn},h(Icon,{name:icon}));
 return h('div',{ref:el,className:'viewport'+(views?' viewport--views':''),'aria-label':'Interactive 3D workplane','aria-busy':Boolean(p.busy)},h('button',{className:'mobile-view-toggle','aria-label':'View controls','aria-expanded':views,onClick:()=>setViews(v=>!v)},h(Icon,{name:views?'X':'Orbit'})),h('div',{className:'viewcube'},h('div',{className:'cube-body'},...['top','front','right'].map(v=>h('button',{key:v,className:'cube-'+v,onClick:()=>world.current?.view(v),'aria-label':v+' view'},v.toUpperCase())))),h('div',{className:'canvas-tools'},tool('Home view','House',()=>world.current?.home()),tool('Fit model','Focus',()=>world.current?.fit()),tool('Zoom in','Plus',()=>world.current?.zoom(.8)),tool('Zoom out','Minus',()=>world.current?.zoom(1.25)),tool('Model properties','Box',()=>p.action('properties'))),h('div',{className:'axis-helper'},h('svg',{viewBox:'0 0 110 98'},h('defs',{},h('marker',{id:'arrowx',markerWidth:5,markerHeight:5,refX:3,refY:2,orient:'auto'},h('path',{d:'M0,0 L4,2 L0,4',fill:'#f45954'}))),h('path',{d:'M18 69L70 92',stroke:'#f45954',strokeWidth:3,markerEnd:'url(#arrowx)'}),h('path',{d:'M18 69L57 45',stroke:'#24bb4c',strokeWidth:3}),h('path',{d:'M18 69L18 15',stroke:'#1498ed',strokeWidth:3}),h('text',{x:77,y:97,fill:'#ef483e'},'X'),h('text',{x:60,y:44,fill:'#22b84e'},'Y'),h('text',{x:12,y:10,fill:'#2448ff'},'Z'))),h('div',{className:'canvas-hint'},'Right-drag to orbit · Middle-drag to pan · Scroll to zoom'),!p.busy&&hasSelection?h('div',{className:'object-context'},...['duplicate','delete','hole','color','hide','lock'].map((a,i)=>h('button',{key:a,title:a,'aria-label':a+' selected',onClick:()=>p.action(a)},h(Icon,{name:['Copy','Trash2','Circle','Palette','EyeOff','LockKeyhole'][i]})))):null,p.busy?h('div',{className:'loading-surface'+(hasGeometry?' loading-surface--updating':'')},h('div',{className:'loading-overlay',role:'status','aria-live':'polite','aria-atomic':true},h(Icon,{name:'LoaderCircle',className:'model-spinner','aria-hidden':true}),h('div',{className:'loading-copy'},h('strong',{},hasGeometry&&p.busy==='Loading your model…'?'Updating your model…':p.busy),!hasGeometry?h('span',{},'Your 3D geometry will appear here.'):null),h('button',{onClick:p.cancel,title:'Cancel CAD computation',className:'button--compact'},'Cancel'))):null,p.dropping?h('div',{className:'drop-hint'},'Drop onto the workplane · 1 mm snap'):null,p.children);
}
