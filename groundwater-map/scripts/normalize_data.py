"""Build the map payload from locally preserved official TWDB extracts.

Only exact numeric yield values (including unambiguous fractions) enter yield_gpm.
Ranges and thresholds retain yield_raw and interval bounds; they are not averaged.
No status represents present operation, potable water, or predicted drilling success.
"""
from pathlib import Path
import json,math,re,collections,datetime,statistics,csv,hashlib
ROOT=Path(__file__).resolve().parents[1];RAW=ROOT/'raw';OUT=ROOT/'dist'/'data';OUT.mkdir(parents=True,exist_ok=True)
BASE='https://services.twdb.texas.gov/arcgis/rest/services/Public/'
CENTER=(29.3216,-103.6160)
def read(name):return json.loads((RAW/name).read_text(encoding='utf-8-sig'))
def rows(source,table):return read('local_'+('GWDBDownload' if source=='GWDB' else 'SDRDownload')+'_'+table+'.json')
def index(a,key):
    d=collections.defaultdict(list)
    for r in a:d[r[key]].append(r)
    return d
def number(v):
    try:
        n=float(str(v).strip());return n if math.isfinite(n) else None
    except (ValueError,TypeError):return None
def distance(lat,lon):
    a,b=map(math.radians,CENTER);c,d=map(math.radians,(lat,lon));h=math.sin((c-a)/2)**2+math.cos(a)*math.cos(c)*math.sin((d-b)/2)**2
    return 3958.7613*2*math.asin(min(1,math.sqrt(h)))
def parse_yield(v):
    v=(v or '').strip();n=number(v);qual='exact'
    if n is not None and n>=0:return n,n,n,qual
    if re.fullmatch(r'(\d+ )?\d+/\d+',v):
        parts=v.split();frac=parts[-1].split('/');n=(int(parts[0]) if len(parts)==2 else 0)+int(frac[0])/int(frac[1]);return n,n,n,'fraction'
    m=re.fullmatch(r'(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)',v)
    if m:return None,float(m[1]),float(m[2]),'range'
    m=re.fullmatch(r'(\d+(?:\.\d+)?)\s*\+',v)
    if m:return None,float(m[1]),None,'at_least'
    m=re.fullmatch(r'<\s*(\d+(?:\.\d+)?)',v)
    if m:return None,None,float(m[1]),'less_than'
    return None,None,None,'unparsed' if v else 'missing'
def date_parts(r,prefix):
    full=r.get(prefix+'Date','')
    if full:return full[:10]
    parts=[r.get(prefix+k,'') for k in ['Year','Month','Day']]
    if not parts[0]:return None
    try:return '-'.join([str(int(parts[0]))]+[str(int(p)).zfill(2) for p in parts[1:] if p])
    except ValueError:return None
def test_row(r,source,default_date):
    n,lo,hi,q=parse_yield(r.get('Yield'))
    return {'yield_raw':r.get('Yield') or None,'yield_gpm':n,'yield_min_gpm':lo,'yield_max_gpm':hi,'qualifier':q,'method':r.get('TestType') or None,'method_other':r.get('TestTypeOtherDesc') or None,'date':date_parts(r,'WellTest') if source=='GWDB' else default_date,'date_note':'Test date' if source=='GWDB' else 'Completion date; test date not separately supplied','drawdown_ft':number(r.get('Drawdown')),'drawdown_raw':r.get('Drawdown') or None,'duration_hours':number(r.get('Hours')),'duration_raw':r.get('Hours') or None}
def kind(t):
    s=t.lower()
    if 'spring' in s and 'not a spring' not in s:return 'spring'
    if 'surface water' in s:return 'surface_water'
    if 'oil or gas' in s:return 'oil_gas'
    if 'soil boring' in s:return 'soil_boring'
    if 'monitor' in s or 'observation' in s:return 'monitoring'
    if 'test' in s:return 'test_hole'
    return 'water_well'
