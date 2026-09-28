const AG=require('../ausgleich.js'),g=AG.gauss;
let XC=false;
// Synthetisches Bild: Ecke eines dunklen Klebebands/Kante (L-Ecke) mit Unschärfe + Rauschen, Ecke bei (cx,cy) subpixel
function img(cx,cy,ang,W=200){const a=new Float32Array(W*W);const c=Math.cos(ang),s=Math.sin(ang);
 for(let y=0;y<W;y++)for(let x=0;x<W;x++){let v=0;for(let sy=0;sy<4;sy++)for(let sx=0;sx<4;sx++){const X=x+(sx+.5)/4-cx,Y=y+(sy+.5)/4-cy;const u=c*X+s*Y,w=-s*X+c*Y;v+=(XC?((u>0)!==(w>0)):(u>0&&w>0.3*u))?1:0;}
 a[y*W+x]=40+170*v/16;}
 // Unschärfe 3x3
 const b=new Float32Array(W*W);for(let y=1;y<W-1;y++)for(let x=1;x<W-1;x++){let t=0;for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++)t+=a[(y+j)*W+x+i];b[y*W+x]=t/9+g()*3;}
 return (x0,y0,w,h)=>{if(x0<0||y0<0||x0+w>W||y0+h>W)return null;const o=new Float32Array(w*h);for(let j=0;j<h;j++)for(let i=0;i<w;i++)o[j*w+i]=b[(y0+j)*W+x0+i];return o;};}
let e0=[],e1=[];for(let k=0;k<200;k++){const cx=100+Math.random(),cy=100+Math.random(),G=img(cx,cy,Math.random()*6.28);
 const p=[cx+g()*1.5,cy+g()*1.5],q=AG.refineCorner(G,p,6);e0.push(Math.hypot(p[0]-cx,p[1]-cy));e1.push(Math.hypot(q[0]-cx,q[1]-cy));}
const rms=a=>Math.sqrt(a.reduce((s,v)=>s+v*v,0)/a.length);console.log('Tippfehler RMS',rms(e0).toFixed(2),'px -> nach Eckenfang',rms(e1).toFixed(2),'px');
XC=true;e0=[];e1=[];for(let k=0;k<200;k++){const cx=100+Math.random(),cy=100+Math.random(),G=img(cx,cy,Math.random()*6.28);
 const p=[cx+g()*1.5,cy+g()*1.5],q=AG.refineCorner(G,p,6);e0.push(Math.hypot(p[0]-cx,p[1]-cy));e1.push(Math.hypot(q[0]-cx,q[1]-cy));}
console.log('X-Kreuzung (Klebeband gekreuzt): Tippfehler',rms(e0).toFixed(2),'px -> nach Eckenfang',rms(e1).toFixed(2),'px');
e1.sort((a,b)=>a-b);console.log('Median',e1[100].toFixed(3),'90%',e1[180].toFixed(3),'max',e1[199].toFixed(2));
