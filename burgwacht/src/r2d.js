// 2D-Renderer "Klassik HD": Canvas, handgemachte Sprites, Wetter und Tiere.
const ctx=cv.getContext('2d');
const lc=document.createElement('canvas'),lx=lc.getContext('2d');
const bg=document.createElement('canvas'),bx=bg.getContext('2d');
const OL='#2b1d14',ESC=1.18;
let W=0,H=0,DPR=1,T=32,OX=0,OY=0;
const P={parts:[],texts:[],bolts:[],decals:[]};
const ICONS={};
function loadIcons(){for(const k of['g','w','c','h']){const el=document.createElement('i');el.className='ic '+k;document.body.appendChild(el);const u=getComputedStyle(el).backgroundImage.slice(5,-2).replace(/\\"/g,'"');el.remove();const im=new Image();im.src=u;ICONS[k]=im}}
function towerTop(b){return[b.x+.5,b.y-1+(TOPY[b.t]?TOPY[b.t][b.l]:1)]}
// ---------- Zeichen-Helfer ----------
function E(g,x,y,rx,ry,fill,st=OL,lw=.04){g.beginPath();g.ellipse(x,y,Math.max(rx,.001),Math.max(ry,.001),0,0,TAU);if(fill){g.fillStyle=fill;g.fill()}if(st){g.lineWidth=lw;g.strokeStyle=st;g.stroke()}}
function Pg(g,p,fill,st=OL,lw=.04){g.beginPath();g.moveTo(p[0],p[1]);for(let i=2;i<p.length;i+=2)g.lineTo(p[i],p[i+1]);g.closePath();if(fill){g.fillStyle=fill;g.fill()}if(st){g.lineWidth=lw;g.strokeStyle=st;g.stroke()}}
function RR(g,x,y,w,h,r,fill,st=OL,lw=.04){g.beginPath();g.roundRect(x,y,w,h,r);if(fill){g.fillStyle=fill;g.fill()}if(st){g.lineWidth=lw;g.strokeStyle=st;g.stroke()}}
function LG(g,x0,y0,x1,y1,...c){const q=g.createLinearGradient(x0,y0,x1,y1);c.forEach((s,i)=>q.addColorStop(i/(c.length-1),s));return q}
function RG(g,x,y,r,...c){const q=g.createRadialGradient(x-r*.3,y-r*.35,r*.05,x,y,r);c.forEach((s,i)=>q.addColorStop(i/(c.length-1),s));return q}
function shadow(g,x,y,rx,ry,a=.28){g.beginPath();g.ellipse(x,y,rx,ry,0,0,TAU);g.fillStyle=`rgba(20,30,10,${a})`;g.fill()}
function cyl(g,cx,top,bot,rx,ry,c,topc,brick=true){
  const side=()=>{g.beginPath();g.moveTo(cx-rx,top);g.lineTo(cx-rx,bot);g.ellipse(cx,bot,rx,ry,0,Math.PI,0,true);g.lineTo(cx+rx,top);g.closePath()};
  side();g.fillStyle=LG(g,cx-rx,0,cx+rx,0,c[2],c[1],c[0],c[2]);g.fill();
  if(brick){g.save();side();g.clip();g.strokeStyle='rgba(30,20,40,.22)';g.lineWidth=.022;let row=0;
    for(let y=top+.13;y<bot+ry;y+=.13,row++){g.beginPath();g.ellipse(cx,y,rx,ry,0,0,Math.PI);g.stroke();
      for(let k=0;k<5;k++){const a=(k+(row%2)*.5+.25)/5*Math.PI,xx=cx+Math.cos(a)*rx,yy=y+Math.sin(a)*ry;g.beginPath();g.moveTo(xx,yy);g.lineTo(xx,yy-.13);g.stroke()}}
    g.restore()}
  side();g.lineWidth=.04;g.strokeStyle=OL;g.stroke();
  if(topc)E(g,cx,top,rx,ry,topc);
}
function merlons(g,cx,y,rx,ry,n,c1,c2,h=.12,w=.13){
  const items=[];for(let i=0;i<n;i++){const a=i/n*TAU+.2;items.push([cx+Math.cos(a)*rx*.86,y+Math.sin(a)*ry*.86])}
  items.sort((a,b)=>a[1]-b[1]);
  for(const[x,yy]of items){RR(g,x-w/2,yy-h,w,h+.02,.02,c1,OL,.03);RR(g,x-w/2,yy-h,w,.035,.01,c2,null)}
}
function cone(g,cx,apex,base,rx,ry,c1,c2,c3){
  g.beginPath();g.moveTo(cx,apex);g.lineTo(cx-rx,base);g.ellipse(cx,base,rx,ry,0,Math.PI,0,true);g.closePath();
  g.fillStyle=LG(g,cx-rx,0,cx+rx,0,c2,c1,c3);g.fill();
  g.save();g.clip();g.strokeStyle='rgba(0,0,0,.18)';g.lineWidth=.025;for(let i=1;i<6;i++){const xx=cx-rx+i*rx/3;g.beginPath();g.moveTo(cx,apex);g.lineTo(xx,base+ry);g.stroke()}g.restore();
  g.beginPath();g.moveTo(cx,apex);g.lineTo(cx-rx,base);g.ellipse(cx,base,rx,ry,0,Math.PI,0,true);g.closePath();g.lineWidth=.04;g.strokeStyle=OL;g.stroke();
}
const STONE=['#d9d4e6','#a9a3bd','#6e6888'],STONE2=['#ece6d6','#bdb299','#7f7460'],DARK=['#8a8aa6','#5d5c7a','#36354d'],WOOD=['#d99a5b','#a8652c','#6b3d18'];

// ---------- Sprites ----------
const SPR=new Map();
function spr(key,w,h,fn){let s=SPR.get(key);if(s)return s;const c=document.createElement('canvas');c.width=Math.ceil(w*T*DPR);c.height=Math.ceil(h*T*DPR);const g=c.getContext('2d');g.scale(T*DPR,T*DPR);g.lineJoin='round';g.lineCap='round';fn(g);s={c,w,h};SPR.set(key,s);return s}
function treeSpr(v){return spr('tree'+v,1.3,1.75,g=>{
  shadow(g,.65,1.55,.48,.16,.3);
  if(v===3){RR(g,.58,1.2,.14,.36,.04,'#7a4a22');
    [[.95,.5,.5],[.72,.4,.4],[.5,.3,.3]].forEach(([y,w,h])=>Pg(g,[.65,y-h-.22,.65+w,y+.3,.65-w,y+.3],LG(g,.15,0,1.15,0,'#2f7a3c','#3f9e48','#1f5a2c')));
    Pg(g,[.65,.06,.78,.3,.52,.3],'#58c068',null);return}
  RR(g,.56,1.05,.18,.5,.05,LG(g,.56,0,.74,0,'#8a5428','#6b3d18'));
  const cols=v===1?['#a6e05a','#6cbf3c','#3b8a2e']:v===2?['#c6e85a','#8cc63a','#4d8f26']:['#8fe068','#56b848','#2b7d34'];
  const blobs=[[.65,.62,.42],[.36,.86,.3],[.94,.86,.3],[.65,.98,.34]];
  for(const[x,y,r]of blobs)E(g,x,y,r,r*.92,cols[2],OL,.05);
  for(const[x,y,r]of blobs)E(g,x,y-.03,r*.95,r*.86,RG(g,x,y-.03,r,cols[0],cols[1],cols[2]),null);
  E(g,.52,.45,.12,.08,'rgba(255,255,220,.45)',null);E(g,.3,.76,.06,.04,'rgba(255,255,220,.35)',null);
  if(v===2){for(const[x,y]of[[.5,.7],[.82,.62],[.7,.95],[.38,.98]])E(g,x,y,.045,.045,'#ff5a4a',OL,.02)}
})}
function rockSpr(v){return spr('rock'+v,1.2,1.1,g=>{
  shadow(g,.6,.92,.48,.15);
  const p=v%2?[.18,.9,.25,.55,.45,.35,.75,.38,.98,.6,1.02,.88]:[.15,.88,.3,.5,.62,.3,.9,.48,1.05,.86];
  Pg(g,p,LG(g,0,.3,0,.95,'#d6d2e0','#9a95ad','#6c6782'),OL,.05);
  Pg(g,[.3,.52,.62,.32,.7,.5,.45,.62],'rgba(255,255,255,.35)',null);
  E(g,.75,.82,.16,.05,'#6fbf4a',null);E(g,.35,.85,.1,.04,'#5aa83e',null);
})}
function crySpr(){return spr('cry',1.2,1.4,g=>{
  shadow(g,.6,1.18,.46,.15);
  const pr=(x,b,h,w,c1,c2)=>{Pg(g,[x-w,b,x-w,b-h,x,b-h-w*1.3,x+w,b-h,x+w,b],LG(g,x-w,0,x+w,0,c1,c2),OL,.04);Pg(g,[x-w,b-h,x,b-h-w*1.3,x,b],'rgba(255,255,255,.35)',null)};
  pr(.34,1.12,.3,.12,'#a26bff','#5a2fc0');pr(.86,1.1,.36,.13,'#6ad8ff','#2a7ad8');pr(.6,1.16,.62,.16,'#9ff2ff','#2fa8e8');pr(.47,1.2,.2,.09,'#c9a0ff','#7a46e0');
})}
const TOPY={archer:[0,1.02,.9,.74],cannon:[0,1.2,1.1,1.0],frost:[0,.6,.48,.32],tesla:[0,.56,.44,.3]};
const BD={
  archer(g,l){
    shadow(g,.7,1.74,.56,.18);
    if(l===1){cyl(g,.7,1.48,1.7,.46,.15,STONE2,'#cfc3a6');
      for(const x of[.36,.56,.84,1.04])RR(g,x-.04,1.0,.08,.52,.02,LG(g,x-.04,0,x+.04,0,WOOD[0],WOOD[2]));
      g.strokeStyle=WOOD[2];g.lineWidth=.035;g.beginPath();g.moveTo(.36,1.1);g.lineTo(1.04,1.4);g.moveTo(1.04,1.1);g.lineTo(.36,1.4);g.stroke();
      cyl(g,.7,1.0,1.07,.5,.16,WOOD,'#e8b277',false);
      g.strokeStyle='rgba(90,50,20,.5)';g.lineWidth=.02;for(let i=-3;i<=3;i++){g.beginPath();g.moveTo(.7+i*.13,.86);g.lineTo(.7+i*.13,1.14);g.stroke()}
    }else{const top=TOPY.archer[l];cyl(g,.7,top,1.7,.44,.15,l===3?STONE:STONE2,l===3?'#d8d3e6':'#d6ccb2');
      if(l===3){g.fillStyle='#e8a90c';g.fillRect(.26,1.18,.88,.06);g.strokeStyle=OL;g.lineWidth=.03;g.strokeRect(.26,1.18,.88,.06)}
      RR(g,.6,1.25,.2,.25,.08,'#3a2a1a');
      merlons(g,.7,top,.44,.15,8,l===3?'#c7c1d8':'#cdbf9e','#efe9da');
      if(l===3){for(const x of[.36,1.04]){Pg(g,[x-.08,top+.12,x+.08,top+.12,x+.08,top+.5,x,top+.42,x-.08,top+.5],'#3d6ae8',OL,.03);E(g,x,top+.26,.03,.03,'#ffd23f',null)}}
    }
  },
  cannon(g,l){
    shadow(g,.7,1.74,.6,.19);const top=TOPY.cannon[l];
    cyl(g,.7,top,1.68,.56,.2,l===3?DARK:STONE,l===3?'#a6a5c2':'#d8d3e6');
    if(l>=2){g.fillStyle=l===3?'#e8a90c':'#7d7a92';g.fillRect(.14,top+.22,1.12,.06);g.strokeStyle=OL;g.lineWidth=.03;g.strokeRect(.14,top+.22,1.12,.06)}
    merlons(g,.7,top,.56,.2,10,l===3?'#8a89a8':'#c7c1d8','#ecebf5',.11,.12);
    for(const[x,y]of[[1.06,1.62],[1.22,1.56]])E(g,x,y,.07,.07,'#2c2c3a',OL,.03);
  },
  frost(g,l){
    shadow(g,.7,1.74,.5,.16);const top=TOPY.frost[l]+.2;
    cyl(g,.7,1.38,1.7,.46,.15,STONE,'#d8d3e6');
    g.beginPath();g.moveTo(.42,1.42);g.lineTo(.54,top);g.lineTo(.86,top);g.lineTo(.98,1.42);g.closePath();g.fillStyle=LG(g,.42,0,.98,0,'#4a3aa0','#7b68e0','#3a2a80');g.fill();g.lineWidth=.04;g.strokeStyle=OL;g.stroke();
    g.strokeStyle='rgba(160,230,255,.7)';g.lineWidth=.03;g.beginPath();g.moveTo(.7,1.36);g.lineTo(.7,top+.1);g.stroke();
    for(let i=0;i<3;i++){const y=lerp(1.3,top+.15,i/2.5);E(g,.7,y,.035,.035,'#9ff2ff',null)}
    Pg(g,[.48,top+.04,.92,top+.04,.84,top-.08,.56,top-.08],'#c9b8ff',OL,.035);
    for(const s of[-1,1])Pg(g,[.7+s*.16,top-.05,.7+s*.3,top-.32,.7+s*.2,top-.06],'#9ff2ff',OL,.03);
    if(l>=2)E(g,.7,1.38,.5,.17,null,'#5fe3ff',.035);
    if(l===3)for(const s of[-1,1])Pg(g,[.7+s*.42,1.0,.7+s*.5,.86,.7+s*.58,1.0,.7+s*.5,1.14],'#5fe3ff',OL,.03);
  },
  tesla(g,l){
    shadow(g,.7,1.74,.52,.17);const top=TOPY.tesla[l]+.18;
    cyl(g,.7,1.36,1.7,.48,.16,DARK,'#9897b4');
    for(const s of[-1,1]){g.beginPath();g.moveTo(.7+s*.4,1.42);g.lineTo(.7+s*.12,top+.18);g.lineWidth=.07;g.strokeStyle=OL;g.stroke();g.lineWidth=.04;g.strokeStyle='#7a7896';g.stroke()}
    RR(g,.58,top+.06,.24,1.36-top,.05,LG(g,.58,0,.82,0,'#7a4a1a','#e8913a','#7a4a1a'));
    g.strokeStyle='#ffd29a';g.lineWidth=.025;for(let y=top+.14;y<1.36;y+=.07){g.beginPath();g.moveTo(.58,y);g.lineTo(.82,y+.03);g.stroke()}
    RR(g,.5,top,.4,.08,.03,'#5d5c7a');
    if(l>=2)RR(g,.46,1.0,.48,.07,.03,'#e8a90c');
  },
  saw(g,l){
    shadow(g,.7,1.74,.62,.18);
    RR(g,.12,1.0,.96,.7,.03,LG(g,0,1,0,1.7,'#d99a5b','#a8652c'));
    g.strokeStyle='rgba(80,40,10,.45)';g.lineWidth=.022;for(let y=1.12;y<1.7;y+=.12){g.beginPath();g.moveTo(.13,y);g.lineTo(1.07,y);g.stroke()}
    RR(g,.48,1.3,.24,.4,.04,'#4a2a12');
    Pg(g,[.02,1.06,.6,.55,1.18,1.06],LG(g,0,.55,0,1.06,l===3?'#5a8ae8':'#e85a3a',l===3?'#2a4aa8':'#a8301a'),OL,.045);
    g.strokeStyle='rgba(0,0,0,.2)';g.lineWidth=.025;for(let i=1;i<5;i++){g.beginPath();g.moveTo(.6-i*.11,.55+i*.1);g.lineTo(.6+i*.11,.55+i*.1);g.stroke()}
    const logs=l>=2?[[.95,1.62],[1.18,1.62],[1.07,1.5]]:[[1.0,1.62],[1.2,1.62]];
    for(const[x,y]of logs){RR(g,x-.22,y-.07,.22,.14,.06,WOOD[1]);E(g,x,y,.06,.07,'#f0c27a',OL,.03)}
    if(l===3){RR(g,.2,.3,.08,.5,.02,'#6b3d18');Pg(g,[.28,.32,.5,.4,.28,.48],'#ffd23f',OL,.03)}
  },
  mine(g,l){
    shadow(g,.7,1.74,.64,.19);
    Pg(g,[.06,1.72,.16,1.2,.42,.86,.82,.8,1.14,1.06,1.34,1.72],LG(g,0,.8,0,1.72,'#b5a48a','#8a7a62','#5f523e'),OL,.05);
    E(g,.5,1.0,.12,.06,'rgba(255,255,255,.25)',null);E(g,.3,1.6,.18,.05,'#6fbf4a',null);E(g,1.1,1.62,.15,.05,'#6fbf4a',null);
    g.beginPath();g.moveTo(.46,1.72);g.lineTo(.46,1.3);g.quadraticCurveTo(.7,1.08,.94,1.3);g.lineTo(.94,1.72);g.closePath();g.fillStyle='#1c120a';g.fill();
    g.lineWidth=.08;g.strokeStyle=WOOD[1];g.stroke();g.lineWidth=.03;g.strokeStyle=OL;g.stroke();
    g.strokeStyle='#5a4a3a';g.lineWidth=.025;g.beginPath();g.moveTo(.56,1.72);g.lineTo(.6,1.42);g.moveTo(.84,1.72);g.lineTo(.8,1.42);g.stroke();
    RR(g,.86,1.44,.36,.2,.04,'#5d5c7a');for(const x of[.96,1.12])E(g,x,1.66,.05,.05,'#2c2c3a',OL,.02);
    for(const[x,y]of[[.94,1.42],[1.04,1.38],[1.14,1.42],[1.08,1.45]])E(g,x,y,.055,.045,'#ffd23f',OL,.02);
    if(l>=2){RR(g,.36,1.2,.03,.3,.01,OL);}
    if(l===3){Pg(g,[.6,.72,.8,.72,.8,.86,.6,.86],'#e8a90c',OL,.03)}
  },
  cmine(g,l){
    shadow(g,.7,1.74,.6,.18);
    for(const[x,h,w,c]of[[.42,.36,.14,'#9ff2ff'],[.98,.42,.15,'#c9a0ff'],[.7,.66,.18,'#6ad8ff']])
      Pg(g,[x-w,1.66,x-w,1.66-h,x,1.66-h-w*1.2,x+w,1.66-h,x+w,1.66],LG(g,x-w,0,x+w,0,c,'#2a6ad8'),OL,.04);
    g.strokeStyle=WOOD[2];g.lineWidth=.07;g.beginPath();g.moveTo(.2,1.72);g.lineTo(.7,.62);g.lineTo(1.2,1.72);g.stroke();
    g.strokeStyle=WOOD[0];g.lineWidth=.04;g.stroke();
    g.strokeStyle=WOOD[1];g.lineWidth=.045;g.beginPath();g.moveTo(.4,1.28);g.lineTo(1.0,1.28);g.stroke();
    RR(g,.6,.56,.2,.1,.03,'#5d5c7a');
    if(l>=2){g.strokeStyle='#e8e2d0';g.lineWidth=.015;g.beginPath();g.moveTo(.7,.66);g.lineTo(.7,1.0);g.stroke();RR(g,.64,1.0,.12,.1,.02,'#7a4a1a')}
    if(l===3)E(g,.7,1.66,.6,.18,null,'#c9a0ff',.035);
  },
};
function bSpr(t,l){return spr(`b_${t}_${l}`,1.4,2,g=>BD[t](g,l))}
function castleSpr(l){return spr('castle'+l,3.8,4.4,g=>{
  shadow(g,1.9,4.05,1.8,.42,.32);
  const roof=l===1?['#ff6a4a','#d23a2a','#8a1a10']:l===2?['#5a9aff','#2a5ad8','#12308a']:['#b07aff','#7a3ae0','#3e1a8a'];
  const st=l===3?['#e6e2f2','#b5b0cc','#77729a']:STONE;
  RR(g,.4,2.1,3.0,1.7,.04,LG(g,0,2.1,0,3.8,st[0],st[1],st[2]));
  g.strokeStyle='rgba(30,20,40,.18)';g.lineWidth=.025;for(let y=2.25;y<3.8;y+=.16){g.beginPath();g.moveTo(.42,y);g.lineTo(3.38,y);g.stroke()}
  for(let x=.45;x<3.36;x+=.27){RR(g,x,1.94,.17,.18,.02,st[1],OL,.03)}
  RR(g,1.15,1.0,1.5,2.95,.04,LG(g,1.15,0,2.65,0,st[1],st[0],st[2]));
  g.strokeStyle='rgba(30,20,40,.18)';for(let y=1.16;y<3.9;y+=.16){g.beginPath();g.moveTo(1.17,y);g.lineTo(2.63,y);g.stroke()}
  for(let x=1.18;x<2.6;x+=.25){RR(g,x,.84,.16,.18,.02,st[0],OL,.03)}
  for(const x of[1.5,2.3]){g.beginPath();g.moveTo(x-.1,1.75);g.lineTo(x-.1,1.5);g.arc(x,1.5,.1,Math.PI,0);g.lineTo(x+.1,1.75);g.closePath();g.fillStyle='#2a1a3a';g.fill();g.lineWidth=.03;g.strokeStyle=OL;g.stroke();g.fillStyle='rgba(255,200,90,.85)';g.fillRect(x-.06,1.56,.12,.15)}
  for(const cx of[.6,3.2]){cyl(g,cx,1.25,3.9,.42,.15,st,st[0]);cone(g,cx,.05,1.2,.52,.17,roof[0],roof[1],roof[2]);
    g.beginPath();g.moveTo(cx-.07,2.4);g.lineTo(cx-.07,2.2);g.arc(cx,2.2,.07,Math.PI,0);g.lineTo(cx+.07,2.4);g.closePath();g.fillStyle='#2a1a3a';g.fill();}
  g.beginPath();g.moveTo(1.48,4.0);g.lineTo(1.48,3.3);g.arc(1.9,3.3,.42,Math.PI,0);g.lineTo(2.32,4.0);g.closePath();g.fillStyle='#24140a';g.fill();g.lineWidth=.07;g.strokeStyle=st[2];g.stroke();g.lineWidth=.035;g.strokeStyle=OL;g.stroke();
  g.strokeStyle='#5a5a6e';g.lineWidth=.03;for(let x=1.58;x<2.3;x+=.12){g.beginPath();g.moveTo(x,3.1);g.lineTo(x,3.7);g.stroke()}for(let y=3.2;y<3.75;y+=.15){g.beginPath();g.moveTo(1.52,y);g.lineTo(2.28,y);g.stroke()}
  if(l>=2)for(const x of[.95,2.85]){Pg(g,[x-.13,2.2,x+.13,2.2,x+.13,2.85,x,2.75,x-.13,2.85],roof[1],OL,.03);E(g,x,2.42,.05,.05,'#ffd23f',null)}
  if(l===3){g.fillStyle='#e8a90c';g.fillRect(1.15,1.02,1.5,.06);g.fillRect(.4,2.12,3,.05)}
})}

// ---------- Hintergrund ----------
function buildBackground(){
  const BW=(BX1-BX0)*T,BH=(BY1-BY0)*T;bg.width=Math.ceil(BW*DPR);bg.height=Math.ceil(BH*DPR);const g=bx;g.setTransform(DPR,0,0,DPR,0,0);g.lineJoin='round';g.lineCap='round';
  const r=RNG(777);
  g.fillStyle=LG(g,0,0,0,BH,'#79c24c','#5aa83c','#4a9634');g.fillRect(0,0,BW,BH);
  for(let i=0;i<260*BW*BH/(W*H);i++){const x=r()*BW,y=r()*BH,rr=T*(1+r()*2.6);const q=g.createRadialGradient(x,y,0,x,y,rr);const c=r()<.5?'rgba(255,255,170,':'rgba(20,70,20,';q.addColorStop(0,c+(.05+r()*.07)+')');q.addColorStop(1,c+'0)');g.fillStyle=q;g.fillRect(x-rr,y-rr,rr*2,rr*2)}
  const n=Math.min(14000,(BW*BH)/(T*T)*40);
  for(let i=0;i<n;i++){const x=r()*BW,y=r()*BH,h=T*(.06+r()*.08);g.strokeStyle=['#8fd65a','#6cbf45','#4f9a36','#a6e070','#3f8a2e'][Math.floor(r()*5)];g.lineWidth=Math.max(1,T*.03);g.beginPath();g.moveTo(x,y);g.lineTo(x+(r()-.5)*h*.6,y-h);g.stroke()}
  g.setTransform(DPR*T,0,0,DPR*T,-DPR*BX0*T,-DPR*BY0*T);
  // Teich
  const px=10.5,py=11.95;
  E(g,px,py,2.05,1.38,'#e3cf94',null);E(g,px,py+.05,1.85,1.2,'#3d8ec2',OL,.05);
  E(g,px,py+.1,1.65,1.02,LG(g,0,py-1,0,py+1,'#5fc2ea','#2f78b8'),null);
  for(const[x,y,w]of[[9.8,11.5,.5],[11.1,12.1,.35],[10.4,12.4,.25]]){g.strokeStyle='rgba(255,255,255,.55)';g.lineWidth=.04;g.beginPath();g.moveTo(x-w/2,y);g.lineTo(x+w/2,y);g.stroke()}
  for(const[x,y]of[[9.3,12.2],[11.6,11.5]]){E(g,x,y,.2,.12,'#5aae3a',OL,.03);E(g,x+.05,y-.04,.05,.04,'#ff9ad0',null)}
  // Weg
  const pts=PATH.pts;
  const stroke=(w,c)=>{g.beginPath();g.moveTo(pts[0][0],pts[0][1]);for(const p of pts.slice(1))g.lineTo(p[0],p[1]);g.lineWidth=w;g.strokeStyle=c;g.stroke()};
  stroke(1.16,'rgba(40,50,20,.28)');stroke(1.04,'#a87a42');stroke(.92,'#d6ac6e');stroke(.6,'#e2bd82');stroke(.22,'rgba(255,240,200,.25)');
  for(const s of PATH.segs)for(let d=0;d<s.len;d+=.09){const off=(r()-.5)*.8,x=s.x0+s.ux*d-s.uy*off,y=s.y0+s.uy*d+s.ux*off;
    if(r()<.55)E(g,x,y,.025+r()*.04,.02+r()*.025,r()<.5?'#b58a55':'#f0d6a4',null)}
  for(const s of PATH.segs)for(let d=0;d<s.len;d+=.16)for(const side of[-1,1]){const off=side*(.47+r()*.05),x=s.x0+s.ux*d-s.uy*off,y=s.y0+s.uy*d+s.ux*off;
    g.strokeStyle=r()<.5?'#5aa83c':'#7cc84e';g.lineWidth=.035;g.beginPath();g.moveTo(x,y+.04);g.lineTo(x+(r()-.5)*.1,y-.1);g.stroke()}
  // Pflastersteine am Wegrand
  for(const s of PATH.segs)for(let d=0;d<s.len;d+=.3)for(const side of[-1,1]){if(r()<.35)continue;const off=side*(.43+r()*.04),x=s.x0+s.ux*d-s.uy*off,y=s.y0+s.uy*d+s.ux*off;
    E(g,x,y+.02,.07+r()*.03,.045,'rgba(60,40,20,.35)',null);E(g,x,y,.07+r()*.03,.045,r()<.5?'#c9bfa8':'#a89d86','rgba(60,40,20,.5)',.015)}
  // Blumen
  for(let i=0;i<90;i++){const x=r()*COLS,y=r()*ROWS,tx=Math.floor(x),ty=Math.floor(y);if(!inG(tx,ty)||grid[ty][tx]!==G)continue;
    const c=['#fff','#ffe14a','#ff8ac0','#b88aff'][Math.floor(r()*4)];for(let k=0;k<3;k++)E(g,x+(r()-.5)*.3,y+(r()-.5)*.2,.035,.03,c,null)}
  // Bäume außerhalb des Spielfelds
  const x0=BX0,x1=BX1,y0=BY0,y1=BY1;
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
    if(inG(x,y))continue;if(x<0&&y>=1&&y<=3)continue;
    if(r()<.55){const s=treeSpr(Math.floor(r()*4));g.drawImage(s.c,x+.5-.65+(r()-.5)*.3,y+.75-1.55,s.w,s.h)}
    else if(r()<.08){const s=rockSpr(Math.floor(r()*2));g.drawImage(s.c,x-.1,y-.2,s.w,s.h)}
  }
  const v=ctx.createRadialGradient(W/2,H/2,Math.min(W,H)*.35,W/2,H/2,Math.max(W,H)*.75);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(10,20,5,.45)');VIG=v;
}
let VIG=null,BX0=0,BX1=0,BY0=0,BY1=0,PAN=false,OXmin=0,OXmax=0;

// ---------- Gegner zeichnen ----------
let FL=false;const C=c=>FL?'#ffffff':c;
function drawEnemy(e){
  const g=ctx,s=e.sz*.95*ESC,lift=e.fly?(.62+Math.sin(e.ph*1.3)*.08)*e.sz:0;
  g.save();g.translate(e.x,e.y);
  shadow(g,0,.08,.22*s*(e.fly?.8:1),.07*s*(e.fly?.8:1),e.fly?.18:.3);
  g.translate(0,-lift);g.scale(e.dir*s,s);FL=e.hit>0;
  const w=Math.sin(e.ph*2.2),b=Math.abs(Math.sin(e.ph*2.2))*.03;
  switch(e.type){
    case'goblin':{
      for(const k of[-1,1])RR(g,k*.06-.03,-.02+(k*w>0?-.02:0),.06,.1,.02,C('#3a5a1a'));
      E(g,0,-.12-b,.12,.11,C('#8a5a2a'));
      Pg(g,[.1,-.14-b,.24,-.2-b,.26,-.12-b],C('#c9c9d6'),OL,.025);
      E(g,0,-.3-b,.14,.13,C('#7ccf4a'));
      Pg(g,[-.1,-.34-b,-.3,-.42-b,-.12,-.26-b],C('#6cbf3c'),OL,.03);Pg(g,[.1,-.34-b,.3,-.42-b,.12,-.26-b],C('#6cbf3c'),OL,.03);
      E(g,.05,-.32-b,.04,.035,C('#ffef5a'),null);E(g,.065,-.32-b,.018,.022,'#200',null);E(g,-.04,-.32-b,.035,.03,C('#ffef5a'),null);
      g.strokeStyle=OL;g.lineWidth=.02;g.beginPath();g.moveTo(.0,-.24-b);g.lineTo(.08,-.25-b);g.stroke();break}
    case'wolf':{
      for(const k of[-1,1])for(const f of[-.12,.1]){g.strokeStyle=C('#4a4a5a');g.lineWidth=.05;g.beginPath();g.moveTo(f,-.12);g.lineTo(f+k*w*.05,.02);g.stroke()}
      g.strokeStyle=C('#6a6a7c');g.lineWidth=.06;g.beginPath();g.moveTo(-.2,-.18);g.quadraticCurveTo(-.32,-.28+w*.04,-.36,-.16);g.stroke();
      E(g,-.02,-.17-b,.22,.1,C('#8a8a9e'));E(g,0,-.13-b,.14,.05,C('#b9b9c9'),null);
      E(g,.2,-.24-b,.1,.085,C('#9a9aae'));Pg(g,[.2,-.3-b,.36,-.24-b,.22,-.2-b],C('#9a9aae'),OL,.03);
      Pg(g,[.14,-.3-b,.16,-.42-b,.22,-.31-b],C('#6a6a7c'),OL,.025);
      E(g,.23,-.26-b,.022,.02,C('#ffd23f'),null);E(g,.36,-.24-b,.02,.02,'#111',null);break}
    case'orc':{
      for(const k of[-1,1])RR(g,k*.08-.04,-.05+(k*w>0?-.02:0),.08,.12,.03,C('#3a3020'));
      E(g,0,-.2-b,.17,.15,C('#4f8a3a'));RR(g,-.15,-.2-b,.3,.08,.03,C('#6b4a2a'));
      E(g,0,-.4-b,.13,.12,C('#5fa03f'));
      g.beginPath();g.ellipse(0,-.43-b,.14,.11,0,Math.PI,0);g.closePath();g.fillStyle=C('#8a8aa0');g.fill();g.lineWidth=.03;g.strokeStyle=OL;g.stroke();
      for(const k of[-1,1])Pg(g,[k*.12,-.48-b,k*.22,-.6-b,k*.16,-.44-b],C('#f0e6c8'),OL,.02);
      E(g,.06,-.38-b,.025,.02,C('#ff3a2a'),null);E(g,-.03,-.38-b,.022,.02,C('#ff3a2a'),null);
      Pg(g,[.03,-.31-b,.05,-.35-b,.07,-.31-b],'#fff',null);
      g.strokeStyle=C('#6b3d18');g.lineWidth=.04;g.beginPath();g.moveTo(.16,-.1-b);g.lineTo(.22,-.42-b);g.stroke();
      Pg(g,[.2,-.44-b,.34,-.46-b,.32,-.32-b,.21,-.34-b],C('#c9c9d6'),OL,.025);break}
    case'bat':{
      const f=Math.sin(e.ph*6)*.18;
      for(const k of[-1,1])Pg(g,[0,-.12,k*.14,-.2-f,k*.34,-.18-f*1.4,k*.28,-.08-f*.5,k*.18,-.1,k*.08,-.06],C('#6a3aa8'),OL,.03);
      E(g,0,-.1,.09,.1,C('#4a2a7a'));Pg(g,[-.06,-.17,-.08,-.25,-.02,-.18],C('#4a2a7a'),OL,.02);Pg(g,[.06,-.17,.08,-.25,.02,-.18],C('#4a2a7a'),OL,.02);
      E(g,.035,-.12,.02,.018,C('#ff4a4a'),null);E(g,-.03,-.12,.02,.018,C('#ff4a4a'),null);break}
    case'knight':{
      for(const k of[-1,1])RR(g,k*.07-.04,-.05+(k*w>0?-.02:0),.08,.12,.02,C('#4a4a5e'));
      RR(g,-.13,-.34-b,.26,.3,.06,C(LG(g,-.13,0,.13,0,'#9a9ab4','#e6e6f2','#7a7a94')));
      E(g,0,-.44-b,.12,.12,C(LG(g,-.12,0,.12,0,'#9a9ab4','#e6e6f2','#7a7a94')));
      g.fillStyle='#1a1a2a';g.fillRect(.0,-.46-b,.12,.03);
      g.strokeStyle=C('#e8303a');g.lineWidth=.06;g.beginPath();g.moveTo(-.02,-.55-b);g.quadraticCurveTo(-.15,-.66-b,-.2,-.5-b+w*.02);g.stroke();
      RR(g,.06,-.3-b,.16,.22,.05,C('#2a4aa8'));Pg(g,[.14,-.26-b,.18,-.19-b,.14,-.12-b,.1,-.19-b],C('#ffd23f'),null);
      g.strokeStyle=C('#d9d9e6');g.lineWidth=.035;g.beginPath();g.moveTo(-.14,-.2-b);g.lineTo(-.18,-.5-b);g.stroke();break}
    case'troll':{
      for(const k of[-1,1])RR(g,k*.09-.05,-.06+(k*w>0?-.025:0),.1,.12,.04,C('#4a5a6a'));
      E(g,0,-.24-b,.2,.2,C('#6a8a9e'));E(g,0,-.2-b,.13,.12,C('#8aa8b9'),null);
      RR(g,-.16,-.16-b,.32,.07,.03,C('#6b4a2a'));
      E(g,.06,-.46-b,.1,.09,C('#7a9aae'));
      E(g,.1,-.48-b,.022,.02,C('#ffd23f'),null);E(g,.03,-.48-b,.02,.018,C('#ffd23f'),null);
      Pg(g,[.06,-.41-b,.08,-.44-b,.1,-.41-b],'#fff',null);
      g.save();g.translate(.2,-.28-b);g.rotate(-.6+w*.15);RR(g,-.03,-.32,.07,.36,.03,C('#8a5428'));E(g,.005,-.32,.08,.07,C('#7a4a22'));g.restore();
      Pg(g,[-.06,-.62-b,.0,-.72-b,.06,-.62-b,.12,-.7-b,.16,-.6-b],C('#ffd23f'),OL,.02);break}
    case'dragon':{
      const f=Math.sin(e.ph*2.4)*.22;
      for(const k of[-1,1]){g.beginPath();g.moveTo(-.05,-.22);g.quadraticCurveTo(-.1,-.5-f*k*.2,-.05+k*.0,-.62-f);g.lineTo(-.4,-.42-f*.6);g.lineTo(-.3,-.24);g.closePath();g.fillStyle=C(k>0?'#c92a2a':'#9a1a1a');g.fill();g.lineWidth=.03;g.strokeStyle=OL;g.stroke()}
      g.strokeStyle=C('#b82424');g.lineWidth=.07;g.beginPath();g.moveTo(-.18,-.18);g.quadraticCurveTo(-.4,-.12,-.46,-.24+Math.sin(e.ph*2)*.04);g.stroke();
      Pg(g,[-.46,-.24,-.55,-.3,-.52,-.18],C('#ffd23f'),OL,.02);
      E(g,0,-.2,.2,.1,C('#d83a2a'));E(g,0,-.16,.14,.05,C('#ffc070'),null);
      g.strokeStyle=C('#d83a2a');g.lineWidth=.08;g.beginPath();g.moveTo(.14,-.22);g.quadraticCurveTo(.22,-.36,.26,-.36);g.stroke();
      E(g,.3,-.37,.09,.065,C('#e04a32'));Pg(g,[.34,-.4,.44,-.36,.34,-.33],C('#e04a32'),OL,.02);
      Pg(g,[.26,-.42,.22,-.52,.3,-.43],C('#f0e6c8'),OL,.015);
      E(g,.32,-.39,.02,.016,C('#ffef5a'),null);
      if(Math.random()<.3)part({x:e.x+e.dir*.5*e.sz,y:e.y-lift-.36*e.sz,vx:e.dir*rand(.5,1),vy:rand(-.2,.2),life:.4,max:.4,sz:rand(.06,.12),c:'#ff8a2a',k:'spark'});
      break}
  }
  FL=false;g.restore();
  if(e.hp<e.max||e.boss||e.elite){const bw=e.boss?.9:.5,y=e.y-lift-(e.boss?.85:.55)*e.sz-.04;
    RR(g,e.x-bw/2-.02,y-.02,bw+.04,.1,.05,e.elite?'#ffc93c':'#1a0e1e',null);
    if(e.elite)crown(g,e.x-bw/2-.1,y+.03,.11);
    const p=clamp(e.hp/e.max,0,1);if(p>0)RR(g,e.x-bw/2,y,bw*p,.06,.03,p>.5?'#6ee04a':p>.25?'#ffc93c':'#ff4a4a',null);}
}

// ---------- Live-Teile der Gebäude ----------
function drawBuildingLive(b){
  const g=ctx,[tx,ty]=towerTop(b);
  if(b.t==='archer'){
    const a=b.ang,bx_=tx,by=ty-.04;
    E(g,bx_,by+.02,.09,.06,'#2a4aa8');
    RR(g,bx_-.07,by-.16,.14,.16,.05,'#3d6ae8');E(g,bx_,by-.22,.075,.075,'#ffd2a8',OL,.025);
    g.beginPath();g.ellipse(bx_,by-.25,.085,.06,0,Math.PI,0);g.closePath();g.fillStyle='#2f8a3a';g.fill();g.lineWidth=.025;g.strokeStyle=OL;g.stroke();
    g.save();g.translate(bx_,by-.12);g.rotate(a);g.strokeStyle='#6b3d18';g.lineWidth=.035;g.beginPath();g.arc(.08,0,.14,-1.2,1.2);g.stroke();
    g.strokeStyle='#eee';g.lineWidth=.012;g.beginPath();const cxp=.08+Math.cos(1.2)*.14,cyp=Math.sin(1.2)*.14,pull=b.cd>DEF.archer.lv[b.l-1].rate*.6?0:-.06;g.moveTo(cxp,-cyp);g.lineTo(.02+pull,0);g.lineTo(cxp,cyp);g.stroke();g.restore();
  }else if(b.t==='cannon'){
    const a=b.ang,rc=b.recoil*.09,len=.42+b.l*.04;
    g.save();g.translate(tx,ty-.04);E(g,0,.02,.18,.1,'#4a3a2a');g.scale(1,.75);g.rotate(a);
    RR(g,-.1-rc,-.09-b.l*.01,len,.18+b.l*.02,.07,LG(g,0,-.1,0,.1,'#6a6a80','#2a2a3a','#1a1a24'));
    RR(g,len-.16-rc,-.11-b.l*.01,.08,.22+b.l*.02,.03,b.l===3?'#e8a90c':'#4a4a5e');g.restore();
    E(g,tx,ty-.06,.1,.08,'#3a3a4a');
    if(b.recoil>.75){const fx=tx+Math.cos(a)*(len+.05),fy=ty-.04+Math.sin(a)*.75*(len+.05);E(g,fx,fy,.14,.12,'rgba(255,220,120,.9)',null)}
  }else if(b.t==='frost'){
    const y=ty-.05+Math.sin(TIME*2.5+b.id*9)*.05,r=.1+b.l*.02;
    g.save();g.globalCompositeOperation='lighter';E(g,tx,y,r*2.2,r*2.2,RG(g,tx+r*.66,y+r*.77,r*2.2,'rgba(120,230,255,.55)','rgba(120,230,255,0)'),null);g.restore();
    E(g,tx,y,r,r,RG(g,tx,y,r,'#ffffff','#9ff2ff','#2fa8e8'),'#123048',.03);
    for(let i=0;i<b.l+1;i++){const a=TIME*2+i*TAU/(b.l+1);E(g,tx+Math.cos(a)*r*2,y+Math.sin(a)*r*.8,.025,.025,'#e0faff',null)}
  }else if(b.t==='tesla'){
    const y=ty-.06,r=.11+b.l*.02;
    E(g,tx,y,r,r,RG(g,tx,y,r,'#ffffff','#c9b8ff','#5a3ae0'),'#1a1240',.03);
    if(Math.random()<.5){g.strokeStyle='rgba(220,240,255,.9)';g.lineWidth=.02;g.beginPath();let px=tx,py=y;g.moveTo(px,py);const a=rand(0,TAU);for(let i=0;i<3;i++){px+=Math.cos(a)*.08+rand(-.04,.04);py+=Math.sin(a)*.08+rand(-.04,.04);g.lineTo(px,py)}g.stroke()}
  }else if(b.t==='saw'){
    const cx=b.x-.2+1.12,cy=b.y-1+1.28;g.save();g.translate(cx,cy);g.rotate(S.wave>0?TIME*8:0);
    g.beginPath();for(let i=0;i<12;i++){const a=i/12*TAU;g.lineTo(Math.cos(a)*.17,Math.sin(a)*.17);g.lineTo(Math.cos(a+.26)*.13,Math.sin(a+.26)*.13)}g.closePath();g.fillStyle='#d9d9e6';g.fill();g.lineWidth=.025;g.strokeStyle=OL;g.stroke();
    E(g,0,0,.04,.04,'#7a7a94',null);g.restore();
  }else if(b.t==='mine'&&b.l>=2){
    const x=b.x-.2+.375,y=b.y-1+1.2;E(g,x,y+.02,.045,.06,'#ffcf5a',OL,.02);
  }else if(b.t==='cmine'){
    const x=b.x+.5,y=b.y-1+1.2,p=.5+.5*Math.sin(TIME*3+b.id*5);
    g.save();g.globalCompositeOperation='lighter';E(g,x,y,.5,.38,RG(g,x+.15,y+.13,.5,`rgba(140,220,255,${.25+p*.2})`,'rgba(140,220,255,0)'),null);g.restore();
  }
}

// ---------- Rendern ----------
function setWorld(c,sx=0,sy=0){c.setTransform(DPR*T,0,0,DPR*T,DPR*(OX+sx),DPR*(OY+sy))}
function render(){
  const sx=S.shake?rand(-1,1)*S.shake:0,sy=S.shake?rand(-1,1)*S.shake:0;
  ctx.setTransform(DPR,0,0,DPR,0,0);ctx.fillStyle='#4a9634';ctx.fillRect(0,0,W,H);ctx.drawImage(bg,OX+BX0*T+sx,OY+BY0*T+sy,(BX1-BX0)*T,(BY1-BY0)*T);ctx.fillStyle=VIG;ctx.fillRect(0,0,W,H);
  setWorld(ctx,sx,sy);ctx.lineJoin='round';ctx.lineCap='round';
  for(const d of P.decals){const a=d.life/d.max;if(d.ring)E(ctx,d.x,d.y,d.r*(2-a),d.r*.5*(2-a),null,`rgba(220,235,255,${.6*a})`,.02);else E(ctx,d.x,d.y,d.r,d.r*.55,`rgba(40,25,10,${.35*a})`,null)}
  // Bauraster
  if(S.buildSel){const d=DEF[S.buildSel];for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++)if(canPlace(S.buildSel,x,y)){RR(ctx,x+.06,y+.06,.88,.88,.12,d.on?'rgba(120,230,255,.22)':'rgba(255,255,255,.08)','rgba(255,255,255,.22)',.025)}}
  drawWater();
  // Kristall-Leuchten am Boden
  for(const[x,y]of CRYS)if(!occ[y][x]){const p=.5+.5*Math.sin(TIME*2+x);ctx.save();ctx.globalCompositeOperation='lighter';E(ctx,x+.5,y+.75,.6,.3,RG(ctx,x+.68,y+.85,.6,`rgba(120,200,255,${.2+p*.15})`,'rgba(120,200,255,0)'),null);ctx.restore()}
  // Auswahlring
  const selB=S.sel&&S.sel.b;
  if(selB){E(ctx,selB.x+.5,selB.y+.78,.62,.24,'rgba(255,210,60,.25)','#ffd23f',.05)}
  // Tiefensortierte Liste
  const L=[];
  for(const d of decor)L.push({y:d.y+.75+d.oy,f:()=>{const s=d.t===TREE?treeSpr(d.v):d.t===ROCK?rockSpr(d.v%2):crySpr();
    const ox=d.t===TREE?.65:.6,oy=d.t===TREE?1.55:d.t===ROCK?.92:1.18;
    if(d.t===TREE){ctx.save();ctx.translate(d.x+.5+d.ox,d.y+.75+d.oy);ctx.rotate(Math.sin(TIME*1.3+d.x*.7+d.y)*.015);ctx.drawImage(s.c,-ox,-oy,s.w,s.h);ctx.restore()}
    else ctx.drawImage(s.c,d.x+.5+d.ox*.3-ox,d.y+.75-oy,s.w,s.h)}});
  for(const b of S.buildings)L.push({y:b.y+.78,f:()=>{const s=bSpr(b.t,b.l),k=b.anim<1?1+Math.sin(b.anim*Math.PI)*.18*(1-b.anim)-(1-b.anim)*.3:1;
    ctx.save();ctx.translate(b.x+.5,b.y+.78);ctx.scale(1+(1-k)*.4,k);ctx.drawImage(s.c,-.7,-1.78,s.w,s.h);ctx.restore();drawBuildingLive(b);
    if(b.l>1)for(let i=0;i<b.l;i++){const x=b.x+.5+(i-(b.l-1)/2)*.17,y=b.y+.95;Pg(ctx,[x,y-.07,x+.06,y,x,y+.07,x-.06,y],'#ffd23f',OL,.02)}}});
  L.push({y:8.05,f:drawCastle});
  for(const e of S.enemies)if(!e.fly)L.push({y:e.y,f:()=>drawEnemy(e)});
  L.sort((a,b)=>a.y-b.y);for(const o of L)o.f();
  // Geist-Vorschau
  if(S.buildSel&&S.hover){const{x,y}=S.hover;if(inG(x,y)){const ok=canPlace(S.buildSel,x,y)&&afford(DEF[S.buildSel].cost[0]);const d=DEF[S.buildSel];
    if(d.k==='t')rangeCircle(x+.5,y+.5,d.lv[0].rng,ok);
    ctx.globalAlpha=.7;const s=bSpr(S.buildSel,1);ctx.drawImage(s.c,x-.2,y-1,s.w,s.h);ctx.globalAlpha=1;
    RR(ctx,x+.04,y+.04,.92,.92,.14,ok?'rgba(110,230,80,.25)':'rgba(255,70,70,.3)',ok?'#6ee04a':'#ff4a4a',.05);
    if(d.adj&&ok&&!confirmAt){const n=countAdj(x,y,d.adj);ftextStatic(x+.5,y-1.15,trx(n?`+${n*(d.adjB==='g'?2:1)} Bonus`:'kein Bonus'),n?'#b9f58d':'#ffd0d0')}}}
  if(selB&&DEF[selB.t].k==='t'){const lv=DEF[selB.t].lv;rangeCircle(selB.x+.5,selB.y+.5,lv[selB.l-1].rng,true);if(selB.l<3)rangeNext(selB.x+.5,selB.y+.5,lv[selB.l].rng)}
  if(S.sel&&S.sel.castle&&S.castleLvl>=3)rangeCircle(20.5,6.5,4.6,true);
  // Flieger
  for(const e of S.enemies)if(e.fly)drawEnemy(e);
  // Projektile
  for(const p of S.proj){const py=p.y-p.h;
    if(p.k==='arrow'){const a=p._lx!=null&&(Math.abs(p.x-p._lx)+Math.abs(py-p._ly)>1e-4)?Math.atan2(py-p._ly,p.x-p._lx):(p.ang||0);p._lx=p.x;p._ly=py;
      ctx.save();ctx.translate(p.x,py);ctx.rotate(a);const l=p.big?.36:.26;ctx.strokeStyle='#5a3a1a';ctx.lineWidth=p.big?.045:.03;ctx.beginPath();ctx.moveTo(-l,0);ctx.lineTo(0,0);ctx.stroke();
      Pg(ctx,[0,0,-.07,-.035,-.07,.035],'#d9d9e6',null);Pg(ctx,[-l,0,-l-.06,-.04,-l+.04,0,-l-.06,.04],'#ff5a4a',null);ctx.restore()}
    else if(p.k==='ball'){const k=1-Math.min(1,p.h/2)*.3;E(ctx,p.x,p.y+.05,.08*k,.04*k,'rgba(0,0,0,.25)',null);E(ctx,p.x,py,.085,.085,RG(ctx,p.x,py,.085,'#8a8aa0','#2a2a3a','#111'),OL,.02)}
    else if(p.k==='frost'){ctx.save();ctx.globalCompositeOperation='lighter';E(ctx,p.x,py,.22,.22,RG(ctx,p.x+.066,py+.077,.22,'rgba(160,240,255,.8)','rgba(160,240,255,0)'),null);ctx.restore();E(ctx,p.x,py,.07,.07,'#fff',null);
      if(Math.random()<.6)part({x:p.x,y:py,vx:rand(-.2,.2),vy:rand(-.2,.2),life:.35,max:.35,sz:.07,c:'#9ff2ff',k:'spark'})}
  }
  for(const m of S.meteors){const x=lerp(m.x-4,m.x,m.t),y=lerp(m.y-7,m.y,m.t);E(ctx,m.x,m.y,1.7*m.t,.85*m.t,'rgba(255,80,20,.12)','rgba(255,120,40,.5)',.04);
    ctx.save();ctx.globalCompositeOperation='lighter';E(ctx,x,y,.7,.7,RG(ctx,x+.21,y+.245,.7,'rgba(255,200,80,.9)','rgba(255,90,20,0)'),null);ctx.restore();E(ctx,x,y,.26,.26,RG(ctx,x,y,.26,'#ffe08a','#ff7a1a','#7a2a08'),OL,.03)}
  // Blitze
  for(const b of P.bolts){const a=b.life/b.max;for(const[w,c]of[[.12,`rgba(150,120,255,${.35*a})`],[.04,`rgba(230,245,255,${a})`]]){ctx.strokeStyle=c;ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(b.pts[0][0],b.pts[0][1]);
    for(let i=1;i<b.pts.length;i++){const[x0,y0]=b.pts[i-1],[x1,y1]=b.pts[i];for(let k=1;k<=5;k++){const t=k/5;ctx.lineTo(lerp(x0,x1,t)+(k<5?rand(-.12,.12):0),lerp(y0,y1,t)+(k<5?rand(-.12,.12):0))}}ctx.stroke()}}
  // Partikel
  for(const p of P.parts){const a=clamp(p.life/p.max,0,1);
    if(p.k==='smoke'){ctx.globalAlpha=a;E(ctx,p.x,p.y,p.sz*(2-a),p.sz*(2-a),p.c,null)}
    else if(p.k==='spark'||p.k==='fly'){ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=p.k==='fly'?a*(.5+.5*Math.sin(TIME*6+p.x*9))*night():a;E(ctx,p.x,p.y,p.sz*(p.k==='fly'?2.5:1.6),p.sz*(p.k==='fly'?2.5:1.6),p.c,null);ctx.restore()}
    else if(p.k==='coin'){ctx.globalAlpha=a;E(ctx,p.x,p.y,p.sz*Math.abs(Math.cos(TIME*12+p.x*5))+.01,p.sz,'#ffd23f','#7a4a08',.02)}
    else if(p.k==='leaf'){ctx.globalAlpha=a;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(TIME*5+p.x*3);E(ctx,0,0,p.sz,p.sz*.5,p.c,null);ctx.restore()}
    else{ctx.globalAlpha=a;E(ctx,p.x,p.y,p.sz,p.sz,p.c,null)}}
  ctx.globalAlpha=1;
  drawAmbient();
  // Wolkenschatten
  const dl=dayLight();
  if(dl>.35){ctx.save();ctx.globalAlpha=clamp((dl-.35)*2,0,1)*.6;for(let i=0;i<4;i++){const x=((TIME*.25+i*9.3)%(COLS+12))-6,y=2+i*3.1+Math.sin(i*2.1)*1.2;
    E(ctx,x,y,3.4,1.6,RG(ctx,x+1,y+.56,3.4,'rgba(10,30,40,.16)','rgba(10,30,40,0)'),null)}ctx.restore()}
  // Licht
  renderLight(sx,sy);drawWeather();
  // Texte
  ctx.setTransform(DPR,0,0,DPR,0,0);ctx.textAlign='center';ctx.textBaseline='middle';
  for(const t of P.texts){const a=clamp(t.life/t.max*1.6,0,1),rise=(1-t.life/t.max)*.7,px=OX+sx+t.x*T,py=OY+sy+(t.y-rise)*T,sz=Math.max(13,T*.42);
    ctx.globalAlpha=a;ctx.font=`${sz}px ${FONT}`;ctx.lineWidth=4;ctx.strokeStyle='#1c1230';ctx.strokeText(t.txt,px+(t.k?sz*.45:0),py);
    ctx.fillStyle=t.k==='g'?'#ffd23f':t.k==='w'?'#ffb070':t.k==='c'?'#7ae8ff':'#ff5a6a';ctx.fillText(t.txt,px+(t.k?sz*.45:0),py);
    if(t.k&&ICONS[t.k]&&ICONS[t.k].complete&&ICONS[t.k].naturalWidth)ctx.drawImage(ICONS[t.k],px-sz*.9-ctx.measureText(t.txt).width*.5+sz*.45,py-sz*.45,sz*.9,sz*.9)}
  ctx.globalAlpha=1;
  if(S.running&&!S.over){const s=Math.max(16,T*.42);for(const b of S.buildings)if(b!==selB&&canUp(b))upArrow(ctx,OX+sx+(b.x+.5)*T,OY+sy+(b.y-.75)*T,s)}
  for(const t of STATIC){ctx.font=`${Math.max(12,T*.34)}px ${FONT}`;ctx.lineWidth=4;ctx.strokeStyle='#1c1230';ctx.strokeText(t.txt,OX+t.x*T,OY+t.y*T);ctx.fillStyle=t.c;ctx.fillText(t.txt,OX+t.x*T,OY+t.y*T)}
  STATIC.length=0;
  if(S.castleHit>0){ctx.fillStyle=`rgba(255,40,60,${S.castleHit*.35})`;ctx.fillRect(0,0,W,H)}
  if(S.frostFlash>0){ctx.fillStyle=`rgba(180,240,255,${S.frostFlash*.4})`;ctx.fillRect(0,0,W,H)}
  if(S.spellSel&&S.hover){setWorld(ctx);const r=S.spellSel==='meteor'?1.7:0;if(r){E(ctx,S.hover.fx,S.hover.fy,r,r*.55,'rgba(255,90,30,.18)','#ff8a2a',.05)}}
}
const STATIC=[];function ftextStatic(x,y,txt,c){STATIC.push({x,y,txt,c})}
const FONT="'Lilita One','Arial Rounded MT Bold','Trebuchet MS',sans-serif";
// Reichweite: kräftiger Ring mit dunklem Rand, Füllung zum Rand hin dichter, laufende Welle
function crown(g,x,y,s){g.beginPath();g.moveTo(x-s,y+s*.6);g.lineTo(x-s,y-s*.4);g.lineTo(x-s*.5,y);g.lineTo(x,y-s*.7);g.lineTo(x+s*.5,y);g.lineTo(x+s,y-s*.4);g.lineTo(x+s,y+s*.6);g.closePath();g.fillStyle='#ffd23f';g.fill();g.lineWidth=s*.25;g.strokeStyle='#3a1a06';g.stroke()}
function rangeCircle(x,y,r,ok){const c=ok?'255,214,64':'255,80,80';ctx.save();
  const gr=ctx.createRadialGradient(x,y,r*.15,x,y,r);gr.addColorStop(0,`rgba(${c},.05)`);gr.addColorStop(.8,`rgba(${c},.16)`);gr.addColorStop(1,`rgba(${c},.32)`);
  E(ctx,x,y,r,r,gr,'rgba(30,15,0,.6)',.15);E(ctx,x,y,r,r,null,`rgb(${c})`,.08);
  const w=(TIME*.55)%1;E(ctx,x,y,r*w,r*w,null,`rgba(${c},${.55*(1-w)})`,.06);ctx.restore()}
// Reichweite nach dem Ausbau: grün gestrichelt
function rangeNext(x,y,r){ctx.save();ctx.setLineDash([.22,.14]);ctx.lineDashOffset=-TIME*.4;E(ctx,x,y,r,r,null,'rgba(20,60,10,.7)',.11);E(ctx,x,y,r,r,null,'#8cf56a',.06);ctx.restore()}
function drawCastle(){
  const s=castleSpr(S.castleLvl);ctx.drawImage(s.c,20.5-1.9,8.05-4.1,s.w,s.h);
  const fl=(x,y,c)=>{ctx.strokeStyle=OL;ctx.lineWidth=.035;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y-.55);ctx.stroke();
    ctx.beginPath();ctx.moveTo(x,y-.55);for(let i=0;i<=6;i++){const t=i/6;ctx.lineTo(x+t*.42,y-.55+Math.sin(TIME*5-t*3+x)*.04*t)}for(let i=6;i>=0;i--){const t=i/6;ctx.lineTo(x+t*.42,y-.32+Math.sin(TIME*5-t*3+x)*.04*t)}
    ctx.closePath();ctx.fillStyle=c;ctx.fill();ctx.lineWidth=.025;ctx.stroke()};
  const c=S.castleLvl===1?'#ff5a4a':S.castleLvl===2?'#3d6ae8':'#9a5aff';
  fl(18.6+.6,8.05-4.1+.08,c);fl(18.6+3.2,8.05-4.1+.08,c);fl(20.5,8.05-4.1+.86,'#ffd23f');
  if(S.castleLvl>=3){const a=S.castleAng;ctx.save();ctx.translate(20.5,4.62);ctx.rotate(a);RR(ctx,-.05,-.04,.38,.08,.03,'#6b3d18');ctx.strokeStyle='#3a2a1a';ctx.lineWidth=.03;ctx.beginPath();ctx.arc(.22,0,.18,-1.3,1.3);ctx.stroke();ctx.restore()}
  for(const x of[19.98,21.02]){const y=7.45,f=Math.sin(TIME*14+x)*.02;RR(ctx,x-.025,y,.05,.16,.01,'#4a3a2a',null);E(ctx,x,y-.04+f,.05,.08,'#ffb340',null);E(ctx,x,y-.02,.025,.04,'#fff3a0',null)}
}
function renderLight(sx,sy){
  const n=night(),dl=dayLight(),dusk=clamp(1-Math.abs(dl-.45)/.18,0,1);
  if(dusk>0){ctx.setTransform(DPR,0,0,DPR,0,0);ctx.fillStyle=`rgba(255,120,50,${dusk*.13})`;ctx.fillRect(0,0,W,H)}
  if(n<=0)return;
  const lights=[[19.98,7.4,1.3,'255,170,60'],[21.02,7.4,1.3,'255,170,60'],[20.5,5.6,2.2,'255,190,90'],[19.2,4.9,.9,'255,190,90'],[21.8,4.9,.9,'255,190,90']];
  for(const b of S.buildings){const[tx,ty]=towerTop(b);
    if(b.t==='frost')lights.push([tx,ty,1.6,'120,220,255']);else if(b.t==='tesla')lights.push([tx,ty,1.7,'170,140,255']);
    else if(b.t==='cmine')lights.push([b.x+.5,b.y+.2,1.4,'120,210,255']);else if(b.t==='mine')lights.push([b.x+.18,b.y+.25,1,'255,190,90']);
    else lights.push([b.x+.5,b.y,1,'255,180,90'])}
  for(const[x,y]of CRYS)if(!occ[y][x])lights.push([x+.5,y+.4,1.1,'120,200,255']);
  for(const p of S.proj)if(p.k==='frost')lights.push([p.x,p.y-p.h,.8,'150,230,255']);
  for(const m of S.meteors)lights.push([lerp(m.x-4,m.x,m.t),lerp(m.y-7,m.y,m.t),3,'255,150,60']);
  for(const p of P.parts)if(p.k==='spark'&&p.sz>.08&&lights.length<120)lights.push([p.x,p.y,.9,'255,170,70']);
  for(const b of P.bolts)lights.push([b.pts[b.pts.length-1][0],b.pts[b.pts.length-1][1],1.4,'190,170,255']);
  lc.width!==cv.width&&(lc.width=cv.width);lc.height!==cv.height&&(lc.height=cv.height);
  lx.setTransform(1,0,0,1,0,0);lx.globalCompositeOperation='source-over';lx.clearRect(0,0,lc.width,lc.height);
  lx.fillStyle=`rgba(14,18,58,${n*.62})`;lx.fillRect(0,0,lc.width,lc.height);
  setWorld(lx,sx,sy);lx.globalCompositeOperation='destination-out';
  for(const[x,y,r]of lights){const q=lx.createRadialGradient(x,y,0,x,y,r);q.addColorStop(0,'rgba(0,0,0,.95)');q.addColorStop(1,'rgba(0,0,0,0)');lx.fillStyle=q;lx.fillRect(x-r,y-r,r*2,r*2)}
  ctx.setTransform(1,0,0,1,0,0);ctx.drawImage(lc,0,0);
  setWorld(ctx,sx,sy);ctx.save();ctx.globalCompositeOperation='lighter';
  for(const[x,y,r,c]of lights){const q=ctx.createRadialGradient(x,y,0,x,y,r*.8);q.addColorStop(0,`rgba(${c},${.3*n})`);q.addColorStop(1,`rgba(${c},0)`);ctx.fillStyle=q;ctx.fillRect(x-r,y-r,r*2,r*2)}
  ctx.restore();
}


