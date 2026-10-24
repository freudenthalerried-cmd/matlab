// 3D-Renderer (Three.js r128): "3D-Welt" (Sommer, Perspektive) und "Winter-Insel" (Toon, isometrisch).
const C3=window.R3D||{theme:'summer'},WIN=C3.theme==='winter',TOON=!!C3.toon;
let W=0,H=0,DPR=1,renderer,scene,camera,ov,og,sun,hemi,castleLight,flashL,plane0,raycaster;
const cam={x:11,z:6.6,zoom:1,base:1,force:false,top:60,bot:120,tilePx:40};
const DIR=WIN?new THREE.Vector3(.62,1.15,1).normalize():new THREE.Vector3(0,1,.8).normalize();
const FONT3="'Lilita One','Arial Rounded MT Bold','Trebuchet MS',sans-serif";
let PAL=WIN?{stone:0xdfe5f0,stone2:0xaab3c8,dark:0x6f7590,wood:0xa8703e,woodD:0x6e4426,snow:0xf6f9ff,leaf:[0xdde8f4,0xcad8ea,0xb8c9df],pine:[0x2c6b4a,0x34795a,0x3f8866],rock:0x9aa3b8}
  :{stone:0xd6cfe0,stone2:0xa39cb6,dark:0x5d5c78,wood:0xb8743a,woodD:0x75461f,snow:0xffffff,leaf:[0x6cc04a,0x8ccf3f,0x4f9e3a],pine:[0x2f7a3c,0x3a8c44,0x47a050],rock:0xa8a3b8};
const THEMES={
  gruen:{pal:{...PAL},ground:'#66b444',blades:['#8fd65a','#6cbf45','#4f9a36','#a6e070','#3f8a2e'],noise:['rgba(255,255,160,','rgba(20,80,20,'],path:['rgba(40,50,20,.3)','#a87a42','#d6ac6e','#e2bd82','rgba(255,240,200,.25)'],peb:['#b58a55','#f0d6a4'],sky:[0x9fd8ff,0x0c1230],far:0x5fae40,flowers:1},
  herbst:{pal:{...PAL,leaf:[0xe8862a,0xd9542a,0xf2b33a],pine:[0x2f6a3c,0x3a7a44,0x4a8a50]},ground:'#93a44a',blades:['#b5b04a','#c98a3a','#8a9a3a','#d9a040','#7a8a30'],noise:['rgba(255,200,90,','rgba(90,60,10,'],
    path:['rgba(50,40,20,.3)','#8f6a3a','#c49a62','#d2ac74','rgba(255,230,190,.2)'],peb:['#9a7444','#e0c08e'],sky:[0xf0d2a8,0x0e1030],far:0x86983e,leaves:1},
  wueste:{pal:{...PAL,leaf:[0x5aa83c,0x6cbf45,0x4a9a34],pine:[0x4a9a5a,0x58aa66,0x3d8a4e],rock:0xd08a5a,stone2:0xb07a4a},ground:'#e3bf7c',blades:null,noise:['rgba(255,240,200,','rgba(150,90,30,'],
    path:['rgba(90,50,10,.3)','#a87a42','#c99c5e','#d6ae72','rgba(255,240,210,.25)'],peb:['#a8743a','#f4dcaa'],sky:[0xbfe3ff,0x101030],far:0xd8b06c},
  vulkan:{pal:{...PAL,leaf:[0x5a4a44,0x4a3c38,0x6a5850],pine:[0x3a3030,0x4a3a36,0x2e2626],rock:0x5a4e52,stone2:0x463c40},ground:'#5a4a44',blades:null,noise:['rgba(255,120,40,','rgba(0,0,0,'],
    path:['rgba(0,0,0,.35)','#2e2624','#6a5a52','#7a6a60','rgba(255,140,60,.15)'],peb:['#3a302c','#9a8478'],sky:[0xd8a080,0x1a0a10],far:0x3a2e2c,lava:1},
};
let TH_=THEMES.gruen;
function setTheme(n){if(WIN)return;TH_=THEMES[n]||THEMES.gruen;PAL=TH_.pal}
const ROOF=[0,0xe0503a,0x3d6ae8,0x8a4ae0],GOLD=0xffc93c,TH={archer:[0,1.28,1.38,1.78],cannon:[0,.8,.92,1.04],frost:[0,1.58,1.74,1.9],tesla:[0,1.52,1.64,1.84]};

// ---------- Material & Geometrie ----------
const MATS=new Map(),GEOS=new Map();let GRAD=null,OUTM=null,GLOWTEX=null,SOFTTEX=null,COINTEX=null;
function mat(c,o={}){const k=c+JSON.stringify(o);let m=MATS.get(k);if(m)return m;const p={color:c};
  if(o.e!=null){p.emissive=o.e;p.emissiveIntensity=o.ei||1}if(o.t){p.transparent=true;p.opacity=o.t;p.depthWrite=false}
  if(TOON){p.gradientMap=GRAD;m=new THREE.MeshToonMaterial(p)}else{p.roughness=o.r!=null?o.r:.85;p.metalness=o.m||0;p.flatShading=o.smooth?false:true;m=new THREE.MeshStandardMaterial(p)}
  MATS.set(k,m);return m}
const G3=(k,f)=>{let g=GEOS.get(k);if(!g){g=f();GEOS.set(k,g)}return g};
const BOX=(w,h,d)=>G3(`b${w},${h},${d}`,()=>new THREE.BoxGeometry(w,h,d));
const CYL=(rt,rb,h,s=10,ts=0)=>G3(`c${rt},${rb},${h},${s},${ts}`,()=>new THREE.CylinderGeometry(rt,rb,h,s,1,false,ts));
const CONE=(r,h,s=10)=>G3(`k${r},${h},${s}`,()=>new THREE.ConeGeometry(r,h,s));
const SPH=(r,d=1)=>G3(`s${r},${d}`,()=>new THREE.IcosahedronGeometry(r,d));
const DOD=r=>G3('d'+r,()=>new THREE.DodecahedronGeometry(r,0));
const OCT=r=>G3('o'+r,()=>new THREE.OctahedronGeometry(r,0));
const TOR=(r,t,rs=6,ts=16,arc=TAU)=>G3(`t${r},${t},${rs},${ts},${arc}`,()=>new THREE.TorusGeometry(r,t,rs,ts,arc));
function M3(geo,m,x=0,y=0,z=0,sx=1,sy=sx,sz=sx){const o=new THREE.Mesh(geo,m);o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.castShadow=true;o.receiveShadow=true;return o}
function outline(g){if(!TOON)return g;const list=[];g.traverse(o=>{if(o.isMesh&&!o.userData.noOut)list.push(o)});
  for(const o of list){const m=new THREE.Mesh(o.geometry,OUTM);m.scale.setScalar(1.07);m.userData.noOut=1;m.castShadow=false;o.add(m)}return g}
function canvasTex(w,h,fn){const c=document.createElement('canvas');c.width=w;c.height=h;fn(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);return t}
const GLOWS=[];
function glow(color,s,base=.55){const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:GLOWTEX,color,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));sp.scale.set(s,s,1);sp.userData.base=base;sp.userData.glow=1;return sp}

// ---------- Boden ----------
const EB=WIN?{x0:-3,x1:25,z0:-3,z1:16}:{x0:-9,x1:31,z0:-7,z1:20};
function paintGround(){
  const PPT=WIN?44:36,w=(EB.x1-EB.x0)*PPT,h=(EB.z1-EB.z0)*PPT;
  return canvasTex(w,h,(g)=>{const r=RNG(777);g.setTransform(PPT,0,0,PPT,-EB.x0*PPT,-EB.z0*PPT);g.lineCap='round';g.lineJoin='round';
    const X0=EB.x0,Z0=EB.z0,WW=EB.x1-EB.x0,HH=EB.z1-EB.z0;
    g.fillStyle=WIN?'#eef3fb':TH_.ground;g.fillRect(X0,Z0,WW,HH);
    for(let i=0;i<WW*HH*.6;i++){const x=X0+r()*WW,y=Z0+r()*HH,rr=.8+r()*2.4,q=g.createRadialGradient(x,y,0,x,y,rr);
      const c=WIN?(r()<.5?'rgba(255,255,255,':'rgba(150,175,215,'):(r()<.5?TH_.noise[0]:TH_.noise[1]);q.addColorStop(0,c+(.06+r()*.08)+')');q.addColorStop(1,c+'0)');g.fillStyle=q;g.fillRect(x-rr,y-rr,rr*2,rr*2)}
    for(let i=0;i<WW*HH*(WIN?6:22);i++){const x=X0+r()*WW,y=Z0+r()*HH;
      if(WIN){g.fillStyle=r()<.5?'rgba(255,255,255,.9)':'rgba(170,190,225,.5)';g.fillRect(x,y,.03,.03)}
      else if(TH_.blades){g.strokeStyle=TH_.blades[Math.floor(r()*5)];g.lineWidth=.03;g.beginPath();g.moveTo(x,y);g.lineTo(x+(r()-.5)*.05,y-.09);g.stroke()}
      else if(r()<.3){g.fillStyle=r()<.5?'rgba(160,100,40,.35)':'rgba(255,245,215,.5)';g.fillRect(x,y,.04,.03)}}
    if(TH_.lava){g.lineCap='round';for(let i=0;i<70;i++){let x=X0+r()*WW,y=Z0+r()*HH;const tx=Math.floor(x),ty=Math.floor(y);if(inG(tx,ty)&&grid[ty][tx]===PATHT)continue;
      g.beginPath();g.moveTo(x,y);for(let k=0;k<4;k++){x+=(r()-.5)*.8;y+=(r()-.5)*.8;g.lineTo(x,y)}g.strokeStyle='rgba(255,90,20,.85)';g.lineWidth=.06;g.stroke();g.strokeStyle='rgba(255,220,120,.9)';g.lineWidth=.02;g.stroke()}}
    if(TH_.leaves)for(let i=0;i<WW*HH*1.5;i++){g.fillStyle=['#e8862a','#d9542a','#f2b33a','#a8401a'][Math.floor(r()*4)];g.beginPath();g.ellipse(X0+r()*WW,Z0+r()*HH,.06,.035,r()*3,0,TAU);g.fill()}
    // Teich
    const[px,py,prx,pry]=MAP.pond;g.beginPath();g.ellipse(px,py+.1,prx*1.05,pry*1.04,0,0,TAU);g.fillStyle=WIN?'#c9d6ea':MAP.theme==='wueste'?'#f2dcaa':TH_.lava?'#2a1e1c':'#e3cf94';g.fill();
    g.beginPath();g.ellipse(px,py+.1,prx*.94,pry*.88,0,0,TAU);g.fillStyle=WIN?'#bfe3f5':TH_.lava?'#ff6a1a':'#2f78b8';g.fill();
    if(WIN){g.strokeStyle='rgba(255,255,255,.8)';g.lineWidth=.03;for(let i=0;i<9;i++){let x=px+(r()-.5)*2.4,y=py+(r()-.5)*1.4;g.beginPath();g.moveTo(x,y);for(let k=0;k<3;k++){x+=(r()-.5)*.6;y+=(r()-.5)*.4;g.lineTo(x,y)}g.stroke()}}
    // Weg
    const pts=PATH.pts.slice();pts[0]=[EB.x0-1,pts[0][1]];
    const st=(wd,c)=>{g.beginPath();g.moveTo(pts[0][0],pts[0][1]);for(const p of pts.slice(1))g.lineTo(p[0],p[1]);g.lineWidth=wd;g.strokeStyle=c;g.stroke()};
    if(WIN){st(1.14,'rgba(50,70,120,.45)');st(1.02,'#8792ad');st(.9,'#c2cada');st(.56,'#a89580');st(.22,'#8f7b66')}
    else{const c=TH_.path;st(1.14,c[0]);st(1.02,c[1]);st(.9,c[2]);st(.58,c[3]);st(.2,c[4])}
    for(const s of PATH.segs)for(let d=0;d<s.len;d+=.08){const off=(r()-.5)*.8,x=s.x0+s.ux*d-s.uy*off,y=s.y0+s.uy*d+s.ux*off;
      if(r()<.5){g.beginPath();g.ellipse(x,y,.02+r()*.035,.015+r()*.02,0,0,TAU);g.fillStyle=WIN?(r()<.5?'#9fa9bd':'#ffffff'):(r()<.5?TH_.peb[0]:TH_.peb[1]);g.fill()}}
    if(!WIN&&TH_.flowers)for(let i=0;i<160;i++){const x=X0+r()*WW,y=Z0+r()*HH,tx=Math.floor(x),ty=Math.floor(y);if(inG(tx,ty)&&grid[ty][tx]!==G)continue;
      const c=['#fff','#ffe14a','#ff8ac0','#b88aff'][Math.floor(r()*4)];for(let k=0;k<3;k++){g.beginPath();g.arc(x+(r()-.5)*.3,y+(r()-.5)*.2,.035,0,TAU);g.fillStyle=c;g.fill()}}
  });
}

