'use strict';
// Spiellogik, Ton und Oberfläche. Die Grafik kommt vom Renderer R (r2d.js oder r3d.js).
const $=s=>document.querySelector(s);
const COLS=22,ROWS=13,TAU=Math.PI*2;
const G=0,PATHT=1,TREE=2,ROCK=3,CRY=4,WAT=5,CAS=6;
let TIME=0;
const clamp=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,t)=>a+(b-a)*t,rand=(a,b)=>a+Math.random()*(b-a);
function RNG(s){return()=>(s=(s*16807)%2147483647,(s-1)/2147483646)}

// ---------- Pfade ----------
function mkPath(pts){const segs=[];let L=0;for(let i=0;i<pts.length-1;i++){const[x0,y0]=pts[i],[x1,y1]=pts[i+1],len=Math.hypot(x1-x0,y1-y0);segs.push({x0,y0,ux:(x1-x0)/len,uy:(y1-y0)/len,len,s:L});L+=len}return{pts,segs,len:L}}
function pathPos(P,d){for(const s of P.segs)if(d<=s.s+s.len){const t=d-s.s;return[s.x0+s.ux*t,s.y0+s.uy*t,s.ux,s.uy]}const s=P.segs[P.segs.length-1];return[s.x0+s.ux*s.len,s.y0+s.uy*s.len,s.ux,s.uy]}
const FEAT=window.FEAT||{};
const MAPS=[
  {n:'Grüntal',wp:[[-4,2],[3,2],[3,8],[8,8],[8,3],[13,3],[13,10],[20,10],[20,8]],cry:[[6,5],[11,6],[16,12]],pond:[10.5,11.95,1.9,1.3],
    rocks:[[10,0],[11,1],[5,11],[16,7],[1,6]],forest:(x,y)=>(x>=15&&y<=2)||(x>=17&&y<=3)||(x<=2&&y>=9)||(x>=5&&x<=7&&y===0)||(y>=11&&x>=13&&x<=15),theme:'gruen',waves:8,bossT:'troll',boost:1},
  {n:'Herbstwald',wp:[[-4,10],[3,10],[3,3],[9,3],[9,9],[14,9],[14,2],[17,2],[17,10],[20,10],[20,8]],cry:[[6,6],[12,5],[19,12]],pond:[6.5,11.95,1.9,1.2],
    rocks:[[6,0],[11,0],[16,6],[12,12],[1,6]],forest:(x,y)=>(x<=2&&y<=8)||(x>=18&&y<=3)||(y>=11&&x>=10&&x<=15),theme:'herbst',waves:10,bossT:'dragon',boost:1.08},
  {n:'Wüstenpass',wp:[[-4,6],[2,6],[2,1],[7,1],[7,11],[12,11],[12,4],[16,4],[16,10],[20,10],[20,8]],cry:[[4,4],[14,7],[18,2]],pond:[9.8,6.4,1.5,1.1],
    rocks:[[5,8],[10,1],[14,0],[19,12],[3,11],[9,10],[4,1],[14,12]],forest:(x,y)=>(y>=12&&x<=6)||(x>=18&&y<=1),theme:'wueste',waves:12,bossT:'dragon',boost:1.15},
  {n:'Flusstal',wp:[[-4,4],[5,4],[5,11],[11,11],[11,1],[16,1],[16,8],[18,8],[18,10],[20,10],[20,8]],cry:[[3,8],[13,6],[19,2]],pond:[8.2,7.5,1.6,1.1],
    rocks:[[2,1],[9,2],[14,11],[20,12],[7,12]],forest:(x,y)=>(x<=3&&y>=9)||(x>=17&&y<=3)||(y<=2&&x>=5&&x<=9),theme:'gruen',waves:12,bossT:'troll',boost:1.22},
  {n:'Ascheberg',wp:[[-4,8],[2,8],[2,2],[6,2],[6,9],[10,9],[10,2],[14,2],[14,11],[17,11],[17,10],[20,10],[20,8]],cry:[[4,5],[12,6],[19,12]],pond:[8.5,5.5,1.2,1.6],
    rocks:[[0,0],[4,10],[8,11],[12,0],[16,6],[19,2],[1,5]],forest:(x,y)=>(y>=11&&x<=5)||(x>=17&&y<=2)||(x>=15&&y>=12),theme:'vulkan',waves:15,bossT:'dragon',boost:1.3},
];
let MAP=MAPS[0],PATH,MAPI=0;
function setMap(i){MAPI=i;MAP=MAPS[i];const w=MAP.wp;PATH=mkPath(w.map(([x,y],k)=>[x+.5,k===w.length-1?8.15:y+.5]));CRYS=MAP.cry}
const AIR=mkPath([[-2.5,-.8],[5,1.4],[10.5,6.6],[16,3.6],[20.5,6.6]]);
const CASTLE_C=[20.5,6.5];

// ---------- Definitionen ----------
const DEF={
  archer:{n:'Bogenturm',good:'Stark gegen Fledermäuse, Drachen und Goblins',bad:'Schwach gegen Rüstung (Ritter, Orks)',k:'t',d:'Schnell. Trifft Boden und Luft.',air:1,
    cost:[{g:60,w:20},{g:80,w:30},{g:150,w:50}],lv:[{dmg:11,rate:.65,rng:3},{dmg:19,rate:.5,rng:3.4},{dmg:32,rate:.38,rng:3.9}]},
  cannon:{n:'Kanone',good:'Stark gegen Gruppen von Goblins und Wölfen',bad:'Trifft keine Flieger',k:'t',d:'Flächenschaden. Nur Bodenziele.',air:0,
    cost:[{g:110,w:40},{g:140,w:50},{g:240,w:80}],lv:[{dmg:32,rate:2,rng:2.8,spl:1},{dmg:58,rate:1.8,rng:3.1,spl:1.15},{dmg:105,rate:1.6,rng:3.4,spl:1.35}]},
  frost:{n:'Frostmagier',good:'Bremst schnelle Gegner, Magie ignoriert Rüstung',bad:'Wenig Schaden',k:'t',d:'Magie verlangsamt Gegner.',air:1,
    cost:[{g:90,w:20},{g:120,w:30},{g:200,w:40,c:10}],lv:[{dmg:9,rate:1,rng:2.8,slow:.45,st:1.6},{dmg:16,rate:.9,rng:3.1,slow:.55,st:2},{dmg:28,rate:.8,rng:3.5,slow:.65,st:2.4,spl:.9}]},
  tesla:{n:'Blitzturm',good:'Stark gegen Ritter, Orks und Elite: ignoriert Rüstung',bad:'Teuer, braucht Kristalle',k:'t',d:'Kettenblitz, ignoriert Rüstung.',air:1,req:2,
    cost:[{g:160,w:30,c:15},{g:200,w:40,c:20},{g:320,w:60,c:35}],lv:[{dmg:30,rate:1.4,rng:3,ch:3},{dmg:48,rate:1.25,rng:3.3,ch:4},{dmg:80,rate:1.1,rng:3.6,ch:6}]},
  saw:{n:'Sägewerk',k:'e',d:'Holz alle 6 s. +1 pro Nachbarbaum.',adj:TREE,adjB:'w',
    cost:[{g:45},{g:80,w:20},{g:140,w:40}],lv:[{p:{w:4}},{p:{w:7}},{p:{w:12}}]},
  mine:{n:'Goldmine',k:'e',d:'Gold alle 6 s. +2 pro Nachbarfels.',adj:ROCK,adjB:'g',
    cost:[{g:80,w:30},{g:120,w:50},{g:200,w:80}],lv:[{p:{g:6}},{p:{g:11}},{p:{g:18}}]},
  cmine:{n:'Kristallmine',k:'e',d:'Nur auf leuchtenden Kristalladern.',on:CRY,
    cost:[{g:100,w:50},{g:150,w:70},{g:240,w:100}],lv:[{p:{c:3}},{p:{c:5}},{p:{c:8}}]},
};
if(FEAT.barracks)DEF.barracks={n:'Kaserne',k:'b',good:'Hält Wölfe, Goblins und Orks auf',bad:'Flieger fliegen einfach drüber',d:'3 Soldaten blockieren den Weg.',rng:2.3,
  cost:[{g:90,w:40},{g:120,w:60},{g:200,w:90}],lv:[{hp:90,atk:7},{hp:150,atk:12},{hp:240,atk:20}]};
