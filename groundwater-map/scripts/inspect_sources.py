import urllib.request, urllib.parse, json, pathlib, concurrent.futures, zipfile, argparse, datetime, hashlib, threading
args=argparse.ArgumentParser(description='Retrieve official TWDB snapshots; cached by default. --refresh re-downloads every source.')
args.add_argument('--refresh',action='store_true');OPTIONS=args.parse_args()
ROOT=pathlib.Path(__file__).resolve().parents[1]
RAW=ROOT/'raw'
RAW.mkdir(exist_ok=True,parents=True)
BASE='https://services.twdb.texas.gov/arcgis/rest/services/Public/'
MANIFEST=[];LOCK=threading.Lock()
def fetch(url,path):
    cached=path.exists() and not OPTIONS.refresh;headers={}
    if not cached:
        temporary=path.with_suffix(path.suffix+'.partial')
        with urllib.request.urlopen(url,timeout=180) as r, temporary.open('wb') as f:
            headers=dict(r.headers)
            while chunk:=r.read(1024*1024): f.write(chunk)
        temporary.replace(path)
    with LOCK:MANIFEST.append({'file':path.name,'url':url,'cached':cached,'retrieved_utc':datetime.datetime.fromtimestamp(path.stat().st_mtime,datetime.timezone.utc).isoformat(),'bytes':path.stat().st_size,'http_last_modified':headers.get('Last-Modified'),'sha256':hashlib.file_digest(path.open('rb'),'sha256').hexdigest()})
    return path
def service(name):
    url=BASE+name+'/FeatureServer/0'
    meta=json.loads(fetch(url+'?f=json',RAW/(name+'_metadata.json')).read_text())
    fields='*' if name=='TWDB_Groundwater_database' else 'ObjectId,'+('PluggingReportTrackingNumber' if name=='PluggingReports' else 'WellReportTrackingNumber')+',LatitudeDD,LongitudeDD,BoreholeDepthFt'
    params={'f':'json','where':'1=1','geometry':'-104.47,28.58,-102.77,30.06','geometryType':'esriGeometryEnvelope','inSR':4326,'spatialRel':'esriSpatialRelIntersects','returnIdsOnly':'true'}
    p=fetch(url+'/query?'+urllib.parse.urlencode(params),RAW/(name+'_ids.json'))
    ids=json.loads(p.read_text())['objectIds']
    features=[]
    for start in range(0,len(ids),100):
        q={'f':'json','objectIds':','.join(map(str,ids[start:start+100])),'outFields':fields,'outSR':4326,'returnGeometry':'true'}
        p=fetch(url+'/query?'+urllib.parse.urlencode(q),RAW/(name+f'_minimal_page_{start//100}.json'))
        d=json.loads(p.read_text());assert not d.get('exceededTransferLimit');features.extend(d['features'])
    assert len(features)==len(ids)
    assert set(ids)=={f['attributes']['ObjectId'] for f in features}
    (RAW/(name+'_features.json')).write_text(json.dumps(features),encoding='utf-8')
    print(name,len(features),flush=True)
with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:
    futures=[pool.submit(service,n) for n in ['WellReports','PluggingReports','TWDB_Groundwater_database']]
    futures += [pool.submit(fetch,'https://www.twdb.texas.gov/groundwater/data/'+n,RAW/n) for n in ['GWDBDownload.zip','SDRDownload.zip']]
    for f in concurrent.futures.as_completed(futures): print(f.result(),flush=True)
(RAW/'download_manifest.json').write_text(json.dumps({'ran_at_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'refresh':OPTIONS.refresh,'files':MANIFEST},indent=2),encoding='utf-8')
for name in ['GWDBDownload.zip','SDRDownload.zip']:
    z=zipfile.ZipFile(RAW/name)
    print(name,len(z.infolist()),'archive members')

