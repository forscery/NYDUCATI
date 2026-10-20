import fs from 'node:fs';
import path from 'node:path';
const posts=fs.readdirSync('content/posts').filter(f=>f.endsWith('.json')).map(f=>JSON.parse(fs.readFileSync('content/posts/'+f,'utf8'))).filter(p=>!p.draft);
for(const p of posts){
 if(!p.path.endsWith(".html")) continue;
 const target=path.join('dist',p.path);const child=path.join(target,'index.html');
 if(fs.existsSync(child)){
  const page=fs.readFileSync(child);fs.unlinkSync(child);fs.rmdirSync(target);fs.writeFileSync(target,page);
 }
}
