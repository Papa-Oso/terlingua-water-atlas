'use strict';

// Static metadata checks only. A passing check does not approve research or contact sources.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const dist = path.resolve(__dirname, '../dist');
const read = relative => JSON.parse(fs.readFileSync(path.join(dist, relative), 'utf8'));
const geography = new Map(read('data/us-counties.geojson').features.map(feature => [String(feature.id), feature.properties]));
const seedCounts = new Map(read('data/terlingua.json').county_counts.map(entry => [entry.fips, entry]));
const levelNumbers = {sources_listed: 1, organized: 2, connected: 3, reviewed: 4};
const today = new Date().toISOString().slice(0, 10);
const issuePattern = /^https:\/\/github\.com\/Papa-Oso\/terlingua-water-atlas\/issues\/[1-9]\d*$/;

function validateCoverage(registry) {
  const errors = [];
  const check = (condition, message) => { if (!condition) errors.push(message); };
  const text = value => typeof value === 'string' && value.trim().length > 0;
  const https = value => {
    try { const url = new URL(value); return url.protocol === 'https:' && Boolean(url.hostname) && !url.username && !url.password; }
    catch { return false; }
  };
  const date = value => {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const parsed = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value && value <= today;
  };
  const collection = value => {
    if (https(value)) return true;
    if (!text(value) || /^[\/\\]/.test(value) || /[:?#\\]/.test(value) || value.split('/').includes('..')) return false;
    const target = path.resolve(dist, value);
    return target.startsWith(dist + path.sep) && fs.existsSync(target) &&
      (fs.statSync(target).isFile() || fs.existsSync(path.join(target, 'index.html')));
  };

  check(registry && registry.schema_version === 1, 'schema_version must be 1');
  check(date(registry?.updated_at), 'updated_at must be a real YYYY-MM-DD date, not in the future');
  if (!Array.isArray(registry?.counties)) return [...errors, 'counties must be an array'];
  const seen = new Set();
  for (const [index, entry] of registry.counties.entries()) {
    const key = `counties[${index}] (${entry?.fips || 'missing FIPS'})`;
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) { errors.push(`${key}: must be an object`); continue; }
    check(typeof entry.fips === 'string' && /^\d{5}$/.test(entry.fips), `${key}: fips must be a five-digit string`);
    check(!seen.has(entry.fips), `${key}: duplicate FIPS`); seen.add(entry.fips);
    const place = geography.get(entry.fips);
    check(Boolean(place), `${key}: FIPS must exist in the bundled county geography`);
    if (place) for (const field of ['name', 'state', 'country']) check(entry[field] === place[field], `${key}: ${field} must match county geography (${place[field]})`);
    check(Object.hasOwn(levelNumbers, entry.level), `${key}: invalid level`);
    check(date(entry.published_at), `${key}: published_at must be a real date, not in the future`);
    check(entry.published_at <= registry.updated_at, `${key}: published_at cannot be after updated_at`);
    check(['partial', 'county'].includes(entry.coverage), `${key}: coverage must be partial or county`);
    for (const field of ['summary', 'scope']) check(text(entry[field]), `${key}: ${field} is required`);
    check(collection(entry.collection_url), `${key}: collection_url must be an HTTPS URL or an existing relative static collection`);
    check(Array.isArray(entry.evidence_urls) && entry.evidence_urls.length > 0 && entry.evidence_urls.every(https), `${key}: evidence_urls must contain original-source HTTPS URLs`);
    if (Array.isArray(entry.evidence_urls)) check(new Set(entry.evidence_urls).size === entry.evidence_urls.length, `${key}: duplicate evidence URL`);
    check(Array.isArray(entry.topics) && entry.topics.length > 0, `${key}: topics must be a nonempty array`);
    if (Array.isArray(entry.topics)) for (const topic of entry.topics) {
      check(topic && text(topic.name) && text(topic.label) && ['available', 'needed'].includes(topic.status), `${key}: each topic needs name, label and available/needed status`);
    }
    if (entry.metrics !== undefined) {
      const metrics = entry.metrics;
      check(metrics && ['source_records', 'water_well_records'].every(field => Number.isSafeInteger(metrics[field]) && metrics[field] >= 0), `${key}: metrics must have nonnegative integer source_records and water_well_records`);
      if (metrics) check(metrics.water_well_records <= metrics.source_records, `${key}: water_well_records cannot exceed source_records`);
    }
    const isSeed = entry.origin === 'terlingua_case_study' && seedCounts.has(entry.fips);
    if (entry.origin === 'terlingua_case_study') check(isSeed, `${key}: only original Terlingua counties can use the seed origin`);
    if (!isSeed || entry.source_issue !== undefined) check(typeof entry.source_issue === 'string' && issuePattern.test(entry.source_issue), `${key}: source_issue must identify an issue in Papa-Oso/terlingua-water-atlas`);
    if (isSeed && entry.metrics) {
      const seed = seedCounts.get(entry.fips);
      check(entry.metrics.source_records === seed.source_record_count && entry.metrics.water_well_records === seed.water_well_record_count, `${key}: seed metrics must match terlingua.json`);
    }
    if (levelNumbers[entry.level] >= 3) check(Array.isArray(entry.connector_tests) && entry.connector_tests.length > 0, `${key}: connected/reviewed requires dated connector_tests`);
    if (entry.connector_tests !== undefined) {
      check(Array.isArray(entry.connector_tests), `${key}: connector_tests must be an array`);
      if (Array.isArray(entry.connector_tests)) for (const test of entry.connector_tests) {
        check(test && text(test.name) && date(test.tested_at) && https(test.evidence_url), `${key}: each connector test needs name, tested_at and HTTPS evidence_url`);
        if (test) check(test.tested_at <= registry.updated_at, `${key}: connector test cannot be after updated_at`);
      }
    }
    if (entry.level === 'reviewed') check(Boolean(entry.review), `${key}: reviewed requires independent review metadata`);
    if (entry.review !== undefined) {
      const review = entry.review;
      check(review && text(review.reviewer) && date(review.reviewed_at) && text(review.notes) && https(review.evidence_url), `${key}: review needs reviewer, reviewed_at, notes and HTTPS evidence_url`);
      if (review) {
        check(review.reviewed_at <= registry.updated_at, `${key}: review date cannot be after updated_at`);
        if (entry.level === 'reviewed' && Array.isArray(entry.connector_tests)) for (const test of entry.connector_tests) check(test && review.reviewed_at >= test.tested_at, `${key}: reviewed connector tests must not postdate the review`);
      }
    }
  }
  return errors;
}

function checkSafeguards(registry) {
  const draft = () => JSON.parse(JSON.stringify(registry));
  const duplicate = draft(); duplicate.counties.push({...duplicate.counties[0]});
  assert(validateCoverage(duplicate).some(error => error.includes('duplicate FIPS')));
  const invalidFips = draft(); invalidFips.counties[0].fips = '99999';
  assert(validateCoverage(invalidFips).some(error => error.includes('bundled county geography')));
  const missingIssue = draft(); delete missingIssue.counties[0].origin; delete missingIssue.counties[0].source_issue;
  assert(validateCoverage(missingIssue).some(error => error.includes('source_issue')));
  const untested = draft(); untested.counties[0].level = 'connected'; delete untested.counties[0].connector_tests;
  assert(validateCoverage(untested).some(error => error.includes('requires dated connector_tests')));
  const unreviewed = draft(); unreviewed.counties[0].level = 'reviewed'; delete unreviewed.counties[0].review;
  assert(validateCoverage(unreviewed).some(error => error.includes('requires independent review metadata')));
  const badDate = draft(); badDate.counties[0].published_at = '2026-02-30';
  assert(validateCoverage(badDate).some(error => error.includes('published_at must be a real date')));
  const unsafeLink = draft(); unsafeLink.counties[0].collection_url = 'javascript:alert(1)';
  assert(validateCoverage(unsafeLink).some(error => error.includes('collection_url')));
}

if (require.main === module) {
  const registry = read('data/coverage.json');
  const errors = validateCoverage(registry);
  if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
  else {
    if (registry.counties.length) checkSafeguards(registry);
    console.log(`Coverage registry valid: ${registry.counties.length} counties; provenance, promotion and unsafe-link safeguards passed. No research was automatically approved.`);
  }
}
module.exports = {validateCoverage};
