// Eckenmodus (Bodenkante): simulierte Zielpunkte entlang der Bodenkante eines 4,20 × 3,60-Raums, 1 cm Rauschen,
// Ecken angetippt → Polygon über solve() → Wandlängen; Raumhöhe über Sichtlinie auf Kante Wand/Decke.
const AR=require('../ar.js');let seed=11;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647,gs=()=>{let u=0;for(let i=0;i<6;i++)u+=rnd();return (u-3)/Math.sqrt(.5);};
const C=[[0,0],[4.2,0],[4.2,3.6],[0,3.6]],walls=[];
for(let i=0;i<4;i++){const a=C[i],b=C[(i+1)%4],w=[[a[0]+gs()*0.015,a[1]+gs()*0.015]];const n=60;for(let k=1;k<n;k++){const t=k/n;w.push([a[0]+(b[0]-a[0])*t+gs()*0.01,a[1]+(b[1]-a[1])*t+gs()*0.01]);}w.push([b[0]+gs()*0.015,b[1]+gs()*0.015]);walls.push(w);}
const r=AR.solve(walls,[[],[]],2,[0,0,0],2.6,[],{k:1.0,n:20,sig:0.002,auto:true});
const L=r.poly.map((p,i)=>Math.hypot(r.poly[(i+1)%4][0]-p[0],r.poly[(i+1)%4][1]-p[1]));
const d=L.map((x,i)=>x-[4.2,3.6,4.2,3.6][i]);console.log('Wände',L.map(x=>x.toFixed(3)).join(' / '),'| Abw. mm',d.map(x=>(x*1000).toFixed(1)).join(' / '),'| ±mm',r.sigma.map(x=>(x*1000).toFixed(1)).join(' / '),'| RH',r.height);
const ok=d.every(x=>Math.abs(x)<0.006)&&Math.abs(r.height-2.6)<1e-9;console.log('Eckenmodus:',ok?'OK':'FEHLER');process.exit(ok?0:1);