const ORDER=['archer','cannon','frost',...(FEAT.barracks?['barracks']:[]),'tesla','saw','mine','cmine'];
const CASTLE_UP=[null,null,{g:300,w:150},{g:600,w:300,c:40}];
const EN={
  goblin:{n:'Goblin',hp:38,spd:1.55,arm:0,g:5,dmg:1,sz:1,atk:4},
  wolf:{n:'Wolf',hp:30,spd:2.6,arm:0,g:4,dmg:1,sz:1,atk:3},
  orc:{n:'Ork',hp:120,spd:1,arm:.25,g:11,dmg:2,sz:1.15,atk:9},
  bat:{n:'Fledermaus',hp:34,spd:1.9,arm:0,g:5,dmg:1,fly:1,sz:1,atk:0},
  knight:{n:'Dunkler Ritter',hp:240,spd:.85,arm:.45,g:18,dmg:2,sz:1.12,atk:14},
  troll:{n:'Troll',hp:950,spd:.55,arm:.2,g:110,dmg:5,sz:1.9,boss:1,atk:45},
  dragon:{n:'Drache',hp:1100,spd:.75,arm:.15,g:180,dmg:6,fly:1,air:1,sz:2,boss:1,atk:0},
};
const WAVES=[
  [['goblin',8,1.1]],
  [['goblin',12,.8]],
  [['goblin',8,.8],['wolf',6,.6]],
  [['goblin',10,.7],['orc',4,1.6]],
  [['goblin',10,.7],['orc',3,1.5],['troll',1,0]],
  [['bat',8,.8],['goblin',10,.6]],
  [['wolf',12,.5],['orc',6,1.2]],
  [['knight',4,2],['goblin',14,.5],['bat',6,.7]],
  [['orc',10,1],['bat',12,.6]],
  [['wolf',12,.45],['knight',4,1.6],['dragon',1,0]],
];
function getWave(n){const f=1+Math.max(0,n-4)*.07;return rawWave(n).map(w=>EN[w[0]].boss?w:[w[0],Math.round(w[1]*f),w[2]/Math.sqrt(f)])}
function rawWave(n){
  if(S&&S.endless&&n%5===0){const g=baseWave(n).filter(w=>!EN[w[0]].boss);g.push([n%10?'troll':'dragon',Math.ceil(n/10),4]);return g}
  if(FEAT.campaign&&S&&!S.endless&&n===S.maxWave){const g=baseWave(n).filter(w=>!EN[w[0]].boss);g.push([MAP.bossT,n>=15?2:1,5]);return g}
  return baseWave(n);
}
function baseWave(n){
  if(n<=10)return WAVES[n-1];
  const k=n-10,g=[['goblin',10+k*2,.45],['orc',5+k,.9],['wolf',8+k,.4]];
  if(k%2)g.push(['bat',8+k*2,.5]);
  if(k>=2)g.push(['knight',2+k,1.3]);
  if(n===15)g.push(['troll',2,4]);
  if(n===18)g.push(['dragon',1,0]);
  if(n===20){g.push(['troll',2,3]);g.push(['dragon',2,6])}
  return g;
}
const hpMul=n=>1+(n-1)*.15+Math.max(0,n-6)*.1;

// ---------- Karte ----------
let grid,occ,decor,S;
let CRYS=MAPS[0].cry;setMap(0);
function genMap(){
  const r=RNG(4242);
  grid=[...Array(ROWS)].map(()=>Array(COLS).fill(G));
  occ=[...Array(ROWS)].map(()=>Array(COLS).fill(null));
  const WPI=MAP.wp,[pcx,pcy,prx,pry]=MAP.pond;
  for(let i=0;i<WPI.length-1;i++){
    let[x,y]=WPI[i];const[x1,y1]=WPI[i+1],dx=Math.sign(x1-x),dy=Math.sign(y1-y);
    for(;;){if(x>=0&&x<COLS&&y>=0&&y<ROWS)grid[y][x]=PATHT;if(x===x1&&y===y1)break;x+=dx;y+=dy}
  }
  for(let y=5;y<=7;y++)for(let x=19;x<=21;x++)grid[y][x]=CAS;
  for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++)if(grid[y][x]===G&&((x+.5-pcx)/prx)**2+((y+.5-pcy)/pry)**2<1)grid[y][x]=WAT;
  for(const[x,y]of CRYS)grid[y][x]=CRY;
  const isP=(x,y)=>x>=0&&y>=0&&x<COLS&&y<ROWS&&grid[y][x]===PATHT;
  for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){
    if(grid[y][x]!==G)continue;
    if(x>=18&&y>=4&&y<=9)continue;
    const near=isP(x+1,y)||isP(x-1,y)||isP(x,y+1)||isP(x,y-1);
    const forest=MAP.forest(x,y);
    const p=forest?(MAP.theme==='wueste'?.3:.62):near?.02:(MAP.theme==='wueste'?.02:.06);
    if(r()<p)grid[y][x]=TREE;else if(!near&&r()<(MAP.theme==='wueste'?.07:.035))grid[y][x]=ROCK;
  }
  for(const[x,y]of MAP.rocks)if(grid[y][x]===G)grid[y][x]=ROCK;
  buildDecor();
}
function buildDecor(){
  decor=[];const r=RNG(99);
  for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){
    const t=grid[y][x];
    if(t===TREE||t===ROCK||t===CRY)decor.push({t,x,y,v:Math.floor(r()*4),ox:(r()-.5)*.24,oy:(r()-.5)*.14});
  }
}
const inG=(x,y)=>x>=0&&y>=0&&x<COLS&&y<ROWS;
function countAdj(x,y,t){let n=0;for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++)if((i||j)&&inG(x+i,y+j)&&grid[y+j][x+i]===t)n++;return n}

// ---------- Ton ----------
let AC=null,muted=false;const NIGHT=false;const lastS={};
function ac(){if(!AC){try{AC=new(window.AudioContext||window.webkitAudioContext)()}catch(e){}}if(AC&&AC.state==='suspended')AC.resume();return AC}
function tone(f,d,type='sine',v=.08,slide=0,delay=0){const a=AC;if(!a||muted)return;const t=a.currentTime+delay,o=a.createOscillator(),gn=a.createGain();o.type=type;o.frequency.setValueAtTime(f,t);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(30,f+slide),t+d);gn.gain.setValueAtTime(v,t);gn.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(gn).connect(a.destination);o.start(t);o.stop(t+d+.02)}
let NB=null;function noise(d,v,f=1200,type='lowpass'){const a=AC;if(!a||muted)return;if(!NB){NB=a.createBuffer(1,a.sampleRate,a.sampleRate);const c=NB.getChannelData(0);for(let i=0;i<c.length;i++)c[i]=Math.random()*2-1}
  const s=a.createBufferSource(),fl=a.createBiquadFilter(),gn=a.createGain(),t=a.currentTime;s.buffer=NB;fl.type=type;fl.frequency.value=f;gn.gain.setValueAtTime(v,t);gn.gain.exponentialRampToValueAtTime(.0001,t+d);s.connect(fl).connect(gn).connect(a.destination);s.start(t);s.stop(t+d)}
const SFX={
  arrow:()=>noise(.07,.05,3000,'highpass'),
  cannon:()=>{noise(.4,.22,500);tone(110,.3,'sine',.18,-60)},
  boom:()=>{noise(.5,.2,700);tone(70,.4,'sine',.15,-30)},
  frost:()=>tone(1500,.18,'sine',.035,700),
  zap:()=>{noise(.15,.07,5000,'highpass');tone(220,.12,'sawtooth',.03,400)},
  coin:()=>{tone(1320,.07,'square',.025);tone(1760,.1,'square',.025,0,.05)},
  build:()=>{noise(.12,.12,900);tone(300,.12,'triangle',.08,200,.03)},
  hurt:()=>{tone(180,.3,'sawtooth',.08,-100)},
  wave:()=>{tone(392,.18,'triangle',.08);tone(523,.18,'triangle',.08,0,.15);tone(659,.3,'triangle',.08,0,.3)},
  boss:()=>{tone(110,.8,'sawtooth',.08,-40);tone(82,.9,'sawtooth',.06,-20,.2)},
  win:()=>{[523,659,784,1046].forEach((f,i)=>tone(f,.3,'triangle',.08,0,i*.13))},
  click:()=>tone(660,.05,'triangle',.05),
  err:()=>tone(160,.15,'square',.04),
  prod:()=>tone(990,.06,'sine',.02),
};
function sfx(k){if(!AC||muted||ADMUTE)return;const n=performance.now();if(lastS[k]&&n-lastS[k]<45)return;lastS[k]=n;SFX[k]()}

