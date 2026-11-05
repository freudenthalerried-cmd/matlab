// Test Bodenentzerrung: synthetische Kamera (wie genauigkeit.py), Varianten ohne/mit Maßband-Zusatzpunkten und k1
const AG=require('../ausgleich.js'), g=AG.gauss;
const ROOM=[[0,0],[4.2,0],[4.2,3.6],[0,3.6]];
function cam(W,H,pos,look=[2.1,2.2,0],hfov=70){const f=W/2/Math.tan(hfov*Math.PI/360);let z=look.map((v,i)=>v-pos[i]);const nz=Math.hypot(...z);z=z.map(v=>v/nz);
 let x=[z[1],-z[0],0];const nx=Math.hypot(...x);x=x.map(v=>v/nx);const y=[z[1]*x[2]-z[2]*x[1],z[2]*x[0]-z[0]*x[2],z[0]*x[1]-z[1]*x[0]];
 return (P,k1)=>{const d=P.map((v,i)=>v-pos[i]);const c=[x,y,z].map(r=>r[0]*d[0]+r[1]*d[1]+r[2]*d[2]);let u=[c[0]/c[2],c[1]/c[2]];
  // Verzeichnung im auf Halbdiagonale normierten Bild (gleiches Modell-Zentrum)
  const s=f/(Math.hypot(W,H)/2);let un=[u[0]*s,u[1]*s];let dd=un.slice();for(let i=0;i<20;i++){const r2=dd[0]**2+dd[1]**2;dd=[un[0]/(1+k1*r2),un[1]/(1+k1*r2)];}un=dd;return [W/2+un[0]/s*f,H/2+un[1]/s*f];};}
const REF=[[1.1,1.3],[3.1,1.3],[3.1,2.3],[1.1,2.3]], TAPE=[];for(let t=.25;t<2;t+=.25)TAPE.push([1.1+t,1.3]);for(let t=.25;t<1;t+=.25)TAPE.push([1.1,1.3+t]);for(let t=.25;t<2;t+=.25)TAPE.push([1.1+t,2.3]);
function run(name,{W=4000,H=3000,click=1.5,extra=false,k1=0,floor=0,frames=1,useK=true}){
 const err=[];for(let n=0;n<400;n++){const est=[];for(let f=0;f<frames;f++){
  const pr=cam(W,H,[2.1+g()*.4,-1.2+g()*.2,1.5+g()*.1]),kk=k1*g(),world=extra?REF.concat(TAPE):REF;
  const img=world.map(p=>pr([p[0]+g()*.001,p[1]+g()*.001,g()*floor],kk).map(v=>v+g()*click));
  const F=AG.fitFloor(img,world,W,H,useK?kk+g()*0.0005:0);const c=ROOM.map(p=>pr([p[0],p[1],g()*floor],kk).map(v=>v+g()*click)).map(F.map);est.push(c);}
  const e=ROOM.map((_,i)=>[0,1].map(k=>est.reduce((s,E)=>s+E[i][k],0)/frames));
  for(let i=0;i<4;i++)err.push(Math.abs(Math.hypot(e[(i+1)%4][0]-e[i][0],e[(i+1)%4][1]-e[i][1])-Math.hypot(ROOM[(i+1)%4][0]-ROOM[i][0],ROOM[(i+1)%4][1]-ROOM[i][1]))*1000);}
 err.sort((a,b)=>a-b);console.log(name.padEnd(58),'median',err[err.length>>1].toFixed(1).padStart(6),' 95%',err[Math.floor(err.length*.95)].toFixed(1).padStart(6));}

run('A Video 1080p, Rechteck 2x1m, Tippen ±1,5px',{W:1920,H:1080,k1:.02,useK:false});
run('B Foto 12MP, Rechteck, ±1,5px, unkalibriert',{k1:.02,useK:false});
run('C + Kamera kalibriert (Lotlinien)',{k1:.02});
run('D + Maßband-Zusatzpunkte',{k1:.02,extra:true});
run('E + Subpixel-Eckenfang ±0,4px',{k1:.02,extra:true,click:.4});
run('F + 3 Fotos gemittelt (Ausgleich)',{k1:.02,extra:true,click:.4,frames:3});
run('G wie F, Altbau-Boden ±2mm uneben',{k1:.02,extra:true,click:.4,frames:3,floor:.002});
run('H Video 4K, sonst wie F',{W:3840,H:2160,k1:.02,extra:true,click:.6,frames:3});
