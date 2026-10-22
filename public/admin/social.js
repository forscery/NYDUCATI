// Shared, strict provider parsing. Never accept arbitrary iframe URLs.
export function socialLink(value){
 let u;try{u=new URL(value.trim());}catch{return null;}if(u.protocol!=='https:'||u.username||u.password)return null;
 const host=u.hostname.replace(/^www\./,'');let match;
 if(host==='instagram.com'&&(match=u.pathname.match(/^\/(p|reel)\/([\w-]+)\/?$/))){const url=`https://www.instagram.com/${match[1]}/${match[2]}/`;return {provider:'Instagram',url,embed:url+'embed/'};}
 if(host==='facebook.com'||host==='m.facebook.com'){
  if(!(/^\/[\w.-]+\/posts\/[\w.-]+\/?$/.test(u.pathname)||/^\/[\w.-]+\/videos\/\d+\/?$/.test(u.pathname)||/^\/reel\/\d+\/?$/.test(u.pathname)||u.pathname==='/permalink.php'&&u.searchParams.has('story_fbid')&&u.searchParams.has('id')||u.pathname==='/watch/'&&u.searchParams.has('v')))return null;
  u.hostname='www.facebook.com';u.hash='';const video=/\/videos\/|^\/reel\/|^\/watch\//.test(u.pathname);return {provider:'Facebook',url:u.href,embed:'https://www.facebook.com/plugins/'+(video?'video':'post')+'.php?href='+encodeURIComponent(u.href)+'&width=500'};
 }return null;
}