// ---------- Effekte ----------
function part(o){if(P.parts.length<900)P.parts.push(Object.assign({vx:0,vy:0,g:0,life:1,max:1,sz:.1,c:'#fff',k:'dot',drag:1},o))}
function dust(x,y,n){for(let i=0;i<n;i++)part({x:x+rand(-.35,.35),y:y+rand(-.1,.1),vx:rand(-1.2,1.2),vy:rand(-1,-.2),life:rand(.4,.9),max:.9,sz:rand(.08,.16),c:'rgba(220,200,160,.8)',k:'smoke',drag:.92})}
function sparkle(x,y,n,c){for(let i=0;i<n;i++){const a=rand(0,TAU),s=rand(.8,3);part({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-1,g:2,life:rand(.4,.9),max:.9,sz:rand(.04,.08),c,k:'spark',drag:.95})}}
function leaves(x,y,n=14){for(let i=0;i<n;i++)part({x:x+rand(-.3,.3),y:y+rand(-.3,.2),vx:rand(-1,1),vy:rand(-1.5,-.3),g:1.4,life:rand(.6,1.2),max:1.2,sz:rand(.05,.09),c:['#6cbf3c','#a6e05a','#3b8a2e'][i%3],k:'leaf',drag:.96})}
function explode(x,y,s=1){
  for(let i=0;i<22*s;i++){const a=rand(0,TAU),v=rand(.5,3.4)*s;part({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v*.6-.6,life:rand(.25,.55),max:.55,sz:rand(.06,.14)*s,c:['#fff3a0','#ffb340','#ff6a1a'][i%3],k:'spark',drag:.9})}
  for(let i=0;i<10*s;i++)part({x:x+rand(-.3,.3)*s,y:y+rand(-.2,.2)*s,vx:rand(-.6,.6),vy:rand(-1.2,-.3),life:rand(.6,1.3),max:1.3,sz:rand(.14,.26)*s,c:'rgba(70,60,60,.55)',k:'smoke',drag:.95});
  for(let i=0;i<6*s;i++)part({x,y,vx:rand(-2,2),vy:rand(-3,-1),g:6,life:rand(.5,.8),max:.8,sz:rand(.04,.07),c:'#6b5a40',k:'dot'});
  P.decals.push({x,y,r:.45*s,life:6,max:6});FLASH=Math.max(FLASH,.25*s);
}
let FLASH=0;
function fx(n,d){switch(n){
  case'build':dust(d.x+.5,d.y+.7,14);break;
  case'upgrade':dust(d.x+.5,d.y+.7,18);sparkle(d.x+.5,d.y,16,'#ffd23f');break;
  case'castleUp':for(let i=0;i<4;i++)dust(rand(19.2,21.8),rand(7,8.2),10);sparkle(20.5,5.5,40,'#ffd23f');break;
  case'leaves':leaves(d.x+.5,d.y+.2);break;
  case'rock':dust(d.x+.5,d.y+.6,16);break;
  case'sparkle':sparkle(d.x,d.y-d.h,d.n,d.c);break;
  case'text':P.texts.push({x:d.x,y:d.y-d.h,txt:d.txt,k:d.k,life:1.1,max:1.1});break;
  case'hit':part({x:d.x,y:d.y-d.h,life:.15,max:.15,sz:.12,c:'#fff',k:'spark'});break;
  case'frostHit':for(let i=0;i<10;i++)part({x:d.x,y:d.y-d.h,vx:rand(-1.5,1.5),vy:rand(-1.5,1),life:rand(.3,.6),max:.6,sz:rand(.04,.08),c:'#c9f4ff',k:'spark',drag:.9});break;
  case'explode':explode(d.x,d.y,d.s);break;
  case'bolt':P.bolts.push({pts:d.pts.map(([x,y,h])=>[x,y-h]),life:.22,max:.22});break;
  case'muzzle':{const b=d.b,[ox,oy]=towerTop(b);for(let i=0;i<6;i++)part({x:ox+Math.cos(b.ang)*.45,y:oy+Math.sin(b.ang)*.25-.05,vx:Math.cos(b.ang)*rand(.5,1.5)+rand(-.3,.3),vy:Math.sin(b.ang)*rand(.3,1)-.5,life:rand(.4,.8),max:.8,sz:rand(.1,.18),c:'rgba(230,230,230,.7)',k:'smoke',drag:.93});break}
  case'kill':{const e=d.e,y=e.y-(e.fly?.62*e.sz:.2);
    for(let i=0;i<10;i++)part({x:e.x+rand(-.2,.2),y:y+rand(-.15,.15),vx:rand(-.8,.8),vy:rand(-1,-.2),life:rand(.4,.8),max:.8,sz:rand(.1,.2)*e.sz,c:'rgba(255,255,255,.85)',k:'smoke',drag:.9});
    for(let i=0;i<Math.min(8,2+e.g/6);i++)part({x:e.x,y,vx:rand(-1.4,1.4),vy:rand(-3.2,-1.6),g:7,life:.8,max:.8,sz:.07,c:'#ffd23f',k:'coin'});
    if(e.boss)explode(e.x,e.y,2);break}
  case'blizzard':for(let i=0;i<120;i++)part({x:rand(0,COLS),y:rand(-1,ROWS),vx:rand(-.4,.4),vy:rand(.8,1.6),life:rand(1,2),max:2,sz:rand(.03,.06),c:'#e0faff',k:'spark',drag:1});break;
}}

