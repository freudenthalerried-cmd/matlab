const fs=require('fs'),RP=require('../raumplan-neu/core.js');
const dir=process.argv[2], f=fs.readdirSync(dir).filter(x=>x.endsWith('.json')).sort();
let E=[],SG=[],miss=0,big=0,pix=[],fl=0; 
for(const j of f){const T=JSON.parse(fs.readFileSync(dir+'/'+j)); const g=new Uint8Array(fs.readFileSync(dir+'/'+j.replace('.json','.raw')));
 const loc=RP.locate(RP.findQuads(g,T.W,T.H)); if(!loc.ok){miss++;console.log(j,'nicht erkannt',loc.err);continue;}
 const L=RP.floorDist(loc,T.ca,T.cb), err=L-T.L*1000, sig=RP.sigmaOf(loc,T.ca,T.cb,30); E.push(Math.abs(err)); SG.push([Math.abs(err),sig,loc.ids.length]);
 const s=RP.suggestCorners(g,T.W,T.H,loc), sn=RP.snapBase(g,T.W,T.H,s.a,s.b,22)||s;
 const d=(p,q)=>Math.hypot(p[0]-q[0],p[1]-q[1]); const da=Math.min(d(sn.a,T.ca)+d(sn.b,T.cb),d(sn.a,T.cb)+d(sn.b,T.ca)); pix.push(da/2);
 if(sn.a&&Math.abs(da/2)<25) fl++;
 if(Math.abs(err)>25||sig>15) console.log(j,'ids',loc.ids.join(''),'rms',loc.rms.toFixed(2),'L',(T.L*1000).toFixed(0),'Fehler',err.toFixed(1),'sig',sig.toFixed(1));
}
E.sort((a,b)=>a-b);pix.sort((a,b)=>a-b);
console.log('erkannt',f.length-miss,'/',f.length,'| Fehler median',E[E.length>>1].toFixed(1),'90%',E[Math.floor(E.length*.9)].toFixed(1),'max',E[E.length-1].toFixed(1));
const flagged=SG.filter(x=>x[1]>15).length, badKept=SG.filter(x=>x[0]>25&&x[1]<=15).length; console.log('als unsicher markiert',flagged,'| grober Fehler (>2,5 cm) NICHT markiert',badKept);
console.log('Ecken-Vorschlag: im Mittel px median',pix[pix.length>>1].toFixed(0),'| genau (<25 px):',fl,'/',f.length-miss);
// Gesamtkette: nur automatische Ecken, ohne Nachziehen
{const AE=[];let nope=0;for(const j of f){const T=JSON.parse(fs.readFileSync(dir+'/'+j)); const g=new Uint8Array(fs.readFileSync(dir+'/'+j.replace('.json','.raw')));const loc=RP.locate(RP.findQuads(g,T.W,T.H));if(!loc.ok){nope++;continue;}const s=RP.suggestCorners(g,T.W,T.H,loc),sn=RP.snapBase(g,T.W,T.H,s.a,s.b,22)||s;AE.push(Math.abs(RP.floorDist(loc,sn.a,sn.b)-T.L*1000));}AE.sort((a,b)=>a-b);console.log('Vollautomatisch (ohne Ziehen): median',AE[AE.length>>1].toFixed(1),'90%',AE[Math.floor(AE.length*.9)].toFixed(1),'unter 1 cm:',AE.filter(x=>x<10).length,'/',AE.length);}