main={'SDR':index(rows('SDR','WellData'),'WellReportTrackingNumber'),'GWDB':index(rows('GWDB','WellMain'),'StateWellNumber'),'Plugging':index(rows('Plugging','PlugData'),'PluggingReportTrackingNumber')}
tests={'SDR':index(rows('SDR','WellTest'),'WellReportTrackingNumber'),'GWDB':index(rows('GWDB','WellTest'),'StateWellNumber')}
levels={'SDR':index(rows('SDR','WellLevels'),'WellReportTrackingNumber'),'GWDB':index(sum([rows('GWDB',t) for t in ['WaterLevelsCombination','WaterLevelsMajor','WaterLevelsMinor','WaterLevelsOtherUnassigned']],[]),'StateWellNumber')}
injury=index(rows('SDR','WellInjuriousConstituent'),'WellReportTrackingNumber')
services={'SDR':('WellReports','WellReportTrackingNumber'),'GWDB':('TWDB_Groundwater_database','StateWellNumber'),'Plugging':('PluggingReports','PluggingReportTrackingNumber')}
all_records=[];sources=[]
for source,(service,key) in services.items():
    features=read(service+'_features.json');selected=[]
    for f in features:
        a=f['attributes'];lat,lon=f['geometry']['y'],f['geometry']['x'];mi=distance(lat,lon)
        if mi>50:continue
        ident=a[key];assert ident in main[source],(source,ident)
        r=main[source][ident][0];comments=(r.get('Remarks') or r.get('Comments') or '').strip()
        well_type=r.get('WellType') if source=='GWDB' else (r.get('ProposedUse') if source=='SDR' else r.get('OriginalWellUse'))
        record_kind=kind(well_type or '')
        date=(r.get('DrillingEndDate') or date_parts(r,'Drilling')) if source=='GWDB' else r.get('DrillingEndDate') if source=='SDR' else r.get('PluggingDate')
        tt=[test_row(t,source,date) for t in tests.get(source,{}).get(ident,[])]
        tt.sort(key=lambda t:t['date'] or '',reverse=True)
        informative=[t for t in tt if t['qualifier'] not in ['missing','unparsed']]
        display=informative[0] if informative else (tt[0] if tt else {})
        positive=any((t['yield_min_gpm'] or 0)>0 for t in tt)
        dry=bool(re.search(r'\bdry (?:bore\s*)?hole\b|\bdry well\b|bore\s*hole is dry|water level:\s*dry',comments,re.I)) or any((t['yield_raw'] or '').upper()=='DRY' for t in tt)
        plugged=source=='Plugging' or bool(r.get('PluggingReportTrackingNumber')) or r.get('WellUse')=='Plugged or Destroyed' or r.get('PluggedWithin48Hrs')=='Yes'
        status='plugged_abandoned' if plugged else 'dry' if dry else 'positive_yield' if positive else 'unknown'
        ev=[]
        for t in tt:
            if t['yield_raw']:ev.append(f"Reported yield: {t['yield_raw']} gpm; method: {t['method'] or 'unspecified'}; date: {t['date'] or 'not supplied'}.")
        if comments:ev.append('Source remarks: '+comments)
        if source=='Plugging':ev.insert(0,'Official plugging report; reason is not necessarily lack of water.')
        if r.get('WellUse'):ev.append('Recorded use/status: '+r['WellUse']+'.')
        if r.get('PluggingReportTrackingNumber'):ev.append('Linked plugging report: '+r['PluggingReportTrackingNumber']+'.')
        if r.get('PluggedWithin48Hrs')=='Yes':ev.append('Driller reports plugged within 48 hours.')
        ll=[]
        for l in levels.get(source,{}).get(ident,[]):
            val=number(l.get('DepthFromLSD',l.get('Measurement')))
            if val is None:continue
            ll.append({'depth_ft':val,'date':date_parts(l,'Measurement'),'method':l.get('MethodOfMeasurement',l.get('MeasurementMethod')),'status':l.get('Status'),'remarks':l.get('Remarks') or l.get('Comments') or None})
        ll.sort(key=lambda l:l['date'] or '',reverse=True)
        # Questionable/not-publishable observations remain in the source snapshots,
        # but do not silently become the displayed representative water level.
        eligible=[l for l in ll if l['status'] in (None,'','Publishable')]
        level=eligible[0] if eligible else {}
        quality='Water safety is not established by these records.'
        if source=='GWDB' and r.get('WaterQualityAvailable')=='Yes':quality='TWDB indicates water-quality data exist; chemistry has not been evaluated in this map.'
        if source=='SDR':
            if r.get('InjuriousWater')=='Yes':quality='Driller reports penetrating strata with injurious constituents; this is a water-quality concern, not a laboratory potability determination.'
            elif r.get('InjuriousWater')=='No':quality='Driller did not report injurious strata; this does not establish drinking-water safety.'
        depth=number(r.get('WellDepth')) if source=='GWDB' else number(a.get('BoreholeDepthFt'))
        if depth is not None and depth<=0:depth=None
        location=(r.get('CoordinateSource') if source=='GWDB' else 'SDR locations are not verified by state staff; source datum: '+(r.get('HorizontalDatumType') or 'unspecified')+'.')
        if source=='SDR' and r.get('KnownLocationError')=='Yes':location+=' Known location error flagged by source.'
        rec={'id':source+'-'+ident,'source':source,'report_number':ident,'lat':round(lat,7),'lon':round(lon,7),'distance_miles':round(mi,4),'depth_ft':depth,'depth_type':'Reported total well depth' if source=='GWDB' else 'Reported borehole depth','yield_gpm':display.get('yield_gpm'),'yield_raw':display.get('yield_raw'),'yield_min_gpm':display.get('yield_min_gpm'),'yield_max_gpm':display.get('yield_max_gpm'),'yield_qualifier':display.get('qualifier'),'status':status,'positive_yield_evidence':positive,'dry_evidence':dry,'plugging_evidence':plugged,'evidence':ev,'source_url':BASE+service+'/FeatureServer/0/'+str(a['ObjectId']),'report_date':date or None,'well_tests':tt,'water_level_ft':level.get('depth_ft'),'water_level_date':level.get('date'),'water_level_method':level.get('method'),'water_level_remarks':level.get('remarks'),'water_level_measurement_count':len(ll),'water_levels':ll,'county':r.get('County') or a.get('CountyName'),'aquifer':r.get('Aquifer') or None,'aquifer_formation':r.get('AquiferCodeDescription') or None,'well_type':well_type or None,'proposed_use':r.get('ProposedUse') or r.get('WellUse') or r.get('OriginalWellUse') or None,'record_kind':record_kind,'is_water_well':record_kind=='water_well','work_type':r.get('TypeOfWork') or None,'remarks':comments or None,'location_note':location,'water_quality_note':quality,'water_quality_flag':r.get('InjuriousWater')=='Yes','failure_reason':comments if dry else None,'related_sdr_report':r.get('WellReportTrackingNumber') if source!='SDR' else None,'related_plugging_report':r.get('PluggingReportTrackingNumber') if source!='Plugging' else None}
        if source=='SDR' and injury.get(ident):rec['injurious_constituents']=injury[ident]
        selected.append(rec);all_records.append(rec)
    sources.append({'name':{'SDR':'TWDB Submitted Drillers Reports','GWDB':'TWDB Groundwater Database','Plugging':'TWDB Plugging Reports'}[source],'id':source,'url':BASE+service+'/FeatureServer/0','record_count':len(selected),'bounding_box_records':len(features),'matching_bulk_records':sum(1 for w in selected if w['report_number'] in main[source])})
