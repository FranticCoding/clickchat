const c=require('crypto');
const U=process.env.KV_REST_API_URL,K=process.env.KV_REST_API_TOKEN,SEC=process.env.AUTH_SECRET||'';
const R=async(...a)=>{if(!a.length)return[];const cm=Array.isArray(a[0][0])?a[0]:a;const r=await fetch(U+'/pipeline',{method:'POST',headers:{Authorization:'Bearer '+K,'content-type':'application/json'},body:JSON.stringify(cm)});const j=await r.json();if(!Array.isArray(j))throw Error(j.error||'redis');return j.map(x=>{if(x.error)throw Error(x.error);return x.result})};
const R1=async(...x)=>(await R([x]))[0];
const sign=s=>c.createHmac('sha256',SEC).update(s).digest('base64url');
const mkT=u=>{const p=Buffer.from(JSON.stringify({u,e:Date.now()+30*864e5})).toString('base64url');return p+'.'+sign(p)};
const who=t=>{try{const[p,s]=String(t).split('.');if(s!==sign(p))return;const o=JSON.parse(Buffer.from(p,'base64url').toString());if(o.e>Date.now())return o.u}catch(e){}};
const ok=u=>typeof u==='string'&&/^[a-z0-9_]{3,16}$/.test(u);
const hash=(p,s)=>c.scryptSync(p,s,32).toString('hex');
const pair=(a,b)=>[a,b].sort().join('~');
const day=n=>new Date(Date.now()-n*864e5).toISOString().slice(0,10);
const prof=async us=>{if(!us.length)return[];const r=await R(us.map(u=>['HMGET','prof:'+u,'n','p','b']));return us.map((u,i)=>({u,n:r[i][0]||u,p:r[i][1]||'',b:r[i][2]||''}))};
const H='data:image/jpeg;base64,';
const img=async(d,ttl)=>{d=String(d||'');if(!d.startsWith(H)||d.length>8e5)throw Object.assign(Error('Photo is too large or not a JPEG'),{s:400});const id=c.randomBytes(12).toString('hex');await R1(...['SET','img:'+id,d.slice(H.length)].concat(ttl?['EX',String(ttl)]:[]));return id};
const link=(a,b)=>R(['SADD','fr:'+a,b],['SADD','fr:'+b,a],['SREM','in:'+a,b],['SREM','out:'+b,a],['SREM','in:'+b,a],['SREM','out:'+a,b]);
const push=async(me,w,m)=>{const k=pair(me,w),t=day(0);m.id=c.randomBytes(4).toString('hex');m.f=me;m.ts=Date.now();
 await R1('RPUSH','chat:'+k,JSON.stringify(m));
 const r=await R(['SADD',`sd:${k}:${t}`,me],['EXPIRE',`sd:${k}:${t}`,'259200'],['SCARD',`sd:${k}:${t}`],['HMGET','sk:'+k,'n','d']);
 if(r[2]>=2&&r[3][1]!==t){const n=r[3][1]===day(1)?(+r[3][0]||0)+1:1;await R1('HSET','sk:'+k,'n',String(n),'d',t)}};
