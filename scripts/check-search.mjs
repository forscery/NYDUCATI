import assert from 'node:assert/strict';
import fs from 'node:fs';
import {searchEntries,excerptAround} from '../src/lib/search.mjs';
const entries=JSON.parse(fs.readFileSync('dist/search-index.json','utf8'));
assert.equal(searchEntries(entries,'').length,0);
assert.equal(searchEntries(entries,'xyznonexistent987').length,0);
assert.ok(searchEntries(entries,'Bellagio').length>0);
assert.ok(searchEntries(entries,'BMW').some(x=>x.path.includes('iv-circumnavigating')));
assert.ok(searchEntries(entries,'thermal underwear').some(x=>x.path.includes('iii-lago')),'Search must match full body, not just titles/excerpts');
assert.equal(searchEntries([{title:'Café',text:'A lake',path:'/a'}],'cafe').length,1);
assert.equal(searchEntries(entries,'<script>alert(1)</script>').length,0);
assert.ok(excerptAround('A long story about Milan and its motorcycles.','Milan').includes('Milan'));
const config=JSON.parse(fs.readFileSync('site.config.json','utf8'));
for(const h of [config.home.hero,config.journey.hero,...config.articleHeroes])assert.ok(['white','black'].includes(h.titleColor));
for(const p of JSON.parse(fs.readFileSync('content.json','utf8'))){
 const html=fs.readFileSync('dist'+p.path,'utf8');assert.ok(html.includes('photo-hero title-white'));assert.ok(html.includes('role="search"'));assert.ok(html.includes(p.body));
}
assert.ok(fs.readFileSync('dist/index.html','utf8').includes('photo-hero title-white'));
console.log('PASS: full-text/multiword/accent/empty/no-result search; nine banner settings; original article bodies and header search preserved.');
