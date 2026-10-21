import fs from 'node:fs';
fs.cpSync('node_modules/decap-cms/dist','public/admin/vendor',{recursive:true,filter: p=>!p.endsWith('.map')});
fs.copyFileSync('node_modules/marked/lib/marked.umd.js','public/admin/vendor/marked.umd.js');
