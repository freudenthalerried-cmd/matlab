// Browser-Test: Fotoserie mit Fenster -> Auswerten -> „📐 Öffnung“ -> 2 Ecken antippen -> Maße prüfen -> in Plan übernehmen
const {chromium}=require(process.env.NP+'/playwright'),fs=require('fs');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1000,height:900}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/index.html');
const dir=process.env.FR,files=fs.readdirSync(dir).filter(f=>f.endsWith('.png')).sort().map(f=>dir+'/'+f);
await p.setInputFiles('#pgFile',files);await p.click('#pgRun');await p.waitForFunction(()=>!document.querySelector('#pgRun').disabled,null,{timeout:300000});
const wi=await p.evaluate(()=>pgLast.res[0].w.groups.findIndex(g=>g.includes(13)));console.log('Fensterwand = Wand',wi+1);
await p.click(`[data-op="0,${wi}"]`);await p.waitForFunction(()=>opSt&&opSt.cv,null,{timeout:60000});await p.waitForTimeout(300);
const results=[];
for(let k=0;k<3;k++){
 if(k){await p.selectOption('#opSel',String(k));await p.waitForFunction(k=>opSt.k===k&&opSt.cv&&document.querySelector('#opOut').textContent.indexOf('geladen')<0,k,{timeout:60000});await p.waitForTimeout(300);}
 for(const X of [[2.5-0.9,3.6-1.3,0.9],[1.3-0.9,3.6-1.3,2.3]]){
  const c=await p.evaluate(X=>{const cv=document.querySelector('#opCv');cv.scrollIntoView({block:'center'});const ci=opSt.list[opSt.k].ci,uv=BA.project(pgLast.rec.res.it,pgLast.rec.res.cams[ci],X),r=cv.getBoundingClientRect(),kk=cv.width/r.width;
   return {x:r.left+uv[0]/kk+(Math.random()-.5)*2,y:r.top+uv[1]/kk+(Math.random()-.5)*2,ok:uv[0]>0&&uv[1]>0&&uv[0]<cv.width&&uv[1]<cv.height};},X);
  if(!c.ok){console.log('Ecke außerhalb Foto',k);continue;}await p.mouse.click(c.x,c.y);}
 results.push(await p.textContent('#opOut'));}
console.log(results[results.length-1]);
await p.screenshot({path:process.env.SP+'/op.png'});
await p.click('#opAdd');await p.click('#pgTake');await p.waitForTimeout(300);
console.log('Plan-Öffnungen:',JSON.stringify(await p.evaluate(()=>S.rooms[S.rooms.length-1].ops)));
await p.screenshot({path:process.env.SP+'/op_plan.png'});
console.log('errs',errs);await b.close();})();
