// Browser-Test Live-Aufnahme mit Fake-Kamera (gerendertes Raumvideo als y4m)
const {chromium}=require(process.env.NP+'/playwright');
(async()=>{const b=await chromium.launch({args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream','--use-file-for-fake-video-capture='+process.env.Y4M]});
const ctx=await b.newContext({permissions:['camera']});const p=await ctx.newPage({viewport:{width:430,height:900}});const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',async d=>{console.log('Meldung:',d.message());await d.accept();});
await p.goto('file://'+__dirname+'/../index.html');await p.fill('#pgN','16');await p.click('#liveOpen');await p.waitForTimeout(1500);
console.log('Live sichtbar:',await p.isVisible('#live'));
for(let k=0;k<(+process.env.SHOTS||24);k++){await p.waitForTimeout(700);await p.click('#liveShot');await p.waitForFunction(()=>!document.querySelector('#liveShot').disabled,null,{timeout:30000});}
console.log('Info:',await p.textContent('#liveInfo'));
await p.screenshot({path:process.env.SP+'/live.png'});
await p.click('#liveClose');await p.click('#pgRun');await p.waitForFunction(()=>!document.querySelector('#pgRun').disabled,null,{timeout:300000});
console.log((await p.textContent('#pgLog')).split('\n').filter(l=>!/Iteration/.test(l)).slice(-4).join('\n'));console.log((await p.textContent('#pgRes')).slice(0,200));
console.log('errs',errs);await b.close();})();
