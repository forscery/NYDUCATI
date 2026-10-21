(function(){
const h=window.h;
CMS.registerPreviewStyle('/style.css');CMS.registerPreviewStyle('/admin/preview.css');
function mediaNotice(data){const issues=(data.mediaIssues||[]).filter(i=>i.status!=='resolved');return issues.length?h('aside',{style:{background:'#fff5db',padding:'16px',border:'1px solid #bd8100'}},h('strong',{},'Media needs attention — editor only'),...issues.map((i,n)=>h('div',{key:i.id||n,style:{marginTop:'12px'}},h('b',{},i.filename||'Original filename unknown'),h('p',{},i.date||'Date unknown'),h('p',{},i.reason||'Review this media'),h('code',{style:{overflowWrap:'anywhere'}},i.source||'Original reference unavailable')))):null;}
function Preview(props){const d=props.entry.get('data').toJS();const html=window.marked.parse(d.body||'');return h('div',{className:'editor-preview'},h('p',{className:'preview-note'},'Article preview · visual layout is approximate'),d.hero?.image?h('img',{className:'preview-hero',src:props.getAsset(d.hero.image).toString(),alt:''}):null,h('h1',{},d.title),h('p',{className:'preview-meta'},[d.publishedAt,d.author,...(d.tags||[])].filter(Boolean).join(' · ')),mediaNotice(d),h('article',{className:'prose'},props.widgetFor('body')),h('details',{},h('summary',{},'Generated HTML — read only'),h('p',{},'Edit the article with the visual / Markdown toggle. This shows its generated HTML.'),h('pre',{},h('code',{},html))));}
CMS.registerPreviewTemplate('posts',Preview);CMS.registerPreviewTemplate('pages',Preview);
// Use the current entry API shipped with our pinned Decap version.
const today=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');};
const slugify=value=>String(value||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/['’]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
function makePath(data,value=''){
 const input=String(value||'').trim();
 if(input.startsWith('/'))return input.endsWith('/')||input.endsWith('.html')?input:input+'/';
 const slug=slugify(input||data.title);
 if(!slug)return '';
 const date=/^\d{4}-\d{2}-\d{2}/.test(data.publishedAt||'')?data.publishedAt:today();
 return data.kind==='page'?'/p/'+slug+'.html':'/'+date.slice(0,4)+'/'+date.slice(5,7)+'/'+slug+'.html';
}
let lastEntry=null,lastAutomatic=null,updating=false;
CMS.editor.onEditorChange(snapshot=>{
 if(updating)return;
 if(!snapshot||!['posts','pages'].includes(snapshot.collection)){lastEntry=null;lastAutomatic=null;return;}
 const key=snapshot.collection+':'+(snapshot.slug||'new');
 if(key!==lastEntry){lastEntry=key;lastAutomatic=null;}
 const d=snapshot.data;
 // Once saved, keep the existing URL unless the author deliberately edits it.
 if(d.originalPath)return;
 if(d.path&&d.path!==lastAutomatic)return;
 const path=makePath(d);if(!path||path===d.path)return;
 lastAutomatic=path;updating=true;
 try{CMS.editor.applyFieldPatch([{path:'path',value:path}]);}finally{updating=false;}
});
CMS.registerEventListener({name:'preSave',handler:({entry})=>{
 let data=entry.get('data');if(!['post','page'].includes(data.get('kind'))&&!data.get('path'))return data;
 const d=data.toJS();
 if(Array.isArray(d.hero?.image))data=data.setIn(['hero','image'],d.hero.image[0]||'');
 if(Array.isArray(d.seo?.socialImage))data=data.setIn(['seo','socialImage'],d.seo.socialImage[0]||'');
 if(!d.publishedAt&&!d.metadataPending&&!d.originalPath)d.publishedAt=today();
 const path=makePath(d,d.path),old=d.originalPath;
 if(!path||!/^\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]+(?:\.html|\/)$/.test(path)||/^\/(admin|auth|api|media|tags|archives|posts|search)(\/|$)/.test(path))throw new Error('Use a title or slug such as two-wheel-tuesdays, or a local URL such as /2026/10/two-wheel-tuesdays.html.');
 let aliases=d.aliases||[];if(old&&old!==path)aliases=[...new Set([...aliases,old])].filter(a=>a!==path);
 data=data.set('path',path).set('aliases',aliases).set('originalPath',path);
 if(d.publishedAt)data=data.set('publishedAt',d.publishedAt);
 return data;
}});
// An explicit image component opens the same R2 picker as the banner field.
CMS.registerEditorComponent({
 id:'image',label:'Upload / insert image',
 fields:[{name:'image',label:'Photograph — upload or choose from R2',widget:'image',media_library:{name:'nyducati-r2',allow_multiple:false}},{name:'alt',label:'Image description (alt text)',widget:'string',required:false},{name:'title',label:'Optional image title',widget:'string',required:false}],
 pattern:/^!\[([^\]]*)\]\((.*?)(?:\s"([^"]*)")?\)$/,
 fromBlock:m=>({alt:m[1],image:m[2],title:m[3]||''}),
 toBlock:({image,alt,title})=>`![${String(alt||'').replace(/[\[\]\n]/g,' ')}](${image||''}${title?' "'+String(title).replace(/["\n]/g,' ' )+'"':''})`,
 toPreview:({image,alt})=>h('img',{src:image||'',alt:alt||'',style:{maxWidth:'100%'}})
});
const en=CMS.getLocale('en');if(en)CMS.registerLocale('en',{...en,editor:{...en.editor,editorWidgets:{...en.editor.editorWidgets,markdown:{...en.editor.editorWidgets.markdown,addComponent:'Insert image'}}}});
// Start this editor upgrade in visual mode; subsequent toggles remain the user's choice.
try{if(!localStorage.getItem('nyducati-visual-editor-v2')){localStorage.setItem('cms.md-mode','rich_text');localStorage.setItem('nyducati-visual-editor-v2','1');}}catch{}
// Give the writing form the full window initially. The eye button still opens preview.
try{if(!localStorage.getItem('nyducati-writing-layout-v1')){localStorage.setItem('cms.right-pane','none');localStorage.setItem('nyducati-writing-layout-v1','1');}}catch{}
CMS.init();
})();