// ---------- Umgebung: Wasser, Tiere, Wetter ----------
const AMB={bf:[],birds:[],rain:0,rainT:0,rainOn:false,nextRain:90+Math.random()*60,drops:[],smokeT:0};
for(let i=0;i<7;i++)AMB.bf.push({x:rand(0,COLS),y:rand(0,ROWS),tx:rand(0,COLS),ty:rand(0,ROWS),c:['#ffd23f','#ff8ac0','#8ad8ff','#ffffff'][i%4],ph:rand(0,9)});
function tickAmb(dt){
  for(const b of AMB.bf){const dx=b.tx-b.x,dy=b.ty-b.y,d=Math.hypot(dx,dy);if(d<.3){b.tx=rand(0,COLS);b.ty=rand(0,ROWS)}else{b.x+=dx/d*dt*.9+Math.sin(TIME*3+b.ph)*dt*.6;b.y+=dy/d*dt*.9+Math.cos(TIME*4+b.ph)*dt*.5}}
  if(!AMB.birds.length&&Math.random()<dt*.04){const y=rand(1,10),n=3+Math.floor(rand(0,4));for(let i=0;i<n;i++)AMB.birds.push({x:-2-i*.5,y:y+(i%2?.35:-.35)*Math.ceil(i/2),v:rand(2.6,3),ph:rand(0,6)})}
  for(const b of AMB.birds)b.x+=b.v*dt;AMB.birds=AMB.birds.filter(b=>b.x<COLS+4);
  AMB.nextRain-=dt;if(AMB.nextRain<=0){AMB.rainOn=!AMB.rainOn;AMB.nextRain=AMB.rainOn?rand(30,45):rand(100,160)}
  AMB.rain=clamp(AMB.rain+(AMB.rainOn?dt*.25:-dt*.25),0,1);
  if(AMB.rain>.05&&Math.random()<AMB.rain*dt*30)P.decals.push({x:rand(0,COLS),y:rand(0,ROWS),r:.12,life:.5,max:.5,ring:1});
  AMB.smokeT-=dt;if(AMB.smokeT<=0){AMB.smokeT=.35;
    for(const b of S.buildings)if(b.t==='saw')part({x:b.x+.2+rand(-.03,.03),y:b.y-.55,vx:rand(.05,.2),vy:-rand(.3,.5),life:2.2,max:2.2,sz:rand(.06,.1),c:'rgba(235,235,235,.5)',k:'smoke',drag:.99});
    part({x:20.5+rand(-.05,.05),y:3.9,vx:rand(.05,.2),vy:-rand(.3,.5),life:2.4,max:2.4,sz:rand(.07,.11),c:'rgba(235,235,235,.45)',k:'smoke',drag:.99});
    if(dayLight()>.5&&Math.random()<.25){const d=decor[Math.floor(rand(0,decor.length))];if(d&&d.t===TREE)part({x:d.x+.5+rand(-.3,.3),y:d.y-.2,vx:rand(.2,.6),vy:rand(.1,.3),g:.15,life:3,max:3,sz:.05,c:'#8cc63a',k:'leaf',drag:.995})}}
  FLASH=Math.max(0,FLASH-dt*2);
}
function drawWater(){
  const px=10.5,py=12.05;ctx.save();ctx.beginPath();ctx.ellipse(px,py,1.62,1.0,0,0,TAU);ctx.clip();
  for(let i=0;i<7;i++){const t=(TIME*.18+i/7)%1,x=px-1.6+((i*0.61)%1)*3.2+Math.sin(TIME+i)*.1,y=py-.9+t*1.8;ctx.globalAlpha=Math.sin(t*Math.PI)*.55;
    ctx.strokeStyle='#e8fbff';ctx.lineWidth=.035;ctx.beginPath();ctx.moveTo(x-.22,y);ctx.quadraticCurveTo(x,y-.05,x+.22,y);ctx.stroke()}
  ctx.globalAlpha=.35+.25*Math.sin(TIME*2);E(ctx,px-.6,py-.35,.35,.08,'rgba(255,255,255,.35)',null);ctx.restore();ctx.globalAlpha=1;
}
function drawAmbient(){
  const dl=dayLight();
  if(dl>.4)for(const b of AMB.bf){const f=Math.abs(Math.sin(TIME*14+b.ph));ctx.globalAlpha=clamp((dl-.4)*3,0,1);
    for(const s of[-1,1])E(ctx,b.x+s*.05*f,b.y-.35,.05*f+.01,.035,b.c,'rgba(40,20,10,.6)',.012);E(ctx,b.x,b.y-.35,.012,.03,'#2b1d14',null);ctx.globalAlpha=1}
  for(const b of AMB.birds){const f=Math.sin(TIME*10+b.ph)*.08;E(ctx,b.x+.8,b.y+1.6,.12,.05,'rgba(10,30,10,.15)',null);
    ctx.strokeStyle='#2b1d14';ctx.lineWidth=.04;ctx.beginPath();ctx.moveTo(b.x-.16,b.y-f);ctx.quadraticCurveTo(b.x-.06,b.y-.06,b.x,b.y);ctx.quadraticCurveTo(b.x+.06,b.y-.06,b.x+.16,b.y-f);ctx.stroke()}
  // Sonnenstrahlen
  if(dl>.55&&AMB.rain<.5){ctx.save();ctx.setTransform(DPR,0,0,DPR,0,0);ctx.globalCompositeOperation='lighter';const a=(dl-.55)*.12*(1-AMB.rain*2);
    for(let i=0;i<3;i++){const x=((TIME*6+i*W*.37)%(W*1.4))-W*.2;const gr=ctx.createLinearGradient(x,0,x+W*.15,H);gr.addColorStop(0,`rgba(255,250,210,${a})`);gr.addColorStop(1,'rgba(255,250,210,0)');
      ctx.fillStyle=gr;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x+W*.08,0);ctx.lineTo(x+W*.35,H);ctx.lineTo(x+W*.2,H);ctx.closePath();ctx.fill()}ctx.restore()}
}
function drawWeather(){
  ctx.setTransform(DPR,0,0,DPR,0,0);
  if(AMB.rain>0){ctx.fillStyle=`rgba(30,40,70,${AMB.rain*.22})`;ctx.fillRect(0,0,W,H);
    ctx.strokeStyle=`rgba(200,220,255,${AMB.rain*.5})`;ctx.lineWidth=1.2;ctx.beginPath();const n=Math.floor(AMB.rain*220);
    for(let i=0;i<n;i++){const x=((i*97.31+TIME*80)%(W+100))-50,y=((i*53.7+TIME*900)%(H+60))-30;ctx.moveTo(x,y);ctx.lineTo(x-5,y+16)}ctx.stroke()}
  if(FLASH>0){ctx.fillStyle=`rgba(255,200,120,${FLASH*.25})`;ctx.fillRect(0,0,W,H)}
}