// ---------- Bäume, Felsen, Kristalle ----------
const _m4=new THREE.Matrix4(),_q=new THREE.Quaternion(),_v=new THREE.Vector3(),_s=new THREE.Vector3(),_e=new THREE.Euler();
function treeParts(kind,v){const P=[];const add=(geo,m,x,y,z,s=1,rx=0,ry=0,rz=0)=>P.push({geo,m,mx:new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx,ry,rz)),new THREE.Vector3(s,s,s))});
  if(kind==='cactus'){const c=mat(PAL.pine[v%3]);add(CYL(.12,.14,.9,7),c,0,.45,0);add(SPH(.12,0),c,0,.9,0);add(BOX(.2,.08,.08),c,.14,.42,0);add(CYL(.065,.065,.32,6),c,.24,.58,0);add(BOX(.08,.08,.18),c,0,.6,-.12);add(CYL(.06,.06,.26,6),c,0,.75,-.2);
    if(v===2)add(SPH(.05,0),mat(0xff6aa8),0,1.02,0);return P}
  if(kind==='dead'){const c=mat(PAL.pine[v%3]);add(CYL(.05,.1,1.0,5),c,0,.5,0);add(CYL(.025,.04,.45,4),c,.15,.75,0,1,0,0,-.8);add(CYL(.02,.035,.38,4),c,-.12,.62,.05,1,0,0,.9);add(CYL(.02,.03,.3,4),c,0,.85,-.12,1,-.8,0,0);
    if(v===2)add(SPH(.05,0),mat(0xff7a20,{e:0xff5a00,ei:1}),.1,.05,.1);return P}
  if(kind==='palm'){add(CYL(.06,.09,1.15,6),mat(0x9a6a3a),0,.58,0,1,0,0,.08);for(let i=0;i<6;i++)add(BOX(.75,.03,.16),mat(PAL.leaf[i%3]),Math.cos(i/6*TAU)*.32+.05,1.12,Math.sin(i/6*TAU)*.32,1,0,-i/6*TAU,-.35);
    add(SPH(.07,0),mat(0x6b3d18),.05,1.12,.05);return P}
  if(kind==='pine'){add(CYL(.06,.09,.3,6),mat(PAL.woodD),0,.15,0);
    for(let i=0;i<3;i++){const rr=.44-i*.11,y=.42+i*.26;add(CONE(rr,.46,7),mat(PAL.pine[i]),0,y,0);if(WIN)add(CONE(rr*.66,.2,7),mat(PAL.snow),0,y+.17,0)}}
  else{add(CYL(.07,.1,.5,6),mat(PAL.woodD),0,.25,0);const c=PAL.leaf[v%3];
    add(SPH(.38,0),mat(c),0,.78,0);add(SPH(.27,0),mat(PAL.leaf[(v+1)%3]),.22,.62,.1);add(SPH(.25,0),mat(c),-.22,.64,-.06);
    if(v===2&&!WIN)for(const[x,y,z]of[[.2,.8,.25],[-.25,.7,.18],[.05,1.0,.22]])add(SPH(.05,0),mat(0xff4a3a),x,y,z)}
  return P}
const kindOf=v=>WIN?(v===1?'round':'pine'):MAP.theme==='wueste'?(v===3?'palm':'cactus'):MAP.theme==='vulkan'?'dead':(v===3?'pine':'round');
function treeGroup(v,s,ry){const g=new THREE.Group();for(const p of treeParts(kindOf(v),v)){const m=new THREE.Mesh(p.geo,p.m);m.applyMatrix4(p.mx);m.castShadow=m.receiveShadow=true;g.add(m)}g.scale.setScalar(s);g.rotation.y=ry;return g}
function instTrees(list,parent){const by={};for(const t of list){const k=kindOf(t.v)+t.v;(by[k]=by[k]||[]).push(t)}
  for(const k in by){const arr=by[k],parts=treeParts(kindOf(arr[0].v),arr[0].v);
    for(const p of parts){const im=new THREE.InstancedMesh(p.geo,p.m,arr.length);im.castShadow=true;im.receiveShadow=true;
      arr.forEach((t,i)=>{_q.setFromEuler(_e.set(0,t.ry,0));_m4.compose(_v.set(t.x,0,t.z),_q,_s.set(t.s,t.s,t.s)).multiply(p.mx);im.setMatrixAt(i,_m4)});im.instanceMatrix.needsUpdate=true;parent.add(im)}}}
function rockGroup(v){const g=new THREE.Group();g.add(M3(DOD(.3),mat(PAL.rock),0,.16,0,1,.72,1));g.add(M3(DOD(.16),mat(PAL.stone2),.24,.08,.12));
  if(WIN)g.add(M3(DOD(.24),mat(PAL.snow),0,.3,0,1,.35,1));else g.add(M3(SPH(.12,0),mat(0x6fbf4a),-.18,.05,.16,1,.35,1));g.rotation.y=v*1.3;return g}
function crystalGroup(){const g=new THREE.Group();const e=(c,x,y,z,s,rz)=>{const m=M3(OCT(.14),mat(c,{e:c,ei:.55}),x,y,z,s,s*2.4,s);m.rotation.z=rz;g.add(m)};
  e(0x6ad8ff,0,.34,0,1,0);e(0xa26bff,-.2,.22,.08,.75,.35);e(0x9ff2ff,.2,.2,-.06,.7,-.3);e(0x5aa0ff,.05,.14,.22,.5,.1);const gl=glow(0x7ad8ff,1.6,.45);gl.position.y=.4;g.add(gl);return g}

