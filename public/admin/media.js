(function(){
const API=location.origin+'/api/media';
let mediaContext=null;
function token(){try{return JSON.parse(localStorage.getItem('decap-cms-user')||'{}').token||'';}catch{return '';}}
async function api(url,options={}){const r=await fetch(url,{...options,headers:{...options.headers,Authorization:'Bearer '+((mediaContext&&(await mediaContext()).token)||token())}});const data=await r.json();if(!r.ok)throw new Error(data.error||'Media request failed.');return data;}
async function optimize(file){
 if(!['image/jpeg','image/png','image/webp'].includes(file.type))return file;
 const image=await createImageBitmap(file,{imageOrientation:'from-image'}),scale=Math.min(1,2400/Math.max(image.width,image.height));
 const canvas=document.createElement('canvas');canvas.width=Math.round(image.width*scale);canvas.height=Math.round(image.height*scale);canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);image.close();
 const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',0.86));
 if(!blob||blob.type!=='image/webp')throw new Error('This browser cannot create WebP. Turn off optimization or use a supported browser.');
 return new File([blob],file.name.replace(/\.[^.]+$/,'')+'.webp',{type:'image/webp'});
}
CMS.registerMediaLibrary({name:'nyducati-r2',init:({handleInsert,getMediaLibraryContext})=>{
 mediaContext=getMediaLibraryContext;
 const dialog=document.createElement('dialog');dialog.className='ny-media';
 dialog.innerHTML='<form method="dialog"><button class="ny-close" aria-label="Close media picker">Close ×</button></form><h2>NYDUCATI photos</h2><p>Upload a photograph or select one already hosted here.</p><label>Choose images <input type="file" multiple accept="image/jpeg,image/png,image/webp,image/avif,image/gif"></label><label><input class="ny-optimize" type="checkbox" checked> Prepare for web: WebP, maximum 2400 px, no upscaling</label><p class="ny-help">Originals stay on your computer. GIF and AVIF are uploaded unchanged. Maximum upload: 20 MB per file. Uploaded images are public even before the post is published.</p><p class="ny-status" role="status" aria-live="polite"></p><button class="ny-upload" type="button" disabled>Upload selected images</button><div class="ny-grid"></div><button class="ny-more" type="button" hidden>Load more</button>';
 document.body.append(dialog);const input=dialog.querySelector('input[type=file]'),status=dialog.querySelector('.ny-status'),upload=dialog.querySelector('.ny-upload'),grid=dialog.querySelector('.ny-grid'),more=dialog.querySelector('.ny-more');
 let multiple=false,prepared=[],cursor=null;
 const fmt=n=>(n/1e6).toFixed(2)+' MB';
 const pick=url=>{handleInsert(multiple?[url]:url);dialog.close();};
 function render(file){const button=document.createElement('button');button.type='button';const img=document.createElement('img');img.src=file.url;img.alt=file.name;img.loading='lazy';const name=document.createElement('span');name.textContent=file.name.replace(/-[a-f0-9]{64}(?=\.)/,'');button.append(img,name);button.onclick=()=>pick(file.url);grid.append(button);}
 async function load(reset){try{if(reset){grid.replaceChildren();cursor=null;}const data=await api(API+(cursor?'?cursor='+encodeURIComponent(cursor):''));data.files.forEach(render);cursor=data.cursor;more.hidden=!cursor;if(!grid.children.length)status.textContent='No uploaded photos yet.';}catch(e){status.textContent=e.message;}}
 async function prepare(){upload.disabled=true;prepared=[];if(!input.files.length)return;status.textContent='Preparing previews and estimating upload size…';try{for(const file of input.files){const result=dialog.querySelector('.ny-optimize').checked?await optimize(file):file;if(result.size>20*1024*1024)throw new Error(file.name+' exceeds 20 MB after preparation.');prepared.push(result);}const bytes=prepared.reduce((n,f)=>n+f.size,0);const usage=await api(API+'?stats=1');if(usage.partial)throw new Error('Bucket inventory exceeded the estimate limit. Review storage usage in Cloudflare before uploading.');const projectedGB=(usage.bytes+bytes)/1e9,monthly=Math.ceil(Math.max(0,projectedGB-10))*.015;
status.textContent=`${prepared.length} image(s), ${fmt(bytes)} to upload. Bucket currently holds ${fmt(usage.bytes)}. Projected full-month storage: $${monthly.toFixed(3)}, assuming the 10 GB free allowance is not used by other buckets. Duplicate uploads may make this an overestimate. ${prepared.length} write operation(s), plus ${usage.scannedPages} listing operation(s); request charges depend on account-wide monthly usage. R2 only; excludes Workers and tax.`;upload.disabled=false;}catch(e){status.textContent=e.message;}}
 input.onchange=prepare;dialog.querySelector('.ny-optimize').onchange=prepare;
 upload.onclick=async()=>{upload.disabled=true;input.disabled=true;const urls=[];try{for(const file of prepared){status.textContent='Uploading '+file.name+'…';const data=await api(API+'?name='+encodeURIComponent(file.name),{method:'POST',headers:{'Content-Type':file.type},body:file});urls.push(data.url);}handleInsert(multiple?urls:urls[0]);dialog.close();}catch(e){status.textContent=e.message+' Completed uploads remain available in the library; retrying the same files uses the same storage keys.';}finally{input.disabled=false;upload.disabled=false;}};
 more.onclick=()=>load(false);
 return {show:({allowMultiple=false}={})=>{multiple=allowMultiple;input.multiple=multiple;input.value='';prepared=[];upload.disabled=true;status.textContent='Loading media…';dialog.showModal();load(true);},hide:()=>dialog.close(),enableStandalone:()=>true};
}});
})();