// ---------- Spielzustand ----------
function newGame(mi=MAPI,opt={}){
  setMap(mi);genMap();const pk=perks();if(typeof revived!=='undefined')revived=false;
  S={res:{g:200+pk.gold*40,w:90,c:0},lives:20+pk.wall*4,maxLives:20+pk.wall*4,maxWave:opt.endless?9999:FEAT.campaign?MAP.waves:20,hpBoost:opt.endless?1:FEAT.campaign?MAP.boost:1,endless:!!opt.endless,adGold:0,pk,
    dmgMul:1+pk.dmg*.08,cdMul:1-pk.spell*.12,units:[],heroSel:false,rallyFor:null,wave:0,waveActive:false,countdown:-1,waveTime:0,spawnQ:[],
    time:0,dayT:.08,buildings:[],enemies:[],proj:[],meteors:[],
    castleLvl:1,castleCd:0,castleHit:0,castleAng:Math.PI/2,sel:null,buildSel:null,spellSel:null,hover:null,cd:{meteor:0,frost:0},
    speed:1,paused:false,running:false,over:false,kills:0,shake:0,frostFlash:0,earned:0};
  if(FEAT.hero)S.units.push(newHero());
  R.rebuild('all');makeCards();hidePanel();$('#wave').textContent=`0/${S.maxWave}`;
}
const fmt=n=>Math.floor(n).toLocaleString('de-AT');
function afford(c){return(c.g||0)<=S.res.g&&(c.w||0)<=S.res.w&&(c.c||0)<=S.res.c}
function pay(c){S.res.g-=c.g||0;S.res.w-=c.w||0;S.res.c-=c.c||0}
function give(c,x,y,h=0){for(const k of['g','w','c'])if(c[k]){S.res[k]+=c[k];if(k==='g')S.earned+=c[k];bump(k);if(x!=null)R.fx('text',{x,y,h,txt:'+'+c[k],k})}}
function costHTML(c){return['g','w','c'].filter(k=>c[k]).map(k=>`<span class="${S.res[k]<c[k]?'no':''}"><i class="ic ${k}"></i>${c[k]}</span>`).join('')}
function maxLvl(){return Math.min(3,S.castleLvl+1)}
function canPlace(t,x,y){
  if(!inG(x,y)||occ[y][x])return false;const d=DEF[t];
  if(d.on)return grid[y][x]===d.on;
  if(d.k==='b'&&!nearPath(x+.5,y+.5,d.rng))return false;
  return grid[y][x]===G;
}
function adjBonus(t,x,y,l=1){const d=DEF[t];return d.adj?countAdj(x,y,d.adj)*(d.adjB==='g'?2:1)*(1+(l-1)*.5):0}
function prodOf(b){const d=DEF[b.t],p={...d.lv[b.l-1].p};if(d.adj)p[d.adjB]=(p[d.adjB]||0)+adjBonus(b.t,b.x,b.y,b.l);for(const k in p)p[k]=Math.round(p[k]);return p}
function place(t,x,y){
  const d=DEF[t],c=d.cost[0];
  if(d.req&&S.castleLvl<d.req){toast(`${d.n} braucht Burg Stufe ${d.req}`);sfx('err');return false}
  if(!canPlace(t,x,y)){toast(d.on?'Nur auf Kristalladern baubar':'Hier kann nicht gebaut werden');sfx('err');return false}
  if(!afford(c)){toast('Nicht genug Rohstoffe');sfx('err');return false}
  pay(c);
  const b={t,x,y,l:1,cd:.3,ang:Math.PI/2,anim:0,pt:Math.random()*2,spent:{...c},recoil:0,tgt:null,id:Math.random()};
  S.buildings.push(b);occ[y][x]=b;R.fx('build',{x,y});sfx('build');metaEv('build');
  if(d.k==='b'){b.rally=nearPath(x+.5,y+.5,d.rng);for(let i=0;i<3;i++)S.units.push(newSoldier(b,i))}
  return true;
}
function upgrade(b){
  if(b.l>=3)return;if(b.l>=maxLvl()){toast('Baue zuerst die Burg aus');sfx('err');return}
  const c=DEF[b.t].cost[b.l];if(!afford(c)){toast('Nicht genug Rohstoffe');sfx('err');return}
  pay(c);for(const k in c)b.spent[k]=(b.spent[k]||0)+c[k];b.l++;b.anim=0;
  if(DEF[b.t].k==='b')for(const u of S.units)if(u.b===b){const L=DEF.barracks.lv[b.l-1];u.max=Math.round(L.hp*(1+.2*(S.pk.barr||0)));u.hp=u.dead?u.hp:u.max;u.atk=L.atk}R.fx('upgrade',{x:b.x,y:b.y});sfx('build');sfx('coin');showPanel();
}
function sell(b){
  const r={};for(const k in b.spent)r[k]=Math.floor(b.spent[k]*.5);give(r,b.x+.5,b.y+.5,.8);
  S.buildings=S.buildings.filter(o=>o!==b);occ[b.y][b.x]=null;
  for(const u of S.units)if(u.b===b){releaseU(u);u.gone=1}S.units=S.units.filter(u=>!u.gone);R.fx('build',{x:b.x,y:b.y});sfx('build');S.sel=null;hidePanel();
}
function upCastle(){
  const n=S.castleLvl+1,c=CASTLE_UP[n];if(!c)return;if(!afford(c)){toast('Nicht genug Rohstoffe');sfx('err');return}
  pay(c);S.castleLvl=n;metaEv('castle',n);S.maxLives+=10;S.lives=S.maxLives;
  R.fx('castleUp',{});S.shake=6;sfx('win');
  banner(`Burg Stufe ${n}`,n===2?'Blitzturm und Stufe-3-Ausbau frei':'Burg-Balliste schießt mit');makeCards();showPanel();
}
function clearTile(x,y){
  const t=grid[y][x];
  if(t===TREE){grid[y][x]=G;give({w:10},x+.5,y+.5,.6);R.fx('leaves',{x,y});sfx('build')}
  else if(t===ROCK){if(S.res.w<10){toast('Fels abbauen kostet 10 Holz');sfx('err');return}S.res.w-=10;grid[y][x]=G;give({g:25},x+.5,y+.5,.6);R.fx('rock',{x,y});sfx('boom')}
  buildDecor();R.rebuild('decor');S.sel=null;hidePanel();
}

// ---------- Wellen ----------
function startWave(){
  if(S.waveActive||S.over)return;
  if(S.countdown>0&&S.wave>0){const b=Math.ceil(S.countdown*2);give({g:b});toast(`Früh gerufen +${b} Gold`)}
  S.countdown=-1;const n=++S.wave;S.waveActive=true;S.waveTime=0;S.spawnQ=[];
  let t=0;for(const[type,count,gap]of getWave(n)){for(let i=0;i<count;i++){S.spawnQ.push({type,t});t+=gap||.1}t+=1.8}
  S.spawnQ.sort((a,b)=>a.t-b.t);
  const bossT=getWave(n).find(g=>EN[g[0]].boss);
  if(bossT){banner(`Welle ${n}`,`${EN[bossT[0]].n} greift an!`);sfx('boss')}else{banner(`Welle ${n}`,n===1?'Verteidige die Burg!':'');sfx('wave')}
  S.running=true;
}
function waveCleared(){
  S.waveActive=false;const r=25+S.wave*6;give({g:r});metaEv('wave',S.wave);
  if(S.wave>=S.maxWave){endGame(true);return}
  banner('Welle geschafft',`+${r} Gold`);S.countdown=FEAT.campaign?14:22;sfx('win');
}
function spawn(type){
  const d=EN[type],m=hpMul(S.wave)*S.hpBoost,P=d.air?AIR:PATH;
  const e={type,d:0,P,hp:d.hp*m,max:d.hp*m,spd:d.spd*rand(.95,1.05),arm:d.arm,fly:!!d.fly,g:Math.round(d.g*(1+(S.wave-1)*.04)),dmg:d.dmg,sz:d.sz,boss:!!d.boss,
    slow:0,slowT:0,hit:0,ph:Math.random()*10,dir:1,dx:1,dy:0,x:0,y:0,lane:(Math.random()-.5)*.36,id:Math.random()};
  const p=pathPos(P,0);e.x=p[0];e.y=p[1];S.enemies.push(e);
  // Elite: ab Welle 5, mehr Leben und Rüstung, doppelte Beute
  if(!e.boss&&S.wave>=5&&Math.random()<Math.min(.35,(S.wave-4)*.045)){e.elite=1;e.hp*=1.8;e.max=e.hp;e.arm=Math.min(.7,e.arm+.2);e.sz*=1.18;e.g*=2;
    if(!S.eliteSeen){S.eliteSeen=1;banner('Elite-Gegner!','Mehr Leben und Rüstung: Blitzturm und Frostmagier helfen')}}
  if(e.boss)S.shake=8;
}

