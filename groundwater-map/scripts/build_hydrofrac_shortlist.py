import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
screen=json.loads((ROOT/'raw/hydrofrac-screen.json').read_text(encoding='utf-8'))
byid={r['well']['id']:r for r in screen}
curated={
 'SDR-425246': {
  'rank':1,'tier':'Inspect first; stimulation suitability unverified','area':'Gate 4 / Ocotillo Mesa sector','area_basis':'WellLocationDescription: off Hwy 118 South through gate 4 near Terlingua',
  'reason':'Low reported yield, moderate total depth, and an explicitly open-hole completion with only short steel casing recorded make this a practical construction-review lead.',
  'geology_summary':'Clay and conglomerate above 132 ft; gray shale from 132–402 ft, with water reportedly reached at 250 ft.',
  'construction_summary':'6-inch steel blank casing 0–20 ft; 6.125-inch borehole 20–402 ft; Open Hole completion. Cement seal 0–20 ft.',
  'specific_unknowns':['No fractures described in log; shale competence and present open-hole condition are unknown.','Clay above the shale and short casing require an integrity/isolation review before any pressurization.','No numeric static level, duration, or drawdown supplied.'],
  'nearby_context':[{'id':'SDR-440600','distance_miles':0.29,'yield_gpm':40,'depth_ft':202,'date':'2017-01-11'},{'id':'SDR-534814','distance_miles':0.44,'yield_gpm':75,'depth_ft':300,'date':'2020-01-07'}]
 },
 'SDR-273878': {
  'rank':2,'tier':'Inspect first; stimulation suitability unverified','area':'Sombrero Peak Road sector / eastern Terlingua Ranch','area_basis':'Report WellAddress1 identifies Sombrero Peak Rd; not a verified access route.',
  'reason':'Low reported yield and a moderate-depth open hole with only short steel casing in the report; a discrete water-bearing interval is described.',
  'geology_summary':'Legacy driller wording: gray sandstone/granite 8–420 and 426–462 ft, with red rock (water) at 420–426 ft. These are driller descriptions, not a verified geologic formation identification.',
  'construction_summary':'Legacy entry: 6-inch new steel 0–15 ft; 6.125-inch borehole 15–462 ft; Open Hole completion.',
  'specific_unknowns':['Record is from 2011; current existence, lining, use and performance unverified.','Fractures are not explicitly described. Lithology uses mixed sandstone/granite terminology and needs review.','Undated static level 300 ft. The reported drawdown value 462 ft equals total depth and should not be treated as a reliable hydraulic result.','Source says location was not verified by the driller; coordinate accuracy and physical identity need confirmation.'],
  'nearby_context':[{'id':'SDR-370652','distance_miles':0.43,'yield_gpm':115,'depth_ft':202,'date':'2014-06-10'}]
 },
 'SDR-425244': {
  'rank':3,'tier':'Basalt comparator / reserve inspection lead','area':'Eastern Terlingua Ranch, southwest of Sombrero Peak Road cluster','area_basis':'WellLocationDescription identifies Terlingua Ranch off Hwy 118 South; more specific placement is coordinate-based.',
  'reason':'The clearer basalt lithology, moderate depth and open-hole construction offer a useful comparison if a genuinely underperforming well is confirmed. Ten gpm is not necessarily a deficient household supply.',
  'geology_summary':'Basalt from 135–320 ft, with water reached at 296 ft; shallower shale seep at 50–55 ft.',
  'construction_summary':'6-inch steel blank casing 0–20 ft; 6.125-inch borehole 20–322 ft; Open Hole completion. Cement 0–10 and bentonite 10–20 ft.',
  'specific_unknowns':['No fractures explicitly logged; basalt alone does not prove hydrofracturing will help.','No static water level, test duration or drawdown supplied.','Reported 10 gpm is an upper-bound screen example and may already meet the owner’s needs.'],
  'nearby_context':[{'id':'SDR-479215','distance_miles':1.73,'yield_gpm':20,'depth_ft':340,'date':'2018-04-16'}]
 },
 'SDR-273875': {
  'rank':4,'tier':'Very-low-flow backup; additional geology review','area':'Sombrero Peak Road sector / eastern Terlingua Ranch','area_basis':'Report WellAddress1 identifies Sombrero Peak Rd; not a verified access route.',
  'reason':'Reported 0.25 gpm, water near 90 ft and an open hole to 500 ft with only short steel casing recorded. Suitable to ask why output is weak, not enough evidence to promise stimulation response.',
  'geology_summary':'Red rock with blue ash veins 20–65 ft; black shale 65–90 ft; legacy driller wording gray sandstone/granite 90–500 ft, with water at 90 ft.',
  'construction_summary':'Legacy entry: 6-inch new steel 0–15 ft; 6.125-inch borehole 15–500 ft; Open Hole completion.',
  'specific_unknowns':['Very weak historical flow could reflect limited connected water, not a remediable blockage.','2011 record; mixed lithology terminology and no explicit fracture description.','Undated water level 90 ft. The reported drawdown value 500 ft equals total depth and should not be used as measured drawdown.','Source says location was not verified by driller.'],
  'nearby_context':[]
 },
 'SDR-558081': {
  'rank':5,'tier':'Research reserve; not a first small pilot','area':'Northern Terlingua Ranch','area_basis':'Approximate coordinate-based area name.',
  'reason':'Only shortlisted log that explicitly describes fractured rock at a reported water entry, but deep total hole and contradictory hydraulic information make this a diagnostic research lead.',
  'geology_summary':'Fractured rhyolite with quartz 178–185 ft, with water reported at that same interval. Volcanic units above 489 ft, then shale to 1,343 ft.',
  'construction_summary':'6-inch steel blank casing 0–20 ft; Open Hole completion.',
  'specific_unknowns':['Reported static level 990 ft is far below the listed water entry at 178–185 ft; original report, present level and water-entry behavior must be reconciled.','Deep hole adds camera, pump handling and treatment costs; total depth is not necessarily target treatment depth.','3 gpm is a jetted observation with no duration or drawdown.'],
  'nearby_context':[{'id':'SDR-105201','distance_miles':0.11,'yield_gpm':20,'depth_ft':225,'date':'2007-02-05'}]
 }
}
out={'as_of':'2026-10-23','purpose':'Desktop shortlist for professional diagnostic inspection; no well is certified eligible for hydrofracturing.','scope':'67 SDR water-well source records within 35 miles of Terlingua with positive reported flow <=10 gpm, excluding known water-quality flags and closed/dry classifications. All are within the atlas 50-mile radius.','source':{'url':'https://www.twdb.texas.gov/groundwater/data/SDRDownload.zip','snapshot':'2026-10-23','tables':['WellData','WellTest','WellLithology','WellCasing','WellBoreHole','WellCompletion','WellStrata','WellLevels','WellSealRange']},'limitations':['Shortlist is based on submitted historical records, not current site inspections.','All shortlisted yield entries are Jetted, not duration-qualified pumping tests; dates are well completion dates, not independently stated test dates.','No gain, success probability, sustainable yield, potable quality, contractor acceptance or owner willingness is established.','Fresh in a driller record is not a laboratory water-quality result.','Nearby higher yields are context only; connectivity and comparable geology have not been established.','Open Hole completion labels can coexist with PVC casing in these data. Casing details were checked separately.','Screening by distance is not a ranking of the entire 50-mile inventory.','Published source coordinates are unverified; location and access must be confirmed.'],'candidates':[],'deprioritized':[]}
for id,notes in curated.items():
    r=byid[id];w=r['well']
    item={**notes,**{k:w[k] for k in ['id','lat','lon','distance_miles','depth_ft','yield_gpm','yield_raw','report_date','well_tests','source_url','water_level_ft','water_level_date','remarks']}}
    item['raw_support']={k:r['tables'][k] for k in ['WellLithology','WellCasing','WellBoreHole','WellCompletion','WellStrata','WellLevels','WellSealRange']}
    item['original_report_driller_company']=r['tables']['WellData'][0]['CompanyName']
    out['candidates'].append(item)
