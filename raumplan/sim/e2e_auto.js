// Browser-Test Auto-Aufnahme: Fake-Kamera (y4m), nur filmen – App fotografiert selbst, dann Auswertung
const {chromium}=require(process.env.NP+'/playwright');
(async()=>{const b=await chromium.launch({args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream','--use-file-for-fake-video-capture='+process.env.Y4M]});
const ctx=await b.newContext({permissions:['camera']});const p=await ctx.newPage({viewport:{width:430,height:900}});const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',async d=>{console.log('Meldung:',d.message());await d.accept();});
await p.goto('file://'+__dirname+'/../index.html');await p.evaluate(()=>{try{localStorage.setItem('raumplan-guide','1')}catch(e){}});await p.reload();
await p.fill('#pgN','12');await p.fill('#pgSize',process.env.SIZE||'45');await p.dispatchEvent('#pgSize','change');await p.click('#liveOpen');await p.click('#mGo');
const t0=Date.now();try{await p.waitForSelector('#liveDone.ready',{timeout:+(process.env.T||150)*1000});}catch(e){}
console.log('Aufnahme',((Date.now()-t0)/1000).toFixed(0),'s:',await p.textContent('#liveInfo'),'|',await p.textContent('#liveHint'));
await p.screenshot({path:process.env.SP+'/auto.png'});
await p.click('#liveDone');await p.waitForTimeout(500);await p.waitForFunction(()=>!document.querySelector('#pgRun').disabled,null,{timeout:600000});
console.log((await p.textContent('#pgLog')).split('\n').filter(l=>!/Iteration/.test(l)).slice(-4).join('\n'));console.log((await p.textContent('#pgRes')).slice(0,400));
console.log('errs',errs);await b.close();})();