# Explicitly reviewed textual evidence can be reapplied reproducibly.
override_path=ROOT/'scripts'/'remarks_classification.json'
if override_path.exists():
    review=json.loads(override_path.read_text(encoding='utf-8'));lookup={w['id']:w for w in all_records}
    for o in review['records']:
        w=lookup.get(o['source']+'-'+o['id'])
        if not w:continue
        outcome=o['outcome'];w['reviewed_outcome']=outcome;w['outcome_label']=o['label']
        if outcome in ['reported_closed','reported_abandoned','reported_abandoned_source']:
            w['status']='plugged_abandoned';w['plugging_evidence']=True
        if w['id'] in ['GWDB-7430414','GWDB-7430415','GWDB-7430419']:
            w['status']='plugged_abandoned';w['plugging_evidence']=True
        if w['id']=='GWDB-7430415':w['failure_reason']='Source remarks report abandonment after drilling because of insufficient supply.'
        if outcome in ['reported_dry','historical_dry']:
            w['dry_evidence']=True
            if w['status']!='plugged_abandoned':w['status']='dry'
            w['failure_reason']=o['evidence']
        if outcome=='reported_quality_issue':
            w['water_quality_flag']=True;w['water_quality_note']='Historical source reports a quality concern: '+o['evidence']
        w['exclude_from_new_water_supply_trial']=o.get('exclude_from_new_water_supply_trial',False)
    for ref in review['supported_cross_references']:
        for source in ['SDR','GWDB']:
            w=lookup.get(source+'-'+ref[source])
            if w:w.setdefault('cross_references',[]).append({'id':('GWDB' if source=='SDR' else 'SDR')+'-'+ref['GWDB' if source=='SDR' else 'SDR'],'evidence':ref['evidence']})
    for o in review['historical_supplement']:
        w=lookup.get(o['source']+'-'+o['id'])
        if w:
            summary='TWDB Report 323 (1990), printed page 33, reports historical yield of 15-18 gpm; the well was abandoned in the early 1980s and its water was described as unsuitable for drinking.'
            w['status']='plugged_abandoned';w['outcome_label']='Historical abandonment and poor water quality';w['water_quality_flag']=True;w['water_quality_note']=summary;w['supplemental_source_url']=o['reference'];w['evidence'].append(summary);w['plugging_evidence']=True
