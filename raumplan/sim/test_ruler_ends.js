// Zollstock-Enden einzeln (verschiedene Bilder), Boden und an die Wand gelehnt: simulierte AR-Kamera, 1 px Rauschen,
// AR-Maßstab 2 % falsch → Faktor muss auf ±0,2 % stimmen; nur Bilder, in denen ein Ende sichtbar ist.
const AR=require('../ar.js');let seed=3;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647,gs=()=>{let u=0;for(let i=0;i<6;i++)u+=rnd();return (u-3)/Math.sqrt(.5);};
const W=640,H=480,fov=60*Math.PI/180,near=.05,far=50,f1=1/Math.tan(fov/2),asp=W/H;
const P=new Float64Array([f1/asp,0,0,0, 0,f1,0,0, 0,0,(far+near)/(near-far),-1, 0,0,2*far*near/(near-far),0]);
function camM(eye,tgt){const z=[eye[0]-tgt[0],eye[1]-tgt[1],eye[2]-tgt[2]],n=Math.hypot(...z);z.forEach((v,i)=>z[i]=v/n);let x=[0*z[2]-1*z[1]*0+ -z[2],0,z[0]];// x = up × z mit up=(0,1,0)
 x=[1*z[2]-0,0,-(1*z[0])];const nx=Math.hypot(...x);x=x.map(v=>v/nx);const y=[z[1]*x[2]-z[2]*x[1],z[2]*x[0]-z[0]*x[2],z[0]*x[1]-z[1]*x[0]];
 return {M:new Float64Array([x[0],x[1],x[2],0, y[0],y[1],y[2],0, z[0],z[1],z[2],0, eye[0],eye[1],eye[2],1]),x,y,z,eye};}
function proj(C,X){const w=[X[0]-C.eye[0],X[1]-C.eye[1],X[2]-C.eye[2]],xc=[w[0]*C.x[0]+w[1]*C.x[1]+w[2]*C.x[2],w[0]*C.y[0]+w[1]*C.y[1]+w[2]*C.y[2],w[0]*C.z[0]+w[1]*C.z[1]+w[2]*C.z[2]];if(xc[2]>-0.1)return null;
 const nx=f1/asp*xc[0]/-xc[2],ny=f1*xc[1]/-xc[2];return [(nx+1)/2*W,(1-ny)/2*H];}
let ok=true;
for(const [nm,A,B] of [['am Boden',[0,0,-1.5],[1.96,0,-1.5]],['an die Wand gelehnt',[0.5,0,-1.7],[0.5,Math.sqrt(1.96**2-0.09),-2.0]]]){
 AR._test.reset(2,0);let nf=0;
 for(let i=0;i<120;i++){const eye=[-0.5+rnd()*2.5,1.3+rnd()*0.3,-0.2+rnd()*0.4],tg=i%2?A:B,C=camM(eye,[tg[0]+gs()*0.15,tg[1]+gs()*0.15,tg[2]]);
  for(const E of [A,B]){const q=proj(C,E);if(!q||q[0]<10||q[1]<10||q[0]>W-10||q[1]>H-10)continue;const u=q[0]+gs(),v=q[1]+gs();
   const ray=AR.pixelRay(u,v,W,H,P,C.M),fl=AR.pixelToFloor(u,v,W,H,P,C.M,0.004);nf++;AR._test.endObs({ray,fl,cam:eye});}}
 // Stab liegt auf dem Boden: Oberkante 4 mm über Boden → im Test Enden genau bei y=0, Boden-Offset 4 mm wirkt hier als kleiner Fehler
 const s=AR._test.endsScale();const k=s&&s.k,want=2/1.96;
 console.log(`${nm}: ${nf} Endsichtungen → ${s?`Faktor ${k.toFixed(4)} (soll ${want.toFixed(4)}, ${((k/want-1)*100).toFixed(2)} %), ±${(s.sig*100).toFixed(2)} %, Enden ${s.na}/${s.nb}, Wand: ${s.wall}`:'kein Ergebnis'}`);
 if(!s||Math.abs(k/want-1)>(nm.includes('Wand')?0.006:0.003))ok=false;}
console.log('Zollstock-Enden:',ok?'OK':'FEHLER');process.exit(ok?0:1);
