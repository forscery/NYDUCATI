from pathlib import Path
from html.parser import HTMLParser
from html import escape,unescape
import re,json
ROOT=Path(__file__).parent
paths=['/2015/11/renting-bikes-in-milan-italian-lakes-region.html','/2015/12/ii-around-couple-of-lakes-from-italy-to.html','/2015/12/iii-lago-lugano-around-lago-maggiore-to.html','/2015/12/iv-circumnavigating-lake-como-on-bmw.html','/2015/12/v-bellagio-bring-bikes-back-to-milan.html','/p/tighs-ducati-trips.html','/p/blog-page_15.html','/p/tigh-loughhead-visits-motorcycle-museums.html']
class Body(HTMLParser):
 def __init__(self):
  super().__init__();self.depth=0;self.out=[];self.imgs=[];self.text=[];self.links=[]
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if not self.depth:
   if tag=='div' and 'post-body' in a.get('class','').split():self.depth=1
   return
  if tag=='div':self.depth+=1
  if tag not in ['div','p','br','img','a','h2','h3','h4','strong','b','em','i','ul','ol','li','blockquote','table','tbody','tr','td','span']:return
  keep={}
  if tag=='img':
   src=a.get('src','');self.imgs.append(src);keep={'src':src,'loading':'lazy','alt':a.get('alt',''),'decoding':'async'}
  if tag=='a':
   href=a.get('href','');
   if href.startswith(('http:','https:','/','#')):
    if href.startswith(('http://www.nyducati.com','https://www.nyducati.com')):
     local=re.sub(r'^https?://www.nyducati.com','',href)
     if local in paths:href=local
     else:href='https://www.nyducati.com'+local
    keep={'href':href}; self.links.append(href)
  if tag=='td' and a.get('class')=='tr-caption':keep['class']='caption'
  self.out.append('<'+tag+''.join(' '+k+'="'+escape(v,quote=True)+'"' for k,v in keep.items())+'>')
 def handle_endtag(self,tag):
  if not self.depth:return
  if tag=='div':
   self.depth-=1
   if not self.depth:return
  if tag in ['div','p','a','h2','h3','h4','strong','b','em','i','ul','ol','li','blockquote','table','tbody','tr','td','span']:self.out.append('</'+tag+'>')
 def handle_data(self,data):
  if self.depth:self.out.append(escape(data));self.text.append(data)
posts=[]
for i,p in enumerate(paths):
 raw=(ROOT/'reference'/f'{i+1}.html').read_text();b=Body();b.feed(raw)
 m=re.search(r"<div class='entry-intro'>.*?<h1[^>]*>(.*?)</h1>",raw,re.S)
 title=unescape(re.sub('<[^>]+>','',m.group(1))).strip() if m else ['']*8
 posts.append({'path':p,'title':title,'body':''.join(b.out),'images':list(dict.fromkeys(b.imgs)),'excerpt':re.sub(r'\s+',' ',' '.join(b.text)).strip()[:250]})
(ROOT/'content.json').write_text(json.dumps(posts,indent=2))
for i,p in enumerate(posts):print(i+1,p['title'],len(p['images']),'photos',len(p['body']),'chars')
