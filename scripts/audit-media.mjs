// Offline audit: never fetches media or treats an untested reference as broken.
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {Parser} from 'htmlparser2';
const args=process.argv.slice(2);
const [originals,posts,report]=args;
if(!report)throw Error('Usage: node scripts/audit-media.mjs ORIGINAL_JSON_FOLDER POSTS_FOLDER REPORT.json [--manifest=PATH] [--apply]');
const findings=[];
function add(post,source,reason,status='needs_review'){
 let filename='';try{const name=decodeURIComponent(new URL(source).pathname.split('/').pop());if(/\.[a-z0-9]{2,5}$/i.test(name))filename=name;}catch{}
 findings.push({post:post.path,id:crypto.createHash('sha256').update(`${post.path}|${source}|${status}`).digest('hex').slice(0,16),status,filename,source,date:post.publishedAt?`Post date: ${post.publishedAt}`:'',reason});
}
for(const name of await fs.readdir(originals)){
 if(!name.endsWith('.json'))continue;
 const post=JSON.parse(await fs.readFile(path.join(originals,name),'utf8'));
 new Parser({onopentag(tag,a){
  const reference=a.src||a.data||a['data-video-id']||a.videoid||a['data-original-src']||(tag==='param'?a.value:'')||a.href||'';
  if(['video','source','embed','object','iframe'].includes(tag)||/BLOG_video_class/i.test(a.class||'')||(tag==='param'&&/movie|src/i.test(a.name||''))||(tag==='a'&&/\.(mp4|mov|m4v|webm)(?:[?#]|$)/i.test(reference)))
   add(post,reference,reference?'Original embedded media: playback and migration have not been verified. Locate the original or confirm a working replacement.':'Original media element has no usable reference; inspect the original post or backup.',reference?'needs_review':'missing');
 }}).end(post.body||'');
}
const manifest=args.find(a=>a.startsWith('--manifest='));
if(manifest){const data=JSON.parse(await fs.readFile(manifest.slice(11),'utf8'));for(const item of data.items||[])if(item.status==='error')for(const post of item.posts||[])add({path:post},item.source,item.error||'Conversion failed','conversion_failed');}
const unique=[...new Map(findings.map(i=>[i.id,i])).values()];
const unmatched=new Set(unique.map(i=>i.post));
for(const name of await fs.readdir(posts)){
 if(!name.endsWith('.json'))continue;
 const file=path.join(posts,name),post=JSON.parse(await fs.readFile(file,'utf8'));
 const relevant=unique.filter(i=>i.post===post.path);if(!relevant.length)continue;unmatched.delete(post.path);
 const existing=post.mediaIssues||[],ids=new Set(existing.map(i=>i.id));
 const additions=relevant.filter(i=>!ids.has(i.id)).map(({post:_,...issue})=>issue);
 if(args.includes('--apply')&&additions.length){post.mediaIssues=[...existing,...additions];await fs.writeFile(file,JSON.stringify(post,null,2)+'\n');}
}
await fs.writeFile(report,JSON.stringify({findings:unique,unmatchedPosts:[...unmatched],note:'Offline candidates, not confirmed playback failures. Capture dates and filenames are not invented. Resolved flags survive reruns.'},null,2)+'\n');
console.log(`${unique.length} media references needing review; ${unmatched.size} unmatched posts. ${args.includes('--apply')?'CMS flags added.':'Report only; no posts changed.'}`);
