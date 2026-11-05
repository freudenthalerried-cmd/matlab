// Browser-Test Live-Aufnahme mit Coach: Fake-Kamera (y4m mit „1 Blatt pro Wand“), nur filmen → Bilder automatisch → Auswertung und Übernahme in den Plan automatisch
const {chromium}=require(process.env.NP+'/playwright');
(async()=>{const b=await chromium.launch({args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream','--use-file-for-fake-video-capture='+process.env.Y4M]});
const ctx=await b.newContext({permissions:['camera']});const p=await ctx.newPage({viewport:{width:430,height:900}});const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',async d=>{console.log('Meldung:',d.message().slice(0,300));await d.accept();});
await p.goto('file://'+__dirname+'/../index.html');await p.evaluate(()=>{localStorage.setItem('raumplan-guide','1')});await p.reload();
await p.click('#liveOpen');await p.click('#mGo');const t0=Date.now();
for(let k=0;k<12;k++){await p.waitForTimeout(10000);if(await p.isHidden('#live'))break;console.log(((Date.now()-t0)/1000|0)+' s',await p.textContent('#liveInfo'),'|',(await p.textContent('#liveHint')).slice(0,90));if(k===2)await p.screenshot({path:process.env.SP+'/coach.png'});}
if(!(await p.isHidden('#live')))console.log('Balken:',await p.evaluate(()=>live.G.map(g=>g.key+':'+lgProg(g).toFixed(2)+' top'+(g.top||0)+' w'+(g.walls?g.walls.size:'')).join(' ')+' verbunden:'+lgConnected()));console.log('Aufnahme beendet nach',((Date.now()-t0)/1000|0),'s, automatisch:',await p.isHidden('#live'));
if(!(await p.isHidden('#live')))await p.click('#liveDone');
await p.waitForTimeout(1000);await p.waitForFunction(()=>!document.querySelector('#pgRun').disabled,null,{timeout:900000});await p.waitForTimeout(1500);
console.log((await p.textContent('#pgLog')).split('\n').filter(l=>!/Iteration/.test(l)).slice(-3).join('\n'));console.log((await p.textContent('#pgRes')).slice(0,500));
console.log('Marken:',await p.evaluate(()=>{const r=pgLast&&pgLast.rec;if(!r||!r.ok)return 'keine Rek.';return r.ids.map(id=>{const q=r.kU.get(id);return id+':'+[0,1,2].map(j=>([0,1,2,3].reduce((a,c)=>a+r.res.pts[4*q+c][j],0)/4).toFixed(3)).join(',')}).join(' ')+' | Sichtungen '+JSON.stringify(r.ids.map(id=>pgLast.frames.filter(f=>f.dets.some(d=>d.id===id)).length))}));
console.log('Räume im Plan:',await p.evaluate(()=>JSON.stringify(S.rooms.map(r=>[r.name,r.segs.map(s=>s.len.toFixed(3))]))));
await p.screenshot({path:process.env.SP+'/coach_end.png'});console.log('errs',errs);await b.close();})();