// ---------- Gebäude ----------
function merl(g,r,y,n,m,s=.13,ox=0,oz=0){for(let i=0;i<n;i++){const a=i/n*TAU;g.add(M3(BOX(s,s*1.2,s),m,ox+Math.cos(a)*r,y,oz+Math.sin(a)*r))}}
function makeB(t,l){
  const g=new THREE.Group(),P={g},ST=mat(l===3&&t!=='cannon'?PAL.stone:PAL.stone),S2=mat(PAL.stone2),WD=mat(PAL.wood),WDD=mat(PAL.woodD),DK=mat(PAL.dark,{m:.3,r:.6});
  const aim=()=>{const a=new THREE.Group();P.aim=a;g.add(a);return a};
  if(t==='archer'){g.add(M3(CYL(.44,.5,.26,10),S2,0,.13,0));
    if(l===1){for(const[x,z]of[[.27,.27],[-.27,.27],[.27,-.27],[-.27,-.27]])g.add(M3(BOX(.08,.9,.08),WD,x,.7,z));
      g.add(M3(CYL(.5,.5,.1,10),WD,0,1.17,0));const rl=M3(TOR(.46,.025,4,16),WDD,0,1.3,0);rl.rotation.x=Math.PI/2;g.add(rl)}
    else{const Hh=l===2?1.24:1.64;g.add(M3(CYL(.37,.45,Hh,10),ST,0,Hh/2,0));g.add(M3(CYL(.45,.4,.12,10),S2,0,Hh+.06,0));merl(g,.4,Hh+.2,8,ST);
      if(l===3){const r1=M3(TOR(.42,.035,4,16),mat(GOLD,{m:.6,r:.3}),0,Hh*.62,0);r1.rotation.x=Math.PI/2;g.add(r1);for(const s of[-1,1])g.add(M3(BOX(.02,.48,.22),mat(ROOF[2]),s*.42,Hh-.4,0))}}
    const a=aim();a.position.y=TH.archer[l]-.05;a.add(M3(CYL(.08,.1,.24,8),mat(0x3d6ae8),0,.12,0));a.add(M3(SPH(.08,1),mat(0xffd2a8),0,.31,0));a.add(M3(CONE(.1,.15,8),mat(0x2f8a3a),0,.4,0));
    const bow=M3(TOR(.15,.016,4,10,Math.PI),WDD,0,.2,.12);bow.rotation.set(0,-Math.PI/2,-Math.PI/2);a.add(bow)}
  else if(t==='cannon'){const Hh=[0,.62,.74,.86][l],M=l===3?mat(PAL.dark):ST;g.add(M3(CYL(.5,.56,Hh,12),M,0,Hh/2,0));merl(g,.48,Hh+.08,10,l===3?S2:ST,.14);
    if(l>=2){const b=M3(TOR(.53,.035,4,18),l===3?mat(GOLD,{m:.6,r:.3}):DK,0,Hh*.5,0);b.rotation.x=Math.PI/2;g.add(b)}
    const a=aim();a.position.y=Hh;a.add(M3(BOX(.3,.14,.3),WD,0,.07,0));const br=new THREE.Group();br.position.y=.22;a.add(br);P.barrel=br;
    const bm=mat(0x34343f,{m:.6,r:.35});const c=M3(CYL(.075+.012*l,.11+.012*l,.56,10),bm,0,0,.12);c.rotation.x=Math.PI/2;br.add(c);const mz=M3(TOR(.09+.012*l,.025,4,12),l===3?mat(GOLD,{m:.6,r:.3}):bm,0,0,.4);br.add(mz)}
  else if(t==='frost'){g.add(M3(CYL(.42,.48,.24,10),S2,0,.12,0));const hs=[0,1.0,1.14,1.28][l];g.add(M3(CYL(.14,.3,hs,8),mat(0x6a58d8),0,.24+hs/2,0));
    const cup=M3(CONE(.24,.26,8),mat(0xb8a6ff),0,.24+hs+.08,0);cup.rotation.x=Math.PI;g.add(cup);
    for(const s of[-1,1]){const f=M3(OCT(.07),mat(0x9ff2ff,{e:0x5fe3ff,ei:.5}),s*.22,.24+hs+.12,0,1,2,1);g.add(f)}
    const o=M3(SPH(.13+.02*l,1),mat(0xdffaff,{e:0x5fe3ff,ei:.9}),0,TH.frost[l],0);o.castShadow=false;g.add(o);P.orb=o;const gl=glow(0x7ae8ff,1.4+.2*l,.5);o.add(gl);
    const rg=M3(TOR(.26,.018,4,24),mat(0x9ff2ff,{e:0x5fe3ff,ei:.8}),0,TH.frost[l],0);g.add(rg);P.ring=rg;
    if(l>=2){const r2=M3(TOR(.46,.03,4,18),mat(0x5fe3ff,{e:0x5fe3ff,ei:.6}),0,.25,0);r2.rotation.x=Math.PI/2;g.add(r2)}
    if(l===3){P.shards=[];for(let i=0;i<3;i++){const s=M3(OCT(.07),mat(0x9ff2ff,{e:0x5fe3ff,ei:.7}),0,0,0,1,1.8,1);g.add(s);P.shards.push(s)}}}
  else if(t==='tesla'){g.add(M3(CYL(.46,.52,.3,10),DK,0,.15,0));const n=3+l;g.add(M3(CYL(.05,.05,TH.tesla[l]-.3,6),DK,0,.3+(TH.tesla[l]-.3)/2,0));
    for(let i=0;i<n;i++){const tr=M3(TOR(.14,.035,5,12),mat(0xd8823a,{m:.7,r:.35}),0,.42+i*(TH.tesla[l]-.6)/n,0);tr.rotation.x=Math.PI/2;g.add(tr)}
    for(let i=0;i<3;i++){const a=i/3*TAU,s=M3(BOX(.05,.95,.05),DK,Math.cos(a)*.3,.62,Math.sin(a)*.3);s.rotation.set(Math.sin(a)*.25,0,-Math.cos(a)*.25);g.add(s)}
    if(l>=2){const b=M3(TOR(.45,.035,4,18),mat(GOLD,{m:.6,r:.3}),0,.3,0);b.rotation.x=Math.PI/2;g.add(b)}
    const o=M3(SPH(.14+.02*l,1),mat(0xe6dcff,{e:0x8a6aff,ei:1}),0,TH.tesla[l],0);o.castShadow=false;g.add(o);P.orb=o;o.add(glow(0xa88aff,1.5+.2*l,.55))}
  else if(t==='saw'){g.add(M3(BOX(.78,.5,.6),WD,0,.25,0));const rf=M3(CYL(.52,.52,.9,3,Math.PI/2),mat(l===3?ROOF[2]:ROOF[1]),0,.63,0,.55,1,1);rf.rotation.z=Math.PI/2;g.add(rf);
    if(WIN)g.add(M3(BOX(.92,.04,.5),mat(PAL.snow),0,.78,0));
    g.add(M3(BOX(.2,.3,.02),mat(0x3a2410),0,.15,.31));const bl=new THREE.Group();bl.position.set(.46,.34,0);g.add(bl);P.blade=bl;
    const bd=M3(CYL(.24,.24,.03,16),mat(0xd9d9e6,{m:.8,r:.3}),0,0,0);bd.rotation.z=Math.PI/2;bl.add(bd);
    const logs=l>=2?[[.1,.07,.42],[.1,.07,.56],[.1,.19,.49]]:[[.1,.07,.42],[.1,.07,.56]];for(const[x,y,z]of logs){const c=M3(CYL(.07,.07,.5,7),WD,x-.1,y,z);c.rotation.z=Math.PI/2;g.add(c)}
    if(l===3)g.add(M3(BOX(.12,.32,.12),ST,-.2,.86,-.1));P.chimney=l===3?[-.2,1.05,-.1]:[-.2,.8,-.1]}
  else if(t==='mine'){g.add(M3(DOD(.5),mat(WIN?0x9a95a8:0x8a7a62),0,.12,0,1.12,.64,1));if(WIN)g.add(M3(DOD(.42),mat(PAL.snow),0,.3,-.05,1.1,.3,.9));
    g.add(M3(BOX(.34,.36,.12),mat(0x1c120a),0,.2,.44));for(const s of[-1,1])g.add(M3(BOX(.06,.42,.06),WD,s*.2,.21,.5));g.add(M3(BOX(.48,.07,.08),WD,0,.44,.5));
    g.add(M3(BOX(.26,.14,.2),DK,.42,.1,.55));for(const[x,z]of[[.36,.52],[.46,.58],[.42,.5]])g.add(M3(SPH(.06,0),mat(GOLD,{e:0x8a5a00,ei:.4,m:.5,r:.3}),x,.21,z));
    if(l>=2){const ln=M3(SPH(.05,0),mat(0xffe08a,{e:0xffb030,ei:1}),-.27,.5,.52);ln.add(glow(0xffb040,.9,.45));g.add(ln)}
    if(l===3)g.add(M3(BOX(.32,.12,.03),mat(GOLD,{m:.6,r:.3}),0,.56,.52))}
  else if(t==='cmine'){const e=(c,x,y,z,s,rz)=>{const m=M3(OCT(.15),mat(c,{e:c,ei:.6}),x,y,z,s,s*2.4,s);m.rotation.z=rz;g.add(m)};
    e(0x6ad8ff,0,.36,0,1,0);e(0xa26bff,-.22,.24,.1,.8,.35);e(0x9ff2ff,.22,.22,-.06,.75,-.3);
    for(const s of[-1,1]){const p=M3(BOX(.06,1.05,.06),WD,s*.2,.5,.26);p.rotation.z=s*.33;g.add(p)}g.add(M3(BOX(.3,.06,.06),WDD,0,.88,.26));
    if(l>=2)g.add(M3(CYL(.07,.06,.1,8),WDD,0,.62,.26));if(l===3){const r1=M3(TOR(.44,.03,4,18),mat(0xc9a0ff,{e:0x8a6aff,ei:.6}),0,.05,0);r1.rotation.x=Math.PI/2;g.add(r1)}
    const gl=glow(0x7ad8ff,1.8,.5);gl.position.y=.45;g.add(gl)}
  else if(t==='barracks'){g.add(M3(BOX(.92,.12,.72),l>=2?S2:WDD,0,.06,0));g.add(M3(BOX(.8,.44,.58),l===3?ST:WD,0,.34,0));
    const rf=M3(CYL(.52,.52,.96,3,Math.PI/2),mat(l===3?0xc9303f:ROOF[2]),0,.74,0,.55,1,1);rf.rotation.z=Math.PI/2;g.add(rf);if(WIN)g.add(M3(BOX(.98,.04,.48),mat(PAL.snow),0,.9,0));
    g.add(M3(BOX(.22,.3,.02),mat(0x3a2410),0,.27,.3));for(const s of[-1,1]){const sh=M3(CYL(.09,.09,.03,10),mat(0xc9303f),s*.26,.38,.3);sh.rotation.x=Math.PI/2;g.add(sh)}
    g.add(M3(CYL(.018,.018,1.1,5),WDD,-.36,.66,-.2));g.add(M3(BOX(.26,.18,.02),mat(l===3?GOLD:0xc9303f),-.22,1.08,-.2));
    g.add(M3(CYL(.03,.03,.36,5),WD,.42,.18,.42));g.add(M3(SPH(.08,0),mat(0xd9b77a),.42,.4,.42,1,1.3,1));for(let i=0;i<3;i++)g.add(M3(CYL(.012,.012,.7,4),WDD,-.42+i*.06,.35,.32))}
  if(l>1&&(DEF[t].k==='t'||DEF[t].k==='b'))for(let i=0;i<l;i++){const s=M3(OCT(.05),mat(GOLD,{e:0x8a5a00,ei:.5}),(i-(l-1)/2)*.13,.03,.5,1,.4,1);g.add(s)}
  outline(g);return P}
function makeCastle(l){
  const g=new THREE.Group(),P={g},ST=mat(l===3?0xeae6f4:PAL.stone),S2=mat(PAL.stone2),RF=mat(ROOF[l]),DK=mat(0x24140a);
  g.add(M3(BOX(3.0,1.1,2.4),ST,0,.55,-.1));
  for(let x=-1.35;x<=1.36;x+=.3){g.add(M3(BOX(.17,.18,.17),ST,x,1.19,1.05));g.add(M3(BOX(.17,.18,.17),ST,x,1.19,-1.25))}
  g.add(M3(BOX(1.45,2.35,1.3),ST,0,1.17,0));for(let x=-.6;x<=.61;x+=.3){g.add(M3(BOX(.16,.2,.16),S2,x,2.44,.6));g.add(M3(BOX(.16,.2,.16),S2,x,2.44,-.6))}
  for(const s of[-1,1])g.add(M3(BOX(.16,.2,.16),S2,s*.65,2.44,0));
  const win=mat(0xffd27a,{e:0xffa030,ei:.8});for(const x of[-.35,.35]){const w=M3(BOX(.16,.26,.02),win,x,1.62,.66);w.userData.noOut=1;g.add(w)}
  for(const[x,z]of[[-1.42,1.0],[1.42,1.0],[-1.42,-1.15],[1.42,-1.15]]){g.add(M3(CYL(.42,.47,2.0,12),ST,x,1.0,z));merl(g,.4,2.08,8,S2,.12,x,z);
    const c=M3(CONE(.56,.95,12),RF,x,2.6,z);g.add(c);if(WIN)g.add(M3(CONE(.32,.4,12),mat(PAL.snow),x,2.88,z))}
  g.add(M3(BOX(.72,.86,.08),DK,0,.43,1.12));const arch=M3(CYL(.36,.36,.08,12),DK,0,.86,1.12);arch.rotation.x=Math.PI/2;g.add(arch);
  for(let x=-.27;x<=.28;x+=.135)g.add(M3(BOX(.025,.8,.02),mat(0x5a5a6e,{m:.6}),x,.44,1.17));
  P.flags=[];for(const x of[-1.42,1.42]){g.add(M3(CYL(.02,.02,.6,5),mat(0x3a2a1a),x,3.3,1.0));const f=new THREE.Group();f.position.set(x,3.48,1.0);const fm=M3(BOX(.42,.25,.02),RF,.21,0,0);f.add(fm);g.add(f);P.flags.push(f)}
  if(l>=2)for(const x of[-.42,.42])g.add(M3(BOX(.26,.62,.02),RF,x,1.05,.67));
  P.torches=[];for(const x of[-.58,.58]){g.add(M3(CYL(.03,.03,.25,5),mat(0x3a2a1a),x,.78,1.2));const f=M3(SPH(.06,0),mat(0xffc060,{e:0xff9020,ei:1.2}),x,.95,1.2);f.castShadow=false;f.userData.noOut=1;const gl=glow(0xffa040,1.1,.6);f.add(gl);g.add(f);P.torches.push(f)}
  if(l===3){const a=new THREE.Group();a.position.set(0,2.55,0);g.add(a);P.aim=a;a.add(M3(BOX(.2,.12,.5),mat(PAL.wood),0,0,0));const bw=M3(TOR(.26,.025,4,10,Math.PI),mat(PAL.woodD),0,.06,.18);bw.rotation.set(-Math.PI/2,0,0);a.add(bw)}
  outline(g);g.position.set(CASTLE_C[0],0,CASTLE_C[1]);return P}

