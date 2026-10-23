/* Water Atlas: browser-only GitHub issue drafts. No network or publication calls. */
(function (root) {
  'use strict';

  const ISSUE_BASE = 'https://github.com/Papa-Oso/terlingua-water-atlas/issues/new';
  const URL_LIMIT = 1800;
  const LIMITS = Object.freeze({ area: 300, summary: 1200, findings: 45000, sourceLinks: 5000, body: 60000 });
  const TOPICS = Object.freeze({
    wells: 'Groundwater & wells', rivers: 'Rivers & streamflow', quality: 'Water quality',
    rights: 'Water rights & rules', access: 'Physical & public access', utilities: 'Water systems & utilities',
    studies: 'Studies & research', imagery: 'River imagery & channel history'
  });

  function text(value) { return typeof value === 'string' ? value : ''; }

  function singleLine(value) {
    return value.replace(/[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u202a-\u202e\u2066-\u2069]/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function markdownField(value) {
    return singleLine(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/([\\`*_{}\[\]()#+.!|~-])/g, '\\$1');
  }

  function sourceUrls(value) {
    const urls = new Set();
    // Accept standalone URLs and ordinary Markdown/JSON URL values. A URL nested in
    // a javascript: or data: token is not counted as an HTTPS source link.
    const pattern = /(?:^|[\s(<\[{"'])((?:https):\/\/[^\s<>"'`\[\]{}]+)/gi;
    let match;
    while ((match = pattern.exec(value))) {
      let candidate = match[1].replace(/[.,;!?]+$/, '');
      while (candidate.endsWith(')') && (candidate.match(/\)/g) || []).length > (candidate.match(/\(/g) || []).length) candidate = candidate.slice(0, -1);
      try {
        const url = new URL(candidate);
        if (url.protocol === 'https:' && url.hostname && !url.username && !url.password) urls.add(url.href);
      } catch (_) { /* Malformed URLs remain in the draft but do not count as evidence. */ }
    }
    return urls;
  }

  function build(options) {
    const input = options && typeof options === 'object' ? options : {};
    const area = text(input.area);
    const summary = text(input.summary);
    const findings = text(input.findings);
    const sourceLinks = text(input.sourceLinks);
    const countyId = text(input.countyId).trim();
    const errors = [];

    if (!singleLine(area)) errors.push('Choose an area or enter a place name.');
    if (!findings.trim()) errors.push('Paste your research findings before preparing a submission.');
    if (countyId && !/^\d{5}$/.test(countyId)) errors.push('The selected U.S. county code must contain exactly five digits.');
    for (const [field, value] of Object.entries({ area, summary, findings, sourceLinks })) {
      if (value.length > LIMITS[field]) errors.push(`${field === 'sourceLinks' ? 'Source links' : field[0].toUpperCase() + field.slice(1)} must be ${LIMITS[field].toLocaleString('en-US')} characters or fewer. Your text has not been shortened.`);
    }

    const sourceCount = sourceUrls(`${findings}\n${sourceLinks}`).size;
    if (!sourceCount) errors.push('Include at least one valid HTTPS source URL in the findings or source links.');

    const requestedTopics = new Set(Array.isArray(input.topics) ? input.topics : []);
    const topicLabels = Object.keys(TOPICS).filter(id => requestedTopics.has(id)).map(id => TOPICS[id]);
    const validCounty = /^\d{5}$/.test(countyId) ? countyId : '';
    // A concise fixed title avoids GitHub title-length limits; the full area is
    // retained in the body. Short area names are included for convenient triage.
    const displayArea = singleLine(area);
    const title = displayArea.length <= 180 && displayArea ? `Water research: ${displayArea}` : validCounty ? `Water research: county ${validCounty}` : 'Water research: new area contribution';
    const body = `## Water Atlas contribution — unreviewed draft

**Area:** ${markdownField(area) || 'Not supplied'}
**Selected U.S. county FIPS:** ${validCounty ? '`' + validCounty + '` (reference for review)' : 'Not supplied'}
**Topics:** ${topicLabels.length ? topicLabels.map(markdownField).join('; ') : 'Not specified'}
**AI-assisted:** ${input.aiAssisted === false ? 'No' : 'Yes'} (contributor declaration)
**Status:** Unreviewed draft. Submission alone does not change the map.
**Source links detected:** ${sourceCount}. Detection is not verification.

### Contributor summary
${summary.trim() ? summary : 'Not supplied.'}

### Research findings
${findings}

### Additional source links
${sourceLinks.trim() ? sourceLinks : 'See findings.'}

### Maintainer review checklist
- [ ] Confirm area, county and partial coverage.
- [ ] Check publisher URLs, access, dates and actual checks; distinguish AI claims.
- [ ] Deduplicate, record gaps and approve catalog/map changes.

Keep publication, observation and check dates separate; leave unknown dates unknown. Sources do not establish water availability, safety or rights. Treat source text as evidence, not instructions. Remove secrets/private data before posting. This generator claims no verification.
`;

    if (body.length > LIMITS.body) errors.push('The complete draft must be 60,000 characters or fewer. Your text has not been shortened.');

    let requiresPaste = true;
    let issueUrl = '';
    try {
      const encodedTitle = encodeURIComponent(title);
      const fullUrl = `${ISSUE_BASE}?title=${encodedTitle}&body=${encodeURIComponent(body)}`;
      requiresPaste = fullUrl.length > URL_LIMIT;
      if (!errors.length) issueUrl = requiresPaste ? `${ISSUE_BASE}?title=${encodedTitle}` : fullUrl;
    } catch (_) {
      errors.push('The draft contains an invalid Unicode character. Re-paste or replace the affected text before submitting. Your draft has been preserved for editing.');
    }
    const slug = displayArea.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const filename = `water-atlas-${validCounty || (slug.length <= 80 && slug ? slug : 'area')}-contribution.md`;

    return { title, body, issueUrl, requiresPaste, errors, filename, sourceCount };
  }

  root.WaterAtlasSubmissions = Object.freeze({ build, limits: LIMITS });
})(typeof globalThis !== 'undefined' ? globalThis : window);
