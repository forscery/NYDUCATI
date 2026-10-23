import fs from 'node:fs';import {isPublic} from '../public/admin/content-rules.js';
const file='content/scheduled-releases.json';const prior=JSON.parse(fs.readFileSync(file,'utf8'));const next={...prior};for(const dir of ['content/posts','content/journeys'])for(const name of fs.readdirSync(dir).filter(n=>n.endsWith('.json'))){const p=JSON.parse(fs.readFileSync(dir+'/'+name));if(p.schedule?.enabled&&isPublic(p))next[dir+'/'+name]=p.schedule.at;}
if(JSON.stringify(prior)!==JSON.stringify(next))fs.writeFileSync(file,JSON.stringify(next,null,2)+'\n');
