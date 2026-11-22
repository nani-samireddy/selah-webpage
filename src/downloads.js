import "./style.css";
import "./downloads.css";
import "./navigation.js";
import catalog from "./resources.json";
import bibleCatalog from "./bible-catalog.json";
import { saveRemoteFile } from "./download-file.js";

const encodedPath = (path) => path.split("/").map(encodeURIComponent).join("/");
const repositoryResources = bibleCatalog.files.map((file) => ({
  ...file,
  id: `repository-${file.path}`,
  category: "bibles",
  format: "Beblia XML",
  description: `Original XML file from the Holy-Bible-XML-Format collection.`,
  license: "Rights and attribution: see the source file.",
  instruction:
    "Saves the original Beblia XML file. Import requires a Selah build that supports Beblia XML; this file is not a converted Selah JSON package.",
  source: `https://github.com/${bibleCatalog.repository}/blob/${bibleCatalog.branch}/${encodedPath(file.path)}`,
  downloadUrl: `https://raw.githubusercontent.com/${bibleCatalog.repository}/${bibleCatalog.branch}/${encodedPath(file.path)}`,
  bundled: false,
}));
const resources = [...catalog.resources, ...repositoryResources];
const activeDownloads = new Set();
const pageSize = 12;
let visibleCount = pageSize;
const languageFilter = document.querySelector("#resource-language");
const languages = [
  ...new Set(resources.map((resource) => resource.language)),
].sort((a, b) => a.localeCompare(b));
languages.forEach((language) => {
  const option = document.createElement("option");
  option.value = language;
  option.textContent = language;
  languageFilter.append(option);
});
document.querySelector("#repository-note").textContent =
  `${bibleCatalog.count.toLocaleString()} XML Bibles from Holy-Bible-XML-Format, alongside Selah’s starter resources.`;

const grid = document.querySelector("#resource-grid");
const search = document.querySelector("#resource-search");
const filterButtons = [...document.querySelectorAll("[data-category]")];
const categories = {
  bibles: "Bible",
  songs: "Song collection",
  presets: "Service preset",
  templates: "Template",
};
let category = "all";
const size = (bytes) =>
  bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;
const escape = (text) =>
  String(text).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const icon = (key) =>
  ({
    bibles:
      '<path d="M16 8C11 4 5 6 3 7v20c5-2 9-2 13 1 4-3 8-3 13-1V7c-2-1-8-3-13 1Zm0 0v20"/>',
    songs:
      '<path d="M12 23V8l14-3v15M12 12l14-3"/><ellipse cx="8" cy="24" rx="4" ry="3"/><ellipse cx="22" cy="21" rx="4" ry="3"/>',
    presets:
      '<rect x="5" y="3" width="22" height="26" rx="3"/><path d="M10 10h12m-12 6h12m-12 6h7"/>',
    templates:
      '<rect x="3" y="5" width="26" height="22" rx="3"/><path d="M3 12h26M13 12v15"/>',
  })[key];