// ---------- Kampf ----------
const tgtH=e=>e.fly?R.flyH(e):.28*e.sz;
function hurt(e,dmg,magic){if(e.hp<=0)return;const d=magic?dmg:dmg*(1-e.arm);e.hp-=d;e.hit=.12;if(e.hp<=0)kill(e)}
function kill(e){
  S.kills++;give({g:e.g});const h=tgtH(e);R.fx('text',{x:e.x,y:e.y,h:h+.35*e.sz,txt:'+'+e.g,k:'g'});
  const hero=S.units.find(u=>u.k==='hero'&&!u.dead);if(hero&&Math.hypot(hero.x-e.x,hero.y-e.y)<3.2)heroXP(hero,e.g);
  metaEv('kill',e);R.fx('kill',{e});flyCoins(e.x,e.y,h,Math.min(5,1+Math.floor(e.g/8)));
  if(e.boss){S.shake=14;banner(`${EN[e.type].n} besiegt!`,`+${e.g} Gold`);sfx('boom')}
  sfx('coin');
}
function nearest(x,y,r,air,skip){let best=null,bd=1e9;for(const e of S.enemies){if(e.hp<=0||(e.fly&&!air)||(skip&&skip.has(e)))continue;const d=Math.hypot(e.x-x,e.y-y);if(d<r&&d<bd){bd=d;best=e}}return best}
function firstIn(x,y,r,air){let best=null,bp=-1;for(const e of S.enemies){if(e.hp<=0||(e.fly&&!air))continue;if(Math.hypot(e.x-x,e.y-y)>r)continue;const p=e.d/e.P.len;if(p>bp){bp=p;best=e}}return best}
function homing(p){S.proj.push(p);p.x=p.sx;p.y=p.sy;p.h=p.h0;p.d0=Math.max(.3,Math.hypot(p.tg.x-p.sx,p.tg.y-p.sy))}
function updBuilding(b,dt){
  b.anim=Math.min(1,b.anim+dt*2.5);b.recoil=Math.max(0,b.recoil-dt*4);
  const d=DEF[b.t];
  if(d.k==='e'){if(S.wave<1)return;b.pt+=dt;if(b.pt>=6){b.pt-=6;const p=prodOf(b);give(p,b.x+.5,b.y+.5,.9);sfx('prod');if(b.t==='cmine')R.fx('sparkle',{x:b.x+.5,y:b.y+.5,h:.6,c:'#9ff2ff',n:8})}return}
  if(d.k==='b')return;
  let L=d.lv[b.l-1];const cx=b.x+.5,cy=b.y+.5;b.cd-=dt;
  const tg=firstIn(cx,cy,L.rng,d.air);b.tgt=tg;
  if(tg){const ta=Math.atan2(tg.y-cy,tg.x-cx);let da=((ta-b.ang+Math.PI*3)%TAU)-Math.PI;b.ang+=da*Math.min(1,dt*12)}
  if(!tg||b.cd>0)return;
  b.cd=L.rate;const h0=R.towerH(b),L0=L;L={...L0,dmg:L0.dmg*S.dmgMul};
  if(b.t==='archer'){homing({k:'arrow',sx:cx,sy:cy,h0,tg,dmg:L.dmg,spd:12});sfx('arrow')}
  else if(b.t==='cannon'){const ft=.7,sp=tg.spd*(tg.slowT>0?1-tg.slow:1),pp=pathPos(tg.P,tg.d+sp*ft);
    S.proj.push({k:'ball',sx:cx,sy:cy,x:cx,y:cy,h0,h:h0,tx:pp[0],ty:pp[1],t:0,ft,dmg:L.dmg,spl:L.spl,lv:b.l});b.recoil=1;
    R.fx('muzzle',{b});sfx('cannon');S.shake=Math.max(S.shake,1.5)}
  else if(b.t==='frost'){homing({k:'frost',sx:cx,sy:cy,h0,tg,dmg:L.dmg,spd:7,slow:L.slow,st:L.st,spl:L.spl||0});sfx('frost')}
  else if(b.t==='tesla'){
    const hit=new Set([tg]),pts=[[cx,cy,h0]];let cur=tg,dmg=L.dmg;
    for(let i=0;i<L.ch&&cur;i++){pts.push([cur.x,cur.y,tgtH(cur)]);hurt(cur,dmg,true);R.fx('sparkle',{x:cur.x,y:cur.y,h:tgtH(cur),c:'#c9f4ff',n:5});dmg*=.8;const nx=nearest(cur.x,cur.y,1.7,true,hit);if(nx)hit.add(nx);cur=nx}
    R.fx('bolt',{pts});sfx('zap');b.recoil=1}
}
function updCastle(dt){
  if(S.castleLvl<3)return;const[cx,cy]=CASTLE_C;const tg=firstIn(cx,cy,4.6,true);
  if(tg){S.castleAng=Math.atan2(tg.y-cy,tg.x-cx)}
  S.castleCd-=dt;if(S.castleCd>0||!tg)return;S.castleCd=.8;
  homing({k:'arrow',sx:cx,sy:cy,h0:R.castleH(),tg,dmg:42,spd:13,big:1});sfx('arrow');
}
function updProj(dt){
  for(const p of S.proj){
    if(p.k==='arrow'||p.k==='frost'){
      if(p.tg&&p.tg.hp>0){p.tx=p.tg.x;p.ty=p.tg.y;p.th=tgtH(p.tg)}
      if(p.tx==null){p.dead=1;continue}
      const dx=p.tx-p.x,dy=p.ty-p.y,d=Math.hypot(dx,dy),s=p.spd*dt;p.ang=Math.atan2(dy,dx);
      if(d<=s+.05){p.dead=1;if(p.tg&&p.tg.hp>0){
        if(p.k==='arrow'){hurt(p.tg,p.dmg,false);R.fx('hit',{x:p.tx,y:p.ty,h:p.th})}
        else{const ap=e=>{hurt(e,p.dmg,true);e.slow=Math.max(e.slowT>0?e.slow:0,p.slow);e.slowT=Math.max(e.slowT,p.st)};ap(p.tg);
          if(p.spl)for(const e of S.enemies)if(e!==p.tg&&e.hp>0&&Math.hypot(e.x-p.tg.x,e.y-p.tg.y)<p.spl)ap(e);
          R.fx('frostHit',{x:p.tx,y:p.ty,h:p.th})}}}
      else{p.x+=dx/d*s;p.y+=dy/d*s;p.h=lerp(p.h0,p.th,clamp(1-(d-s)/p.d0,0,1))}
    }else if(p.k==='ball'){
      p.t+=dt/p.ft;const t=Math.min(1,p.t);p.x=lerp(p.sx,p.tx,t);p.y=lerp(p.sy,p.ty,t);p.h=lerp(p.h0,0,t)+Math.sin(t*Math.PI)*1.3;
      if(p.t>=1){p.dead=1;const r=p.spl;
        for(const e of S.enemies){if(e.fly||e.hp<=0)continue;const dd=Math.hypot(e.x-p.tx,e.y-p.ty);if(dd<r)hurt(e,p.dmg*(1-dd/r*.5),false)}
        R.fx('explode',{x:p.tx,y:p.ty,s:.8+p.lv*.15});S.shake=Math.max(S.shake,3);sfx('boom')}
    }
  }
  S.proj=S.proj.filter(p=>!p.dead);
  for(const m of S.meteors){m.t+=dt/.75;
    if(m.t>=1){m.dead=1;for(const e of S.enemies){const dd=Math.hypot(e.x-m.x,e.y-m.y);if(dd<1.7&&e.hp>0)hurt(e,220*(1+S.wave*.06)*(1-dd/1.7*.4),true)}R.fx('explode',{x:m.x,y:m.y,s:2.4});S.shake=16;sfx('boom');sfx('cannon')}}
  S.meteors=S.meteors.filter(m=>!m.dead);
}
function updEnemies(dt){
  for(const e of S.enemies){
    if(e.hp<=0)continue;
    if(e.slowT>0)e.slowT-=dt;
    if(e.blk){const u=e.blk;if(u.dead||u.gone)e.blk=null;else{e.hit-=dt;e.ph+=dt*3;const dd=Math.hypot(u.x-e.x,u.y-e.y)||1;e.dx=(u.x-e.x)/dd;e.dy=(u.y-e.y)/dd;
      e.acd=(e.acd||.4)-dt;if(e.acd<=0){e.acd=1.1;u.hp-=EN[e.type].atk*(1+(S.wave-1)*.05);u.hurt=.15;if(u.hp<=0)unitDie(u)}continue}}
    const sp=e.spd*(e.slowT>0?1-e.slow:1);
    e.d+=sp*dt;e.ph+=dt*sp*4;e.hit-=dt;
    const p=pathPos(e.P,e.d),ox=e.x;e.x=p[0]-p[3]*e.lane;e.y=p[1]+p[2]*e.lane;e.dx=p[2];e.dy=p[3];
    if(Math.abs(e.x-ox)>.001)e.dir=e.x>ox?1:-1;
    if(e.d>=e.P.len){e.hp=0;e.done=1;S.lives-=e.dmg;S.castleHit=.4;S.shake=Math.max(S.shake,5);sfx('hurt');R.fx('text',{x:CASTLE_C[0],y:CASTLE_C[1],h:2.2,txt:'-'+e.dmg,k:'h'});
      if(S.lives<=0){S.lives=0;endGame(false)}}
  }
  S.enemies=S.enemies.filter(e=>e.hp>0);
}
function update(dt){
  S.time+=dt;S.dayT=NIGHT?(S.dayT+dt/180)%1:.04;
  if(S.waveActive){S.waveTime+=dt;while(S.spawnQ.length&&S.spawnQ[0].t<=S.waveTime)spawn(S.spawnQ.shift().type);if(!S.spawnQ.length&&!S.enemies.length)waveCleared()}
  else if(S.countdown>0){S.countdown-=dt;if(S.countdown<=0){S.countdown=-1;startWave()}}
  for(const b of S.buildings)updBuilding(b,dt);
  updCastle(dt);updUnits(dt);updEnemies(dt);updProj(dt);
  for(const k in S.cd)S.cd[k]=Math.max(0,S.cd[k]-dt);
}
function decay(dt){
  S.shake*=Math.pow(.004,dt);if(S.shake<.2)S.shake=0;S.castleHit=Math.max(0,S.castleHit-dt);S.frostFlash=Math.max(0,S.frostFlash-dt);
  if(!S.running&&!S.over)S.dayT=NIGHT?(S.dayT+dt/240)%1:.04;
}
function dayLight(){return .5+.5*Math.cos(S.dayT*TAU)}
function night(){return clamp((.42-dayLight())/.32,0,1)}

