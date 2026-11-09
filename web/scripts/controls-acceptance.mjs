import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {randomBytes} from 'node:crypto';
import {mkdtemp,mkdir} from 'node:fs/promises';
import {chromium,expect} from '@playwright/test';

const exe=process.env.MY3D_QA_EXE;
if(!exe)throw Error('Set MY3D_QA_EXE to the built My3D.exe');
const fixtureRoot='C:/Projects/.cache/my-3d-controls';
await mkdir(fixtureRoot,{recursive:true});
const data=await mkdtemp(fixtureRoot+'/fixture-');
const password=randomBytes(24).toString('hex');
const origin='http://localhost:39123';
const child=spawn(exe,['--data',data,'--listen','127.0.0.1:39123','--origin',origin,
 '--bootstrap-email','qa@example.test','--no-browser'],{
 env:{...process.env,WORKSPACE_BOOTSTRAP_PASSWORD:password},stdio:'inherit',windowsHide:true,
});
const exited=once(child,'exit');
let browser;
const errors=[];
const status=page=>page.locator('.row--statusbar');
const position=(page,axis)=>page.getByLabel('pos '+axis,{exact:true});
const ready=async page=>{
 await expect(page.locator('.loading-overlay')).toHaveCount(0,{timeout:90000});
};
async function openEditor(page){
 page.on('pageerror',error=>errors.push(error.message));
 await page.goto(origin);
 await page.getByLabel('Email address').fill('qa@example.test');
 await page.getByLabel('Password',{exact:true}).fill(password);
 await page.getByRole('button',{name:'Sign in',exact:true}).click();
 await expect(page.getByRole('heading',{name:'My 3D',exact:true})).toBeVisible();
 await ready(page);
 await page.getByRole('button',{name:/^(My )?Projects$/}).click();
 await page.getByRole('button',{name:'New blank project',exact:true}).click();
}
const marker=page=>page.locator('.dimension').first().getAttribute('style');
async function viewBox(page){
 const touch=await page.evaluate(()=>matchMedia('(pointer:coarse)').matches);
 if(touch)await page.getByRole('button',{name:'View controls'}).click();
 await page.getByRole('button',{name:'top view'}).click();
 await page.getByRole('button',{name:'Fit model'}).click();
 if(touch)await page.getByRole('button',{name:'View controls'}).click();
 const box=await page.locator('.viewport canvas').boundingBox();
 return {x:Math.round(box.x+box.width/2),y:Math.round(box.y+box.height/2)};
}
async function drag(page,x,y,dx,dy,button='left',modifier){
 await page.mouse.move(x,y);
 if(modifier)await page.keyboard.down(modifier);
 try{
  await page.mouse.down({button});
  await page.mouse.move(x+dx,y+dy,{steps:6});
  await page.mouse.up({button});
 }finally{if(modifier)await page.keyboard.up(modifier)}
}
try{
 await expect.poll(async()=>{
  try{return (await fetch(origin+'/healthz')).ok}catch{return false}
 },{timeout:60000}).toBe(true);
 browser=await chromium.launch({channel:'msedge',headless:true,args:['--enable-webgl','--use-angle=swiftshader']});
 const page=await browser.newPage({viewport:{width:1440,height:900}});
 await openEditor(page);
 await page.getByRole('button',{name:'Box',exact:true}).click();
 await expect(page.locator('.dimension')).toHaveCount(3,{timeout:90000});
 await ready(page);

 for(const [button,modifier] of [['right'],['middle'],['right','Shift'],['left','Control']]){
  const {x,y}=await viewBox(page);
  const before=await marker(page);
  await drag(page,x,y,75,38,button,modifier);
  await expect.poll(()=>marker(page)).not.toBe(before);
  await expect(status(page)).toContainText('1 objects · 1 selected');
  await expect(position(page,'X')).toHaveValue('0');
 }
 const {x,y}=await viewBox(page);
 const fitted=await marker(page);
 await page.keyboard.press('+');
 await expect.poll(()=>marker(page)).not.toBe(fitted);
 const zoomed=await marker(page);
 await page.keyboard.press('f');
 await expect.poll(()=>marker(page)).not.toBe(zoomed);
 await page.mouse.move(x,y);
 await page.mouse.wheel(0,-160);
 await expect.poll(()=>marker(page)).not.toBe(fitted);
 await viewBox(page);
 await page.keyboard.down('Shift');
 await page.mouse.click(x,y);
 await page.keyboard.up('Shift');
 await expect(status(page)).toContainText('0 selected');
 await drag(page,x-200,y-185,390,365);
 await expect(status(page)).toContainText('1 selected');
 const dragCenter=await viewBox(page);
 await drag(page,dragCenter.x,dragCenter.y,35,12);
 await expect(position(page,'X')).not.toHaveValue('0');
 const moved=Number(await position(page,'X').inputValue());
 await page.keyboard.press('Alt+ArrowRight');
 await expect(position(page,'X')).toHaveValue(String(moved));
 await page.keyboard.press('ArrowRight');
 await expect(position(page,'X')).toHaveValue(String(moved+1));
 await page.keyboard.press('Control+ArrowUp');
 await expect(position(page,'Z')).toHaveValue('1');
 await ready(page);
 await page.keyboard.press('d');
 await expect(position(page,'Z')).toHaveValue('0');
 await page.keyboard.press('h');
 await page.keyboard.press('h');
 await expect(page.getByTitle('Hole',{exact:true})).toHaveClass('selected');
 await page.keyboard.press('s');
 await expect(page.getByTitle('Solid',{exact:true})).toHaveClass('selected');
 await page.keyboard.press('Control+l');
 await expect(position(page,'X')).toBeDisabled();
 await page.keyboard.press('Control+h');
 await expect(status(page)).toContainText('0 objects');
 await page.keyboard.press('Control+Shift+h');
 await expect(status(page)).toContainText('1 objects');
 await page.keyboard.press('Control+a');
 await page.keyboard.press('Control+l');

 const start=Number(await position(page,'X').inputValue());
 await page.keyboard.press('Control+d');
 await expect(position(page,'X')).toHaveValue(String(start));
 await page.keyboard.press('ArrowRight');
 await page.keyboard.press('Control+d');
 await expect(position(page,'X')).toHaveValue(String(start+2));
 await page.keyboard.press('Control+x');
 await expect(status(page)).toContainText('2 objects');
 await page.keyboard.press('Control+v');
 await expect(status(page)).toContainText('3 objects');
 await page.keyboard.press('Control+z');
 await expect(status(page)).toContainText('2 objects');
 await page.keyboard.press('Control+Shift+z');
 await expect(status(page)).toContainText('3 objects');
 await page.keyboard.press('Control+a');
 await page.keyboard.press('Control+i');
 await expect(status(page)).toContainText('1 objects',{timeout:90000});
 await ready(page);
 await page.keyboard.press('Control+Shift+g');
 await expect(status(page)).toContainText('3 objects');
 await page.keyboard.press('Control+b');
 await expect(status(page)).toContainText('1 objects');
 await page.keyboard.press('m');
 await expect(page.getByRole('button',{name:'Flip X'})).toBeVisible();
 await page.keyboard.press('Escape');

 const hit=await viewBox(page);
 await page.keyboard.press('n');
 await page.mouse.click(hit.x,hit.y);
 await page.getByRole('textbox',{name:'Note text'}).fill('Synthetic test note');
 await page.getByRole('button',{name:'Save note'}).click();
 await expect(page.getByRole('button',{name:'Edit note: Synthetic test note'})).toBeVisible();
 await page.keyboard.press('r');
 await page.mouse.click(hit.x+130,hit.y);
 await expect(page.getByText('Ruler origin')).toBeVisible();
 await page.keyboard.press('r');
 await expect(page.getByText('Ruler origin')).toHaveCount(0);
 await page.getByRole('button',{name:'My Projects',exact:true}).click();
 await page.getByRole('button',{name:'New blank project',exact:true}).click();
 await page.getByRole('button',{name:'Box',exact:true}).click();
 await position(page,'Z').fill('10');
 await position(page,'Z').blur();
 await ready(page);
 await page.keyboard.press('Shift+w');
 await page.getByRole('button',{name:'Cylinder',exact:true}).click();
 await expect(position(page,'Z')).toHaveValue('10');
 await page.keyboard.press('Control+ArrowUp');
 await expect(position(page,'Z')).toHaveValue('11');
 await ready(page);
 await page.keyboard.press('d');
 await expect(position(page,'Z')).toHaveValue('10');
 await ready(page);
 const cylinder=await viewBox(page);
 await drag(page,cylinder.x,cylinder.y,30,10,'left','Alt');
 await expect(status(page)).toContainText('3 objects');
 await page.close();
 console.log('PASS mouse navigation, selection and movement, keyboard editing, exact intersection, workplane, notes and ruler');

 const mobile=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
 const phone=await mobile.newPage();
 await openEditor(phone);
 await phone.getByRole('button',{name:'Add',exact:true}).tap();
 await phone.getByRole('button',{name:'Box',exact:true}).tap();
 await expect(phone.locator('.dimension')).toHaveCount(3,{timeout:90000});
 await ready(phone);
 const cdp=await mobile.newCDPSession(phone);
 const touch=(type,...points)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:points.map(([x,y],i)=>({x,y,id:i+1}))});
 const swipe=async(x,y,dx,dy)=>{
  await touch('touchStart',[x,y]);
  await touch('touchMove',[x+dx,y+dy]);
  await touch('touchEnd');
 };
 const center=await viewBox(phone);
 await phone.touchscreen.tap(center.x+125,center.y);
 await expect(status(phone)).toContainText('0 selected');
 await phone.touchscreen.tap(center.x,center.y);
 await expect(status(phone)).toContainText('1 selected');
 await phone.getByRole('button',{name:'Multi-select',exact:true}).tap();
 await phone.touchscreen.tap(center.x,center.y);
 await expect(status(phone)).toContainText('0 selected');
 await phone.touchscreen.tap(center.x,center.y);
 await expect(status(phone)).toContainText('1 selected');
 await phone.getByRole('button',{name:'✓ Multi-select',exact:true}).tap();
 const beforeOrbit=await marker(phone);
 await swipe(center.x+130,center.y-115,-30,45);
 await expect.poll(()=>marker(phone)).not.toBe(beforeOrbit);

 const startDrag=await viewBox(phone);
 const beforeMove=await marker(phone);
 await swipe(startDrag.x,startDrag.y,44,20);
 await ready(phone);
 await expect.poll(()=>marker(phone)).not.toBe(beforeMove);
 const checkPos=()=>phone.evaluate(()=>{
  const key=Object.keys(localStorage).find(v=>v.startsWith('my3d-recovery-'));
  return key?JSON.parse(localStorage.getItem(key)).project.objects[0]?.pos[0]:undefined;
 });
 await expect.poll(checkPos).not.toBe(0);
 const touchX=await checkPos();
 expect(typeof touchX).toBe('number');

 const startPinch=await viewBox(phone);
 const beforePinch=await marker(phone);
 await touch('touchStart',[startPinch.x,startPinch.y]);
 await touch('touchMove',[startPinch.x+23,startPinch.y]);
 await touch('touchStart',[startPinch.x+23,startPinch.y],[startPinch.x+62,startPinch.y+30]);
 await touch('touchMove',[startPinch.x-20,startPinch.y+12],[startPinch.x+105,startPinch.y+55]);
 await touch('touchEnd');
 await expect.poll(()=>marker(phone)).not.toBe(beforePinch);
 expect(await checkPos()).toBe(touchX);
 expect(errors).toEqual([]);
 console.log('PASS touch tap, multi-select, orbit, shape move, pan and pinch with drag cancellation');
}finally{
 await browser?.close();
 child.kill();
 await exited;
 console.log('Stopped synthetic service. Fixture data at',data);
}
