export const validJourneyPath=p=>typeof p==='string'&&/^\/journeys\/[a-zA-Z0-9_-]+\/$/.test(p);
export function resolveChapters(journey,all){const seen=new Set();return (journey.entries||[]).flatMap(entry=>{
 const content=all.find(p=>p.path===entry.reference||p.aliases?.includes(entry.reference));
 if(!content)throw Error(`Journey "${journey.title}" references missing content: ${entry.reference}`);
 if(content.kind!==entry.type)throw Error(`Journey "${journey.title}": ${entry.reference} is not a ${entry.type}`);
 if(seen.has(content.path))throw Error(`Journey "${journey.title}" includes ${content.path} more than once`);seen.add(content.path);
 if(content.draft)return [];
 return [{...entry,path:content.path,title:entry.label||content.title,excerpt:entry.description||content.excerpt||'',image:entry.image||content.hero?.image||content.images?.[0]||'',content}];
});}
export function chapterNumber(index,style){if(style==='none')return '';if(style!=='roman')return String(index+1);let value=index+1,result='';for(const [n,s] of [[1000,'M'],[900,'CM'],[500,'D'],[400,'CD'],[100,'C'],[90,'XC'],[50,'L'],[40,'XL'],[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']])while(value>=n){result+=s;value-=n;}return result;}
