export function isPublic(p,now=Date.now()){return !p.draft&&(!p.schedule?.enabled||(Number.isFinite(Date.parse(p.schedule.at))&&Date.parse(p.schedule.at)<=now));}
export function scheduleInstant(local,zone){
 if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(local))throw Error('Choose a complete date and time.');
 const formatter=new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
 const format=ms=>{const p=Object.fromEntries(formatter.formatToParts(ms).map(x=>[x.type,x.value]));return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;};
 const base=Date.parse(local+'Z'),matches=[];for(let offset=-14*60;offset<=14*60;offset+=15){const ms=base+offset*60000;if(format(ms)===local)matches.push(ms);}
 if(matches.length!==1)throw Error(matches.length?'This time occurs twice when clocks change. Choose a different time.':'This time does not exist in that timezone.');
 return new Date(matches[0]).toISOString();
}
export function automaticSlug(title,max=75){const slug=String(title||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/['’]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');if(slug.length<=max)return slug;const cut=slug.slice(0,max+1);return cut.includes('-')?cut.slice(0,cut.lastIndexOf('-')):slug.slice(0,max);}
export function excerptOf(p){if(p.excerpt?.trim())return p.excerpt;const body=String(p.body||'').split(/<hr\b[^>]*data-read-more[^>]*>|<!--\s*more\s*-->/i)[0];return body.replace(/<[^>]*>/g,' ').replace(/!\[[^\]]*\]\([^)]*\)/g,'').replace(/\[([^\]]+)\]\([^)]*\)/g,'$1').replace(/[#*_`>]/g,'').replace(/\s+/g,' ').trim().slice(0,220);}
export function resolvedStyle(style={},defaults={}){return {width:style.width&&style.width!=='inherit'?style.width:defaults.width||'standard',imageLayout:style.imageLayout&&style.imageLayout!=='inherit'?style.imageLayout:defaults.imageLayout||'standard'};}
