(()=>{
const W=720,H=1280,Q=s=>document.querySelector(s);
const st=document.createElement('style');
st.textContent=`.ov2{position:fixed;inset:0;background:#000;z-index:12;display:flex;align-items:center;justify-content:center;padding:env(safe-area-inset-top) 0 env(safe-area-inset-bottom)}
#cmv{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.stg{position:relative;height:100%;aspect-ratio:9/16;max-width:100vw;background:#111}
#edc{position:absolute;inset:0;width:100%;height:100%;touch-action:none}
.cb{position:absolute;left:0;right:0;display:flex;gap:8px;padding:12px;align-items:center;justify-content:space-between;z-index:2}
.cb.t{top:0}.cb.b{bottom:0}
#cmsh{width:84px;height:84px;border-radius:50%;border:6px solid var(--sun);display:grid;place-items:center}
#cmsh i{width:58px;height:58px;border-radius:50%;background:var(--coral);display:block}
#edf{position:absolute;left:0;right:0;bottom:72px;display:flex;gap:6px;overflow-x:auto;padding:0 12px;z-index:2}
.pl{background:rgba(27,16,51,.78);border-radius:999px;padding:8px 14px;font-weight:700;white-space:nowrap;flex:none}.pl.on{background:var(--sun);color:#1B1033}
.sw2{width:26px;height:26px;border-radius:50%;border:3px solid transparent;flex:none}.sw2.on{border-color:#fff}
#edcap{flex:1;min-width:0;background:rgba(27,16,51,.78);border:0;border-radius:999px;padding:12px 16px}
#edsh{position:absolute;left:0;right:0;bottom:0;background:var(--ink);border-radius:20px 20px 0 0;padding:14px 0;z-index:5;max-height:70%;overflow:auto}
#edsh b{display:block;padding:0 18px 6px}
#cmnc{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;text-align:center;padding:40px;background:var(--ink);color:var(--mut)}
#toast{z-index:30!important}`;
document.head.appendChild(st);
const box=document.createElement('div');
box.innerHTML=`<div id='cam' class='ov2' hidden><video id='cmv' autoplay playsinline muted></video>
<div id='cmnc' hidden><p id='cmsg'></p><button class='btn' id='cmtake'>Open phone camera</button></div>
<div class='cb t'><button class='btn alt sm' id='cmx'>Close</button><button class='btn alt sm' id='cmflip'>Flip</button></div>
<div class='cb b'><button class='btn alt' id='cmup'>Library</button><button id='cmsh' aria-label='Take photo'><i></i></button><span style='width:88px'></span></div></div>
<div id='ed' class='ov2' hidden><div class='stg'><canvas id='edc' width='720' height='1280'></canvas>
<div class='cb t'><button class='btn alt sm' id='edx'>Back</button><button class='btn alt sm' id='edr'>Draw</button><span id='edsw' style='display:flex;gap:8px' hidden></span><button class='btn alt sm' id='edclr' hidden>Clear</button></div>
<div id='edf'></div>
<div class='cb b'><input id='edcap' placeholder='Add a caption (drag to move)' maxlength='60' aria-label='Caption'><button class='btn' id='edsend'>Send</button></div>
<div id='edsh' hidden></div></div></div>
<input type='file' id='cf1' accept='image/*' hidden><input type='file' id='cf2' accept='image/*' capture='environment' hidden>`;
while(box.firstChild)document.body.appendChild(box.firstChild);
const mk=()=>{const c=document.createElement('canvas');c.width=W;c.height=H;return c};
const raw=mk(),base=mk(),ink=mk(),ec=Q('#edc'),cx=ec.getContext('2d'),ix=ink.getContext('2d'),vid=Q('#cmv');
let stream=null,facing='user',filt=0,drawing=false,down=false,color='#FF4F81',capY=.78,busy=false;
const FL=['Original','Warm','Cool','Mono','Pop','Fade'];
function stopCam(){if(stream){stream.getTracks().forEach(t=>t.stop());stream=null}}
async function startCam(){stopCam();Q('#cmnc').hidden=true;vid.hidden=false;
 try{if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia)throw{name:'Unsupported'};
  try{stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:facing}},audio:false})}catch(e){if(e&&e.name==='NotAllowedError')throw e;stream=await navigator.mediaDevices.getUserMedia({video:true,audio:false})}
  vid.muted=true;vid.srcObject=stream;await vid.play();vid.style.transform=facing==='user'?'scaleX(-1)':'none'}
 catch(e){stopCam();vid.hidden=true;Q('#cmnc').hidden=false;Q('#cmsg').textContent=(e&&e.name==='NotAllowedError')?'Camera access was blocked. Allow it in your browser settings, or use your phone camera below.':'Live camera is not available here. Use your phone camera below.'}}
