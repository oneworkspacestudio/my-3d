import {spawn} from 'node:child_process';
import {randomBytes} from 'node:crypto';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium,expect} from '@playwright/test';

// Run only against an isolated native app; hold its real CAD worker request to
// make the otherwise timing-sensitive blank-workplane regression deterministic.
const out=process.env.MY3D_QA_OUTPUT,exe=process.env.MY3D_QA_EXE,data=process.env.MY3D_QA_DATA;
if(!out||!exe||!data)throw Error('Set MY3D_QA_OUTPUT, MY3D_QA_EXE and an isolated MY3D_QA_DATA');
await mkdir(out,{recursive:true});await mkdir(data,{recursive:true});
const password=randomBytes(24).toString('hex'),origin='http://localhost:39119',checks=[];
const child=spawn(exe,['--data',data,'--listen','127.0.0.1:39119','--origin',origin,'--bootstrap-email','qa@example.test','--no-browser'],{env:{...process.env,WORKSPACE_BOOTSTRAP_PASSWORD:password},windowsHide:true,stdio:['ignore','pipe','pipe']});
let output='',browser;child.stdout.on('data',b=>output+=b);child.stderr.on('data',b=>output+=b);
try{
  let ready=false;for(let i=0;i<120;i++){if(child.exitCode!==null)throw Error(output);try{if((await fetch(origin+'/healthz')).ok){ready=true;break}}catch{}await new Promise(r=>setTimeout(r,500))}if(!ready)throw Error('Native fixture did not start');
  browser=await chromium.launch({channel:'msedge',headless:true,args:['--enable-webgl','--use-angle=swiftshader']});
  for(const [name,width,height] of [['desktop',1672,941],['phone',390,844],['cancel',390,844]]){
    const context=await browser.newContext({viewport:{width,height},hasTouch:true}),page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));let release;const gate=new Promise(r=>release=r);
    await context.route('**/assets/kernel.worker-*.js',async route=>{await gate;await route.continue().catch(()=>{})});
    try{
      await page.goto(origin);await page.getByLabel('Email address').fill('qa@example.test');await page.getByLabel('Password',{exact:true}).fill(password);await page.getByRole('button',{name:'Sign in',exact:true}).click();
      const workplane=page.getByLabel('Interactive 3D workplane'),status=page.locator('.loading-overlay');
      await expect(status).toBeVisible();await expect(status).toContainText('Loading your model');await expect(status.locator('.model-spinner')).toBeVisible();await expect(workplane).toHaveAttribute('aria-busy','true');await expect(page.locator('.object-context')).toHaveCount(0);
      const card=await status.boundingBox(),canvas=await workplane.locator('canvas').boundingBox();
      expect(card.y).toBeGreaterThanOrEqual(canvas.y);expect(card.y+card.height).toBeLessThanOrEqual(canvas.y+canvas.height);expect(card.x).toBeGreaterThanOrEqual(canvas.x);expect(card.x+card.width).toBeLessThanOrEqual(canvas.x+canvas.width);
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
      await page.screenshot({path:out+'/'+name+'-loading.png'});
      if(name==='cancel'){
        await status.getByRole('button',{name:'Cancel',exact:true}).click();await expect(status).toHaveCount(0);await expect(workplane).toHaveAttribute('aria-busy','false');await expect(page.locator('.object-context')).toHaveCount(0);
        release();await page.getByRole('button',{name:'Box',exact:true}).tap();
      }else release();
      await expect(page.locator('.dimension')).toHaveCount(3,{timeout:60000});await expect(status).toHaveCount(0);await expect(page.locator('.object-context')).toBeVisible();await expect(workplane).toHaveAttribute('aria-busy','false');
      await page.screenshot({path:out+'/'+name+'-ready.png'});
      if(name==='desktop'){
        await page.getByRole('button',{name:'Box',exact:true}).click();await expect(status).toHaveCount(0,{timeout:60000});
        const worker=page.workers().find(w=>w.url().includes('kernel.worker-'));
        await worker.evaluate(()=>{const send=self.postMessage.bind(self);self.postMessage=(...args)=>setTimeout(()=>send(...args),1000)});
        await page.getByLabel('size X',{exact:true}).fill('72');
        await expect(page.locator('.loading-surface--updating')).toBeVisible();await expect(status).toContainText('Updating your model');await expect(page.locator('.object-context')).toHaveCount(0);await expect(page.locator('.dimension')).toHaveCount(3);
        await expect(status).toHaveCount(0,{timeout:60000});await expect(page.locator('.object-context')).toBeVisible();
        await page.getByRole('button',{name:'My Projects',exact:true}).click();await page.getByRole('button',{name:'New blank project',exact:true}).click();
        await expect(status).toHaveCount(0,{timeout:60000});await expect(page.locator('.dimension')).toHaveCount(0);await expect(page.locator('.object-context')).toHaveCount(0);
        await page.getByRole('button',{name:'Box',exact:true}).click();await expect(page.locator('.dimension')).toHaveCount(3,{timeout:60000});await expect(status).toHaveCount(0);
      }
      expect(errors).toEqual([]);checks.push({name,loadingVisible:true,controlsHiddenWhileLoading:true,cardInsideCanvas:true,readyControlsVisible:true,cancelAndRestart:name==='cancel',errors});
    }finally{release();await context.close()}
  }
  await writeFile(out+'/loading-acceptance.json',JSON.stringify({schema:1,checks,isolated:true},null,2));console.log('Loading, responsive placement, blank scene and cancel/restart checks passed');
}finally{await browser?.close();child.kill();await writeFile(out+'/loading-process.json',JSON.stringify({pid:child.pid,data,stopped:true}));}
