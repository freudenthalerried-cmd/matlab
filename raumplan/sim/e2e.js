// Ende-zu-Ende-Test im Browser: synthetisches Foto rendern -> Referenz + Ecken (mit Eckenfang) -> Raum -> Maßband -> Ausgleich
const {chromium}=require(process.env.NP+'/playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:+(process.env.VW||1100),height:900}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>m.type()=='error'&&errs.push(m.text()));
await p.goto('file://'+process.cwd()+'/index.html');
const out=await p.evaluate(()=>{
 const W=4000,H=3000,f=W/2/Math.tan(35*Math.PI/180),pos=[2.1,-2.4,1.6],look=[2.1,2.6,0];
 let z=look.map((v,i)=>v-pos[i]);const nz=Math.hypot(...z);z=z.map(v=>v/nz);let x=[z[1],-z[0],0];const nx=Math.hypot(...x);x=x.map(v=>v/nx);
 const y=[z[1]*x[2]-z[2]*x[1],z[2]*x[0]-z[0]*x[2],z[0]*x[1]-z[1]*x[0]];
 const pr=P=>{const d=P.map((v,i)=>v-pos[i]);const c=[x,y,z].map(r=>r[0]*d[0]+r[1]*d[1]+r[2]*d[2]);return [W/2+f*c[0]/c[2],H/2+f*c[1]/c[2]];};
 const ROOM=[[0,0],[4.2,0],[4.213,3.604],[-0.018,3.592]]; // Altbau, leicht schief
 const c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d');
 g.fillStyle='#b9ae95';g.fillRect(0,0,W,H);
 const poly=(pts,col)=>{g.fillStyle=col;g.beginPath();pts.map(p=>pr([p[0],p[1],0])).forEach((q,i)=>i?g.lineTo(...q):g.moveTo(...q));g.closePath();g.fill();};
 poly(ROOM,'#dcdcd6');
 const tape=(a,b,w=.05)=>{const d=[b[0]-a[0],b[1]-a[1]],L=Math.hypot(...d),n=[-d[1]/L*w/2,d[0]/L*w/2];poly([[a[0]+n[0],a[1]+n[1]],[b[0]+n[0],b[1]+n[1]],[b[0]-n[0],b[1]-n[1]],[a[0]-n[0],a[1]-n[1]]],'#303848');};
 const cross=(X,Y,s=.08)=>{poly([[X-.1,Y-.14],[X+.1,Y-.14],[X+.1,Y+.14],[X-.1,Y+.14]],'#fafafa');poly([[X,Y],[X+s,Y],[X+s,Y+s],[X,Y+s]],'#111');poly([[X,Y],[X-s,Y],[X-s,Y-s],[X,Y-s]],'#111');}; // gedruckte Zielmarke (Schachbrett-X)
 const REF=[[1.1,1.3],[3.1,1.3],[3.1,2.3],[1.1,2.3]];REF.forEach(q=>cross(...q));
 const EXTRA=[[1.6,1.3],[2.1,1.3],[2.6,1.3],[1.6,2.3],[2.1,2.3],[2.6,2.3],[1.1,1.8],[3.1,1.8]];EXTRA.forEach(q=>cross(...q,.05));
 addSnap(c,W,H,'synth');
 const G=AG.gauss, noisy=q=>[q[0]+G()*1.5,q[1]+G()*1.5];
 cur.ref=REF.map(q=>snapTo(cur,noisy(pr([...q,0]))));
 cur.refx=EXTRA.map(q=>({p:snapTo(cur,noisy(pr([...q,0]))),w:[q[0]-1.1,q[1]-1.3]}));
 const refErr=cur.ref.concat(cur.refx.map(e=>e.p)).map((q,i)=>{const t=pr([...REF.concat(EXTRA)[i],0]);return Math.hypot(q[0]-t[0],q[1]-t[1]);});
 cur.pts=ROOM.map(q=>snapTo(cur,noisy(pr([...q,0]))));
 const ptErr=cur.pts.map((q,i)=>{const t=pr([...ROOM[i],0]);return Math.hypot(q[0]-t[0],q[1]-t[1]);});
 const inImg=ROOM.every(q=>{const t=pr([...q,0]);return t[0]>0&&t[0]<W&&t[1]>0&&t[1]<H;});
 const R=measure(cur), T=ROOM.map((q,i)=>Math.hypot(ROOM[(i+1)%4][0]-q[0],ROOM[(i+1)%4][1]-q[1]));
 const fotoErr=R.d.map((v,i)=>((v-T[i])*1000).toFixed(1)), fotoSig=R.sd.map(v=>(v*1000).toFixed(1));
 window.prompt=()=> 'Wohnen'; document.querySelector('#toRoom').click();
 const r=S.rooms[S.rooms.length-1];
 // Maßband: 4 Wände ±1,5 mm + 2 Eckwinkel über Sehne (1,5 m)
 T.forEach((L,i)=>r.obs.push({typ:'wand',i,v:+(L+G()*0.0015).toFixed(4),s:0.0015}));
 [0,1].forEach(i=>{const th=AG.cornerAngle(ROOM.flat(),i,4),c2=Math.sqrt(2*1.5*1.5*(1-Math.cos(th)));r.obs.push({typ:'sehne',i,a:1.5,b:1.5,c:+(c2+G()*0.0015).toFixed(4),s:0.0015});});
 doAdjust(r); roomPanel(); renderPlan(true);
 const gg=geo(r), finErr=gg.E.map((e,i)=>((e.L-T[i])*1000).toFixed(1));
 return {inImg,refErr:refErr.map(v=>v.toFixed(2)).join(' '),ptErr:ptErr.map(v=>v.toFixed(2)).join(' '),fotoErr,fotoSig,finErr,wallSig:r.adj.wallSigma.map(v=>(v*1000).toFixed(1)),warn:r.adj.warn,s0:r.adj.s0};
});
console.log(JSON.stringify(out,null,1));
await p.click('nav button[data-t=plan]');await p.waitForTimeout(300);await p.evaluate(()=>{selRoom=S.rooms.length-1;roomPanel();renderPlan(true);});
await p.screenshot({path:process.env.SP+'/e2e_plan.png',fullPage:true});
await p.click('nav button[data-t=mess]');await p.waitForTimeout(300);await p.screenshot({path:process.env.SP+'/e2e_mess.png'});
console.log('errs',errs);await b.close();})();
