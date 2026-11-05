const {chromium}=require(process.env.NP+'/playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1100,height:900}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/index.html');
const r=await p.evaluate(()=>{S.rooms=[];
 const A=newRoom('Wohnen',rectSegs(4.2,3.6),0,0);A.ops.push({type:'tuer',wall:1,pos:1.1,w:0.9,h:2.1});S.rooms.push(A);
 const B=newRoom('Küche',rectSegs(3.0,3.6),7,3);B.rot=37;B.ops.push({type:'tuer',wall:3,pos:1.6,w:0.9,h:2.1});S.rooms.push(B);
 const m=linkRooms(A,B,{wall:1,room:1,wall2:3,t:'12',mode:'tuer',opA:0,opB:0});
 const gA=geo(A),gB=geo(B),eA=gA.E[1],eB=gB.E[3];
 // Türmitten beider Seiten
 const cA=add(eA.p,mul(eA.d,1.1+.45)),cB=add(eB.p,mul(eB.d,1.6+.45));
 S.project.ax='7,44';S.project.ay='4,2';selRoom=0;
 return {m,rotB:B.rot,dist:((cB[0]-cA[0])*1000).toFixed(2)+'/'+((cB[1]-cA[1])*1000).toFixed(2),Bx:B.x,By:B.y};});
console.log(r);
await p.click('nav button[data-t=plan]');await p.waitForTimeout(200);await p.screenshot({path:process.env.SP+'/link.png'});
await p.click('nav button[data-t=proj]');await p.waitForTimeout(200);console.log(await p.textContent('#axMsg'));
console.log('errs',errs);await b.close();})();
