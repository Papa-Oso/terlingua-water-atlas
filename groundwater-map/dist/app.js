'use strict';

const $ = id => document.getElementById(id);
const CENTER = [29.3216, -103.6160];
const COLORS = {positive_yield:'#26796c',dry:'#c56149',plugged_abandoned:'#a8813f',unknown:'#7b8792'};
const LABELS = {positive_yield:'Positive yield reported',dry:'Dry outcome reported',plugged_abandoned:'Plugged / abandoned',unknown:'Outcome unknown'};
const SOURCE_NAMES = {SDR:'Submitted driller reports',GWDB:'Groundwater Database',Plugging:'Well plugging reports'};
const CONTEXT_BASE = 'https://tiles.arcgis.com/tiles/O0h7Kr4STkhD6uiU/arcgis/rest/services/';
const contextLayers = {geology:{name:'Surface geology',service:'TexasRockUnit',minZoom:5},aquifers:{name:'Minor aquifers',service:'TexasMinorAquifers',minZoom:4}};
let wells = [], filtered = [], metadata = {}, markers = new Map(), page = 0, sortField = 'id', sortDirection = 1, parcel = null, parcelMarker = null, pickMode = false, toastTimeout;
let view = 'map';
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const finite = value => value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value));
const fmt = (value, digits = 1) => finite(value) ? Number(value).toLocaleString('en-US',{maximumFractionDigits:digits}) : 'Not reported';
const safeUrl = value => { try { const u = new URL(value); return ['https:','http:'].includes(u.protocol) ? u.href : ''; } catch { return ''; } };
const sourceName = source => SOURCE_NAMES[source] || source || 'Public record';
const badge = well => `<span class="evidence-badge ${well.status}"><i class="status-dot ${well.status}"></i>${LABELS[well.status]}</span>`;
const isSpring = well => /spring/i.test(well.well_type || '');
const isWaterWell = well => well.is_water_well === true || (well.is_water_well === undefined && (!well.record_kind || well.record_kind === 'water_well') && !isSpring(well));
const yieldValue = well => finite(well.yield_gpm) ? fmt(well.yield_gpm) : (well.yield_raw || well.yield_text || well.yield_reported || null);
const yieldUnit = well => finite(well.yield_gpm) || (/^[<>]?\s*\d/.test(String(well.yield_raw || ''))) ? 'gpm' : '(raw report)';
const typeName = well => well.record_kind ? well.record_kind.replace(/_/g,' ') : (well.well_type || 'recorded site');
function scopedWells(){const kind=$('kind-filter').value;return wells.filter(w=>kind==='all'||(kind==='water_well'&&isWaterWell(w))||(kind==='spring'&&(isSpring(w)||w.record_kind==='spring'))||(kind==='other'&&!isWaterWell(w)&&!isSpring(w)&&w.record_kind!=='spring'));}
function evidenceText(well) { return Array.isArray(well.evidence) ? well.evidence.join(' ') : String(well.evidence || 'No outcome evidence is available in the extracted fields.'); }
function milesBetween(lat1,lon1,lat2,lon2) { const rad = Math.PI / 180, dlat = (lat2-lat1)*rad, dlon = (lon2-lon1)*rad; const a = Math.sin(dlat/2)**2 + Math.cos(lat1*rad)*Math.cos(lat2*rad)*Math.sin(dlon/2)**2; return 3958.7613 * 2 * Math.atan2(Math.sqrt(a),Math.sqrt(Math.max(0,1-a))); }
function notify(message) { $('toast').textContent = message; $('toast').hidden = false; clearTimeout(toastTimeout); toastTimeout = setTimeout(() => $('toast').hidden = true,4500); }

