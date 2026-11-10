// Test: Fensterecken in Fotos antippen (projiziert + Tippfehler) -> Schnitt mit Wandebene -> Lage/Breite/Höhe/BRH
const BA=require('../ba.js'),PG=require('../pg.js'),AG=require('../ausgleich.js'),g=AG.gauss;
if(process.env.SEED){let s=+process.env.SEED;Math.random=()=>{s=(s*16807)%2147483647;return s/2147483647;};}
const src=require('fs').readFileSync(__dirname+'/test_pg_geo.js','utf8').split('// 1) L-Raum')[0].replace(/^const BA=.*$/m,'').replace(/^if\(process.env.SEED\).*$/m,'');
eval(src.replace(/^const /gm,'var '));
const R1=[{poly:[[0,0],[4.2,0],[4.2,3.6],[0,3.6]]}],floor=[[0.8,1.3],[3.8,1.3],[2.1,2.6],[2.1,0.7]];
const M=scene(R1,floor),F=frames(M,R1,[[[0.5,0.5],0.7],[[3.7,0.5],2.4],[[3.7,3.1],-2.4],[[0.5,3.1],-0.7],[[2.1,1.8],-1.57],[[2.1,1.8],1.57]]);
const rec=PG.reconstruct(F,{W,H,size:MS,scaleDist:3,sigPx:.3});const w=PG.walls(rec,{ids:new Set(R1[0].ids)});
console.log('rms',rec.res.rms.toFixed(2),'Wände',w.lengths.map(v=>v.toFixed(4)).join(' '));
// Fenster auf Wand y=3.6 (Wand 3 im Soll: von (4.2,3.6) nach (0,3.6)): x 1.3..2.5, z 0.9..2.3 ; Tür auf Wand x=4.2: y 0.6..1.5, z 0..2.1
const wins=[{name:'Fenster',A:[2.5,3.6,0.9],Bp:[1.3,3.6,2.3],soll:{w:1.2,h:1.4,brh:0.9}},{name:'Tür',A:[4.2,0.6,0.0],Bp:[4.2,1.5,2.1],soll:{w:0.9,h:2.1,brh:0}}];
// Kamera-Posen der Rekonstruktion liegen im Rekonstruktions-System (Ursprung Marke 0, x Richtung Marke 1) -> Soll-Punkte transformieren
const o=floor[0];const T=p=>[p[0]-o[0],p[1]-o[1],p[2]];
wins.forEach(win=>{
 // passende Wand: Linie mit kleinstem Abstand zu den Punkten
 const A=T(win.A),Bq=T(win.Bp);let wi=-1,bd=1e9;w.lines.forEach((l,i)=>{const n=[-l.d[1],l.d[0]];const dd=Math.abs((A[0]-l.mu[0])*n[0]+(A[1]-l.mu[1])*n[1])+Math.abs((Bq[0]-l.mu[0])*n[0]+(Bq[1]-l.mu[1])*n[1]);if(dd<bd){bd=dd;wi=i;}});
 const cand=PG.framesForWall(rec,F,w,wi).slice(0,3);const res=[];
 cand.forEach(({ci})=>{const cam=rec.res.cams[ci],it2=rec.res.it;const uvA=BA.project(it2,cam,A),uvB=BA.project(it2,cam,Bq);if(uvA[2]<0||uvB[2]<0)return;
  const X1=PG.rayToWall(rec,ci,[uvA[0]+g()*0.7,uvA[1]+g()*0.7],w.lines[wi]),X2=PG.rayToWall(rec,ci,[uvB[0]+g()*0.7,uvB[1]+g()*0.7],w.lines[wi]);if(!X1||!X2)return;res.push(PG.opening(w,wi,X1,X2));});
 res.forEach(r=>console.log(`${win.name} (Wand ${wi+1}): Breite ${(r.w*1000).toFixed(1)} (soll ${win.soll.w*1000}), Höhe ${(r.h*1000).toFixed(1)} (soll ${win.soll.h*1000}), BRH ${(r.brh*1000).toFixed(1)} (soll ${win.soll.brh*1000}) mm, Typ ${r.type}`));});
