export const normalize = value => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
export function searchEntries(entries, query){
 const tokens=normalize(query).trim().split(/\s+/).filter(Boolean).slice(0,20);
 if(!tokens.length)return [];
 return entries.map(entry=>{
  const title=normalize(entry.title),text=normalize(entry.text),all=title+' '+text;
  if(!tokens.every(t=>all.includes(t)))return null;
  const score=tokens.reduce((sum,t)=>sum+(title.includes(t)?10:1),0);
  return {...entry,score};
 }).filter(Boolean).sort((a,b)=>b.score-a.score);
}
export function excerptAround(text,query){
 const token=normalize(query).trim().split(/\s+/).find(t=>normalize(text).includes(t));
 const index=token?normalize(text).indexOf(token):0;
 const start=Math.max(0,index-65),end=Math.min(text.length,start+230);
 return (start?'…':'')+text.slice(start,end)+(end<text.length?'…':'');
}
