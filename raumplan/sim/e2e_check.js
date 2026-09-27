// Browser-Test: erwartete Wandanzahl (Warnung) + Kontrollmaß
const {chromium}=require(process.env.NP+'/playwright'),fs=require('fs');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1000,height:1200}});const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept());
await p.goto('file://'+__dirname+'/../index.html');const dir=process.env.FR,files=fs.readdirSync(dir).filter(f=>f.endsWith('.png')).sort().map(f=>dir+'/'+f);
await p.setInputFiles('#pgFile',files);await p.fill('#pgWalls','5');await p.click('#pgRun');await p.waitForFunction(()=>!document.querySelector('#pgRun').disabled,null,{timeout:300000});
console.log('Warnung:',(await p.$$eval('#pgRes .warn',a=>a.map(x=>x.textContent))).join(' | ').slice(0,160));
await p.click('#ckShow');await p.fill('[data-ck="0,1"]','360,2');await p.fill('[data-ck="0,0"]','4,200');
console.log('Kontrolle Wand 1:',await p.textContent('#ck0_0'),'| Wand 2:',await p.textContent('#ck0_1'));
await p.click('#pgTake');await p.waitForTimeout(300);await p.evaluate(()=>{selRoom=S.rooms.length-1;roomPanel();});
console.log('Raum-Kontrollmaße:',JSON.stringify(await p.evaluate(()=>S.rooms[S.rooms.length-1].checks)));
await p.screenshot({path:process.env.SP+'/check.png',fullPage:true});console.log('errs',errs);await b.close();})();
