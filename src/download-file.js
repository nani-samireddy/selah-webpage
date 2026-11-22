// A raw GitHub URL can open XML in the browser. A same-origin blob URL with a
// download filename always requests a saved file, regardless of its MIME type.
export async function saveRemoteFile(url, filename, options = {}) {
  const request = options.fetch ?? globalThis.fetch;
  const doc = options.document ?? globalThis.document;
  const urls = options.urls ?? globalThis.URL;
  const defer = options.defer ?? globalThis.setTimeout;
  const response = await request(url, { mode: "cors", credentials: "omit",
    signal: AbortSignal.timeout(60_000) });
  if (!response.ok) throw new Error(`Download failed (${response.status}).`);
  const blob = await response.blob();
  if (!blob.size) throw new Error("The downloaded file is empty.");
  const blobUrl = urls.createObjectURL(blob);
  const link = doc.createElement("a");
  link.href = blobUrl;
  link.download = filename;
  link.hidden = true;
  doc.body.append(link);
  try {
    link.click();
  } finally {
    link.remove();
    // Allow the browser time to begin saving before releasing the object URL.
    defer(() => urls.revokeObjectURL(blobUrl), 60_000);
  }
}