const map = L.map('map',{zoomControl:false,preferCanvas:true,minZoom:5,maxZoom:18}).setView(CENTER,9);
L.control.zoom({position:'bottomright'}).addTo(map);
L.control.scale({position:'bottomleft',imperial:true,metric:false}).addTo(map);
const basemaps = {
  light:L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',maxZoom:19}),
  topographic:L.tileLayer('https://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',{attribution:'Tiles &copy; Esri — Esri, USGS, NOAA, and other contributors',maxZoom:18})
};
basemaps.light.addTo(map);
const studyCircle = L.circle(CENTER,{radius:50*1609.344,color:'#71866b',weight:1.5,dashArray:'6 7',fillColor:'#779464',fillOpacity:.025,interactive:false}).addTo(map);
const wellLayer = L.layerGroup().addTo(map);
L.circleMarker(CENTER,{radius:4,color:'#fcfaf5',weight:1.5,fillColor:'#354e3c',fillOpacity:1,interactive:false}).addTo(map).bindTooltip('TERLINGUA',{permanent:true,direction:'bottom',className:'town-label',offset:[0,6]});
function fitStudy(){map.fitBounds(studyCircle.getBounds(),{padding:[35,70]});}
map.fitBounds(studyCircle.getBounds(),{padding:[35,70],animate:false});
for (const layer of Object.values(contextLayers)) layer.layer = L.tileLayer(`${CONTEXT_BASE}${layer.service}/MapServer/tile/{z}/{y}/{x}`,{minZoom:layer.minZoom,maxNativeZoom:13,maxZoom:18,opacity:.43,attribution:'<a href="https://www.twdb.texas.gov/mapping/data-services.asp">TWDB regional geology / aquifers</a>'});

function popup(well) {
  const url = safeUrl(well.source_url);
  const reportDate = well.report_date ? esc(well.report_date) : 'Not reported';
  const tests = Array.isArray(well.well_tests) ? well.well_tests.filter(t => finite(t.yield_gpm) || t.yield_raw) : [];
  const colocated = filtered.filter(w => w.id !== well.id && w.lat === well.lat && w.lon === well.lon);
  const testDetail = tests.slice(0,4).map(t => [t.date || null, t.date_note || null, finite(t.yield_gpm) ? `${fmt(t.yield_gpm)} gpm` : t.yield_raw, t.method || null, finite(t.duration_hours) ? `${fmt(t.duration_hours)} hr` : null].filter(Boolean).map(esc).join(' · ')).join('<br>');
  return `<div class="popup-eyebrow">${esc(sourceName(well.source))}${isSpring(well) ? ' · SPRING' : ''}</div><div class="popup-title">${esc(well.report_number || well.id)}</div>${badge(well)}<dl class="popup-metrics"><div><dt>${esc(well.depth_type || 'Reported depth')}</dt><dd>${finite(well.depth_ft) ? fmt(well.depth_ft) + ' <small>ft</small>' : '<small>Not reported</small>'}</dd></div><div><dt>Reported yield</dt><dd>${yieldValue(well) ? esc(yieldValue(well)) + ' <small>'+esc(yieldUnit(well))+'</small>' : '<small>Not reported</small>'}</dd></div><div><dt>Water level below land surface</dt><dd>${finite(well.water_level_ft) ? fmt(well.water_level_ft) + ' <small>ft</small>' : '<small>Not reported</small>'}</dd></div><div><dt>Completion / report date</dt><dd><small>${reportDate}</small></dd></div></dl><div class="popup-evidence">${esc(evidenceText(well))}</div><div class="popup-detail">${well.outcome_label ? `<p><strong>Outcome context:</strong> ${esc(well.outcome_label)}</p>` : ''}${well.water_level_date ? `<p><strong>Water-level date:</strong> ${esc(well.water_level_date)}</p>` : ''}<p><strong>Type / use:</strong> ${esc([typeName(well),well.well_type,well.proposed_use].filter(Boolean).join(' / ') || 'Not reported')}</p><p><strong>Aquifer:</strong> ${esc([well.aquifer,well.aquifer_formation].filter(Boolean).join(' / ') || 'Not reported')}</p>${well.county ? `<p><strong>County:</strong> ${esc(well.county)}</p>` : ''}${well.failure_reason ? `<p><strong>Reported reason:</strong> ${esc(well.failure_reason)}</p>` : ''}${testDetail ? `<p><strong>Reported test details:</strong><br>${testDetail}</p>` : ''}<p><strong>Location:</strong> ${Number(well.lat).toFixed(5)}, ${Number(well.lon).toFixed(5)}</p><p>${esc(well.location_note || 'Recorded coordinates may be approximate; verify the physical location.')}</p><p><strong>Water quality:</strong> ${esc(well.water_quality_note || 'Potability is not established by this record.')}</p>${parcel ? `<p><strong>From your pin:</strong> ${fmt(milesBetween(parcel.lat,parcel.lon,well.lat,well.lon),2)} straight-line miles</p>` : ''}</div>${url ? `<a class="popup-link" href="${esc(url)}" target="_blank" rel="noopener noreferrer">Open source record ↗</a>` : '<span class="popup-link">Individual report link not available</span>'}${safeUrl(well.data_source_url) ? `<br><a class="popup-link" href="${esc(safeUrl(well.data_source_url))}" target="_blank" rel="noopener noreferrer">Bulk source for measurements &amp; remarks ↗</a>` : ''}${safeUrl(well.supplemental_source_url) ? `<br><a class="popup-link" href="${esc(safeUrl(well.supplemental_source_url))}" target="_blank" rel="noopener noreferrer">Additional historical source · TWDB R323 ↗</a>` : ''}${colocated.length ? `<details class="popup-neighbors"><summary>${colocated.length + 1} visible records share these coordinates</summary><p>May include duplicates or approximate locations.</p>${colocated.map(w => `<button class="text-button" data-well-id="${esc(w.id)}">${esc(w.source)} · ${esc(w.report_number || w.id)} · ${LABELS[w.status]}</button>`).join('')}</details>` : ''}<p class="popup-footnote">Historical reported evidence. Current supply and drinking-water safety are not verified.</p>`;
}

