// Ende-zu-Ende: synthetische Videobilder (Raytracing) -> Markenerkennung -> Bündelausgleich -> Wände -> Raummaße
const BA=require('../ba.js'),MK=require('../marker.js'),PG=require('../pg.js'),AG=require('../ausgleich.js'),g=AG.gauss;
const L=+(process.env.RL||4.2),B=+(process.env.RB||3.6),HZ=2.6,MS=0.16,W=+(process.env.IW||1920),H=Math.round(W*9/16),NF=+(process.env.NF||60);
const it=[0.78*W,W/2+2,H/2-3,0.02,-0.005];
// Szene: Blätter (A4) mit Marke; u rechts, v unten (wie gedruckt), v×u zeigt zum Betrachter
const sheets=[];const add=(id,c,u,v)=>sheets.push({id,c,u,v});
add(0,[0.9,1.3,0],[1,0,0],[0,-1,0]);add(1,[3.9,1.3,0],[1,0,0],[0,-1,0]);add(2,[2.2,2.6,0],[1,0,0],[0,-1,0]);add(3,[2.2,0.6,0],[1,0,0],[0,-1,0]);
let id=4;const walls=[[[0,0],[L,0]],[[L,0],[L,B]],[[L,B],[0,B]],[[0,B],[0,0]]];
walls.forEach(([a,b])=>{const d=[b[0]-a[0],b[1]-a[1]],n=Math.hypot(...d),u=[-d[0]/n,-d[1]/n,0];for(let k=0;k<4;k++){const t=.12+.76*k/3,z=[1.2,1.7,.8,1.4][k];add(id++,[a[0]+d[0]*t,a[1]+d[1]*t,z],u,[0,0,-1]);}});
// Wandmarken 1 mm vor der Wand (Papier/Kleber) – realistischer Versatz
sheets.forEach(s=>{if(s.id>=4){const n=[s.v[1]*s.u[2]-s.v[2]*s.u[1],s.v[2]*s.u[0]-s.v[0]*s.u[2],s.v[0]*s.u[1]-s.v[1]*s.u[0]];s.c=s.c.map((v,q)=>v+n[q]*0.0003);}});
function shade(P,surf){for(const s of sheets){const d=[P[0]-s.c[0],P[1]-s.c[1],P[2]-s.c[2]],nn=[s.u[1]*s.v[2]-s.u[2]*s.v[1],s.u[2]*s.v[0]-s.u[0]*s.v[2],s.u[0]*s.v[1]-s.u[1]*s.v[0]];
  if(Math.abs(d[0]*nn[0]+d[1]*nn[1]+d[2]*nn[2])>0.002)continue;const a=d[0]*s.u[0]+d[1]*s.u[1]+d[2]*s.u[2],b=d[0]*s.v[0]+d[1]*s.v[1]+d[2]*s.v[2];
  if(Math.abs(a)>0.105||Math.abs(b)>0.1485)continue;if(Math.abs(a)>=MS/2||Math.abs(b)>=MS/2)return 225;
  const G=MK.G,k=Math.floor((a+MS/2)/(MS/G)),r=Math.floor((b+MS/2)/(MS/G));if(r===0||r===G-1||k===0||k===G-1)return 25;return (MK.DICT[s.id]>>>((r-1)*MK.N+(k-1))&1)?25:225;}
 return surf===4?95+15*Math.sin(P[0]*23)*Math.sin(P[1]*19):surf===5?200:160+8*Math.sin(P[2]*7);}
function render(cam,w=0){const R0=BA.rodr(cam),C=[0,1,2].map(q=>-(R0[q]*cam[3]+R0[3+q]*cam[4]+R0[6+q]*cam[5])),img=new Float32Array(W*H);let R=R0;
 for(let y=0;y<H;y++){if(w){const a=w*(y-H/2)/H*0.03,ca=Math.cos(a),sa=Math.sin(a),Q=[ca,0,sa,0,1,0,-sa,0,ca];R=[0,1,2,3,4,5,6,7,8].map(k=>{const i=Math.floor(k/3),j=k%3;return Q[3*i]*R0[j]+Q[3*i+1]*R0[3+j]+Q[3*i+2]*R0[6+j];});}
 for(let x=0;x<W;x++){let acc=0;for(const [ox,oy] of [[.25,.25],[.75,.25],[.25,.75],[.75,.75]]){
  const xd=(x+ox-it[1])/it[0],yd=(y+oy-it[2])/it[0];let xu=xd,yu=yd;for(let k=0;k<6;k++){const r2=xu*xu+yu*yu,d=1+it[3]*r2+it[4]*r2*r2;xu=xd/d;yu=yd/d;}
  const dir=[R[0]*xu+R[3]*yu+R[6],R[1]*xu+R[4]*yu+R[7],R[2]*xu+R[5]*yu+R[8]];let tb=1e9,sf=-1;
  [[0,0],[0,L],[1,0],[1,B],[2,0],[2,HZ]].forEach(([ax,v],k)=>{if(Math.abs(dir[ax])<1e-12)return;const t=(v-C[ax])/dir[ax];if(t>1e-6&&t<tb){tb=t;sf=k;}});
  const P=[C[0]+dir[0]*tb,C[1]+dir[1]*tb,C[2]+dir[2]*tb];acc+=shade(P,sf);}img[y*W+x]=acc/4;}}
 // Unschärfe (Optik/Bewegung) + Rauschen
 const o=new Float32Array(W*H),bl=+(process.env.BLUR||1);for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){let s=0;for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++)s+=img[(y+j)*W+x+i]*(i||j?bl*0.1:1);o[y*W+x]=s/(1+8*bl*0.1)+g()*2;}return o;}
