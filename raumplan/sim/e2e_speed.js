// Geschwindigkeits-Test: Aufnahme (Fake-Kamera) → automatische Auswertung → Plan; danach „Genauer auswerten“ mit gesichertem Video. Seite über http (Web Worker).
const {chromium}=require(process.env.NP+'/playwright');
(async()=>{const b=await chromium.launch({args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream','--use-file-for-fake-video-capture='+process.env.Y4M]});
const ctx=await b.newContext({permissions:['camera']});const p=await ctx.newPage({viewport:{width:430,height:900}});const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',async d=>{await d.accept();});
await p.goto(process.env.URL);await p.evaluate(()=>{localStorage.setItem('raumplan-guide','1')});await p.reload();
await p.click('#liveOpen');await p.waitForSelector('#live',{state:'visible'});const t0=Date.now();
await p.waitForSelector('#live',{state:'hidden',timeout:+(process.env.T||150)*1000}).catch(async()=>{await p.click('#liveDone');});
const t1=Date.now();console.log('Kamera:',await p.evaluate(()=>live.camInfo+' · Foto-Zeit '+Math.round(live.photoMs||0)+' ms · Größen '+JSON.stringify([...new Set(live.sizes)])));console.log('Aufnahme:',((t1-t0)/1000).toFixed(0),'s,',await p.evaluate(()=>live.shots),'Bilder, Worker:',await p.evaluate(()=>DET.n),'Video-Aufzeichnung:',await p.evaluate(()=>live.recOn));
await p.waitForFunction(()=>S.rooms.length>0||/nicht möglich|warn/.test(document.querySelector('#pgRes').innerHTML)&&!document.querySelector('#pgRun').disabled,null,{timeout:600000});await p.waitForTimeout(300);
const t2=Date.now();console.log('Auswertung bis Plan:',((t2-t1)/1000).toFixed(1),'s →',await p.evaluate(()=>JSON.stringify(S.rooms.map(r=>r.segs.map(s=>s.len.toFixed(4))))));
console.log((await p.textContent('#pgLog')).split('\n').filter(l=>/Marken schon|Ausgleich:|Erkennung fertig/.test(l)).join(' | '));
await p.waitForFunction(()=>!!live.vidName,null,{timeout:60000}).catch(()=>{});console.log('Video gespeichert:',await p.evaluate(()=>live.vidName),await p.textContent('#vidState').catch(()=>''));
if(await p.evaluate(()=>!!live.vidName)){const t3=Date.now();await p.evaluate(()=>{showTab('auf');pgRefine(live.vidName)});await p.waitForFunction(()=>/Vergleich schnell/.test(document.querySelector('#pgRes').textContent),null,{timeout:900000});
console.log('Genauer auswerten:',((Date.now()-t3)/1000).toFixed(0),'s');console.log((await p.textContent('#pgRes')).split('Vergleich schnell ↔ genau')[1].slice(0,600));}
await p.screenshot({path:process.env.SP+'/result.png'});console.log('Ergebnis-Bildschirm:',await p.isVisible('#resUI'),(await p.textContent('#resUI').catch(()=>'')).slice(0,160));console.log('errs',errs);await b.close();})();
