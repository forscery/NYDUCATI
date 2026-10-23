const prefix='nyducati-draft-v1:';let key=null,timer=null,offered=false,restoring=false,lastData=null,migratedKey=null;
const notice=document.createElement('aside');notice.className='ny-recovery';notice.hidden=true;document.body.append(notice);
function hide(){notice.hidden=true;notice.replaceChildren();}
function flush(){if(key&&lastData&&!restoring){try{localStorage.setItem(key,JSON.stringify({savedAt:new Date().toISOString(),data:lastData}));}catch{notice.hidden=false;notice.textContent='Local draft recovery could not save: browser storage is full or unavailable. Save to GitHub.';}}}
CMS.editor.onEditorChange(snapshot=>{
 if(!snapshot||!['posts','pages','journeys'].includes(snapshot.collection)){flush();key=null;lastData=null;hide();return;}
 const next=prefix+snapshot.collection+':'+(snapshot.slug||'new');
 if(next!==key){if(key?.endsWith(':new')&&next.split(':')[1]===key.split(':')[1])migratedKey=key;flush();clearTimeout(timer);key=next;lastData=null;offered=false;hide();let saved;try{saved=JSON.parse(localStorage.getItem(key));}catch{}
 if(saved?.data&&JSON.stringify(saved.data)!==JSON.stringify(snapshot.data)){offered=true;notice.hidden=false;notice.textContent='A local draft from '+new Date(saved.savedAt).toLocaleString()+' is available. ';for(const [label,action] of [['Restore',()=>{restoring=true;const result=CMS.editor.applyFieldPatch(Object.entries(saved.data).filter(([path])=>!['kind','originalPath','publishedMonth','format','order','revisionBaseline','metadataPending'].includes(path)).map(([path,value])=>({path,value})));restoring=false;if(result.rejected?.length){notice.textContent='Some fields could not be restored. The recovery copy is retained.';return;}offered=false;hide();}],['Discard',()=>{localStorage.removeItem(key);offered=false;hide();}]]){const b=document.createElement('button');b.textContent=label;b.onclick=action;notice.append(b);}}
 }
 if(offered||restoring)return;
 lastData=snapshot.data;clearTimeout(timer);timer=setTimeout(flush,700);
});
window.addEventListener('pagehide',flush);
CMS.registerEventListener({name:'postSave',handler:()=>{clearTimeout(timer);if(key)localStorage.removeItem(key);if(migratedKey)localStorage.removeItem(migratedKey);migratedKey=null;lastData=null;}});
