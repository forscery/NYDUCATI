// Runs the shipped browser decoder worker against a real HEIC, without opening the CMS.
// Usage: node scripts/check-heic-decode.mjs /path/to/example.heic /tmp/decoded.webp
import fs from 'node:fs';import vm from 'node:vm';import {resolveObjectURL} from 'node:buffer';import assert from 'node:assert/strict';import sharp from 'sharp';
const [source,output]=process.argv.slice(2);if(!source)throw Error('Supply a real HEIC path.');
class ImageData {constructor(width,height){this.width=width;this.height=height;this.data=new Uint8ClampedArray(width*height*4);}}
class Worker {
 constructor(url){this.listeners={};this.ready=resolveObjectURL(url).text().then(script=>{
  const context={console,setTimeout,clearTimeout,ImageData,WorkerGlobalScope:class {},location:{href:'https://example.test/worker.js'},postMessage:data=>{for(const listener of this.listeners.message||[])listener({data,currentTarget:this});}};
  context.self=context;this.context=vm.createContext(context);vm.runInContext(script,this.context);
 });}
 addEventListener(type,listener){(this.listeners[type]||=new Set()).add(listener);}
 removeEventListener(type,listener){this.listeners[type]?.delete(listener);}
 postMessage(data){this.ready.then(()=>{this.context.inputBytes=new Uint8Array(data.buffer);const buffer=vm.runInContext('Uint8Array.from(inputBytes).buffer',this.context);return this.context.onmessage({data:{...data,buffer}});}).catch(error=>{for(const listener of this.listeners.error||[])listener({data:error,currentTarget:this});});}
}
globalThis.Worker=Worker;globalThis.createImageBitmap=async data=>data;
const decoder=await import('heic-to');const input=new File([fs.readFileSync(source)],'sample.heic',{type:'image/heic'});
const image=await decoder.heicTo({blob:input,type:'bitmap'});assert.ok(image.width>0&&image.height>0);assert.equal(image.data.length,image.width*image.height*4);
const bytes=await sharp(Buffer.from(image.data),{raw:{width:image.width,height:image.height,channels:4}}).resize({width:2400,height:2400,fit:'inside',withoutEnlargement:true}).webp({quality:86}).toBuffer();
assert.equal((await sharp(bytes).metadata()).format,'webp');if(output)fs.writeFileSync(output,bytes);
console.log(JSON.stringify({decodedHEIC:true,width:image.width,height:image.height,inputBytes:input.size,webpBytes:bytes.length,note:'Real decoder tested; WebP encoding here uses Sharp, browser UI remains a separate check.'}));
