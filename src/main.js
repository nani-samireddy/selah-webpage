import "./style.css";

const workspaces = {
  programs: {
    tag: "PROGRAMS",
    title: "One service. Every detail.",
    description:
      "Gather songs, Scripture, and slides into a saved service order. Arrange each moment and add private notes, all before Sunday arrives.",
    alt: "Selah Programs with a populated Sunday service, welcome slides, hymns, and Scripture",
  },
  design: {
    tag: "DESIGN",
    title: "Your message. Your canvas.",
    description:
      "Shape the look of your service with editable text, layers, backgrounds, and reusable templates. Create once, and make it part of your church’s rhythm.",
    alt: "Selah Design editor with an editable welcome presentation",
  },
  present: {
    tag: "PRESENT",
    title: "Ready for the next moment.",
    description:
      "Keep live and upcoming slides in view. Navigate the whole service, see speaker notes, and control the audience output from one focused workspace.",
    alt: "Selah Present workspace displaying Amazing Grace and the next verse",
  },
};
const tabs = [...document.querySelectorAll("[data-workspace]")];
function selectWorkspace(tab) {
  const key = tab.dataset.workspace;
  const data = workspaces[key];
  tabs.forEach((item) => {
    const active = item === tab;
    item.setAttribute("aria-selected", String(active));
    item.tabIndex = active ? 0 : -1;
  });
  document.querySelector("#workspace-tag").textContent = data.tag;
  document.querySelector("#workspace-title").textContent = data.title;
  document.querySelector("#workspace-description").textContent =
    data.description;
  const img = document.querySelector("#workspace-image");
  img.src = `/assets/${key}.webp`;
  img.alt = data.alt;
  document.querySelector(".workspace-shot").dataset.image = key;
  document
    .querySelector("#workspace-panel")
    .setAttribute("aria-labelledby", tab.id);
}
tabs.forEach((tab, index) => {
  tab.addEventListener("click", () => selectWorkspace(tab));
  tab.addEventListener("keydown", (event) => {
    let next;
    if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
    if (event.key === "ArrowLeft")
      next = (index + tabs.length - 1) % tabs.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = tabs.length - 1;
    if (next !== undefined) {
      event.preventDefault();
      selectWorkspace(tabs[next]);
      tabs[next].focus();
    }
  });
});
const menuButton = document.querySelector(".menu-button");
const mobileNav = document.querySelector("#mobile-nav");
function closeMenu() {
  mobileNav.hidden = true;
  menuButton.setAttribute("aria-expanded", "false");
  menuButton.setAttribute("aria-label", "Open navigation");
}
menuButton.addEventListener("click", () => {
  const expanded = menuButton.getAttribute("aria-expanded") !== "true";
  mobileNav.hidden = !expanded;
  menuButton.setAttribute("aria-expanded", String(expanded));
  menuButton.setAttribute(
    "aria-label",
    expanded ? "Close navigation" : "Open navigation",
  );
});
mobileNav
  .querySelectorAll("a")
  .forEach((link) => link.addEventListener("click", closeMenu));
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeMenu();
});
const dialog = document.querySelector(".image-dialog");
const captions = {
  programs: "Selah · Programs — a complete Sunday service",
  design: "Selah · Design — make the canvas your own",
  present: "Selah · Present — live and upcoming content",
  scripture: "Selah · Scripture — Psalm 23",
};
document.querySelectorAll("[data-image]").forEach((button) =>
  button.addEventListener("click", () => {
    const key = button.dataset.image;
    const image = document.querySelector("#dialog-image");
    image.src = `/assets/${key}.webp`;
    image.alt = button.querySelector("img").alt;
    document.querySelector("#dialog-caption").textContent = captions[key];
    dialog.showModal();
    document.body.classList.add("dialog-open");
  }),
);
document
  .querySelector(".dialog-close")
  .addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (event) => {
  if (event.target === dialog) {
    const box = dialog.getBoundingClientRect();
    if (
      event.clientX < box.left ||
      event.clientX > box.right ||
      event.clientY < box.top ||
      event.clientY > box.bottom
    )
      dialog.close();
  }
});
dialog.addEventListener("close", () =>
  document.body.classList.remove("dialog-open"),
);
document.querySelector("#year").textContent = new Date().getFullYear();
