import fs from 'node:fs';
fs.cpSync('node_modules/decap-cms/dist','public/admin/vendor',{recursive:true,filter: p=>!p.endsWith('.map')});
fs.copyFileSync('node_modules/marked/lib/marked.umd.js','public/admin/vendor/marked.umd.js');

// This guarded adapter targets the pinned Decap 3.17.1 toolbar. Retain its
// native validation, preSave hooks, GitHub persistence and error reporting.
const vendor='public/admin/vendor/decap-cms.js';
let bundle=fs.readFileSync(vendor,'utf8');
const start='renderSimpleControls=()=>{',end=';renderDeployPreviewControls=';
if(bundle.split(start).length!==2)throw new Error('Decap toolbar changed; review the publishing adapter before upgrading.');
const a=bundle.indexOf(start),b=bundle.indexOf(end,a);
if(b<0)throw new Error('Decap toolbar boundary missing.');
bundle=bundle.slice(0,a)+'renderSimpleControls=()=>window.NYDUCATI.renderPublishingControls(this.props)'+bundle.slice(b);
fs.writeFileSync(vendor,bundle);
