(function(){
const API=location.origin+'/api/media';
let mediaContext=null;
function token(){try{return JSON.parse(localStorage.getItem('decap-cms-user')||'{}').token||'';}catch{return '';}}
async function api(url,options={}){const r=await fetch(url,{...options,headers:{...options.headers,Authorization:'Bearer '+((mediaContext&&(await mediaContext()).token)||token())}});const data=await r.json();if(!r.ok)throw new Error(data.error||'Media request failed.');return data;}
CMS.registerMediaLibrary({name:'nyducati-r2',init:({handleInsert,getMediaLibraryContext})=>{
 mediaContext=getMediaLibraryContext;
 const dialog=document.createElement('dialog');dialog.className='ny-media';
 dialog.innerHTML='<form method="dialog"><button class="ny-close" aria-label="Close media picker">Close ×</button></form><h2>NYDUCATI photos</h2><p>Upload a photograph or select one already hosted here.</p><button class="ny-google" type="button" disabled>Choose from Google Photos</button><label>Choose images <input type="file" multiple accept="image/jpeg,image/png,image/webp,image/avif,image/gif,image/heic,image/heif,.heic,.heif"></label><label><input class="ny-optimize" type="checkbox" checked> Prepare for web: WebP, maximum 2400 px, no upscaling</label><p class="ny-help">HEIC/HEIF always converts to WebP. Originals stay on your computer. GIF and AVIF are uploaded unchanged. HEIC is imported as a still photo, not its Live Photo video. Maximum input for conversion: 50 MB; upload: 20 MB per file. Uploaded images are public even before the post is published.</p><p class="ny-status" role="status" aria-live="polite"></p><button class="ny-upload" type="button" disabled>Upload selected images</button><div class="ny-prepared" aria-label="Prepared image previews"></div><div class="ny-grid"></div><button class="ny-more" type="button" hidden>Load more</button>';
 document.body.append(dialog);const input=dialog.querySelector('input[type=file]'),status=dialog.querySelector('.ny-status'),upload=dialog.querySelector('.ny-upload'),grid=dialog.querySelector('.ny-grid'),more=dialog.querySelector('.ny-more');
 let selectedFiles=[],multiple=false,prepared=[],cursor=null,generation=0,pickerEpoch=0;const previewUrls=[];
 const previews=dialog.querySelector(".ny-prepared");
 function clearPreviews(){for(const url of previewUrls)URL.revokeObjectURL(url);previewUrls.length=0;previews.replaceChildren();}
 dialog.addEventListener("close",()=>{generation++;pickerEpoch++;prepared=[];clearPreviews();});
 const fmt=n=>(n/1e6).toFixed(2)+' MB';
 const pick=url=>{handleInsert(multiple?[url]:url);dialog.close();};
 function render(file){const button=document.createElement('button');button.type='button';const img=document.createElement('img');img.src=file.url;img.alt=file.name;img.loading='lazy';const name=document.createElement('span');name.textContent=file.name.replace(/-[a-f0-9]{64}(?=\.)/,'');button.append(img,name);button.onclick=()=>pick(file.url);grid.append(button);}
 async function load(reset){try{if(reset){grid.replaceChildren();cursor=null;}const data=await api(API+(cursor?'?cursor='+encodeURIComponent(cursor):''));data.files.forEach(render);cursor=data.cursor;more.hidden=!cursor;if(!grid.children.length)status.textContent='No uploaded photos yet.';}catch(e){status.textContent=e.message;}}
 async function prepare(){
  const run=++generation;upload.disabled=true;prepared=[];clearPreviews();if(!selectedFiles.length)return;
  input.disabled=true;const checkbox=dialog.querySelector('.ny-optimize');checkbox.disabled=true;
  status.textContent='Preparing images on your computer…';
  try{
   const {prepareImage}=await import('/admin/media-convert.js?v=1');
   for(const file of selectedFiles){
    status.textContent='Preparing '+file.name+'…';
    const result=await prepareImage(file,{optimize:checkbox.checked});
    if(run!==generation)return;
    if(result.file.size>20*1024*1024)throw new Error(file.name+' exceeds 20 MB after preparation.');
    prepared.push(result.file);
    const figure=document.createElement('figure'),img=document.createElement('img'),caption=document.createElement('figcaption');
    const preview=URL.createObjectURL(result.file);previewUrls.push(preview);img.src=preview;img.alt='Prepared '+file.name;
    const change=result.file.size>file.size?' (larger than original)':'';
    caption.textContent=file.name+': '+fmt(file.size)+' → '+fmt(result.file.size)+change+(result.width?' · '+result.width+' × '+result.height:' · unchanged');
    figure.append(img,caption);previews.append(figure);
   }
   const bytes=prepared.reduce((n,f)=>n+f.size,0);const usage=await api(API+'?stats=1');if(run!==generation)return;
   if(usage.partial)throw new Error('Bucket inventory exceeded the estimate limit. Review storage usage in Cloudflare before uploading.');
   const projectedGB=(usage.bytes+bytes)/1e9,monthly=Math.ceil(Math.max(0,projectedGB-10))*.015;
   status.textContent=`${prepared.length} image(s), ${fmt(bytes)} to upload. Bucket currently holds ${fmt(usage.bytes)}. Projected full-month storage: $${monthly.toFixed(3)}, assuming the 10 GB free allowance is not used by other buckets. Duplicate uploads may make this an overestimate. ${prepared.length} write operation(s), plus ${usage.scannedPages} listing operation(s); request charges depend on account-wide monthly usage. R2 only; excludes Workers and tax.`;
   upload.disabled=false;
  }catch(e){if(run===generation){prepared=[];status.textContent=e.message;}}
  finally{input.disabled=false;checkbox.disabled=false;}
 }
 input.onchange=()=>{selectedFiles=[...input.files];prepare();};dialog.querySelector('.ny-optimize').onchange=prepare;
 upload.onclick=async()=>{upload.disabled=true;input.disabled=true;const urls=[];try{for(const file of prepared){status.textContent='Uploading '+file.name+'…';const data=await api(API+'?name='+encodeURIComponent(file.name),{method:'POST',headers:{'Content-Type':file.type},body:file});urls.push(data.url);}handleInsert(multiple?urls:urls[0]);dialog.close();}catch(e){status.textContent=e.message+' Completed uploads remain available in the library; retrying the same files uses the same storage keys.';}finally{input.disabled=false;upload.disabled=false;}};
 more.onclick=()=>load(false);
 return {show:({allowMultiple=false}={})=>{generation++;clearPreviews();multiple=allowMultiple;input.multiple=multiple;input.value='';selectedFiles=[];prepared=[];upload.disabled=true;status.textContent='Loading media…';dialog.showModal();load(true);const epoch=++pickerEpoch;import('/admin/google-photos.js?v=1').then(({setupGooglePhotos})=>setupGooglePhotos({button:dialog.querySelector('.ny-google'),status,getToken:async()=>((mediaContext&&(await mediaContext()).token)||token()),onFiles:async files=>{selectedFiles=files;input.value='';await prepare();},isOpen:()=>dialog.open&&epoch===pickerEpoch,multiple:()=>multiple,onBusy:busy=>{if(epoch!==pickerEpoch)return;input.disabled=busy;upload.disabled=busy||!prepared.length;dialog.querySelector('.ny-optimize').disabled=busy;}})).catch(e=>{status.textContent=e.message;});},hide:()=>dialog.close(),enableStandalone:()=>true};
}});
})();
