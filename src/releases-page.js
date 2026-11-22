import "./style.css";
import "./downloads.css";
import "./navigation.js";
import snapshot from "./releases.json";
import { platformCards, releaseHistory } from "./releases-view.js";
const grid = document.querySelector("#platform-downloads"),
  history = document.querySelector("#release-history");
function render(data) {
  if (grid) grid.innerHTML = platformCards(data.releases);
  if (history) history.innerHTML = releaseHistory(data.releases);
}
render(snapshot);
// Public release data can appear immediately; the static snapshot remains useful offline.
fetch(
  "https://api.github.com/repos/nani-samireddy/Selah/releases?per_page=100",
  {
    headers: { Accept: "application/vnd.github+json" },
    signal: AbortSignal.timeout(12000),
  },
)
  .then((r) => {
    if (!r.ok) throw new Error("Release feed unavailable");
    return r.json();
  })
  .then((rows) => {
    if (!Array.isArray(rows)) return;
    const releases = rows
      .filter((r) => !r.draft)
      .map((r) => ({
        tag: r.tag_name,
        name: r.name || r.tag_name,
        publishedAt: r.published_at,
        preview: r.prerelease,
        url: r.html_url,
        notes: r.body || "",
        assets: (r.assets || []).map((a) => ({
          name: a.name,
          bytes: a.size,
          url: a.browser_download_url,
        })),
      }));
    render({ releases });
  })
  .catch(() => {});