function showWell(id) {
  const well = wells.find(w => w.id === id);
  if (!well) return;
  if (!markers.has(id)) { notify('This record is hidden by your filters. Reset the filters to see it on the map.'); return; }
  setView('map');
  map.setView([well.lat,well.lon],Math.max(map.getZoom(),12));
  markers.get(id).openPopup();
  if (window.innerWidth < 621) $('map-stage').scrollIntoView({behavior:'smooth',block:'start'});
}

function applyFilters() {
  const statuses = new Set([...document.querySelectorAll('.status-filters input:checked')].map(el => el.value));
  const query = $('search').value.trim().toLowerCase(), source = $('source-filter').value;
  const min = $('min-depth').value === '' ? null : Number($('min-depth').value), max = $('max-depth').value === '' ? null : Number($('max-depth').value);
  const scoped = scopedWells();
  filtered = scoped.filter(w => statuses.has(w.status) && (!source || w.source === source) && (!query || [w.id,w.report_number,w.county,w.aquifer,w.aquifer_formation,w.well_type,w.proposed_use].filter(Boolean).join(' ').toLowerCase().includes(query)) && (min === null || finite(w.depth_ft) && w.depth_ft >= min) && (max === null || finite(w.depth_ft) && w.depth_ft <= max));
  page = 0;
  $('results-summary').innerHTML = `<strong>${filtered.length.toLocaleString()}</strong> of ${scoped.length.toLocaleString()} ${$('kind-filter').value==='water_well'?'water-well':'site'} records shown`;
  wellLayer.clearLayers(); markers.clear();
  const drawn = [...filtered].sort((a,b) => Object.keys(COLORS).indexOf(b.status) - Object.keys(COLORS).indexOf(a.status));
  for (const well of drawn) {
    const marker = L.circleMarker([well.lat,well.lon],{radius:well.status === 'unknown' ? 4 : 5,fillColor:COLORS[well.status],fillOpacity:.86,color:'#fcfaf5',weight:1,opacity:1});
    marker.bindPopup(() => popup(well),{maxWidth:335,minWidth:240,maxHeight:500,autoPanPadding:[25,40]});
    marker.bindTooltip(`${esc(well.report_number || well.id)} · ${LABELS[well.status]}`,{direction:'top'});
    marker.addTo(wellLayer); markers.set(well.id,marker);
  }
  renderTable();
  if (parcel) renderNearby();
}

