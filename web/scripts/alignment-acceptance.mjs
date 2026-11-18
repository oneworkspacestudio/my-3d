import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {randomBytes} from 'node:crypto';
import {mkdtemp,mkdir,writeFile,readdir} from 'node:fs/promises';
import {chromium,expect} from '@playwright/test';
import {PerspectiveCamera,Vector3} from 'three';
import {part,template,bounds} from '../src/model.ts';

const exe=process.env.MY3D_QA_EXE;
if(!exe)throw Error('Set MY3D_QA_EXE');
const root='C:/Projects/.cache/my-3d-alignment';
await mkdir(root,{recursive:true});
const data=await mkdtemp(root+'/fixture-');
const out=process.env.MY3D_QA_OUTPUT??root+'/qa';
await mkdir(out,{recursive:true});
const password=randomBytes(24).toString('hex'),origin='http://localhost:39125';
const child=spawn(exe,['--data',data,'--listen','127.0.0.1:39125','--origin',origin,'--bootstrap-email','qa@example.test','--no-browser'],{
 windowsHide:true,stdio:'inherit',env:{...process.env,WORKSPACE_BOOTSTRAP_PASSWORD:password},
});
const exited=once(child,'exit');
let browser;
const checks=[],errors=[];
const check=name=>{checks.push(name);console.log('PASS',name)};
const fixture=()=>{
 const p=template('empty');
 const a=part('box',[-40,-12,3]);a.name='Reference';a.size=[30,20,10];
 const b=part('box',[15,24,22]);b.size=[14,36,24];
 const c=part('hole',[45,-28,9]);c.size=[10,10,18];
 p.objects=[a,b,c];return p;
};
async function ready(page){
 await expect(page.locator('.loading-overlay')).toHaveCount(0,{timeout:90000});
 await expect(page.locator('.text--saved')).toHaveText('All changes saved',{timeout:15000});
}
const scene=page=>page.evaluate(()=>{
 const key=Object.keys(localStorage).find(k=>k.startsWith('my3d-recovery-'));
 return JSON.parse(localStorage.getItem(key)).project;
});
async function load(page,p){
 const before=await scene(page);
 await page.getByLabel('Import model file').setInputFiles({name:'alignment.my3d.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(p))});
 await expect.poll(async()=>(await scene(page)).id).not.toBe(before.id);
 await ready(page);
 await page.locator('.viewport canvas').focus();
}
async function align(page){
 await page.keyboard.press('Control+a');
 await page.keyboard.press('l');
 await expect(page.locator('.card--alignment')).toBeVisible();
 await expect(page.locator('.button--alignment-dot')).toHaveCount(9);
}
const button=(page,axis,anchor)=>page.locator('.row--alignment-axis').nth(axis).getByRole('button',{name:['Min','Centre','Max'][anchor],exact:true});
const coordinate=(o,axis,anchor)=>{
 const b=bounds([{...o,hole:false}]);
 return anchor===0?b.min[axis]:anchor===2?b.max[axis]:(b.min[axis]+b.max[axis])/2;
};
async function clickReference(page,p){
 await page.getByRole('button',{name:'top view'}).click();
 await page.getByRole('button',{name:'Fit model'}).click();
 const rect=await page.locator('.viewport canvas').boundingBox();
 const b=bounds(p.objects.map(o=>({...o,hole:false})));
 const center=new Vector3(...b.min).add(new Vector3(...b.max)).multiplyScalar(.5);
 const radius=new Vector3(...b.size).length()/2,half=32*Math.PI/360;
 const angle=Math.min(half,Math.atan(Math.tan(half)*rect.width/rect.height));
 const camera=new PerspectiveCamera(32,rect.width/rect.height,.1,2000);
 camera.up.set(0,0,1);
 camera.position.copy(center).addScaledVector(new Vector3(0,-.01,220).normalize(),radius*1.12/Math.sin(angle));
 camera.lookAt(center);camera.updateMatrixWorld();
 const reference=p.objects[0],point=new Vector3(...reference.pos).add(new Vector3(0,0,reference.size[2]/2)).project(camera);
 await page.mouse.click(rect.x+(point.x+1)*rect.width/2,rect.y+(1-point.y)*rect.height/2);
 await expect(page.getByLabel('Alignment reference')).toHaveValue(reference.id);
}
try{
 await expect.poll(async()=>{try{return (await fetch(origin+'/healthz')).ok}catch{return false}},{timeout:60000}).toBe(true);
 browser=await chromium.launch({channel:'msedge',headless:true,args:['--enable-webgl','--use-angle=swiftshader']});
 const page=await browser.newPage({viewport:{width:1500,height:1000}});
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{
  const post=Worker.prototype.postMessage;
  Worker.prototype.postMessage=function(message,...rest){
   if(window.__delayAlignmentRender&&message.op==='render'){
    setTimeout(()=>post.call(this,message,...rest),1000);return;
   }
   post.call(this,message,...rest);
  };
 });
 await page.goto(origin);
 await page.getByLabel('Email address').fill('qa@example.test');
 await page.getByLabel('Password',{exact:true}).fill(password);
 await page.getByRole('button',{name:'Sign in',exact:true}).click();
 await expect(page.locator('.dimension')).toHaveCount(3,{timeout:90000});
 await ready(page);

 for(const axis of [0,1,2])for(const anchor of [0,1,2]){
  const p=fixture();p.objects[1].rot=[13,0,27];
  await load(page,p);await align(page);
  const initial=await scene(page);
  await button(page,axis,anchor).hover();
  expect((await scene(page)).objects).toEqual(initial.objects);
  await button(page,axis,anchor).click();
  await ready(page);
  const after=await scene(page);
  const coords=after.objects.map(o=>coordinate(o,axis,anchor));
  expect(Math.max(...coords)-Math.min(...coords)).toBeLessThan(.001);
  await expect(button(page,axis,anchor)).toBeDisabled();
  await expect(page.locator('.card--alignment')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('.card--alignment')).toHaveCount(0);
 }
 check('all nine edge/centre alignments include rotated geometry and holes, previews retain source, aligned controls disable');

 const p=fixture();p.objects[0].locked=true;
 await load(page,p);await align(page);
 await clickReference(page,p);
 const originalCanvas=await page.locator('.viewport canvas').screenshot();
 await button(page,0,1).hover();
 await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
 const previewCanvas=await page.locator('.viewport canvas').screenshot();
 expect(previewCanvas.equals(originalCanvas)).toBe(false);
 await page.screenshot({path:out+'/desktop-preview.png'});
 await button(page,0,1).click();await ready(page);
 let after=await scene(page);
 expect(after.objects[0]).toEqual(p.objects[0]);
 for(const o of after.objects)expect(coordinate(o,0,1)).toBeCloseTo(coordinate(p.objects[0],0,1),4);
 await page.keyboard.press('Escape');
 await page.keyboard.press('Control+z');await ready(page);
 after=await scene(page);expect(after.objects).toEqual(p.objects);
 await page.keyboard.press('Control+y');await ready(page);
 expect((await scene(page)).objects[0]).toEqual(p.objects[0]);
 check('fixed and locked reference stays still, source edits survive undo and redo');

 // Native CAD geometry rather than placeholder part dimensions controls imported solids and groups.
 const special=fixture();
 special.objects[0].rot=[0,0,35];
 const childA=part('box',[-12,0,0]),childB=part('box',[17,8,5]);
 special.objects[1]={...part('group',[15,24,22]),children:[childA,childB],size:[60,40,25],rot:[10,20,40]};
 await load(page,special);await align(page);
 await page.getByLabel('Alignment reference').selectOption(special.objects[0].id);
 await button(page,2,0).click();await ready(page);
 expect((await scene(page)).objects[0]).toEqual(special.objects[0]);
 await page.getByRole('button',{name:'Done',exact:true}).click();
 check('group alignment preserves editable children and reference');

 const mesh=part('mesh',[0,0,0]);
 mesh.mesh={vertices:[70,0,0,90,0,0,80,20,0,80,0,25],triangles:[0,1,2,0,3,1,1,3,2,2,3,0]};mesh.size=[20,20,25];
 const meshProject=fixture();meshProject.objects=[meshProject.objects[0],mesh];
 await load(page,meshProject);await align(page);
 await page.getByLabel('Alignment reference').selectOption(meshProject.objects[0].id);
 await button(page,0,1).click();await ready(page);
 const meshAfter=await scene(page);expect(meshAfter.objects[1].pos[0]).toBeCloseTo(-120,4);
 await page.getByRole('button',{name:'Done',exact:true}).click();
 check('imported triangle geometry moves with alignment');

 const tilted=fixture();tilted.objects=[tilted.objects[0]];tilted.objects[0].rot=[30,15,25];
 await load(page,tilted);
 await page.keyboard.press('Shift+w');
 await page.getByRole('button',{name:'Cylinder',exact:true}).click();
 await page.getByLabel('pos X',{exact:true}).fill('32');
 await page.getByLabel('pos Y',{exact:true}).fill('26');
 await page.getByLabel('pos Y',{exact:true}).blur();await ready(page);
 await align(page);
 await page.getByLabel('Alignment reference').selectOption(tilted.objects[0].id);
 await button(page,2,0).click();await ready(page);
 expect((await scene(page)).objects[0]).toEqual(tilted.objects[0]);
 await page.getByRole('button',{name:'Done',exact:true}).click();
 check('custom workplane alignment retains reference and rotated parts');

 const worker=(await readdir(new URL('../../internal/webui/dist/assets/',import.meta.url))).find(name=>name.startsWith('kernel.worker-'));
 const exact=await page.evaluate(async({worker,p})=>{
  const w=new Worker('/assets/'+worker,{type:'module'});
  let seq=0;
  const call=(op,data)=>new Promise((resolve,reject)=>{
   const id=++seq;w.onmessage=e=>e.data.error?reject(Error(e.data.error)):resolve(e.data.result);
   w.postMessage({id,op,...data});
  });
  try{
   const frame={origin:[14,-8,7],rotation:[30,15,25]};
   const solid={...p.objects[0],pos:frame.origin,rot:frame.rotation,size:[30,20,10]};
   const meshes=await call('render',{project:{...p,objects:[solid]},alignmentFrame:frame});
   const step=await call('export',{format:'step'});
   const imported=await call('import',{file:new File([step],'fixture.step')});
   const mesh=await call('render',{project:{...p,objects:[{...solid,kind:'import',rot:[0,0,0],pos:[0,0,0],mesh:{brep:imported.brep}}]},alignmentFrame:frame});
   return {local:meshes[0].alignmentBounds,imported:mesh[0].alignmentBounds};
  }finally{w.terminate()}
 },{worker,p:fixture()});
 for(const actual of [exact.local,exact.imported]){
  for(const [a,expected] of [[0,[-15,-10,0]],[1,[15,10,10]]]){
   actual[a].forEach((n,i)=>expect(n).toBeCloseTo(expected[i],3));
  }
 }
 check('CAD and imported STEP bounds are exact in the tilted workplane frame');

 const loadingProject=fixture();
 await load(page,loadingProject);
 await page.getByRole('button',{name:'Advanced',exact:true}).click();
 await page.locator('.history').getByRole('button',{name:'◇ Reference',exact:true}).click();
 await page.getByRole('button',{name:'Properties',exact:true}).click();
 await page.evaluate(()=>window.__delayAlignmentRender=true);
 await page.getByLabel('size X',{exact:true}).fill('58');
 await page.getByLabel('size X',{exact:true}).blur();
 await page.locator('.viewport canvas').focus();
 await page.keyboard.press('Control+a');await page.keyboard.press('l');
 await expect(page.locator('.card--alignment')).toBeVisible();
 expect(await page.locator('.button--alignment-dot:disabled').count()).toBe(9);
 await ready(page);
 await page.evaluate(()=>window.__delayAlignmentRender=false);
 await button(page,0,2).click();await ready(page);
 const newest=await scene(page);
 expect(newest.objects[0].size[0]).toBe(58);
 const newestEdges=newest.objects.map(o=>coordinate(o,0,2));
 expect(Math.max(...newestEdges)-Math.min(...newestEdges)).toBeLessThan(.001);
 await page.getByRole('button',{name:'Done',exact:true}).click();
 check('alignment waits for current geometry after a dimension edit');

 // The same alignment controls remain usable with phone touch targets and reference selection.
 await page.setViewportSize({width:390,height:844});
 const mobile=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const phone=await mobile.newPage();phone.on('pageerror',e=>errors.push(e.message));
 await phone.goto(origin);
 await phone.getByLabel('Email address').fill('qa@example.test');
 await phone.getByLabel('Password',{exact:true}).fill(password);
 await phone.getByRole('button',{name:'Sign in',exact:true}).tap();
 await expect(phone.locator('.dimension')).toHaveCount(3,{timeout:90000});await ready(phone);
 await load(phone,fixture());
 await phone.getByRole('button',{name:'Actions',exact:true}).tap();
 await phone.getByRole('button',{name:'Align',exact:true}).tap();
 await expect(phone.locator('.stack--sidebar')).toBeHidden();
 await phone.getByLabel('Alignment reference').selectOption((await scene(phone)).objects[0].id);
 await button(phone,1,2).tap();await ready(phone);
 const phoneScene=await scene(phone);
 for(const o of phoneScene.objects)expect(coordinate(o,1,2)).toBeCloseTo(coordinate(phoneScene.objects[0],1,2),4);
 await phone.screenshot({path:out+'/phone-alignment.png'});
 expect(await phone.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await phone.getByRole('button',{name:'Done',exact:true}).tap();
 await expect(phone.locator('.card--alignment')).toHaveCount(0);
 check('touch entry, reference, alignment, dismissal and phone overflow');

 expect(errors).toEqual([]);
 await writeFile(out+'/alignment-acceptance.json',JSON.stringify({checks,errors,isolated:true,physicalTouchHardware:false},null,2));
}finally{
 await browser?.close();child.kill();await exited;
 console.log('Stopped alignment fixture service');
}
