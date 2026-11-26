import { readFile, readdir, access } from "node:fs/promises";
import { resolve } from "node:path";
import assert from "node:assert/strict";
import { repositoryResources } from "../src/resource-catalog.js";
const root = resolve("dist");
async function files(dir) {
  const out = [];
  for (const f of await readdir(dir, { withFileTypes: true })) {
    const path = resolve(dir, f.name);
    if (f.isDirectory()) out.push(...(await files(path)));
    else out.push(path);
  }
  return out;
}
const htmlFiles = (await files(root)).filter((f) => f.endsWith(".html"));
let downloadLinks = 0;
for (const path of htmlFiles) {
  const html = await readFile(path, "utf8");
  assert.equal((html.match(/<h1\b/g) || []).length, 1, `One H1: ${path}`);
  assert.equal(
    (html.match(/rel="canonical"/g) || []).length,
    1,
    `One canonical: ${path}`,
  );
  assert.match(html, /<meta name="description" content="[^"]+">/);
  assert.match(html, /property="og:image"/);
  assert.match(html, /name="twitter:card"/);
  assert.match(html, /<html lang="en">/);
  const data = JSON.parse(
    html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1],
  );
  assert.equal(data["@context"], "https://schema.org");
  assert.ok(data["@graph"].some((n) => n["@type"] === "SoftwareApplication"));
  assert.ok(
    !data["@graph"].some((n) => n.aggregateRating || n.offers),
    "No invented ratings or prices",
  );
  for (const m of html.matchAll(/(?:href|src)="([^"#]+)"/g)) {
    const url = m[1];
    if (!url.startsWith("/") || url.startsWith("//")) continue;
    const file = decodeURIComponent(url.split("#")[0].split("?")[0]);
    const target = resolve(
      root,
      "." + file + (file.endsWith("/") ? "index.html" : ""),
    );
    await access(target).catch(() => {
      throw new Error(`Broken internal URL ${url} in ${path}`);
    });
  }
  if (path.includes("/downloads/bibles/"))
    downloadLinks += (html.match(/data-remote-download="true"/g) || []).length;
  if (!path.endsWith("/404.html"))
    assert.match(html, /name="robots" content="index,follow/);
}
assert.equal(
  downloadLinks,
  repositoryResources.length,
  "Every source file appears in a static catalog page",
);
const downloads = await readFile(resolve(root, "downloads/index.html"), "utf8");
assert.ok(
  (downloads.match(/class="resource-card"/g) || []).length >= 12,
  "Initial results are available without JS",
);
const sitemap = await readFile(resolve(root, "sitemap.xml"), "utf8");
assert.equal((sitemap.match(/<loc>/g) || []).length, 50);
for (const path of [
  "llms.txt",
  "llms-full.txt",
  "index.md",
  "downloads/index.md",
  "bible-catalog.json",
  "site.webmanifest",
  ".nojekyll",
])
  await access(resolve(root, path));
assert.match(
  await readFile(resolve(root, "404.html"), "utf8"),
  /noindex,follow/,
);
console.log(
  `SEO checks passed: ${htmlFiles.length} HTML pages, ${downloadLinks} static Bible links, metadata, structured data, and internal URLs.`,
);