function look(C,T){let z=T.map((v,i)=>v-C[i]);const nz=Math.hypot(...z);z=z.map(v=>v/nz);let x=[z[1],-z[0],0];const nx=Math.hypot(...x);x=x.map(v=>v/nx);const y=[z[1]*x[2]-z[2]*x[1],z[2]*x[0]-z[0]*x[2],z[0]*x[1]-z[1]*x[0]];const R=[...x,...y,...z];return [...BA.rotvec(R),-(R[0]*C[0]+R[1]*C[1]+R[2]*C[2]),-(R[3]*C[0]+R[4]*C[1]+R[5]*C[2]),-(R[6]*C[0]+R[7]*C[1]+R[8]*C[2])];}
const frames=[];let cErr=[],t0=Date.now();const CF=process.env.CACHE,fs=require('fs');let cached=CF&&fs.existsSync(CF)?JSON.parse(fs.readFileSync(CF)):null;const truthCams=[];
for(let i=0;i<NF;i++){const k=Math.floor(4*i/NF),f2=(4*i/NF)%1,cor=[[.5,.5],[L-.5,.5],[L-.5,B-.5],[.5,B-.5]][k],base=Math.atan2(B/2-cor[1],L/2-cor[0]),a=base+(f2-.5)*1.9;
 const C=[cor[0],cor[1],1.5],T=[C[0]+3*Math.cos(a),C[1]+3*Math.sin(a),0.6+0.8*Math.sin(2*Math.PI*f2*2)],cam=look(C,T);truthCams.push(cam);if(cached){frames.push(cached[i]);continue;}const img=render(cam,(+(process.env.PAN||0))*Math.PI/180*(i%2?1:-1)),dets=MK.detect(img,W,H);if(process.env.DUMP){const b=Buffer.alloc(W*H);for(let q=0;q<W*H;q++)b[q]=Math.max(0,Math.min(255,img[q]));fs.writeFileSync(`${process.env.DUMP}/f${String(i).padStart(3,'0')}.pgm`,Buffer.concat([Buffer.from(`P5 ${W} ${H} 255\n`),b]));}
 dets.forEach(d=>{const s=sheets.find(q=>q.id===d.id);if(!s)return;PG.local(MS).forEach((l,q)=>{const X=[0,1,2].map(m=>s.c[m]+s.u[m]*l[0]+s.v[m]*l[1]),p=BA.project(it,cam,X),e=Math.hypot(p[0]-d.c[q][0],p[1]-d.c[q][1]);cErr.push(e);if(process.env.DBG&&e>3)console.log("Bild",i,"Marke",d.id,"Ecke",q,"Fehler",e.toFixed(1),"erkannt",d.c[q].map(v=>v.toFixed(0)),"soll",p.slice(0,2).map(v=>v.toFixed(0)));});});
 frames.push({dets});}
if(CF&&!cached)fs.writeFileSync(CF,JSON.stringify(frames));if(!cErr.length)cErr=[0];cErr.sort((a,b)=>a-b);const nd=frames.reduce((s,f)=>s+f.dets.length,0);
console.log(`Render+Erkennung ${NF} Bilder ${W}x${H}: ${((Date.now()-t0)/1000).toFixed(0)} s, ${ (nd/NF).toFixed(1)} Marken/Bild, Eckfehler median ${cErr[cErr.length>>1].toFixed(3)} px, 95% ${cErr[Math.floor(cErr.length*.95)].toFixed(3)} px, max ${cErr[cErr.length-1].toFixed(2)}`);
t0=Date.now();const rec=PG.reconstruct(frames,{W,H,size:MS,scaleDist:3.0,sigPx:0.3,rs:!!process.env.RSM,log:process.env.LOG?console.log:undefined});
if(!rec.ok){console.log(rec.msg);process.exit(1);}
console.log('Rek.: Bilder',rec.nImg,'rms',rec.res.rms.toFixed(3),'f',rec.res.it[0].toFixed(1),'Marken',rec.ids.join(','));const cnts={};frames.forEach(f=>f.dets.forEach(d=>cnts[d.id]=(cnts[d.id]||0)+1));console.log('Sichtungen je Marke',JSON.stringify(cnts));
const wl=PG.walls(rec);if(!wl.ok){console.log(wl.msg);process.exit(1);}
const T=[L,B,L,B],off=wl.lengths.map((v,i)=>v);// Reihenfolge der Wände unbekannt -> gegen passende Soll-Länge vergleichen
console.log(`Ausgleich ${((Date.now()-t0)/1000).toFixed(1)} s: ${rec.nImg} Bilder, rms ${rec.res.rms.toFixed(3)} px, f ${rec.res.it[0].toFixed(1)} (soll ${it[0]}), k1 ${rec.res.it[3].toFixed(4)} (soll ${it[3]}), entfernt ${rec.dropped}`);
wl.lengths.forEach((v,i)=>{const soll=Math.abs(v-L)<Math.abs(v-B)?L:B;console.log(`Wand ${i+1} (Marken ${wl.groups[i].join(',')}): ${v.toFixed(4)} m, soll ${soll} → Fehler ${((v-soll)*1000).toFixed(2)} mm, σ ${(wl.sigma[i]*1000).toFixed(2)} mm`);});