module.exports=async(req,res)=>{
 const E=(s,m)=>res.status(s).json({error:m});
 try{
  if(req.method!=='POST')return E(405,'POST only');
  if(!U||!K||!SEC)return E(500,'Server not configured');
  const b=req.body||{},a=b.a;
  if(a==='signup'||a==='login'){
   const u=String(b.u||'').toLowerCase().trim(),p=String(b.p||'');
   if(!ok(u))return E(400,'Username: 3-16 letters, numbers or _');
   if(p.length<6)return E(400,'Password needs 6+ characters');
   if(a==='signup'){
    const s=c.randomBytes(8).toString('hex');
    if(!(await R1('SET','pw:'+u,s+':'+hash(p,s),'NX')))return E(409,'That username is taken');
    await R(['ZADD','users','0',u],['HSET','prof:'+u,'n',u,'p','','b','']);
    return res.json({t:mkT(u),u});
   }
   const pw=await R1('GET','pw:'+u);if(!pw)return E(401,'Wrong username or password');
   const[s,h]=pw.split(':');if(hash(p,s)!==h)return E(401,'Wrong username or password');
   return res.json({t:mkT(u),u});
  }
  const me=who(b.t);if(!me)return E(401,'Please log in again');
  if(a==='inbox'){
   const[f,i,o]=await R(['SMEMBERS','fr:'+me],['SMEMBERS','in:'+me],['SMEMBERS','out:'+me]);
   const[M,F,I,O]=await Promise.all([prof([me]),prof(f),prof(i),prof(o)]);
   const sk=f.length?await R(...f.map(u=>['HMGET','sk:'+pair(me,u),'n','d'])):[];
   const t=day(0),y=day(1);
   F.forEach((x,k)=>{const[n,d]=sk[k];x.s=(d===t||d===y)?(+n||0):0});
   return res.json({me:M[0],f:F,i:I,o:O});
  }
  if(a==='prof'){
   const n=String(b.n||'').trim().slice(0,24)||me,bio=String(b.b||'').trim().slice(0,80);
   const cm=['HSET','prof:'+me,'n',n,'b',bio];
   if(b.img)cm.push('p',await img(b.img,0));
   await R1(...cm);return res.json({});
  }
  if(a==='search'){
   const q=String(b.q||'');if(!/^[a-z0-9_]{1,16}$/.test(q))return res.json({n:[]});
   const names=(await R1('ZRANGEBYLEX','users','['+q,'['+q+'~','LIMIT','0','10')).filter(x=>x!==me);
   return res.json({n:await prof(names)});
  }
  if(a==='add'){
   const to=b.to;if(!ok(to)||to===me)return E(400,'Invalid user');
   if(await R1('ZSCORE','users',to)===null)return E(404,'No such user');
   if(await R1('SISMEMBER','fr:'+me,to))return res.json({});
   if(await R1('SISMEMBER','in:'+me,to))await link(me,to);
   else await R(['SADD','in:'+to,me],['SADD','out:'+me,to]);
   return res.json({});
  }
  if(a==='respond'){
   const f=b.from;if(!ok(f))return E(400,'Invalid user');
   if(!(await R1('SISMEMBER','in:'+me,f)))return E(404,'Request not found');
   if(b.yes)await link(me,f);else await R(['SREM','in:'+me,f],['SREM','out:'+f,me]);
   return res.json({});
  }
  if(a==='send'||a==='reply'){
   const w=b.w,x=String(b.x||'').trim().slice(0,300);
   if(!ok(w))return E(400,'Invalid user');
   if(!(await R1('SISMEMBER','fr:'+me,w)))return E(403,'You are not friends yet');
   const m={x};
   if(a==='send'){if(!x&&!b.img)return E(400,'Nothing to send');if(b.img)m.im=await img(b.img,2592000)}
   else{
    const sid=String(b.sid||'');if(!/^[a-f0-9]{24}$/.test(sid)||!x)return E(400,'Nothing to send');
    const d=await R1('GET','img:'+sid);if(!d)return E(404,'That story has expired');
    m.im=c.randomBytes(12).toString('hex');m.r=1;await R1('SET','img:'+m.im,d,'EX','2592000');
   }
   await push(me,w,m);return res.json({});
  }
  if(a==='poll'){
   const w=b.w;if(!ok(w))return E(400,'Invalid user');
   const m=(await R1('LRANGE','chat:'+pair(me,w),String(Math.max(0,+b.n||0)),'-1')).map(s=>JSON.parse(s));
   return res.json({m});
  }
  if(a==='post'){
   const id=await img(b.img,90000),key='st:'+me,now=Date.now();
   const dead=(await R1('LRANGE',key,'0','-1')).filter(s=>now-JSON.parse(s).ts>864e5);
   await R(...dead.map(s=>['LREM',key,'0',s]),['RPUSH',key,JSON.stringify({id,ts:now})]);
   return res.json({});
  }
  if(a==='stories'){
   const f=await R1('SMEMBERS','fr:'+me),us=[me,...f],now=Date.now();
   const[L,P]=await Promise.all([R(...us.map(u=>['LRANGE','st:'+u,'0','-1'])),prof(us)]);
   const out=[];
   us.forEach((u,i)=>{const it=L[i].map(s=>JSON.parse(s)).filter(s=>now-s.ts<864e5);if(it.length)out.push({...P[i],items:it.map(s=>({id:s.id}))})});
   return res.json({s:out});
  }
  return E(400,'Unknown action');
 }catch(e){console.error(e);return res.status(e.s||500).json({error:e.s?e.message:'Server error'});}
};
