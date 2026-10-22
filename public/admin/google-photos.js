// Tokens live only in memory for this selection; never in storage or post content.
export async function setupGooglePhotos({button,status,getToken,onFiles,isOpen,multiple,onBusy=()=>{}}){
 const scope='https://www.googleapis.com/auth/photospicker.mediaitems.readonly';
 async function request(action,google='',options={}){const r=await fetch('/api/google-photos/'+action,{signal:AbortSignal.timeout(45000),...options,headers:{Authorization:'Bearer '+await getToken(),...(google?{'X-Google-Token':google}:{})}});if(!r.ok){const e=await r.json();throw Error(e.error||'Google Photos request failed');}return r;}
 try{
 const config=await (await request('config')).json();
 if(!config.configured){button.disabled=false;button.onclick=()=>{status.textContent='Google Photos needs its one-time connection: enable Google Photos Picker API, create a Web OAuth client for this site, and set GOOGLE_PHOTOS_CLIENT_ID in Cloudflare. See GOOGLE-PHOTOS-SETUP.md in the repository.';};return;}
 if(!window.google?.accounts?.oauth2)await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='https://accounts.google.com/gsi/client';s.onload=resolve;s.onerror=()=>reject(Error('Google sign-in could not load. Check your connection or content blocker.'));document.head.append(s);});
 button.disabled=false;
 const start=()=>{
 button.disabled=true;onBusy(true);status.textContent='Connecting to Google Photos…';
 const client=google.accounts.oauth2.initTokenClient({client_id:config.clientId,scope,callback:async response=>{
 if(response.error||!response.access_token){status.textContent='Google Photos authorization was cancelled or denied.';button.disabled=false;onBusy(false);return;}
 let session,access=response.access_token;
 try{
 session=await (await request('sessions?multiple='+(multiple()?'1':'0'),access,{method:'POST'})).json();
 const picker=new URL(session.pickerUri);if(picker.protocol!=='https:'||picker.hostname!=='photos.google.com')throw Error('Unexpected Google picker address');
 if(!isOpen())throw Error('Photo selection cancelled.');
 const link=document.createElement('a');link.href=picker.href+'/autoclose';link.target='_blank';link.rel='noopener noreferrer';link.textContent='Open Google Photos to choose images';status.replaceChildren(link,document.createTextNode(' — select photos, then click Done in Google Photos.'));
 // Keep the primary action usable after consent, without re-authenticating.
 button.textContent='Open Google Photos';button.disabled=false;
 button.onclick=()=>{window.open(link.href,'_blank','noopener,noreferrer');};
 link.style.cssText='color:#b00000;text-decoration:underline;font-weight:700';
 status.scrollIntoView?.({block:'nearest'});
 // Explicit user click avoids popup blockers after asynchronous session creation.
 const duration=s=>Math.max(1000,(parseFloat(s)||5)*1000);let deadline=Date.now()+Math.min(duration(session.pollingConfig?.timeoutIn||'600s'),600000);
 while(!session.mediaItemsSet){if(!isOpen())throw Error('Photo selection cancelled.');if(Date.now()>deadline)throw Error('Google Photos selection timed out. Choose from Google Photos again.');await new Promise(r=>setTimeout(r,duration(session.pollingConfig?.pollInterval)));session=await (await request('sessions?session='+encodeURIComponent(session.id),access)).json();}
 button.disabled=true;button.textContent='Preparing selected photos…';
 const files=[];let pageToken='';do{const suffix='?session='+encodeURIComponent(session.id)+(pageToken?'&pageToken='+encodeURIComponent(pageToken):'');const page=await (await request('items'+suffix,access)).json();for(const item of page.mediaItems||[]){if(item.type!=='PHOTO')throw Error('This selection includes a video. Choose photos only; upload videos to YouTube.');if(!isOpen())throw Error('Photo selection cancelled.');status.textContent='Retrieving '+(item.mediaFile.filename||'photo')+'…';const r=await request('download'+suffix+'&id='+encodeURIComponent(item.id),access);files.push(new File([await r.blob()],item.mediaFile.filename||'google-photo.jpg',{type:item.mediaFile.mimeType||r.headers.get('Content-Type')}));}pageToken=page.nextPageToken||'';}while(pageToken);
 if(!files.length)throw Error('No photos selected.');if(!multiple()&&files.length>1)throw Error('Choose one photo for this field.');if(isOpen())await onFiles(files);
 }catch(e){if(isOpen())status.textContent=e.message;}
 finally{if(session?.id)await request('sessions?session='+encodeURIComponent(session.id),access,{method:'DELETE'}).catch(()=>{});access='';if(isOpen()){button.textContent='Choose from Google Photos';button.onclick=start;button.disabled=false;onBusy(false);}}
 },error_callback:()=>{status.textContent='Google sign-in was closed or blocked. Try again and allow its popup.';button.disabled=false;onBusy(false);}});
 try{client.requestAccessToken();}catch(e){status.textContent=e.message;button.disabled=false;onBusy(false);}
 };
 button.onclick=start;
 }catch(e){status.textContent=e.message;button.disabled=false;button.onclick=()=>setupGooglePhotos({button,status,getToken,onFiles,isOpen,multiple,onBusy});}
}
