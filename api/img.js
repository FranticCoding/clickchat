module.exports=async(req,res)=>{
 const id=String(req.query.id||'');
 if(!/^[a-f0-9]{24}$/.test(id))return res.status(400).end();
 try{
  const r=await fetch(process.env.KV_REST_API_URL+'/get/img:'+id,{headers:{Authorization:'Bearer '+process.env.KV_REST_API_TOKEN}});
  const j=await r.json();
  if(!j.result)return res.status(404).end();
  res.setHeader('content-type','image/jpeg');
  res.setHeader('cache-control','public, max-age=31536000, immutable');
  res.send(Buffer.from(j.result,'base64'));
 }catch(e){console.error(e);res.status(500).end()}
};
