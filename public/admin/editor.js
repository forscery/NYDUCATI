(function(){
const h=window.h;
CMS.registerPreviewStyle('/style.css');CMS.registerPreviewStyle('/admin/preview.css');
function Preview(props){const d=props.entry.get('data').toJS();const html=window.marked.parse(d.body||'');return h('div',{className:'editor-preview'},h('p',{className:'preview-note'},'Article preview · visual layout is approximate'),d.hero?.image?h('img',{className:'preview-hero',src:props.getAsset(d.hero.image).toString(),alt:''}):null,h('h1',{},d.title),h('p',{className:'preview-meta'},[d.publishedAt,d.author,...(d.tags||[])].filter(Boolean).join(' · ')),h('article',{className:'prose'},props.widgetFor('body')),h('details',{},h('summary',{},'Generated HTML — read only'),h('p',{},'Edit the article with the visual / Markdown toggle. This shows its generated HTML.'),h('pre',{},h('code',{},html))));}
CMS.registerPreviewTemplate('posts',Preview);CMS.registerPreviewTemplate('pages',Preview);
CMS.registerEventListener({name:'preSave',handler:({entry})=>{let data=entry.get('data');if(!data.get('path'))return data;const path=data.get('path'),old=data.get('originalPath');let aliases=data.get('aliases');aliases=aliases?.toJS?aliases.toJS():aliases||[];if(old&&old!==path)aliases=[...new Set([...aliases,old])].filter(a=>a!==path);data=data.set('aliases',aliases).set('originalPath',path);return data;}});
CMS.init();
})();
