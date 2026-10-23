import {marked} from 'marked';import sanitizeHtml from 'sanitize-html';
import {validJourneyPath,resolveChapters} from './journey-model.mjs';
const sources=Object.values(import.meta.glob('../../content/posts/*.json',{eager:true,import:'default'}));
const records=Object.entries(import.meta.glob('../../content/journeys/*.json',{eager:true,import:'default'})).map(([file,data])=>({...data,sourceFile:file.split('/').pop()}));
const paths=new Set(sources.map(p=>p.path));
export const hiddenJourneyPaths=records.filter(j=>j.draft).map(j=>j.path);
const journeys=records.map(j=>{if(!validJourneyPath(j.path)||paths.has(j.path))throw Error('Invalid or duplicate journey URL: '+j.path);paths.add(j.path);return {...j,hero:j.hero?{...j.hero,image:Array.isArray(j.hero.image)?j.hero.image[0]:j.hero.image}:null,chapters:j.draft?[]:resolveChapters(j,sources),html:sanitizeHtml(marked.parse(j.body||''),{allowedTags:sanitizeHtml.defaults.allowedTags.concat(['img','figure','figcaption']),allowedAttributes:{...sanitizeHtml.defaults.allowedAttributes,img:['src','alt','width','height','loading']},transformTags:{img:(_,a)=>({tagName:'img',attribs:{...a,loading:'lazy'}})}})};}).filter(j=>!j.draft);
export default journeys;
