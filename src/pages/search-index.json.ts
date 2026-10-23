import journeys from '../lib/journeys.js';
import posts from '../lib/posts.js';
const plain=(s:string)=>s.replace(/<[^>]*>/g,' ').replace(/&#(x[\da-f]+|\d+);/gi,(_,v)=>String.fromCodePoint(v[0].toLowerCase()==='x'?parseInt(v.slice(1),16):Number(v))).replace(/&(amp|lt|gt|quot|apos|nbsp);/g,(_,v)=>({amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' '})[v]||' ').replace(/\s+/g,' ').trim();
export function GET(){
 const entries=posts.filter(p=>p.showInFeed!==false).map(p=>({title:p.title,path:p.path,text:plain(p.body)+' '+(p.tags||[]).join(' ')+' '+(p.location?.name||'')}));
 entries.push(...journeys.map(j=>({title:j.title,path:j.path,text:plain(j.html)+' '+j.chapters.map(c=>c.title+' '+c.excerpt).join(' ')})));
 return new Response(JSON.stringify(entries),{headers:{'Content-Type':'application/json'}});
}
