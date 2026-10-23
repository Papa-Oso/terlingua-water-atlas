"""Reproduce preliminary area screens from the atlas snapshot, without prediction."""
import json, math, statistics
from pathlib import Path
from collections import Counter

ROOT = Path(__file__).resolve().parents[1]
data = json.loads((ROOT / 'dist/data/wells.json').read_text(encoding='utf-8'))
wells = [w for w in data['wells'] if w['is_water_well']]
lookup = {w['id']: w for w in wells}

areas = [
    dict(id='ranch-road-junction', name='Highway 118 / Terlingua Ranch Road junction',
         center=[29.551003,-103.546166], bounds=[29.50,-103.605,29.60,-103.487], radius_miles=3,
         road='Intersection of Highway 118 and the paved western end of Terlingua Ranch Road.',
         thesis='Cheap-land and road-access comparison only; the retrieved water evidence is too weak for a water-led recommendation.',
         caution='Only three water-well source records within three straight-line miles of this junction: an 880-foot dry record in 2005, a 4 gpm bailed report from 1976 with questionable location, and a 1 gpm jetted report at 420 feet in 2022.',
         evidence_ids=['SDR-72974','GWDB-7328801','SDR-619916'],
         sources=['https://terlinguaranch.com/terlingua-ranch-lodge-texas-big-bend/']),
    dict(id='ocotillo-mesa', name='Ocotillo Mesa Road / north Study Butte',
         center=[29.416, -103.517], bounds=[29.39,-103.55,29.45,-103.49],
         road='Ocotillo Mesa Road connects with Highway 118; parcel roads and legal access still need confirmation.',
         thesis='First water-and-access screen: several comparatively recent positive reports, including moderate depths, close to the Study Butte market.',
         caution='All highlighted yields are driller jetting reports, not sustained pump tests. Nearby records also report only 2-8 gpm. No observed dry record inside this chosen box does not imply no failures.',
         evidence_ids=['SDR-101544','SDR-720307','SDR-436224','SDR-524776','SDR-558084','SDR-501027','SDR-702940','SDR-425246'],
         sources=['https://www.terlinguapropertyconnection.com/home/properties','https://www.landsearch.com/properties/33947-ocotillo-ave-terlingua-tx-79852/4590824']),
    dict(id='ghost-town', name='Terlingua Ghost Town / Long Draw / FM 170',
         center=[29.3245,-103.6202], bounds=[29.30,-103.66,29.38,-103.58],
         road='FM 170 plus Long Draw and South County Road; proximity to the highway does not verify a parcel entrance or easement.',
         thesis='A deep historical public-supply well demonstrates large reported flow in the district; contiguous land near town could support a land-assembly or existing-supply strategy.',
         caution='The 375 gpm example is a 1999 test at 1,160 feet, not a forecast on adjoining land. The SDR and GWDB examples document the same well. A large existing utility well is not available supply for a buyer.',
         evidence_ids=['GWDB-7344408','SDR-669850','GWDB-7344409','GWDB-7344101'],
         sources=['https://www.studybuttewater.com/','https://www.dot.state.tx.us/tpp/hwy/fm/fm0170.htm']),
    dict(id='study-butte', name='Study Butte / Highway 118 and FM 170 junction',
         center=[29.334,-103.55], bounds=[29.30,-103.59,29.36,-103.51],
         road='Highway 118 / FM 170 provides the principal paved approach; parcel entrances and side roads require review.',
         thesis='More convenient for local buyers and water hauling, with multiple recent positive reports; examine existing service or tested wells as well as new drilling.',
         caution='Depths vary greatly, recent higher numbers are jetted estimates, and documented dry holes are nearby. Lower land prices are not yet established here.',
         evidence_ids=['SDR-549066','SDR-694307','SDR-664230','SDR-557544','SDR-147554','SDR-491835'],
         sources=['https://www.dot.state.tx.us/tpp/hwy/sh/sh0118.htm','https://www.dot.state.tx.us/tpp/hwy/fm/fm0170.htm']),
    dict(id='north-corazones', name='North Corazones / roads north and east of Terlingua Ranch Lodge',
         center=[29.479,-103.379], bounds=[29.43,-103.44,29.51,-103.34],
         road='Terlingua Ranch Road approach, then local ranch roads. Lodge says first 13 of its 16-mile approach from Highway 118 are paved; its final 3 miles are unpaved.',
         thesis='Potential larger-acreage search where some 2020-2021 reports show 65-100 gpm; prioritize parcels with an existing independently tested well and straightforward access.',
         caution='A mixed patchwork: dry holes at 500 and 682 feet and a plugged dry hole at 1,005 feet appear in the same screen. Lodge public-supply records do not establish water entitlements for new parcels.',
         evidence_ids=['SDR-582336','SDR-542067','SDR-597595','SDR-463185','SDR-388857','SDR-215945','GWDB-7337603'],
         sources=['https://terlinguaranch.com/terlingua-ranch-lodge-texas-big-bend/','https://tpwd.texas.gov/huntwild/wildlife/wildlife-trails/fwtx/big-bend-loop']),
    dict(id='ranch-road-west', name='Terlingua Ranch Road / western approach',
         center=[29.565,-103.465], bounds=[29.51,-103.54,29.62,-103.41],
         road='Western and central Terlingua Ranch Road approach from Highway 118; evaluate each feeder road.',
         thesis='Useful low-cost-land comparison, especially immediately along the paved main road; present data do not make it the first water-capacity choice.',
         caution='Mixed records include dry holes of 402, 702, 880 and 1,100 feet. Selected positive observations are 30-80 gpm jetting reports, with no sustained test duration.',
         evidence_ids=['SDR-153297','SDR-582436','SDR-219372','SDR-72974','SDR-483544','SDR-457308','SDR-460757'],
         sources=['https://terlinguaranch.com/terlingua-ranch-lodge-texas-big-bend/']),
    dict(id='lajitas', name='Lajitas / Comanche Mesa / FM 170',
         center=[29.260,-103.771], bounds=[29.24,-103.80,29.30,-103.70],
         road='FM 170 and Comanche Mesa local roads; private access and ownership require confirmation.',
         thesis='Strong historical deep-well pump-test evidence; a comparison district for an existing-water or partnership strategy.',
         caution='400-450 gpm tests are from 2001 at roughly 984-1,040 feet, with cross-database duplicate records. Neither cheap land nor access to these supplies is established; do not prioritize solely because yields are largest.',
         evidence_ids=['SDR-2077','SDR-2076','SDR-2114','GWDB-7342907','GWDB-7342904','GWDB-7342903'],
         sources=['https://www.dot.state.tx.us/tpp/hwy/fm/fm0170.htm']),
]

