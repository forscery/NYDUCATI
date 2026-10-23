import {socialLink} from '../../public/admin/social.js';
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
export function enhanceArticle(html){
 // Only an explicit social figure or a paragraph containing just one URL/link.
 function card(url,ratio='auto'){const social=socialLink(url.replaceAll('&amp;','&'));if(!social)return null;
 if(social.provider==='YouTube')return `<figure class="social-embed youtube-embed ${(ratio==='portrait'||ratio==='auto'&&social.portrait)?'portrait':''}"><iframe src="${esc(social.embed)}" title="YouTube video" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allow="fullscreen; picture-in-picture; encrypted-media" allowfullscreen></iframe></figure>`;
 if(social.provider==='Instagram')return `<figure class="social-embed" data-provider="instagram"><blockquote class="instagram-media" data-instgrm-permalink="${esc(social.url)}" data-instgrm-version="14"><p>Instagram post</p></blockquote></figure>`;
 const video=/plugins\/video/.test(social.embed);return `<figure class="social-embed" data-provider="facebook"><div class="${video?'fb-video':'fb-post'}" data-href="${esc(social.url)}" data-show-text="true" data-width="auto"></div></figure>`;
 }
 html=html.replace(/<figure\b[^>]*data-social="([^"]+)"[^>]*>[\s\S]*?<\/figure>/g,(all,url)=>card(url,all.match(/data-ratio="([^"]+)"/)?.[1]||'auto')||all);
 html=html.replace(/<p>\s*(?:<a href="([^"]+)"[^>]*>([^<]*)<\/a>|(https:\/\/[^<\s]+))\s*<\/p>/g,(all,href,text,url)=>{if(all.includes('data-plain='))return all;if(href&&text.replaceAll('&amp;','&')!==href.replaceAll('&amp;','&'))return all;return card(href||url)||all;});
 html=html.replace(/<img\b([^>]+)>/g,(all,attrs)=>{const full=attrs.match(/data-full="([^"]+)"/)?.[1];if(!full||!/^https:\/\//.test(full))return all;return `<a class="photo-expand" href="${full}" target="_blank" rel="noopener" aria-label="Open full-size photograph">${all}</a>`;});return html;
}
