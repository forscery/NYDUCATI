import {handleGooglePhotos} from './google-photos.mjs';
import {handleMedia} from './media.mjs';
const ORIGIN = 'https://nyducati.hidden-silence-47e4.workers.dev';
const cookieName = '__Host-nyducati-oauth';
const cookie = value => `${cookieName}=${value}; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=${value ? 600 : 0}`;
const b64 = bytes => btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const random = () => b64(crypto.getRandomValues(new Uint8Array(32)));
const headers = {'Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'};
function failure(message, status=400) { return new Response(message,{status,headers:{...headers,'Set-Cookie':cookie('')}}); }
export async function handleAuth(request, env, fetcher=fetch) {
  const url = new URL(request.url);
  if (url.origin !== ORIGIN || request.method !== 'GET') return failure('Unsupported authentication request.');
  if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) return failure('CMS login setup is incomplete: configure GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in Cloudflare.',503);
  if (url.pathname === '/auth') {
    if (url.searchParams.get('provider') !== 'github') return failure('Unsupported login provider.');
    const state=random(), verifier=random();
    const challenge=b64(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(verifier))));
    const target=new URL('https://github.com/login/oauth/authorize');
    for(const [key,value] of Object.entries({client_id:env.GITHUB_CLIENT_ID,redirect_uri:ORIGIN+'/auth/callback',scope:'repo',state,code_challenge:challenge,code_challenge_method:'S256'})) target.searchParams.set(key,value);
    const session=encodeURIComponent(JSON.stringify({state,verifier,expires:Date.now()+600000}));
    return new Response(null,{status:302,headers:{...headers,Location:target.href,'Set-Cookie':cookie(session)}});
  }
  if (url.pathname !== '/auth/callback') return failure('Not found',404);
  let session;
  try { session=JSON.parse(decodeURIComponent((request.headers.get('Cookie')||'').split(';').map(s=>s.trim()).find(s=>s.startsWith(cookieName+'='))?.slice(cookieName.length+1)||'')); } catch { return failure('Login session expired. Close this window and try again.'); }
  const state=url.searchParams.get('state'),code=url.searchParams.get('code');
  if (!state || state!==session.state || !code || session.expires<Date.now() || !/^[\w-]{43}$/.test(session.verifier||'')) return failure('Invalid or expired login session. Close this window and try again.');
  try {
    const exchange=await fetcher('https://github.com/login/oauth/access_token',{method:'POST',headers:{Accept:'application/json','Content-Type':'application/json'},body:JSON.stringify({client_id:env.GITHUB_CLIENT_ID,client_secret:env.GITHUB_CLIENT_SECRET,code,redirect_uri:ORIGIN+'/auth/callback',code_verifier:session.verifier})});
    const result=await exchange.json();
    if (!exchange.ok || !result.access_token) return failure('GitHub did not authorize login. Please try again.',401);
    const permission=await fetcher('https://api.github.com/repos/forscery/NYDUCATI',{headers:{Authorization:`Bearer ${result.access_token}`,Accept:'application/vnd.github+json','User-Agent':'NYDUCATI-CMS'}});
    if (!permission.ok || !(await permission.json()).permissions?.push) return failure('This GitHub account does not have write access to NYDUCATI.',403);
    const message=JSON.stringify('authorization:github:success:'+JSON.stringify({token:result.access_token,provider:'github'})).replace(/</g,'\\u003c');
    const nonce=random();
    const html=`<!doctype html><meta charset="utf-8"><title>NYDUCATI login</title><p>Completing sign-in. This window will close automatically.</p><script nonce="${nonce}">const origin=${JSON.stringify(ORIGIN)};window.addEventListener('message',function receive(event){if(event.origin!==origin||event.source!==window.opener||event.data!=='authorizing:github')return;window.removeEventListener('message',receive);window.opener.postMessage(${message},origin);window.close();});if(window.opener)window.opener.postMessage('authorizing:github',origin);</script>`;
    return new Response(html,{headers:{...headers,'Content-Type':'text/html; charset=utf-8','Set-Cookie':cookie(''),'Content-Security-Policy':`default-src 'none'; script-src 'nonce-${nonce}'; base-uri 'none'; frame-ancestors 'none'`}});
  } catch { return failure('GitHub sign-in is temporarily unavailable. Please try again.',502); }
}
export default {async fetch(request,env){const path=new URL(request.url).pathname;if(path.startsWith('/api/google-photos/'))return handleGooglePhotos(request,env);if(path==='/api/media'||path.startsWith('/media/'))return handleMedia(request,env);return path==='/auth'||path.startsWith('/auth/')?handleAuth(request,env):env.ASSETS.fetch(request);}};
