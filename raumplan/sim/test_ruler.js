// Zollstock-Erkennung ohne Marken: gelber Stab (mit schwarzen Ziffern/Gelenken) auf unruhigem Boden, versch. Winkel/Breiten/Rauschen
// → Endpunkte müssen auf ±1,5 px stimmen, angeschnittene Enden erkannt werden.
const AR=require('../ar.js');let seed=7;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
function img(W,H,a,b,wid,noise,flip,RC=[235,195,30],FL=null){const px=new Uint8Array(W*H*4);
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){const j=(y*W+x)*4,t=((x>>4)+(y>>4))&1;if(FL){const f=t?1:0.85;px[j]=FL[0]*f+rnd()*noise;px[j+1]=FL[1]*f+rnd()*noise;px[j+2]=FL[2]*f+rnd()*noise;}else{const base=t?130:110;px[j]=base+20+rnd()*noise;px[j+1]=base+rnd()*noise;px[j+2]=base-15+rnd()*noise;}px[j+3]=255;} // Holzboden-ähnlich
 const L=Math.hypot(b[0]-a[0],b[1]-a[1]),e=[(b[0]-a[0])/L,(b[1]-a[1])/L],n=[-e[1],e[0]];
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){const dx=x+0.5-a[0],dy=y+0.5-a[1],t=dx*e[0]+dy*e[1],o=dx*n[0]+dy*n[1];
  // Pixelabdeckung (Antialiasing) über 4×4 Unterabtastung
  let cov=0;for(let sy=0;sy<4;sy++)for(let sx=0;sx<4;sx++){const tt=t+((sx-1.5)*e[0]+(sy-1.5)*e[1])/4,oo=o+((sx-1.5)*n[0]+(sy-1.5)*n[1])/4;if(tt>=0&&tt<=L&&Math.abs(oo)<=wid/2)cov++;}
  if(!cov)continue;cov/=16;const tick=(Math.floor(t/ (L/40))%2===0)&&Math.abs(o)<wid*0.25&&(t%(L/40))<(L/40)*0.3,joint=Math.abs((t%(L/10))-(L/20))<1.2;
  const yy=y,j=((flip?H-1-yy:yy)*W+x)*4,col=tick||joint?[25,25,25]:[RC[0]+rnd()*15,RC[1]+rnd()*15,RC[2]+rnd()*15];for(let c=0;c<3;c++)px[j+c]=Math.round(px[j+c]*(1-cov)+col[c]*cov);}
 return px;}
let ok=true;const cases=[[1920,1080,[300.3,700.7],[1600.2,260.4],16,40],[1920,1080,[960,80.5],[1010.4,1000.2],12,60],[1280,720,[100.2,600.1],[1180.6,90.9],10,30],[1920,1080,[-50,500],[1500.5,600.5],16,40]];
for(const [W,H,a,b,wid,noise] of cases){const px=img(W,H,a,b,wid,noise,true),t0=Date.now(),R=AR.rulerFind(px,W,H,true),ms=Date.now()-t0;
 if(!R){console.log('nicht gefunden',W,a,b);ok=false;continue;}
 const sw=Math.hypot(R.a[0]-a[0],R.a[1]-a[1])>Math.hypot(R.a[0]-b[0],R.a[1]-b[1]),A=sw?R.b:R.a,B=sw?R.a:R.b,okA=sw?R.okB:R.okA,okB=sw?R.okA:R.okB;
 const ea=Math.hypot(A[0]-a[0],A[1]-a[1]),eb=Math.hypot(B[0]-b[0],B[1]-b[1]),inA=a[0]>0;
 console.log(`${W}×${H} Breite ${wid}px: Ende A ${inA?ea.toFixed(2)+' px':'angeschnitten→'+(okA?'FALSCH ok':'erkannt')}, Ende B ${eb.toFixed(2)} px, ${ms} ms`);
 if(inA&&ea>1.5||eb>1.5||!inA&&okA||!okB)ok=false;}
// Holz-Zollstöcke: Naturholz auf grauen Fliesen, auf dunklem Parkett, weiß lackiert; gelernte Farbe auf ähnlichem Holzboden
for(const [nm,RC,FL,learn] of [['Naturholz/Fliesen',[205,160,105],null,0],['Naturholz/dunkles Parkett',[215,170,115],[120,80,50],0],['weiß/Fliesen',[235,232,225],null,0],['Holz gelernt/helles Parkett',[200,150,95],[170,125,80],1],['Holz gelernt/graue Fliesen',[185,135,85],null,1]]){
 const W=1920,H=1080,a=[400.4,820.2],b=[1500.6,300.3],px=img(W,H,a,b,15,30,true,RC,FL);let col=null;
 if(learn){col=AR.learnColor(px,W,H,(a[0]+b[0])/2+30,(a[1]+b[1])/2-13.5);} // Kreis auf dem Stab (neben den Ziffern)
 const R=AR.rulerFind(px,W,H,true,col);if(!R){console.log(nm,': nicht gefunden'+(learn&&FL?' (zulässig: gleiche Farbe wie Boden → Enden antippen)':''));if(!learn||!FL)ok=false;continue;}
 const e=Math.max(Math.min(Math.hypot(R.a[0]-a[0],R.a[1]-a[1]),Math.hypot(R.a[0]-b[0],R.a[1]-b[1])),Math.min(Math.hypot(R.b[0]-a[0],R.b[1]-a[1]),Math.hypot(R.b[0]-b[0],R.b[1]-b[1])));
 console.log(`${nm}: erkannt als „${R.col}“, Endfehler max ${e.toFixed(2)} px`);if(e>2)ok=false;}
const K=[];for(let i=0;i<40;i++)K.push(1.012+(rnd()-.5)*0.004);K.push(1.3,0.7);const rs=AR.rulerScale(K);console.log('Maßstab:',rs.k.toFixed(4),'n',rs.n,'±',(rs.sig*100).toFixed(3),'%');if(Math.abs(rs.k-1.012)>0.001||rs.n!==40)ok=false;
console.log('Zollstock-Erkennung:',ok?'OK':'FEHLER');process.exit(ok?0:1);
