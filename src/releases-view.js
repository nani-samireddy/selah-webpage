const esc = (text) =>
  String(text).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export function assetsFor(release, platform) {
  return (release?.assets || []).filter(
    (asset) =>
      asset.url.startsWith(
        "https://github.com/nani-samireddy/Selah/releases/download/",
      ) &&
      (platform === "macos"
        ? /\.dmg$|(?:macos|darwin|osx).*\.(zip|pkg)$/i.test(asset.name)
        : /\.(exe|msi)$|(?:windows|win32|win64|win-x64).*\.zip$/i.test(
            asset.name,
          )),
  );
}
export function latestRelease(releases) {
  return releases.find((r) => !r.preview) || releases[0];
}
const fileSize = (bytes) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;
export function platformCards(releases) {
  const latest = latestRelease(releases);
  return ["macos", "windows"]
    .map((platform) => {
      const name = platform === "macos" ? "macOS" : "Windows";
      const assets = assetsFor(latest, platform);
      return `<article class="platform-card"><span class="platform-label">${platform === "macos" ? "THE MAC APP" : "THE WINDOWS APP"}</span><h2>Selah for ${name}</h2><p>${platform === "macos" ? "A native desktop workspace for preparing and presenting your service." : "The same service workflow, designed for your Windows setup."}</p>${assets.length ? `<p class="release-badge">${latest.preview ? "Preview release" : "Latest release"} · ${esc(latest.tag)}</p>${assets.map((asset) => `<a class="button button-white" href="${esc(asset.url)}" download>${esc(asset.name)} · ${fileSize(asset.bytes)}</a>`).join("")}<p class="platform-status">Check this release’s notes for supported OS versions, architecture, and installation steps.</p><a class="subtle-link" href="${esc(latest.url)}">Release notes and requirements</a>` : `<p class="release-badge">No public ${name} build yet</p><p class="platform-status">${platform === "windows" ? "Windows release validation is ongoing." : "Selah is currently a development preview."} Installer links and system requirements will appear here when a public build is published.</p><a class="subtle-link" href="https://github.com/nani-samireddy/Selah/releases">Follow releases on GitHub</a>`}</article>`;
    })
    .join("");
}
export function releaseHistory(releases) {
  if (!releases.length)
    return `<div class="release-empty"><span class="platform-label">BEFORE THE FIRST PUBLIC RELEASE</span><h2>Good things are taking shape.</h2><p>No public versions have been published yet. When a release is published on GitHub, its version, release date, notes, and installer links will appear here.</p><a class="button button-white" href="https://github.com/nani-samireddy/Selah/releases">View GitHub releases</a></div>`;
  return releases
    .map(
      (release) =>
        `<article class="release-entry"><div class="release-meta"><span class="release-badge">${release.preview ? "Preview" : "Release"} ${esc(release.tag)}</span><time datetime="${esc(release.publishedAt)}">${esc(new Intl.DateTimeFormat("en", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" }).format(new Date(release.publishedAt)))}</time></div><h2>${esc(release.name)}</h2><div class="release-notes">${esc(release.notes || "See GitHub for release details.")}</div><a class="subtle-link" href="${esc(release.url)}">Full release notes on GitHub</a><a class="subtle-link" href="/download/">Platform downloads</a></article>`,
    )
    .join("");
}
