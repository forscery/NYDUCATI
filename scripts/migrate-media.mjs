import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {Parser} from 'htmlparser2';
import {marked} from 'marked';
import {fileURLToPath} from 'node:url';
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const escapeRe=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
export async function atomic(file,data){await fs.mkdir(path.dirname(file),{recursive:true});await fs.writeFile(file+'.tmp',JSON.stringify(data,null,2)+'\n');await fs.rename(file+'.tmp',file);}
export function rewriteBody(body,format,mapping){
 let count=0;
 function html(text){const edits=[];const parser=new Parser({onopentag(tag,a){
  const keys=tag==='img'?['src','data-src']:tag==='a'?['href']:[];
  const start=parser.startIndex,end=parser.endIndex+1;let raw=text.slice(start,end);
  for(const key of keys){const url=mapping.get(a[key]);if(!url)continue;const re=new RegExp(`(\\s${key}\\s*=\\s*)("[^"]*"|'[^']*'|[^\\s>]+)`,'i');raw=raw.replace(re,(_,prefix)=>{count++;return `${prefix}"${url}"`;});}
  // Retain responsive descriptors; replace only exact known candidates.
  if(tag==='img'&&a.srcset){const value=a.srcset.split(',').map(part=>part.trim().split(/\s+/)).map(([src,...rest])=>{if(mapping.has(src)){count++;src=mapping.get(src);}return [src,...rest].join(' ');}).join(', ');if(value!==a.srcset)raw=raw.replace(/(\ssrcset\s*=\s*)("[^"]*"|'[^']*')/i,(_,prefix)=>`${prefix}"${value.replaceAll('"','&quot;')}"`);}
  if(raw!==text.slice(start,end))edits.push({start,end,raw});
 }},{decodeEntities:true});parser.end(text);for(const e of edits.reverse())text=text.slice(0,e.start)+e.raw+text.slice(e.end);return text;}
 if(format==='html')return {body:html(body),count};
 const tokens=marked.lexer(body),edits=new Map();
 marked.walkTokens(tokens,t=>{if((t.type==='image'||t.type==='link')&&mapping.has(t.href)){
  // Inline destinations only; reference definitions are handled below.
  const pos=t.raw.indexOf('](');if(pos>=0){const next=t.raw.slice(0,pos+2)+t.raw.slice(pos+2).replace(t.href,mapping.get(t.href));if(next!==t.raw)edits.set(t.raw,next);}
 }});
 // Avoid replacing prose or fenced/inline code: operate on parsed non-code blocks.
 function block(t){if(t.type==='code'||t.type==='codespan')return t.raw;if(t.type==='def')return definitions(t.raw);let raw=t.raw;for(const [before,after]of edits){const n=raw.split(before).length-1;if(n){raw=raw.split(before).join(after);count+=n;}}return html(raw);}
 function definitions(text){ for(const [old,url]of mapping){if(!Object.values(tokens.links||{}).some(link=>link.href===old))continue;const re=new RegExp(`^( {0,3}\\[[^\\]\\n]+\\]:[ \\t]*<?)${escapeRe(old)}(?=>?(?:[ \\t]|$))`,'gm');text=text.replace(re,(_,prefix)=>{count++;return prefix+url;});}return text;}
 let result='',cursor=0;
 count=0;result='';cursor=0;for(const t of tokens){const i=body.indexOf(t.raw,cursor);if(i<0)continue;result+=definitions(body.slice(cursor,i));const codes=[];const raw=t.type==='code'?t.raw:t.raw.replace(/(`+)[\s\S]*?\1/g,m=>{codes.push(m);return `NYDUCATI_CODE_${codes.length-1}_END`;});let next=block({...t,raw});next=next.replace(/NYDUCATI_CODE_(\d+)_END/g,(_,n)=>codes[Number(n)]);result+=next;cursor=i+t.raw.length;}result+=definitions(body.slice(cursor));

 return {body:result,count};
}
export async function migrate({prepared,posts,output,site,upload=false,token,fetcher=fetch}){
 prepared=path.resolve(prepared);posts=path.resolve(posts);output=path.resolve(output);
 if(output===posts||output.startsWith(posts+path.sep)||posts.startsWith(output+path.sep)||output===prepared||output.startsWith(prepared+path.sep))throw Error('Choose a separate staging output folder, outside posts and prepared images.');
 const origin=new URL(site);if(origin.protocol!=='https:'||origin.pathname!=='/'||origin.search||origin.hash||origin.username||origin.password)throw Error('Site must be an HTTPS origin without a path or credentials.');
 if(upload&&!token)throw Error('Set NYDUCATI_GITHUB_TOKEN locally to a token with repository write access. Never put it in a command argument or report.');
 const manifest=JSON.parse(await fs.readFile(path.join(prepared,'manifest.json'),'utf8'));
 const stateFile=path.join(output,'uploads.json');let state={version:1,site:origin.origin,files:{}};
 try{state=JSON.parse(await fs.readFile(stateFile,'utf8'));if(state.site!==origin.origin)throw Error('Upload state belongs to a different site. Use another output folder.');}catch(e){if(e.code!=='ENOENT')throw e;}
 const mapping=new Map(),failures=[],planned=new Map();let uploaded=0,reused=0;
 for(const item of manifest.items||[]){
  if(item.status!=='converted'){failures.push({source:item.source,posts:item.posts||[],reason:item.error||'Not converted'});continue;}
  try{
   if(!item.output||path.basename(item.output)!==item.output)throw Error('Invalid prepared filename');
   const bytes=await fs.readFile(path.join(prepared,item.output));if(hash(bytes)!==item.outputHash)throw Error('Prepared file checksum mismatch; reconvert before uploading.');
   if(bytes.length>20*1024*1024)throw Error('Exceeds the image uploader’s 20 MiB cap; review this file.');
   planned.set(item.outputHash,{file:item.output,bytes:bytes.length});if(!upload)continue;
   let record=state.files[item.outputHash];
   async function verify(url){const target=new URL(url);if(target.origin!==origin.origin||!/^\/media\/images\/[a-z0-9-]+-[a-f0-9]{64}\.(webp|gif|jpg|png|avif)$/.test(target.pathname))throw Error('Unexpected media URL');const res=await fetcher(target,{signal:AbortSignal.timeout(30000),redirect:'error'});if(!res.ok)throw Error(`Media verification HTTP ${res.status}`);if(Number(res.headers.get('content-length'))>20*1024*1024)throw Error('Unexpected media size');const chunks=[];let total=0;for await(const chunk of res.body){total+=chunk.length;if(total>bytes.length)throw Error('Unexpected media size');chunks.push(chunk);}const actual=Buffer.concat(chunks);if(actual.length!==bytes.length||hash(actual)!==item.outputHash)throw Error('Uploaded image checksum mismatch');}
   if(record){try{await verify(record.url);reused++;}catch{record=null;}}
   if(!record){const endpoint=new URL('/api/media',origin);endpoint.searchParams.set('name',item.output);const response=await fetcher(endpoint,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/octet-stream'},body:bytes,signal:AbortSignal.timeout(60000),redirect:'error'});if(!response.ok)throw Error(`Upload HTTP ${response.status}`);const data=await response.json();await verify(data.url);record={url:data.url,bytes:bytes.length,verifiedAt:new Date().toISOString()};state.files[item.outputHash]=record;await atomic(stateFile,state);uploaded++;}
   mapping.set(item.source,record.url);
  }catch(e){failures.push({source:item.source,posts:item.posts||[],reason:e.message});}
 }
 const changed=[];
 // Produce complete reviewable copies. Never modify originals or publish posts.
 async function stage(dir,relative=''){for(const entry of await fs.readdir(dir,{withFileTypes:true})){const rel=path.join(relative,entry.name),file=path.join(dir,entry.name);if(entry.isDirectory()){await stage(file,rel);continue;}if(!entry.name.endsWith('.json'))continue;const post=JSON.parse(await fs.readFile(file,'utf8'));if(typeof post.body!=='string')continue;const rewrite=rewriteBody(post.body,post.format,mapping);post.body=rewrite.body;let count=rewrite.count;for(const obj of [post.hero,post.seo]){const key=obj===post.hero?'image':'socialImage';if(obj){const replace=v=>{if(mapping.has(v)){count++;return mapping.get(v);}return v;};obj[key]=Array.isArray(obj[key])?obj[key].map(replace):replace(obj[key]);}}
 const issues=failures.filter(f=>f.posts.includes(post.path));post.mediaIssues=post.mediaIssues||[];for(const issue of issues){const id='migration-'+hash(issue.source).slice(0,16);if(!post.mediaIssues.some(i=>i.id===id))post.mediaIssues.push({id,status:'conversion_failed',source:issue.source,reason:issue.reason,date:post.publishedAt?`Post date: ${post.publishedAt}`:''});}if(!post.mediaIssues.length)delete post.mediaIssues;
 if(upload)await atomic(path.join(output,'posts',rel),post);changed.push({file:rel,path:post.path,replacements:count,unresolved:issues.length});}}
 await stage(posts);
 const report={version:1,mode:upload?'staged':'plan',site:origin.origin,uniqueFiles:planned.size,preparedBytes:[...planned.values()].reduce((n,f)=>n+f.bytes,0),uploaded,reused,failures,posts:changed,mapping:Object.fromEntries(mapping),published:false};await atomic(path.join(output,'report.json'),report);return report;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){const [prepared,posts,output,...flags]=process.argv.slice(2);if(!output)throw Error('Usage: node scripts/migrate-media.mjs PREPARED_FOLDER POSTS_FOLDER STAGING_FOLDER --site=https://SITE [--upload]');const report=await migrate({prepared,posts,output,site:flags.find(f=>f.startsWith('--site='))?.slice(7)||'https://nyducati.hidden-silence-47e4.workers.dev',upload:flags.includes('--upload'),token:process.env.NYDUCATI_GITHUB_TOKEN});console.log(JSON.stringify({mode:report.mode,files:report.uniqueFiles,bytes:report.preparedBytes,uploaded:report.uploaded,reused:report.reused,failures:report.failures.length,staging:output,published:false}));if(report.failures.length)process.exitCode=1;}
