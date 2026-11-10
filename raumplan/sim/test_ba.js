// Simulation Photogrammetrie mit dem App-Bündelausgleich (ba.js)
const BA=require('../ba.js'),AG=require('../ausgleich.js'),g=AG.gauss;
const L=4.2,B=3.6,W=3840,H=2160,MS=0.16;
function scene(perWall){const M=[];const walls=[[[0,0],[L,0]],[[L,0],[L,B]],[[L,B],[0,B]],[[0,B],[0,0]]];
 walls.forEach(([a,b],w)=>{const d=[(b[0]-a[0]),(b[1]-a[1])],n=Math.hypot(...d);const u=[d[0]/n,d[1]/n,0];
  for(let k=0;k<perWall;k++){const t=.1+.8*k/Math.max(perWall-1,1),z=[1.1,1.7,.7,1.4,.9,1.9][k%6];M.push({c:[a[0]+d[0]*t,a[1]+d[1]*t,z],u,v:[0,0,1],wall:w});}});
 [[.9,1.3,-1],[3.9,1.3,-2],[2.2,2.5,-3],[2.2,.7,-3]].forEach(([x,y,w])=>M.push({c:[x,y,0],u:[1,0,0],v:[0,1,0],wall:w}));
 const P=[],pm=[];M.forEach((m,k)=>[[-1,-1],[1,-1],[1,1],[-1,1]].forEach(([a,b])=>{P.push([0,1,2].map(q=>m.c[q]+MS/2*(a*m.u[q]+b*m.v[q])));pm.push(k);}));return {M,P,pm};}
function lookCam(C,T){let z=T.map((v,i)=>v-C[i]);const nz=Math.hypot(...z);z=z.map(v=>v/nz);let x=[z[1],-z[0],0];const nx=Math.hypot(...x);x=x.map(v=>v/nx);
 const y=[z[1]*x[2]-z[2]*x[1],z[2]*x[0]-z[0]*x[2],z[0]*x[1]-z[1]*x[0]];const R=[...x,...y,...z];const r=BA.rotvec(R);return [...r,-(R[0]*C[0]+R[1]*C[1]+R[2]*C[2]),-(R[3]*C[0]+R[4]*C[1]+R[5]*C[2]),-(R[6]*C[0]+R[7]*C[1]+R[8]*C[2])];}
