"""Check the distributable files for broken metadata and accidental private exports."""
from pathlib import Path
import ast
import json
import re
import subprocess

ROOT = Path(__file__).resolve().parents[1]
result = subprocess.run(['git', '-C', str(ROOT), 'ls-files', '-z'], capture_output=True)
names = result.stdout.decode().split('\0') if result.returncode == 0 else []
files = [ROOT / name for name in names if name]
if not files:
    files = [p for p in ROOT.rglob('*') if p.is_file() and not any(x in p.parts for x in ['.git', '__pycache__', 'downloads'])]
patterns = {
    'machine-specific home path': re.compile(r'[A-Za-z]:[\\/]+Users[\\/]'),
    'private Page link': re.compile(r'chatgpt[.]com/space/|library[\-]file:|page_[a-f0-9]{32}'),
    'GitHub credential': re.compile(r'gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{40,}'),
    'API credential': re.compile(r'sk-(?:proj-)?[A-Za-z0-9_-]{30,}'),
    'private key': re.compile(r'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----'),
}
issues = []
for path in files:
    rel = path.relative_to(ROOT)
    if any(part in ['raw', 'downloads', '.openai', '.sites-runtime'] for part in rel.parts) or path.name in ['.env', 'project-pages.json']:
        issues.append(f'{rel}: excluded local/private file')
    if path.stat().st_size > 10 * 1024 * 1024:
        issues.append(f'{rel}: unexpectedly large release file')
    if path.suffix == '.pdf':
        continue
    text = path.read_text(encoding='utf-8-sig')
    for name, pattern in patterns.items():
        if pattern.search(text):
            issues.append(f'{rel}: {name}')
    if path.suffix == '.json':
        json.loads(text)
    if path.suffix == '.py':
        ast.parse(text, filename=str(rel))

catalog = json.loads((ROOT / 'research/catalog.json').read_text(encoding='utf-8'))
ids = [row['id'] for row in catalog['records']]
assert len(ids) == len(set(ids)), 'Duplicate catalog identifiers'
assert catalog['record_count'] == len(ids), 'Incorrect catalog count'
for row in catalog['records']:
    assert row['url'].startswith('https://'), row['id']
    assert not any(key in row for key in ['local_path', 'text_path', 'source_path']), row['id']
    assert re.fullmatch(r'[a-f0-9]{64}', row['sha256']), row['id']
assert (ROOT / 'LICENSE').is_file()
assert (ROOT / 'groundwater-map/dist/vendor/LEAFLET-LICENSE.txt').is_file()
if issues:
    raise SystemExit('\n'.join(issues))
print(f'Checked {len(files)} release files and {len(ids)} source catalog entries; no blocked metadata or credential patterns found.')