lookup={w['id']:w for w in all_records}
narrative_path=ROOT/'scripts'/'narrative_yields.json'
if narrative_path.exists():
    for o in json.loads(narrative_path.read_text(encoding='utf-8')):
        w=lookup[o['id']];n,lo,hi,q=parse_yield(o['yield_raw'])
        if o['yield_raw'].startswith('+/-'):q='approximate'
        t={'yield_raw':o['yield_raw'],'yield_gpm':n,'yield_min_gpm':lo,'yield_max_gpm':hi,'qualifier':q,'method':o['method'],'date':o['date'],'date_note':o['date_note'],'source_field':'Remarks','evidence':o['evidence'],'drawdown_ft':None,'duration_hours':None}
        w['well_tests'].append(t);w['positive_yield_evidence']=True
        if w['status']=='unknown':w['status']='positive_yield'
    for w in all_records:
        w['well_tests'].sort(key=lambda t:t['date'] or '',reverse=True)
        if any(t.get('source_field')=='Remarks' for t in w['well_tests']):
            t=next(t for t in w['well_tests'] if t.get('yield_raw'))
            for field in ['yield_gpm','yield_raw','yield_min_gpm','yield_max_gpm']:w[field]=t.get(field)
            w['yield_qualifier']=t.get('qualifier')
for w in all_records:
    if w['id']=='GWDB-7430419':w['status']='plugged_abandoned';w['plugging_evidence']=True;w['outcome_label']='Reported destroyed'
    w['data_source_url']='https://www.twdb.texas.gov/groundwater/data/'+('GWDBDownload.zip' if w['source']=='GWDB' else 'SDRDownload.zip')
    w['data_source_tables']='WellMain, WellTest, WaterLevels tables' if w['source']=='GWDB' else 'PlugData' if w['source']=='Plugging' else 'WellData, WellTest, WellLevels'
    if not w['evidence']:w['evidence']=['No yield or outcome evidence was available in the retrieved source tables.']
