// Browser-Test Kalibrier-Assistent: Fake-Kamera mit Kalibriertafel (CSS-3D, Soll f = 1500 px, keine Verzeichnung)
const {chromium}=require(process.env.NP+'/playwright');
(async()=>{const b=await chromium.launch({args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream','--use-file-for-fake-video-capture='+process.env.Y4M]});
const ctx=await b.newContext({permissions:['camera']});const p=await ctx.newPage({viewport:{width:430,height:900}});const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',async d=>{console.log('Meldung:',d.message());await d.accept();});
await p.goto('file://'+__dirname+'/../index.html');await p.evaluate(()=>{localStorage.setItem('raumplan-guide','1')});await p.reload();
console.log('Status vorher:',await p.textContent('#calState'));
await p.evaluate(()=>calStart());const t0=Date.now();
for(let k=0;k<25;k++){await p.waitForTimeout(6000);if(await p.isHidden('#calUI'))break;console.log(((Date.now()-t0)/1000|0)+' s',await p.textContent('#calInfo'),'|',(await p.textContent('#calHint')).slice(0,80));if(k===1)await p.screenshot({path:process.env.SP+'/calib.png'});}
await p.waitForTimeout(1000);console.log('Ergebnis:',await p.evaluate(()=>JSON.stringify(CAM.load())));console.log('Status:',await p.textContent('#calState'));console.log('errs',errs);await b.close();})();
