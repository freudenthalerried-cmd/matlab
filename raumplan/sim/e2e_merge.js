// Browser-Test: zwei getrennte Fotoserien nacheinander „in den Plan übernehmen“ -> automatisch zusammengefügt
const {chromium}=require(process.env.NP+'/playwright'),fs=require('fs');
if(process.env.SEED){let s=+process.env.SEED;Math.random=()=>{s=(s*16807)%2147483647;return s/2147483647;};}
const msrc=fs.readFileSync(__dirname+"/test_merge.js","utf8").replace(/^if\(process.env.SEED\).*$/m,'').split("const d=(a,b)=>")[0];
eval(msrc.replace(/^const /gm,"var "));
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1000,height:900}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
p.on('dialog',async d=>{console.log('Meldung:',d.message());await d.accept();});
await p.goto('file://'+__dirname+'/../index.html');
const sessions=[{F:F1,floor:floorA,name:'Wohnen',ids:R2[0].ids},{F:F2,floor:floorB,name:'Küche',ids:R2[1].ids}];
for(const s of sessions){
 await p.evaluate(({F,floor,name,ids,W,H,MS})=>{const d=Math.hypot(floor[1][0]-floor[0][0],floor[1][1]-floor[0][1]);
  const rec=PG.reconstruct(F,{W,H,size:MS,scaleDist:d,sigPx:.3});const res=[{name,ids:new Set(ids)}].map(x=>({...x,w:PG.walls(rec,{ids:x.ids})}));
  pgLast={rec,res,frames:F,W,H};pgTake();},{...s,W,H,MS});
 await p.waitForTimeout(300);}
const out=await p.evaluate(()=>S.rooms.map(r=>({name:r.name,P:geo(r).P,L:geo(r).E.map(e=>e.L)})));
out.forEach(r=>console.log(r.name,'Ecken',r.P.map(q=>q.map(v=>v.toFixed(3)).join('/')).join('  '),'| Wände',r.L.map(v=>v.toFixed(4)).join(' ')));
const xr=Math.max(...out[0].P.map(q=>q[0])),xl=Math.min(...out[1].P.map(q=>q[0]));console.log('Innenwand im Plan:',((xl-xr)*1000).toFixed(1),'mm (soll 120)');
await p.evaluate(()=>{selRoom=null;showTab('plan');renderPlan(true);});await p.screenshot({path:process.env.SP+'/merge.png'});
console.log('errs',errs);await b.close();})();
