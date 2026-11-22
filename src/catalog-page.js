import "./style.css";
import "./downloads.css";
import "./navigation.js";
import { saveRemoteFile } from "./download-file.js";
const active = new Set();
document.addEventListener("click", async (event) => {
  const link = event.target.closest("a[data-remote-download]");
  if (!link) return;
  event.preventDefault();
  if (active.has(link.href)) return;
  active.add(link.href);
  const text = link.querySelector("span");
  const status = document.querySelector("#download-status");
  text.textContent = "Downloading…";
  link.setAttribute("aria-disabled", "true");
  try {
    await saveRemoteFile(link.href, link.download);
    text.textContent = "Download again";
    status.textContent = `${link.download} is ready in your browser downloads.`;
  } catch {
    text.textContent = "Retry download";
    status.textContent = "Download failed. Try again or use the source link.";
  } finally {
    active.delete(link.href);
    link.removeAttribute("aria-disabled");
  }
});
