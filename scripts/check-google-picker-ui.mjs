import assert from 'node:assert/strict';
import {setupGooglePhotos} from '../public/admin/google-photos.js';
let config,completePoll,opened='',received=[],busy=false,consents=0;
globalThis.window={google:{accounts:{oauth2:{initTokenClient:c=>{config=c;return{requestAccessToken(){consents++;}};}}}},open:url=>{opened=url;}};globalThis.google=window.google;
globalThis.document={createElement:()=>({style:{}}),createTextNode:text=>text};
const originalTimer=globalThis.setTimeout;globalThis.setTimeout=fn=>{queueMicrotask(fn);return 1;};
globalThis.fetch=async (url,opts={})=>{if(url.endsWith('config'))return Response.json({configured:true,clientId:'test'});if(opts.method==='DELETE')return Response.json({});if(opts.method==='POST')return Response.json({id:'s',pickerUri:'https://photos.google.com/picker/test',pollingConfig:{pollInterval:'1s',timeoutIn:'600s'}});if(url.includes('sessions?session='))return new Promise(r=>completePoll=()=>r(Response.json({id:'s',mediaItemsSet:true})));if(url.includes('items?'))return Response.json({mediaItems:[{id:'i',type:'PHOTO',mediaFile:{filename:'photo.jpg',mimeType:'image/jpeg'}}]});if(url.includes('download?'))return new Response('image');throw Error(url);};
const button={},status={replaceChildren(...children){this.children=children;},scrollIntoView(){}};
try{
 await setupGooglePhotos({button,status,getToken:async()=>'github',onFiles:async f=>received=f,isOpen:()=>true,multiple:()=>false,onBusy:b=>busy=b});
 button.onclick();assert.equal(consents,1);assert.equal(button.disabled,true);
 const completion=config.callback({access_token:'google'});
 for(let i=0;i<30&&!completePoll;i++)await new Promise(r=>originalTimer(r,0));
 assert.equal(button.textContent,'Open Google Photos');assert.equal(button.disabled,false);assert.equal(busy,true);
 button.onclick();assert.equal(opened,'https://photos.google.com/picker/test/autoclose');assert.equal(consents,1,'Opening picker must not restart consent');
 completePoll();await completion;assert.equal(received[0].name,'photo.jpg');assert.equal(button.disabled,false);assert.equal(busy,false);assert.equal(button.textContent,'Choose from Google Photos');
 console.log('PASS: consent → enabled primary picker button → selection → image preparation callback → controls restored; no repeated authorization.');
}finally{globalThis.setTimeout=originalTimer;}