// ---------- Einheiten: Held und Soldaten ----------
const HERO_XP=[0,50,140,280,480],SLOT=[[0,0],[-.3,.26],[.3,.26]];
function heroStats(u){const l=u.lvl,m=1+.15*((S&&S.pk&&S.pk.hero)||0);u.max=Math.round((240+70*(l-1))*m);u.atk=Math.round((16+8*(l-1))*m)}
function newHero(){const u={k:'hero',x:20.5,y:9.2,hx:20.5,hy:9.2,hp:1,max:1,atk:1,rate:.75,cd:0,spd:2.3,tgt:null,dead:false,rt:0,ang:-Math.PI/2,swing:0,lvl:1,xp:0,id:Math.random(),hurt:0,wcd:0};heroStats(u);u.hp=u.max;return u}
function newSoldier(b,i){const L=DEF.barracks.lv[b.l-1],hp=Math.round(L.hp*(1+.2*(S.pk.barr||0)));return{k:'sol',b,slot:i,x:b.x+.5,y:b.y+.5,hp,max:hp,atk:L.atk,rate:1,cd:0,spd:1.6,tgt:null,dead:true,rt:.4+i*.7,ang:0,swing:0,id:Math.random(),hurt:0}}
const heroU=()=>S.units.find(u=>u.k==='hero');
function nearPath(x,y,r){let best=null,bd=r;for(const s of PATH.segs)for(let d=0;d<=s.len;d+=.1){const px=s.x0+s.ux*d,py=s.y0+s.uy*d;if(px<0||px>COLS||py<0||py>ROWS)continue;const dd=Math.hypot(px-x,py-y);if(dd<bd){bd=dd;best={x:px,y:py}}}return best}
function releaseU(u){for(const e of S.enemies)if(e.blk===u)e.blk=null;u.tgt=null}
function unitDie(u){u.dead=true;u.hp=0;releaseU(u);u.rt=u.k==='hero'?15:10;R.fx('unitDie',{u});if(u.k==='hero'){toast('Der Held ist gefallen und kehrt in 15 s zurück');S.heroSel=false}}
function respawn(u){u.dead=false;u.hp=u.max;if(u.k==='hero'){u.x=u.hx=20.5;u.y=u.hy=9.2}else{u.x=u.b.x+.5;u.y=u.b.y+.5}}
function heroXP(u,n){if(u.lvl>=5)return;u.xp+=n;while(u.lvl<5&&u.xp>=HERO_XP[u.lvl]){u.lvl++;heroStats(u);u.hp=u.max;R.fx('sparkle',{x:u.x,y:u.y,h:.6,c:'#ffd23f',n:30});banner('Held Stufe '+u.lvl,'Mehr Leben und Schaden');sfx('win');metaEv('hero',u.lvl)}}
function homeOf(u){if(u.k==='hero')return[u.hx,u.hy];const r=u.b.rally||{x:u.b.x+.5,y:u.b.y+.5},o=SLOT[u.slot];return[r.x+o[0],r.y+o[1]]}
function moveTo(u,tx,ty,dt){const dx=tx-u.x,dy=ty-u.y,d=Math.hypot(dx,dy);if(d<.03)return true;const s=Math.min(d,u.spd*dt);u.x+=dx/d*s;u.y+=dy/d*s;u.ang=Math.atan2(dy,dx);u.walk=(u.walk||0)+s*6;return false}
function updUnits(dt){
  for(const u of S.units){
    u.swing=Math.max(0,u.swing-dt*4);u.hurt=Math.max(0,u.hurt-dt);if(u.k==='hero')u.wcd=Math.max(0,u.wcd-dt);
    if(u.dead){u.rt-=dt;if(u.rt<=0)respawn(u);continue}
    if(u.tgt&&(u.tgt.hp<=0||!S.enemies.includes(u.tgt)))u.tgt=null;
    if(u.k==='hero'&&u.order){if(u.tgt)releaseU(u);if(moveTo(u,u.hx,u.hy,dt))u.order=false;continue}
    const[hx,hy]=homeOf(u);
    if(!u.tgt){const cx=u.k==='hero'?u.x:hx,cy=u.k==='hero'?u.y:hy,rr=u.k==='hero'?1.7:1.3;let best=null,bs=1e9;
      for(const e of S.enemies){if(e.fly||e.hp<=0)continue;const d=Math.hypot(e.x-cx,e.y-cy);if(d>rr)continue;const sc=d+(e.blk&&e.blk!==u?3:0);if(sc<bs){bs=sc;best=e}}u.tgt=best}
    if(u.tgt){const e=u.tgt,d=Math.hypot(e.x-u.x,e.y-u.y);
      if(d>.42)moveTo(u,e.x,e.y,dt);else{u.ang=Math.atan2(e.y-u.y,e.x-u.x);if(!e.blk)e.blk=u;u.cd-=dt;if(u.cd<=0){u.cd=u.rate;u.swing=1;hurt(e,u.atk*S.dmgMul,false);R.fx('hit',{x:e.x,y:e.y,h:.35})}}
      if(u.k==='sol'&&Math.hypot(u.x-hx,u.y-hy)>2.2)releaseU(u)}
    else{moveTo(u,hx,hy,dt);if(u.hp<u.max)u.hp=Math.min(u.max,u.hp+dt*(u.k==='hero'?14:7))}
  }
}
function heroWhirl(){const h=heroU();if(!h)return;if(h.dead){toast('Der Held ist noch nicht zurück');sfx('err');return}if(h.wcd>0){toast('Wirbelschlag lädt noch');sfx('err');return}
  h.wcd=18*S.cdMul;h.swing=1;const dmg=60+30*(h.lvl-1);for(const e of S.enemies)if(e.hp>0&&Math.hypot(e.x-h.x,e.y-h.y)<1.7)hurt(e,dmg*S.dmgMul,false);R.fx('whirl',{x:h.x,y:h.y});S.shake=5;sfx('boom')}
function selectHero(){ac();const h=heroU();if(!h)return;if(h.dead){toast(`Der Held kehrt in ${Math.ceil(h.rt)} s zurück`);sfx('err');return}
  S.buildSel=null;S.spellSel=null;S.heroSel=!S.heroSel;S.sel=S.heroSel?{hero:h}:null;if(S.heroSel){showPanel();toast('Tippe auf die Karte, um den Helden zu bewegen')}else hidePanel();sfx('click')}

// ---------- UI ----------
const RES={g:$('#rg'),w:$('#rw'),c:$('#rc')};
function bump(k){const el=RES[k];el.classList.remove('bump');void el.offsetWidth;el.classList.add('bump')}
function flyCoins(x,y,h,n){
  const p=R.toScreen(x,y,h);if(!p)return;const tg=RES.g.querySelector('.ic').getBoundingClientRect(),wrap=$('#flyers');
  for(let i=0;i<n;i++){const el=document.createElement('i');el.className='ic g fly';wrap.appendChild(el);
    const mx=lerp(p.x,tg.left,.4)+rand(-60,60),my=Math.min(p.y,tg.top)-rand(30,90);
    const an=el.animate([{transform:`translate(${p.x-11}px,${p.y-11}px) scale(.6)`,opacity:1},{transform:`translate(${mx}px,${my}px) scale(1.1)`,opacity:1,offset:.45},{transform:`translate(${tg.left}px,${tg.top}px) scale(.8)`,opacity:.9}],
      {duration:650+i*90+rand(0,80),easing:'cubic-bezier(.4,0,.7,1)'});an.onfinish=()=>{el.remove();bump('g')}}
}
function makeCards(){
  const wrap=$('#cards');wrap.innerHTML='';
  ORDER.forEach((t,i)=>{const d=DEF[t],el=document.createElement('button');el.className='card';el.dataset.t=t;el.title=d.d;
    el.innerHTML=`<span class="key">${i+1}</span><canvas width="144" height="116"></canvas><div class="nm">${d.n}</div><div class="cs">${costHTML(d.cost[0])}</div>${d.req&&S.castleLvl<d.req?`<div class="lk">Burg ${d.req}</div>`:''}`;
    el.onclick=()=>selectBuild(t);trDOM(el);wrap.appendChild(el);R.thumb(t,el.querySelector('canvas'))});
}
function selectBuild(t){ac();sfx('click');S.spellSel=null;S.sel=null;hidePanel();S.buildSel=S.buildSel===t?null:t;
  if(S.buildSel){const d=DEF[t];if(d.req&&S.castleLvl<d.req){toast(`${d.n}: erst ab Burg Stufe ${d.req}`);S.buildSel=null}else toast(`${d.n}: ${d.good||d.d}`)}}
let lastUI='',lastPK='';
// Zustand der Knöpfe im offenen Panel: ändert er sich (z. B. genug Gold), wird das Panel neu gezeichnet
function panelKey(){const s=S.sel;if(!s||$('#panel').hidden||s.hero)return'';let c=null;
  if(s.b)c=s.b.l<3?DEF[s.b.t].cost[s.b.l]:{};else if(s.castle)c=CASTLE_UP[S.castleLvl+1]||{};else if(s.tile)c=grid[s.tile.y][s.tile.x]===CRY?DEF.cmine.cost[0]:{w:10};
  return c?['g','w','c'].map(k=>S.res[k]>=(c[k]||0)?1:0).join('')+maxLvl()+(s.b?s.b.l:''):''}
