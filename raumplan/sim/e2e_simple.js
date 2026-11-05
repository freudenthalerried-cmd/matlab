// Tests: (1) Hintergrund-Erkennung hängt → trotzdem Ergebnis; (2) keine Blätter im Bild → Knopf „Ohne Marken messen (AR)“
const {chromium}=require(process.env.NP+'/playwright');
(async()=>{for(const mode of ['haengt','ohneMarken']){const y4m=mode==='haengt'?process.env.Y4M:process.env.Y4M2;
const b=await chromium.launch({args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream','--use-file-for-fake-video-capture='+y4m]});
const ctx=await b.newContext({permissions:['camera']});const p=await ctx.newPage({viewport:{width:430,height:900}});const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept());
if(mode==='haengt')await p.addInitScript(()=>{window.Worker=class{postMessage(){}};}); // Worker, der nie antwortet
await p.goto(process.env.URL);await p.evaluate(()=>localStorage.setItem('raumplan-guide','1'));await p.reload();
console.log('Reiter:',(await p.$$eval('nav button',b=>b.map(x=>x.textContent))).join(' | '));
await p.click('#liveOpen');await p.waitForSelector('#live',{state:'visible'});
if(mode==='ohneMarken'){await p.waitForTimeout(6000);console.log('ohne Marken → AR-Knopf sichtbar:',await p.isVisible('#liveToAR'));}
else{const t=Date.now();await p.waitForSelector('#live',{state:'hidden',timeout:150000}).catch(async()=>{await p.click('#liveDone');});const t1=Date.now();
 await p.waitForFunction(()=>/Ergebnis|nicht möglich/.test(document.querySelector('#resUI')?.textContent||'')&&!/Berechne/.test(document.querySelector('#resUI').textContent),null,{timeout:300000});
 console.log('Worker hängt → Ergebnis nach',((Date.now()-t1)/1000).toFixed(0),'s:',(await p.textContent('#resUI')).slice(0,90));}
console.log('errs',errs);await b.close();}})();