keys=['id','source','lat','lon','depth_ft','yield_gpm','yield_raw','yield_min_gpm','yield_max_gpm','status','report_date','well_tests','source_url','remarks','aquifer_formation','dry_evidence','positive_yield_evidence','plugging_evidence','water_quality_note','water_quality_flag']
def miles(point,w):
    lat,lon=point
    return 3958.7613*2*math.asin(math.sqrt(math.sin(math.radians(w['lat']-lat)/2)**2+math.cos(math.radians(lat))*math.cos(math.radians(w['lat']))*math.sin(math.radians(w['lon']-lon)/2)**2))
for a in areas:
    south,west,north,east=a['bounds']
    records=[w for w in wells if south<=w['lat']<=north and west<=w['lon']<=east]
    if a.get('radius_miles'):
        records=[w for w in wells if miles(a['center'],w)<=a['radius_miles']]
    a['water_well_source_record_count']=len(records)
    a['status_counts']={s:sum(w['status']==s for w in records) for s in ['positive_yield','dry','plugged_abandoned','unknown']}
    a['explicit_dry_evidence_records']=sum(bool(w.get('dry_evidence')) for w in records)
    a['source_counts']=dict(Counter(w['source'] for w in records))
    a['record_ids']=[w['id'] for w in records]
    depths=[w['depth_ft'] for w in records if w['source']!='Plugging' and w['depth_ft'] is not None]
    a['observed_depths_ft']={'min':min(depths),'median':statistics.median(depths),'max':max(depths),'count':len(depths)}
    a['examples']=[{k:lookup[i].get(k) for k in keys} for i in a['evidence_ids']]
    for example in a['examples']:
        example['miles_from_screen_center']=round(miles(a['center'],example),3)

result=dict(date='2026-10-23',source_snapshot='dist/data/wells.json',
    purpose='Preliminary geographic search screens, not a model, drilling prediction, valuation or parcel recommendation.',
    bounds_format='[south, west, north, east] degrees; rectangular analyst-selected windows, not parcel boundaries or aquifer boundaries.',
    caveats=['Counts are source records, not unique wells; areas can overlap.','No drilling success rate is calculated: failure reporting is incomplete.','All yields are historical reported observations; water quality and sustainable withdrawal are unproven.','Road proximity does not establish legal access or road condition.','Area boundaries are transparent search windows, not a probability heat map.'],
    areas=areas)
(ROOT/'area-water-analysis.json').write_text(json.dumps(result,indent=2))
print(json.dumps([{'name':a['name'],'counts':a['status_counts'],'dry_evidence_records':a['explicit_dry_evidence_records'],'depths':a['observed_depths_ft']} for a in areas],indent=2))
