'use strict';

const $ = id => document.getElementById(id);
const REPO = 'https://github.com/Papa-Oso/terlingua-water-atlas';
const COLORS = ['#dfe5df', '#d0dfb3', '#88bfa8', '#459985', '#176e60'];
const LEVELS = {sources_listed:{value:1,label:'Sources listed'},organized:{value:2,label:'Organized records'},connected:{value:3,label:'Connected'},reviewed:{value:4,label:'Reviewed'}};
const state = { selection:{kind:'county',id:'48043',name:'Brewster County',state:'Texas',country:'United States',area:'Brewster County, Texas, United States — Terlingua area',center:[-103.616,29.3216]}, counties:new Map(), countries:new Map(), coverage:new Map(), search:[], metadata:null, countyLayer:null, selectedLayer:null, selectedMarker:null, marker:null };
window.WaterAtlasMap = {getSelection:()=>({...state.selection}),getCounties:()=>[...state.counties.values()]};
let promptReference = null;
let promptOriginalArea = '';
let searchTimer;
let priorFocus;
const esc = value => String(value ?? '').replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
const normalized = value => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const number = value => Number(value).toLocaleString('en-US');
const dateLabel = value => new Date(`${value}T00:00:00Z`).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric',timeZone:'UTC'});
const coverageLabel = id => {const entry=state.coverage.get(String(id));return entry?`${LEVELS[entry.level].label} · ${entry.coverage==='partial'?'partial coverage':'stated county scope'}`:'Not yet indexed · help map this area';};

const map = L.map('world-map', { zoomControl:false, attributionControl:true, preferCanvas:true, minZoom:0, maxZoom:10, zoomSnap:.25, zoomDelta:.5, worldCopyJump:false, maxBounds:[[-85,-200],[85,200]], maxBoundsViscosity:.9, scrollWheelZoom:false, doubleClickZoom:true });
L.control.zoom({position:'bottomright'}).addTo(map);
map.attributionControl.setPrefix('');
map.attributionControl.addAttribution('Geography: Natural Earth · U.S. Census');
map.setView([22,-12],1.75);
function worldView(){map.fitBounds([[-57,-179],[78,179]],{padding:[16,35],animate:false,maxZoom:2.25});}
worldView();
function countyStyle(feature){const id=String(feature.id || feature.properties.id);const entry=state.coverage.get(id);const active=state.selection.kind==='county' && state.selection.id===id;return {color:active?'#316a53':entry?'#5d9475':'#f3f6ef',weight:active?1.6:entry?1:map.getZoom()>=3.25?.42:0,fillColor:COLORS[entry?LEVELS[entry.level].value:0],fillOpacity:1,opacity:1,bubblingMouseEvents:false};}
function updateMapStyles(){if(state.countyLayer)state.countyLayer.setStyle(countyStyle);$('map-hint').textContent=map.getZoom()>=3.25?'Select a county to explore or contribute':'Select a county or any place on the map';}
map.on('zoomend',updateMapStyles);

