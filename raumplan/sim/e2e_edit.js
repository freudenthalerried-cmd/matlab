// Browser-Test Bearbeiten: im Plan Wandmaß / Fenster / Raumhöhe antippen → Wert ändern; Ergebnis-Bildschirm: Wandlänge antippen → Plan aktualisiert
const {chromium}=require(process.env.NP+'/playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:430,height:900}});const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept());
await p.goto(process.env.URL);await p.evaluate(()=>{localStorage.clear();localStorage.setItem('raumplan-guide','1');});await p.reload();
await p.evaluate(()=>{const r=newRoom('Bad',rectSegs(5,4),0,0);r.ops=[{type:'fenster',wall:0,pos:1,w:1,h:1.2,brh:1}];S.rooms=[r];save();showTab('plan');renderPlan(true);});
const tap=async sel=>{for(const el of await p.locator(sel).all()){await el.scrollIntoViewIfNeeded();const bx=await el.boundingBox(),x=bx.x+bx.width/2,y=bx.y+bx.height/2;if(await p.evaluate(([x,y,sel])=>!!document.elementFromPoint(x,y).closest(sel),[x,y,sel])){await p.mouse.click(x,y);return;}}const el=p.locator(sel).first(),bx=await el.boundingBox();throw new Error("nicht antippbar: "+sel+JSON.stringify(bx)+await p.evaluate(([x,y])=>{const e=document.elementFromPoint(x,y);return e?e.outerHTML.slice(0,120):"null"},[bx.x+bx.width/2,bx.y+bx.height/2]));};
const set=async(vals)=>{await p.waitForSelector('#edUI:not([hidden]) input');const I=p.locator('#edUI input');for(let i=0;i<vals.length;i++)if(vals[i]!=null)await I.nth(i).fill(vals[i]);await p.click('#edOk');};
await tap('#psvg [data-ed="seg,0,1"]');await set(['215 cm']);
await tap('#psvg [data-ed="op,0,0"]');await set(['1,10','1,30','0,95']);
await tap('#psvg [data-ed="rh,0"]');await set(['2,48']);
const r=await p.evaluate(()=>{const r=S.rooms[0];return {seg1:r.segs[1].len,op:r.ops[0],h:r.h,x:r.x};});console.log('Plan:',JSON.stringify(r));
let ok=r.seg1===2.15&&r.op.w===1.1&&r.op.h===1.3&&r.op.brh===0.95&&r.h===2.48&&r.x===0;
// Ergebnis-Bildschirm
await p.evaluate(()=>{const d={name:'Bad',w:{ok:true,lengths:[5,2.15,5,2.15],sigma:[.001,.001,.001,.001],poly:[[0,0],[5,0],[5,2.15],[0,2.15]],warn:[],groups:[[4],[5],[6],[7]]},ops:S.rooms[0].ops,planRoom:S.rooms[0]};window._res=[d];showResult(_res,{suspect:null},true);});
await tap('#resUI [data-ed="len,0,2"]');await set(['5,012']);
const r2=await p.evaluate(()=>({res:_res[0].w.lengths,plan:S.rooms[0].segs.map(s=>s.len),txt:document.querySelector('#resUI').textContent.includes('von Hand')}));console.log('Ergebnis:',JSON.stringify(r2));
ok=ok&&r2.res[2]===5.012&&r2.plan.includes(5.012)&&r2.txt;
await p.screenshot({path:process.env.SP+'/edit.png'});
console.log('Bearbeiten korrekt:',ok,'errs',errs);await b.close();process.exit(ok&&!errs.length?0:1);})();
