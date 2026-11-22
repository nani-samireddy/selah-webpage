"""Package Selah's permitted example content into website downloads."""
import argparse
import hashlib
import json
from pathlib import Path
import sqlite3
import zipfile

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('--source', type=Path, default=ROOT.parent / 'church-deck')
source = parser.parse_args().source.resolve()
output = ROOT / 'public/downloads/files'
output.mkdir(parents=True, exist_ok=True)
resources = []
starter = {}

def dump(data):
    return json.dumps(data, ensure_ascii=False, indent=2).encode('utf-8')

def zip_bytes(path, files):
    with zipfile.ZipFile(path, 'w', zipfile.ZIP_DEFLATED) as archive:
        for name, data in files.items():
            info = zipfile.ZipInfo(name, (2026, 1, 1, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            archive.writestr(info, data)

def register(id, category, title, description, language, filename, format, license, instruction, **extra):
    path = output / filename
    resources.append(dict(id=id, category=category, title=title, description=description,
        language=language, filename=filename, format=format, license=license,
        instruction=instruction, bytes=path.stat().st_size,
        sha256=hashlib.sha256(path.read_bytes()).hexdigest(), **extra))

# Read the shipped seed without modifying the app's libraries or source.
db = sqlite3.connect(f'file:{source / "assets/scriptures/content-seed.sqlite"}?mode=ro', uri=True)
db.row_factory = sqlite3.Row
names = {'engwebp': ('World English Bible', 'English', 'world-english-bible.zip'),
         'tel2017': ('Indian Revised Version · Telugu', 'Telugu', 'irv-telugu-bible.zip'),
         'hin2017': ('Indian Revised Version · Hindi', 'Hindi', 'irv-hindi-bible.zip')}
for translation in db.execute('SELECT * FROM translations ORDER BY id'):
    meta = dict(translation)
    id = meta['id']
    if id not in names: continue
    title, language, filename = names[id]
    books = [dict(row) for row in db.execute('SELECT code,name FROM books WHERE translation=? ORDER BY ordinal', (id,))]
    verses = [dict(row) for row in db.execute('SELECT v.book,v.chapter,v.verse,v.text FROM verses v JOIN books b ON b.translation=v.translation AND b.code=v.book WHERE v.translation=? ORDER BY b.ordinal,v.chapter,v.verse', (id,))]
    omitted = len([v for v in verses if not v['text'].strip()])
    verses = [v for v in verses if v['text'].strip()]
    assert len(books) == 66
    package = {'format': 'churchdeck-bible-1', 'translation': meta, 'books': books, 'verses': verses}
    readme = f'''{title}\n\n{meta['copyright']}\n{meta['license']}\nSource: {meta['source']}\n\n66 books; {len(verses):,} verses. Verse text is unchanged from Selah's bundled seed.\nPackaged as Selah JSON; internal book identifiers use USFM codes. Original source notice included.\n{omitted} blank source records omitted because Selah imports require nonempty verse text. Original verse numbering is retained.\n\nThis translation is already bundled with Selah. You do not need to import it again.\nTo install a missing translation: unzip, open Libraries > Bible > Import translation,\nand choose {id}.json. Selah rejects an ID that is already installed.\n\nRetain the source notice and attribution when sharing.\n'''
    zip_bytes(output / filename, {f'{id}.json': dump(package), 'README.txt': readme.encode(),
        'source-notice.html': (source / f'assets/scriptures/{id}-notice.html').read_bytes()})
    register(id, 'bibles', title, f'A complete 66-book Bible with {len(verses):,} verses. The same translation included with Selah, packaged for reference or a missing installation.', language, filename,
        'ZIP · Selah JSON', meta['license'].split(' · ')[0], 'Unzip, then use Libraries → Bible → Import translation. Already included in Selah; no reimport needed.', books=66, verses=len(verses), source=meta['source'])
db.close()

song_files = {}
for path in sorted((source / 'examples/songs').glob('sample-*.json')):
    song = json.loads(path.read_text())
    assert song['format'] == 'churchdeck-song-1'
    assert 'CC0' in song['song'].get('credits', ''), f'No explicit sample permission: {path.name}'
    song_files[path.name] = path.read_bytes()
song_readme = b'''Selah original demo song collection\n\nFive original demonstration songs in English, Telugu, Hindi, and paired English/Telugu.\nThese are sample songs for trying Selah, not a licensed worship-song catalog.\nCredits are retained in each file; original demo lyrics are CC0.\n\nUnzip, then open Libraries > Songs > Import song and choose each JSON file separately.\nSongSelect, OpenLyrics, and other third-party formats are not included.\n'''
song_files['README.txt'] = song_readme
zip_bytes(output / 'multilingual-demo-songs.zip', song_files)
register('demo-songs', 'songs', 'The multilingual starter collection', 'Five original demo songs, with verses, choruses, saved arrangements, and a bilingual English–Telugu example.', 'English · Telugu · Hindi', 'multilingual-demo-songs.zip', 'ZIP · 5 song files', 'CC0', 'Unzip, then import each JSON separately through Libraries → Songs → Import song.', songs=5)
for name, data in song_files.items(): starter['songs/' + name] = data
hymn = (ROOT / 'content/amazing-grace.json').read_bytes()
zip_bytes(output / 'amazing-grace.zip', {'amazing-grace.json': hymn, 'README.txt': b'Amazing Grace\nJohn Newton, 1779. Public domain.\n\nIncludes three verses and a saved arrangement.\nUnzip, then open Libraries > Songs > Import song and select amazing-grace.json.\n'})
register('amazing-grace', 'songs', 'Amazing Grace', 'A familiar hymn to try your first service. Three verses, credits, and a ready-to-use arrangement.', 'English', 'amazing-grace.zip', 'ZIP · 1 song file', 'Public domain', 'Unzip, then use Libraries → Songs → Import song.', songs=1)
starter['songs/amazing-grace.json'] = hymn

# Use Selah's actual template schema and supported content bindings.
def box(name, binding, text, y, height, size, color, family='Inter'):
    return dict(kind='text', name=name, binding=binding, text=text, x=160, y=y,
        width=1600, height=height, fontSize=size, fontFamily=family, color=color,
        opacity=1, rotation=0, visible=True, locked=False, alignment='center')
templates = [
    ('midnight-lyrics', 'Midnight lyrics', 'song', '#20242f', '#f6f3ec', [
        box('Song title', 'Title', 'Amazing Grace', 80, 60, 28, '#c6bfd7'),
        box('Lyrics', 'Primary lyrics', 'Amazing grace! How sweet the sound,\nThat saved a wretch like me!', 250, 620, 90, '#f6f3ec'),
        box('Credits', 'Credits', 'John Newton · 1779 · Public domain', 980, 60, 23, '#bcb8c7')]),
    ('warm-paper-scripture', 'Warm paper scripture', 'scripture', '#f3f0e6', '#243d32', [
        box('Reference', 'Scripture reference', 'Psalm 23:1', 100, 70, 32, '#44644f'),
        box('Passage', 'Scripture text', 'Yahweh is my shepherd:\nI shall lack nothing.', 280, 560, 84, '#243d32', 'Georgia'),
        box('Translation', 'Version', 'WEB', 960, 60, 25, '#657765')]),
    ('bilingual-evening', 'Bilingual evening', 'bilingual', '#332d42', '#f6f3ec', [
        box('Song title', 'Title', 'Together in Your Light', 75, 65, 28, '#cfc4e2'),
        box('Primary lyrics', 'Primary lyrics', 'We gather in Your light\nWe lift our hearts in praise', 240, 330, 84, '#f6f3ec'),
        box('Translated lyrics', 'Translated lyrics', 'నీ వెలుగులో కూడుదము\nస్తుతితో హృదయాలను పైకెత్తుదము', 640, 260, 64, '#e2d5ef', 'Noto Sans Telugu'),
        box('Credits', 'Credits', 'Selah · Original demo lyrics · CC0', 990, 55, 22, '#cfc4e2')]),
]
for id, name, kind, bg, ink, elements in templates:
    package = {'format': 'churchdeck-template-1', 'template': {'name': name, 'kind': kind,
        'slide': {'name': name, 'background': bg, 'ambientOpacity': 0, 'notes': '', 'elements': elements}}}
    filename = id + '.churchtemplate'
    data = dump(package)
    (output / filename).write_bytes(data)
    starter['templates/' + filename] = data
    descriptions = {'song': 'A quiet dark layout for lyrics, with a song title and credit line.', 'scripture': 'A light Scripture layout with generous text space, a passage reference, and translation label.', 'bilingual': 'A paired-language layout that keeps primary lyrics and translation together.'}
    register(id, 'templates', name, descriptions[kind], 'Bilingual' if kind == 'bilingual' else 'Any supported language', filename, 'Selah template', 'CC0 layout', 'Use Libraries → Templates → Import. Select the saved layout when adding lyrics or Scripture.', kind=kind, background=bg, ink=ink)

preset = (ROOT / 'content/sunday-worship.churchprogram').read_bytes()
zip_bytes(output / 'sunday-service-preset.zip', {'sunday-worship.churchprogram': preset,
    'README.txt': b'''Sunday service preset\n\nAn example saved program with six items: welcome, Amazing Grace, Psalm 23,\nmessage title, prayer, and community announcements. All text remains editable.\nThis is an illustrative service, not a real church schedule.\n\nUnzip, open Programs > Import, then choose sunday-worship.churchprogram.\nUpdate the title and date before using it. Imported programs receive independent identities.\n\nPresentation layouts: CC0. Amazing Grace: John Newton, 1779, public domain.\nScripture: World English Bible, public domain.\n'''})
register('sunday-service', 'presets', 'A Sunday, already taking shape', 'A six-item service preset with welcome slides, Amazing Grace, Psalm 23, a message title, prayer, and announcements.', 'English', 'sunday-service-preset.zip', 'ZIP · Selah program', 'CC0 layouts · Public-domain text', 'Unzip, then use Programs → Import. Change the title, date, and content for your own service.', items=6)
starter['presets/sunday-worship.churchprogram'] = preset
starter['README.txt'] = b'''Selah starter kit\n\nIncludes original demonstration songs, Amazing Grace, three reusable templates,\nand one example Sunday service. Bible packages are downloaded separately.\n\nImport each resource through its matching Selah library:\nSongs: Libraries > Songs > Import song (one JSON at a time).\nTemplates: Libraries > Templates > Import (.churchtemplate).\nService preset: Programs > Import (.churchprogram).\n\nFonts: Inter and Noto Sans Telugu are bundled with Selah. Georgia uses the\nsystem-installed font; choose another serif if unavailable on your computer.\n\nOriginal demo lyrics and new layouts: CC0. Amazing Grace and WEB text: public domain.\nKeep credits when sharing and check presentation previews before taking content live.\n'''
zip_bytes(output / 'selah-starter-kit.zip', starter)
manifest = {'resources': resources, 'starter': {'filename': 'selah-starter-kit.zip', 'bytes': (output / 'selah-starter-kit.zip').stat().st_size}}
(ROOT / 'src/resources.json').write_bytes(dump(manifest))
print(f'Packaged {len(resources)} resources and starter kit.')