// ---------- Gegner ----------
function makeE(e){
  const g=new THREE.Group(),b=new THREE.Group(),P={g,b,legs:[],wings:[]};g.add(b);const L=(x,z,h=.14,w=.07,c=0x2f4a1a)=>{const pv=new THREE.Group();pv.position.set(x,h,z);const m=M3(BOX(w,h,w),mat(c),0,-h/2,0);pv.add(m);b.add(pv);P.legs.push(pv)};
  const eye=(x,y,z,c=0xffef5a)=>{const m=M3(SPH(.028,0),mat(c,{e:c,ei:.6}),x,y,z);m.castShadow=false;m.userData.noOut=1;b.add(m)};
  switch(e.type){
    case'goblin':L(-.06,0);L(.06,0);b.add(M3(CYL(.11,.14,.2,8),mat(0x8a5a2a),0,.24,0));b.add(M3(SPH(.14,1),mat(0x7ccf4a),0,.45,0));
      for(const s of[-1,1]){const er=M3(CONE(.05,.2,4),mat(0x6cbf3c),s*.17,.48,0);er.rotation.z=-s*1.3;b.add(er)}eye(-.05,.48,.12);eye(.05,.48,.12);b.add(M3(BOX(.03,.03,.2),mat(0xc9c9d6,{m:.6}),.15,.26,.1));break;
    case'wolf':for(const[x,z]of[[-.08,.14],[.08,.14],[-.08,-.14],[.08,-.14]])L(x,z,.2,.06,0x5a5a6c);b.add(M3(BOX(.22,.2,.46),mat(0x8a8a9e),0,.3,0));b.add(M3(BOX(.18,.17,.2),mat(0x9a9aae),0,.4,.3));
      b.add(M3(BOX(.1,.08,.13),mat(0xb9b9c9),0,.35,.44));for(const s of[-1,1])b.add(M3(CONE(.04,.11,4),mat(0x6a6a7c),s*.06,.53,.27));const tl=M3(CYL(.03,.05,.3,5),mat(0x6a6a7c),0,.4,-.32);tl.rotation.x=-1;b.add(tl);eye(-.05,.43,.4);eye(.05,.43,.4);break;
    case'orc':L(-.08,0,.16,.09,0x3a3020);L(.08,0,.16,.09,0x3a3020);b.add(M3(SPH(.2,1),mat(0x4f8a3a),0,.38,0,1,1.05,.85));b.add(M3(SPH(.14,1),mat(0x5fa03f),0,.7,.02));
      b.add(M3(CYL(.15,.16,.1,8),mat(0x8a8aa0,{m:.5}),0,.79,0));for(const s of[-1,1]){const h=M3(CONE(.04,.16,5),mat(0xf0e6c8),s*.15,.88,0);h.rotation.z=-s*.6;b.add(h)}
      eye(-.05,.7,.13,0xff3a2a);eye(.05,.7,.13,0xff3a2a);b.add(M3(CYL(.02,.02,.5,5),mat(0x6b3d18),.25,.4,.06));b.add(M3(BOX(.03,.16,.15),mat(0xc9c9d6,{m:.6}),.25,.6,.12));break;
    case'bat':b.add(M3(SPH(.12,1),mat(0x4a2a7a),0,0,0));for(const s of[-1,1]){b.add(M3(CONE(.04,.1,4),mat(0x4a2a7a),s*.06,.13,0));const pv=new THREE.Group();pv.position.set(s*.08,0,0);
      pv.add(M3(BOX(.34,.02,.2),mat(0x6a3aa8),s*.18,0,0));b.add(pv);P.wings.push(pv)}eye(-.04,.02,.1,0xff4a4a);eye(.04,.02,.1,0xff4a4a);break;
    case'knight':L(-.07,0,.16,.08,0x4a4a5e);L(.07,0,.16,.08,0x4a4a5e);const ar=mat(0xc9cada,{m:.7,r:.35});b.add(M3(CYL(.13,.16,.34,8),ar,0,.33,0));b.add(M3(SPH(.12,1),ar,0,.6,0));
      b.add(M3(BOX(.15,.03,.02),mat(0x111122),0,.6,.115));b.add(M3(BOX(.04,.12,.22),mat(0xe8303a),0,.74,-.03));b.add(M3(BOX(.03,.28,.22),mat(0x2a4aa8),.18,.34,.06));b.add(M3(BOX(.03,.03,.36),mat(0xd9d9e6,{m:.7}),-.18,.36,.14));break;
    case'troll':L(-.12,0,.2,.13,0x4a5a6a);L(.12,0,.2,.13,0x4a5a6a);b.add(M3(SPH(.3,1),mat(0x6a8a9e),0,.48,0));b.add(M3(SPH(.15,1),mat(0x7a9aae),0,.86,.1));
      eye(-.05,.88,.23);eye(.05,.88,.23);const club=new THREE.Group();club.position.set(.33,.55,.05);club.rotation.x=.7;club.add(M3(CYL(.04,.1,.65,6),mat(0x8a5428),0,.25,0));b.add(club);P.club=club;
      b.add(M3(CONE(.06,.12,4),mat(GOLD),0,1.03,.08));break;
    case'dragon':b.add(M3(SPH(.3,1),mat(0xd83a2a),0,0,0,1,.8,1.5));b.add(M3(SPH(.22,1),mat(0xffc070),0,-.1,.08,1,.6,1.3));const nk=M3(CYL(.08,.12,.42,6),mat(0xd83a2a),0,.16,.45);nk.rotation.x=.9;b.add(nk);
      b.add(M3(BOX(.2,.16,.3),mat(0xe04a32),0,.3,.66));for(const s of[-1,1]){const h=M3(CONE(.03,.14,4),mat(0xf0e6c8),s*.06,.42,.58);h.rotation.x=-.6;b.add(h)}eye(-.07,.34,.78);eye(.07,.34,.78);
      const tl2=M3(CONE(.1,.75,6),mat(0xb82424),0,0,-.75);tl2.rotation.x=-Math.PI/2;b.add(tl2);
      for(const s of[-1,1]){const pv=new THREE.Group();pv.position.set(s*.2,.12,0);pv.add(M3(BOX(.95,.02,.55),mat(0x9a1a1a),s*.47,0,0));b.add(pv);P.wings.push(pv)}P.mouth=[0,.3,.82];break;
  }
  const ice=new THREE.Mesh(TOR(.24,.03,4,16),mat(0x9ff2ff,{e:0x5fe3ff,ei:.6,t:.8}));ice.rotation.x=Math.PI/2;ice.position.y=.03;ice.visible=false;ice.userData.noOut=1;g.add(ice);P.ice=ice;
  outline(b);const s=e.sz*(e.boss?.85:1);g.scale.setScalar(s);P.s=s;return P}

// ---------- Held & Soldaten ----------
function makeU(u){const g=new THREE.Group(),b=new THREE.Group(),P={g,b,legs:[]};g.add(b);g.userData.unit=u;
  const L=(x,c)=>{const pv=new THREE.Group();pv.position.set(x,.15,0);pv.add(M3(BOX(.08,.15,.08),mat(c),0,-.075,0));b.add(pv);P.legs.push(pv)};
  const arm=new THREE.Group();P.arm=arm;
  if(u.k==='hero'){L(-.07,0x4a4a5e);L(.07,0x4a4a5e);const au=mat(GOLD,{m:.6,r:.35});b.add(M3(CYL(.14,.17,.36,8),au,0,.33,0));
    const cape=M3(BOX(.28,.38,.02),mat(0x2a4aa8),0,.36,-.16);cape.rotation.x=.18;b.add(cape);b.add(M3(SPH(.12,1),mat(0xffd2a8),0,.6,0));b.add(M3(SPH(.13,1),au,0,.65,-.01,1,.8,1));
    b.add(M3(BOX(.04,.14,.18),mat(0xe8303a),0,.8,-.02));b.add(M3(BOX(.04,.28,.24),mat(0x2a4aa8),-.19,.34,.06));b.add(M3(OCT(.05),au,-.215,.36,.06));
    arm.position.set(.19,.42,0);arm.add(M3(BOX(.035,.035,.5),mat(0xe6e6f2,{m:.8,r:.25}),0,0,.26));arm.add(M3(BOX(.16,.03,.03),au,0,0,.02));b.add(arm);g.scale.setScalar(1.3)}
  else{L(-.06,0x3a3a4e);L(.06,0x3a3a4e);b.add(M3(CYL(.11,.13,.28,8),mat(0x3d6ae8),0,.28,0));b.add(M3(SPH(.09,1),mat(0xffd2a8),0,.5,0));b.add(M3(CYL(.1,.11,.07,8),mat(0x9a9ab4,{m:.6}),0,.57,0));
    b.add(M3(BOX(.03,.2,.16),mat(0xc9303f),-.15,.3,.05));arm.position.set(.15,.34,0);arm.add(M3(CYL(.012,.012,.62,4),mat(PAL.woodD),0,0,.18));
    const sp=arm.children[0];sp.rotation.x=Math.PI/2;const tip=M3(CONE(.03,.09,4),mat(0xe6e6f2,{m:.7}),0,0,.52);tip.rotation.x=Math.PI/2;arm.add(tip);b.add(arm)}
  outline(b);return P}
const UM=new Map();let unitG,heroRing,rallyFlag;
function syncUnits(dt){
  const seen=new Set();
  for(const u of S.units){seen.add(u);let P=UM.get(u);if(!P){P=makeU(u);unitG.add(P.g);UM.set(u,P)}
    P.g.visible=!u.dead;if(u.dead)continue;P.g.position.set(u.x,0,u.y);P.g.rotation.y=Math.atan2(Math.cos(u.ang),Math.sin(u.ang));
    const moving=P.lx!=null&&Math.hypot(u.x-P.lx,u.y-P.ly)>1e-4;P.lx=u.x;P.ly=u.y;const sw=moving?Math.sin((u.walk||0)*1.4)*.6:0;P.legs.forEach((l,i)=>l.rotation.x=i?sw:-sw);
    P.arm.rotation.x=-u.swing*1.4+(u.k==='sol'?.2:0);P.b.position.y=moving?Math.abs(Math.sin((u.walk||0)*1.4))*.03:0;P.b.scale.setScalar(u.hurt>0?1.08:1)}
  for(const[u,P]of UM)if(!seen.has(u)){unitG.remove(P.g);UM.delete(u)}
  const h=S.units.find(u=>u.k==='hero');heroRing.visible=!!(h&&!h.dead&&(S.heroSel||(S.sel&&S.sel.hero)));if(heroRing.visible)heroRing.position.set(h.x,.05,h.y);
  const sb=S.sel&&S.sel.b;rallyFlag.visible=!!(sb&&sb.rally);if(rallyFlag.visible){rallyFlag.position.set(sb.rally.x,0,sb.rally.y);showRange(sb.x+.5,sb.y+.5,DEF.barracks.rng,true)}
  if(S.rallyFor){const b=S.rallyFor;showRange(b.x+.5,b.y+.5,DEF.barracks.rng,true)}
}
const FALL=[];

