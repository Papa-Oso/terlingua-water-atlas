'use strict';

// Curated search envelopes are a separate layer from the source well records.
async function initializeSearchAreas() {
  const intro = document.getElementById('search-areas-intro');
  try {
    const response = await fetch('data/search-areas.json');
    if (!response.ok) throw new Error('Search-area data is unavailable.');
    const data = await response.json();
    const areas = (Array.isArray(data.areas) ? data.areas : []).filter(area =>
      area.id && Array.isArray(area.bounds) && area.bounds.length === 2 &&
      area.bounds.every(point => Array.isArray(point) && point.length === 2 && point.every(Number.isFinite))
    ).sort((a,b) => a.rank-b.rank);
    if (!areas.length) throw new Error('No search areas are available.');

    const colors = ['#4c6d9b','#a06831','#725a8f'];
    const areaColor = (area,index) => /^#[0-9a-f]{6}$/i.test(area.color || '') ? area.color : colors[index % colors.length];
    const currency = value => finite(value) ? '$'+fmt(value,0) : esc(value || 'Price not stated');
    const hasPoint = item => finite(item.lat) && finite(item.lon) && Math.abs(Number(item.lat)) <= 90 && Math.abs(Number(item.lon)) <= 180;
    const checkedDate = /^\d{4}-\d{2}-\d{2}$/.test(data.checked_at || '') ? new Date(data.checked_at+'T12:00:00Z').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric',timeZone:'UTC'}) : data.checked_at;

    intro.textContent = data.intro || 'Three places to begin comparing land, water evidence, and access. Numbers show our search order, not a water score.';
    map.createPane('search-area-shapes');
    map.getPane('search-area-shapes').style.zIndex = '350';
    const areaLayer = L.layerGroup().addTo(map);
    const listingLayer = L.layerGroup().addTo(map);
    const shapes = new Map();

    $('search-area-cards').innerHTML = areas.map((area,index) => `<button class="search-area-card" data-search-area="${esc(area.id)}" aria-pressed="false" style="--area-color:${areaColor(area,index)}"><span class="area-number">${esc(area.rank || index+1)}</span><span class="area-card-copy"><span class="area-card-angle">${esc(area.angle || 'Land-search lead')}</span><strong>${esc(area.name)}</strong></span><span class="area-card-arrow" aria-hidden="true">↗</span></button>`).join('');

    areas.forEach((area,index) => {
      const color = areaColor(area,index);
      const shape = L.rectangle(area.bounds,{pane:'search-area-shapes',color,weight:2,dashArray:'7 5',fillColor:color,fillOpacity:.06});
      shape.bindTooltip(`${esc(area.rank || index+1)} · ${esc(area.name)}<br><small>Approximate search area · click to explore</small>`,{sticky:true});
      shape.on('click',() => { if (!pickMode) selectArea(area.id); });
      shape.addTo(areaLayer);
      shapes.set(area.id,shape);
      L.marker([area.bounds[1][0],area.bounds[0][1]],{
        icon:L.divIcon({className:'search-area-label',html:`<span style="--area-color:${color}">${esc(area.rank || index+1)}</span>`,iconSize:[30,30],iconAnchor:[15,15]}),
        title:`Search area ${area.rank || index+1}: ${area.name}`,keyboard:true,zIndexOffset:300
      }).on('click',() => { if (!pickMode) selectArea(area.id); }).addTo(areaLayer);
      (area.listings || []).forEach((listing,listingIndex) => {
        if (!hasPoint(listing)) return;
        const label = `${area.rank || index+1}${String.fromCharCode(97+listingIndex)}`;
        const url = safeUrl(listing.url);
        L.marker([Number(listing.lat),Number(listing.lon)],{
          icon:L.divIcon({className:'listing-map-marker',html:`<span style="--area-color:${color}">${esc(label)}</span>`,iconSize:[28,25],iconAnchor:[14,12]}),
          title:`Listing lead: ${listing.title}`,zIndexOffset:200
        }).bindPopup(`<div class="popup-eyebrow">SELLER LISTING · APPROXIMATE LOCATION</div><div class="popup-title">${esc(listing.title)}</div><p>${currency(listing.price)} asking${finite(listing.acres)?` · ${fmt(listing.acres)} acres`:''}</p><p>${esc(listing.location_note || 'Seller-provided location; this point is not a surveyed parcel boundary.')}</p>${listing.water_note?`<p>${esc(listing.water_note)}</p>`:''}${url?`<a class="popup-link" href="${esc(url)}" target="_blank" rel="noopener noreferrer">Open listing source ↗</a>`:''}<p class="popup-footnote">Asking price, not a sold comparable. Nearby wells do not establish water on this parcel.</p>`,{maxWidth:320}).addTo(listingLayer);
      });
    });

    $('area-map-bar').hidden = false;
    $('search-outline-key').hidden = false;

    function setOverviewState(isOverview,isStudy=false) {
      $('areas-overview').classList.toggle('selected',isOverview);
      $('areas-study').classList.toggle('selected',isStudy);
      $('areas-overview').setAttribute('aria-pressed',String(isOverview));
      $('areas-study').setAttribute('aria-pressed',String(isStudy));
    }
    function ensureVisible() {
      $('areas-visible').checked = true;
      $('search-outline-key').hidden = false;
      if (!map.hasLayer(areaLayer)) areaLayer.addTo(map);
      if (!map.hasLayer(listingLayer)) listingLayer.addTo(map);
    }
    function overview() {
      setView('map');
      ensureVisible();
      const bounds = L.latLngBounds(areas.flatMap(area => area.bounds));
      map.stop();
      map.invalidateSize();
      map.fitBounds(bounds,{paddingTopLeft:[45,75],paddingBottomRight:[45,105],maxZoom:11,animate:false});
      setOverviewState(true);
    }
    function clearSelection() {
      $('search-area-detail').hidden = true;
      document.querySelectorAll('[data-search-area]').forEach(button => button.setAttribute('aria-pressed','false'));
      shapes.forEach(shape => shape.setStyle({weight:2,fillOpacity:.06}));
    }
    function selectArea(id) {
      const area = areas.find(item => item.id === id);
      if (!area) return;
      setView('map');
      ensureVisible();
      setOverviewState(false);
      map.fitBounds(area.bounds,{paddingTopLeft:[40,75],paddingBottomRight:[40,110],maxZoom:13});
      shapes.forEach((shape,key) => shape.setStyle({weight:key===id?3:2,fillOpacity:key===id?.12:.035}));
      document.querySelectorAll('[data-search-area]').forEach(button => button.setAttribute('aria-pressed',String(button.dataset.searchArea===id)));
      const records = Array.isArray(area.records) ? area.records : [];
      const listings = Array.isArray(area.listings) ? area.listings : [];
      const panel = $('search-area-detail');
      panel.style.setProperty('--area-color',areaColor(area,areas.indexOf(area)));
      panel.innerHTML = `<div class="area-detail-heading"><span class="eyebrow">SEARCH AREA ${esc(area.rank || areas.indexOf(area)+1)}</span><button class="text-button" id="close-area-detail" aria-label="Close selected area details">×</button></div><h3>${esc(area.name)}</h3><p class="area-detail-summary">${esc(area.summary)}</p><dl class="area-detail-facts"><div><dt>Water evidence</dt><dd>${esc(area.water_summary)}</dd></div><div><dt>Road access</dt><dd>${esc(area.access_summary)}</dd></div></dl><p class="area-caution"><strong>Keep in mind</strong>${esc(area.caution)}</p>${records.length?`<details class="area-evidence-details"><summary>Inspect ${records.length} cited well records</summary><div class="area-record-links">${records.map(record=>`<button class="text-button" data-well-id="${esc(record.id)}"><strong>${esc(record.id)}</strong><span>${esc(record.label || 'Open the documented evidence')} ↗</span></button>`).join('')}</div><p class="micro-copy">Historical source records may refer to the same well. Nearby evidence does not establish water on a listed parcel.</p></details>`:''}${listings.length?`<details class="area-listings-details" open><summary>${listings.length===1?'Asking-price example':`${listings.length} asking-price examples`}</summary><p class="area-listing-date">Sources checked ${esc(checkedDate || 'as noted')}. Availability can change.</p>${listings.map((listing,index)=>`<article class="area-listing"><div class="area-listing-price">${currency(listing.price)} <span>asking${finite(listing.acres)?` · ${fmt(listing.acres)} ac`:''}</span></div>${finite(listing.price_per_acre)?`<div class="area-price-acre">${currency(listing.price_per_acre)} / acre</div>`:''}${safeUrl(listing.url)?`<a class="area-listing-link" href="${esc(safeUrl(listing.url))}" target="_blank" rel="noopener noreferrer">${esc(listing.title)} ↗</a>`:`<strong class="area-listing-link">${esc(listing.title)}</strong>`}${listing.access?`<p>${esc(listing.access)}</p>`:''}${listing.water_note?`<p>${esc(listing.water_note)}</p>`:''}${listing.availability_note?`<p>${esc(listing.availability_note)}</p>`:''}${listing.location_note?`<p class="area-location-note">${hasPoint(listing)?`Map pin ${esc(area.rank || areas.indexOf(area)+1)}${String.fromCharCode(97+index)} · `:''}${esc(listing.location_note)}</p>`:''}</article>`).join('')}<p class="micro-copy">Asking prices, not sold comparables. Listing descriptions are seller claims.</p></details>`:''}`;
      panel.hidden = false;
      $('close-area-detail').addEventListener('click',clearSelection);
      if (window.innerWidth > 620) panel.scrollIntoView({behavior:'smooth',block:'start'});
    }

    $('search-area-cards').addEventListener('click',event => {
      const card = event.target.closest('[data-search-area]');
      if (card) selectArea(card.dataset.searchArea);
    });
    $('areas-overview').addEventListener('click',() => { clearSelection();overview(); });
    $('areas-study').addEventListener('click',() => { clearSelection();setView('map');fitStudy();setOverviewState(false,true); });
    $('fit-map').addEventListener('click',() => { clearSelection();setOverviewState(false,true); });
    $('areas-visible').addEventListener('change',event => {
      for (const layer of [areaLayer,listingLayer]) {
        if (event.target.checked) layer.addTo(map); else map.removeLayer(layer);
      }
      $('search-outline-key').hidden = !event.target.checked;
    });
    overview();
  } catch (error) {
    intro.textContent = 'The land-search shortlist could not load. The documented well map remains available below.';
    $('search-area-cards').innerHTML = '<button class="text-button small" onclick="location.reload()">Reload shortlist ↻</button>';
  }
}
