// Browser-Test Messart: Startabfrage (Zollstock/Marken/Kontrollmaß) → Text; AR-Ergebnis nur Handy (2 % zu groß) → Warnung; Kontrollmaß (getippt + vorher angesagt) → Maßstab korrigiert → Plan
const {chromium}=require(process.env.NP+'/playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:430,height:900}});const errs=[],al=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>{al.push(d.message());d.accept();});
await p.goto(process.env.URL);await p.evaluate(()=>{localStorage.clear();localStorage.setItem('raumplan-guide','1');});await p.reload();
await p.click('#liveOpen');await p.waitForTimeout(500);
const ok1=al.some(a=>/AR wird auf diesem Gerät/.test(a))&&!(await p.isVisible('#modeUI').catch(()=>false));console.log('Start direkt ohne Abfrage (AR):',ok1);
// AR-Ergebnis simulieren: Raum 4,20 × 3,60, Handy-Maßstab 2 % zu groß, kein Zollstock
await p.evaluate(()=>{const k=1.02,P=[[0,0],[4.2,0],[4.2,3.6],[0,3.6]].map(q=>q.map(v=>v*k));arResult({poly:P,sigma:[.045,.04,.045,.04],height:2.6*k,scale:null},{z:false},Date.now());});
const w1=await p.textContent('#resUI');console.log('ohne Kontrollmaß:',/SEHR UNGENAU/.test(w1),w1.match(/4,284 m/)?'4,284 m':'?');
await p.click('#resUI [data-km="0"]');await p.fill('#edUI input','4,20');await p.click('#edOk');
const w2=await p.textContent('#resUI');const ok2=/SEHR UNGENAU/.test(w1)&&!/SEHR UNGENAU/.test(w2)&&/4,200 m/.test(w2)&&/3,600 m/.test(w2)&&/2,600 m/.test(w2);console.log('mit Kontrollmaß korrigiert:',ok2);
await p.click('#resUI [data-a="take"]');const r=await p.evaluate(()=>{const r=S.rooms[S.rooms.length-1];return {segs:r.segs.map(s=>+s.len.toFixed(3)),h:r.h,how:r.adj.how};});console.log('Plan:',JSON.stringify(r));
// angesagtes Wandmaß vorher → automatisch zugeordnet
await p.evaluate(()=>{KM.add(3.6,'sprache',{kind:'wand'});const k=0.985,P=[[0,0],[4.2,0],[4.2,3.6],[0,3.6]].map(q=>q.map(v=>v*k));arResult({poly:P,sigma:[.01,.01,.01,.01],height:null,scale:{k:1.01,n:2}},{z:true},Date.now());});
const w3=await p.textContent('#resUI');const ok3=/1 Kontrollmaß/.test(w3)&&/4,200 m/.test(w3);console.log('angesagtes Maß übernommen:',ok3,(w3.match(/Zollstock wich [^)]*/)||[''])[0]);
await p.screenshot({path:process.env.SP+'/modus.png'});
const ok=ok1&&ok2&&ok3&&r.segs.includes(4.2)&&!errs.length;console.log('Messart korrekt:',ok,'errs',errs);await b.close();process.exit(ok?0:1);})();
