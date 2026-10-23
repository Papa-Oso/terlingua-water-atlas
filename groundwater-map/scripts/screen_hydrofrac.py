import csv, io, json, zipfile
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
wells=json.loads((ROOT/'dist/data/wells.json').read_text(encoding='utf-8'))['wells']
candidates=[w for w in wells if w['source']=='SDR' and w['record_kind']=='water_well' and w['status']=='positive_yield' and not w['water_quality_flag'] and w['yield_gpm'] and 0<w['yield_gpm']<=10 and w['distance_miles']<35]
ids={w['report_number'] for w in candidates}
tables={}
with zipfile.ZipFile(ROOT/'raw/SDRDownload.zip') as z:
    for table in ['WellLithology','WellCasing','WellStrata','WellBoreHole','WellSealRange','WellCompletion','WellDrillingMethod','WellLevels','WellData']:
        tables[table]={i:[] for i in ids}
        with io.TextIOWrapper(z.open('SDRDownload/'+table+'.txt'),encoding='cp1252',errors='replace',newline='') as f:
            for row in csv.DictReader(f,delimiter='|',quoting=csv.QUOTE_NONE):
                num=row['WellReportTrackingNumber']
                if num in ids: tables[table][num].append(row)
results=[]
for w in candidates:
    r={'well':w,'tables':{t:rows[w['report_number']] for t,rows in tables.items()}}
    results.append(r)
(ROOT/'raw/hydrofrac-screen.json').write_text(json.dumps(results,indent=2),encoding='utf-8')
for r in results:
    w=r['well']
    if (w['report_date'] or '') >= '2010' and w['distance_miles']<25:
        print(w['id'],w['distance_miles'],w['depth_ft'],w['yield_gpm'],w['report_date'])
        for t in ['WellLithology','WellCasing','WellStrata','WellCompletion']:
            print(t,json.dumps(r['tables'][t]))
