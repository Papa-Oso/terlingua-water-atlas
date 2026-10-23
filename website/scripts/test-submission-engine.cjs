'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const context = vm.createContext({ URL });
const enginePath = path.join(__dirname, '..', 'dist', 'submission-engine.js');
vm.runInContext(fs.readFileSync(enginePath, 'utf8'), context, { filename: enginePath });
const engine = context.WaterAtlasSubmissions;
const valid = {
  area: 'Brewster County, Texas, United States', countyId: '48043', topics: ['wells', 'rights'],
  summary: 'A few useful source records.', findings: 'A public source: https://www.twdb.texas.gov/groundwater/data/data-well-reports.asp',
  sourceLinks: 'https://www.twdb.texas.gov/groundwater/data/data-well-reports.asp', aiAssisted: true
};

const draft = engine.build(valid);
assert.equal(JSON.stringify(draft), JSON.stringify(engine.build(valid)), 'Draft generation must be deterministic.');
assert.equal(draft.errors.length, 0);
assert.equal(draft.sourceCount, 1, 'Repeated identical sources are counted once.');
assert.match(draft.body, /`48043` \(reference for review\)/);
assert.match(draft.body, /unreviewed draft/);
assert.match(draft.body, /Submission alone does not change the map/);
assert.match(draft.body, /Detection is not verification/);
assert.match(draft.body, /AI-assisted:\*\* Yes/);
assert.equal(draft.filename, 'water-atlas-48043-contribution.md');
assert.ok(draft.body.includes(valid.findings));
assert.ok(draft.body.includes(valid.sourceLinks));
assert.match(draft.issueUrl, /^https:\/\/github\.com\/Papa-Oso\/terlingua-water-atlas\/issues\/new\?/);
assert.ok(draft.issueUrl.length <= 1800);
assert.doesNotMatch(draft.issueUrl, /labels=|assignee=|projects=|template=/);
assert.doesNotMatch(draft.body, /\d{4}-\d{2}-\d{2}/, 'The generator must not invent dates.');

const short = engine.build({ area: 'A', findings: 'https://example.org' });
assert.equal(short.errors.length, 0);
assert.equal(short.requiresPaste, false, 'Short contributions must prefill the complete issue body.');
assert.equal(new URL(short.issueUrl).searchParams.get('body'), short.body);

const encoded = engine.build({ ...valid, area: 'Río #1 & River? 湖', findings: '# Findings & detail\nSee https://example.org/water?one=1&two=2#river\n😀' });
const parsed = new URL(encoded.issueUrl);
assert.equal(parsed.searchParams.get('title'), encoded.title);
assert.equal(parsed.searchParams.get('body'), encoded.requiresPaste ? null : encoded.body);
assert.equal(parsed.hash, '', 'User URL fragments must not become fragments of the GitHub link.');
assert.equal(parsed.searchParams.get('two'), null, 'Source query parameters must not become issue URL parameters.');
assert.ok(encoded.body.includes('😀'));
assert.ok(encoded.body.includes('# Findings & detail'));

const hostile = engine.build({ ...valid, area: 'Bad\n## Heading <script>alert(1)</script>', countyId: '48043\n<script>', topics: ['__proto__', 'constructor', 'wells'], findings: '<script>globalThis.executed = true</script>\nhttps://example.org/evidence' });
assert.equal(context.executed, undefined);
assert.ok(hostile.body.includes('<script>globalThis.executed = true</script>'), 'Findings remain plain text; the UI must render with textContent/value.');
assert.match(hostile.body, /&lt;script&gt;/, 'Geographic metadata is Markdown/HTML escaped.');
assert.doesNotMatch(hostile.body, /\*\*Area:\*\* Bad\n## Heading/);
assert.doesNotMatch(hostile.body, /Selected U\.S\. county FIPS:\*\* `48043/);
assert.ok(hostile.errors.some(error => error.includes('county code')));
assert.equal(hostile.issueUrl, '');

const longFindings = 'x'.repeat(44000) + '\nhttps://example.org/original\nEND OF ALL FINDINGS';
const long = engine.build({ ...valid, findings: longFindings });
assert.equal(long.errors.length, 0);
assert.equal(long.requiresPaste, true);
assert.ok(long.body.includes(longFindings), 'Long research must never be silently truncated.');
assert.ok(long.body.includes('END OF ALL FINDINGS'));
assert.equal(new URL(long.issueUrl).searchParams.get('body'), null);
assert.ok(long.issueUrl.length <= 1800);

const missing = engine.build();
assert.equal(missing.issueUrl, '');
assert.equal(missing.errors.length, 3);
assert.equal(missing.sourceCount, 0);
const invalidEvidence = engine.build({ ...valid, findings: 'javascript:https://example.org/bad data:https://example.org/bad http://example.org/plain', sourceLinks: 'https:// https://user:secret@example.org/private' });
assert.equal(invalidEvidence.sourceCount, 0);
assert.equal(invalidEvidence.issueUrl, '');

const sourceForms = engine.build({ ...valid, findings: '[Official data](https://example.org/data?x=1&y=2#section).\n{"url":"https://example.org/water_(supply)"}\nHTTPS://EXAMPLE.ORG/OTHER\nhttps://example.org/data?x=1&y=2#section', sourceLinks: '' });
assert.equal(sourceForms.sourceCount, 3);
assert.equal(sourceForms.errors.length, 0);
const noCounty = engine.build({ ...valid, countyId: '', aiAssisted: false, summary: '', topics: [] });
assert.match(noCounty.body, /Selected U\.S\. county FIPS:\*\* Not supplied/);
assert.match(noCounty.body, /AI-assisted:\*\* No/);
assert.match(noCounty.body, /Topics:\*\* Not specified/);

for (const field of ['area', 'summary', 'findings', 'sourceLinks']) {
  const value = 'x'.repeat(engine.limits[field] + 1);
  const result = engine.build({ ...valid, [field]: value });
  assert.equal(result.issueUrl, '', `${field} exceeding its limit must block submission.`);
  assert.ok(result.errors.some(error => error.includes('has not been shortened')));
  assert.ok(result.body.includes(value), `${field} over the limit must remain available for editing.`);
}
const bodyLimit = engine.build({ ...valid, findings: 'x'.repeat(61000) });
assert.ok(bodyLimit.errors.some(error => error.includes('complete draft')));
assert.equal(bodyLimit.issueUrl, '');
assert.ok(bodyLimit.body.includes('x'.repeat(61000)));

for (const field of ['area', 'summary', 'findings', 'sourceLinks']) {
  for (const surrogate of ['\ud800', '\udc00']) {
    const value = `Broken ${surrogate} text`;
    const result = engine.build({ ...valid, [field]: value });
    assert.equal(result.issueUrl, '', 'Malformed UTF-16 must block the GitHub handoff.');
    assert.ok(result.errors.some(error => error.includes('invalid Unicode')));
    assert.ok(result.body.includes(value), `${field} must remain available for correction without replacement or truncation.`);
  }
}

console.log('Submission engine: draft provenance, source detection, GitHub encoding, long-content handoff and validation checks passed.');
