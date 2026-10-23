(function(){
const h=window.h;
window.NYDUCATI=window.NYDUCATI||{};
window.NYDUCATI.renderPublishingControls=function(props){
 const entry=CMS.editor.getCurrentEntry(),isArticle=entry&&['posts','pages','journeys'].includes(entry.collection);
 const busy=props.isPersisting||props.isPublishing;
 const persist=async draft=>{
  if(busy)return;
  if(isArticle&&typeof draft==='boolean'){
   const result=CMS.editor.applyFieldPatch([{path:'draft',value:draft}]);
   if(result.rejected.length){window.alert('Could not change publication state. Please reload the editor.');return;}
  }
  // Allow Decap's connected editor to receive the new draft flag before validating/saving.
  await new Promise(resolve=>setTimeout(resolve,0));
  props.onPersist();
 };
 const draft=entry?.data?.draft!==false;
 const path=entry?.data?.path;
 const revision=JSON.stringify(entry?.data||{});const checked=window.NYDUCATI.checkedRevision;const verified=checked?.path===path&&checked?.revision===revision;
 const href=typeof path==='string'&&/^\/(?!\/)/.test(path)?location.origin+path:null;
 return h('div',{className:'ny-publishing'},
  h('button',{type:'button',disabled:busy||!props.hasChanged&&!props.isNewEntry,onClick:()=>persist()},busy?'Saving…':'Save'),
  isArticle&&h('button',{type:'button',disabled:busy||(!draft&&!props.hasChanged&&!props.isNewEntry),onClick:()=>persist(false)},'Publish'),
  isArticle&&!draft&&h('button',{type:'button',disabled:busy,onClick:()=>persist(true)},'Revert to draft'),
  isArticle&&h('span',{className:'ny-publish-state'},props.hasChanged||props.isNewEntry?'Unsaved changes':draft?'Saved draft — not on website':entry.data.schedule?.enabled&&Date.parse(entry.data.schedule.at)>Date.now()?'Scheduled — '+new Date(entry.data.schedule.at).toLocaleString():verified?'Live ✓':'Saved — deployment not yet verified'),
  isArticle&&!props.isNewEntry&&!draft&&href&&h('a',{href:href+'?revision='+Date.now(),target:'_blank',rel:'noopener noreferrer'},'Open published URL ↗'),
  isArticle&&!props.isNewEntry&&!draft&&h('button',{type:'button',onClick:async e=>{const button=e.currentTarget;button.disabled=true;button.textContent='Checking deployed revision…';try{const current=CMS.editor.getCurrentEntry().data;const {publicationFingerprint}=await import('/admin/publication.js');const expected=await publicationFingerprint(current);const response=await fetch('/publication-status.json?t='+Date.now(),{cache:'no-store'});if(!response.ok)throw Error('Deployment status unavailable ('+response.status+')');const deployed=await response.json();const live=deployed[current.path]===expected;if(live){window.NYDUCATI.checkedRevision={path:current.path,revision:JSON.stringify(current)};if(JSON.stringify(CMS.editor.getCurrentEntry().data)===JSON.stringify(current))button.closest('.ny-publishing').querySelector('.ny-publish-state').textContent='Live ✓';}button.textContent=live?'This revision is live ✓':props.hasChanged?'Unsaved changes — save or publish first':'Saved — awaiting deployment (or deployment failed; check Cloudflare builds)';}catch(e){button.textContent='Verification failed — '+(e.message||'retry');}finally{button.disabled=false;}}},'Check deployed revision'),
  isArticle&&!props.isNewEntry&&!draft&&h('small',{},'Website changes appear after Cloudflare finishes rebuilding.')
 );
};
})();
