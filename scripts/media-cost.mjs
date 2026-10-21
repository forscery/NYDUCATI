import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {pathToFileURL} from 'node:url';
export function estimate({bytes,existingGB=0,writes=0,reads=0,otherWrites=0,otherReads=0}){
 const storageGB=existingGB+bytes/1e9;
 return {pricingChecked:'2026-10-20',storageGB,storageUSD:Math.ceil(Math.max(0,storageGB-10))*.015,writeUSD:Math.ceil(Math.max(0,writes+otherWrites-1e6)/1e6)*4.5,readUSD:Math.ceil(Math.max(0,reads+otherReads-1e7)/1e6)*.36,egressUSD:0};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const args=process.argv.slice(2),dir=args[0];if(!dir){console.error('Usage: node scripts/media-cost.mjs DIRECTORY [--existing-gb 0] [--other-writes 0] [--other-reads 0]');process.exit(1);}
 const number=name=>{const i=args.indexOf(name);const v=i<0?0:Number(args[i+1]);if(!Number.isFinite(v)||v<0)throw new Error('Invalid '+name);return v;};
 const files=[];function walk(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory())walk(p);else if(e.isFile())files.push(p);}}walk(dir);
 const hashes=new Set();let bytes=0,duplicates=0;for(const f of files){const data=fs.readFileSync(f),hash=crypto.createHash('sha256').update(data).digest('hex');if(hashes.has(hash)){duplicates++;continue;}hashes.add(hash);bytes+=data.length;}
 const writes=hashes.size+Math.ceil(hashes.size/1000),reads=hashes.size;
 const result=estimate({bytes,existingGB:number('--existing-gb'),writes,reads,otherWrites:number('--other-writes'),otherReads:number('--other-reads')});
 console.log(JSON.stringify({...result,totalR2USD:result.storageUSD+result.writeUSD+result.readUSD,files:files.length,uniqueFiles:hashes.size,duplicates,bytes,estimatedWriteOperations:writes,estimatedVerificationReads:reads,assumptions:['Standard storage retained for a full month; decimal GB; billing units rounded up.','Assumes exact duplicate files are uploaded only once and existing account usage is supplied accurately.','Request estimate assumes one upload per unique file, one verification read, and paginated listings; retries and multipart uploads add operations.','Does not include Workers, image-transformation services, original downloads, taxes, or AI/development costs.','No upload was performed. Rate reference: https://developers.cloudflare.com/r2/pricing/']},null,2));
}
