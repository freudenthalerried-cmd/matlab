// Browser-Test Schnitt: Rechteckraum + Fenster + Tür → Schnittlinie per Tippen → Schnittansicht, PDF-Seite, DXF
const {chromium}=require(process.env.NP+'/playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:430,height:900}});const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept());
await p.goto(process.env.URL);await p.evaluate(()=>{localStorage.clear();localStorage.setItem('raumplan-guide','1');});await p.reload();
await p.evaluate(()=>{const r=newRoom('Wohnen',rectSegs(4.2,3.6),0,0);r.h=2.55;r.ops=[{type:'fenster',wall:0,pos:1.5,w:1.2,h:1.4,brh:0.9},{type:'tuer',wall:2,pos:1.2,w:0.9,h:2.1,brh:0}];S.rooms=[r];save();showTab('plan');renderPlan(true);});
await p.click('#cutBtn');
const pt=async(x,y)=>{const c=await p.evaluate(([x,y])=>{const s=document.querySelector('#psvg'),q=s.createSVGPoint();q.x=x*100;q.y=-y*100;const r=q.matrixTransform(s.getScreenCTM());return [r.x,r.y];},[x,y]);await p.mouse.click(c[0],c[1]);};
// Wand 0 läuft entlang x (y=0), Wand 2 bei y=3,6: senkrechter Schnitt bei x=2,1 trifft Fenster (x 1,5–2,7) und Tür (Wand 2 rückwärts: x 4,2-1,2-0,9=2,1..3,0)
await pt(2.2,-1);await pt(2.25,4.6);
const G=await p.evaluate(()=>{const G=cutGeom();return {cut:S.cut,R:G.R.map(q=>q.k+':'+q.z0.toFixed(2)+'-'+q.z1.toFixed(2)),D:G.D.map(m=>(m.lab||'')+f2(m.L,3)),V:G.V.length};});
console.log(JSON.stringify(G));
const ok=G.R.includes('glas:0.90-2.30')&&G.R.includes('tuer:0.00-2.10')&&G.D.some(d=>d==='BRH0,900')&&G.D.some(d=>d==='2,550')&&G.D.some(d=>d==='3,600');
console.log('Schnitt korrekt:',ok,'| sichtbar:',await p.isVisible('#vcut svg'));
await p.screenshot({path:process.env.SP+'/schnitt.png',fullPage:true});
const pg=await p.evaluate(()=>{const s=pageSVG();return {schnitt:s.includes('Schnitt A–A'),fit:document.querySelector('#fitMsg').textContent};});console.log('PDF-Seite:',JSON.stringify(pg));
let dx='';await p.exposeFunction('grab',t=>dx=t);await p.evaluate(()=>{window.download=(n,d)=>grab(d);document.querySelector('#xDxf').click();});await p.waitForTimeout(200);
console.log('DXF SCHNITT_WAND:',dx.includes('SCHNITT_WAND'),'SCHNITTLINIE:',dx.includes('SCHNITTLINIE'));
await p.click('#cutFlip');console.log('Blick gedreht, Ansicht-Öffnungen:',await p.evaluate(()=>cutGeom().V.length));
console.log('errs',errs);await b.close();process.exit(ok&&pg.schnitt&&!errs.length?0:1);})();
