import test from "node:test";
import assert from "node:assert/strict";
import {
  platformCards,
  releaseHistory,
  assetsFor,
} from "../src/releases-view.js";
test("unpublished builds are described honestly without fake installers or versions", () => {
  const html = platformCards([]);
  assert.match(html, /No public macOS build yet/);
  assert.match(html, /No public Windows build yet/);
  assert.doesNotMatch(html, /releases\/download\//);
  assert.match(releaseHistory([]), /No public versions/);
});
test("platform installers use only assets from the actual release", () => {
  const r = {
    tag: "v1.0.0",
    name: "First release",
    preview: false,
    publishedAt: "2026-11-22T00:00:00Z",
    url: "https://github.com/nani-samireddy/Selah/releases/tag/v1.0.0",
    notes: "<script>unsafe</script>",
    assets: [
      {
        name: "Selah-macOS-arm64.dmg",
        bytes: 1024,
        url: "https://github.com/nani-samireddy/Selah/releases/download/v1.0.0/Selah-macOS-arm64.dmg",
      },
    ],
  };
  assert.equal(assetsFor(r, "macos").length, 1);
  assert.equal(assetsFor(r, "windows").length, 0);
  assert.match(platformCards([r]), /No public Windows build yet/);
  assert.match(platformCards([r]), /Selah-macOS-arm64.dmg/);
  assert.doesNotMatch(releaseHistory([r]), /<script>/);
});
