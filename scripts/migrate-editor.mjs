import fs from 'node:fs';
import TurndownService from 'turndown';
import { editorialHash } from '../src/lib/model.mjs';
const converter=new TurndownService({headingStyle:'atx',bulletListMarker:'-',codeBlockStyle:'fenced'});
// Blogger uses layout tables for image captions; preserve content, not table chrome.
converter.addRule('caption',{filter:node=>node.nodeName==='TD'&&node.className==='caption',replacement:content=>'\n\n'+content+'\n\n'});
for(const file of fs.readdirSync('content/posts').filter(f=>f.endsWith('.json'))){
 const path='content/posts/'+file,p=JSON.parse(fs.readFileSync(path));
 if(p.revisionBaseline)continue;
 fs.writeFileSync('migration/originals/'+file,JSON.stringify(p,null,2)+'\n');
 p.body=converter.turndown(p.body);p.format='markdown';p.kind=p.order<5?'post':'page';
 p.publishedAt='';p.publishedMonth=p.path.match(/^\/(\d{4}\/\d{2})\//)?.[1].replace('/','-')||'';
 p.tags=[];p.location={name:'',mapUrl:''};p.seo={title:'',description:'',socialImage:'',noindex:false};
 p.author='Tigh Loughhead';p.originalPath=p.path;p.aliases=[];p.showInFeed=true;p.style={width:'standard',imageLayout:'standard'};p.metadataPending=true;
 p.revisionBaseline=editorialHash(p);
 fs.writeFileSync(path,JSON.stringify(p,null,2)+'\n');
}
