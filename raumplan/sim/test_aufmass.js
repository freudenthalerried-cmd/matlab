// Rechenkern Aufmaß AR: Raum 4,20 × 3,60 (+ schiefe Ecke), AR-Maßstabsfehler 1,2 %, Rauschen 3 mm, Möbel-Ausreißer
const AM=require('../aufmass-core.js');let seed=7;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647,g=()=>{let s=0;for(let i=0;i<6;i++)s+=rnd();return s-3};
const K=1.012,N=0.003;let worst=0;
for(let run=0;run<200;run++){
 const T=[[0,0],[4.2,0],[4.25,3.6],[0,3.6]],n=T.length;
 const walls=T.map((a,i)=>{const b=T[(i+1)%n],pts=[];for(let k=0;k<6;k++){const t=0.1+0.8*rnd();pts.push([K*(a[0]+(b[0]-a[0])*t)+N*g(),K*(a[1]+(b[1]-a[1])*t)+N*g()]);}
  if(run%3==0)pts.push([K*(a[0]+(b[0]-a[0])*0.5)+0.25,K*(a[1]+(b[1]-a[1])*0.5)+0.2]);return{pts};});
 const z=[];for(let l=0;l<3;l++){const a=[rnd()*2,0,rnd()*2],ang=rnd()*6.28,e=()=>0.003*g();z.push([[K*a[0]+e(),0,K*a[2]+e()],[K*(a[0]+2*Math.cos(ang))+e(),0,K*(a[2]+2*Math.sin(ang))+e()]]);}
 const S=AM.zScale(z,2),R=AM.room(walls,{scale:S.s,scaleSig:S.sig});if(!R.ok){console.log('FEHLER',R.err);process.exit(1)}
 const tl=T.map((a,i)=>Math.hypot(T[(i+1)%n][0]-a[0],T[(i+1)%n][1]-a[1]));
 R.len.forEach((L,i)=>{const e=Math.abs(L-tl[i]);if(e>0.01)console.log('run',run,'wand',i,(e*1000).toFixed(1),'s',S.s.toFixed(4),S.d.map(v=>v.toFixed(3)));worst=Math.max(worst,e)});
 if(run==0)console.log('Längen',R.len.map(v=>v.toFixed(4)),'soll',tl.map(v=>v.toFixed(4)),'σ',R.sig.map(v=>(v*1000).toFixed(1)),'Maßstab',S.s.toFixed(4));
}
console.log('größter Fehler über 200 Läufe:',(worst*1000).toFixed(1),'mm');
// Fenster über Strahl ∩ Wand
const walls=[[[0,0],[4,0]],[[4,0],[4,3]],[[4,3],[0,3]],[[0,3],[0,0]]].map(w=>({pts:[w[0].map((v,i)=>v+(w[1][i]-v)*0.2),w[0].map((v,i)=>v+(w[1][i]-v)*0.8)]}));
const R=AM.room(walls),o=[2,1.5,2],aim=t=>{const d=[t[0]-o[0],t[1]-o[1],t[2]-o[2]],l=Math.hypot(...d);return d.map(v=>v/l)};
const h1=AM.pickWall(o,aim([1,0.9,0]),R,0),h2=AM.pickWall(o,aim([2.2,2.3,0]),R,0);console.log('Fenster',AM.opening('fenster',h1,h2,1),'Wand',h1.i);
const hc=AM.pickWall(o,aim([3,2.55,3]),R,0);console.log('Höhe',hc.y.toFixed(3),'Wand',hc.i);
// Dachschräge: Raum 4×3, Kniestock 1,0 m an Wand 0 (y=0), 45°, Decke 2,5 m
const P=[[0,0],[4,0],[4,3],[0,3]],sl=AM.slope(0,1.0,1.0,2.0,2.5);console.log('Schräge',sl,'h(2,0.5)',AM.heightAt([2,0.5],P,[sl],2.5).toFixed(3),'Fläche≥1,5',AM.areaAbove(P,[sl],1.5).toFixed(3),'(soll 10)');
