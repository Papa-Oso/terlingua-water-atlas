"""Normalize official TWDB data. Run inspect_sources.py once, then this file."""
from pathlib import Path
import json,csv,io,zipfile,math,collections,re,datetime,statistics,hashlib
ROOT=Path(__file__).resolve().parents[1]; RAW=ROOT/'raw'; OUT=ROOT/'dist'/'data'
CENTER=(29.3216,-103.6160)
def dist(lat,lon):
    a,b=map(math.radians,CENTER);c,d=map(math.radians,(lat,lon))
    h=math.sin((c-a)/2)**2+math.cos(a)*math.cos(c)*math.sin((d-b)/2)**2
    return 3958.7613*2*math.asin(min(1,math.sqrt(h)))
def num(x):
    try:
        v=float(str(x).strip());return v if math.isfinite(v) else None
    except (TypeError,ValueError): return None
def records(z,table):
    name=Path(z.filename).name.replace('.zip','')+'/'+table+'.txt'
    with z.open(name) as f:
        yield from csv.DictReader(io.TextIOWrapper(f,encoding='utf-8-sig',errors='replace',newline=None),delimiter='|',quoting=csv.QUOTE_NONE)
def read_area(service,key):
    features=json.loads((RAW/(service+'_features.json')).read_text(encoding='utf-8'))
    selected={}
    for f in features:
        a=f['attributes'];lon,lat=f['geometry']['x'],f['geometry']['y']
        if dist(lat,lon)<=50:
            selected[a[key]]={'attributes':a,'lat':lat,'lon':lon,'distance':dist(lat,lon)}
    return selected
area={'SDR':read_area('WellReports','WellReportTrackingNumber'),'GWDB':read_area('TWDB_Groundwater_database','StateWellNumber'),'Plugging':read_area('PluggingReports','PluggingReportTrackingNumber')}
def extract(z,table,key,selected):
    data=[r for r in records(z,table) if r.get(key) in selected]
    (RAW/('local_'+Path(z.filename).stem+'_'+table+'.json')).write_text(json.dumps(data,indent=2),encoding='utf-8')
    print(table,len(data),flush=True);return data
sdr=zipfile.ZipFile(RAW/'SDRDownload.zip');gw=zipfile.ZipFile(RAW/'GWDBDownload.zip')
local={}
for source,z,table,key in [('SDR',sdr,'WellData','WellReportTrackingNumber'),('SDR',sdr,'WellTest','WellReportTrackingNumber'),('SDR',sdr,'WellLevels','WellReportTrackingNumber'),('SDR',sdr,'WellBoreHole','WellReportTrackingNumber'),('SDR',sdr,'WellInjuriousConstituent','WellReportTrackingNumber'),('Plugging',sdr,'PlugData','PluggingReportTrackingNumber'),('Plugging',sdr,'PlugBoreHole','PluggingReportTrackingNumber'),('GWDB',gw,'WellMain','StateWellNumber'),('GWDB',gw,'WellTest','StateWellNumber')]:
    local[source+'_'+table]=extract(z,table,key,area[source])
for table in ['WaterLevelsCombination','WaterLevelsMajor','WaterLevelsMinor','WaterLevelsOtherUnassigned']:
    local['GWDB_'+table]=extract(gw,table,'StateWellNumber',area['GWDB'])
(RAW/'local_summary.json').write_text(json.dumps({k:len(v) for k,v in local.items()},indent=2))
print('AREA', {k:len(v) for k,v in area.items()})
print('SDR TYPES',collections.Counter(r['TypeOfWork'] for r in local['SDR_WellData']))
print('SDR USES',collections.Counter(r['ProposedUse'] for r in local['SDR_WellData']))
print('GWDB TYPES',collections.Counter(r['WellType'] for r in local['GWDB_WellMain']))
print('GWDB USES',collections.Counter(r['WellUse'] for r in local['GWDB_WellMain']))
print('GWDB LEVEL STATUS',collections.Counter(r['WaterLevelStatus'] for r in local['GWDB_WellMain']))
for kind in ['SDR_WellData','Plugging_PlugData','GWDB_WellMain']:
    for r in local[kind]:
        comment=r.get('Remarks',r.get('Comments',''))
        if re.search(r'\bdry\b|\babandon|\bplug|\bsalt|\bbad water|\bbrack|\bunsuit',comment,re.I):print(kind,r.get('StateWellNumber',r.get('WellReportTrackingNumber',r.get('PluggingReportTrackingNumber'))),comment)

