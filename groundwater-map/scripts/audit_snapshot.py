"""Independent geographic and schema audit of the published record snapshot."""
import json
import math
from pathlib import Path
from collections import Counter

root = Path(__file__).resolve().parents[1]
payload = json.loads((root / 'dist/data/wells.json').read_text(encoding='utf-8'))
rows = payload['wells']
assert rows, 'No records'
keys = [(r['source'], r['id']) for r in rows]
assert len(keys) == len(set(keys)), 'Duplicate source identifiers'
allowed = {'positive_yield', 'dry', 'plugged_abandoned', 'unknown'}
for r in rows:
    assert r['status'] in allowed, r['id']
    assert -90 <= r['lat'] <= 90 and -180 <= r['lon'] <= 180, r['id']
    a, b, c, d = map(math.radians, (29.3216, -103.6160, r['lat'], r['lon']))
    delta = 2 * math.asin(math.sqrt(math.sin((c-a)/2)**2 + math.cos(a)*math.cos(c)*math.sin((d-b)/2)**2))
    miles = delta * 6371.0088 / 1.609344
    assert miles <= 50.0001, (r['id'], miles)
    assert r.get('evidence') and isinstance(r['evidence'], list), r['id']
    assert r.get('source_url', '').startswith('https://'), r['id']
    for field in ('depth_ft', 'yield_gpm', 'water_level_ft'):
        v = r.get(field)
        assert v is None or (isinstance(v, (int, float)) and math.isfinite(v)), (r['id'], field, v)
    assert r.get('depth_ft') is None or r['depth_ft'] >= 0, r['id']
    assert r.get('yield_gpm') is None or r['yield_gpm'] >= 0, r['id']

print(json.dumps({
    'records': len(rows),
    'source_counts': dict(Counter(r['source'] for r in rows)),
    'evidence_categories': dict(Counter(r['status'] for r in rows)),
    'checks': ['unique identifiers within source', 'all coordinates within 50 miles', 'evidence present', 'HTTPS report references', 'finite numeric measurements and explicit nulls'],
}, indent=2))
