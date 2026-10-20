const AG=require('../ausgleich.js'),g=AG.gauss;
// Linien nahe dem Bildrand im normierten Bild, verzerrt mit k1=0.02 (Modell: undist = d*(1+k1 r²) -> Verzerrung näherungsweise inverses)
const W=4000,H=3000,f=Math.hypot(W,H)/2,K=0.02;
function distort(u,k){let d=u.slice();for(let i=0;i<20;i++){const r2=d[0]**2+d[1]**2;d=[u[0]/(1+k*r2),u[1]/(1+k*r2)];}return d;}
const errs=[];for(let n=0;n<300;n++){const lines=[];
 for(const [x0,y0,x1,y1] of [[-.75,-.5,.75,-.52],[-.7,.5,.72,.48],[-.75,-.5,-.72,.5]]){const l=[];for(let t=0;t<=1.0001;t+=1/9){const u=[x0+(x1-x0)*t,y0+(y1-y0)*t],d=distort(u,K);l.push([W/2+d[0]*f+g()*.5,H/2+d[1]*f+g()*.5]);}lines.push(l);}
 errs.push(AG.calibK1(lines,W,H).k1-K);}
const m=errs.reduce((a,b)=>a+b)/errs.length,s=Math.sqrt(errs.reduce((a,b)=>a+(b-m)**2,0)/errs.length);
console.log('k1-Kalibrierung: Bias',m.toExponential(2),'σ',s.toExponential(2),'(Ziel <0,002)');
