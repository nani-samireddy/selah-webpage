import releaseSnapshot from "../src/releases.json" with { type: "json" };
import { platformCards, releaseHistory } from "../src/releases-view.js";
import { readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import {
  resources,
  repositoryResources,
  card,
  escape,
} from "../src/resource-catalog.js";

const root = resolve("dist");
const origin = "https://selah.samireddy.com";
const appDescription =
  "Selah is native church presentation software for preparing songs, Scripture, media, custom slides, and service programs, with separate audience and speaker views. It is currently a development preview; public app downloads are being prepared and Windows release validation is ongoing.";
const site = {
  "@type": "WebSite",
  "@id": `${origin}/#website`,
  name: "Selah",
  url: origin + "/",
  inLanguage: "en",
  description:
    "Church presentation software and resources for preparing worship services.",
};
const app = {
  "@type": "SoftwareApplication",
  "@id": `${origin}/#app`,
  name: "Selah",
  url: origin + "/",
  description: appDescription,
  applicationCategory: "MultimediaApplication",
  operatingSystem: ["macOS", "Windows"],
  softwareRequirements:
    "Development preview. Windows release validation is ongoing.",
  screenshot: `${origin}/assets/programs.webp`,
  featureList: [
    "Service programs",
    "Multilingual song lyrics",
    "Offline Bible libraries",
    "Editable presentation templates",
    "Audience and speaker views",
    "Local-network remote control",
    "Dual Bible slides and XML Bible import",
    "Musician chords and ChordPro import",
    "Quick Add and live Scripture reading",
    "Saved service cues and slide transitions",
    "Portable programs and full backup/restore",
    "Optional local Luma search assistant",
    "Offline guides and interactive walkthroughs",
  ],
  sameAs: "https://github.com/nani-samireddy/Selah",
};
async function save(path, text) {
  const target = resolve(root, "." + path);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, text);
}
const json = (data) => JSON.stringify(data).replaceAll("<", "\\u003c");
function metadata(html, { path, title, description, type = "WebPage", items }) {
  const canonical = origin + path;
  let head = html.match(/<head>([\s\S]*?)<\/head>/)[1];
  head = head
    .replace(/<title>[\s\S]*?<\/title>/g, "")
    .replace(
      /<meta\s[^>]*(?:name|property)="(?:description|robots|og:[^"]+|twitter:[^"]+)"[^>]*\/?\s*>/g,
      "",
    )
    .replace(/<link\s[^>]*rel="canonical"[^>]*>/g, "");
  const page = {
    "@type": type,
    "@id": canonical + "#page",
    url: canonical,
    name: title,
    description,
    inLanguage: "en",
    isPartOf: { "@id": site["@id"] },
    about: { "@id": app["@id"] },
  };
  if (path === "/contact/") page.mainEntity = {
    "@type": "Person", "@id": `${origin}/#maintainer`, name: "Sami Reddy",
    email: "mailto:samireddynani0@gmail.com", url: `${origin}/contact/`,
  };
  if (path === "/privacy/") page.dateModified = "2026-11-26";
  const graph = [site, app, page];
  if (releaseSnapshot.releases.length) {
    app.softwareVersion = releaseSnapshot.releases[0].tag;
    app.releaseNotes = `${origin}/changelog/`;
  }
  if (path === "/changelog/" && releaseSnapshot.releases.length) {
    const entries = releaseSnapshot.releases.map((r) => ({
      "@type": "Article",
      headline: r.name,
      datePublished: r.publishedAt,
      articleBody: r.notes,
      url: r.url,
      isPartOf: { "@id": page["@id"] },
    }));
    page.hasPart = entries;
  }
  const crumbs = [{ name: "Selah", url: origin + "/" }];
  if (path.startsWith("/downloads/bibles/"))
    crumbs.push({ name: "Resources", url: origin + "/downloads/" });
  if (path !== "/") crumbs.push({ name: title, url: canonical });
  graph.push({
    "@type": "BreadcrumbList",
    "@id": canonical + "#breadcrumbs",
    itemListElement: crumbs.map((x, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: x.name,
      item: x.url,
    })),
  });
  if (items) {
    const list = {
      "@type": "ItemList",
      "@id": canonical + "#resources",
      name: title,
      numberOfItems: items.length,
      itemListElement: items.map((r, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "CreativeWork",
          name: r.title,
          description: r.description,
          url: r.source || `${origin}/downloads/`,
          encoding: {
            "@type": "MediaObject",
            contentUrl:
              r.downloadUrl ||
              `${origin}/downloads/files/${encodeURIComponent(r.filename)}`,
            encodingFormat: r.downloadUrl
              ? "application/xml"
              : r.filename.endsWith(".zip")
                ? "application/zip"
                : "application/json",
          },
          ...(r.source ? { isBasedOn: r.source } : {}),
        },
      })),
    };
    graph.push(list);
    page.mainEntity = { "@id": list["@id"] };
  }
  const md = path === "/" ? "/index.md" : `${path}index.md`;
  const tags = `<title>${escape(title)}</title>\n<meta name="description" content="${escape(description)}">\n<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">\n<link rel="canonical" href="${canonical}">\n<meta property="og:site_name" content="Selah"><meta property="og:locale" content="en_US"><meta property="og:type" content="website"><meta property="og:title" content="${escape(title)}"><meta property="og:description" content="${escape(description)}"><meta property="og:url" content="${canonical}"><meta property="og:image" content="${origin}/assets/programs.webp"><meta property="og:image:width" content="1440"><meta property="og:image:height" content="906"><meta property="og:image:alt" content="Selah church presentation software with a prepared Sunday service"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escape(title)}"><meta name="twitter:description" content="${escape(description)}"><meta name="twitter:image" content="${origin}/assets/programs.webp"><meta name="twitter:image:alt" content="Selah church presentation app"><link rel="describedby" href="/llms.txt"><link rel="alternate" type="text/markdown" href="${md}"><link rel="manifest" href="/site.webmanifest"><script type="application/ld+json">${json({ "@context": "https://schema.org", "@graph": graph })}</script>`;
  return html.replace(
    /<head>[\s\S]*?<\/head>/,
    `<head>${head}\n${tags}</head>`,
  );
}
const homePath = resolve(root, "index.html");
let home = await readFile(homePath, "utf8");
home = metadata(home, {
  path: "/",
  title: "Selah — Church Presentation Software for Worship Services",
  description:
    "Prepare worship services with bilingual lyrics, dual Bible slides, musician chords, media, Quick Add, and speaker views. Explore the Selah desktop app.",
});
await writeFile(homePath, home);
let downloads = await readFile(resolve(root, "downloads/index.html"), "utf8");
downloads = downloads.replace(
  /<div class="resource-grid" id="resource-grid"><\/div>/,
  `<div class="resource-grid" id="resource-grid">${resources.slice(0, 12).map(card).join("")}</div>`,
);
downloads = downloads.replace(
  /<noscript>[\s\S]*?<\/noscript>/,
  `<noscript><p>Browse the <a href="/downloads/bibles/">complete XML Bible catalog</a> without JavaScript, or download any starter resource below.</p></noscript>`,
);
downloads = metadata(downloads, {
  path: "/downloads/",
  title: "Selah Downloads — XML Bibles, Songs, Presets & Templates",
  description: `Download ${repositoryResources.length.toLocaleString()} original XML Bible files, song collections, service presets, and editable templates. Search by language and find import instructions.`,
  type: "CollectionPage",
  items: resources.slice(0, 12),
});
await writeFile(resolve(root, "downloads/index.html"), downloads);
for (const [route, title, description, marker, content] of [
  [
    "download",
    "Download Selah for macOS and Windows",
    "Find published Selah desktop app builds for macOS and Windows, with platform availability, installer links, and release requirements.",
    "<!-- RELEASE_PLATFORMS -->",
    platformCards(releaseSnapshot.releases),
  ],
  [
    "changelog",
    "Selah Changelog — Release Notes and Version History",
    "Follow published Selah releases, improvements, version history, and platform build availability.",
    "<!-- RELEASE_HISTORY -->",
    releaseHistory(releaseSnapshot.releases),
  ],
]) {
  const file = resolve(root, route, "index.html");
  let html = (await readFile(file, "utf8")).replace(marker, content);
  html = metadata(html, {
    path: `/${route}/`,
    title,
    description,
    type: route === "changelog" ? "CollectionPage" : "WebPage",
  });
  await writeFile(file, html);
  await save(
    `/${route}/index.md`,
    `# ${title}\n\n${description}\n\n${releaseSnapshot.releases.length ? releaseSnapshot.releases.map((r) => `## ${r.name} (${r.tag})\n\n${r.notes}\n\nSource: ${r.url}\n`).join("\n") : "No public app releases have been published. macOS and Windows installer links appear only when a matching release asset is published."}\n`,
  );
}
// Keep the plain-text references aligned with the visible information pages.
const informationMarkdown = [];
for (const [route, title, description, type] of [
  ["privacy", "Selah Privacy Policy", "How Selah handles website requests, local app data, optional online features, and support enquiries.", "WebPage"],
  ["contact", "Contact Selah", "Contact Sami Reddy for Selah support, product feedback, privacy requests, and security enquiries.", "ContactPage"],
]) {
  const file = resolve(root, route, "index.html");
  let html = await readFile(file, "utf8");
  const main = html.match(/<main id="main">([\s\S]*?)<\/main>/)[1];
  const markdown = main
    .replace(/<aside[\s\S]*?<\/aside>/g, "")
    .replace(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g, (_, href, label) => `[${label.replace(/<[^>]+>/g, "")}](${href.startsWith("/") ? origin + href : href})`)
    .replace(/<h1[^>]*>/g, "# ").replace(/<h2[^>]*>/g, "## ")
    .replace(/<br\s*\/?>/g, " ")
    .replace(/<li>/g, "\n- ")
    .replace(/<\/(?:h1|h2|p|section|article)>/g, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replaceAll("&amp;", "&").replaceAll("&gt;", ">").replaceAll("&lt;", "<")
    .replace(/\n{3,}/g, "\n\n").trim() + "\n";
  informationMarkdown.push(markdown);
  html = metadata(html, {path: `/${route}/`, title, description, type});
  await writeFile(file, html);
  await save(`/${route}/index.md`, markdown);
}

const template = await readFile(resolve(root, "catalog.html"), "utf8");
const pageSize = 24,
  total = Math.ceil(repositoryResources.length / pageSize);
const pagePath = (n) =>
  n === 1 ? "/downloads/bibles/" : `/downloads/bibles/page/${n}/`;
const pages = ["/", "/downloads/", "/download/", "/changelog/", "/privacy/", "/contact/"];
const allMarkdown = [];
for (let n = 1; n <= total; n++) {
  const path = pagePath(n),
    batch = repositoryResources.slice((n - 1) * pageSize, n * pageSize);
  const title =
    n === 1
      ? "XML Bible Downloads — Complete Selah Catalog"
      : `XML Bible Downloads — Page ${n} of ${total} | Selah`;
  const description = `Browse original XML Bible files ${1 + (n - 1) * pageSize}–${Math.min(n * pageSize, repositoryResources.length)} of ${repositoryResources.length}. Includes ${batch
    .slice(0, 3)
    .map((r) => r.title)
    .join(", ")}. Download original files and view source attribution.`;
  const nav = `<nav class="catalog-pages" aria-label="Bible catalog pages">${n > 1 ? `<a rel="prev" href="${pagePath(n - 1)}">Previous page</a>` : ""}${Array.from(
    { length: total },
    (_, i) => i + 1,
  )
    .map((i) =>
      i === n
        ? `<span aria-current="page">${i}</span>`
        : `<a href="${pagePath(i)}" aria-label="Bible catalog page ${i}">${i}</a>`,
    )
    .join(
      "",
    )}${n < total ? `<a rel="next" href="${pagePath(n + 1)}">Next page</a>` : ""}</nav>`;
  const main = `<main id="main"><section class="catalog-intro section-wrap"><nav class="breadcrumbs" aria-label="Breadcrumb"><a href="/">Selah</a><span>/</span><a href="/downloads/">Downloads</a><span>/</span><span aria-current="page">XML Bibles</span></nav><p class="eyebrow muted">THE COMPLETE BIBLE FILE CATALOG</p><h1>XML Bible downloads${n > 1 ? ` · Page ${n}` : ""}</h1><p>Browse all ${repositoryResources.length.toLocaleString()} original XML files from <a class="catalog-link" href="https://github.com/nani-samireddy/Holy-Bible-XML-Format">Holy-Bible-XML-Format</a>. This catalog works without JavaScript. For search and language filters, use the <a class="catalog-link" href="/downloads/">interactive resource library</a>.</p><p>These are original Beblia XML files. Import a downloaded file through Libraries → Bible → Import translation, or browse the catalog in the app. Imported Bibles work offline. File rights and attribution remain with their sources.</p>${nav}</section><section class="catalog-results section-wrap" aria-label="Bible files"><p id="download-status" role="status" aria-live="polite"></p><div class="resource-grid">${batch.map((r) => card(r).replaceAll("<h3>", "<h2>").replaceAll("</h3>", "</h2>")).join("")}</div>${nav}</section></main>`;
  let html = template.replace(/<main id="main">[\s\S]*?<\/main>/, main);
  html = metadata(html, {
    path,
    title,
    description,
    type: "CollectionPage",
    items: batch,
  });
  await save(path + "index.html", html);
  pages.push(path);
  const md = `# ${title}\n\n${description}\n\nSource: https://github.com/nani-samireddy/Holy-Bible-XML-Format\n\nOriginal Beblia XML; import through Libraries → Bible → Import translation in the current app. Source rights are not reassigned.\n\n${batch.map((r) => `- [${r.title}](${r.downloadUrl}): ${r.filename}; ${r.bytes} bytes. [Source](${r.source}).`).join("\n")}\n\n${n > 1 ? `[Previous page](${origin + pagePath(n - 1)}index.md)\n` : ""}${n < total ? `[Next page](${origin + pagePath(n + 1)}index.md)\n` : ""}`;
  await save(path + "index.md", md);
  allMarkdown.push(md);
}
await rm(resolve(root, "catalog.html"));
const facts = `# Selah\n\n> Native church presentation software for preparing and presenting worship services.\n\n${appDescription}\n\n## Features\n\n- Prepare songs, Scripture, images, video, audio, and custom slides in saved service programs.\n- Work with paired original and translated song lyrics and reusable arrangements.\n- Use bundled offline English WEB, Telugu IRV, and Hindi IRV Bible libraries. Import additional XML/JSON Bibles and show two translations together.\n- Import ChordPro songs and show chords/cues on musician screens while audience lyrics stay clean.\n- Preview and queue songs, Scripture, text, or media through Quick Add; return to your saved service afterward.\n- Follow Scripture readings verse by verse, without rewriting the saved program.\n- Run saved service cue sequences for displays, countdowns, media, and configured equipment commands.\n- Style reusable layouts with gradients, images, transparency, text fitting, downloadable fonts, and presentation slide transitions.\n- Export portable programs with media/template snapshots; back up and restore the complete workspace. Matching fonts are needed on the destination computer.\n- Optionally download and enable Luma for local song/Scripture search proposals, reviewed before running. No AI is required for normal use.\n- Follow offline user guides and interactive walkthroughs; choose light/dark/system appearance, reduced motion, and interface sounds.\n- Create editable layouts and explicitly take prepared content live.\n- Use dedicated audience and speaker views, private notes, and timers.\n- Pair a phone or tablet on a trusted local network for control or a read-only speaker view. Physical-device validation is ongoing.\n\n## Availability\n\nThe application is a development preview, targeting macOS and Windows. Windows release validation is ongoing. Public app downloads and supported release requirements will be shared when ready. No app price or commercial license is announced on this site. Resource downloads are available now. The source is at https://github.com/nani-samireddy/Selah.\n\n## Resources\n\nThe library contains ${repositoryResources.length} original XML Bible files from Holy-Bible-XML-Format, plus three Selah JSON Bible packages, two song collections, three templates, and one service preset. External files retain source attribution and rights. Original demo lyrics are CC0; Amazing Grace is public domain. Telugu and Hindi IRV packages retain Bridge Connectivity Solutions attribution and CC BY-SA 4.0 notices.\n\nThe current app imports XML and JSON translations through Libraries → Bible → Import translation, including the website’s original Beblia XML files. Existing bundled translations need no reimporting.\n\n## Links\n\n- [App downloads](${origin}/download/)\n- [Changelog](${origin}/changelog/)\n- [Website](${origin}/)\n- [Downloads](${origin}/downloads/)\n- [Static XML catalog](${origin}/downloads/bibles/)\n- [Source code](https://github.com/nani-samireddy/Selah)\n`;
const downloadMd = `# Selah resource downloads\n\nFind songs, service presets, templates, and Bible packages at ${origin}/downloads/.\n\n## Import instructions\n\n- Selah JSON Bibles: unzip; Libraries → Bible → Import translation. Bundled versions need no reimport.\n- Repository Bibles: download the original XML, then Libraries → Bible → Import translation; imported Bibles work offline.\n- Song collections: unzip; Libraries → Songs → Import song, one JSON at a time.\n- Templates: Libraries → Templates → Import the .churchtemplate file.\n- Service preset: Programs → Import the .churchprogram file, then update its date and title.\n\n## Starter resources\n\n${resources
  .slice(0, 9)
  .map(
    (r) =>
      `- [${r.title}](${origin}/downloads/files/${r.filename}): ${r.format}; ${r.license}. ${r.instruction}`,
  )
  .join(
    "\n",
  )}\n\n## XML Bible catalog\n\n${repositoryResources.length} original repository files, organized into ${total} crawlable pages. [Start here](${origin}/downloads/bibles/index.md). [Machine-readable catalog](${origin}/bible-catalog.json).\n`;
await save("/index.md", facts);
await save("/downloads/index.md", downloadMd);
await save(
  "/bible-catalog.json",
  await readFile("src/bible-catalog.json", "utf8"),
);
await save(
  "/llms.txt",
  `# Selah\n\n> Native church presentation app and resource library for worship services.\n\nThe app is a development preview; public app downloads are being prepared. Website resource downloads are available. External Bible files remain original Beblia XML and can be imported through Libraries → Bible → Import translation in the current app. This file is a navigation aid, not a ranking or citation guarantee.\n\n## Product\n\n- [App downloads](${origin}/download/index.md): Platform installers and availability.\n- [Changelog](${origin}/changelog/index.md): Published version history.\n- [Privacy policy](${origin}/privacy/index.md): Data practices, local storage, optional services, and privacy requests.\n- [Contact](${origin}/contact/index.md): Support, feedback, and private enquiries.\n- [Selah facts and availability](${origin}/index.md): Features, status, platforms, and resource attribution.\n- [Downloads and import guide](${origin}/downloads/index.md): Songs, templates, service presets, and Bible package instructions.\n\n## Bible files\n\n- [Complete XML catalog](${origin}/downloads/bibles/index.md): ${repositoryResources.length} original files with download links, paginated in Markdown.\n- [Bible catalog data](${origin}/bible-catalog.json): Original filenames, sizes, source hashes, and language groups.\n\n## Optional\n\n- [Expanded reference](${origin}/llms-full.txt): Product facts, resource guide, and the complete file listing.\n- [App source](https://github.com/nani-samireddy/Selah): Selah development project.\n- [Bible source](https://github.com/nani-samireddy/Holy-Bible-XML-Format): Original XML collection.\n`,
);
await save(
  "/llms-full.txt",
  facts +
    "\n" +
    downloadMd +
    "\n" +
    (await readFile(resolve(root, "download/index.md"), "utf8")) +
    "\n" +
    (await readFile(resolve(root, "changelog/index.md"), "utf8")) +
    "\n" +
    informationMarkdown.join("\n") + "\n" + allMarkdown.join("\n"),
);
await save(
  "/sitemap.xml",
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map((p) => `  <url><loc>${origin + p}</loc></url>`).join("\n")}\n</urlset>\n`,
);
await save(
  "/robots.txt",
  `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`,
);
await save("/.nojekyll", "");
let notFound = template.replace(
  /<main id="main">[\s\S]*?<\/main>/,
  `<main id="main" class="catalog-intro section-wrap"><h1>Page not found.</h1><p>Visit the <a class="catalog-link" href="/">Selah homepage</a> or <a class="catalog-link" href="/downloads/">Downloads library</a>.</p></main>`,
);
notFound = metadata(notFound, {
  path: "/404.html",
  title: "Page Not Found — Selah",
  description: "Find the Selah homepage and resource library.",
}).replace(
  "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1",
  "noindex,follow",
);
notFound = notFound.replace(
  /<link rel="alternate" type="text\/markdown"[^>]*>/g,
  "",
);
await save("/404.html", notFound);
console.log(
  `Generated ${pages.length} indexable pages, structured data, sitemap, and Markdown/LLM references.`,
);
