const AG = require('../ausgleich.js');
const g = AG.gauss, R = [[0,0],[4.2,0],[4.21,3.6],[-0.02,3.59]]; // Altbau leicht schief
const d = (a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
function run(kind, sl=0.0015){
  let mx=[], ws=[];
  for(let k=0;k<300;k++){
    const obs=[0,1,2,3].map(i=>({typ:'wand',i,v:d(R[i],R[(i+1)%4])+g()*sl,s:sl}));
    if(kind==='diag') obs.push({typ:'diag',i:0,j:2,v:d(R[0],R[2])+g()*0.002,s:0.002},{typ:'diag',i:1,j:3,v:d(R[1],R[3])+g()*0.002,s:0.002});
    if(kind==='sehne') [0,1,2,3].forEach(i=>{const a=1.5,b=1.5,th=AG.cornerAngle(R.flat(),i,4);obs.push({typ:'sehne',i,a,b,c:Math.sqrt(2*a*a*(1-Math.cos(th)))+g()*sl,s:sl});});
    const P0=[[0,0],[4.2,0],[4.2,3.6],[0,3.6]].map(p=>[p[0]+g()*0.03,p[1]+g()*0.03]);
    const r=AG.adjust(P0,obs); if(!r.ok){console.log(r);return;}
    // Formfehler nach Überlagerung (Ecke 1 + Richtung Wand 1)
    const t=R.map(p=>[p[0]-R[0][0],p[1]-R[0][1]]), e=r.P.map(p=>[p[0]-r.P[0][0],p[1]-r.P[0][1]]);
    const a=Math.atan2(t[1][1],t[1][0])-Math.atan2(e[1][1],e[1][0]), c=Math.cos(a), s=Math.sin(a);
    mx.push(Math.max(...e.map((p,i)=>d([c*p[0]-s*p[1],s*p[0]+c*p[1]],t[i])))*1000);
    ws.push(Math.max(...r.wallSigma)*1000);
    if(k===0) console.log(kind,'σ0',r.s0&&r.s0.toFixed(2),'red',r.red,'warn',r.warn.length,'Eck-σ mm',r.cornerSigma.map(v=>(v*1000).toFixed(1)).join(' '));
  }
  mx.sort((a,b)=>a-b); console.log(kind.padEnd(6),'Eckfehler median',mx[150].toFixed(1),'95%',mx[285].toFixed(1),'| Wand-σ (berechnet)',(ws.reduce((a,b)=>a+b)/ws.length).toFixed(2));
}
run('diag'); run('sehne'); run('none');
// Grober Fehler: Tippfehler 4,21 statt 4,12 -> Erkennung?
const obs=[0,1,2,3].map(i=>({typ:'wand',i,v:d(R[i],R[(i+1)%4]),s:0.0015}));obs.push({typ:'diag',i:0,j:2,v:d(R[0],R[2]),s:.002},{typ:'diag',i:1,j:3,v:d(R[1],R[3]),s:.002});
obs[1].v+=0.05; const r=AG.adjust(R,obs); console.log('Grobfehler-Erkennung:',r.worst&&r.worst.o, r.warn);
