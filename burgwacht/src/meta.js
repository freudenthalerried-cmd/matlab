// Meta-Fortschritt: Speicherstand, Edelsteine, Kampagne, Upgrades, Boosts, Tagesbonus, Erfolge, Shop, Werbung.
const CONFIG=Object.assign({ads:'demo',premiumUrl:'',premiumCode:'',premiumPrice:'2,99 €',legal:false},window.BW_CONFIG||{});

// ---------- Speicher ----------
const SAVE_KEY='bw_save1';
const ST={get(k){try{if(ADS.sdk&&ADS.sdk.data)return ADS.sdk.data.getItem(k);return localStorage.getItem(k)}catch(e){return null}},
  set(k,v){try{if(ADS.sdk&&ADS.sdk.data)ADS.sdk.data.setItem(k,v);else localStorage.setItem(k,v)}catch(e){}}};
function freshSave(){return{gems:0,stars:[0,0,0,0,0],up:{dmg:0,gold:0,wall:0,spell:0,hero:0,barr:0},daily:{last:'',streak:0},ach:{},stats:{kills:0,wins:0},endless:0,premium:false,boost:{},adGems:{day:'',n:0},seenDaily:''}}
function loadSave(){let o=null;try{o=JSON.parse(ST.get(SAVE_KEY)||'null')}catch(e){}const d=freshSave();if(!o)o={};
  const s=Object.assign(d,o);s.up=Object.assign(freshSave().up,o.up||{});s.stats=Object.assign(freshSave().stats,o.stats||{});s.daily=Object.assign(freshSave().daily,o.daily||{});
  while(s.stars.length<5)s.stars.push(0);return s}