function card(resource) {
  const preview =
    resource.category === "templates"
      ? `<div class="template-preview" style="--preview-bg:${escape(resource.background)};--preview-ink:${escape(resource.ink)}"><span>${resource.kind === "scripture" ? "PSALM 23" : "SUNDAY WORSHIP"}</span><strong>${resource.kind === "scripture" ? "He restores<br>my soul." : resource.kind === "bilingual" ? "One heart.<br>ఒకే హృదయం." : "Amazing<br>grace."}</strong><span>EDITABLE SELAH LAYOUT</span></div>`
      : `<div class="resource-art art-${resource.category}"><svg viewBox="0 0 32 32" aria-hidden="true">${icon(resource.category)}</svg><span>${escape(resource.language)}</span>${resource.category === "bibles" ? `<span class="bundled-label">${resource.bundled === false ? "Repository XML" : "Included in Selah"}</span>` : ""}</div>`;
  return `<article class="resource-card">${preview}<div class="resource-card-body"><div class="resource-category">${categories[resource.category]}<span>${escape(resource.format)}</span></div><h3>${escape(resource.title)}</h3><p class="resource-description">${escape(resource.description)}</p><p class="resource-license">${escape(resource.license)}</p><details class="import-details"><summary>How to use</summary><p>${escape(resource.instruction)}</p>${resource.source ? `<a href="${escape(resource.source)}" target="_blank" rel="noopener noreferrer">Source & attribution</a>` : ""}</details><a class="resource-download" href="${resource.downloadUrl ? escape(resource.downloadUrl) : `/downloads/files/${encodeURIComponent(resource.filename)}`}" ${resource.downloadUrl ? 'data-remote-download="true"' : ""} data-resource-id="${escape(resource.id)}" download="${escape(resource.filename)}" aria-label="Download ${escape(resource.title)}"><span>Download</span><span>${size(resource.bytes)}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m-4-4 4 4 4-4M4 17v4h16v-4"/></svg></span></a></div></article>`;
}
function render() {
  const query = search.value.trim().toLocaleLowerCase();
  const matches = resources.filter(
    (resource) =>
      (category === "all" || resource.category === category) &&
      (!languageFilter.value || resource.language === languageFilter.value) &&
      [
        resource.title,
        resource.filename,
        resource.description,
        resource.language,
        resource.license,
        categories[resource.category],
      ]
        .join(" ")
        .toLocaleLowerCase()
        .includes(query),
  );
  grid.innerHTML = matches.slice(0, visibleCount).map(card).join("");
  document.querySelector("#load-more").hidden = visibleCount >= matches.length;
  document.querySelector("#resource-count").textContent =
    `${matches.length.toLocaleString()} ${matches.length === 1 ? "resource" : "resources"}${query ? ` matching “${search.value.trim()}”` : " to make your own"}${matches.length > visibleCount ? ` · Showing ${visibleCount}` : ""}`;
  document.querySelector("#resource-empty").hidden = matches.length > 0;
}
filterButtons.forEach((button) =>
  button.addEventListener("click", () => {
    category = button.dataset.category;
    visibleCount = pageSize;
    filterButtons.forEach((item) =>
      item.setAttribute("aria-pressed", String(item === button)),
    );
    render();
  }),
);
search.addEventListener("input", () => {
  visibleCount = pageSize;
  render();
});
languageFilter.addEventListener("change", () => {
  visibleCount = pageSize;
  render();
});
document.querySelector("#load-more").addEventListener("click", () => {
  visibleCount += pageSize;
  render();
});
grid.addEventListener("click", async (event) => {
  const link = event.target.closest("a[data-remote-download]");
  if (!link) return;
  event.preventDefault();
  const id = link.dataset.resourceId;
  if (activeDownloads.has(id)) return;
  const resource = resources.find((item) => item.id === id);
  const label = link.querySelector("span");
  const status = document.querySelector("#download-status");
  activeDownloads.add(id);
  link.setAttribute("aria-disabled", "true");
  label.textContent = "Downloading…";
  status.textContent = `Downloading ${resource.title} from GitHub…`;
  try {
    await saveRemoteFile(resource.downloadUrl, resource.filename);
    status.textContent = `${resource.filename} is ready in your browser downloads.`;
    label.textContent = "Download again";
  } catch {
    status.textContent = `Couldn’t download ${resource.title}. Please try again, or use its Source & attribution link.`;
    label.textContent = "Retry download";
  } finally {
    activeDownloads.delete(id);
    link.removeAttribute("aria-disabled");
  }
});
document.querySelector("#clear-search").addEventListener("click", () => {
  search.value = "";
  languageFilter.value = "";
  visibleCount = pageSize;
  category = "all";
  filterButtons.forEach((button) =>
    button.setAttribute(
      "aria-pressed",
      String(button.dataset.category === "all"),
    ),
  );
  render();
  search.focus();
});
document.querySelector("#starter-caption").textContent =
  `Songs, templates, and a service preset · ZIP · ${size(catalog.starter.bytes)}`;
document.querySelector("#year").textContent = new Date().getFullYear();
const header = document.querySelector(".site-header");
window.addEventListener(
  "scroll",
  () => header.classList.toggle("is-scrolled", scrollY > 32),
  { passive: true },
);
render();