function updUI(){
  for(const k of['g','w','c'])RES[k].querySelector('b').textContent=fmt(S.res[k]);
  const pr={g:0,w:0,c:0};for(const b of S.buildings)if(DEF[b.t].k==='e'){const p=prodOf(b);for(const k in p)pr[k]+=p[k]}
  for(const k of['g','w','c'])RES[k].querySelector('.rate').textContent=pr[k]?`+${(pr[k]/6).toFixed(1)}/s`:'';
  $('#lives').textContent=S.lives;$('#wave').textContent=S.endless?`${S.wave}`:`${S.wave}/${S.maxWave}`;
  for(const el of document.querySelectorAll('.card')){const d=DEF[el.dataset.t];el.classList.toggle('sel',S.buildSel===el.dataset.t);el.classList.toggle('poor',!afford(d.cost[0]));el.classList.toggle('lock',!!(d.req&&S.castleLvl<d.req));
    el.querySelectorAll('.cs span').forEach((sp,i)=>{const k=['g','w','c'].filter(k=>d.cost[0][k])[i];sp.className=S.res[k]<d.cost[0][k]?'no':''})}
  const wb=$('#wavebtn');let key;
  if(S.over)key='over';else if(S.waveActive)key='act'+S.wave+'_'+S.spawnQ.length+'_'+S.enemies.length;else key='wait'+S.wave+'_'+Math.ceil(S.countdown);
  if(key!==lastUI){lastUI=key;
    if(S.waveActive){wb.disabled=true;wb.classList.remove('pulse');wb.innerHTML=`Welle ${S.wave}<small>${S.enemies.length+S.spawnQ.length} Gegner übrig</small>`}
    else{wb.disabled=!!S.over;wb.classList.toggle('pulse',S.wave===0);wb.innerHTML=S.countdown>0?`Welle ${S.wave+1}<small>in ${Math.ceil(S.countdown)} s · jetzt +${Math.ceil(S.countdown*2)} Gold</small>`:`Welle ${S.wave+1}<small>${S.wave===0?'Zuerst bauen, dann los!':'Starten'}</small>`}trDOM(wb)}
  for(const[k,c,cd]of[['meteor',20,30],['frost',12,25]]){const el=$('#sp-'+k);el.querySelector('.cd').style.setProperty('--p',(S.cd[k]/(cd*S.cdMul)*100)+'%');el.classList.toggle('off',S.res.c<c||S.cd[k]>0);el.classList.toggle('sel',S.spellSel===k)}
  if(FEAT.hero){const h=heroU(),el=$('#sp-hero');if(h&&el){el.querySelector('.cd').style.setProperty('--p',h.dead?(h.rt/15*100)+'%':'0%');el.classList.toggle('sel',S.heroSel);$('#hlv').textContent=h.dead?Math.ceil(h.rt)+' s':trx('Stufe '+h.lvl)}}
  const pk=panelKey();if(pk!==lastPK){lastPK=pk;if(pk)showPanel(true)}
  if(FEAT.campaign)metaUI();
  document.body.classList.toggle('menu',!$('#start').hidden||!$('#end').hidden);
  $('#pauseov').hidden=!(S.paused&&S.running&&!S.over&&!ADS.busy&&$('#start').hidden&&$('#end').hidden);
  $('#bspeed').textContent=S.speed+'×';$('#bpause').textContent=S.paused?'▶':'II';$('#bmute').textContent=muted?'×':'♪';
}
function dockVar(){const r=$('#cards').getBoundingClientRect();if(r.height)document.documentElement.style.setProperty('--dockTop',Math.round(innerHeight-r.top+2)+'px')}
function stars(l){return`<div class="lv">${[1,2,3].map(i=>`<i class="${i<=l?'on':''}"></i>`).join('')}</div>`}
// Symbole und Balken für das Info-Panel
const PSV=p=>`<svg viewBox="0 0 20 20" aria-hidden="true">${p}</svg>`,OLs='stroke="#2a1a0e" stroke-width="1.3" stroke-linejoin="round"';
const SIC={
  dmg:PSV(`<path d="M16 1.5h2.5V4L9.5 13 7 10.5z" fill="#e8eef5" ${OLs}/><path d="M4 10.5l5.5 5.5" stroke="#2a1a0e" stroke-width="3" stroke-linecap="round"/><path d="M4 10.5l5.5 5.5" stroke="#d9a03a" stroke-width="1.4" stroke-linecap="round"/><path d="M3 18.5l3.2-3.2" stroke="#2a1a0e" stroke-width="2.6" stroke-linecap="round"/>`),
  rate:PSV(`<path d="M3 4l6 6-6 6M10 4l6 6-6 6" fill="none" stroke="#2a1a0e" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M3 4l6 6-6 6M10 4l6 6-6 6" fill="none" stroke="#7ee05a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`),
  rng:PSV(`<circle cx="10" cy="10" r="8" fill="rgba(255,210,60,.35)" stroke="#2a1a0e" stroke-width="1.6"/><circle cx="10" cy="10" r="4.5" fill="none" stroke="#c9303f" stroke-width="1.6"/><circle cx="10" cy="10" r="1.8" fill="#c9303f"/>`),
  slow:PSV(`<g stroke="#2a1a0e" stroke-width="3.4" stroke-linecap="round"><path d="M10 2v16M3 6l14 8M3 14l14-8"/></g><g stroke="#8fe0ff" stroke-width="1.6" stroke-linecap="round"><path d="M10 2v16M3 6l14 8M3 14l14-8"/></g>`),
  ch:PSV(`<path d="M12 1L4 11.5h5L7 19l9-11h-5.5z" fill="#ffd23f" ${OLs}/>`),
  spl:PSV(`<path d="M10 1l2 5 5-2-2 5 4 2-4 2 2 5-5-2-2 5-2-5-5 2 2-5-4-2 4-2-2-5 5 2z" fill="#ff8a2a" ${OLs}/><circle cx="10" cy="10" r="2.6" fill="#ffe08a"/>`),
  hp:PSV(`<path d="M10 17.5s-7.5-4.6-7.5-9.4A4 4 0 0 1 10 6a4 4 0 0 1 7.5 2.1c0 4.8-7.5 9.4-7.5 9.4z" fill="#e8475a" ${OLs}/>`),
  sol:PSV(`<path d="M10 1.5l7 3v5.2c0 4.2-3 7.3-7 8.8-4-1.5-7-4.6-7-8.8V4.5z" fill="#6a8fd8" ${OLs}/><path d="M10 4v12" stroke="#fff" stroke-width="1.6" opacity=".6"/>`),
  prod:PSV(`<path d="M3 15h14M5 15V9l3-2v8M10 15V6l3-2v11M15 15V8" fill="none" stroke="#2a1a0e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`),
  adj:PSV(`<path d="M10 2l4 6h-2.5l3.5 5H11v5H9v-5H5l3.5-5H6z" fill="#3a8a2e" ${OLs}/>`),
};
const UPI=PSV(`<path d="M10 1.5l7.5 8.5h-4.3v8.5H6.8V10H2.5z" fill="#fff" stroke="#1b5e22" stroke-width="1.5" stroke-linejoin="round"/>`);
const SELLI=PSV(`<path d="M2.5 7.5l5-5 4 4-2 2 7.5 7.5-2 2-7.5-7.5-2 2z" fill="#fff" stroke="#7a1420" stroke-width="1.4" stroke-linejoin="round"/>`);
// eine Zeile: Symbol | Text | Balken (jetzt + Zuwachs) | Wert → nächster Wert
function srow(ic,lab,a,b,max,f=x=>x){const pa=clamp(a/max,0,1)*100,pb=b!=null?clamp(b/max,0,1)*100:pa;
  return`<i class="si">${SIC[ic]}</i><span class="sl">${lab}</span><span class="sbar"><i style="width:${pa}%"></i>${pb>pa?`<u style="left:${pa}%;width:${pb-pa}%"></u>`:''}</span><span class="sv">${f(a)}${b!=null&&b!==a?`<b>➜ ${f(b)}</b>`:''}</span>`}
function thumbURL(t,l){const k=t+l;R._th=R._th||{};if(!R._th[k]){try{const c=document.createElement('canvas');c.width=144;c.height=116;R.thumb(t,c,l);R._th[k]=c.toDataURL()}catch(e){R._th[k]=''}}return R._th[k]}
function canUp(b){const d=DEF[b.t];return b.l<3&&b.l<maxLvl()&&afford(d.cost[b.l])}
// grüner Pfeil über ausbaubaren Gebäuden (Bildschirmkoordinaten)
function upArrow(g,x,y,s){const bob=Math.sin(performance.now()/260)*s*.12;y+=bob;g.save();
  g.beginPath();g.arc(x,y,s*.62,0,Math.PI*2);g.fillStyle='#2f9e3a';g.fill();g.lineWidth=Math.max(2,s*.1);g.strokeStyle='#123a12';g.stroke();
  g.beginPath();g.moveTo(x,y-s*.42);g.lineTo(x+s*.36,y);g.lineTo(x+s*.15,y);g.lineTo(x+s*.15,y+s*.38);g.lineTo(x-s*.15,y+s*.38);g.lineTo(x-s*.15,y);g.lineTo(x-s*.36,y);g.closePath();g.fillStyle='#fff';g.fill();g.restore()}