// ---------- Partikel ----------
const PARTS=[],FREE=[],TEXTS=[],BOLTS=[],DECALS=[];let partG,decalG;
function part(o){if(PARTS.length>500)return;let sp=FREE.pop();if(!sp){sp=new THREE.Sprite(new THREE.SpriteMaterial({map:SOFTTEX,transparent:true,depthWrite:false}));partG.add(sp)}
  const m=sp.material;m.map=o.k==='coin'?COINTEX:SOFTTEX;m.blending=o.add?THREE.AdditiveBlending:THREE.NormalBlending;m.color.set(o.c||0xffffff);sp.visible=true;
  PARTS.push(Object.assign({sp,vx:0,vy:0,vz:0,g:0,life:1,max:1,sz:.15,grow:0,drag:1,a:1},o))}
function puff(x,y,z,n,c,sz=.25,spd=1,add=false){for(let i=0;i<n;i++){const a=rand(0,TAU),v=rand(.2,1)*spd;part({x,y,z,vx:Math.cos(a)*v,vy:rand(.2,.9)*spd,vz:Math.sin(a)*v,life:rand(.5,1),max:1,sz:sz*rand(.7,1.2),grow:sz*1.2,c,drag:.92,add,a:.8})}}
function sparks(x,y,z,n,c,spd=2.5){for(let i=0;i<n;i++){const a=rand(0,TAU),v=rand(.5,1)*spd;part({x,y,z,vx:Math.cos(a)*v,vy:rand(.5,2.2)*spd*.6,vz:Math.sin(a)*v,g:-5,life:rand(.3,.7),max:.7,sz:rand(.06,.12),c,drag:.95,add:true})}}
function decal(x,z,r,life){const m=new THREE.Mesh(G3('disc',()=>new THREE.CircleGeometry(1,20)),new THREE.MeshBasicMaterial({color:0x2a1a0a,transparent:true,opacity:.45,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.set(x,.025,z);m.scale.setScalar(r);decalG.add(m);DECALS.push({m,life,max:life})}
let FLASH=0;
function fx(n,d){switch(n){
  case'build':puff(d.x+.5,.15,d.y+.5,14,WIN?0xffffff:0xe0cfa8,.22,1.3);break;
  case'upgrade':puff(d.x+.5,.15,d.y+.5,16,0xe0cfa8,.22,1.3);sparks(d.x+.5,1,d.y+.5,22,0xffd23f);break;
  case'castleUp':for(let i=0;i<5;i++)puff(rand(19.2,21.8),.2,rand(7.4,8),8,0xe0cfa8,.3,1.4);sparks(20.5,2.5,6.5,50,0xffd23f,3.5);break;
  case'leaves':{const o=decorG.children.find(c=>c.userData.tile&&c.userData.tile.x===d.x&&c.userData.tile.y===d.y);if(o){scene.attach(o);FALL.push({o,t:0,ax:rand(-1,1)>0?1:-1})}}
    for(let i=0;i<16;i++)part({x:d.x+.5+rand(-.3,.3),y:rand(.4,1),z:d.y+.5+rand(-.3,.3),vx:rand(-1,1),vy:rand(.5,1.5),vz:rand(-1,1),g:-2.5,life:rand(.8,1.3),max:1.3,sz:.09,c:WIN?0xffffff:[0x6cbf3c,0xa6e05a,0x3b8a2e][i%3],drag:.96});break;
  case'rock':puff(d.x+.5,.2,d.y+.5,16,0xb8b2c8,.25,1.4);break;
  case'sparkle':sparks(d.x,d.h,d.y,d.n,d.c);break;
  case'text':TEXTS.push({x:d.x,y:d.y,h:d.h,txt:d.txt,k:d.k,life:1.1,max:1.1});break;
  case'hit':sparks(d.x,d.h,d.y,3,0xffffff,1.2);break;
  case'frostHit':sparks(d.x,d.h,d.y,10,0xc9f4ff,1.6);break;
  case'explode':{const s=d.s;sparks(d.x,.3,d.y,Math.round(24*s),0xffb340,3.2*Math.sqrt(s));puff(d.x,.25,d.y,Math.round(10*s),0x5a5050,.35*s,1);puff(d.x,.2,d.y,Math.round(6*s),0xffa040,.3*s,.8,true);
    decal(d.x,d.y,.45*s,6);flashL.position.set(d.x,.8,d.y);flashL.intensity=Math.max(flashL.intensity,2.5*s);FLASH=Math.max(FLASH,.12*s);break}
  case'bolt':BOLTS.push({pts:d.pts,life:.22,max:.22});flashL.position.set(d.pts[1][0],1,d.pts[1][1]);flashL.intensity=Math.max(flashL.intensity,1.2);break;
  case'muzzle':{const b=d.b,c=Math.cos(b.ang),s=Math.sin(b.ang);puff(b.x+.5+c*.5,TH.cannon[b.l]+.22,b.y+.5+s*.5,7,0xeeeeee,.16,.7);break}
  case'kill':{const e=d.e,h=tgtH(e);puff(e.x,h,e.y,10,0xffffff,.22*e.sz,1);for(let i=0;i<Math.min(6,2+e.g/8);i++)part({k:'coin',x:e.x,y:h,z:e.y,vx:rand(-1,1),vy:rand(2.5,3.5),vz:rand(-1,1),g:-9,life:.8,max:.8,sz:.16,c:0xffffff});
    if(e.boss)fx('explode',{x:e.x,y:e.y,s:2});break}
  case'unitDie':{const u=d.u;puff(u.x,.3,u.y,10,0xffffff,.2,1);break}
  case'mark':{const m=new THREE.Mesh(G3('mk',()=>new THREE.RingGeometry(.3,.4,24)),new THREE.MeshBasicMaterial({color:0x7ae8ff,transparent:true,opacity:.9,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.set(d.x,.05,d.y);decalG.add(m);DECALS.push({m,life:.6,max:.6,ring:1});break}
  case'whirl':{for(let i=0;i<36;i++){const a=i/36*TAU;part({x:d.x+Math.cos(a)*.3,y:.4,z:d.y+Math.sin(a)*.3,vx:Math.cos(a)*4,vy:.3,vz:Math.sin(a)*4,life:.45,max:.45,sz:.14,c:0xfff3a0,add:true,drag:.9})}
    const m=new THREE.Mesh(G3('wh',()=>new THREE.RingGeometry(.8,1,40)),new THREE.MeshBasicMaterial({color:0xffe08a,transparent:true,opacity:.9,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.set(d.x,.06,d.y);decalG.add(m);DECALS.push({m,life:.5,max:.5,ring:1,grow:1.7});break}
  case'blizzard':for(let i=0;i<160;i++)part({x:rand(0,COLS),y:rand(2,6),z:rand(0,ROWS),vx:rand(-.5,.5),vy:-rand(1.5,3),vz:rand(-.2,.2),life:rand(1,2),max:2,sz:rand(.05,.1),c:0xe8fbff,add:true});break;
}}

// ---------- Szene ----------
let TILETEX=null,beam=null,decorG,bldG,enG,projG,staticG,ghostG,gridIM=null,castleP=null,castleKey=0,selRing,rangeG,hoverTile,meteorRing,snow=null,clouds=[];
const BM=new Map(),EM=new Map(),PM=new Map();
function initScene(){
  renderer=new THREE.WebGLRenderer({canvas:cv,antialias:true,powerPreference:'high-performance'});renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  scene=new THREE.Scene();raycaster=new THREE.Raycaster();plane0=new THREE.Plane(new THREE.Vector3(0,1,0),0);
  camera=C3.ortho?new THREE.OrthographicCamera(-10,10,10,-10,.1,300):new THREE.PerspectiveCamera(36,1,.1,300);
  const d=new Uint8Array([95,175,255]);GRAD=new THREE.DataTexture(d,3,1,THREE.LuminanceFormat);GRAD.minFilter=GRAD.magFilter=THREE.NearestFilter;GRAD.generateMipmaps=false;GRAD.needsUpdate=true;
  OUTM=new THREE.MeshBasicMaterial({color:0x1b1430,side:THREE.BackSide});
  GLOWTEX=canvasTex(64,64,(g)=>{const q=g.createRadialGradient(32,32,0,32,32,32);q.addColorStop(0,'rgba(255,255,255,1)');q.addColorStop(.25,'rgba(255,255,255,.55)');q.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=q;g.fillRect(0,0,64,64)});
  SOFTTEX=canvasTex(32,32,(g)=>{const q=g.createRadialGradient(16,16,0,16,16,16);q.addColorStop(0,'rgba(255,255,255,1)');q.addColorStop(.6,'rgba(255,255,255,.7)');q.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=q;g.fillRect(0,0,32,32)});
  COINTEX=canvasTex(32,32,(g)=>{g.beginPath();g.arc(16,16,13,0,TAU);g.fillStyle='#f0a010';g.fill();g.lineWidth=3;g.strokeStyle='#3a2408';g.stroke();g.beginPath();g.arc(16,16,8,0,TAU);g.fillStyle='#ffd648';g.fill()});
  hemi=new THREE.HemisphereLight(0xdff3ff,WIN?0x8090b0:0x4a6a2a,.6);scene.add(hemi);
  sun=new THREE.DirectionalLight(0xfff1d6,1);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);const sc=sun.shadow.camera;sc.left=-18;sc.right=18;sc.top=14;sc.bottom=-14;sc.near=1;sc.far=90;sun.shadow.bias=-.0006;sun.shadow.normalBias=.02;
  scene.add(sun,sun.target);sun.target.position.set(11,0,6.5);
  castleLight=new THREE.PointLight(0xffa850,0,7,2);castleLight.position.set(20.5,1.4,8.3);scene.add(castleLight);
  flashL=new THREE.PointLight(0xffa050,0,7,2);scene.add(flashL);
  staticG=new THREE.Group();decorG=new THREE.Group();bldG=new THREE.Group();enG=new THREE.Group();projG=new THREE.Group();partG=new THREE.Group();decalG=new THREE.Group();ghostG=new THREE.Group();
  unitG=new THREE.Group();scene.add(staticG,decorG,bldG,enG,projG,partG,decalG,ghostG,unitG);
  heroRing=new THREE.Mesh(new THREE.RingGeometry(.38,.48,32),new THREE.MeshBasicMaterial({color:0x7ae8ff,transparent:true,opacity:.95,depthWrite:false}));heroRing.rotation.x=-Math.PI/2;heroRing.visible=false;scene.add(heroRing);
  rallyFlag=new THREE.Group();rallyFlag.add(M3(CYL(.02,.02,.7,5),mat(0x3a2a1a),0,.35,0));rallyFlag.add(M3(BOX(.3,.18,.02),mat(0xc9303f),.15,.6,0));rallyFlag.visible=false;scene.add(rallyFlag);
  const ringM=new THREE.MeshBasicMaterial({color:0xffd23f,transparent:true,opacity:.9,depthWrite:false});
  selRing=new THREE.Mesh(new THREE.RingGeometry(.5,.6,32),ringM);selRing.rotation.x=-Math.PI/2;selRing.visible=false;scene.add(selRing);
  rangeG=new THREE.Group();const rr=new THREE.Mesh(new THREE.RingGeometry(.97,1,64),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.8,depthWrite:false}));
  const rd=new THREE.Mesh(new THREE.CircleGeometry(1,64),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.1,depthWrite:false}));rangeG.add(rr,rd);rangeG.rotation.x=-Math.PI/2;rangeG.position.y=.04;rangeG.visible=false;scene.add(rangeG);
  TILETEX=canvasTex(64,64,(g)=>{g.fillStyle='rgba(255,255,255,.35)';g.strokeStyle='#fff';g.lineWidth=6;g.beginPath();g.roundRect(5,5,54,54,10);g.fill();g.stroke()});
  hoverTile=new THREE.Mesh(new THREE.PlaneGeometry(.96,.96),new THREE.MeshBasicMaterial({map:TILETEX,color:0x6ee04a,transparent:true,opacity:1,depthWrite:false}));
  beam=new THREE.Mesh(new THREE.CylinderGeometry(.42,.46,3,16,1,true),new THREE.MeshBasicMaterial({color:0x6ee04a,transparent:true,opacity:.22,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending}));beam.visible=false;scene.add(beam);hoverTile.rotation.x=-Math.PI/2;hoverTile.position.y=.035;hoverTile.visible=false;scene.add(hoverTile);
  meteorRing=new THREE.Mesh(new THREE.RingGeometry(1.6,1.7,48),new THREE.MeshBasicMaterial({color:0xff8a2a,transparent:true,opacity:.9,depthWrite:false}));meteorRing.rotation.x=-Math.PI/2;meteorRing.position.y=.05;meteorRing.visible=false;scene.add(meteorRing);
  ov=document.createElement('canvas');ov.style.cssText='position:fixed;inset:0;pointer-events:none;z-index:1';cv.after(ov);og=ov.getContext('2d');
}
function buildStatic(){
  staticG.clear();const tex=paintGround();tex.anisotropy=renderer.capabilities.getMaxAnisotropy();
  const w=EB.x1-EB.x0,h=EB.z1-EB.z0,cx=(EB.x0+EB.x1)/2,cz=(EB.z0+EB.z1)/2;
  const topM=TOON?new THREE.MeshToonMaterial({map:tex,gradientMap:GRAD}):new THREE.MeshStandardMaterial({map:tex,roughness:1});
  if(WIN){const rockM=mat(0x8a7f9a),side=mat(0xb8c4da);const box=new THREE.Mesh(new THREE.BoxGeometry(w,1.2,h),[side,side,topM,rockM,side,side]);box.position.set(cx,-.6,cz);box.receiveShadow=true;staticG.add(box);
    const under=M3(new THREE.ConeGeometry(Math.max(w,h)*.56,7,7),mat(0x6a6080),cx,-4.7,cz,1,1,h/w*1.05);under.rotation.x=Math.PI;under.scale.set(1,1,h/w*1.2);staticG.add(under);
    for(let i=0;i<5;i++){const r=M3(DOD(rand(.4,.9)),mat(0x7a7090),cx+rand(-w*.7,w*.7),rand(-4,-1),cz+(i%2?-1:1)*rand(h*.6,h*.8));staticG.add(r)}
    const ice=M3(new THREE.CircleGeometry(1,32),mat(0xd8f2ff,{r:.15,m:.1,t:.75}),MAP.pond[0],.02,MAP.pond[1]+.1,1.78,1.15,1);ice.rotation.x=-Math.PI/2;ice.scale.set(1.78,1.15,1);staticG.add(ice);
    const n=1400,pos=new Float32Array(n*3);for(let i=0;i<n;i++){pos[i*3]=rand(EB.x0,EB.x1);pos[i*3+1]=rand(0,14);pos[i*3+2]=rand(EB.z0,EB.z1)}
    const gg=new THREE.BufferGeometry();gg.setAttribute('position',new THREE.BufferAttribute(pos,3));snow=new THREE.Points(gg,new THREE.PointsMaterial({color:0xffffff,size:.09,transparent:true,opacity:.9,depthWrite:false}));staticG.add(snow)}
  else{const gm=new THREE.Mesh(new THREE.PlaneGeometry(w,h),topM);gm.rotation.x=-Math.PI/2;gm.position.set(cx,0,cz);gm.receiveShadow=true;staticG.add(gm);
    const far=new THREE.Mesh(new THREE.PlaneGeometry(400,400),new THREE.MeshStandardMaterial({color:TH_.far,roughness:1}));far.rotation.x=-Math.PI/2;far.position.set(cx,-.02,cz);staticG.add(far);
    const water=new THREE.Mesh(new THREE.CircleGeometry(1,40),TH_.lava?new THREE.MeshStandardMaterial({color:0xc83a10,emissive:0xff3a00,emissiveIntensity:.55,roughness:.7}):new THREE.MeshStandardMaterial({color:0x3aa0e0,roughness:.08,metalness:.2,transparent:true,opacity:.88}));if(TH_.lava){const gl=glow(0xff5a10,3,.3);gl.position.set(0,0,.3);water.add(gl)}water.rotation.x=-Math.PI/2;const[wx,wz,wrx,wry]=MAP.pond;water.position.set(wx,.03,wz+.1);water.scale.set(wrx*.88,wry*.82,1);water.receiveShadow=true;staticG.add(water);
    if(MAP.theme!=='wueste'&&!TH_.lava)for(const[x,z]of[[wx-1.2,wz+.35],[wx+1.1,wz-.35],[wx+.4,wz+.6]])staticG.add(M3(CYL(.16,.16,.02,10),mat(0x5aae3a),x,.05,z,1,1,.7));
    clouds=[];for(let i=0;i<6;i++){const c=new THREE.Group();const cm=new THREE.MeshBasicMaterial({colorWrite:false,depthWrite:false});
      for(let k=0;k<4;k++){const s=new THREE.Mesh(SPH(rand(.9,1.5),1),cm);s.position.set(rand(-1.4,1.4),rand(-.2,.3),rand(-.8,.8));s.scale.y=.55;s.castShadow=true;c.add(s)}
      c.position.set(rand(-8,30),9,rand(-4,17));c.userData.v=rand(.25,.45);staticG.add(c);clouds.push(c)}}
  // Bäume außerhalb des Spielfelds
  const list=[],r=RNG(31);
  for(let z=EB.z0;z<EB.z1;z+=.9)for(let x=EB.x0;x<EB.x1;x+=.9){const tx=x+r()*.6,tz=z+r()*.6;
    if(tx>-.6&&tx<COLS+.6&&tz>-.6&&tz<ROWS+.6)continue;if(tx<.5&&tz>1.4&&tz<3.6)continue;
    const edge=WIN?Math.min(tx-EB.x0,EB.x1-tx,tz-EB.z0,EB.z1-tz):9;if(edge<.6)continue;
    if(r()<(WIN?.32:MAP.theme==='wueste'?.12:TH_.lava?.18:.55))list.push({x:tx,z:tz,v:Math.floor(r()*4),s:.9+r()*.4,ry:r()*TAU})}
  instTrees(list,staticG);
}
function buildDecor3(){
  decorG.clear();for(const d of decor){let o;if(d.t===TREE)o=outline(treeGroup(d.v,.95+((d.x*7+d.y*3)%5)*.05,d.x*1.7+d.y));else if(d.t===ROCK)o=outline(rockGroup(d.v));else o=crystalGroup();
    o.position.set(d.x+.5+d.ox,0,d.y+.5+d.oy*.5);o.userData.d=d;o.userData.tile={x:d.x,y:d.y};decorG.add(o)}
}
function syncCastle(){if(castleKey===S.castleLvl)return;castleKey=S.castleLvl;if(castleP)scene.remove(castleP.g);castleP=makeCastle(S.castleLvl);castleP.g.userData.castle=1;scene.add(castleP.g)}
function syncBuildings(){
  const seen=new Set();
  for(const b of S.buildings){seen.add(b);let o=BM.get(b);const key=b.t+b.l;if(!o||o.key!==key){if(o)bldG.remove(o.P.g);const P=makeB(b.t,b.l);P.g.position.set(b.x+.5,0,b.y+.5);P.g.userData.tile={x:b.x,y:b.y};bldG.add(P.g);o={P,key};BM.set(b,o)}
    const P=o.P,k=b.anim<1?1+Math.sin(b.anim*Math.PI)*.18*(1-b.anim)-(1-b.anim)*.3:1;P.g.scale.set(1+(1-k)*.4,k,1+(1-k)*.4);
    if(P.aim){const ry=Math.atan2(Math.cos(b.ang),Math.sin(b.ang));P.aim.rotation.y=ry}
    if(P.barrel)P.barrel.position.z=-b.recoil*.1;
    if(P.orb){P.orb.position.y=TH[b.t][b.l]+Math.sin(TIME*2.5+b.id*9)*.05;P.orb.rotation.y=TIME*1.5;if(b.t==='tesla')P.orb.scale.setScalar(1+b.recoil*.25)}
    if(P.ring){P.ring.rotation.x=Math.PI/2+Math.sin(TIME*1.3)*.4;P.ring.rotation.y=TIME;P.ring.position.y=P.orb.position.y}
    if(P.shards)P.shards.forEach((s,i)=>{const a=TIME*1.6+i*TAU/3;s.position.set(Math.cos(a)*.38,P.orb.position.y-.1+Math.sin(TIME*3+i)*.06,Math.sin(a)*.38)});
    if(P.blade&&S.wave>0)P.blade.rotation.x+=.15;
  }
  for(const[b,o]of BM)if(!seen.has(b)){bldG.remove(o.P.g);BM.delete(b)}
}
function syncEnemies(dt){
  const seen=new Set();
  for(const e of S.enemies){seen.add(e);let P=EM.get(e);if(!P){P=makeE(e);enG.add(P.g);EM.set(e,P);P.ry=Math.atan2(e.dx,e.dy)}
    const fly=e.fly?R.flyH(e)+Math.sin(e.ph*1.3)*.08:0,bob=e.fly?0:Math.abs(Math.sin(e.ph*2.2))*.04;
    P.g.position.set(e.x,fly+bob,e.y);const tr=Math.atan2(e.dx,e.dy);let da=((tr-P.ry+Math.PI*3)%TAU)-Math.PI;P.ry+=da*Math.min(1,dt*10);P.g.rotation.y=P.ry;
    const sw=Math.sin(e.ph*2.2)*.6;P.legs.forEach((l,i)=>l.rotation.x=(i%2?sw:-sw)*(e.type==='wolf'&&i>1?-1:1));
    P.wings.forEach((w,i)=>w.rotation.z=(i?-1:1)*Math.sin(e.ph*(e.type==='bat'?6:2.4))*.7);
    if(P.club)P.club.rotation.x=.7+Math.sin(e.ph*2.2)*.25;
    const hs=e.hit>0?1+e.hit*1.5:1;P.g.scale.setScalar(P.s*hs);P.ice.visible=e.slowT>0;
    if(P.mouth&&Math.random()<.35){const c=Math.sin(P.ry),s=Math.cos(P.ry),k=P.s;sparks(e.x+c*.85*k,fly+.3*k,e.y+s*.85*k,1,0xff8a2a,.6)}
    if(e.slowT>0&&Math.random()<dt*6)part({x:e.x+rand(-.15,.15),y:rand(.1,.5),z:e.y+rand(-.15,.15),vy:-.3,life:.6,max:.6,sz:.06,c:0xe0faff,add:true});
  }
  for(const[e,P]of EM)if(!seen.has(e)){enG.remove(P.g);EM.delete(e)}
}
const _a=new THREE.Vector3();
function syncProj(){
  const seen=new Set();
  for(const p of S.proj){seen.add(p);let o=PM.get(p);
    if(!o){if(p.k==='arrow'){o=new THREE.Group();const sh=M3(CYL(.012,.012,p.big?.5:.34,5),mat(0x6b3d18),0,0,0);sh.rotation.x=Math.PI/2;o.add(sh);const tp=M3(CONE(.03,.08,5),mat(0xd9d9e6,{m:.6}),0,0,p.big?.27:.19);tp.rotation.x=Math.PI/2;o.add(tp);o.add(M3(BOX(.07,.005,.07),mat(0xff5a4a),0,0,-.15))}
      else if(p.k==='ball')o=M3(SPH(.09,1),mat(0x2a2a34,{m:.6,r:.35}));
      else{o=M3(SPH(.08,1),mat(0xffffff,{e:0x9ff2ff,ei:1}));o.add(glow(0x8ae8ff,.9,.8))}
      o.userData.p=new THREE.Vector3(p.x,p.h,p.y);projG.add(o);PM.set(p,o)}
    _a.set(p.x,p.h,p.y);if(p.k==='arrow'&&_a.distanceToSquared(o.userData.p)>1e-6){const dir=_a.clone().sub(o.userData.p);o.position.copy(_a);o.lookAt(_a.clone().add(dir))}else o.position.copy(_a);o.userData.p.copy(_a);
    if(p.k==='frost'&&Math.random()<.6)part({x:p.x,y:p.h,z:p.y,life:.35,max:.35,sz:.1,c:0x9ff2ff,add:true});
  }
  // Meteore
  for(const m of S.meteors){let o=PM.get(m);if(!o){o=M3(SPH(.35,1),mat(0xffb040,{e:0xff6a10,ei:1.2}));o.add(glow(0xffa040,3,.9));projG.add(o);PM.set(m,o)}seen.add(m);
    o.position.set(lerp(m.x-5,m.x,m.t),lerp(10,.3,m.t),lerp(m.y-3,m.y,m.t));puff(o.position.x,o.position.y,o.position.z,1,0xff8a2a,.4,.3,true)}
  for(const[p,o]of PM)if(!seen.has(p)){projG.remove(o);PM.delete(p)}
}
let gridKey='';
function syncGhost(){
  const bs=S.buildSel,key=bs+'|'+S.buildings.length+'|'+decor.length;
  if(key!==gridKey){gridKey=key;if(gridIM){scene.remove(gridIM);gridIM=null}
    if(bs){const tiles=[];for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++)if(canPlace(bs,x,y))tiles.push([x,y]);
      gridIM=new THREE.InstancedMesh(G3('tile',()=>new THREE.PlaneGeometry(.9,.9)),new THREE.MeshBasicMaterial({map:TILETEX,color:DEF[bs].on?0x7ae8ff:0xffffff,transparent:true,opacity:DEF[bs].on?.9:.5,depthWrite:false}),Math.max(1,tiles.length));
      tiles.forEach(([x,y],i)=>{_m4.makeRotationX(-Math.PI/2).setPosition(x+.5,.03,y+.5);gridIM.setMatrixAt(i,_m4)});gridIM.count=tiles.length;scene.add(gridIM)}
    ghostG.clear();ghostG.userData.t=null}
  const h=S.hover;hoverTile.visible=false;ghostG.visible=false;rangeG.visible=false;beam.visible=false;
  if(bs&&h&&inG(h.x,h.y)){const ok=canPlace(bs,h.x,h.y)&&afford(DEF[bs].cost[0]);
    if(ghostG.userData.t!==bs+ok){ghostG.clear();const P=makeB(bs,1),gm=new THREE.MeshBasicMaterial({color:ok?0x8cff6a:0xff5a5a,transparent:true,opacity:.72,depthWrite:false});P.g.traverse(o=>{if(o.isMesh){o.material=gm;o.castShadow=false}if(o.isSprite)o.visible=false});ghostG.add(P.g);ghostG.userData.t=bs+ok}
    ghostG.visible=true;ghostG.position.set(h.x+.5,0,h.y+.5);hoverTile.visible=true;hoverTile.position.set(h.x+.5,.035,h.y+.5);hoverTile.material.color.set(ok?0x6ee04a:0xff4a4a);const pu=1+Math.sin(TIME*6)*.06;hoverTile.scale.set(pu,pu,1);
    beam.visible=true;beam.position.set(h.x+.5,1.5,h.y+.5);beam.material.color.set(ok?0x6ee04a:0xff4a4a);beam.material.opacity=.18+Math.sin(TIME*6)*.06;ghostG.position.y=.05+Math.sin(TIME*4)*.04;
    if(DEF[bs].k==='t')showRange(h.x+.5,h.y+.5,DEF[bs].lv[0].rng,ok)}
  const sb=S.sel&&S.sel.b;selRing.visible=!!(sb||(S.sel&&S.sel.castle));
  if(sb){selRing.position.set(sb.x+.5,.04,sb.y+.5);selRing.scale.setScalar(1);if(DEF[sb.t].k==='t')showRange(sb.x+.5,sb.y+.5,DEF[sb.t].lv[sb.l-1].rng,true)}
  else if(S.sel&&S.sel.castle){selRing.position.set(CASTLE_C[0],.04,CASTLE_C[1]);selRing.scale.setScalar(3.2);if(S.castleLvl>=3)showRange(CASTLE_C[0],CASTLE_C[1],4.6,true)}
  meteorRing.visible=!!(S.spellSel&&h);if(meteorRing.visible)meteorRing.position.set(h.fx,.05,h.fy);
}
function showRange(x,z,r,ok){rangeG.visible=true;rangeG.position.set(x,.04,z);rangeG.scale.set(r,r,1);rangeG.children.forEach(m=>m.material.color.set(ok?0xffffff:0xff5a5a))}

// ---------- Kamera ----------
const _ndc=new THREE.Vector2();
function groundAt(px,py){_ndc.set(px/W*2-1,-(py/H)*2+1);raycaster.setFromCamera(_ndc,camera);const p=new THREE.Vector3();return raycaster.ray.intersectPlane(plane0,p)?p:null}
function placeCam(){
  const sh=S&&S.shake?S.shake*.012:0;
  if(C3.ortho){const hh=8/cam.zoom,a=W/H;camera.left=-hh*a;camera.right=hh*a;camera.top=hh;camera.bottom=-hh;camera.position.set(cam.x+DIR.x*40+rand(-sh,sh),DIR.y*40,cam.z+DIR.z*40+rand(-sh,sh))}
  else{camera.aspect=W/H;const d=26/cam.zoom;camera.position.set(cam.x+DIR.x*d+rand(-sh,sh),DIR.y*d,cam.z+DIR.z*d+rand(-sh,sh))}
  camera.lookAt(cam.x,0,cam.z);camera.setViewOffset(W,H,0,(cam.bot-cam.top)/2,W,H);camera.updateProjectionMatrix();camera.updateMatrixWorld();
}
function fitCam(){
  cam.x=11;cam.z=6.6;cam.zoom=1;
  for(let it=0;it<3;it++){placeCam();let mx=0,my=0;for(const[x,y,z]of[[-.4,0,-.4],[22.4,0,-.4],[-.4,0,13.4],[22.4,0,13.4],[20.5,3.5,5.2]]){_a.set(x,y,z).project(camera);mx=Math.max(mx,Math.abs(_a.x));my=Math.max(my,Math.abs(_a.y))}
    const avail=(H-cam.top-cam.bot)/H;cam.zoom*=1/Math.max(mx/.97,my/avail)}
  cam.base=cam.zoom;placeCam();const a=groundAt(W/2,H/2),b=groundAt(W/2+50,H/2);cam.tilePx=a&&b?50/a.distanceTo(b):40;
  cam.force=false;if(cam.tilePx<30){cam.zoom*=30/cam.tilePx;cam.force=true;cam.x=6;placeCam()}
}
function clampCam(){cam.x=clamp(cam.x,0,22);cam.z=clamp(cam.z,0,13)}

// ---------- Rendern ----------
const _c1=new THREE.Color(),_c2=new THREE.Color();
const SKYW=[0xb9d4f2,0x141c40];
function render(dt){
  syncCastle();syncBuildings();syncEnemies(dt);syncProj();syncGhost();syncUnits(dt);
  const dl=dayLight(),n=night(),dusk=clamp(1-Math.abs(dl-.45)/.18,0,1);
  const az=S.dayT*TAU;sun.position.set(11+Math.cos(az+.7)*16,22,6.5+10+Math.sin(az+.7)*4);
  sun.intensity=lerp(.22,WIN?.95:1.05,dl);sun.color.set(n>.5?0x8aa0ff:dusk>.3?0xffb070:0xfff1d6);
  hemi.intensity=lerp(.28,WIN?.75:.6,dl);hemi.color.set(n>.5?0x5a6aa8:0xdff3ff);
  const SKY=WIN?SKYW:TH_.sky;_c1.set(SKY[0]).lerp(_c2.set(SKY[1]),1-dl);if(dusk>0)_c1.lerp(_c2.set(0xff9a5a),dusk*.35);if(!scene.background)scene.background=new THREE.Color();scene.background.copy(_c1);if(!WIN){if(!scene.fog)scene.fog=new THREE.Fog(0,40,90);scene.fog.color.copy(_c1)}
  castleLight.intensity=n*2.2*(1+Math.sin(TIME*14)*.08);
  flashL.intensity*=Math.pow(.02,dt);
  scene.traverseVisible(o=>{if(o.userData.glow)o.material.opacity=o.userData.base*(.45+.75*n)});
  if(castleP){castleP.flags.forEach((f,i)=>f.rotation.y=Math.sin(TIME*3+i)*.3);castleP.torches.forEach((t,i)=>t.scale.setScalar(1+Math.sin(TIME*17+i*2)*.12));if(castleP.aim)castleP.aim.rotation.y=Math.atan2(Math.cos(S.castleAng),Math.sin(S.castleAng))}
  for(const c of clouds){c.position.x+=c.userData.v*dt;if(c.position.x>34)c.position.x=-10}
  if(snow){const p=snow.geometry.attributes.position.array;for(let i=0;i<p.length;i+=3){p[i+1]-=dt*(.7+(i%7)*.08);p[i]+=Math.sin(TIME+i)*dt*.15;if(p[i+1]<0)p[i+1]=14}snow.geometry.attributes.position.needsUpdate=true}
  decorG.children.forEach(o=>{if(o.userData.d&&o.userData.d.t===TREE)o.rotation.z=Math.sin(TIME*1.3+o.position.x*.7)*.02});
  placeCam();renderer.render(scene,camera);drawOverlay();
}
function proj2(x,h,z){_a.set(x,h,z).project(camera);return[(_a.x+1)/2*W,(1-_a.y)/2*H,_a.z]}
const ICON3={};
function drawOverlay(){
  const g=og;g.setTransform(DPR,0,0,DPR,0,0);g.clearRect(0,0,W,H);
  for(const e of S.enemies)if(e.hp<e.max||e.boss){const P=EM.get(e);const hh=(e.fly?R.flyH(e):0)+(e.type==='dragon'?.7:e.type==='bat'?.4:1.0)*(P?P.s:1);const[x,y]=proj2(e.x,hh,e.y);
    const bw=e.boss?54:30,p=clamp(e.hp/e.max,0,1);g.fillStyle='#1a0e1e';g.beginPath();g.roundRect(x-bw/2-2,y-2,bw+4,8,4);g.fill();
    if(p>0){g.fillStyle=p>.5?'#6ee04a':p>.25?'#ffc93c':'#ff4a4a';g.beginPath();g.roundRect(x-bw/2,y,bw*p,4,2);g.fill()}}
  for(const u of S.units)if(!u.dead&&(u.hp<u.max||u.k==='hero')){const[x,y]=proj2(u.x,u.k==='hero'?1.35:.9,u.y),bw=u.k==='hero'?40:24,p=clamp(u.hp/u.max,0,1);
    g.fillStyle='#0e1430';g.beginPath();g.roundRect(x-bw/2-2,y-2,bw+4,8,4);g.fill();g.fillStyle=p>.35?'#5fd0ff':'#ff7a4a';g.beginPath();g.roundRect(x-bw/2,y,bw*p,4,2);g.fill();
    if(u.k==='hero'){g.font=`13px ${FONT3}`;g.textAlign='center';g.lineWidth=3;g.strokeStyle='#1c1230';const sl=trx('Stufe '+u.lvl);g.strokeText(sl,x,y-9);g.fillStyle='#ffd23f';g.fillText(sl,x,y-9)}}
  for(const b of BOLTS){const a=b.life/b.max,pts=b.pts.map(([x,y,h])=>proj2(x,h,y));for(const[w,c]of[[7,`rgba(150,120,255,${.35*a})`],[2.4,`rgba(230,245,255,${a})`]]){g.strokeStyle=c;g.lineWidth=w;g.lineJoin='round';g.beginPath();g.moveTo(pts[0][0],pts[0][1]);
    for(let i=1;i<pts.length;i++){const[x0,y0]=pts[i-1],[x1,y1]=pts[i];for(let k=1;k<=5;k++){const t=k/5,j=k<5?7:0;g.lineTo(lerp(x0,x1,t)+rand(-j,j),lerp(y0,y1,t)+rand(-j,j))}}g.stroke()}}
  g.textAlign='center';g.textBaseline='middle';
  for(const t of TEXTS){const a=clamp(t.life/t.max*1.6,0,1),rise=(1-t.life/t.max)*.8,[x,y]=proj2(t.x,t.h+rise,t.y),sz=Math.max(15,cam.tilePx*cam.zoom/cam.base*.4);g.globalAlpha=a;g.font=`${sz}px ${FONT3}`;g.lineWidth=4;g.strokeStyle='#1c1230';
    const tx=x+(t.k?sz*.45:0);g.strokeText(t.txt,tx,y);g.fillStyle=t.k==='g'?'#ffd23f':t.k==='w'?'#ffb070':t.k==='c'?'#7ae8ff':'#ff5a6a';g.fillText(t.txt,tx,y);
    const ic=ICON3[t.k];if(ic&&ic.complete&&ic.naturalWidth)g.drawImage(ic,tx-g.measureText(t.txt).width/2-sz*.95,y-sz*.45,sz*.9,sz*.9)}
  g.globalAlpha=1;
  if(S.buildSel&&S.hover&&!confirmAt&&inG(S.hover.x,S.hover.y)){const d=DEF[S.buildSel];if(d.adj&&canPlace(S.buildSel,S.hover.x,S.hover.y)){const n=countAdj(S.hover.x,S.hover.y,d.adj),[x,y]=proj2(S.hover.x+.5,1.8,S.hover.y+.5);
    g.font=`16px ${FONT3}`;g.lineWidth=4;g.strokeStyle='#1c1230';const s=trx(n?`+${n*(d.adjB==='g'?2:1)} Bonus`:'kein Bonus');g.strokeText(s,x,y);g.fillStyle=n?'#b9f58d':'#ffd0d0';g.fillText(s,x,y)}}
  if(S.castleHit>0){g.fillStyle=`rgba(255,40,60,${S.castleHit*.35})`;g.fillRect(0,0,W,H)}
  if(S.frostFlash>0){g.fillStyle=`rgba(180,240,255,${S.frostFlash*.4})`;g.fillRect(0,0,W,H)}
  if(FLASH>0){g.fillStyle=`rgba(255,200,120,${FLASH})`;g.fillRect(0,0,W,H)}
  const v=g.createRadialGradient(W/2,H/2,Math.min(W,H)*.4,W/2,H/2,Math.max(W,H)*.75);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,WIN?'rgba(20,20,60,.35)':'rgba(10,20,5,.3)');g.fillStyle=v;g.fillRect(0,0,W,H);
}

// ---------- Vorschaubilder ----------
let thumbScene=null,thumbCam=null,thumbRT=null;
function thumb(t,c){
  if(!thumbScene){thumbScene=new THREE.Scene();thumbScene.add(new THREE.HemisphereLight(0xffffff,0x667744,.8));const dl=new THREE.DirectionalLight(0xffffff,.9);dl.position.set(2,4,3);thumbScene.add(dl);
    thumbCam=new THREE.PerspectiveCamera(30,144/116,.1,30);thumbCam.position.set(1.9,2.1,2.9);thumbCam.lookAt(0,.72,0);thumbRT=new THREE.WebGLRenderTarget(288,232)}
  const P=makeB(t,1);P.g.traverse(o=>{if(o.isSprite)o.visible=false});thumbScene.add(P.g);
  renderer.setRenderTarget(thumbRT);renderer.setClearColor(0x000000,0);renderer.clear();renderer.render(thumbScene,thumbCam);
  const buf=new Uint8Array(288*232*4);renderer.readRenderTargetPixels(thumbRT,0,0,288,232,buf);renderer.setRenderTarget(null);thumbScene.remove(P.g);
  const tmp=document.createElement('canvas');tmp.width=288;tmp.height=232;const tg=tmp.getContext('2d'),id=tg.createImageData(288,232);
  for(let y=0;y<232;y++)id.data.set(buf.subarray((231-y)*288*4,(232-y)*288*4),y*288*4);tg.putImageData(id,0,0);const g=c.getContext('2d');g.clearRect(0,0,c.width,c.height);g.drawImage(tmp,0,0,c.width,c.height);
}

// ---------- Schnittstelle ----------
const R={
  panHint:tr('Ziehen verschiebt die Karte, zwei Finger zoomen. Die Burg liegt rechts.'),
  init(){initScene();for(const k of['g','w','c','h']){const el=document.createElement('i');el.className='ic '+k;document.body.appendChild(el);const u=getComputedStyle(el).backgroundImage.slice(5,-2).replace(/\\"/g,'"');el.remove();const im=new Image();im.src=u;ICON3[k]=im}this.resize()},
  resize(){DPR=Math.min(window.devicePixelRatio||1,2);W=innerWidth;H=innerHeight;renderer.setPixelRatio(Math.min(DPR,1.75));renderer.setSize(W,H);ov.width=W*DPR;ov.height=H*DPR;ov.style.width=W+'px';ov.style.height=H+'px';
    const narrow=W<=720;cam.top=narrow?(W<470?84:50):60;cam.bot=narrow?118:(H<=500?96:120);fitCam()},
  rebuild(w){if(w==='all'){setTheme(MAP.theme);buildStatic();for(const[,P]of UM)unitG.remove(P.g);UM.clear();for(const[,o]of BM)bldG.remove(o.P.g);BM.clear();castleKey=0;for(const p of PARTS){p.sp.visible=false;FREE.push(p.sp)}PARTS.length=TEXTS.length=BOLTS.length=0}buildDecor3();gridKey=''},
  tick(dt){
    for(let i=PARTS.length-1;i>=0;i--){const p=PARTS[i];p.vx*=p.drag;p.vz*=p.drag;p.vy=p.vy*p.drag+p.g*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;p.life-=dt;
      if(p.y<.02&&p.g<0){p.y=.02;p.vy*=-.3;p.vx*=.6;p.vz*=.6}
      if(p.life<=0){p.sp.visible=false;FREE.push(p.sp);PARTS.splice(i,1);continue}const a=p.life/p.max;p.sp.position.set(p.x,p.y,p.z);const s=p.sz+p.grow*(1-a);p.sp.scale.set(s,s,1);p.sp.material.opacity=p.a*Math.min(1,a*1.5)}
    for(const k of[TEXTS,BOLTS]){for(let i=k.length-1;i>=0;i--){k[i].life-=dt;if(k[i].life<=0)k.splice(i,1)}}
    for(let i=DECALS.length-1;i>=0;i--){const d=DECALS[i];d.life-=dt;d.m.material.opacity=(d.ring?.9:.45)*d.life/d.max;if(d.ring)d.m.scale.setScalar(1+(1-d.life/d.max)*(d.grow||.8));if(d.life<=0){decalG.remove(d.m);d.m.material.dispose();DECALS.splice(i,1)}}
    if(night()>.5&&!WIN&&Math.random()<dt*6&&PARTS.length<400)part({x:rand(0,COLS),y:rand(.3,1.2),z:rand(0,ROWS),vx:rand(-.3,.3),vy:rand(-.1,.1),vz:rand(-.3,.3),life:rand(2,4),max:4,sz:.12,c:0xeaff7a,add:true,a:.9});
    FLASH=Math.max(0,FLASH-dt*1.5);
    for(let i=FALL.length-1;i>=0;i--){const f=FALL[i];f.t+=dt;const k=Math.min(1,f.t/.75);f.o.rotation.z=f.ax*k*k*1.5;if(f.t>.75){f.o.position.y-=dt*.8;f.o.scale.multiplyScalar(1-dt*.8)}
      if(f.t>.75&&f.t-dt<=.75)puff(f.o.position.x+f.ax*-.8,.1,f.o.position.z,10,0xe0cfa8,.25,1.2);if(f.t>1.8){scene.remove(f.o);FALL.splice(i,1)}}
  },
  render,
  pick(cx,cy){const p=groundAt(cx,cy);if(!p)return null;const base={x:Math.floor(p.x),y:Math.floor(p.z),fx:p.x,fy:p.z};
    if(S.buildSel||S.spellSel||S.rallyFor||S.heroSel)return base;
    const objs=[unitG,bldG,decorG];if(castleP)objs.push(castleP.g);
    for(const h of raycaster.intersectObjects(objs,true)){if(h.object.isSprite||h.object.isInstancedMesh)continue;let o=h.object;while(o&&!o.userData.tile&&!o.userData.unit&&!o.userData.castle)o=o.parent;if(!o)continue;
      if(o.userData.unit)return{...base,unit:o.userData.unit};if(o.userData.castle)return{x:20,y:6,fx:20.5,fy:6.5};const t=o.userData.tile;return{x:t.x,y:t.y,fx:t.x+.5,fy:t.y+.5}}
    return base},
  toScreen(x,y,h){const[a,b]=proj2(x,h,y);return{x:a,y:b}},
  towerH(b){return TH[b.t]?TH[b.t][b.l]:1},
  flyH(e){return e.type==='dragon'?1.7:1.15},
  castleH(){return 2.6},
  fx,thumb,
  canPan(){return cam.force||cam.zoom>cam.base*1.02},
  pan(dx,dy){const a=groundAt(W/2,H/2),b=groundAt(W/2+dx,H/2+dy);if(!a||!b)return;cam.x-=b.x-a.x;cam.z-=b.z-a.z;clampCam()},
  zoom(f){cam.zoom=clamp(cam.zoom*f,cam.base*(cam.force?1:.9),cam.base*2.6);if(!this.canPan()){cam.x=lerp(cam.x,11,.3);cam.z=lerp(cam.z,6.6,.3)}clampCam()},
};
