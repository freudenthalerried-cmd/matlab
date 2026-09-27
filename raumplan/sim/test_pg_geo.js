// Schnelltest Rekonstruktion ohne Rendern: Markenecken projiziert (+Rauschen, Verdeckung durch Wände) -> PG.reconstruct/walls
if(process.env.SEED){let s=+process.env.SEED;Math.random=()=>{s=(s*16807)%2147483647;return s/2147483647;};}
const BA=require('../ba.js'),PG=require('../pg.js'),AG=require('../ausgleich.js'),g=AG.gauss;
const W=1920,H=1080,it=[1500,W/2+2,H/2-3,0.02,-0.005],MS=0.16,SP=+(process.env.SPX||0.25);
function look(C,T){let z=T.map((v,i)=>v-C[i]);const nz=Math.hypot(...z);z=z.map(v=>v/nz);let x=[z[1],-z[0],0];const nx=Math.hypot(...x);x=x.map(v=>v/nx);const y=[z[1]*x[2]-z[2]*x[1],z[2]*x[0]-z[0]*x[2],z[0]*x[1]-z[1]*x[0]];const R=[...x,...y,...z];return [...BA.rotvec(R),-(R[0]*C[0]+R[1]*C[1]+R[2]*C[2]),-(R[3]*C[0]+R[4]*C[1]+R[5]*C[2]),-(R[6]*C[0]+R[7]*C[1]+R[8]*C[2])];}
const segX=(a,b,c,d)=>{const cr=(p,q,r)=>(q[0]-p[0])*(r[1]-p[1])-(q[1]-p[1])*(r[0]-p[0]);return cr(a,b,c)*cr(a,b,d)<0&&cr(c,d,a)*cr(c,d,b)<0;};
// rooms: [{poly:[[x,y]..] (CCW), perWall}], walls als Blockaden (alle Raumkanten)
function scene(rooms,floor){const M=[];let id=4;floor.forEach((c,k)=>M.push({id:k,c:[c[0],c[1],0],u:[1,0,0],v:[0,-1,0],room:-1}));
 rooms.forEach((r,ri)=>{r.ids=[];const n=r.poly.length;for(let i=0;i<n;i++){const a=r.poly[i],b=r.poly[(i+1)%n],d=[b[0]-a[0],b[1]-a[1]],L=Math.hypot(...d);const k=Math.max(2,Math.round(L/1.1));
  for(let j=0;j<k;j++){const t=(j+.5)/k,z=[1.2,1.7,.9,1.45][j%4];const nin=[-d[1]/L,d[0]/L];M.push({id,c:[a[0]+d[0]*t+nin[0]*3e-4,a[1]+d[1]*t+nin[1]*3e-4,z],u:[-d[0]/L,-d[1]/L,0],v:[0,0,-1],room:ri,nin});r.ids.push(id++);}}});
 return M;}
function frames(M,rooms,stations,door){let walls=rooms.flatMap(r=>r.poly.map((a,i)=>[a,r.poly[(i+1)%r.poly.length]]));
 if(door)walls=walls.flatMap(([a,b])=>{if(Math.abs(a[0]-b[0])<1e-9&&door.xs.some(x=>Math.abs(a[0]-x)<1e-9)){const y0=Math.min(a[1],b[1]),y1=Math.max(a[1],b[1]);return [[[a[0],y0],[a[0],door.y0]],[[a[0],door.y1],[a[0],y1]]];}return [[a,b]];});const F=[],cams=[];
 stations.forEach(([C2,base])=>{const C=[C2[0],C2[1],1.5];for(let k=0;k<10;k++){const a=base+(k/9-.5)*1.9,T=[C[0]+3*Math.cos(a),C[1]+3*Math.sin(a),[.5,1.2,.9,1.6][k%4]],cam=look(C,T);cams.push(cam);const dets=[];
  M.forEach(m=>{const X=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([p,q])=>[0,1,2].map(j=>m.c[j]+MS/2*(p*m.u[j]+q*m.v[j]))),uv=X.map(x=>BA.project(it,cam,x));
   if(uv.some(p=>p[2]<0.3||p[0]<5||p[0]>W-5||p[1]<5||p[1]>H-5))return;
   const toC=[C[0]-m.c[0],C[1]-m.c[1],C[2]-m.c[2]],nv=m.room<0?[0,0,1]:[m.nin[0],m.nin[1],0],cs=(toC[0]*nv[0]+toC[1]*nv[1]+toC[2]*nv[2])/Math.hypot(...toC);if(cs<0.3)return;
   if(m.room>=0&&walls.some(w=>segX([C[0],C[1]],[m.c[0]-m.nin[0]*.01+m.nin[0]*.02,m.c[1]+m.nin[1]*.02],w[0],w[1])))return;
   dets.push({id:m.id,c:uv.map(p=>[p[0]+g()*SP,p[1]+g()*SP])});});F.push({t:F.length,dets});}});return F;}
