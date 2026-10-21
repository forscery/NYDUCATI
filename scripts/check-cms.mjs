import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import {Parser} from 'htmlparser2';import {marked} from 'marked';import * as yaml from 'js-yaml';import {fromJS} from 'immutable';
import {estimate} from './media-cost.mjs';import {handleMedia} from '../worker/media.mjs';import {editorialHash,validPath} from '../src/lib/model.mjs';
function extract(html){const text=[],images=[],links=[];const parser=new Parser({ontext:t=>text.push(t),onopentag:(name,a)=>{if(name==='img')images.push(a.src);if(name==='a'&&a.href)links.push(a.href);}}, {decodeEntities:true});parser.write(html);parser.end();return {text:text.join(' ').replace(/\s+/g,' ').trim(),images,links};}
for(const f of fs.readdirSync('migration/originals')){const old=JSON.parse(fs.readFileSync('migration/originals/'+f)),p=JSON.parse(fs.readFileSync('content/posts/'+f));const a=extract(old.body),b=extract(marked.parse(p.body));assert.equal(b.text,a.text,'Text preserved: '+f);assert.deepEqual(b.images,a.images,'Images preserved: '+f);assert.deepEqual(b.links,a.links,'Links preserved: '+f);assert.equal(editorialHash(p),p.revisionBaseline);assert.ok(fs.readFileSync('dist'+p.path,'utf8').includes('View revision history'));assert.ok(!fs.readFileSync('dist'+p.path,'utf8').includes('Updated <time'),'Migration must not invent an update date');}
const config=yaml.load(fs.readFileSync('public/admin/config.yml','utf8'));assert.equal(config.media_library.name,'nyducati-r2');assert.deepEqual(config.collections.slice(0,2).map(c=>c.filter.value),['post','page']);
let presave,onEditorChange,imageComponent,patches=[];const cms={editor:{onEditorChange(fn){onEditorChange=fn;},applyFieldPatch(p){patches.push(...p);}},registerEditorComponent(c){imageComponent=c;},getLocale(){return null;},registerPreviewStyle(){},registerPreviewTemplate(){},registerEventListener(e){presave=e.handler;},init(){}};vm.runInNewContext(fs.readFileSync('public/admin/editor.js','utf8'),{CMS:cms,window:{h(){},marked}});
const updated=presave({entry:fromJS({data:{path:'/new/',originalPath:'/old/',aliases:[]}})});assert.deepEqual(updated.toJS().aliases,['/old/']);assert.equal(updated.get('originalPath'),'/new/');
assert.equal(presave({entry:fromJS({data:{title:'Settings'}})}).get('aliases'),undefined);
assert.equal(estimate({bytes:17.5e9}).storageUSD,.12);assert.equal(estimate({bytes:8e9}).storageUSD,0);assert.equal(estimate({bytes:0,writes:1000001}).writeUSD,4.5);assert.equal(estimate({bytes:0,reads:10000001}).readUSD,.36);
assert.ok(!validPath('/admin/'));assert.ok(!validPath('/../../secret/'));assert.ok(validPath('/2015/11/test.html'));
let saved;const bucket={put:async(k,b,o)=>{saved={k,b,o};},list:async()=>({objects:[],truncated:false}),get:async()=>null};
const origin='https://nyducati.hidden-silence-47e4.workers.dev',allow=async()=>Response.json({permissions:{push:true}}),deny=async()=>Response.json({permissions:{push:false}});
assert.equal((await handleMedia(new Request(origin+'/api/media'),{MEDIA:bucket},allow)).status,401);
const auth={Authorization:'Bearer test-token'};
assert.equal((await handleMedia(new Request(origin+'/api/media',{headers:auth}),{MEDIA:bucket},deny)).status,403);
assert.equal((await handleMedia(new Request(origin+'/api/media',{method:'POST',headers:{...auth,Origin:'https://evil.test'},body:'bad'}),{MEDIA:bucket},allow)).status,403);
assert.equal((await handleMedia(new Request(origin+'/api/media',{method:'POST',headers:auth,body:'<svg onload="alert(1)">'}),{MEDIA:bucket},allow)).status,415);
assert.equal((await handleMedia(new Request(origin+'/api/media',{method:'POST',headers:{...auth,'Content-Length':String(21*1024*1024)},body:'x'}),{MEDIA:bucket},allow)).status,413);
const png=new Uint8Array([137,80,78,71,13,10,26,10]);const response=await handleMedia(new Request(origin+'/api/media?name=Lake%20Como.png',{method:'POST',headers:auth,body:png}),{MEDIA:bucket},allow);assert.equal(response.status,201);assert.match(saved.k,/^images\/lake-como-[a-f0-9]{64}\.png$/);assert.equal(saved.o.httpMetadata.contentType,'image/png');assert.ok((await response.json()).url.startsWith(origin+'/media/'));
const first=saved.k;await handleMedia(new Request(origin+'/api/media?name=Lake%20Como.png',{method:'POST',headers:auth,body:png}),{MEDIA:bucket},allow);assert.equal(saved.k,first);
console.log('PASS: prose, links and images preserved; CMS fields and redirect hook; migration revision baseline; cost rounding; upload authorization, validation and stable media keys.');

