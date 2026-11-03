// Synthetisches Handyvideo als y4m (Fake-Kamera für Browser-Tests der Live-Aufnahme); Standbilder nur einmal gerendert
process.env.NF='0';const fs=require('fs'),cp=require('child_process');
const src=fs.readFileSync(__dirname+'/test_pg.js','utf8').replace(/const frames=\[\];[\s\S]*$/,'module.exports={render,look,it,W,H};').replace(/require\('\.\.\//g,"require('"+__dirname+"/../");
fs.writeFileSync(__dirname+'/_lib.js',src);const {render,look,W,H}=require('./_lib.js');fs.unlinkSync(__dirname+'/_lib.js');
const L=4.2,B=3.6,poses=[];
[[.5,.5],[L-.5,.5],[L-.5,B-.5],[.5,B-.5]].forEach(cor=>{const base=Math.atan2(B/2-cor[1],L/2-cor[0]);[-.8,-.27,.27,.8].forEach((d,k)=>poses.push({C:[cor[0],cor[1],1.5],a:base+d,z:[.4,1.4,.8,1.7][k]}));});
const FPS=5,STILL=6,MOVE=3,ff=cp.spawn(process.env.FF,['-hide_banner','-loglevel','error','-f','rawvideo','-pix_fmt','gray','-s',`${W}x${H}`,'-r',String(FPS),'-i','pipe:0','-f','yuv4mpegpipe','-pix_fmt','yuv420p','-y',process.env.OUT]);
let lastP=null,lastB=null;const put=(p)=>{if(p!==lastP){const C=p.C,T=[C[0]+3*Math.cos(p.a),C[1]+3*Math.sin(p.a),p.z],img=render(look(C,T));lastB=Buffer.alloc(W*H);for(let i=0;i<W*H;i++)lastB[i]=Math.max(0,Math.min(255,img[i]));lastP=p;}return new Promise(r=>ff.stdin.write(lastB,r));};
(async()=>{let n=0;const t0=Date.now();for(let i=0;i<poses.length;i++){for(let k=0;k<STILL;k++){await put(poses[i]);n++;}
 const q=poses[i+1];if(q)for(let k=1;k<=MOVE;k++){const f=k/(MOVE+1);await put({C:poses[i].C.map((v,j)=>v+(q.C[j]-v)*f),a:poses[i].a+(q.a-poses[i].a)*f,z:poses[i].z+(q.z-poses[i].z)*f});n++;}}
 ff.stdin.end();ff.on('close',()=>console.log(`${n} Bilder, ${(n/FPS).toFixed(1)} s Video, ${((Date.now()-t0)/1000).toFixed(0)} s Rechenzeit`));})();
