import fs from 'node:fs';import {execFileSync} from 'node:child_process';import {editorialHash} from '../src/lib/model.mjs';
const history={};
const git=(args)=>execFileSync('git',args,{encoding:'utf8',stdio:['ignore','pipe','pipe'],maxBuffer:10000000}).trim();
let available=true;
try{if(git(['rev-parse','--is-shallow-repository'])==='true')git(['fetch','--unshallow','origin']);}catch{available=false;}
for(const file of fs.readdirSync('content/posts').filter(f=>f.endsWith('.json'))){
 const path='content/posts/'+file,p=JSON.parse(fs.readFileSync(path)),hash=editorialHash(p);
 const record={url:'https://github.com/forscery/NYDUCATI/commits/main/'+path,updatedAt:null};
 // A baseline means import/format conversion, not an editorial update.
 if(available && hash!==p.revisionBaseline){
  try{const lines=git(['log','--format=%H %cI','--',path]).split('\n');let oldestSame=null;
   for(const line of lines){const [sha,date]=line.split(' ');if(!sha)continue;const old=JSON.parse(git(['show',sha+':'+path]));if(editorialHash(old)!==hash)break;oldestSame=date;}
   // One initial commit for a brand-new post is publication, not an update.
   if(oldestSame && (p.revisionBaseline||lines.length>1))record.updatedAt=oldestSame;
  }catch{ /* Never invent an update date when history isn't available. */ }
 }
 history[file]=record;
}
fs.mkdirSync('src/generated',{recursive:true});fs.writeFileSync('src/generated/history.json',JSON.stringify(history));
