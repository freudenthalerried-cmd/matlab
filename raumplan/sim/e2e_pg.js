// Browser-Test: Fotoserie (gerenderte Bilder) -> Auswerten -> Räume übernehmen
const {chromium}=require(process.env.NP+'/playwright'),fs=require('fs');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:430,height:900}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/index.html');
const dir=process.env.FR,files=fs.readdirSync(dir).filter(f=>f.endsWith('.png')).sort().map(f=>dir+'/'+f);
await p.setInputFiles('#pgFile',files);await p.click('#pgRun');
await p.waitForFunction(()=>!document.querySelector('#pgRun').disabled,null,{timeout:300000});
console.log(await p.textContent('#pgLog'));console.log(await p.textContent('#pgRes'));
await p.screenshot({path:process.env.SP+'/pg_res.png',fullPage:true});
const t=await p.$('#pgTake');if(t){await t.click();await p.waitForTimeout(400);await p.screenshot({path:process.env.SP+'/pg_plan.png',fullPage:true});}
console.log('errs',errs);await b.close();})();
