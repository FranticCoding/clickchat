(()=>{
const Q=s=>document.querySelector(s);
const ICE={iceServers:[{urls:['stun:stun.l.google.com:19302','stun:stun1.l.google.com:19302']}]};
const st=document.createElement('style');
st.textContent=`#cl,#ci{position:fixed;inset:0;z-index:16;background:#0d0820;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;text-align:center;padding:env(safe-area-inset-top) 20px env(safe-area-inset-bottom)}
#ci{z-index:17;background:rgba(13,8,32,.97)}
#clr{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;background:#0d0820}
#cll{position:absolute;top:calc(env(safe-area-inset-top) + 12px);right:12px;width:96px;aspect-ratio:3/4;object-fit:cover;border-radius:12px;z-index:3;transform:scaleX(-1);background:#222}
#clmid{position:relative;z-index:2;display:flex;flex-direction:column;align-items:center;gap:8px;text-shadow:0 1px 8px rgba(0,0,0,.6)}
#clctl{position:absolute;left:0;right:0;bottom:calc(env(safe-area-inset-bottom) + 24px);display:flex;gap:12px;justify-content:center;z-index:3}
.cend{background:var(--coral)!important;color:#fff!important}`;
document.head.appendChild(st);
const box=document.createElement('div');
box.innerHTML=`<div id='cl' hidden><video id='clr' autoplay playsinline></video><video id='cll' autoplay playsinline muted hidden></video><div id='clmid'><div id='clav'></div><b id='cln' style='font-size:22px'></b><span id='clst' style='color:var(--mut)'></span></div><div id='clctl'><button class='btn alt' id='clm'>Mute</button><button class='btn alt' id='clv'>Camera off</button><button class='btn cend' id='cle'>End</button></div></div>
<div id='ci' hidden><div id='ciav'></div><b id='cin' style='font-size:22px'></b><span id='cit' style='color:var(--mut)'></span><div style='display:flex;gap:12px;margin-top:16px'><button class='btn alt' id='cid'>Decline</button><button class='btn' id='cia'>Accept</button></div></div>`;
while(box.firstChild)document.body.appendChild(box.firstChild);
let pc=null,ls=null,cid='',role='',buf=[],pend=[],nI=0,pT=null,aT=null,tt=null,rs=false,inc=null,incT=null,peer=null,t0=0;
const capi=async(a,d)=>{const r=await fetch('/api/call',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({...d,a,t:T})});const j=await r.json().catch(()=>({}));if(!r.ok)throw Error(j.error||'Call failed');return j};
const media=v=>navigator.mediaDevices.getUserMedia({audio:true,video:v?{facingMode:'user'}:false});
function sendIce(c){if(cid)capi('ice',{id:cid,c}).catch(()=>{});else buf.push(c)}
function mkpc(){pc=new RTCPeerConnection(ICE);ls.getTracks().forEach(t=>pc.addTrack(t,ls));
 pc.ontrack=e=>{const r=Q('#clr');r.srcObject=e.streams[0];r.play().catch(()=>{})};
 pc.onicecandidate=e=>{if(e.candidate)sendIce(e.candidate.toJSON())};
 pc.onconnectionstatechange=()=>{const s=pc.connectionState;if(s==='connected')connected();if(s==='failed')end('Could not connect. Your networks may block direct calls.')}}
function showCall(p,v,msg){Q('#clav').innerHTML=av(p,'big');Q('#cln').textContent=p.n||p.u;Q('#clst').textContent=msg;
 const l=Q('#cll');l.hidden=!v;if(v)l.srcObject=ls;Q('#clv').hidden=!v;Q('#clm').textContent='Mute';Q('#clv').textContent='Camera off';Q('#cl').hidden=false}
function connected(){clearTimeout(aT);if(tt)return;t0=Date.now();tt=setInterval(()=>{const s=Math.floor((Date.now()-t0)/1000);Q('#clst').textContent=Math.floor(s/60)+':'+String(s%60).padStart(2,'0')},1000);Q('#clst').textContent='0:00'}
function end(msg,remote){if(!pc&&!ls&&!cid&&Q('#cl').hidden)return;
 clearInterval(pT);clearTimeout(aT);clearInterval(tt);pT=aT=tt=null;
 if(!remote&&cid)capi('hang',{id:cid}).catch(()=>{});
 try{pc&&pc.close()}catch(e){}pc=null;if(ls)ls.getTracks().forEach(t=>t.stop());ls=null;
 Q('#clr').srcObject=null;Q('#cll').srcObject=null;cid='';role='';buf=[];pend=[];nI=0;rs=false;Q('#cl').hidden=true;if(msg)toast(msg)}
async function poll(){if(!cid)return;try{const j=await capi('poll',{id:cid,n:nI});if(j.end){end('Call ended',1);return}
 if(role==='c'&&j.ans&&!rs){await pc.setRemoteDescription(j.ans);rs=true;pend.forEach(c=>pc.addIceCandidate(c).catch(()=>{}));pend=[];Q('#clst').textContent='Connecting...'}
 for(const c of j.ice){nI++;if(rs)pc.addIceCandidate(c).catch(()=>{});else pend.push(c)}}catch(e){}}
async function startCall(p,v){if(pc||inc)return toast('You are already in a call');
 if(!navigator.mediaDevices||!window.RTCPeerConnection)return toast('Calls are not supported in this browser');
 peer=p;role='c';
 try{ls=await media(v)}catch(e){ls=null;return toast('Allow the microphone'+(v?' and camera':'')+' to call')}
 showCall(p,v,'Calling...');mkpc();
 try{const o=await pc.createOffer();await pc.setLocalDescription(o);const j=await capi('ring',{w:p.u,v:v?1:0,o:{type:o.type,sdp:o.sdp}});cid=j.id}catch(e){end(e.message);return}
 buf.forEach(sendIce);buf=[];
 aT=setTimeout(()=>{if(!rs)end('No answer')},45000);pT=setInterval(poll,1200)}
function showInc(){const r=inc,p=S.f.find(x=>x.u===r.from)||{u:r.from,n:r.from,p:''};
 Q('#ciav').innerHTML=av(p,'big');Q('#cin').textContent=p.n||p.u;Q('#cit').textContent='Incoming '+(r.v?'video':'voice')+' call';Q('#ci').hidden=false;
 incT=setTimeout(()=>{if(inc&&inc.id===r.id){inc=null;Q('#ci').hidden=true}},44000)}
async function accept(){const r=inc;if(!r)return;inc=null;clearTimeout(incT);Q('#ci').hidden=true;
 peer=S.f.find(x=>x.u===r.from)||{u:r.from,n:r.from,p:''};role='e';cid=r.id;
 try{ls=await media(!!r.v)}catch(e){ls=null;toast('Allow the microphone to answer');capi('hang',{id:cid}).catch(()=>{});cid='';role='';return}
 showCall(peer,!!r.v,'Connecting...');mkpc();
 try{await pc.setRemoteDescription(r.o);rs=true;const a=await pc.createAnswer();await pc.setLocalDescription(a);await capi('accept',{id:cid,s:{type:a.type,sdp:a.sdp}})}catch(e){end('Could not answer the call');return}
 pT=setInterval(poll,1200)}
function decline(){const r=inc;inc=null;clearTimeout(incT);Q('#ci').hidden=true;if(r)capi('hang',{id:r.id}).catch(()=>{})}
Q('#cia').onclick=accept;Q('#cid').onclick=decline;Q('#cle').onclick=()=>end('');
Q('#clm').onclick=()=>{if(!ls)return;const t=ls.getAudioTracks()[0];if(!t)return;t.enabled=!t.enabled;Q('#clm').textContent=t.enabled?'Mute':'Unmute'};
Q('#clv').onclick=()=>{if(!ls)return;const t=ls.getVideoTracks()[0];if(!t)return;t.enabled=!t.enabled;Q('#clv').textContent=t.enabled?'Camera off':'Camera on'};
async function inbound(){if(pc||inc||document.hidden||!T)return;try{const j=await capi('inc',{});if(j.r&&!pc&&!inc){inc=j.r;showInc()}}catch(e){}}
setInterval(inbound,5000);
const tsk=Q('#tsk'),g=document.createElement('span'),b1=document.createElement('button'),b2=document.createElement('button');
g.style.cssText='display:flex;gap:6px;align-items:center';
b1.className=b2.className='btn alt sm';b1.textContent='Call';b2.textContent='Video';
b1.onclick=()=>{if(cur)startCall(cur,false)};b2.onclick=()=>{if(cur)startCall(cur,true)};
tsk.parentNode.insertBefore(g,tsk);g.append(b1,b2,tsk);
})();
