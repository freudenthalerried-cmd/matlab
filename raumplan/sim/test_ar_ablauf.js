// Ablauf Eckenmodus: Ecke tippen, Bodenkante entlang (Zielpunkte), nächste Ecke … zurück zur 1. Ecke = Raum zu; Rückgängig; Ergebnis über finish()
const fake=()=>({style:{},classList:{add(){},remove(){}},getContext:()=>null});global.document={getElementById:id=>id==='arCv'?null:fake()};global.innerWidth=400;global.innerHeight=800;global.navigator={};global.localStorage={getItem:()=>null,setItem(){},removeItem(){}};
const AR=require('../ar.js'),T=AR._test;let seed=5;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647,gs=()=>{let u=0;for(let i=0;i<6;i++)u+=rnd();return (u-3)/Math.sqrt(.5);};
let res=null;T.startCorners(r=>res=r);const C=[[0,0],[4.2,0],[4.2,3.6],[0,3.6]];let t=0;
const aimAt=(p,k=8)=>{for(let i=0;i<k;i++)T.feedAim([p[0]+gs()*0.01,p[1]+gs()*0.01],t++);};
aimAt(C[0]);T.cornerTap();
// Fehler: falsche Ecke antippen und rückgängig
aimAt([2,1]);T.cornerTap();T.undo();
for(let i=0;i<4;i++){const a=C[i],b=C[(i+1)%4];for(let k=1;k<50;k++){const q=[a[0]+(b[0]-a[0])*k/50,a[1]+(b[1]-a[1])*k/50];T.feedAim([q[0]+gs()*0.01,q[1]+gs()*0.01],t++);}aimAt(b);T.cornerTap();}
console.log('Ecken',T.st.corners.length,'Phase',T.st.phase,'Wände',T.st.walls.length,T.st.walls.map(w=>w.length).join('/'));
T.finish();const L=res&&res.poly.map((p,i)=>Math.hypot(res.poly[(i+1)%4][0]-p[0],res.poly[(i+1)%4][1]-p[1]));
console.log('Ergebnis',L&&L.map(x=>x.toFixed(3)).join(' / '));
const ok=T.st.walls.length===4&&L&&L.every((x,i)=>Math.abs(x-[4.2,3.6,4.2,3.6][i])<0.006);console.log('Ablauf:',ok?'OK':'FEHLER');process.exit(ok?0:1);
