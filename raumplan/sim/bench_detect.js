// Benchmark Markenerkennung unter realen Störungen: Unschärfe, Bewegung, Rauschen, Licht, JPEG (über Python/PIL)
const fs=require('fs'),cp=require('child_process');process.env.NF='0';
const src=fs.readFileSync(__dirname+'/test_pg.js','utf8').replace(/const frames=\[\];[\s\S]*$/,'module.exports={render,look,it,W,H,sheets,MS};').replace(/require\('\.\.\//g,"require('"+__dirname+"/../");
fs.writeFileSync(__dirname+'/_lib2.js',src);const {render,look,it,W,H,sheets,MS}=require('./_lib2.js');fs.unlinkSync(__dirname+'/_lib2.js');
const MK=require('../marker.js'),BA=require('../ba.js'),PG=require('../pg.js'),AG=require('../ausgleich.js'),g=AG.gauss;
function conv1(img,k,dx,dy){const o=new Float32Array(W*H),r=(k.length-1)/2;for(let y=0;y<H;y++)for(let x=0;x<W;x++){let s=0,n=0;for(let i=-r;i<=r;i++){const xx=x+i*dx,yy=y+i*dy;if(xx<0||yy<0||xx>=W||yy>=H)continue;s+=img[yy*W+xx]*k[i+r];n+=k[i+r];}o[y*W+x]=s/n;}return o;}
const gk=s=>{const r=Math.ceil(3*s),k=[];for(let i=-r;i<=r;i++)k.push(Math.exp(-i*i/(2*s*s)));return k;};
function degrade(img,o){let a=img;
 if(o.blur)a=conv1(conv1(a,gk(o.blur),1,0),gk(o.blur),0,1);
 if(o.motion){const k=new Array(o.motion).fill(1);a=conv1(a,k,1,0);}
 if(o.light){const b=new Float32Array(W*H);for(let y=0;y<H;y++)for(let x=0;x<W;x++)b[y*W+x]=a[y*W+x]*(1-o.light*x/W);a=b;}
 if(o.contrast){const b=new Float32Array(W*H);for(let i=0;i<W*H;i++)b[i]=128+(a[i]-128)*o.contrast;a=b;}
 if(o.noise){const b=new Float32Array(W*H);for(let i=0;i<W*H;i++)b[i]=a[i]+g()*o.noise;a=b;}
 if(o.jpeg){const buf=Buffer.alloc(W*H);for(let i=0;i<W*H;i++)buf[i]=Math.max(0,Math.min(255,a[i]));const out=cp.execFileSync('python3',['-c',`import sys,io\nfrom PIL import Image\nim=Image.frombytes('L',(${W},${H}),sys.stdin.buffer.read())\nb=io.BytesIO();im.save(b,'JPEG',quality=${o.jpeg});b.seek(0)\nsys.stdout.buffer.write(Image.open(b).convert('L').tobytes())`],{input:buf,maxBuffer:1e8});a=new Float32Array(W*H);for(let i=0;i<W*H;i++)a[i]=out[i];}
 return a;}
// feste Kamerablicke aus den Ecken
const L=4.2,B=3.6,views=[];[[.5,.5],[L-.5,.5],[L-.5,B-.5],[.5,B-.5]].forEach(c=>{const b=Math.atan2(B/2-c[1],L/2-c[0]);[-.6,0,.6].forEach((d,k)=>views.push(look([c[0],c[1],1.5],[c[0]+3*Math.cos(b+d),c[1]+3*Math.sin(b+d),[.6,1.2,.9][k]])));});
if(process.env.BIG){[0,4,8].forEach(i=>{let t=Date.now();const img=render(views[i]);const tr=Date.now()-t;t=Date.now();const d=MK.detect(img,W,H);const td=Date.now()-t;const tv=truthVisible(views[i]);const e=[];
 tv.forEach(s=>{const m=d.find(x=>x.id===s.id);if(m)m.c.forEach((p,q)=>e.push(Math.hypot(p[0]-s._uv[q][0],p[1]-s._uv[q][1])));});e.sort((a,b)=>a-b);
 console.log(`Blick ${i}: ${W}x${H}, Render ${tr} ms, Erkennung ${td} ms, ${d.length}/${tv.length} Marken, Ecke median ${(e[e.length>>1]||0).toFixed(3)} px`);});process.exit(0);}
const base=views.map(v=>render(v));
function truthVisible(cam){return sheets.filter(s=>{const X=PG.local(MS).map(l=>[0,1,2].map(m=>s.c[m]+s.u[m]*l[0]+s.v[m]*l[1])),uv=X.map(x=>BA.project(it,cam,x));
 if(uv.some(p=>p[2]<.3||p[0]<3||p[1]<3||p[0]>W-3||p[1]>H-3))return false;const nv=[s.v[1]*s.u[2]-s.v[2]*s.u[1],s.v[2]*s.u[0]-s.v[0]*s.u[2],s.v[0]*s.u[1]-s.v[1]*s.u[0]];
 const R=BA.rodr(cam),C=[0,1,2].map(q=>-(R[q]*cam[3]+R[3+q]*cam[4]+R[6+q]*cam[5])),t=[0,1,2].map(q=>C[q]-s.c[q]),cs=(t[0]*nv[0]+t[1]*nv[1]+t[2]*nv[2])/Math.hypot(...t);s._uv=uv;s._cos=cs;s._px=Math.hypot(uv[1][0]-uv[0][0],uv[1][1]-uv[0][1]);return cs>0.05;});}
const ONLY=process.env.ONLY;let cases=[['ideal',{}],['Unschärfe σ1,5px',{blur:1.5}],['Unschärfe σ3px',{blur:3}],['Bewegung 3px',{motion:3}],['Bewegung 5px',{motion:5}],['Bewegung 7px',{motion:7}],['Bewegung 9px',{motion:9}],['Rauschen σ8',{noise:8}],['Licht −60% Verlauf',{light:.6}],['Kontrast 40%',{contrast:.4}],['JPEG q70',{jpeg:70}],['Handyfoto (σ1,2 + Rauschen 5 + JPEG 85 + Licht 40%)',{blur:1.2,noise:5,jpeg:85,light:.4}]];
if(ONLY)cases=cases.filter(c=>ONLY.split(',').some(o=>c[0].startsWith(o)));const t0=Date.now();
for(const [name,o] of cases){const ST={};let vis=0,det=0,err=[],t=0,missedAng=[],missedPx=[];
 views.forEach((v,i)=>{const img=degrade(base[i],o),tv=truthVisible(v),ts=Date.now(),d=MK.detect(img,W,H,{stats:ST});t+=Date.now()-ts;
  tv.forEach(s=>{vis++;const m=d.find(x=>x.id===s.id);if(m){det++;m.c.forEach((p,q)=>err.push(Math.hypot(p[0]-s._uv[q][0],p[1]-s._uv[q][1])));}else{missedAng.push(Math.round(Math.acos(Math.min(1,s._cos))*180/Math.PI));missedPx.push(Math.round(s._px));}});
  const fp=d.filter(m=>!tv.find(s=>s.id===m.id)).length;if(fp)err.push(...Array(4).fill(99));});
 err.sort((a,b)=>a-b);if(process.env.STATS)console.log('   ',JSON.stringify(ST));console.log(`${name.padEnd(52)} Quote ${(100*det/vis).toFixed(0).padStart(3)}% (${det}/${vis})  Ecke median ${(err[err.length>>1]||0).toFixed(2)} px  95% ${(err[Math.floor(err.length*.95)]||0).toFixed(2)}  ${(t/views.length).toFixed(0)} ms/Bild | verpasst: Winkel ${missedAng.slice(0,8).join(',')}° Größe ${missedPx.slice(0,8).join(',')}px`);}
console.log('gesamt',((Date.now()-t0)/1000).toFixed(0),'s');
if(process.env.DUMPV){const i=+process.env.DUMPV,img=degrade(base[i],JSON.parse(process.env.DOPT||'{}'));const b=Buffer.alloc(W*H);for(let q=0;q<W*H;q++)b[q]=Math.max(0,Math.min(255,img[q]));fs.writeFileSync(process.env.SP+'/dv.pgm',Buffer.concat([Buffer.from(`P5 ${W} ${H} 255\n`),b]));
 const st={};console.log('erkannt',MK.detect(img,W,H,{stats:st}).map(d=>d.id).join(','),JSON.stringify(st),'sichtbar',truthVisible(views[i]).map(s=>s.id+':'+Math.round(s._px)+'px').join(' '));}