function run({nf=120,spx=0.15,perWall=5,stape=0.0005,rough=0,f=2900,path='ecken',pan=0,ro=0.03,sel=0}={}){
 const {M,P,pm}=scene(perWall),it=[f,W/2+3,H/2-4,0.03,-0.01],cams=[],obs=[];
 for(let i=0;i<nf;i++){let C,T;
  if(path==='ecken'){ // in jeder Ecke stehen (0,5 m von den Wänden) und über den Raum schwenken, dazwischen weitergehen
   const k=Math.floor(4*i/nf),f2=(4*i/nf)%1,cor=[[.5,.5],[L-.5,.5],[L-.5,B-.5],[.5,B-.5]][k],base=Math.atan2(B/2-cor[1],L/2-cor[0]),a=base+(f2-.5)*1.9;
   C=[cor[0],cor[1],1.5+.1*Math.sin(9*f2)];T=[C[0]+3*Math.cos(a),C[1]+3*Math.sin(a),0.9+0.7*Math.sin(2*Math.PI*f2*2)];}
  else {const a=2*Math.PI*i/nf;C=[L/2+.6*Math.cos(a),B/2+.5*Math.sin(a),1.5];T=[L/2-2.5*Math.cos(a+.25),B/2-2.2*Math.sin(a+.25),0.7+.6*Math.sin(3*a)];}
  const c=lookCam(C,T);cams.push(c);const w=(pan*Math.PI/180)*(i%2?1:-1)*(0.5+Math.random()),wt=(pan*Math.PI/180)*0.3*g();
  const uv=P.map(X=>{let p=BA.project(it,c,X);if(!pan)return p;for(let k=0;k<2;k++){const tau=(p[1]-H/2)/H*ro,a=w*tau,b=wt*tau;const R=BA.rodr(c),xc=[0,1,2].map(q=>R[3*q]*X[0]+R[3*q+1]*X[1]+R[3*q+2]*X[2]+c[3+q]);
   const ca=Math.cos(a),sa=Math.sin(a),x1=[ca*xc[0]+sa*xc[2],xc[1],-sa*xc[0]+ca*xc[2]],cb=Math.cos(b),sb=Math.sin(b),x2=[x1[0],cb*x1[1]-sb*x1[2],sb*x1[1]+cb*x1[2]];
   const x=x2[0]/x2[2],y=x2[1]/x2[2],r2=x*x+y*y,d=1+it[3]*r2+it[4]*r2*r2;p=[it[0]*x*d+it[1],it[0]*y*d+it[2],x2[2]];}return p;});
  if(sel&&Math.abs(w)*180/Math.PI>sel){continue;}
  M.forEach((m,k)=>{const idx=[0,1,2,3].map(q=>4*k+q);if(idx.every(j=>uv[j][2]>.3&&uv[j][0]>15&&uv[j][0]<W-15&&uv[j][1]>15&&uv[j][1]<H-15))idx.forEach(j=>obs.push({c:i,p:j,u:uv[j][0]+g()*spx,v:uv[j][1]+g()*spx,s:spx,tau:(uv[j][1]-H/2)/H}));});}
 const m1=M.length-4,m2=M.length-3,m3=M.length-2,ctr=(Q,m)=>[0,1,2].map(q=>(Q[4*m][q]+Q[4*m+1][q]+Q[4*m+2][q]+Q[4*m+3][q])/4),idx=m=>[4*m,4*m+1,4*m+2,4*m+3];
 const dd=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]),truth=dd(M[m1].c,M[m2].c),meas=truth+g()*stape*Math.SQRT2;
 const cons=[{f:Q=>dd(ctr(Q,m1),ctr(Q,m2)),v:meas,s:stape,idx:[...idx(m1),...idx(m2)]},
  ...[0,1,2].map(q=>({f:Q=>ctr(Q,m1)[q],v:M[m1].c[q],s:1e-6,idx:idx(m1)})),...[1,2].map(q=>({f:Q=>ctr(Q,m2)[q],v:M[m2].c[q],s:1e-6,idx:idx(m2)})),{f:Q=>ctr(Q,m3)[2],v:0,s:1e-6,idx:idx(m3)}];
 const t0=Date.now();
 if(process.env.DBG){const c0=cams.map(c=>c.map((v,q)=>v+g()*(q<3?.02:.05)));let s=0,bad=0;obs.forEach(o=>{const p=BA.project([f*1.06,W/2,H/2,0,0],c0[o.c],P[o.p]);if(p[2]<=0)bad++;s+=(p[0]-o.u)**2+(p[1]-o.v)**2;});console.log('start rms',Math.sqrt(s/obs.length),'behind',bad,'obs',obs.length);}
 const r=BA.solve({it:[f*1.06,W/2,H/2,0,0],cams:cams.map(c=>c.map((v,q)=>v+g()*(q<3?.02:.05))),pts:P.map(p=>p.map(v=>v+g()*.03)),obs,cons},{iters:60,rs:!!process.env.RSM,log:process.env.DBG?(i,c,l)=>console.log(i,c.toExponential(3),l):undefined});
 const Q=r.pts.map((p,j)=>M[pm[j]].wall>=0?[p[0]+g()*rough,p[1]+g()*rough,p[2]]:p);
 const line=(Qq,w)=>{const q=Qq.filter((_,j)=>M[pm[j]].wall===w).map(p=>[p[0],p[1]]),mu=[0,1].map(k=>q.reduce((s,p)=>s+p[k],0)/q.length);let sxx=0,sxy=0,syy=0;q.forEach(p=>{const a=p[0]-mu[0],b=p[1]-mu[1];sxx+=a*a;sxy+=a*b;syy+=b*b;});const th=.5*Math.atan2(2*sxy,sxx-syy);return {mu,d:[Math.cos(th),Math.sin(th)]};};
 const wd=(Qq,a,b)=>{const A=line(Qq,a),Bq=line(Qq,b),n=[-A.d[1],A.d[0]];return Math.abs((Bq.mu[0]-A.mu[0])*n[0]+(Bq.mu[1]-A.mu[1])*n[1]);};
 const e=[wd(Q,0,2)-B,wd(Q,1,3)-L].map(v=>v*1000),sig=[r.sigmaOf(Qq=>wd(Qq,0,2)),r.sigmaOf(Qq=>wd(Qq,1,3))].map(v=>v*1000);
 return {e,sig,rms:r.rms,df:r.it[0]-f,ms:Date.now()-t0,nobs:obs.length/nf/4};}
const cases=process.env.RS?[['Video, Schwenk 10°/s, Readout 30 ms',{pan:10}],['Video, Schwenk 30°/s',{pan:30}],['Fotoserie (ruhig, ±2°/s Zittern)',{pan:2}]]:[['Ecken-Schwenk, 120 Bilder, 5 Marken/Wand, ±0,15 px',{}],['Rundgang Mitte (wie vorher)',{path:'kreis'}],['Ecken-Schwenk, 3 Marken/Wand',{perWall:3}],['4K, 60 Bilder',{nf:60}],['Marken ±0,4 px (Unschärfe/Rolling Shutter)',{spx:.4}],['Altbau: Wand an Marken ±2 mm uneben',{rough:.002}],['Full-HD (≙ ±0,3 px in 4K)',{spx:.3}]];
const N=+(process.argv[2]||5);
for(const [n,kw] of cases){const E=[],S=[];let info;for(let k=0;k<N;k++){const r=run(kw);E.push(...r.e.map(Math.abs));S.push(...r.sig);info=r;}
 E.sort((a,b)=>a-b);console.log(n.padEnd(46),'median',E[E.length>>1].toFixed(2),' max',E[E.length-1].toFixed(2),'mm | σ ber.',(S.reduce((a,b)=>a+b)/S.length).toFixed(2),'mm | rms',info.rms.toFixed(3),'px, Δf',info.df.toFixed(1),',',info.nobs.toFixed(1),'Marken/Bild,',info.ms,'ms');}
