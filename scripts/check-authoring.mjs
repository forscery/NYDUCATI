import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import {fromJS} from 'immutable';import * as yaml from 'js-yaml';
const h=(tag,props,...children)=>({tag,props:props||{},children:children.flat()});
let widget;vm.runInNewContext(fs.readFileSync('public/admin/tags.js','utf8'),{window:{h,createClass:x=>x},CMS:{registerWidget:x=>{widget=x;}}});
let saved;const control={...widget.controlComponent,props:{value:fromJS(['Ducati','New York']),onChange:x=>{saved=x;}},setState(next){Object.assign(this.state,next);}};control.state=control.getInitialState();assert.equal(control.state.text,'Ducati, New York');
control.render().props.onChange({target:{value:' bike night, two wheel tuesdays\nDucati, bike night, '}});assert.deepEqual(Array.from(saved),['bike night','two wheel tuesdays','Ducati']);
control.render().props.onChange({target:{value:''}});assert.equal(saved.length,0);
let entry={collection:'posts',data:{draft:true,path:'/2026/10/test.html'}},persisted=0,patches=[];const window={h};const CMS={editor:{getCurrentEntry:()=>entry,applyFieldPatch:p=>{patches.push(...p);return {rejected:[]};}}};
vm.runInNewContext(fs.readFileSync('public/admin/publishing.js','utf8'),{window,CMS,location:{origin:'https://preview.test'},setTimeout});
const props={hasChanged:true,isNewEntry:true,onPersist:()=>{persisted++;}};
let ui=window.NYDUCATI.renderPublishingControls(props);const button=(ui,label)=>ui.children.find(n=>n?.tag==='button'&&n.children[0]===label);
await button(ui,'Save').props.onClick();assert.equal(persisted,1);assert.equal(patches.length,0);
await button(ui,'Publish').props.onClick();assert.equal(persisted,2);assert.equal(patches.at(-1).value,false);
entry.data.draft=false;ui=window.NYDUCATI.renderPublishingControls({...props,isNewEntry:false});assert.equal(ui.children.find(n=>n?.tag==='a').props.href.split('?')[0],'https://preview.test/2026/10/test.html');
await button(ui,'Revert to draft').props.onClick();assert.equal(patches.at(-1).value,true);assert.equal(persisted,3);
const config=yaml.load(fs.readFileSync('public/admin/config.yml','utf8'));assert.equal(config.publish_mode,undefined);for(const c of config.collections.slice(0,2)){assert.equal(c.fields.find(f=>f.name==='draft').default,true);assert.equal(c.fields.find(f=>f.name==='tags').widget,'tags-text');assert.equal(c.fields.find(f=>f.name==='hero').fields.find(f=>f.name==='image').media_library.allow_multiple,false);}
const bundle=fs.readFileSync('public/admin/vendor/decap-cms.js','utf8');assert.ok(bundle.includes('renderSimpleControls=()=>window.NYDUCATI.renderPublishingControls(this.props);renderDeployPreviewControls='));
assert.ok(fs.existsSync('dist/admin/location.js'));
console.log('PASS: single-box tags, direct save/publish/revert actions, published URL, single-image config, guarded toolbar adapter.');