function showPanel(refresh){
  const p=$('#panel'),s=S.sel;if(!s){hidePanel();return}let h='<button class="x" data-a="close" aria-label="Schließen">×</button>';
  if(s.hero){const u=s.hero;h+=`<h3>Held Eckbert</h3>${stars(Math.min(3,Math.ceil(u.lvl*3/5)))}<p>Kämpft im Nahkampf und hält Gegner auf. Sammelt Erfahrung durch Siege in seiner Nähe.</p>
      <div class="stats"><span>Stufe</span><span>${u.lvl} / 5</span><span>Leben</span><span>${Math.ceil(u.hp)} / ${u.max}</span><span>Schaden</span><span>${u.atk}</span><span>Erfahrung</span><span>${u.lvl<5?u.xp+' / '+HERO_XP[u.lvl]:'max.'}</span></div>
      <div class="row"><button class="up" data-a="hmove">Bewegen<div class="pcost">dann auf Karte tippen</div></button><button class="up" data-a="whirl" ${u.wcd>0||u.dead?'disabled':''}>Wirbelschlag<div class="pcost">${u.wcd>0?Math.ceil(u.wcd)+' s':(60+30*(u.lvl-1))+' Flächenschaden'}</div></button></div>`;p.innerHTML=h;trDOM(p);p.hidden=false;return}
  if(s.b){const b=s.b,d=DEF[b.t],L=d.lv[b.l-1],N=b.l<3?d.lv[b.l]:null,c=b.l<3?d.cost[b.l]:null;
    const im=thumbURL(b.t,b.l),imN=N?thumbURL(b.t,b.l+1):'';
    h+=`<div class="phead"><div><h3>${d.n}</h3>${stars(b.l)}</div>${im?`<div class="pimg"><img src="${im}" alt="">${imN?`<span>➜</span><img class="nx" src="${imN}" alt="">`:''}</div>`:''}</div><p>${d.d}</p>${d.good?`<div class="vs"><span class="gd"><i>✔</i><span>${d.good}</span></span><span class="bd"><i>✖</i><span>${d.bad}</span></span></div>`:''}<div class="stats st4">`;
    const X=k=>Math.max(...d.lv.map(v=>v[k]||0));
    if(d.k==='b'){h+=srow('sol','Soldaten',3,null,3)+srow('hp','Leben je Soldat',L.hp,N&&N.hp,X('hp'))+srow('dmg','Schaden',L.atk,N&&N.atk,X('atk'))}
    else if(d.k==='t'){const sps=v=>+(1/v.rate).toFixed(2),pc=x=>Math.round(x*100)+'%';
      h+=srow('dmg','Schaden',L.dmg,N&&N.dmg,X('dmg'))+srow('rate','Schüsse/s',sps(L),N&&sps(N),Math.max(...d.lv.map(sps)))+srow('rng','Reichweite',L.rng,N&&N.rng,X('rng'));
      if(L.slow)h+=srow('slow','Verlangsamung',L.slow,N&&N.slow,X('slow'),pc);if(L.ch)h+=srow('ch','Ketten',L.ch,N&&N.ch,X('ch'));if(L.spl)h+=srow('spl','Radius',L.spl,N&&N.spl,X('spl'))}
    else{const pp=prodOf(b),[rk,rv]=Object.entries(pp)[0],nv=N?prodOf({...b,l:b.l+1})[rk]:null;
      h+=srow('prod','Ertrag / 6 s',rv,nv,Math.max(rv,nv||0,prodOf({...b,l:3})[rk]),v=>`<i class="ic ${rk}"></i> ${v}`);
      if(d.adj)h+=`<i class="si">${SIC.adj}</i><span class="sl">Nachbarbonus</span><span class="sw">${countAdj(b.x,b.y,d.adj)} ${d.adj===TREE?'Bäume':'Felsen'}</span>`}
    h+='</div><div class="row">';
    if(!c)h+=`<button class="up" disabled>Max. Stufe<div class="pcost">voll ausgebaut</div></button>`;
    if(c){const lock=b.l>=maxLvl(),ok=!lock&&afford(c);h+=`<button class="up${ok?' go':''}" data-a="up" ${ok?'':'disabled'}><span class="bt">${lock?'':UPI}<span>${lock?'Burg ausbauen':'Ausbauen'}</span></span><div class="pcost">${lock?`Stufe ${b.l+1} braucht Burg ${b.l}`:costHTML(c)}</div></button>`}
    const r={};for(const k in b.spent)r[k]=Math.floor(b.spent[k]*.5);
    if(d.k==='b')h+=`<button class="up" data-a="rally" style="flex:.8">Sammelpunkt<div class="pcost">auf Weg tippen</div></button>`;
    h+=`<button class="sell" data-a="sell"><span class="bt">${SELLI}<span>${sellArm===b?'Wirklich?':'Abreißen'}</span></span><div class="pcost">${costHTML(r).replace(/class="no"/g,'')}</div></button></div>`}
  else if(s.castle){const n=S.castleLvl+1,c=CASTLE_UP[n];
    h+=`<h3>Burg</h3>${stars(S.castleLvl)}<p>${n===2?'Stufe 2: +10 Leben, Blitzturm und Stufe-3-Ausbau für alle Gebäude.':n===3?'Stufe 3: +10 Leben und eine Balliste auf dem Bergfried.':'Voll ausgebaut. Die Balliste wacht über das Tor.'}</p>`;
    h+=`<div class="stats"><span>Leben</span><span>${S.lives} / ${S.maxLives}</span><span>Max. Gebäudestufe</span><span>${maxLvl()}</span></div>`;
    if(c)h+=`<div class="row"><button class="up" data-a="castle" ${afford(c)?'':'disabled'}>Burg ausbauen<div class="pcost">${costHTML(c)}</div></button></div>`}
  else if(s.tile){const{x,y}=s.tile,t=grid[y][x];
    if(t===TREE)h+=`<h3>Wald</h3><p>Bäume geben Sägewerken Bonus. Fällen bringt sofort Holz und macht Platz.</p><div class="row"><button class="up" data-a="clear">Fällen<div class="pcost"><span><i class="ic w"></i>+10</span></div></button></div>`;
    else if(t===ROCK)h+=`<h3>Fels</h3><p>Felsen geben Goldminen Bonus. Abbauen bringt Gold und macht Platz.</p><div class="row"><button class="up" data-a="clear" ${S.res.w<10?'disabled':''}>Abbauen<div class="pcost"><span class="${S.res.w<10?'no':''}"><i class="ic w"></i>-10</span><span><i class="ic g"></i>+25</span></div></button></div>`;
    else if(t===CRY)h+=`<h3>Kristallader</h3><p>Hier kann eine Kristallmine gebaut werden. Kristalle brauchst du für Blitztürme und Zauber.</p><div class="row"><button class="up" data-a="bcm">Kristallmine bauen<div class="pcost">${costHTML(DEF.cmine.cost[0])}</div></button></div>`}
  p.innerHTML=h;trDOM(p);p.hidden=false;if(!refresh)panelT=performance.now();
}
let sellArm=null,sellT=0,panelT=0;
function hidePanel(){$('#panel').hidden=true}
$('#panel').addEventListener('click',ev=>{const a=ev.target.closest('[data-a]');if(!a||a.disabled)return;
  if(a.dataset.a!=='close'&&performance.now()-panelT<350)return;ac();const s=S.sel;
  switch(a.dataset.a){case'close':S.sel=null;hidePanel();break;case'up':upgrade(s.b);break;case'sell':if(sellArm===s.b&&performance.now()-sellT<4000){sellArm=null;sell(s.b)}else{sellArm=s.b;sellT=performance.now();showPanel();toast('Zum Abreißen nochmal tippen');setTimeout(()=>{if(sellArm===s.b&&S.sel&&S.sel.b===s.b){sellArm=null;showPanel()}},4000)}break;case'castle':upCastle();break;
    case'clear':clearTile(s.tile.x,s.tile.y);break;
    case'hmove':S.heroSel=true;hidePanel();toast('Tippe auf die Karte, um den Helden zu bewegen');break;case'whirl':heroWhirl();showPanel();break;
    case'rally':S.rallyFor=s.b;hidePanel();toast('Tippe auf den Weg für den neuen Sammelpunkt');break;case'bcm':if(place('cmine',s.tile.x,s.tile.y)){S.sel={b:occ[s.tile.y][s.tile.x]};showPanel()}break}});
let toastT=0;function toast(t){const el=$('#toast');el.textContent=trx(t);el.classList.add('show');clearTimeout(toastT);toastT=setTimeout(()=>el.classList.remove('show'),1800)}
function banner(a,b){const el=$('#banner');el.innerHTML=`${trx(a)}${b?`<small>${trx(b)}</small>`:''}`;el.classList.remove('show');void el.offsetWidth;el.classList.add('show')}

// ---------- Eingabe ----------
const cv=$('#game');let lastTap=null,drag=null;
const pinch=new Map();
cv.addEventListener('pointermove',ev=>{
  if(pinch.has(ev.pointerId)){const o=pinch.get(ev.pointerId);pinch.set(ev.pointerId,{x:ev.clientX,y:ev.clientY});
    if(pinch.size===2&&R.zoom){const[a,b]=[...pinch.values()],[a0,b0]=[...pinch.entries()].map(([id,v])=>id===ev.pointerId?o:v);const d0=Math.hypot(a0.x-b0.x,a0.y-b0.y),d1=Math.hypot(a.x-b.x,a.y-b.y);if(d0>0)R.zoom(d1/d0);if(drag)drag.moved=true;return}}
  if(drag&&drag.id===ev.pointerId){const dx=ev.clientX-drag.x,dy=ev.clientY-drag.y;if(Math.hypot(ev.clientX-drag.sx,ev.clientY-drag.sy)>8)drag.moved=true;
    if(drag.moved&&R.canPan()){R.pan(dx,dy);S.hover=null}drag.x=ev.clientX;drag.y=ev.clientY}
  if(ev.pointerType==='mouse'&&!(drag&&drag.moved))S.hover=R.pick(ev.clientX,ev.clientY)});