// ---------- Schnittstelle ----------
const R={
  panHint:tr('Wische, um die Karte zu verschieben. Die Burg liegt rechts.'),
  init(){loadIcons();this.resize()},
  resize(){
    DPR=Math.min(window.devicePixelRatio||1,2);W=innerWidth;H=innerHeight;cv.width=Math.round(W*DPR);cv.height=Math.round(H*DPR);cv.style.width=W+'px';cv.style.height=H+'px';
    const narrow=W<=720,short=H<=500&&!narrow,top=narrow?(W<470?84:50):60,bot=narrow?118:short?96:120;
    T=Math.max(14,Math.min(W/COLS,(H-top-bot)/ROWS));if(H>W*1.15)T=Math.max(T,Math.min(46,(H-top-bot)/ROWS));
    PAN=COLS*T>W+1;OXmin=PAN?W-COLS*T:(W-COLS*T)/2;OXmax=PAN?0:OXmin;OX=clamp(PAN?(OX||0):OXmin,OXmin,OXmax);OY=top+Math.max(0,(H-top-bot-ROWS*T)/2);
    BX0=Math.floor(-OXmax/T)-1;BX1=Math.ceil((W-OXmin)/T)+1;BY0=Math.floor(-OY/T)-1;BY1=Math.ceil((H-OY)/T)+1;
    SPR.clear();if(grid)buildBackground();
  },
  rebuild(w){if(w==='all'){P.parts.length=P.texts.length=P.bolts.length=P.decals.length=0;SPR.clear();buildBackground()}},
  tick(dt){
    for(const p of P.parts){p.vx*=p.drag;p.vy*=p.drag;p.vy+=p.g*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt}
    P.parts=P.parts.filter(p=>p.life>0);
    for(const k of['texts','bolts','decals']){for(const t of P[k])t.life-=dt;P[k]=P[k].filter(t=>t.life>0)}
    if(night()>.5&&Math.random()<dt*8&&P.parts.length<700)part({x:rand(0,COLS),y:rand(0,ROWS),vx:rand(-.3,.3),vy:rand(-.3,.3),life:rand(2,4),max:4,sz:.05,c:'#eaff7a',k:'fly',drag:1});
    for(const e of S.enemies)if(e.slowT>0&&Math.random()<dt*6)part({x:e.x+rand(-.15,.15),y:e.y-rand(0,.4),vy:rand(.1,.4),life:.6,max:.6,sz:.04,c:'#e0faff',k:'spark'});
    tickAmb(dt);
  },
  render,
  pick(cx,cy){const r=cv.getBoundingClientRect(),fx=(cx-r.left-OX)/T,fy=(cy-r.top-OY)/T;return{x:Math.floor(fx),y:Math.floor(fy),fx,fy}},
  toScreen(x,y,h){return{x:OX+x*T,y:OY+(y-h)*T}},
  towerH(b){return 1.5-(TOPY[b.t]?TOPY[b.t][b.l]:1)},
  flyH(e){return .62*e.sz},
  castleH(){return 1.9},
  fx,
  thumb(t,c,l=1){const g=c.getContext('2d'),s=bSpr(t,l);const h=116*1.02,w=h*s.w/s.h;g.drawImage(s.c,(144-w)/2,116-h+4,w,h)},
  canPan(){return PAN},
  pan(dx){OX=clamp(OX+dx,OXmin,OXmax)},
};
