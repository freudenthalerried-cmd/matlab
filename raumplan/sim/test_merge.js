// Mehrere Fotoserien zu einem Gesamtplan: Verbindungsmarken im Türbereich -> starre 2D-Transformation
if(process.env.SEED){let s=+process.env.SEED;Math.random=()=>{s=(s*16807)%2147483647;return s/2147483647;};}
const src=require('fs').readFileSync(__dirname+'/test_pg_geo.js','utf8').split('// 1) L-Raum')[0].replace(/^if\(process.env.SEED\).*$/m,'');
eval(src.replace(/^const /gm,'var '));
const R2=[{poly:[[0,0],[4.2,0],[4.2,3.6],[0,3.6]]},{poly:[[4.32,0],[7.32,0],[7.32,3.6],[4.32,3.6]]}],door={xs:[4.2,4.32],y0:1.4,y1:2.3};
const floorA=[[0.8,1.3],[3.8,1.3],[2.1,2.6],[2.1,0.7]],floorB=[[5.0,0.8],[6.9,2.7],[5.2,2.9],[6.8,0.6]]; // Maßband im Raum 2 schräg
const conn=[[3.95,1.85],[4.26,1.6],[4.6,2.05]].map((c,k)=>({id:60+k,c:[c[0],c[1],0],u:[1,0,0],v:[0,-1,0],room:-1}));
const M1=scene(R2,floorA).concat(conn),M2=scene(R2,floorB).concat(conn);
const st1=[[[0.5,0.5],0.7],[[3.7,0.5],2.4],[[3.7,3.1],-2.4],[[0.5,3.1],-0.7],[[3.4,1.85],0.1],[[2.5,1.8],0]],st2=[[[4.8,0.5],0.9],[[6.8,0.5],2.2],[[6.8,3.1],-2.2],[[4.8,3.1],-0.9],[[5.1,1.85],Math.PI-0.1],[[6.0,1.8],Math.PI]];
const F1=frames(M1,R2,st1,door),F2=frames(M2,R2,st2,door);
const d=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
const r1=PG.reconstruct(F1,{W,H,size:MS,scaleDist:d(floorA[0],floorA[1]),sigPx:.3}),r2=PG.reconstruct(F2,{W,H,size:MS,scaleDist:d(floorB[0],floorB[1]),sigPx:.3});
console.log('Serie 1: rms',r1.res.rms.toFixed(2),'| Serie 2: rms',r2.res.rms.toFixed(2));
const w1=PG.walls(r1,{ids:new Set(R2[0].ids)}),w2=PG.walls(r2,{ids:new Set(R2[1].ids)});
const T=PG.alignTo(PG.markerMap(r1),PG.markerMap(r2));
if(!T){console.log('keine gemeinsamen Marken');process.exit(1);}
console.log(`Verbindung über Marken ${T.ids.join(',')}: Passfehler rms ${(T.rms*1000).toFixed(2)} mm, max ${(T.max*1000).toFixed(2)} mm, Drehung ${(T.th*180/Math.PI).toFixed(3)}°`);
// Soll: Plan-System = Serie 1 (Ursprung floorA[0], x-Achse zu floorA[1] -> achsparallel)
const toPlan=p=>[p[0]-floorA[0][0],p[1]-floorA[0][1]];
const P2=w2.poly.map(T.f),S2=R2[1].poly.map(toPlan),S1=R2[0].poly.map(toPlan);
const err=S2.map(t=>Math.min(...P2.map(p=>d(p,t))));console.log('Raum 2 Ecken im Gesamtplan, Abweichung mm:',err.map(e=>(e*1000).toFixed(1)).join(' '));
const err1=S1.map(t=>Math.min(...w1.poly.map(p=>d(p,t))));console.log('Raum 1 Ecken, Abweichung mm:',err1.map(e=>(e*1000).toFixed(1)).join(' '));
const xr=Math.max(...w1.poly.map(p=>p[0])),xl=Math.min(...P2.map(p=>p[0]));console.log('Innenwandstärke aus Zusammenführung:',((xl-xr)*1000).toFixed(1),'mm (soll 120)');
