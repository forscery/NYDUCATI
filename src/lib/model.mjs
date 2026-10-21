import { createHash } from 'node:crypto';
export const validPath = p => typeof p === 'string' && /^\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]+(?:\.html|\/)$/.test(p) && !/^\/(?:admin|auth|media|api|tags|archives|posts|search)(?:\/|$)/.test(p);
export const tagSlug = tag => (tag.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,70)||'label')+'-'+createHash('sha256').update(tag).digest('hex').slice(0,8);
export const tagPath = tag => '/tags/'+tagSlug(tag)+'/';
export const monthOf = p => (p.publishedAt || '').slice(0,7) || p.publishedMonth || '';
export const dateLabel = value => value ? new Intl.DateTimeFormat('en-US',{year:'numeric',month:'long',...(value.length>7?{day:'numeric'}:{}),timeZone:'UTC'}).format(new Date(value.length===7?value+'-01T12:00:00Z':value.length===10?value+'T12:00:00Z':value)) : '';
export const listed = p => !p.draft && p.showInFeed !== false && p.kind === 'post';
export const newest = (a,b) => (b.publishedAt || b.publishedMonth || '').localeCompare(a.publishedAt || a.publishedMonth || '') || (b.order??100)-(a.order??100) || a.title.localeCompare(b.title);
export const escapeXML = s => String(s??'').replace(/[<>&"']/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[c]));
export function editorialHash(post) {
 const {revisionBaseline, originalPath, format, order, metadataPending, ...fields}=post;
 function stable(v){return Array.isArray(v)?v.map(stable):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,stable(v[k])])):v;}
 return createHash('sha256').update(JSON.stringify(stable(fields))).digest('hex');
}
