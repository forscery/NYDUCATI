// Inventory by default; --convert explicitly permits reading/downloading and converting.
// Does not upload, modify posts, or overwrite source files.
import fs from 'node:fs/promises';import path from 'node:path';import crypto from 'node:crypto';import sharp from 'sharp';import {marked} from 'marked';import {Parser} from 'htmlparser2';import {decodeHeic} from './heic-node.mjs';import {isHeicFile} from '../public/admin/media-convert.js';
const args=process.argv.slice(2),input=args[0],out=args[1],convert=args.includes('--convert');
if(!input||!out)throw Error('Usage: node scripts/batch-images.mjs INPUT_FOLDER OUTPUT_FOLDER [--convert]');
const inputRoot=path.resolve(input),outputRoot=path.resolve(out);if(outputRoot===inputRoot||outputRoot.startsWith(inputRoot+path.sep))throw Error('Choose an output folder outside the input folder.');
const entries=new Map();
function add(source,post){if(!source||(!/^https?:\/\//.test(source)&&!path.isAbsolute(source)))return;const item=entries.get(source)||{source,posts:[]};if(post&&!item.posts.includes(post))item.posts.push(post);entries.set(source,item);}
async function scan(dir){for(const f of await fs.readdir(dir,{withFileTypes:true})){const full=path.join(dir,f.name);if(f.isDirectory()){await scan(full);continue;}if(/\.(jpe?g|png|webp|heic|heif|avif|gif)$/i.test(f.name)){add(full);continue;}if(!/\.json$/i.test(f.name))continue;const post=JSON.parse(await fs.readFile(full,'utf8'));if(typeof post.body!=='string')continue;const parser=new Parser({onopentag:(tag,a)=>{if(tag==='img'){add(a.src,post.path||full);add(a['data-src'],post.path||full);for(const candidate of (a.srcset||'').split(','))add(candidate.trim().split(/\s+/)[0],post.path||full);}}});parser.write(post.format==='html'?post.body:marked.parse(post.body));parser.end();for(const image of [post.hero?.image,post.seo?.socialImage].flat()){if(typeof image==='string')add(image,post.path||full);}}}
await scan(inputRoot);await fs.mkdir(outputRoot,{recursive:true});const manifestPath=path.join(outputRoot,'manifest.json');let old={};try{old=JSON.parse(await fs.readFile(manifestPath,'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
const previous=new Map((old.items||[]).map(i=>[i.source,i]));const items=[];const seen=new Map();let failures=0;
for(const item of entries.values()){
 if(!convert){items.push({...item,status:'inventoried'});continue;}
 try{
  const before=previous.get(item.source);
  if(before?.status==='converted'&&before.output&&path.basename(before.output)===before.output){const data=await fs.readFile(path.join(outputRoot,before.output)).catch(()=>null);if(data&&crypto.createHash('sha256').update(data).digest('hex')===before.outputHash){items.push({...before,posts:item.posts});seen.set(before.sourceHash,before);continue;}}
  let bytes;
  if(/^https?:/.test(item.source)){const response=await fetch(item.source,{signal:AbortSignal.timeout(30000)});if(!response.ok)throw Error('HTTP '+response.status);if(Number(response.headers.get('content-length'))>50*1024*1024)throw Error('Source exceeds 50 MB');const chunks=[];let size=0;for await(const chunk of response.body){size+=chunk.length;if(size>50*1024*1024)throw Error('Source exceeds 50 MB');chunks.push(chunk);}bytes=Buffer.concat(chunks);}
  else {const stat=await fs.stat(item.source);if(stat.size>50*1024*1024)throw Error('Source exceeds 50 MB');bytes=await fs.readFile(item.source);}
  const sourceHash=crypto.createHash('sha256').update(bytes).digest('hex');if(seen.has(sourceHash)){items.push({...seen.get(sourceHash),...item});continue;}
  let image;const blob=new File([bytes],path.basename(item.source));
  if(await isHeicFile(blob)){const decoded=await decodeHeic(bytes);image=sharp(Buffer.from(decoded.data),{raw:{width:decoded.width,height:decoded.height,channels:4}});}else image=sharp(bytes,{limitInputPixels:100000000});
  const info=await image.metadata();const stem=decodeURIComponent(path.basename(new URL(item.source,'file:///').pathname)).replace(/\.[^.]+$/,'').normalize('NFKD').replace(/[^a-zA-Z0-9]+/g,'-').replace(/^-|-$/g,'').toLowerCase().slice(0,65)||'photo';
  const animated=(info.pages||1)>1&&['gif','webp'].includes(info.format);
  const output=`nyducati-${stem}-${sourceHash.slice(0,12)}.${animated?info.format:'webp'}`;
  const prepared=animated?bytes:await image.rotate().resize({width:2400,height:2400,fit:'inside',withoutEnlargement:true}).webp({quality:86}).toBuffer();
  const record={...item,status:'converted',sourceHash,output,outputHash:crypto.createHash('sha256').update(prepared).digest('hex'),originalBytes:bytes.length,preparedBytes:prepared.length,width:info.width,height:info.height,notes:[...(animated?['Animation preserved unchanged']:[]),...(Math.max(info.width||0,info.height||0)<1200?['Low-resolution source; review before migration']:[])]};
  await fs.writeFile(path.join(outputRoot,output),prepared);seen.set(sourceHash,record);items.push(record);
 }catch(e){failures++;items.push({...item,status:'error',error:e.message});}
 // Checkpoint every item so an interrupted job can resume.
 await fs.writeFile(manifestPath+'.tmp',JSON.stringify({version:1,items},null,2));await fs.rename(manifestPath+'.tmp',manifestPath);
}
const unique=new Map(items.filter(i=>i.output).map(i=>[i.output,i]));const report={version:1,mode:convert?'converted':'inventory',sourceCount:items.length,uniquePreparedFiles:unique.size,preparedBytes:[...unique.values()].reduce((n,i)=>n+i.preparedBytes,0),failures,items};
// Preserve conversion progress when someone reruns inventory mode.
await fs.writeFile(convert?manifestPath:path.join(outputRoot,'inventory.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify({sourceCount:report.sourceCount,uniquePreparedFiles:report.uniquePreparedFiles,preparedBytes:report.preparedBytes,failures,output:outputRoot,uploaded:false}));if(failures)process.exitCode=1;
