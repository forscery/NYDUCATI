(function(){
const h=window.h;
const parse=text=>[...new Set(String(text||'').split(/[,\n\r]+/).map(t=>t.trim()).filter(Boolean))];
const values=value=>value?.toJS?value.toJS():Array.isArray(value)?value:[];
const Control=window.createClass({
 getInitialState(){return {text:values(this.props.value).join(', ')};},
 componentDidUpdate(){if(JSON.stringify(parse(this.state.text))!==JSON.stringify(parse(values(this.props.value).join('\n'))))this.setState({text:values(this.props.value).join(', ')});},
 render(){return h('textarea',{id:this.props.forID,className:this.props.classNameWrapper,rows:3,value:this.state.text,placeholder:'Ducati, bike nights, New York',disabled:this.props.isDisabled,onChange:e=>{const text=e.target.value;this.setState({text});this.props.onChange(parse(text));},onKeyDown:e=>{if(e.key==='Enter')e.stopPropagation();},style:{width:'100%',minHeight:'90px',padding:'12px',font:'inherit'}});}
});
CMS.registerWidget({name:'tags-text',controlComponent:Control,allowMapValue:true,previewComponent:props=>h('span',{},values(props.value).join(', '))});
})();