function textNode(tag,text,className){const element=document.createElement(tag);element.textContent=text;if(className)element.className=className;return element;}
function externalLink(label,url){const link=textNode('a',label);link.href=url;if(/^https:\/\//.test(url)){link.target='_blank';link.rel='noopener noreferrer';}return link;}
function renderTopics(entry){
  const container=$('area-topics');container.replaceChildren();container.hidden=!entry;
  if(!entry)return;
  for(const topic of entry.topics){const row=document.createElement('div');row.append(textNode('span',topic.status==='needed'?'↝':'◉','topic-symbol'),textNode('span',topic.name),textNode('span',topic.label,topic.status==='needed'?'topic-pending':'topic-state'));container.append(row);}
}
function renderEvidence(entry){
  let container=$('area-evidence');if(!container){container=textNode('p','','panel-note');container.id='area-evidence';$('area-date').after(container);}
  container.replaceChildren();container.hidden=!entry;if(!entry)return;
  container.append(document.createTextNode('Evidence: '));
  entry.evidence_urls.forEach((url,index)=>{if(index)container.append(document.createTextNode(' · '));container.append(externalLink(`Source ${index+1} ↗`,url));});
  if(entry.source_issue){container.append(document.createTextNode(' · '),externalLink('Contribution ↗',entry.source_issue));}
  if(entry.connector_tests){for(const test of entry.connector_tests){container.append(document.createElement('br'),externalLink(`${test.name} · tested ${dateLabel(test.tested_at)} ↗`,test.evidence_url));}}
  if(entry.review){container.append(document.createElement('br'),externalLink(`Review by ${entry.review.reviewer} · ${dateLabel(entry.review.reviewed_at)} ↗`,entry.review.evidence_url));}
}
function setPanel(selection){
  state.selection=selection;
  const entry=selection.kind==='county'?state.coverage.get(selection.id):null;
  const known=Boolean(entry);
  const partialCountry=selection.kind==='country' && selection.id==='USA' && state.coverage.size>0;
  const hasCollection=known||partialCountry;
  const first=entry?.origin==='terlingua_case_study' && selection.id==='48043';
  $('area-kicker').textContent=known?(first?'FIRST REGIONAL COLLECTION':entry.origin==='terlingua_case_study'?'PART OF THE TERLINGUA COLLECTION':'PUBLISHED COUNTY COLLECTION'):partialCountry?'LOCAL COLLECTIONS IN THIS COUNTRY':'A PLACE FOR NEW KNOWLEDGE';
  $('area-number').textContent=known?String([...state.coverage.keys()].indexOf(selection.id)+1).padStart(2,'0'):partialCountry?String(state.coverage.size).padStart(2,'0'):'＋';
  $('area-location').textContent=selection.kind==='county'?`${selection.name} · ${selection.state}, US`.toUpperCase():selection.kind==='country'?'WORLD ATLAS · COUNTRY':'WORLD ATLAS · SELECTED LOCATION';
  $('area-title').textContent=first?'Terlingua.':selection.kind==='county'||selection.kind==='country'?selection.name:'Your selected area.';
  $('area-summary').textContent=known?entry.summary:partialCountry?`${number(state.coverage.size)} county areas have published collections. Choose a county to explore its evidence and stated scope, or help expand the atlas.`:'This area is not yet indexed by Water Atlas. Help locate the original sources and make them easier for others to find.';
  $('area-status').replaceChildren();
  const square=textNode('span','','status-square');square.style.background=COLORS[known?LEVELS[entry.level].value:0];
  $('area-status').append(square,textNode('span',known?LEVELS[entry.level].label:partialCountry?`${number(state.coverage.size)} county areas indexed`:'Not yet indexed'));
  if(partialCountry||entry?.coverage==='partial')$('area-status').append(textNode('span','PARTIAL AREA','partial-label'));
  $('area-metrics').hidden=!entry?.metrics;
  $('area-records').textContent=entry?.metrics?number(entry.metrics.source_records):'';
  $('area-water-wells').textContent=entry?.metrics?number(entry.metrics.water_well_records):'';
  renderTopics(entry);
  $('area-date').textContent=known?`PUBLISHED · ${dateLabel(entry.published_at).toUpperCase()}`:'START WITH ONE USEFUL SOURCE';
  renderEvidence(entry);
  $('collection-link').hidden=!known;
  $('collection-link').textContent=known?'Explore the collection ↗':'';
  if(known){$('collection-link').href=entry.collection_url;if(/^https:\/\//.test(entry.collection_url)){$('collection-link').target='_blank';$('collection-link').rel='noopener noreferrer';}else{$('collection-link').removeAttribute('target');$('collection-link').removeAttribute('rel');}}
  else $('collection-link').removeAttribute('href');
  $('help-area').classList.toggle('primary',!hasCollection);
  $('help-area').classList.toggle('secondary',hasCollection);
  $('area-note').textContent=known?`${entry.scope}${entry.review?` Review scope: ${entry.review.notes}`:''}`:partialCountry?'This is not a country-wide inventory. Collection dates and geographic limits are stated separately for each county.':'Not indexed means we have no published local collection yet. It does not mean there is no water or evidence elsewhere.';
  $('panel-back').hidden=known&&first;
  updateMapStyles();
  requestAnimationFrame(()=>map.invalidateSize({pan:false}));
}

function selectionGeometry(feature,kind){
  if(state.selectedLayer){map.removeLayer(state.selectedLayer);state.selectedLayer=null;}
  if(state.selectedMarker){map.removeLayer(state.selectedMarker);state.selectedMarker=null;}
  if(kind==='country')state.selectedLayer=L.geoJSON(feature,{interactive:false,style:{fillOpacity:0,color:'#6d9675',weight:1.5,dashArray:'4 3'}}).addTo(map);
}
function selectCounty(feature,options={}){
  const p=feature.properties;setPanel({kind:'county',id:String(feature.id||p.id),name:p.name,state:p.state,country:p.country,area:`${p.name}, ${p.state}, ${p.country}`,center:p.center});
  selectionGeometry(feature,'county');
  if(options.zoom){const bounds=L.geoJSON(feature).getBounds();if(bounds.getEast()-bounds.getWest()<200)map.fitBounds(bounds,{padding:[45,75],maxZoom:7.5});else map.setView([p.center[1],p.center[0]],5);}
  if(options.scroll)$('explore').scrollIntoView({behavior:'smooth',block:'start'});
}
function selectCountry(feature,options={}){
  const p=feature.properties;setPanel({kind:'country',id:String(feature.id||p.id),name:p.name,country:p.name,area:p.name,center:p.center});selectionGeometry(feature,'country');
  if(options.zoom){const bounds=L.geoJSON(feature).getBounds();if(bounds.getEast()-bounds.getWest()<200)map.fitBounds(bounds,{padding:[40,70],maxZoom:5});else map.setView([p.center[1],p.center[0]],2.5);}
}
function selectPoint(latlng){
  const lat=Math.max(-85,Math.min(85,latlng.lat)),lon=((latlng.lng+180)%360+360)%360-180;
  setPanel({kind:'point',id:null,name:'Selected location',country:'',area:`Area around ${lat.toFixed(4)} latitude, ${lon.toFixed(4)} longitude — please establish the place and country`,center:[lon,lat]});
  selectionGeometry(null,'point');state.selectedMarker=L.circleMarker([lat,lon],{radius:6,color:'#fff',weight:2,fillColor:'#2c7b64',fillOpacity:1,interactive:false}).addTo(map);
}
map.on('click',event=>{closeSearch();selectPoint(event.latlng);});
function selectTerlingua(zoom=false){
  const feature=state.counties.get('48043');if(feature)selectCounty(feature,{zoom});else setPanel({kind:'county',id:'48043',name:'Brewster County',state:'Texas',country:'United States',area:'Brewster County, Texas, United States — Terlingua area',center:[-103.616,29.3216]});
  if(zoom)map.fitBounds([[28.8,-104.55],[30.9,-102.1]],{padding:[28,65],maxZoom:7});
}
$('world-view').addEventListener('click',worldView);
$('texas-view').addEventListener('click',()=>selectTerlingua(true));
$('panel-back').addEventListener('click',()=>selectTerlingua(false));
document.addEventListener('click',event=>{const button=event.target.closest('[data-region]');if(!button)return;const feature=state.counties.get(button.dataset.region);if(feature)selectCounty(feature,{zoom:true,scroll:true});});
function renderDirectory(){
  const container=document.querySelector('.directory-items');container.replaceChildren();
  const description=document.querySelector('.region-directory > div:first-child > p:not(.eyebrow)');if(description)description.textContent=`${number(state.coverage.size)} county areas indexed. Each collection states its own scope and publication date.`;
  for(const entry of state.coverage.values()){
    const button=textNode('button','','directory-item');button.type='button';button.dataset.region=entry.fips;
    const label=document.createElement('span');label.append(textNode('strong',entry.name),textNode('small',`${entry.state}, ${entry.country}${entry.coverage==='partial'?' · partial coverage':''}`));
    button.append(label,textNode('span',`${LEVELS[entry.level].label} ↗`,'directory-status'));container.append(button);
  }
}

function closeSearch(){clearTimeout(searchTimer);$('search-results').hidden=true;$('search-input').setAttribute('aria-expanded','false');}
function chooseSearch(item){closeSearch();$('search-input').value=item.label;if(item.kind==='county')selectCounty(item.feature,{zoom:true});else selectCountry(item.feature,{zoom:true});}
function showSearch(){
  const raw=$('search-input').value.trim(),query=normalized(raw);const container=$('search-results');container.replaceChildren();if(!raw){closeSearch();return;}
  const tokens=query.split(' ');const matches=query?state.search.filter(item=>tokens.every(token=>item.key.includes(token))).sort((a,b)=>a.key.startsWith(query)?-1:b.key.startsWith(query)?1:a.label.localeCompare(b.label)).slice(0,7):[];
  for(const item of matches){const button=textNode('button',item.label,'search-result');button.type='button';button.append(textNode('small',item.kind==='county'?coverageLabel(item.feature.id):'Country view · choose a more specific area to contribute'));button.addEventListener('click',()=>chooseSearch(item));container.append(button);}
  const custom=textNode('button',`Research “${raw.slice(0,100)}”`,'search-result');custom.type='button';custom.append(textNode('small','Any place or watershed · prepare a research prompt'));custom.addEventListener('click',()=>{closeSearch();openPrompt({area:raw,center:null});});container.append(custom);
  container.hidden=false;$('search-input').setAttribute('aria-expanded','true');
}
$('search-input').addEventListener('input',()=>{clearTimeout(searchTimer);searchTimer=setTimeout(showSearch,100);});
$('search-input').addEventListener('keydown',event=>{if(event.key==='Escape')closeSearch();if(event.key==='ArrowDown'&&!$('search-results').hidden){event.preventDefault();$('search-results').querySelector('button')?.focus();}});
$('place-search').addEventListener('submit',event=>{event.preventDefault();const value=$('search-input').value.trim();if(!value)return;const query=normalized(value);const match=query?(state.search.find(item=>item.key===query||normalized(item.label)===query)||state.search.find(item=>item.key.includes(query))):null;if(match)chooseSearch(match);else{closeSearch();openPrompt({area:value,center:null});}});
document.addEventListener('click',event=>{if(!event.target.closest('.map-search'))closeSearch();});

for(const topic of WaterAtlasPrompts.topics){const label=textNode('label','','topic-option');const input=document.createElement('input');input.type='checkbox';input.value=topic.id;input.name='topics';input.checked=['wells','rivers'].includes(topic.id);label.append(input,textNode('span',topic.label));$('topic-options').append(label);}
for(const task of WaterAtlasPrompts.tasks){const option=textNode('option',task.label);option.value=task.id;$('prompt-task').append(option);}
function updatePrompt(){
  const area=$('prompt-area').value.trim();const topics=[...document.querySelectorAll('#topic-options input:checked')].map(input=>input.value);
  const coordinates=area===promptOriginalArea?promptReference:null;
  $('prompt-coordinates').textContent=coordinates?`Reference point: ${coordinates[1].toFixed(4)}, ${coordinates[0].toFixed(4)} · not a boundary`:'Add a state/province and country so the area is clear.';
  const valid=Boolean(area&&topics.length);$('copy-prompt').disabled=!valid;$('download-prompt').disabled=!valid;
  if(!valid){$('prompt-output').value=area?'Select at least one topic to prepare your prompt.':'Enter an area to prepare your research prompt.';$('prompt-length').textContent='';return;}
  const prompt=WaterAtlasPrompts.build({area,coordinates,topics,task:$('prompt-task').value,sourceLimit:Number($('source-limit').value)});
  $('prompt-output').value=prompt;$('prompt-length').textContent=`${number(prompt.split(/\s+/).length)} words`;$('copy-status').textContent='';
}
function openPrompt(selection=state.selection){
  priorFocus=document.activeElement;promptOriginalArea=selection.area||selection.name||'';promptReference=Array.isArray(selection.center)?selection.center:null;$('prompt-area').value=promptOriginalArea;$('prompt-task').value='find_sources';$('copy-status').textContent='';updatePrompt();$('prompt-dialog').showModal();
}
for(const id of ['header-contribute','help-area','how-contribute','failure-contribute'])$(id).addEventListener('click',()=>openPrompt());
$('prompt-form').addEventListener('submit',event=>event.preventDefault());
$('prompt-form').addEventListener('input',updatePrompt);
$('prompt-form').addEventListener('change',updatePrompt);
$('copy-prompt').addEventListener('click',async()=>{
  const output=$('prompt-output');
  try{if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(output.value);}else{output.focus();output.select();if(!document.execCommand('copy'))throw new Error('Clipboard not available');}$('copy-status').textContent='Copied. Paste this into your own AI tool.';}
  catch{output.focus();output.select();$('copy-status').textContent='Clipboard access was unavailable. The prompt is selected; use Copy or download the text file.';}
});
$('download-prompt').addEventListener('click',()=>{const text=$('prompt-output').value;const blob=new Blob([text+'\n'],{type:'text/plain;charset=utf-8'});const url=URL.createObjectURL(blob);const anchor=document.createElement('a');const slug=normalized($('prompt-area').value).replace(/ /g,'-').slice(0,75)||'area';anchor.href=url;anchor.download=`water-atlas-${slug}.txt`;document.body.append(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);$('copy-status').textContent='Your research prompt has been downloaded.';});
document.querySelectorAll('[data-close]').forEach(button=>button.addEventListener('click',()=>$(button.dataset.close).close()));
for(const dialog of document.querySelectorAll('dialog')){dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const bounds=dialog.getBoundingClientRect();if(event.clientX<bounds.left||event.clientX>bounds.right||event.clientY<bounds.top||event.clientY>bounds.bottom)dialog.close();});dialog.addEventListener('close',()=>{if(priorFocus instanceof HTMLElement)priorFocus.focus();});}
for(const id of ['legend-details','about-data'])$(id).addEventListener('click',()=>{priorFocus=document.activeElement;$('about-dialog').showModal();});

async function getJSON(path){const response=await fetch(path);if(!response.ok)throw new Error(`Could not read ${path}: ${response.status}`);return response.json();}
(async function initialize(){
  try{
    const [world,counties,metadata,coverage]=await Promise.all([getJSON('data/world.geojson'),getJSON('data/us-counties.geojson'),getJSON('data/terlingua.json'),getJSON('data/coverage.json')]);state.metadata=metadata;
    if(coverage.schema_version!==1||!Array.isArray(coverage.counties))throw new Error('Unsupported coverage registry');
    const countyIds=new Set(counties.features.map(feature=>String(feature.id)));
    for(const entry of coverage.counties){if(!countyIds.has(entry.fips)||!LEVELS[entry.level]||state.coverage.has(entry.fips))throw new Error('Invalid county coverage entry');state.coverage.set(entry.fips,entry);}
    L.geoJSON(world,{style:{color:'#f8faf4',weight:.7,fillColor:COLORS[0],fillOpacity:1,bubblingMouseEvents:false},onEachFeature(feature,layer){const p=feature.properties;state.countries.set(p.id,feature);state.search.push({kind:'country',label:p.name,key:normalized(p.name),feature});layer.bindTooltip(esc(p.name),{sticky:true});layer.on('click',event=>{L.DomEvent.stopPropagation(event.originalEvent);closeSearch();selectCountry(feature);});}}).addTo(map);
    state.countyLayer=L.geoJSON(counties,{style:countyStyle,onEachFeature(feature,layer){const p=feature.properties;state.counties.set(String(feature.id),feature);state.search.push({kind:'county',label:`${p.name}, ${p.state}`,key:normalized(`${p.name} ${p.shortName} ${p.state} ${p.stateCode} United States ${p.id==='48043'?'Terlingua Big Bend':''}`),feature});layer.bindTooltip(`<strong>${esc(p.name)}, ${esc(p.stateCode)}</strong><p>${esc(coverageLabel(feature.id))}</p>`,{sticky:true});layer.on('click',event=>{L.DomEvent.stopPropagation(event.originalEvent);closeSearch();selectCounty(feature);});}}).addTo(map);
    const icon=L.divIcon({className:'atlas-marker',html:'<span class="atlas-marker-button"><span class="atlas-marker-dot"></span><span class="atlas-marker-label">Terlingua, Texas<small>OUR FIRST COLLECTION ↗</small></span></span>',iconSize:[160,40],iconAnchor:[6,17]});
    state.marker=L.marker([metadata.lat,metadata.lon],{icon,title:'Explore the Terlingua collection',keyboard:true,zIndexOffset:900}).addTo(map).on('click',event=>{L.DomEvent.stopPropagation(event.originalEvent);selectTerlingua(true);});
    renderDirectory();$('map-loading').hidden=true;selectTerlingua(false);worldView();window.dispatchEvent(new CustomEvent('wateratlas:ready'));
  }catch(error){console.error('Water Atlas geography:',error.message);$('map-loading').hidden=true;$('map-failure').hidden=false;$('map-hint').textContent='Geography unavailable · use the prompt builder or source collection';}
})();
