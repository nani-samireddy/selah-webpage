import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        appDownload: fileURLToPath(
          new URL("./download/index.html", import.meta.url),
        ),
        changelog: fileURLToPath(
          new URL("./changelog/index.html", import.meta.url),
        ),
        privacy: fileURLToPath(new URL("./privacy/index.html", import.meta.url)),
        contact: fileURLToPath(new URL("./contact/index.html", import.meta.url)),
        catalog: fileURLToPath(new URL("./catalog.html", import.meta.url)),
        home: fileURLToPath(new URL("./index.html", import.meta.url)),
        downloads: fileURLToPath(
          new URL("./downloads/index.html", import.meta.url),
        ),
      },
    },
  },
});
