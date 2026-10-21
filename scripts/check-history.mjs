import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';import {editorialHash} from '../src/lib/model.mjs';
const root=fs.mkdtempSync(path.join(os.tmpdir(),'nyducati-history-')),script=path.resolve('scripts/prepare-history.mjs');
const run=(cmd,args,env={})=>execFileSync(cmd,args,{cwd:root,env:{...process.env,...env},stdio:'pipe'});
const commit=(message,date)=>{run('git',['add','.']);run('git',['-c','user.name=Test','-c','user.email=test@example.invalid','commit','-m',message],{GIT_AUTHOR_DATE:date,GIT_COMMITTER_DATE:date});};
try{
 fs.mkdirSync(root+'/content/posts',{recursive:true});run('git',['init']);const p={title:'Original',body:'Text',path:'/test/',kind:'post'};p.revisionBaseline=editorialHash(p);const file=root+'/content/posts/test.json';fs.writeFileSync(file,JSON.stringify(p));commit('Import','2020-01-01T12:00:00Z');run('node',[script]);assert.equal(JSON.parse(fs.readFileSync(root+'/src/generated/history.json'))['test.json'].updatedAt,null);
 p.body='Edited prose';fs.writeFileSync(file,JSON.stringify(p));commit('Edit article','2020-02-01T12:00:00Z');run('node',[script]);const updated=JSON.parse(fs.readFileSync(root+'/src/generated/history.json'))['test.json'].updatedAt;assert.equal(new Date(updated).toISOString(),'2020-02-01T12:00:00.000Z');
 fs.writeFileSync(root+'/unrelated.txt','Other change');commit('Unrelated deployment','2020-03-01T12:00:00Z');run('node',[script]);assert.equal(JSON.parse(fs.readFileSync(root+'/src/generated/history.json'))['test.json'].updatedAt,updated);
 console.log('PASS: migration date excluded; real article edit timestamp retained across unrelated deployments.');
}finally{fs.rmSync(root,{recursive:true,force:true});}
