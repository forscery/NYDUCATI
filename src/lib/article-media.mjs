import {socialLink} from '../../public/admin/social.js';
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
export function enhanceArticle(html){
 // Only an explicit social figure or a paragraph containing just one URL/link.
 function card(url){const social=socialLink(url.replaceAll('&amp;','&'));if(!social)return null;return `<figure class="social-embed" data-embed="${esc(social.embed)}"><button type="button">Load ${social.provider} preview</button><p><a href="${esc(social.url)}" target="_blank" rel="noopener noreferrer">View on ${social.provider}</a></p></figure>`;}
 html=html.replace(/<figure\b[^>]*data-social="([^"]+)"[^>]*>[\s\S]*?<\/figure>/g,(all,url)=>card(url)||all);
 html=html.replace(/<p>\s*(?:<a href="([^"]+)"[^>]*>([^<]*)<\/a>|(https:\/\/[^<\s]+))\s*<\/p>/g,(all,href,text,url)=>{if(all.includes('data-plain='))return all;if(href&&text.replaceAll('&amp;','&')!==href.replaceAll('&amp;','&'))return all;return card(href||url)||all;});
 html=html.replace(/<img\b([^>]+)>/g,(all,attrs)=>{const full=attrs.match(/data-full="([^"]+)"/)?.[1];if(!full||!/^https:\/\//.test(full))return all;return `<a class="photo-expand" href="${full}" target="_blank" rel="noopener" aria-label="Open full-size photograph">${all}</a>`;});return html;
}
