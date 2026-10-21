(function(){
const h=window.h,cache=new Map();
function plain(value){return value?.toJS?value.toJS():value||{};}
function place(feature){
 const p=feature.properties||{},coords=feature.geometry?.coordinates||[],lon=Number(coords[0]),lat=Number(coords[1]);
 if(coords.length<2||typeof coords[0]!=='number'||typeof coords[1]!=='number'||!Number.isFinite(lat)||!Number.isFinite(lon)||Math.abs(lat)>90||Math.abs(lon)>180)return null;
 const address=[...new Set([p.name,[p.housenumber,p.street].filter(Boolean).join(' '),p.city||p.town||p.village,p.state,p.country].filter(Boolean))].join(', ');
 if(!address)return null;
 return {name:p.name||address,address,latitude:lat,longitude:lon,mapUrl:`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=15/${lat}/${lon}`,source:'OpenStreetMap'};
}
const Control=window.createClass({
 getInitialState(){return {query:plain(this.props.value).name||'',results:[],busy:false,message:''};},
 componentWillUnmount(){this.cancel();},
 cancel(){this.requestId=(this.requestId||0)+1;this.controller?.abort();},
 changeQuery(event){this.cancel();this.setState({query:event.target.value,results:[],busy:false,message:''});},
 async search(){
  if(this.state.busy)return;
  const query=this.state.query.trim();if(query.length<3){this.setState({message:'Enter at least three characters.'});return;}
  this.cancel();const id=this.requestId;this.controller=new AbortController();const controller=this.controller;this.setState({busy:true,results:[],message:'Searching…'});
  const timeout=setTimeout(()=>controller.abort(),10000);
  try{
   let results=cache.get(query.toLowerCase());
   if(!results){const url=new URL('https://photon.komoot.io/api/');url.searchParams.set('q',query);url.searchParams.set('limit','5');url.searchParams.set('lang','en');const response=await fetch(url,{signal:controller.signal,credentials:'omit',referrerPolicy:'no-referrer'});if(!response.ok)throw new Error('Search unavailable');const data=await response.json();results=(data.features||[]).map(place).filter(Boolean);cache.set(query.toLowerCase(),results);}
   if(id===this.requestId)this.setState({results,busy:false,message:results.length?'Choose the matching place:':'No matches. Try adding a city or country, or enter a location below.'});
  }catch{if(id===this.requestId)this.setState({busy:false,message:'Place search is unavailable. Try again or enter the name and map link below.'});}finally{clearTimeout(timeout);}
 },
 select(result){this.props.onChange(result);this.setState({query:result.name,results:[],message:'Location selected. You can adjust the display name below.'});},
 edit(key,value){const next={...plain(this.props.value),[key]:value};if(key==='mapUrl'){delete next.latitude;delete next.longitude;delete next.source;delete next.address;}this.props.onChange(next);},
 render(){const value=plain(this.props.value),id=this.props.forID;return h('div',{className:'ny-location'},
  h('label',{htmlFor:id},'Find a place'),
  h('input',{id,value:this.state.query,onChange:this.changeQuery,placeholder:'e.g. Ducati Museum, Bologna',maxLength:180,disabled:this.props.isDisabled,onKeyDown:e=>{if(e.key==='Enter'){e.preventDefault();this.search();}}}),
  h('button',{type:'button',onClick:this.search,disabled:this.state.busy||this.props.isDisabled},this.state.busy?'Searching…':'Search places'),
  h('p',{role:'status','aria-live':'polite'},this.state.message),
  h('ul',{className:'ny-place-results'},this.state.results.map((r,i)=>h('li',{key:i},h('button',{type:'button',onClick:()=>this.select(r)},r.address)))),
  h('label',{htmlFor:id+'-name'},'Display name'),h('input',{id:id+'-name',value:value.name||'',disabled:this.props.isDisabled,onChange:e=>this.edit('name',e.target.value)}),
  h('details',{},h('summary',{},'Map link / manual entry'),h('input',{'aria-label':'Map link',type:'url',placeholder:'https://…',value:value.mapUrl||'',disabled:this.props.isDisabled,onChange:e=>this.edit('mapUrl',e.target.value)})),
  value.mapUrl?.startsWith('https://')?h('a',{href:value.mapUrl,target:'_blank',rel:'noopener noreferrer'},'View selected place on map ↗'):null,
  value.name?h('button',{type:'button',disabled:this.props.isDisabled,onClick:()=>{this.cancel();this.props.onChange({name:'',mapUrl:''});this.setState({query:'',results:[],busy:false,message:''});}},'Clear location'):null,
  h('small',{},'Search uses ',h('a',{href:'https://photon.komoot.io/',target:'_blank',rel:'noopener noreferrer'},'Photon'),' · © ',h('a',{href:'https://www.openstreetmap.org/copyright',target:'_blank',rel:'noopener noreferrer'},'OpenStreetMap contributors'),'. Only your search text is sent when you press Search.'));
 }
});
CMS.registerWidget({name:'place',controlComponent:Control,allowMapValue:true,previewComponent:props=>h('span',{},plain(props.value).name||'')});
})();