for id,reason in {
 'SDR-702940':'2025 / 8 gpm / 400 ft near Gate 4, but PVC blank 0–100 and slotted 100–400 ft. Not a straightforward open-bedrock hydrofracturing pilot.',
 'SDR-597594':'2021 / 5 gpm / 1,100 ft near Ghost Town, but deep PVC casing with perforated 960–1,100 ft interval. Expensive/complex compared with modest-depth open holes.',
 'SDR-273880':'2 gpm / 402 ft and marked Open Hole, yet casing table shows PVC blank 0–382 and slotted 382–402 ft. Demonstrates why completion labels alone cannot qualify a well.',
 'SDR-568404':'0.5 gpm / 1,303 ft mostly shale; reported static level 1,070 ft. Deep weak-well economics and suitability uncertain; poor first small-pilot choice.',
 'SDR-582333':'0.5 gpm / 620 ft, explicitly capped; needs present-status/reentry investigation and not an established operating low-yield well.',
}.items():
    w=byid[id]['well'];out['deprioritized'].append({'id':id,'reason':reason,'source_url':w['source_url']})
(ROOT/'hydrofrac-candidate-research.json').write_text(json.dumps(out,indent=2,ensure_ascii=False),encoding='utf-8')
print('Wrote',len(out['candidates']),'inspection leads and',len(out['deprioritized']),'deprioritized examples.')
