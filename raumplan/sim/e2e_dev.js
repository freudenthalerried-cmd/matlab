// Browser-Test Entwicklermodus: ?dev=1 → Fall speichern → tatsächliche Maße eintragen → Vergleich/Diagnose → Export (JSON + ZIP)
const {chromium}=require(process.env.NP+'/playwright'),fs=require('fs');
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({acceptDownloads:true});const p=await ctx.newPage({viewport:{width:430,height:900}});const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept());
await p.goto(process.env.URL+'?dev=1');await p.evaluate(()=>localStorage.setItem('raumplan-guide','1'));await p.reload();
const png=await p.evaluate(()=>new Promise(r=>{const c=document.createElement('canvas');c.width=c.height=8;c.toBlob(r,'image/png');}).then(b=>b.size));
await p.evaluate(async()=>{const img=await new Promise(r=>{const c=document.createElement('canvas');c.width=c.height=8;c.toBlob(b=>r(new File([b],'a.png',{type:'image/png'})),'image/png');});
 const fr=[{t:0,fi:0,dets:[{id:0,c:[[1,1],[2,1],[2,2],[1,2]],res:.1,sharp:1,nx:4},{id:4,c:[[5,5],[6,5],[6,6],[5,6]],res:.2,sharp:1,nx:4}]},{t:1,fi:1,dets:[{id:4,c:[[5,5],[6,5],[6,6],[5,6]],res:.2,sharp:1,nx:4}]}];
 devCap({frames:fr,W:1920,H:1080,imgs:[img,img],source:'fotos',opts:{size:.08},rec:{ok:true,nImg:2,ids:[0,4],res:{rms:.31,it:[1500,960,540,.02],pts:[]},kU:new Map()},res:[{name:'Raum 1',w:{ok:true,lengths:[4.02,3.618,4.02,3.618],sigma:[.001,.001,.001,.001],groups:[[4,5],[6],[7],[8]],poly:[],warn:[]},ops:[]}]});});
await p.waitForSelector('#devBox .devcase',{timeout:10000});
await p.fill('#devBox [data-f="walls"]','4,000 3,600 4,000 3,600');await p.press('#devBox [data-f="walls"]','Tab');
await p.waitForSelector('#devBox .devcase table');const txt=await p.textContent('#devBox');
console.log(txt.match(/Maßstabsfehler[^.]*|zu lang[^)]*/)?.[0]||'(keine Maßstabsdiagnose)');
const ok1=/zu lang/.test(txt)&&/Marken in weniger als 3 Bildern/.test(txt)&&/Bodenmarke 1/.test(txt);
const dl=[];p.on('download',d=>dl.push(d));await p.click('#devBox [data-a="share"]');await p.waitForTimeout(1500);
for(const d of dl){const f=process.env.SP+'/'+d.suggestedFilename();await d.saveAs(f);console.log('Export:',d.suggestedFilename(),fs.statSync(f).size,'B');}
const zipF=dl.map(d=>d.suggestedFilename()).find(n=>n.endsWith('.zip')),jsonF=dl.map(d=>d.suggestedFilename()).find(n=>n.endsWith('.json'));
let ok2=false;if(zipF){const l=require('child_process').execSync(`unzip -l ${process.env.SP}/${zipF}`).toString();ok2=/bild-000\.png/.test(l)&&/bild-001\.png/.test(l);console.log(l.trim().split('\n').slice(-1)[0]);}
console.log('Diagnose ok:',ok1,'| ZIP ok:',ok2,'| errs',errs);fs.writeFileSync(process.env.SP+'/devjson.txt',jsonF||'');
await b.close();process.exit(ok1&&ok2&&!errs.length?0:1);})();
