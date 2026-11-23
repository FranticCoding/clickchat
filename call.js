const c=require('crypto');
const U=process.env.KV_REST_API_URL,K=process.env.KV_REST_API_TOKEN,SEC=process.env.AUTH_SECRET||'';
const R=async(...a)=>{if(!a.length)return[];const cm=Array.isArray(a[0][0])?a[0]:a;const r=await fetch(U+'/pipeline',{method:'POST',headers:{Authorization:'Bearer '+K,'content-type':'application/json'},body:JSON.stringify(cm)});const j=await r.json();if(!Array.isArray(j))throw Error(j.error||'redis');return j.map(x=>{if(x.error)throw Error(x.error);return x.result})};
const R1=async(...x)=>(await R([x]))[0];
const sign=s=>c.createHmac('sha256',SEC).update(s).digest('base64url');
const who=t=>{try{const[p,s]=String(t).split('.');if(s!==sign(p))return;const o=JSON.parse(Buffer.from(p,'base64url').toString());if(o.e>Date.now())return o.u}catch(e){}};
const ok=u=>typeof u==='string'&&/^[a-z0-9_]{3,16}$/.test(u);
module.exports=async(req,res)=>{
 const E=(s,m)=>res.status(s).json({error:m});
 try{
  if(req.method!=='POST')return E(405,'POST only');
  const b=req.body||{},a=b.a,me=who(b.t);
  if(!me)return E(401,'Please log in again');
  if(a==='inc'){const r=await R1('GET','ring:'+me);return res.json({r:r?JSON.parse(r):null})}
  if(a==='ring'){
   const w=b.w;if(!ok(w))return E(400,'Invalid user');
   if(!(await R1('SISMEMBER','fr:'+me,w)))return E(403,'You are not friends yet');
   const o=b.o;if(!o||typeof o.sdp!=='string'||o.sdp.length>30000)return E(400,'Bad offer');
   const id=c.randomBytes(8).toString('hex');
   await R(['SET','ci:'+id,JSON.stringify({a:me,b:w}),'EX','3600'],['SET','ring:'+w,JSON.stringify({id,from:me,v:b.v?1:0,o:{type:'offer',sdp:o.sdp}}),'EX','45']);
   return res.json({id});
  }
  const id=String(b.id||'');if(!/^[a-f0-9]{16}$/.test(id))return E(400,'Bad call id');
  const ci=JSON.parse((await R1('GET','ci:'+id))||'null');
  if(!ci||(ci.a!==me&&ci.b!==me))return E(403,'Not your call');
  const mine=ci.a===me?'c':'e',other=mine==='c'?'e':'c';
  if(a==='accept'){
   const s=b.s;if(ci.b!==me||!s||typeof s.sdp!=='string'||s.sdp.length>30000)return E(400,'Bad answer');
   await R(['SET','ans:'+id,JSON.stringify({type:'answer',sdp:s.sdp}),'EX','3600'],['DEL','ring:'+me]);
   return res.json({});
  }
  if(a==='ice'){
   const s=JSON.stringify(b.c||{});if(s.length>2000)return E(400,'Bad candidate');
   await R(['RPUSH','ice:'+id+':'+mine,s],['EXPIRE','ice:'+id+':'+mine,'3600']);
   return res.json({});
  }
  if(a==='poll'){
   const r=await R(['GET','ans:'+id],['GET','end:'+id],['LRANGE','ice:'+id+':'+other,String(Math.max(0,+b.n||0)),'-1']);
   return res.json({ans:r[0]?JSON.parse(r[0]):null,end:!!r[1],ice:r[2].map(x=>JSON.parse(x))});
  }
  if(a==='hang'){
   await R(['SET','end:'+id,'1','EX','3600'],['DEL','ring:'+ci.b]);
   return res.json({});
  }
  return E(400,'Unknown action');
 }catch(e){console.error(e);return E(500,'Server error')}
};
