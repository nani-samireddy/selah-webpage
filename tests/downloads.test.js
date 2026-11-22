import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
const root = new URL("../", import.meta.url);
const catalog = JSON.parse(readFileSync(new URL("src/resources.json", root)));

test("every resource is downloadable and matches its published size and checksum", () => {
  assert.equal(catalog.resources.length, 9);
  assert.deepEqual(
    [...new Set(catalog.resources.map((resource) => resource.category))].sort(),
    ["bibles", "presets", "songs", "templates"],
  );
  for (const resource of catalog.resources) {
    const file = new URL(`public/downloads/files/${resource.filename}`, root);
    assert.equal(statSync(file).size, resource.bytes, resource.filename);
    assert.equal(
      createHash("sha256").update(readFileSync(file)).digest("hex"),
      resource.sha256,
      resource.filename,
    );
    assert.ok(resource.instruction && resource.license);
  }
  assert.equal(
    statSync(
      new URL(`public/downloads/files/${catalog.starter.filename}`, root),
    ).size,
    catalog.starter.bytes,
  );
});

test("templates preserve supported bindings and keep dynamic boxes within the canvas", () => {
  const required = {
    song: ["Primary lyrics"],
    bilingual: ["Primary lyrics", "Translated lyrics"],
    scripture: ["Scripture text"],
  };
  for (const resource of catalog.resources.filter(
    (resource) => resource.category === "templates",
  )) {
    const file = JSON.parse(
      readFileSync(
        new URL(`public/downloads/files/${resource.filename}`, root),
      ),
    );
    assert.equal(file.format, "churchdeck-template-1");
    const template = file.template;
    const bindings = template.slide.elements.map((element) => element.binding);
    for (const binding of required[template.kind])
      assert.ok(bindings.includes(binding));
    for (const element of template.slide.elements) {
      assert.ok(
        element.x >= 0 &&
          element.y >= 0 &&
          element.x + element.width <= 1920 &&
          element.y + element.height <= 1080,
      );
      assert.ok(element.fontFamily && element.fontSize > 0);
    }
  }
});

test("Bible ZIPs contain complete, unique verse sets and original source notices", () => {
  execFileSync(
    "python3",
    [
      "-c",
      `
import json,zipfile
from pathlib import Path
root=Path('public/downloads/files')
for name,count in [('world-english-bible.zip',31098),('irv-telugu-bible.zip',31004),('irv-hindi-bible.zip',31104)]:
 with zipfile.ZipFile(root/name) as z:
  assert 'source-notice.html' in z.namelist() and 'README.txt' in z.namelist()
  p=json.loads(z.read(next(n for n in z.namelist() if n.endswith('.json'))))
  assert p['format']=='churchdeck-bible-1'
  assert len(p['books'])==66 and len(p['verses'])==count
  keys={(v['book'],v['chapter'],v['verse']) for v in p['verses']}
  assert len(keys)==count and all(v['text'].strip() for v in p['verses'])
  assert p['translation']['license'] and p['translation']['copyright'] and p['translation']['source']
for name in ['selah-starter-kit.zip','multilingual-demo-songs.zip','sunday-service-preset.zip']:
 with zipfile.ZipFile(root/name) as z:
  assert not z.testzip()
  assert all(not n.startswith('/') and '..' not in Path(n).parts for n in z.namelist())
`,
    ],
    { cwd: root },
  );
});
