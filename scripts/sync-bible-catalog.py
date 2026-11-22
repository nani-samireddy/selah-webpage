"""Refresh public Bible metadata; XML files are downloaded directly from GitHub."""
import json
from pathlib import Path
import re
import subprocess

REPOSITORY = 'nani-samireddy/Holy-Bible-XML-Format'
BRANCH = 'master'
tree = json.loads(subprocess.check_output(['gh', 'api', f'repos/{REPOSITORY}/git/trees/{BRANCH}?recursive=1']))
if tree.get('truncated'):
    raise RuntimeError('GitHub returned an incomplete file tree')
files = []
for entry in tree['tree']:
    if entry['type'] != 'blob' or not entry['path'].lower().endswith('.xml'):
        continue
    stem = Path(entry['path']).stem
    title = re.sub(r'([a-z])([A-Z])', r'\1 \2', stem)
    title = re.sub(r'([A-Z])([A-Z][a-z])', r'\1 \2', title)
    title = re.sub(r'(?<=[A-Za-z])(?=\d)|(?<=\d)(?=[A-Za-z])', ' ', title)
    group = re.match(r'[A-Z][a-z]+', stem)
    language = group.group(0) if group else 'Other'
    if stem.startswith('AdilabadGondi'):
        language = 'Adilabad Gondi'
    files.append(dict(path=entry['path'], filename=Path(entry['path']).name, title=title,
        language=language, bytes=entry['size'], sourceSha=entry['sha']))
files.sort(key=lambda item: item['path'].casefold())
assert files and len({item['path'] for item in files}) == len(files)
catalog = dict(repository=REPOSITORY, branch=BRANCH, treeSha=tree['sha'], count=len(files), files=files)
output = Path(__file__).resolve().parents[1] / 'src/bible-catalog.json'
output.write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n')
print(f'Indexed {len(files)} XML files from {REPOSITORY}.')
