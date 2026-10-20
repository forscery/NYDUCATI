import fs from 'node:fs';
fs.cpSync('node_modules/decap-cms/dist','public/admin/vendor',{recursive:true,filter: p=>!p.endsWith('.map')});
