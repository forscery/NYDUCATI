import fs from 'node:fs';import path from 'node:path';import {validPath,tagPath} from '../src/lib/model.mjs';
const posts=fs.readdirSync('content/posts').filter(f=>f.endsWith('.json')).map(f=>JSON.parse(fs.readFileSync('content/posts/'+f,'utf8'))).filter(p=>!p.draft);
const journeyPosts=fs.readdirSync('content/journeys').filter(f=>f.endsWith('.json')).map(f=>JSON.parse(fs.readFileSync('content/journeys/'+f))).filter(p=>!p.draft);
posts.push(...journeyPosts);
const routes=new Set(posts.map(p=>p.path)),aliases=new Set(),redirects=[];
for(const p of posts){
 if(p.path.endsWith('.html')){const target=path.join('dist',p.path),child=path.join(target,'index.html');if(fs.existsSync(child)){const page=fs.readFileSync(child);fs.unlinkSync(child);fs.rmdirSync(target);fs.writeFileSync(target,page);}}
 for(const alias of p.aliases||[]){if(alias===p.path)continue;if(!validPath(alias)||routes.has(alias)||aliases.has(alias))throw new Error('Invalid or conflicting redirect: '+alias);aliases.add(alias);redirects.push(`${alias} ${p.path} 301`);}
}
const tags=[...new Set(posts.filter(p=>p.kind==='post'&&p.showInFeed!==false).flatMap(p=>p.tags||[]))];
for(const tag of tags)redirects.push(`/search/label/${encodeURIComponent(tag)} ${tagPath(tag)} 301`);
fs.writeFileSync('dist/_redirects',redirects.join('\n')+'\n');

const config=JSON.parse(fs.readFileSync('site.config.json','utf8'));
fs.writeFileSync('dist/_headers','/*\n  X-Content-Type-Options: nosniff\n'+(!config.indexingEnabled?'  X-Robots-Tag: noindex, nofollow\n':''));
fs.writeFileSync('dist/robots.txt','User-agent: *\n'+(config.indexingEnabled?'Disallow: /admin/\nDisallow: /api/\nDisallow: /auth\nSitemap: https://www.nyducati.com/sitemap.xml\n':'Disallow: /\n'));

// No draft content is exposed; compare saved article text/title/path to deployed build.
const {publicationFingerprint}=await import('../public/admin/publication.js');
fs.writeFileSync('dist/publication-status.json',JSON.stringify(Object.fromEntries(await Promise.all(posts.map(async p=>[p.path,await publicationFingerprint(p)])))));
