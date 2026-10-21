// Node adapter for the same shipped HEIC decoder used by the browser uploader.
import vm from 'node:vm';import {resolveObjectURL} from 'node:buffer';
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

export async function decodeHeic(bytes){
 globalThis.Worker=Worker;globalThis.createImageBitmap=async data=>data;
 const decoder=await import('heic-to');return decoder.heicTo({blob:new Blob([bytes],{type:'image/heic'}),type:'bitmap'});
}