let SV=loadSave();
function persist(){ST.set(SAVE_KEY,JSON.stringify(SV))}
const dayKey=(d=new Date())=>`${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;

// ---------- Werbung ----------
let ADMUTE=false;
const ADS={mode:'none',sdk:null,busy:false,lastMid:Date.now(),
  async init(){const m=CONFIG.ads;
    if(m==='crazygames'&&window.CrazyGames&&window.CrazyGames.SDK){try{await window.CrazyGames.SDK.init();this.sdk=window.CrazyGames.SDK;this.mode=this.sdk.environment==='disabled'?'none':'cg';SV=loadSave()}catch(e){this.mode='none'}}
    else if(m==='demo')this.mode='demo'},
  can(){return this.mode!=='none'&&!this.busy},
  _run(type){if(!this.can())return Promise.resolve(false);this.busy=true;const wasP=S.paused;S.paused=true;ADMUTE=true;try{AC&&AC.suspend()}catch(e){}
    return new Promise(res=>{const done=ok=>{this.busy=false;S.paused=wasP;ADMUTE=false;try{AC&&AC.resume()}catch(e){}res(ok)};
      if(this.mode==='demo')return demoAd(type,()=>done(true));
      try{this.sdk.ad.requestAd(type,{adStarted(){},adFinished(){done(true)},adError(){done(false)}})}catch(e){done(false)}})},
  rewarded(){return this._run('rewarded')},
  midgame(){if(this.mode==='none'||SV.premium||Date.now()-this.lastMid<180000)return Promise.resolve(false);this.lastMid=Date.now();return this._run('midgame')},
  play(){try{this.sdk&&this.sdk.game.gameplayStart()}catch(e){}},
  stop(){try{this.sdk&&this.sdk.game.gameplayStop()}catch(e){}},
  happy(){try{this.sdk&&this.sdk.game.happytime()}catch(e){}},
};
function demoAd(type,cb){const o=$('#adov');let n=type==='rewarded'?3:2;o.hidden=false;
  const tick=()=>{o.innerHTML=`<div><b>${tr('Werbung')}</b><small>${tr('Demo: Auf CrazyGames läuft hier ein echter Werbespot.')}</small><span>${n}</span></div>`;if(n--<=0){o.hidden=true;cb();return}setTimeout(tick,1000)};tick()}
const adBtn=(txt,act,cls='')=>ADS.mode!=='none'?`<button class="adb ${cls}" data-ad="${act}"><i class="play"></i>${txt}</button>`:'';

// ---------- Edelsteine ----------
function addGems(n,why){if(n<=0)return;SV.gems+=n;persist();updGems();if(why)toast(`+${n} ${tr('Edelsteine')}: ${why}`)}
function spendGems(n){if(SV.gems<n){toast(tr('Nicht genug Edelsteine'));sfx('err');return false}SV.gems-=n;persist();updGems();return true}
function updGems(){document.querySelectorAll('.gemn').forEach(e=>e.textContent=fmt(SV.gems))}
const gemIc='<i class="ic gem"></i>';

// ---------- Upgrades, Boosts ----------
const PERKS=[['dmg','Scharfe Spitzen','+8 % Schaden aller Türme und Kämpfer'],['gold','Schatzkammer','+40 Startgold'],['wall','Dicke Mauern','+4 Burgleben'],
  ['spell','Kristallkunde','−12 % Abklingzeit für Zauber'],['hero','Heldenmut','+15 % Leben und Schaden für den Helden'],['barr','Drill','+20 % Leben für Soldaten']];
const PERK_COST=[30,70,130];
function perks(){return FEAT.campaign?SV.up:{dmg:0,gold:0,wall:0,spell:0,hero:0,barr:0}}
const BOOSTS=[['gold','+150 Startgold',25],['crys','+25 Kristalle',30],['lives','+10 Burgleben',35],['hero3','Held startet auf Stufe 3',40]];
let chosenBoosts={};
function applyBoosts(){const b=chosenBoosts;chosenBoosts={};
  if(b.gold)S.res.g+=150;if(b.crys)S.res.c+=25;if(b.lives){S.lives+=10;S.maxLives+=10}
  if(b.hero3){const h=heroU();if(h){h.lvl=3;h.xp=HERO_XP[2];heroStats(h);h.hp=h.max}}}

// ---------- Erfolge ----------
const ACH=[['win1','Erster Sieg','Gewinne eine Karte',10],['stars3','Makellos','Hol 3 Sterne auf einer Karte',15],['kill500','Schlächter','Besiege insgesamt 500 Gegner',20],
  ['dragon','Drachentöter','Besiege einen Drachen',20],['castle3','Festung','Baue die Burg auf Stufe 3',15],['hero5','Legende','Bringe den Helden auf Stufe 5',20],
  ['build12','Baumeister','Habe 12 Gebäude gleichzeitig',10],['nolife','Unberührt','Gewinne ohne ein Leben zu verlieren',25],['endless15','Unaufhaltsam','Erreiche Welle 15 im Endlos-Modus',30],
  ['streak7','Treue','Hol 7 Tage in Folge den Tagesbonus',30],['allmaps','Eroberer','Gewinne alle fünf Karten',50]];
function ach(id){if(!FEAT.campaign||SV.ach[id])return;const a=ACH.find(a=>a[0]===id);if(!a)return;SV.ach[id]=1;persist();addGems(a[3]);banner(tr('Erfolg!'),`${tr(a[1])} · +${a[3]} ${tr('Edelsteine')}`);sfx('win')}
function metaEv(ev,d){if(!FEAT.campaign)return;
  if(ev==='kill'){SV.stats.kills++;if(SV.stats.kills>=500)ach('kill500');if(d.type==='dragon')ach('dragon');if(SV.stats.kills%25===0)persist()}
  else if(ev==='castle'&&d===3)ach('castle3');
  else if(ev==='hero'&&d>=5)ach('hero5');
  else if(ev==='build'&&S.buildings.length>=12)ach('build12');
  else if(ev==='wave'&&S.endless&&d>=15)ach('endless15');
}

// ---------- Kampagne ----------
const starStr=n=>[1,2,3].map(i=>`<i class="st${i<=n?' on':''}"></i>`).join('');
const unlocked=i=>SV.premium||i===0||SV.stars[i-1]>0;
const endlessOpen=()=>SV.premium||SV.stars[2]>0;
function renderCamp(){
  const el=$('#camp');if(!el)return;const dailyOn=SV.daily.last!==dayKey();
  el.innerHTML=`<div class="mtop"><span class="gems">${gemIc}<b class="gemn">${fmt(SV.gems)}</b></span>
      <button class="mb${dailyOn?' hot':''}" data-m="daily">${tr('Tagesbonus')}</button><button class="mb" data-m="perks">${tr('Upgrades')}</button><button class="mb" data-m="ach">${tr('Erfolge')}</button><button class="mb" data-m="shop">${tr('Shop')}</button>${CONFIG.legal?`<button class="mb" data-m="info">${tr('Info')}</button>`:''}</div>
    <div class="maps">${MAPS.map((m,i)=>{const lock=!unlocked(i);return`<button class="map ${m.theme}${lock?' locked':''}" data-map="${i}" ${lock?'disabled':''}><b>${tr(m.n)}</b><span class="stars">${starStr(SV.stars[i])}</span><small>${lock?tr('Erst Karte {n} gewinnen',{n:i}):tr('{n} Wellen',{n:m.waves})}</small></button>`}).join('')}
      <button class="map endless${endlessOpen()?'':' locked'}" data-map="endless" ${endlessOpen()?'':'disabled'}><b>${tr('Endlos')}</b><span class="rec">${tr('Rekord')}: ${SV.endless}</span><small>${endlessOpen()?tr('So lange du kannst'):tr('Erst Karte {n} gewinnen',{n:3})}</small></button></div>`;
}
function modal(html,cls=''){const m=$('#modal');m.className='screen '+cls;m.innerHTML=`<div class="box mbox"><button class="x mx" aria-label="${tr('Schließen')}">×</button>${html}</div>`;m.hidden=false}
function closeModal(){$('#modal').hidden=true}
function openPerks(){modal(`<h2>${tr('Upgrades')}</h2><p class="sub">${tr('Dauerhaft für alle Karten.')} ${gemIc}<b class="gemn">${fmt(SV.gems)}</b></p>
  <div class="perks">${PERKS.filter(p=>(p[0]!=='hero'||FEAT.hero)&&(p[0]!=='barr'||FEAT.barracks)).map(([k,n,d])=>{const l=SV.up[k],c=PERK_COST[l];return`<div class="perk"><span><b>${tr(n)}</b><small>${tr(d)}</small></span><span class="dots">${[1,2,3].map(i=>`<i class="${i<=l?'on':''}"></i>`).join('')}</span>
    <button data-perk="${k}" ${l>=3?'disabled':''}>${l>=3?tr('Max.'):gemIc+c}</button></div>`}).join('')}</div>`)}
function openAch(){modal(`<h2>${tr('Erfolge')}</h2><div class="achs">${ACH.map(([id,n,d,g])=>`<div class="ach${SV.ach[id]?' done':''}"><span><b>${tr(n)}</b><small>${tr(d)}</small></span><span class="rw">${SV.ach[id]?'✓':gemIc+g}</span></div>`).join('')}</div>
  <p class="sub">${tr('Besiegte Gegner insgesamt')}: ${fmt(SV.stats.kills)}</p>`)}
const DAILY=[10,15,20,25,30,40,60];
function openDaily(auto){
  const today=dayKey(),y=new Date();y.setDate(y.getDate()-1);
  if(SV.daily.last===today){if(!auto)modal(`<h2>${tr('Tagesbonus')}</h2><p class="sub">${tr('Heute schon abgeholt. Komm morgen wieder!')}</p>${dailyRow(SV.daily.streak)}`);return}
  const streak=SV.daily.last===dayKey(y)?SV.daily.streak+1:1,g=DAILY[Math.min(streak,7)-1];
  modal(`<h2>${tr('Tagesbonus')}</h2><p class="sub">${tr('Tag {n} in Folge',{n:streak})}</p>${dailyRow(streak,true)}<div class="big-g">${gemIc}+${g}</div>
    <div class="mrow"><button class="okb" data-daily="1">${tr('Abholen')}</button>${adBtn(tr('Verdoppeln'),'daily2')}</div>`);
  $('#modal').dataset.streak=streak;$('#modal').dataset.g=g;
}
function dailyRow(s,cur){return`<div class="drow">${DAILY.map((g,i)=>`<span class="${i<Math.min(s,7)-(cur?1:0)?'got':''}${cur&&i===Math.min(s,7)-1?' now':''}"><small>${tr('Tag')} ${i+1}</small>${g}</span>`).join('')}</div>`}
function claimDaily(mult){const m=$('#modal'),s=+m.dataset.streak,g=+m.dataset.g*mult;SV.daily={last:dayKey(),streak:s};persist();closeModal();addGems(g,tr('Tagesbonus'));sfx('coin');if(s>=7)ach('streak7');renderCamp()}
function openShop(){
  const ad=SV.adGems.day===dayKey()?SV.adGems.n:0;
  modal(`<h2>${tr('Shop')}</h2><p class="sub">${gemIc}<b class="gemn">${fmt(SV.gems)}</b></p>
    ${ADS.mode!=='none'?`<div class="shopi"><span><b>${tr('Gratis-Edelsteine')}</b><small>${tr('Kurzes Video ansehen')} (${ad}/5 ${tr('heute')})</small></span>${ad<5?adBtn('+15','gems'):`<span class="rw">${tr('Morgen wieder')}</span>`}</div>`:''}
    ${SV.premium?`<div class="shopi prem"><span><b>${tr('Königspaket aktiv')}</b><small>${tr('Keine Werbepausen, alle Karten frei, doppelte Edelsteine.')}</small></span><span class="rw">✓</span></div>`:
      (CONFIG.premiumUrl?`<div class="shopi prem"><span><b>${tr('Königspaket')}</b><small>${tr(ADS.mode==='none'?'Alle Karten frei, doppelte Edelsteine, +300 Edelsteine.':'Keine Werbepausen, alle Karten frei, doppelte Edelsteine, +300 Edelsteine.')}</small></span><a class="okb" href="${CONFIG.premiumUrl}" target="_blank" rel="noopener">${CONFIG.premiumPrice}</a></div>`:'')
      +(CONFIG.premiumCode?`<div class="shopi"><span><b>${tr('Code eingeben')}</b><small>${tr('Den Code bekommst du nach dem Kauf.')}</small></span><span class="code"><input id="pcode" maxlength="24" autocomplete="off" aria-label="Code"><button class="okb" data-m="code">OK</button></span></div>`:'')
      +(CONFIG.legal&&CONFIG.premiumUrl?`<p class="sub"><a href="kaufbedingungen.html" target="_blank" rel="noopener">${tr('Kaufbedingungen')}</a></p>`:'')}`)}
function openInfo(){modal(`<h2>${tr('Info')}</h2><div class="achs">
  <a class="shopi" href="impressum.html" target="_blank" rel="noopener"><span><b>${tr('Impressum')}</b></span></a>
  <a class="shopi" href="datenschutz.html" target="_blank" rel="noopener"><span><b>${tr('Datenschutz')}</b></span></a>
  ${CONFIG.premiumUrl?`<a class="shopi" href="kaufbedingungen.html" target="_blank" rel="noopener"><span><b>${tr('Kaufbedingungen')}</b></span></a>`:''}</div>
  <p class="sub">${tr('Dein Fortschritt wird nur in diesem Browser gespeichert.')}</p><p class="sub">Three.js (MIT) · Lilita One, Nunito (SIL OFL)</p>`)}
async function hashStr(s){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s.trim().toUpperCase()));return[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')}
async function tryCode(c){if(!CONFIG.premiumCode||!c)return false;if(await hashStr(c)===CONFIG.premiumCode){SV.premium=true;SV.gems+=300;persist();updGems();banner(tr('Königspaket'),tr('Danke für deine Unterstützung!'));renderCamp();return true}return false}
function openPrep(i){
  const m=i==='endless'?null:MAPS[i];const boosts=BOOSTS.filter(b=>b[0]!=='hero3'||FEAT.hero);chosenBoosts={};
  modal(`<h2>${m?tr(m.n):tr('Endlos-Modus')}</h2><p class="sub">${m?`${starStr(SV.stars[i])} · ${tr('{n} Wellen',{n:m.waves})}`:tr('Rekord')+': '+SV.endless}</p>
    <div class="boosts"><div class="bh">${tr('Boosts für diese Runde')} · ${gemIc}<b class="gemn">${fmt(SV.gems)}</b></div>${boosts.map(([k,n,c])=>`<label class="boost"><input type="checkbox" data-boost="${k}" data-c="${c}"><span>${tr(n)}</span><b>${gemIc}${c}</b></label>`).join('')}</div>
    <div class="mrow"><button class="okb big2" data-go="${i}">${tr('Los!')}</button></div>`);
}
async function goMap(i){
  const sel=[...document.querySelectorAll('#modal [data-boost]:checked')];const cost=sel.reduce((a,e)=>a+ +e.dataset.c,0);
  if(cost>SV.gems){toast(tr('Nicht genug Edelsteine'));sfx('err');return}
  if(cost){SV.gems-=cost;persist();updGems()}chosenBoosts={};for(const e of sel)chosenBoosts[e.dataset.boost]=1;
  closeModal();ac();sfx('click');
  if(i==='endless')newGame(Math.floor(Math.random()*MAPS.length),{endless:true});else newGame(+i);
  applyBoosts();$('#start').hidden=true;S.running=true;ADS.play();toast(S.endless?tr('Endlos-Modus: Wie weit kommst du?'):`${tr(MAP.n)}: ${tr('{n} Wellen',{n:S.maxWave})}`);
}

// ---------- Rundenende ----------
let endReward=0,revived=false;
function metaEnd(win){
  ADS.stop();let st=0,g=0,newSt=0;
  if(S.endless){g=Math.max(1,Math.floor(S.wave/2));if(S.wave>SV.endless)SV.endless=S.wave}
  else if(win){st=S.lives>=S.maxLives*.9?3:S.lives>=S.maxLives*.5?2:1;newSt=Math.max(0,st-SV.stars[MAPI]);SV.stars[MAPI]=Math.max(SV.stars[MAPI],st);SV.stats.wins++;
    g=5+newSt*10;ach('win1');if(st===3)ach('stars3');if(S.lives>=S.maxLives)ach('nolife');if(SV.stars.every(s=>s>0))ach('allmaps');ADS.happy()}
  else g=Math.max(1,Math.floor(S.wave/3));
  if(SV.premium)g*=2;endReward=g;SV.gems+=g;persist();
  setTimeout(()=>{
    $('#endt').textContent=S.endless?tr('Endlos-Modus vorbei'):win?tr('Sieg!'):tr('Die Burg ist gefallen');
    $('#ends').innerHTML=(S.endless?tr('Du hast Welle {n} erreicht.',{n:S.wave})+(S.wave>=SV.endless?' '+tr('Neuer Rekord!'):''):win?tr('Alle {n} Wellen abgewehrt. Das Reich ist sicher.',{n:S.maxWave}):tr('Du hast bis Welle {n} durchgehalten.',{n:S.wave}))
      +(win&&!S.endless?`<div class="endstars">${starStr(st)}</div>`:'')+`<div class="endg">${gemIc}+<b id="endg">${g}</b></div>`;
    $('#endst').innerHTML=`<div><b>${S.wave}</b>${tr('Wellen')}</div><div><b>${fmt(S.kills)}</b>${tr('Besiegte')}</div><div><b>${fmt(S.earned)}</b>${tr('Gold verdient')}</div>`;
    $('#endads').innerHTML=(!win&&!revived&&!S.endless?adBtn(tr('Weiterkämpfen: +10 Leben'),'revive','wide'):'')+(g>0&&!SV.premium?adBtn(tr('Edelsteine verdoppeln'),'double','wide'):'');
    trDOM($('#end'));$('#retry').hidden=false;$('#end').hidden=false;updGems()},win?700:1200);
}
function metaBack(){ADS.midgame().then(()=>{$('#end').hidden=true;newGame(MAPI);renderCamp();$('#start').hidden=false})}

// ---------- Ereignisse ----------
document.addEventListener('click',async ev=>{
  const t=ev.target;
  if(t.closest('.mx')){closeModal();return}
  const mp=t.closest('#camp [data-map]');if(mp&&!mp.disabled){ac();sfx('click');openPrep(mp.dataset.map==='endless'?'endless':+mp.dataset.map);return}
  const mb=t.closest('[data-m]');if(mb){ac();sfx('click');const k=mb.dataset.m;
    if(k==='daily')openDaily();else if(k==='info')openInfo();else if(k==='perks')openPerks();else if(k==='ach')openAch();else if(k==='shop')openShop();
    else if(k==='code'){const ok=await tryCode($('#pcode').value);if(ok)closeModal();else{toast(tr('Code ungültig'));sfx('err')}}return}
  const pk=t.closest('[data-perk]');if(pk&&!pk.disabled){const k=pk.dataset.perk,c=PERK_COST[SV.up[k]];if(spendGems(c)){SV.up[k]++;persist();sfx('coin');openPerks()}return}
  const go=t.closest('[data-go]');if(go){goMap(go.dataset.go==='endless'?'endless':+go.dataset.go);return}
  const dl=t.closest('[data-daily]');if(dl){claimDaily(1);return}
  const ad=t.closest('[data-ad]');if(ad&&!ad.disabled){ac();const k=ad.dataset.ad;ad.disabled=true;const ok=await ADS.rewarded();if(!ok){toast(tr('Werbung gerade nicht verfügbar'));ad.disabled=false;return}
    if(k==='daily2')claimDaily(2);
    else if(k==='gems'){if(SV.adGems.day!==dayKey())SV.adGems={day:dayKey(),n:0};SV.adGems.n++;addGems(15,tr('Video'));openShop()}
    else if(k==='double'){SV.gems+=endReward;persist();updGems();$('#endg').textContent=endReward*2;ad.remove();sfx('coin')}
    else if(k==='revive'){revived=true;$('#end').hidden=true;S.over=false;S.lives=10;S.running=true;S.paused=false;S.enemies.forEach(e=>{if(e.d>e.P.len-3)e.d=Math.max(0,e.d-6)});banner(tr('Zweite Chance'),tr('+10 Leben'));ADS.play()}
    else if(k==='gold'){S.adGold++;give({g:80},CASTLE_C[0],CASTLE_C[1]+1.5,1);sfx('coin')}
    return}
});

function metaBoot(){
  const tag=$('.tag');tag.textContent=tr('Erobere fünf Karten. Sammle Sterne und Edelsteine für dauerhafte Upgrades.');
  const c=document.createElement('div');c.id='camp';$('.how').replaceWith(c);$('#play').hidden=true;$('#again').textContent=tr('Zur Kartenwahl');
  const r=document.createElement('button');r.className='big alt';r.id='retry';r.textContent=tr('Nochmal');r.onclick=()=>{ac();ADS.midgame().then(()=>{$('#end').hidden=true;revived=false;
    if(S.endless)goMap('endless');else{newGame(MAPI);applyBoosts();S.running=true;ADS.play()}})};$('#again').after(r);
  const ea=document.createElement('div');ea.id='endads';$('#endst').after(ea);
  for(const[id,cls]of[['modal','screen'],['adov','adov']]){const d=document.createElement('div');d.id=id;d.className=cls;d.hidden=true;document.body.appendChild(d)}
  const ag=document.createElement('button');ag.id='adgold';ag.dataset.ad='gold';ag.hidden=true;ag.innerHTML=`<i class="play"></i>+80 <i class="ic g"></i>`;$('#wavebtn').before(ag);
  try{const q=new URLSearchParams(location.search).get('k');if(q)tryCode(q)}catch(e){}
  renderCamp();ADS.init().then(()=>{renderCamp();if(SV.daily.last!==dayKey()&&SV.seenDaily!==dayKey()){SV.seenDaily=dayKey();persist();setTimeout(()=>{if(!$('#start').hidden)openDaily(true)},700)}});
}
function metaUI(){const ag=$('#adgold');if(ag)ag.hidden=!(S.countdown>0&&ADS.can()&&(S.adGold||0)<3&&!S.over)}