counts=dict(collections.Counter(w['status'] for w in all_records))
well_depths=[w['depth_ft'] for w in all_records if w['is_water_well'] and w['source']!='Plugging' and w['depth_ft'] is not None]
metadata={'title':'Terlingua groundwater evidence map','schema_version':1,'retrieved_at':'2026-10-23','center':{'lat':CENTER[0],'lon':CENTER[1],'name':'Terlingua Ghost Town, Texas','source_url':'https://www.tshaonline.org/handbook/entries/terlingua-tx'},'radius_miles':50,'radius_meters':80467.2,'distance_method':'Haversine great-circle distance, mean Earth radius 3958.7613 statute miles; rounded town center','record_count':len(all_records),'counts':counts,'status_counts':counts,'source_counts':dict(collections.Counter(w['source'] for w in all_records)),'record_kind_counts':dict(collections.Counter(w['record_kind'] for w in all_records)),'water_well_record_count':sum(w['is_water_well'] for w in all_records),'depth_summary':{'count':len(well_depths),'median_ft':statistics.median(well_depths),'min_ft':min(well_depths),'max_ft':max(well_depths),'scope':'Water-well source records excluding separate plugging reports; may include duplicate physical wells'},'sources':sources,'limitations':['Counts describe source records, not unique physical wells; SDR and GWDB can document the same well. Plugging reports may also refer to a mapped well report.','Positive yield is historical reported flow, including driller estimates; it does not establish present capacity, sustainable yield, or safe drinking water.','Dry status requires explicit source wording; zero, negative, missing, or unparsed yields alone are not treated as dry. Capped for possible re-entry alone is not a dry outcome.','Plugged/abandoned status does not by itself explain the reason. Dry and historical yield evidence are preserved even where a plugging status takes precedence.','Springs, observation sites, test holes, oil/gas holes and surface-water records occur in the source databases; record type is retained.','SDR coordinates are unverified and may be wrong. Source coordinate datums and uncertainty vary; recorded coordinates are used as exposed by the TWDB map service.','GWDB and SDR are incomplete inventories; failed holes and older reports may be missing. This dataset cannot establish a drilling success rate.','No predictive probability or new-well depth is estimated. Well density and nearby depth patterns are observational evidence only.','Public Texas records cover only part of the 50-mile circle, which extends into Mexico.','GWDB historical yields mentioned only in narrative remarks are preserved in evidence but not automatically converted to numeric yield fields.'],'classification_rules':{'positive_yield':'A structured WellTest value has a positive numeric value or strictly positive lower bound; may be estimated.','dry':'Explicit dry hole/well/borehole or dry water-level wording, or a WellTest yield value DRY.','plugged_abandoned':'Official plugging record, linked plugging report, declared plugging, GWDB Plugged or Destroyed use, or manually reviewed explicit abandonment/closure evidence.','unknown':'The retrieved evidence does not support one of the other categories.'}}
all_records.sort(key=lambda w:(w['distance_miles'],w['id']))
manifest=read('download_manifest.json')
times=[f['retrieved_utc'] for f in manifest['files']]
metadata['snapshot_started_at_utc']=min(times)
metadata['snapshot_completed_at_utc']=max(times)
metadata['retrieved_at']=max(times)[:10]
metadata['built_at_utc']=datetime.datetime.now(datetime.timezone.utc).isoformat()
metadata['snapshot_note']='Snapshot timestamps come from source-download file modification times; rebuilding cached files does not imply a fresh retrieval.'
metadata['evidence_counts']={'historical_positive_yield':sum(w['positive_yield_evidence'] for w in all_records),'explicit_dry_evidence':sum(w['dry_evidence'] for w in all_records),'water_level_available':sum(w['water_level_ft'] is not None for w in all_records)}
metadata['limitations'][-1]='Historical yields in manually reviewed GWDB remarks are included with original wording and dates. Other unparsed narratives remain visible as source evidence; no missing value is imputed.'
metadata['classification_rules']['positive_yield']='A structured WellTest value has a positive numeric value/strictly positive lower bound, or manually reviewed source remarks explicitly report positive historical flow; estimates and spring flows are identified.'
metadata['bulk_sources']=[{'name':f['file'],'url':f['url'],'retrieved_utc':f['retrieved_utc'],'sha256':f['sha256']} for f in manifest['files'] if f['file'].endswith('.zip')]
(OUT/'provenance.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
payload={'metadata':metadata,'wells':all_records}
(OUT/'wells.json').write_text(json.dumps(payload,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
(OUT/'summary.json').write_text(json.dumps(metadata,indent=2),encoding='utf-8')
with (OUT/'wells.csv').open('w',newline='',encoding='utf-8-sig') as f:
    columns=['id','source','report_number','lat','lon','distance_miles','record_kind','status','depth_ft','yield_gpm','yield_raw','water_level_ft','water_level_date','report_date','county','aquifer','well_type','proposed_use','remarks','water_quality_note','source_url']
    writer=csv.DictWriter(f,fieldnames=columns,extrasaction='ignore');writer.writeheader();writer.writerows(all_records)
print(json.dumps(metadata,indent=2))

