import "./style.css";
import "./downloads.css";
import "./navigation.js";
import {
  catalog,
  bibleCatalog,
  resources,
  card,
  size,
} from "./resource-catalog.js";
import { saveRemoteFile } from "./download-file.js";

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
let category = "all";
const categories = {
  bibles: "Bible",
  songs: "Song collection",
  presets: "Service preset",
  templates: "Template",
};
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
