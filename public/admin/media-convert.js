// Conversion stays on the author's computer; only the prepared image is uploaded.
export async function isHeicFile(file){
 if(/\.(heic|heif)$/i.test(file.name||'')||/^image\/hei[cf]/i.test(file.type||''))return true;
 const header=new Uint8Array(await file.slice(0,32).arrayBuffer());
 const brand=String.fromCharCode(...header.slice(8,12));
 return ['heic','heix','hevc','hevx','mif1','msf1'].includes(brand);
}
export async function prepareImage(file,{optimize=true,maxDimension=2400,quality=.78,targetBytes=450000,decodeBitmap=(...args)=>globalThis.createImageBitmap(...args),decodeHeic,makeCanvas=()=>document.createElement('canvas')}={}){
 const heic=await isHeicFile(file);
 const convertible=heic||['image/jpeg','image/png','image/webp'].includes(file.type)||/\.(jpe?g|png|webp)$/i.test(file.name||'');
 if(!convertible||(!optimize&&!heic))return {file,originalBytes:file.size,converted:false};
 if(file.size>50*1024*1024)throw new Error('This image exceeds the 50 MB input limit. Export a smaller still image first.');
 let image,canvas;
 try{
  try{image=await decodeBitmap(file,{imageOrientation:'from-image'});}catch(error){
   if(!heic)throw error;
   const decode=decodeHeic||((await import('/admin/vendor/heic-to.js')).heicTo);
   image=await decode({blob:file,type:'bitmap',options:{imageOrientation:'from-image'}});
  }
  const sourceWidth=image.width,sourceHeight=image.height;
  if(!sourceWidth||!sourceHeight)throw new Error('Image dimensions could not be read.');
  const scale=Math.min(1,maxDimension/Math.max(sourceWidth,sourceHeight));
  canvas=makeCanvas();canvas.width=Math.max(1,Math.round(sourceWidth*scale));canvas.height=Math.max(1,Math.round(sourceHeight*scale));
  const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Image conversion is not available in this browser.');
  ctx.drawImage(image,0,0,canvas.width,canvas.height);
  let blob;for(let q=quality;q>=.49;q-=.07){blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',q));if(!blob||blob.size<=targetBytes)break;}
  if(!blob||blob.type!=='image/webp')throw new Error('This browser cannot encode WebP. Please use an up-to-date Chrome, Edge or Safari.');
  const result=new File([blob],(file.name||'photo').replace(/\.[^.]+$/,'')+'.webp',{type:'image/webp'});
  return {file:result,originalBytes:file.size,converted:true,heic,sourceWidth,sourceHeight,width:canvas.width,height:canvas.height};
 }catch(error){throw new Error((heic?'HEIC conversion failed: ':'Image conversion failed: ')+(error?.message||String(error)));}
 finally{image?.close?.();if(canvas){canvas.width=1;canvas.height=1;}}
}

export async function prepareVariants(file,options={}){
 const full=await prepareImage(file,{...options,maxDimension:2200,quality:.78,targetBytes:450000});
 if(!full.converted)return {column:full,full,thumbnail:full,unchanged:true};
 const column=await prepareImage(full.file,{...options,maxDimension:960,quality:.76,targetBytes:150000});
 const thumbnail=await prepareImage(column.file,{...options,maxDimension:240,quality:.65,targetBytes:18000});
 return {column,full,thumbnail,unchanged:false};
}
