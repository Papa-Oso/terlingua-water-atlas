'use strict';
(function () {
  const byId = id => document.getElementById(id);
  const dialog = byId('submission-dialog');
  const form = byId('submission-form');
  const area = byId('submission-area');
  let draft = null;
  let countyId = null;
  let referenceCountyId = null;
  let countyArea = '';
  let returnFocus = null;
  let hasOpened = false;
  let copiedBody = '';
  let countyLabels = new Map();

  function populateCounties() {
    const counties = window.WaterAtlasMap?.getCounties() || [];
    if (countyLabels.size === counties.length) return;
    countyLabels = new Map();
    const options = document.createDocumentFragment();
    for (const feature of counties) {
      const p = feature.properties;
      const label = `${p.name}, ${p.state}, ${p.country}`;
      countyLabels.set(label.toLocaleLowerCase(), String(feature.id || p.id));
      const option = document.createElement('option');
      option.value = label;
      options.append(option);
    }
    byId('submission-counties').replaceChildren(options);
  }

  function resolveCounty() {
    const value = area.value.trim();
    countyId = value === countyArea && referenceCountyId ? referenceCountyId : countyLabels.get(value.toLocaleLowerCase()) || null;
    byId('submission-county').textContent = countyId
      ? `County reference: ${countyId}. Reviewers will check the actual source coverage.`
      : 'Include your state/province and country. Choose a county suggestion to attach its map reference.';
  }

  function updateDraft() {
    resolveCounty();
    const topics = [...byId('submission-topics').selectedOptions].map(option => option.value).filter(Boolean);
    draft = WaterAtlasSubmissions.build({
      area: area.value.trim(), countyId, topics,
      summary: byId('submission-summary').value,
      findings: byId('submission-findings').value,
      sourceLinks: byId('submission-sources').value,
      aiAssisted: byId('submission-ai').checked
    });
    const valid = draft.errors.length === 0;
    byId('submission-preview').value = draft.body;
    byId('submission-counter').textContent = `${byId('submission-findings').value.length.toLocaleString()} / 45,000 characters`;
    byId('submission-errors').replaceChildren(...draft.errors.map(error => {
      const item = document.createElement('li'); item.textContent = error; return item;
    }));
    byId('submission-errors').hidden = valid;
    byId('submission-copy').disabled = !valid;
    byId('submission-download').disabled = !byId('submission-findings').value.trim();
    const link = byId('submission-github');
    if (valid) link.href = draft.issueUrl; else link.removeAttribute('href');
    link.setAttribute('aria-disabled', String(!valid));
    link.tabIndex = valid ? 0 : -1;
    byId('submission-copy').textContent = draft.requiresPaste ? '1. Copy full submission' : 'Copy a backup';
    link.textContent = draft.requiresPaste ? '2. Open GitHub & paste →' : 'Review on GitHub →';
    byId('submission-mode').textContent = !valid ? 'Add your findings and an original source link to prepare a draft.' : draft.requiresPaste
      ? 'Your report is too long for a reliable prefilled link. Copy it, open GitHub, and paste it into the issue description. The title is filled in.'
      : 'Your county, findings and source links will be filled in on GitHub. Review them there, then post the issue.';
    byId('submission-source-count').textContent = valid ? `${draft.sourceCount} source link${draft.sourceCount === 1 ? '' : 's'} found · awaiting human review` : 'UNREVIEWED CONTRIBUTION';
    if (copiedBody !== draft.body) byId('submission-status').textContent = '';
  }

  function openSubmission({fromPrompt = false, linkedArea = null} = {}) {
    returnFocus = document.activeElement;
    populateCounties();
    const selection = window.WaterAtlasMap?.getSelection() || {};
    const desiredArea = linkedArea || (fromPrompt ? byId('prompt-area').value.trim() : selection.area) || '';
    if (!hasOpened || !byId('submission-findings').value.trim()) {
      area.value = desiredArea;
      countyArea = area.value;
      countyId = selection.kind === 'county' && area.value === selection.area ? selection.id : null;
      if (!countyId) countyId = countyLabels.get(area.value.toLocaleLowerCase()) || null;
      referenceCountyId = countyId;
    }
    if (fromPrompt) byId('prompt-dialog').close();
    hasOpened = true;
    updateDraft();
    if (desiredArea && area.value !== desiredArea && byId('submission-findings').value.trim()) {
      byId('submission-status').textContent = `Your unsent draft for ${area.value} is still here. Change the county field if these findings belong to ${desiredArea}.`;
    }
    if (!dialog.open) dialog.showModal();
    dialog.querySelector('.close-dialog').focus();
  }

  for (const topic of WaterAtlasPrompts.topics) {
    const option = document.createElement('option'); option.value = topic.id; option.textContent = topic.label;
    byId('submission-topics').append(option);
  }
  document.querySelectorAll('[data-submit-findings]').forEach(button => button.addEventListener('click', () => {
    openSubmission({fromPrompt: button.dataset.submitFindings === 'prompt'});
  }));
  form.addEventListener('submit', event => event.preventDefault());
  form.addEventListener('input', updateDraft);
  form.addEventListener('change', updateDraft);
  area.addEventListener('focus', populateCounties);
  dialog.addEventListener('close', () => {
    if (returnFocus instanceof HTMLElement && !returnFocus.closest('dialog:not([open])')) returnFocus.focus();
    if (location.hash.startsWith('#submit')) history.replaceState(null, '', location.pathname + location.search);
  });

  byId('submission-copy').addEventListener('click', async () => {
    updateDraft();
    if (draft.errors.length) return;
    const text = draft.body;
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text);
      else {
        byId('submission-preview-details').open = true;
        byId('submission-preview').focus(); byId('submission-preview').select();
        if (!document.execCommand('copy')) throw new Error('Copy unavailable');
      }
      copiedBody = text;
      byId('submission-status').textContent = draft.requiresPaste
        ? 'Copied. Open GitHub and paste into the description, then submit the issue.'
        : 'Copied. You also have a backup to paste if GitHub clears the form after sign-in.';
    } catch {
      byId('submission-preview-details').open = true;
      byId('submission-preview').focus(); byId('submission-preview').select();
      byId('submission-status').textContent = 'Select and copy the draft below, or download it. Then paste it into GitHub’s issue description.';
    }
  });
  byId('submission-download').addEventListener('click', () => {
    updateDraft();
    if (!byId('submission-findings').value.trim()) return;
    const blob = new Blob([draft.body], {type:'text/markdown;charset=utf-8'});
    const url = URL.createObjectURL(blob), anchor = document.createElement('a');
    anchor.href = url; anchor.download = draft.filename; document.body.append(anchor); anchor.click(); anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    byId('submission-status').textContent = 'Saved a Markdown copy. Paste its contents into GitHub, or attach the file to your issue.';
  });
  byId('submission-github').addEventListener('click', event => {
    if (!draft || draft.errors.length) { event.preventDefault(); return; }
    if (draft.requiresPaste && copiedBody !== draft.body) {
      event.preventDefault();
      byId('submission-preview-details').open = true;
      byId('submission-status').textContent = 'Copy your full submission first. If automatic copy is unavailable, copy the draft below and use the plain GitHub link.';
      byId('submission-copy').focus();
    }
  });
  function openFromHash() {
    if (location.hash !== '#submit' && !location.hash.startsWith('#submit?')) return;
    const params = new URLSearchParams(location.hash.split('?')[1] || '');
    const linkedArea = params.get('area');
    openSubmission({linkedArea: linkedArea?.slice(0, 300) || ''});
  }
  window.addEventListener('hashchange', openFromHash);
  window.addEventListener('wateratlas:ready', () => { populateCounties(); if (dialog.open) updateDraft(); });
  openFromHash();
}());
