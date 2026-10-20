const AG=require('../ausgleich.js'),g=AG.gauss,d=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
// L-Raum (6 Ecken, eine einspringend), Altbau-Abweichungen
const R=[[0,0],[5.1,0.01],[5.12,2.4],[2.61,2.39],[2.6,4.2],[-0.01,4.21]],n=6;
function trial(start,sl=.0015,useDiag=true){
 const obs=R.map((_,i)=>({typ:'wand',i,v:d(R[i],R[(i+1)%n])+g()*sl,s:sl}));
 if(useDiag){[[0,2],[0,3],[5,3],[1,3]].forEach(([i,j])=>obs.push({typ:'diag',i,j,v:d(R[i],R[j])+g()*.002,s:.002}));}
 else [0,1,2,4,5].forEach(i=>{const th=AG.cornerAngle(R.flat(),i,n),c=Math.sqrt(2*1.5*1.5*(1-Math.cos(th)));obs.push({typ:'sehne',i,a:1.5,b:1.5,c:c+g()*sl,s:sl});});
 const r=AG.adjust(start,obs);if(!r.ok)return {fail:1};
 const t=R.map(p=>[p[0]-R[0][0],p[1]-R[0][1]]),e=r.P.map(p=>[p[0]-r.P[0][0],p[1]-r.P[0][1]]);
 const a=Math.atan2(t[1][1],t[1][0])-Math.atan2(e[1][1],e[1][0]),c=Math.cos(a),s=Math.sin(a);
 return {err:Math.max(...e.map((p,i)=>d([c*p[0]-s*p[1],s*p[0]+c*p[1]],t[i])))*1000,ws:Math.max(...r.wallSigma)*1000,warn:r.warn.length};}
for(const [name,noise,diag] of [['L-Raum Diagonalen, Start ±3cm',.03,true],['L-Raum Diagonalen, Start ±20cm (grobe Skizze)',.2,true],['L-Raum Sehnen, Start ±5cm',.05,false]]){
 const E=[];let fail=0,warn=0;for(let k=0;k<200;k++){const t=trial(R.map(p=>[p[0]+g()*noise,p[1]+g()*noise]),.0015,diag);if(t.fail){fail++;continue;}E.push(t.err);warn+=t.warn;}
 E.sort((a,b)=>a-b);console.log(name.padEnd(46),'median',E[E.length>>1].toFixed(1),'95%',E[Math.floor(E.length*.95)].toFixed(1),'fehlgeschl.',fail,'Warnungen',warn);}
// Start aus Rechteck-Skizze (falsche Topologie-Nähe)
const sk=[[0,0],[5,0],[5,2.5],[2.5,2.5],[2.5,4],[0,4]];console.log('Start = grobe Skizze:',trial(sk).err.toFixed(2),'mm');
