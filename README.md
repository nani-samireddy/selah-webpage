# Selah landing page

A responsive Vite landing page for Selah, a native church presentation app. Inspired by Woday's typography and page structure, with Selah branding and fresh app screenshots.

## Run locally

```sh
npm ci
npm run dev
```

## Build

```sh
npm run build
npm run preview
```

GitHub Pages deploys `dist` through the included GitHub Actions workflow. The custom domain is `selah.samireddy.com`.

## Content and assets

The app screenshots were captured from a separate Selah verification instance populated with the six-item service in `content/sunday-worship.churchprogram`. User libraries were not edited. Screenshots are cropped only to exclude the OS overlay and app toolbar, then compressed to WebP; their interface content is unchanged.

Amazing Grace: John Newton, 1779, public domain. Scripture: World English Bible, public domain. The bilingual illustration uses original sample lyrics from the Selah project. Inter and Noto Sans Telugu retain their bundled OFL notices in `public/assets`.

The website describes Selah as a development preview. No public download, customer testimonials, or pricing is implied.

## Downloads page

`/downloads/` is a separate Vite entry point. Its searchable catalog is generated in `src/resources.json`; files are served from `public/downloads/files/`.

To rebuild the packages from a neighboring Selah checkout:

```sh
python3 scripts/prepare-downloads.py --source ../church-deck
npm test
npm run build
```

The catalog includes three complete 66-book Bible packages, two song collections, three bound templates, and a six-item service preset. The starter kit contains songs, templates, and the service preset; Bibles are separate downloads. Verse text and source notices are preserved. Five blank WEB source records are omitted to satisfy Selah's nonempty-verse import requirement; original numbering remains intact and this is documented inside its ZIP. Already-bundled translations do not need reimporting.

Bible metadata and original source notices retain their public-domain or CC BY-SA terms. Original example lyrics explicitly marked CC0 are included; the user-supplied song without established distribution terms is excluded. Newly created layouts are CC0.

## Repository Bible catalog

The Downloads page additionally indexes all 1,048 XML files from `nani-samireddy/Holy-Bible-XML-Format` on its `master` branch. These files are not mirrored or converted. Search covers original filenames and display names; language groups follow the repository filename prefixes. Results are paginated in batches of 12.

Refresh the checked-in public metadata with:

```sh
python3 scripts/sync-bible-catalog.py
```

The sync uses GitHub's recursive tree API rather than the Contents API's 1,000-entry directory limit, and refuses truncated results. File paths, sizes, and Git blob hashes are retained. The build needs no GitHub credentials or network calls.

XML Download buttons fetch the original file via CORS, create a temporary blob URL, and trigger a browser download with its original filename. Failed, empty, or timed-out requests show a retry state. Source links remain available separately. These repository files use Beblia XML, so importing them requires app support for that format; this website does not claim they are Selah JSON or assign a new license to them.
