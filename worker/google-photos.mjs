const ROOT='https://photospicker.googleapis.com/v1/';
const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
export async function handleGooglePhotos(request,env,fetcher=fetch){
 const url=new URL(request.url),action=url.pathname.split('/').pop();
 if(request.headers.get('Origin')&&request.headers.get('Origin')!==url.origin)return json({error:'Cross-origin request refused'},403);
 if(!['GET','POST','DELETE'].includes(request.method))return json({error:'Method not allowed'},405);
 const auth=request.headers.get('Authorization')||'';
 if(!/^Bearer [\w-]+$/.test(auth))return json({error:'Sign in to the CMS first.'},401);
 try{
 const permission=await fetcher('https://api.github.com/repos/forscery/NYDUCATI',{headers:{Authorization:auth,'User-Agent':'NYDUCATI-Photos',Accept:'application/vnd.github+json'},signal:AbortSignal.timeout(15000)});
 if(!permission.ok||!(await permission.json()).permissions?.push)return json({error:'Repository write access is required.'},403);
 if(action==='config')return json({clientId:env.GOOGLE_PHOTOS_CLIENT_ID||'',configured:!!env.GOOGLE_PHOTOS_CLIENT_ID});
 const google=request.headers.get('X-Google-Token');if(!google||google.length>4096||/[\r\n]/.test(google))return json({error:'Connect Google Photos first.'},401);
 const headers={Authorization:`Bearer ${google}`,'Content-Type':'application/json'};
 async function call(relative,method='GET',body){const r=await fetcher(ROOT+relative,{method,headers,body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(20000),redirect:'error'});if(!r.ok)throw Error(r.status===401?'Google authorization expired. Connect again.':`Google Photos request failed (${r.status}). Check API access and try again.`);return r.status===204?{}:r.json();}
 const session=url.searchParams.get('session');const sessionPath=()=>{if(!session||session.length>512)throw Error('Missing session');return 'sessions/'+encodeURIComponent(session);};
 if(action==='sessions'){if(request.method==='POST')return json(await call('sessions','POST',{pickingConfig:{maxItemCount:url.searchParams.get('multiple')==='1'?'20':'1'}}));if(request.method==='DELETE')return json(await call(sessionPath(),'DELETE'));return json(await call(sessionPath()));}
 if(request.method!=='GET')return json({error:'Method not allowed'},405);
 if(action==='items'||action==='download'){
 sessionPath();const query=new URLSearchParams({sessionId:session,pageSize:'100'});if(url.searchParams.get('pageToken'))query.set('pageToken',url.searchParams.get('pageToken'));
 const page=await call('mediaItems?'+query);
 if(action==='items')return json(page);
 const item=(page.mediaItems||[]).find(i=>i.id===url.searchParams.get('id'));
 if(!item||item.type!=='PHOTO')return json({error:'Choose a photo from this session. Videos should go to YouTube.'},400);
 const base=new URL(item.mediaFile.baseUrl);if(base.protocol!=='https:'||!base.hostname.endsWith('.googleusercontent.com')||base.username||base.password||base.port)throw Error('Unexpected Google media host');
 const media=await fetcher(base.href+'=d',{headers:{Authorization:`Bearer ${google}`},redirect:'error',signal:AbortSignal.timeout(30000)});if(!media.ok)throw Error('Google could not download this photo. Select it again.');
 const chunks=[];let size=0;for await(const chunk of media.body){size+=chunk.length;if(size>50*1024*1024)throw Error('Photo exceeds the 50 MB preparation limit.');chunks.push(chunk);}
 return new Response(new Blob(chunks),{headers:{'Content-Type':media.headers.get('Content-Type')||item.mediaFile.mimeType||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
 }
 return json({error:'Not found'},404);
 }catch(e){return json({error:e.message},502);}
}