const save=d=>presave({entry:fromJS({data:d})}).toJS();
assert.equal(save({kind:'post',title:'Two Wheel Tuesdays',publishedAt:'2020-03-08'}).path,'/2020/03/two-wheel-tuesdays.html');
assert.equal(save({kind:'post',title:'Ignored',path:'two-wheel-tuesdays',publishedAt:'2026-10-21'}).path,'/2026/10/two-wheel-tuesdays.html');
assert.equal(save({kind:'page',title:'About Tigh'}).path,'/p/about-tigh.html');
assert.match(save({kind:'post',title:'Today'}).publishedAt,/^\d{4}-\d{2}-\d{2}$/);
assert.equal(save({kind:'post',title:'New title',path:'/2015/11/original.html',originalPath:'/2015/11/original.html',metadataPending:true,publishedAt:''}).publishedAt,'');
assert.throws(()=>save({kind:'post',title:'Bad',path:'/admin/'}));
onEditorChange({collection:'posts',slug:null,data:{kind:'post',title:'First title',publishedAt:'2025-01-01'}});assert.equal(patches.at(-1).value,'/2025/01/first-title.html');
onEditorChange({collection:'posts',slug:null,data:{kind:'post',title:'Second title',publishedAt:'2024-12-31',path:patches.at(-1).value}});assert.equal(patches.at(-1).value,'/2024/12/second-title.html');
const n=patches.length;
onEditorChange({collection:'posts',slug:null,data:{kind:'post',title:'Third',path:'custom-slug'}});assert.equal(patches.length,n);
onEditorChange({collection:'posts',slug:'saved',data:{kind:'post',title:'Changed',path:'/old/',originalPath:'/old/'}});assert.equal(patches.length,n);
assert.equal(imageComponent.fields[0].media_library.name,'nyducati-r2');
const imageUrl='https://example.test/media/images/lake.webp',block=imageComponent.toBlock({image:imageUrl,alt:'Lake Como',title:'Italian lakes'});
assert.equal(imageComponent.fromBlock(block.match(imageComponent.pattern)).image,imageUrl);
assert.ok(marked.parse(block).includes('<img src="'+imageUrl+'"'));
assert.equal(imageComponent.toPreview({image:imageUrl,alt:'Lake'}),undefined); // h stub verifies the preview function can be called.
for(const c of config.collections.slice(0,2)){assert.equal(c.fields.find(f=>f.name==='path').required,false);assert.equal(c.fields.find(f=>f.name==='path').pattern,undefined);assert.equal(c.fields.find(f=>f.name==='publishedAt').default,'{{now}}');assert.deepEqual(c.fields.find(f=>f.name==='body').editor_components,['image']);}
console.log('PASS: automatic dated URLs, bare-slug overrides, backdating, stable saved URLs, blank imported dates, inline R2 image component and Markdown serialization.');
