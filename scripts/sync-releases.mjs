import { writeFile } from "node:fs/promises";
const repository = "nani-samireddy/Selah";
const headers = {
  Accept: "application/vnd.github+json",
  "User-Agent": "Selah-website",
};
if (process.env.GH_TOKEN)
  headers.Authorization = `Bearer ${process.env.GH_TOKEN}`;
const releases = [];
for (let page = 1; page <= 10; page++) {
  const response = await fetch(
    `https://api.github.com/repos/${repository}/releases?per_page=100&page=${page}`,
    { headers, signal: AbortSignal.timeout(20000) },
  );
  if (!response.ok)
    throw new Error(
      `GitHub releases request failed (${response.status}); existing snapshot was preserved.`,
    );
  const batch = await response.json();
  for (const r of batch.filter((r) => !r.draft))
    releases.push({
      tag: r.tag_name,
      name: r.name || r.tag_name,
      publishedAt: r.published_at,
      preview: r.prerelease,
      url: r.html_url,
      notes: r.body || "",
      assets: r.assets
        .filter((a) => a.state === "uploaded")
        .map((a) => ({
          name: a.name,
          bytes: a.size,
          url: a.browser_download_url,
        })),
    });
  if (batch.length < 100) break;
}
await writeFile(
  "src/releases.json",
  JSON.stringify({ repository, releases }, null, 2) + "\n",
);
console.log(`Synced ${releases.length} published releases.`);
