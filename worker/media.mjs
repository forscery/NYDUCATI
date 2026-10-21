const MAX=20*1024*1024;
const json=(value,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
export function imageType(b){
 if(b[0]===255&&b[1]===216&&b[2]===255)return ['image/jpeg','jpg'];
 if([137,80,78,71,13,10,26,10].every((v,i)=>b[i]===v))return ['image/png','png'];
 const s=String.fromCharCode(...b.slice(0,32));
 if(s.startsWith('GIF87a')||s.startsWith('GIF89a'))return ['image/gif','gif'];
 if(s.startsWith('RIFF')&&s.slice(8,12)==='WEBP')return ['image/webp','webp'];
 if(s.slice(4,8)==='ftyp'&&['avif','avis'].includes(s.slice(8,12)))return ['image/avif','avif'];
 return null;
}
export async function handleMedia(request,env,fetcher=fetch){
 const url=new URL(request.url);
 if(!env.MEDIA)return json({error:'The MEDIA bucket binding is missing.'},503);
 if(url.pathname.startsWith('/media/')){
  if(!['GET','HEAD'].includes(request.method))return json({error:'Method not allowed'},405);
  const key=url.pathname.slice(7);
  if(!/^images\/[a-z0-9-]+-[a-f0-9]{64}\.(jpg|png|webp|gif|avif)$/.test(key))return new Response('Not found',{status:404});
  const object=await env.MEDIA.get(key);
  if(!object)return new Response('Not found',{status:404});
  const headers=new Headers({'Content-Type':object.httpMetadata?.contentType||'application/octet-stream','Cache-Control':'public, max-age=31536000, immutable','ETag':object.httpEtag,'X-Content-Type-Options':'nosniff'});
  if(request.headers.get('If-None-Match')===object.httpEtag)return new Response(null,{status:304,headers});
  return new Response(request.method==='HEAD'?null:object.body,{headers});
 }
 if(!['GET','POST'].includes(request.method))return json({error:'Method not allowed'},405);
 const origin=request.headers.get('Origin');
 if(origin&&origin!==url.origin)return json({error:'Cross-origin request refused'},403);
 const authorization=request.headers.get('Authorization')||'';
 if(!/^Bearer [\w-]+$/.test(authorization))return json({error:'Sign in to the CMS first.'},401);
 let allowed=false;
 try{const permission=await fetcher('https://api.github.com/repos/forscery/NYDUCATI',{headers:{Authorization:authorization,Accept:'application/vnd.github+json','User-Agent':'NYDUCATI-Media'}});allowed=permission.ok&&(await permission.json()).permissions?.push;}catch{return json({error:'Could not verify GitHub access. Try again.'},502);}
 if(!allowed)return json({error:'GitHub write access to NYDUCATI is required.'},403);
 if(request.method==='GET'){
  if(url.searchParams.get('stats')==='1'){
   let bytes=0,files=0,cursor,scannedPages=0;
   do {const page=await env.MEDIA.list({limit:1000,cursor});for(const o of page.objects){bytes+=o.size;files++;}scannedPages++;cursor=page.truncated?page.cursor:undefined;}while(cursor&&scannedPages<100);
   return json({bytes,files,scannedPages,partial:!!cursor});
  }
  const result=await env.MEDIA.list({prefix:'images/',limit:48,cursor:url.searchParams.get('cursor')||undefined});
  return json({files:result.objects.map(o=>({url:url.origin+'/media/'+o.key,name:o.customMetadata?.originalName||o.key.split('/').pop(),size:o.size})),cursor:result.truncated?result.cursor:null});
 }
 if(Number(request.headers.get('Content-Length'))>MAX)return json({error:'Image exceeds 20 MB.'},413);
 const reader=request.body?.getReader();if(!reader)return json({error:'No image supplied'},400);
 let size=0;const chunks=[];
 while(true){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>MAX){await reader.cancel();return json({error:'Image exceeds 20 MB.'},413);}chunks.push(value);}
 const bytes=new Uint8Array(size);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length;}
 const type=imageType(bytes);if(!type)return json({error:'Use a JPEG, PNG, WebP, GIF or AVIF image. SVG and video uploads are not accepted.'},415);
 const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),n=>n.toString(16).padStart(2,'0')).join('');
 const name=(url.searchParams.get('name')||'photo').replace(/\.[^.]+$/,'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,90)||'photo';
 const key=`images/${name}-${digest}.${type[1]}`;
 await env.MEDIA.put(key,bytes,{httpMetadata:{contentType:type[0]},customMetadata:{originalName:(url.searchParams.get('name')||name).slice(0,200)}});
 return json({url:url.origin+'/media/'+key,size,contentType:type[0]},201);
}