function openCam(){Q('#cam').hidden=false;startCam()}
function closeCam(){stopCam();Q('#cam').hidden=true}
const nav=Q('nav'),nb=document.createElement('button');nb.textContent='Camera';nav.insertBefore(nb,nav.children[2]);nb.onclick=openCam;
Q('#cmx').onclick=closeCam;
Q('#cmflip').onclick=()=>{facing=facing==='user'?'environment':'user';startCam()};
Q('#cmup').onclick=()=>Q('#cf1').click();
Q('#cmtake').onclick=()=>Q('#cf2').click();
function cover(src,sw,sh,mirror){const x=raw.getContext('2d'),k=Math.max(W/sw,H/sh),dw=sw*k,dh=sh*k;x.save();x.clearRect(0,0,W,H);if(mirror){x.translate(W,0);x.scale(-1,1)}x.drawImage(src,(W-dw)/2,(H-dh)/2,dw,dh);x.restore()}
Q('#cmsh').onclick=()=>{if(stream&&vid.videoWidth){cover(vid,vid.videoWidth,vid.videoHeight,facing==='user');openEd()}else Q('#cf2').click()};
const fromFile=e=>{const f=e.target.files[0];e.target.value='';if(!f)return;const im=new Image();im.onload=()=>{cover(im,im.width,im.height,false);URL.revokeObjectURL(im.src);Q('#cam').hidden=false;openEd()};im.src=URL.createObjectURL(f)};
Q('#cf1').onchange=fromFile;Q('#cf2').onchange=fromFile;
function applyFilter(){const b=base.getContext('2d');b.drawImage(raw,0,0);
 if(filt){const d=b.getImageData(0,0,W,H),p=d.data;
  for(let i=0;i<p.length;i+=4){let r=p[i],g=p[i+1],l=p[i+2];
   if(filt===1){r=r*1.12+10;l*=.88}
   else if(filt===2){r*=.9;l=l*1.12+8}
   else if(filt===3){r=g=l=.3*r+.59*g+.11*l}
   else if(filt===4){const a=(r+g+l)/3;r=(a+(r-a)*1.5-128)*1.25+128;g=(a+(g-a)*1.5-128)*1.25+128;l=(a+(l-a)*1.5-128)*1.25+128}
   else{r=r*.8+45;g=g*.8+45;l=l*.8+45}
   p[i]=r;p[i+1]=g;p[i+2]=l}
  b.putImageData(d,0,0)}
 render()}
function render(){cx.drawImage(base,0,0);cx.drawImage(ink,0,0);const t=Q('#edcap').value.trim();
 if(t){const y=H*capY;cx.fillStyle='rgba(0,0,0,.55)';cx.fillRect(0,y-52,W,104);cx.fillStyle='#fff';cx.font='700 46px sans-serif';cx.textAlign='center';cx.textBaseline='middle';cx.fillText(t,W/2,y,W-60)}}
function chips(){Q('#edf').innerHTML=FL.map((n,i)=>`<button class='pl ${i===filt?'on':''}' data-i='${i}'>${n}</button>`).join('')}
Q('#edf').onclick=e=>{const b=e.target.closest('button');if(!b)return;filt=+b.dataset.i;chips();applyFilter()};
Q('#edsw').innerHTML=['#FF4F81','#FFD23F','#5EEAD4','#ffffff'].map((c,i)=>`<button class='sw2 ${i?'':'on'}' data-c='${c}' style='background:${c}' aria-label='Pen color ${i+1}'></button>`).join('');
Q('#edsw').onclick=e=>{const b=e.target.closest('button');if(!b)return;color=b.dataset.c;document.querySelectorAll('.sw2').forEach(s=>s.classList.toggle('on',s===b))};
function setDraw(on){drawing=on;Q('#edr').style.background=on?'#FFD23F':'';Q('#edr').style.color=on?'#1B1033':'';Q('#edsw').hidden=!on;Q('#edclr').hidden=!on}
Q('#edr').onclick=()=>setDraw(!drawing);
Q('#edclr').onclick=()=>{ix.clearRect(0,0,W,H);render()};
Q('#edcap').oninput=render;
function openEd(){stopCam();filt=0;capY=.78;ix.clearRect(0,0,W,H);Q('#edcap').value='';setDraw(false);chips();applyFilter();Q('#edsh').hidden=true;Q('#ed').hidden=false}
Q('#edx').onclick=()=>{Q('#ed').hidden=true;if(!Q('#cam').hidden)startCam()};
const pt=e=>{const r=ec.getBoundingClientRect();return{x:(e.clientX-r.left)*W/r.width,y:(e.clientY-r.top)*H/r.height}};
const moveCap=p=>{capY=Math.min(.92,Math.max(.08,p.y/H))};
ec.addEventListener('pointerdown',e=>{const p=pt(e);down=true;ec.setPointerCapture(e.pointerId);
 if(drawing){ix.strokeStyle=color;ix.lineWidth=14;ix.lineCap=ix.lineJoin='round';ix.beginPath();ix.moveTo(p.x,p.y);ix.lineTo(p.x+.1,p.y);ix.stroke()}else moveCap(p);render()});
ec.addEventListener('pointermove',e=>{if(!down)return;const p=pt(e);if(drawing){ix.lineTo(p.x,p.y);ix.stroke()}else moveCap(p);render()});
['pointerup','pointercancel'].forEach(n=>ec.addEventListener(n,()=>down=false));
Q('#edsend').onclick=()=>{const sh=Q('#edsh');
 sh.innerHTML=`<b>Send to</b><button class='row' data-s='story'><span class='av' style='background:#FF4F81'>+</span><span class='nm'><b>My story</b></span></button>`+(S.f.length?S.f.map(p=>`<button class='row' data-f='${p.u}'>${av(p)}<span class='nm'><b>${esc(p.n)}</b></span></button>`).join(''):`<p class='note'>Add friends to send snaps in chat.</p>`)+`<div style='padding:8px 18px 0'><button class='btn alt' id='edshx' style='width:100%'>Cancel</button></div>`;
 sh.hidden=false};
Q('#edsh').onclick=async e=>{if(e.target.id==='edshx'){Q('#edsh').hidden=true;return}
 const b=e.target.closest('button');if(!b||busy)return;const s=b.dataset.s,f=b.dataset.f;if(!s&&!f)return;
 busy=true;try{const img=ec.toDataURL('image/jpeg',.72);
  if(s){await api('post',{img});toast('Added to your story');if(!Q('#stories').hidden)loadSt()}
  else{await api('send',{w:f,img});toast('Sent to '+b.querySelector('b').textContent)}
  Q('#edsh').hidden=true}catch(x){toast(x.message)}busy=false};
})();
