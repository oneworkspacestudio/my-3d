import init from 'replicad-opencascadejs';
import wasmURL from 'replicad-opencascadejs/wasm?url';
import * as cad from 'replicad';
import {zipSync,strToU8} from 'fflate';
import {Part,validate} from './model';
let ready:Promise<any>,shapes=new Map<string,any>();
async function boot(){const oc=await init({locateFile:()=>wasmURL});cad.setOC(oc);const font=await fetch(new URL('./Abel-Regular.ttf',import.meta.url));await cad.loadFont(await font.arrayBuffer());}
function drawing(o:Part){const [w,d]=o.size;if(o.profile==='circle')return cad.drawCircle(w/2);if(o.profile==='polyline'&&o.points?.length>=3){let p=cad.draw(o.points[0] as any);for(const q of o.points.slice(1))p=p.lineTo(q as any);return p.close()}return cad.drawRectangle(w,d)}
function build(o:Part):any{const [w,d,z]=o.size;let s:any;
 if(o.kind==='boolean'){const solids=o.children!.filter(x=>!x.hole),holes=o.children!.filter(x=>x.hole);if(!solids.length)throw Error('Choose at least one solid');s=build(solids[0]);for(const v of solids.slice(1))s=s.fuse(build(v));for(const v of holes)s=s.cut(build(v));if(!s.solids.length)throw Error('The hole removed the entire solid. Reduce the hole or undo.');}
 else if(o.kind==='group'){s=cad.makeCompound(o.children!.filter(v=>v.visible).map(build))}
 else if(o.kind==='box')s=cad.makeBox([-w/2,-d/2,0],[w/2,d/2,z]);
 else if(o.kind==='rounded'&&(o as any).upright)s=cad.drawRoundedRectangle(w,z,Math.min(o.radius||3,w/2-.001,z/2-.001)).sketchOnPlane('XZ',[0,d/2,z/2]).extrude(d);
 else if(o.kind==='rounded')s=cad.drawRoundedRectangle(w,d,Math.min(o.radius||2,w/2-.001,d/2-.001)).sketchOnPlane('XY').extrude(z);
 else if(o.kind==='cylinder')s=cad.drawEllipse(w/2,d/2).sketchOnPlane('XY').extrude(z);
 else if(o.kind==='sphere')s=cad.makeSphere(w/2).translateZ(w/2);
 else if(o.kind==='cone')s=cad.drawEllipse(w/2,d/2).sketchOnPlane('XY').extrude(z,{extrusionProfile:{profile:'linear',endFactor:.001}});
 else if(o.kind==='tube')s=cad.drawEllipse(w/2,d/2).cut(cad.drawEllipse(w*.32,d*.32)).sketchOnPlane('XY').extrude(z);
 else if(o.kind==='polygon')s=cad.drawPolysides(w/2,6).sketchOnPlane('XY').extrude(z);
 else if(o.kind==='star'){const pts=Array.from({length:10},(_,i)=>{const a=i*Math.PI/5+Math.PI/2,r=i%2?w*.23:w*.5;return[Math.cos(a)*r,Math.sin(a)*r*d/w]});let p=cad.draw(pts[0] as any);for(const q of pts.slice(1))p=p.lineTo(q as any);s=p.close().sketchOnPlane('XY').extrude(z)}
 else if(o.kind==='heart'){const p=cad.draw([0,-d/2]).lineTo([-w*.45,d*.1]).threePointsArcTo([0,d*.26],[-w*.35,d*.5]).threePointsArcTo([w*.45,d*.1],[w*.35,d*.5]).close();s=p.sketchOnPlane('XY').extrude(z)}
 else if(o.kind==='wedge')s=cad.draw([-d/2,0]).lineTo([d/2,0]).lineTo([d/2,z]).close().sketchOnPlane('YZ',[-w/2,0,0]).extrude(w);
 else if(o.kind==='frame'){const outer=cad.draw([-d/2,0]).lineTo([d/2,0]).lineTo([0,z]).close();const inner=cad.draw([-d*.25,5]).lineTo([d*.25,5]).lineTo([0,z-12]).close();s=outer.cut(inner).sketchOnPlane('YZ',[-w/2,0,0]).extrude(w)}
 else if(o.kind==='text'){s=cad.drawText((o.text||'My 3D').slice(0,60),{fontSize:d}).sketchOnPlane('XY').extrude(z);const b=s.boundingBox.bounds;s=s.translate(-((b[0][0]+b[1][0])/2),-((b[0][1]+b[1][1])/2),0)}
 else if(o.kind==='sketch')s=drawing(o).sketchOnPlane((o.plane||'XY') as any).extrude(o.depth||z);
 else if(o.kind==='import'){if(!o.mesh?.brep)throw Error('Imported triangle meshes cannot be used as CAD solids');s=cad.deserializeShape(o.mesh.brep)}
 else throw Error('Unsupported geometric feature '+o.kind);
 if(o.children&&(o as any).uniformScale)s=s.scale((o as any).uniformScale);if(o.fillet)s=s.fillet(o.fillet);
 if((o as any).mirrored)s=s.mirror((o as any).mirrored);
 for(let i=0;i<3;i++)if(o.rot[i])s=s.rotate(o.rot[i],[0,0,0],i===0?[1,0,0]:i===1?[0,1,0]:[0,0,1]);return s.translate(o.pos);
}
function payload(o:Part,s:any){const mesh=s.mesh({tolerance:.12,angularTolerance:.12});return{id:o.id,...mesh,bounds:s.boundingBox.bounds,solids:s.solids.length,volume:cad.measureVolume(s)}}
function combined(){const solids=[...shapes.values()];if(!solids.length)throw Error('There are no visible solids to export');let s=solids[0].clone();for(const v of solids.slice(1))s=s.fuse(v);return s}
function threeMF(s:any){const m=s.mesh({tolerance:.05,angularTolerance:.08});let vs='',ts='';for(let i=0;i<m.vertices.length;i+=3)vs+=`<vertex x="${m.vertices[i]}" y="${m.vertices[i+1]}" z="${m.vertices[i+2]}"/>`;for(let i=0;i<m.triangles.length;i+=3)ts+=`<triangle v1="${m.triangles[i]}" v2="${m.triangles[i+1]}" v3="${m.triangles[i+2]}"/>`;return new Blob([zipSync({'[Content_Types].xml':strToU8('<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/></Types>'),'_rels/.rels':strToU8('<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/></Relationships>'),'3D/3dmodel.model':strToU8(`<?xml version="1.0"?><model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02"><resources><object id="1" type="model"><mesh><vertices>${vs}</vertices><triangles>${ts}</triangles></mesh></object></resources><build><item objectid="1"/></build></model>`)} ) as any],{type:'application/vnd.ms-package.3dmanufacturing-3dmodel+xml'})}
self.onmessage=async e=>{const {id,op,project,format,file}=e.data;try{await(ready??=boot());if(op==='render'){validate(project);for(const s of shapes.values())s.delete();shapes.clear();const results=[];for(const o of project.objects.filter((v:Part)=>v.visible)){if(o.kind==='mesh'){results.push({id:o.id,...o.mesh,imported:true});continue}const s=build(o);results.push(payload(o,s));if(!o.hole)shapes.set(o.id,s);else s.delete()}postMessage({id,result:results})}
 if(op==='export'){const s=combined();try{const result=format==='step'?s.blobSTEP():format==='3mf'?threeMF(s):s.blobSTL({binary:true,tolerance:.05});postMessage({id,result})}finally{s.delete()}}
 if(op==='import'){if(file.size>16*1024*1024)throw Error('File exceeds 16 MiB');const s=await cad.importSTEP(file);const serialized=s.serialize();postMessage({id,result:{mesh:payload({id:'import'} as any,s),brep:serialized}});s.delete()}
 }catch(err:any){postMessage({id,error:typeof err==='number'?'CAD kernel rejected this geometry. Reduce dimensions, fillets or simplify the profile.':err.message||String(err)})}};