function setView(next) { view = next; $('map-stage').hidden = next !== 'map'; $('table-stage').hidden = next !== 'table'; for (const key of ['map','table']) { $(`${key}-view-button`).classList.toggle('selected',next===key); $(`${key}-view-button`).setAttribute('aria-pressed',String(next===key)); } if(next==='map') requestAnimationFrame(() => map.invalidateSize()); }
function renderTable() {
  const ordered = [...filtered].sort((a,b) => { const x=a[sortField], y=b[sortField]; if(x===null || x===undefined) return 1; if(y===null || y===undefined) return -1; return sortDirection*(typeof x==='number' && typeof y==='number' ? x-y : String(x).localeCompare(String(y),undefined,{numeric:true})); });
  const rows = ordered.slice(page*50,page*50+50);
  $('records-body').innerHTML = rows.length ? rows.map(w => `<tr><td><button class="text-button" data-well-id="${esc(w.id)}">${esc(w.report_number || w.id)}</button>${!isWaterWell(w) ? `<span class="table-spring">${esc(typeName(w))}</span>` : ''}</td><td>${badge(w)}</td><td>${finite(w.depth_ft) ? fmt(w.depth_ft) : '—'}</td><td>${yieldValue(w) ? esc(yieldValue(w)) : '—'}</td><td>${finite(w.water_level_ft) ? fmt(w.water_level_ft) : '—'}</td><td title="${esc(sourceName(w.source))}">${esc(w.source)}</td><td>${esc([w.aquifer,w.aquifer_formation].filter(Boolean).join(' / ') || '—')}</td><td>${safeUrl(w.source_url) ? `<a href="${esc(safeUrl(w.source_url))}" target="_blank" rel="noopener noreferrer">Source ↗</a>` : '—'}</td></tr>`).join('') : '<tr><td colspan="8" class="table-empty">No records match these filters. Try resetting or widening the depth range.</td></tr>';
  const pages = Math.max(1,Math.ceil(ordered.length/50));
  $('page-label').textContent = `${ordered.length ? page*50+1 : 0}–${Math.min(page*50+50,ordered.length)} of ${ordered.length.toLocaleString()} records`;
  $('page-prev').disabled = page===0; $('page-next').disabled = page>=pages-1;
}

function selectParcel(lat,lon) {
  if(!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) { notify('Enter valid latitude and longitude coordinates.'); return; }
  parcel = {lat,lon};
  $('parcel-lat').value = lat.toFixed(6); $('parcel-lon').value = lon.toFixed(6);
  if (parcelMarker) map.removeLayer(parcelMarker);
  parcelMarker = L.marker([lat,lon],{icon:L.divIcon({html:'<div class="parcel-pin"><span>+</span></div>',className:'parcel-marker',iconSize:[26,34],iconAnchor:[13,31]})}).addTo(map).bindPopup(`<strong>Your location</strong><br>${lat.toFixed(6)}, ${lon.toFixed(6)}<br><small>Nearby records are not a groundwater prediction.</small>`);
  const distance = milesBetween(CENTER[0],CENTER[1],lat,lon);
  $('parcel-message').textContent = distance>50 ? 'This location is outside the 50-mile data area. Nearby results are incomplete and only include the retrieved Texas records.' : 'Nearest records use your current filters. Distance alone does not indicate groundwater potential.';
  setView('map'); map.setView([lat,lon],Math.max(11,map.getZoom()));
  renderNearby();
  if(pickMode) stopPicking();
}
function renderNearby() {
  if(!parcel) { $('nearby-results').innerHTML=''; return; }
  const near = filtered.map(w => ({well:w,dist:milesBetween(parcel.lat,parcel.lon,w.lat,w.lon)})).sort((a,b) => a.dist-b.dist).slice(0,5);
  $('nearby-results').innerHTML = `<div class="nearby-heading"><strong>Nearest visible records</strong><button class="text-button" id="clear-parcel">Clear pin</button></div>${near.length ? near.map(({well:w,dist}) => `<button class="nearby-row" data-well-id="${esc(w.id)}"><span><i class="status-dot ${w.status}"></i><span>${esc(w.report_number || w.id)}<small>${esc(w.source)} · ${finite(w.depth_ft) ? fmt(w.depth_ft)+' ft deep' : 'depth not reported'}</small></span></span><span>${fmt(dist,2)} mi<small>${yieldValue(w) ? esc(yieldValue(w))+' gpm reported' : 'yield not reported'}</small></span></button>`).join('') : '<p class="micro-copy">No visible records. Widen the filters to compare this location.</p>'}<p class="micro-copy">Straight-line distance to recorded coordinates. These may be approximate or duplicate physical wells.</p>`;
  $('clear-parcel').addEventListener('click',() => { parcel=null; if(parcelMarker)map.removeLayer(parcelMarker);parcelMarker=null;renderNearby();$('parcel-message').textContent='Coordinates stay in this browser. This is proximity, not a groundwater prediction.'; });
}
function stopPicking(){pickMode=false;$('pick-location').classList.remove('active');$('pick-location').textContent='⌖ Choose a point on the map';document.body.classList.remove('picking-location');}

