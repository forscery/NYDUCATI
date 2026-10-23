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
 const href=typeof path==='string'&&/^\/(?!\/)/.test(path)?location.origin+path:null;
 return h('div',{className:'ny-publishing'},
  h('button',{type:'button',disabled:busy||!props.hasChanged&&!props.isNewEntry,onClick:()=>persist()},busy?'Saving…':'Save'),
  isArticle&&h('button',{type:'button',disabled:busy||(!draft&&!props.hasChanged&&!props.isNewEntry),onClick:()=>persist(false)},'Publish'),
  isArticle&&!draft&&h('button',{type:'button',disabled:busy,onClick:()=>persist(true)},'Revert to draft'),
  isArticle&&h('span',{className:'ny-publish-state'},draft?'Draft — not on website':'Publication enabled — deployment not yet verified'),
  isArticle&&!props.isNewEntry&&!draft&&href&&h('a',{href:href+'?revision='+Date.now(),target:'_blank',rel:'noopener noreferrer'},'Open published URL ↗'),
  isArticle&&!props.isNewEntry&&!draft&&h('button',{type:'button',onClick:async e=>{const button=e.currentTarget;button.disabled=true;button.textContent='Checking deployed revision…';try{const current=CMS.editor.getCurrentEntry().data;const {publicationFingerprint}=await import('/admin/publication.js');const expected=await publicationFingerprint(current);const response=await fetch('/publication-status.json?t='+Date.now(),{cache:'no-store'});if(!response.ok)throw Error();const deployed=await response.json();button.textContent=deployed[current.path]===expected?'This revision is live ✓':'This revision is not live yet — save and check deployment';}catch{button.textContent='Could not verify deployment — retry';}finally{button.disabled=false;}}},'Check deployed revision'),
  isArticle&&!props.isNewEntry&&!draft&&h('small',{},'Website changes appear after Cloudflare finishes rebuilding.')
 );
};
})();
