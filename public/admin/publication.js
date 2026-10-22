export async function publicationFingerprint(data){
 const fields=['title','body','path','publishedAt','tags','hero','seo','style','location','videos','showInFeed','author','aliases','kind'];
 const sort=v=>Array.isArray(v)?v.map(sort):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,sort(v[k])])):v;
 const text=JSON.stringify(fields.map(k=>sort(data[k]??null)));
 const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));return Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');
}