cv.addEventListener('pointerleave',ev=>{if(ev.pointerType==='mouse')S.hover=null});
cv.addEventListener('contextmenu',ev=>{ev.preventDefault();cancel()});
cv.addEventListener('pointerdown',ev=>{pinch.set(ev.pointerId,{x:ev.clientX,y:ev.clientY});drag={x:ev.clientX,y:ev.clientY,sx:ev.clientX,sy:ev.clientY,moved:false,id:ev.pointerId};try{cv.setPointerCapture(ev.pointerId)}catch(e){}});
cv.addEventListener('pointercancel',ev=>{pinch.delete(ev.pointerId);drag=null});
cv.addEventListener('pointerup',ev=>{const multi=pinch.size>1;pinch.delete(ev.pointerId);const d=drag;drag=null;if(multi||(d&&d.moved))return;tap(ev)});
cv.addEventListener('wheel',ev=>{if(R.zoom){ev.preventDefault();R.zoom(ev.deltaY<0?1.1:1/1.1)}},{passive:false});
function tap(ev){
  if(!S.running&&!S.over&&!$('#start').hidden)return;ac();const t=R.pick(ev.clientX,ev.clientY);if(!t)return;
  if(S.spellSel){if(S.spellSel==='meteor'){S.meteors.push({x:t.fx,y:t.fy,t:0});S.res.c-=20;S.cd.meteor=30*S.cdMul;S.spellSel=null;S.hover=null}return}
  if(S.rallyFor){const b=S.rallyFor,pp=nearPath(t.fx,t.fy,.8);S.rallyFor=null;
    if(pp&&Math.hypot(pp.x-b.x-.5,pp.y-b.y-.5)<=DEF.barracks.rng+.3){b.rally=pp;for(const u of S.units)if(u.b===b)releaseU(u);R.fx('mark',{x:pp.x,y:pp.y});sfx('click')}else{toast('Der Sammelpunkt muss auf dem Weg in Reichweite liegen');sfx('err')}return}
  if(S.heroSel){const h=heroU();S.heroSel=false;S.sel=null;hidePanel();if(h&&!h.dead){h.hx=clamp(t.fx,.3,COLS-.3);h.hy=clamp(t.fy,.3,ROWS-.3);h.order=true;R.fx('mark',{x:h.hx,y:h.hy});sfx('click')}return}
  if(t.unit&&t.unit.k==='hero'&&!S.buildSel){S.sel={hero:t.unit};S.heroSel=true;showPanel();sfx('click');return}
  if(S.buildSel){
    if(ev.pointerType!=='mouse'&&!(lastTap&&lastTap.x===t.x&&lastTap.y===t.y)){S.hover=t;lastTap=t;if(canPlace(S.buildSel,t.x,t.y)){confirmAt=t}else{confirmAt=null;toast(DEF[S.buildSel].on?'Nur auf Kristalladern baubar':'Hier kann nicht gebaut werden')}return}
    confirmAt=null;if(place(S.buildSel,t.x,t.y)){if(!afford(DEF[S.buildSel].cost[0])||!ev.shiftKey)S.buildSel=null;S.hover=ev.pointerType==='mouse'?t:null}lastTap=null;return}
  if(!inG(t.x,t.y)){S.sel=null;hidePanel();return}
  const b=occ[t.y][t.x],k=grid[t.y][t.x];
  if(b)S.sel={b};else if(k===CAS)S.sel={castle:1};else if(k===TREE||k===ROCK||k===CRY)S.sel={tile:{x:t.x,y:t.y}};else S.sel=null;
  if(S.sel){sfx('click');showPanel()}else hidePanel();
}
let confirmAt=null;
$('#cfok').onclick=()=>{const t=confirmAt;confirmAt=null;lastTap=null;if(t&&S.buildSel&&place(S.buildSel,t.x,t.y)){S.buildSel=null;S.hover=null}};
$('#cfno').onclick=()=>{confirmAt=null;lastTap=null;S.hover=null};
function updConfirm(){const el=$('#confirm');if(!confirmAt||!S.buildSel){el.hidden=true;confirmAt=S.buildSel?confirmAt:null;return}const d=DEF[S.buildSel],inf=$('#cfinfo');if(d.adj){const n=countAdj(confirmAt.x,confirmAt.y,d.adj);inf.textContent=trx(n?`+${n*(d.adjB==='g'?2:1)} Bonus (${n} ${d.adj===TREE?'Bäume':'Felsen'})`:'kein Nachbarbonus');inf.className=n?'':'no'}else inf.textContent='';
  el.hidden=false;const w=el.offsetWidth||170,h=el.offsetHeight||50,lo=R.toScreen(confirmAt.x+.5,confirmAt.y+1.05,0),hi=R.toScreen(confirmAt.x+.5,confirmAt.y+.5,2.1);
  let y=lo.y+10;if(y+h>innerHeight-140)y=hi.y-h;const cx=clamp(lo.x,w/2+8,innerWidth-w/2-8);el.style.transform=`translate(${cx-w/2}px,${clamp(y,70,innerHeight-140-h)}px)`}
function cancel(){confirmAt=null;S.buildSel=null;S.spellSel=null;S.sel=null;S.hover=null;S.heroSel=false;S.rallyFor=null;hidePanel()}
function castSpell(k){ac();const c=k==='meteor'?20:12;if(S.cd[k]>0){toast('Zauber lädt noch');sfx('err');return}if(S.res.c<c){toast(`Braucht ${c} Kristalle – baue eine Kristallmine`);sfx('err');return}
  if(!S.waveActive){toast('Zauber wirken nur während einer Welle');sfx('err');return}
  if(k==='meteor'){S.buildSel=null;S.spellSel=S.spellSel==='meteor'?null:'meteor';if(S.spellSel)toast('Tippe auf die Karte, um den Meteor zu werfen');return}
  S.res.c-=c;S.cd.frost=25*S.cdMul;S.frostFlash=1;sfx('frost');sfx('zap');
  for(const e of S.enemies){e.slow=.7;e.slowT=4;hurt(e,20*hpMul(S.wave),true)}
  R.fx('blizzard',{});
}
$('#sp-meteor').onclick=()=>castSpell('meteor');$('#sp-frost').onclick=()=>castSpell('frost');
$('#wavebtn').onclick=()=>{ac();if(!S.waveActive)startWave()};
$('#bspeed').onclick=()=>{S.speed=S.speed===1?2:S.speed===2?3:1;sfx('click')};
function setPause(on){S.paused=on;if(on)ADS.stop();else{ac();ADS.play()}sfx('click')}
$('#bpause').onclick=()=>setPause(!S.paused);
$('#resume').onclick=()=>setPause(false);
$('#bmute').onclick=()=>{muted=!muted;try{localStorage.setItem('bw_mute',muted?'1':'0')}catch(e){}};
addEventListener('keydown',ev=>{if(ev.repeat)return;const k=ev.key.toLowerCase();
  if(k>='1'&&k<='9'&&ORDER[+k-1])selectBuild(ORDER[+k-1]);else if(k==='h'&&FEAT.hero)selectHero();else if(k==='r'&&FEAT.hero)heroWhirl();else if(k==='escape')cancel();else if(k===' '){ev.preventDefault();if(!S.waveActive&&$('#start').hidden)startWave()}
  else if(k==='q')castSpell('meteor');else if(k==='e')castSpell('frost');else if(k==='p'||(k==='escape'&&S.paused))setPause(!S.paused);else if(k==='f')$('#bspeed').click();else if(k==='m')$('#bmute').click();
  else if(k==='u'&&S.sel&&S.sel.b)upgrade(S.sel.b)});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&S.running&&!S.over){S.paused=true;ADS.stop()}});
addEventListener('pagehide',()=>{if(S.running&&!S.over)S.paused=true});

function endGame(win){
  S.over=true;S.waveActive=false;S.running=false;
  if(FEAT.campaign){metaEnd(win);sfx(win?'win':'boss');return}
  try{const best=+localStorage.getItem('bw_best')||0;if(S.wave>best)localStorage.setItem('bw_best',S.wave)}catch(e){}
  setTimeout(()=>{$('#endt').textContent=win?'Sieg!':'Die Burg ist gefallen';$('#ends').innerHTML=(win?`Alle ${S.maxWave} Wellen abgewehrt. Das Reich ist sicher.`:`Du hast bis Welle ${S.wave} durchgehalten.`);
    $('#endst').innerHTML=`<div><b>${S.wave}</b>Wellen</div><div><b>${fmt(S.kills)}</b>Besiegte</div><div><b>${S.buildings.length}</b>Gebäude</div><div><b>${fmt(S.earned)}</b>Gold verdient</div>`;
    trDOM($('#end'));$('#end').hidden=false},win?600:1200);
  sfx(win?'win':'boss');
}
$('#play').onclick=()=>{ac();sfx('click');$('#start').hidden=true;S.running=true;toast(R.canPan()?R.panHint:'Baue Türme am Weg und ein Sägewerk neben dem Wald')};
$('#again').onclick=()=>{ac();if(FEAT.campaign){metaBack();return}$('#end').hidden=true;newGame();S.running=true;$('#start').hidden=true};

// ---------- Schleife ----------
let last=performance.now();
function frame(now){const dt=Math.min(.05,(now-last)/1000);last=now;TIME+=dt;
  const run=S.running&&!S.paused&&!S.over;
  if(run)for(let i=0;i<S.speed;i++){update(dt);decay(dt);R.tick(dt)}else if(!S.paused){decay(dt);R.tick(dt)}
  R.render(dt);updUI();updConfirm();requestAnimationFrame(frame)}
function boot(){
  if(LANG==='en'){for(const k in DEF){DEF[k].n=tr(DEF[k].n);DEF[k].d=tr(DEF[k].d)}for(const k in EN)EN[k].n=tr(EN[k].n);document.documentElement.lang='en';trDOM(document.body)}
  try{muted=localStorage.getItem('bw_mute')==='1';const b=+localStorage.getItem('bw_best');if(b)$('#best').textContent=trx(`Bestleistung: Welle ${b}`)}catch(e){}
  if(FEAT.campaign)metaBoot();
  if(FEAT.hero){const b=document.createElement('button');b.className='spell hero';b.id='sp-hero';b.title='Held (H), Wirbelschlag (R)';
    b.innerHTML='<svg viewBox="0 0 40 40"><path d="M20 4l12 5v9c0 8-5 14-12 18C13 32 8 26 8 18V9z" fill="#3d6ae8" stroke="#120a22" stroke-width="2.5" stroke-linejoin="round"/><path d="M20 10v20M13 17h14" stroke="#ffd23f" stroke-width="3.5" stroke-linecap="round"/></svg><span class="sc" id="hlv">1</span><span class="cd"></span>';
    b.onclick=selectHero;$('.spells').prepend(b)}
  R.init();setMap(0);genMap();newGame(0);addEventListener('resize',()=>{R.resize();makeCards();dockVar()});dockVar();setTimeout(dockVar,500);requestAnimationFrame(frame);
}