function download(format) {
  if(!filtered.length){notify('No records match the current filters.');return;}
  let text, type, extension;
  if(format==='csv'){
    const fields = ['id','source','report_number','lat','lon','depth_ft','yield_gpm','yield_raw','record_kind','is_water_well','water_level_ft','water_level_date','status','positive_yield_evidence','dry_evidence','plugging_evidence','evidence','report_date','well_type','proposed_use','county','aquifer','aquifer_formation','depth_type','distance_miles','failure_reason','location_note','water_quality_note','source_url','data_source_url','data_source_tables','supplemental_source_url'];
    if(parcel) fields.push('distance_from_pin_miles');
    const cell = value => { let s=Array.isArray(value)?value.join(' | '):String(value??''); if (/^[=+@\t\r]/.test(s) || /^-(?!\d)/.test(s)) s="'"+s; return '"'+s.replace(/"/g,'""')+'"'; };
    text='\ufeff'+fields.map(cell).join(',')+'\r\n'+filtered.map(w => fields.map(f => cell(f==='distance_from_pin_miles'?milesBetween(parcel.lat,parcel.lon,w.lat,w.lon).toFixed(4):w[f])).join(',')).join('\r\n');type='text/csv;charset=utf-8';extension='csv';
  } else { text=JSON.stringify({type:'FeatureCollection',metadata:{...metadata,exported_at:new Date().toISOString(),filtered_record_count:filtered.length,description:'Filtered historical source records; not a prediction. Locations and outcomes may be incomplete.'},features:filtered.map(w => ({type:'Feature',id:w.id,geometry:{type:'Point',coordinates:[w.lon,w.lat]},properties:{...w,...(parcel?{distance_from_pin_miles:milesBetween(parcel.lat,parcel.lon,w.lat,w.lon)}:{})}}))},null,2);type='application/geo+json';extension='geojson'; }
  const url=URL.createObjectURL(new Blob([text],{type})),a=document.createElement('a');a.href=url;a.download=`terlingua-records-${new Date().toISOString().slice(0,10)}.${extension}`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);closeExport();notify(`Exported ${filtered.length.toLocaleString()} source records.`);
}
function closeExport(){$('export-menu').hidden=true;$('export-open').setAttribute('aria-expanded','false');}

function populateMetadata(){
  populateStats();
  [...new Set(wells.map(w=>w.source))].sort().forEach(s=>{const opt=document.createElement('option');opt.value=s;opt.textContent=`${s} · ${sourceName(s)}`;$('source-filter').append(opt);});
  const sources = Array.isArray(metadata.sources) ? metadata.sources : [];
  const retrieved=metadata.retrieved_at || metadata.retrieval_date || metadata.retrieved_utc || metadata.generated_at || metadata.retrieved_at_utc;
  let dateText='';if(retrieved){const d=new Date(/^\d{4}-\d{2}-\d{2}$/.test(retrieved)?retrieved+'T12:00:00Z':retrieved);dateText=Number.isNaN(d.getTime())?String(retrieved):d.toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric',timeZone:'America/Chicago'});}
  $('data-provenance').innerHTML=`<p><strong>${wells.length.toLocaleString()} source records</strong>${dateText?` · retrieved ${esc(dateText)}`:''}.</p>${sources.map(s=>`<p>${safeUrl(s.url)?`<a href="${esc(safeUrl(s.url))}" target="_blank" rel="noopener noreferrer">${esc(s.name || s.source || 'Source')} ↗</a>`:esc(s.name||s.source||'Source')}${finite(s.record_count)?` · ${fmt(s.record_count,0)} records`:''}</p>`).join('')}<p><a href="data/wells.json" download="terlingua-source-records.json">Download full extracted record snapshot · JSON ↓</a></p>`;
}

function populateStats(){
  const scope=scopedWells();
  $('stat-total').textContent=scope.length.toLocaleString();
  document.querySelector('.total-stat span').textContent=$('kind-filter').value==='water_well'?'water-well records':'site records';
  for(const status of Object.keys(COLORS)){const n=scope.filter(w=>w.status===status).length;$(`count-${status}`).textContent=n.toLocaleString();if(status==='positive_yield')$('stat-yield').textContent=n.toLocaleString();if(status==='dry')$('stat-dry').textContent=n.toLocaleString();}
  const depths=scope.filter(w=>isWaterWell(w)&&w.source!=='Plugging'&&finite(w.depth_ft)&&w.depth_ft>0).map(w=>Number(w.depth_ft)).sort((a,b)=>a-b);
  $('stat-depth').textContent=depths.length?fmt(depths.length%2?depths[(depths.length-1)/2]:(depths[depths.length/2-1]+depths[depths.length/2])/2,0):'—';
}

function addContextControls(){
  const box=document.createElement('details');box.className='context-controls';box.innerHTML='<summary>☷ Regional layers</summary><div>'+Object.entries(contextLayers).map(([key,item])=>`<label><input type="checkbox" data-context-layer="${key}">${item.name}</label>`).join('')+'<button class="text-button" id="layer-legend-open">Map legend &amp; limits ↗</button><p>Regional context, not parcel boundaries.</p></div>';$('map-stage').append(box);
  box.querySelectorAll('input').forEach(input=>input.addEventListener('change',()=>{const item=contextLayers[input.dataset.contextLayer];if(input.checked)item.layer.addTo(map);else map.removeLayer(item.layer);}));
  const dialog=document.createElement('dialog');dialog.id='context-dialog';dialog.innerHTML='<div class="dialog-header"><div><div class="eyebrow">REGIONAL CONTEXT</div><h2>Read the landscape.</h2></div><button class="close-button" id="context-close" aria-label="Close map legends">×</button></div><div class="dialog-content"><p class="context-description">Surface geology is mapped at 1:250,000 scale. Colors describe rock units, not drilling potential. Minor-aquifer outlines describe regional aquifers; unshaded ground can still contain water. These layers do not resolve subsurface fractures or parcel boundaries.</p><p class="context-description">Use the topographic basemap for terrain and mapped drainage. A mapped channel does not imply year-round water.</p><p class="context-description"><a href="https://www.twdb.texas.gov/groundwater/aquifer/GAT/index.asp" target="_blank" rel="noopener noreferrer">Geologic Atlas of Texas and formation descriptions ↗</a></p><label class="field-label" for="legend-search">Filter statewide legend by rock-unit code or aquifer name</label><input id="legend-search" class="legend-search" placeholder="Search legend…"><div id="context-legend"><p>Loading source legends…</p></div></div>';
  document.body.append(dialog);$('context-close').addEventListener('click',()=>dialog.close());dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
  let entries=null;
  $('layer-legend-open').addEventListener('click',async()=>{dialog.showModal();if(entries)return;try{const results=await Promise.all(Object.values(contextLayers).map(async layer=>{const r=await fetch(`${CONTEXT_BASE}${layer.service}/MapServer/legend?f=json`);if(!r.ok)throw new Error('Legend unavailable');const json=await r.json();return {name:layer.name,entries:(json.layers||[]).flatMap(l=>l.legend||[])};}));entries=results;renderLegend();}catch{$('context-legend').innerHTML='<p>Live legends could not load. The overlay colors should not be interpreted without their source legend. <a href="https://www.twdb.texas.gov/groundwater/aquifer/GAT/index.asp" target="_blank" rel="noopener noreferrer">Open TWDB geology documentation ↗</a></p>';}});
  function renderLegend(){const term=$('legend-search').value.toLowerCase();$('context-legend').innerHTML=entries.map(group=>`<h3>${esc(group.name)}</h3><div class="legend-grid">${group.entries.filter(e=>e.label.toLowerCase().includes(term)).map(e=>`<div>${e.imageData&&/^[A-Za-z0-9+/=]+$/.test(e.imageData)?`<img src="data:image/png;base64,${e.imageData}" alt="">`:''}<span>${esc(e.label)}</span></div>`).join('')}</div>`).join('');}
  $('legend-search').addEventListener('input',()=>{if(entries)renderLegend();});
}

for(const id of ['search','min-depth','max-depth']) $(id).addEventListener('input',applyFilters);
$('source-filter').addEventListener('change',applyFilters);document.querySelectorAll('.status-filters input').forEach(input=>input.addEventListener('change',applyFilters));
$('kind-filter').addEventListener('change',()=>{populateStats();applyFilters();});
$('reset-filters').addEventListener('click',()=>{for(const id of ['search','min-depth','max-depth','source-filter'])$(id).value='';$('kind-filter').value='water_well';populateStats();document.querySelectorAll('.status-filters input').forEach(input=>input.checked=true);applyFilters();});
$('map-view-button').addEventListener('click',()=>setView('map'));$('table-view-button').addEventListener('click',()=>setView('table'));
$('basemap').addEventListener('change',event=>{Object.values(basemaps).forEach(layer=>map.removeLayer(layer));basemaps[event.target.value].addTo(map);basemaps[event.target.value].bringToBack();});
$('fit-map').addEventListener('click',fitStudy);
document.querySelectorAll('[data-sort]').forEach(button=>button.addEventListener('click',()=>{const field=button.dataset.sort;sortDirection=sortField===field?-sortDirection:1;sortField=field;page=0;renderTable();}));
$('page-prev').addEventListener('click',()=>{page--;renderTable();});$('page-next').addEventListener('click',()=>{page++;renderTable();});
document.addEventListener('click',event=>{const record=event.target.closest('[data-well-id]');if(record)showWell(record.dataset.wellId);if(!event.target.closest('.export-wrap'))closeExport();});
$('parcel-form').addEventListener('submit',event=>{event.preventDefault();selectParcel(Number($('parcel-lat').value),Number($('parcel-lon').value));});
$('pick-location').addEventListener('click',()=>{if(pickMode){stopPicking();return;}pickMode=true;setView('map');$('pick-location').classList.add('active');$('pick-location').textContent='Click the map · cancel';document.body.classList.add('picking-location');notify('Click a location on the map to compare nearby records.');if(window.innerWidth<621)$('map-stage').scrollIntoView({behavior:'smooth',block:'start'});});
map.on('click',event=>{if(pickMode)selectParcel(event.latlng.lat,event.latlng.lng);});
$('export-open').addEventListener('click',()=>{const hidden=!$('export-menu').hidden;$('export-menu').hidden=hidden;$('export-open').setAttribute('aria-expanded',String(!hidden));});
$('export-csv').addEventListener('click',()=>download('csv'));$('export-geojson').addEventListener('click',()=>download('geojson'));
for(const id of ['methods-open','limitations-open'])$(id).addEventListener('click',()=>$('methods-dialog').showModal());$('methods-close').addEventListener('click',()=>$('methods-dialog').close());
$('methods-dialog').addEventListener('click',event=>{if(event.target===$('methods-dialog')){const r=$('methods-dialog').getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)$('methods-dialog').close();}});
document.addEventListener('keydown',event=>{if(event.key==='Escape'){stopPicking();closeExport();}});
addContextControls();

(async function loadData(){
  try{
    const response=await fetch('data/wells.json');if(!response.ok)throw new Error(`Data request failed (${response.status})`);
    const data=await response.json();metadata=data.metadata||{};if(!Array.isArray(data.wells))throw new Error('Invalid record data');
    wells=data.wells.filter(w=>finite(w.lat)&&finite(w.lon)&&Math.abs(w.lat)<=90&&Math.abs(w.lon)<=180).map(w=>({...w,id:String(w.id),lat:Number(w.lat),lon:Number(w.lon),status:Object.hasOwn(COLORS,w.status)?w.status:'unknown'}));
    populateMetadata();applyFilters();$('loading-state').hidden=true;
    await initializeSearchAreas();
  }catch(error){$('loading-state').innerHTML=`<div class="error-state"><strong>Well records could not load.</strong><p>The atlas requires its extracted <code>data/wells.json</code> file and a local or hosted web server. No sample records have been substituted.</p><p>${esc(error.message)}</p><button class="outline-button" onclick="location.reload()">Try again</button></div>`;$('results-summary').textContent='Record data unavailable';}
})();