function check(name,rooms,floor,stations,door){const M=scene(rooms,floor),F=frames(M,rooms,stations,door),nd=F.reduce((s,f)=>s+f.dets.length,0);
 const rec=PG.reconstruct(F,{W,H,size:MS,scaleDist:Math.hypot(floor[1][0]-floor[0][0],floor[1][1]-floor[0][1]),sigPx:0.3,scaleDist2:process.env.S2?Math.hypot(floor[3][0]-floor[2][0],floor[3][1]-floor[2][1]):0,log:process.env.LOG?(t=>{if(!/Iteration/.test(t))console.log('  >',t)}):undefined});if(!rec.ok){console.log(name,rec.msg);return;}
 console.log(`${name}: ${F.length} Bilder, ${(nd/F.length).toFixed(1)} Marken/Bild, rms ${rec.res.rms.toFixed(2)} px`);
 rooms.forEach((r,ri)=>{const w=PG.walls(rec,{ids:new Set(r.ids)});if(!w.ok){console.log('  ',w.msg);return;}
  const T=r.poly.map((a,i)=>Math.hypot(r.poly[(i+1)%r.poly.length][0]-a[0],r.poly[(i+1)%r.poly.length][1]-a[1]));
  const err=w.lengths.map(L=>{const t=T.reduce((b,x)=>Math.abs(x-L)<Math.abs(b-L)?x:b);return ((L-t)*1000).toFixed(1);});
  if(process.env.GRP)console.log('   Gruppen',JSON.stringify(w.groups),w.warn);console.log(`   Raum ${ri+1}: ${w.lengths.length}/${T.length} Wände, Fehler mm: ${err.join(' ')} | σ mm: ${w.sigma.map(v=>(v*1000).toFixed(1)).join(' ')}`);});
 // Wandstärke zwischen Raum 1 und 2 (falls vorhanden)
 return rec;}
// 1) L-Raum
const Lr=[{poly:[[0,0],[5,0],[5,2.4],[2.6,2.4],[2.6,4.2],[0,4.2]]}];
check('L-Raum',Lr,[[0.8,0.8],[3.8,0.8],[1.2,3.2],[4,1.8]],[[[0.5,0.5],Math.atan2(1.5,2)],[[4.5,0.5],Math.atan2(1,-2)],[[4.5,1.9],Math.PI],[[2.1,3.7],-Math.PI/2],[[0.5,3.7],-1.0],[[1.3,1.2],0.8]]);
// 2) Zwei Räume mit Tür (Innenwand 12 cm)
const R2=[{poly:[[0,0],[4.2,0],[4.2,3.6],[0,3.6]]},{poly:[[4.32,0],[7.32,0],[7.32,3.6],[4.32,3.6]]}];
const rec=check('2 Räume, Innenwand 12 cm',R2,[[0.8,1.3],[3.8,1.3],[4.8,2.6],[7.0,1.0]],[[[0.5,0.5],0.7],[[3.7,0.5],2.4],[[3.7,3.1],-2.4],[[0.5,3.1],-0.7],[[4.8,0.5],0.9],[[6.8,0.5],2.2],[[6.8,3.1],-2.2],[[4.8,3.1],-0.9],[[3.9,1.8],0],[[4.6,1.8],Math.PI],[[3.4,1.85],0.1],[[5.1,1.85],Math.PI-0.1]],{xs:[4.2,4.32],y0:1.4,y1:2.3});
if(rec&&rec.ok){const a0=PG.walls(rec,{ids:new Set(R2[0].ids)}),b0=PG.walls(rec,{ids:new Set(R2[1].ids)});if(!a0.ok||!b0.ok)process.exit(0);const a=PG.walls(rec,{ids:new Set(R2[0].ids)}),b=PG.walls(rec,{ids:new Set(R2[1].ids)});
 const xr=a.poly.map(p=>p[0]),xl=b.poly.map(p=>p[0]);console.log('   Innenwandstärke (aus Rekonstruktion):',((Math.min(...xl)-Math.max(...xr))*1000).toFixed(1),'mm (soll 120)');}
