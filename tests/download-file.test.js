import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { saveRemoteFile } from "../src/download-file.js";

function browserStub() {
  const state = { clicks: 0, removed: 0, revoked: [], deferred: [] };
  const anchor = {
    click() {
      state.clicks++;
    },
    remove() {
      state.removed++;
    },
  };
  return {
    state,
    anchor,
    document: { createElement: () => anchor, body: { append() {} } },
    urls: {
      createObjectURL: () => "blob:saved-file",
      revokeObjectURL: (url) => state.revoked.push(url),
    },
    defer: (callback) => state.deferred.push(callback),
  };
}
test("XML is saved using its original filename instead of navigating to a raw document", async () => {
  const stub = browserStub();
  await saveRemoteFile(
    "https://raw.githubusercontent.com/example/file.xml",
    "TeluguBible.xml",
    {
      ...stub,
      fetch: async () => ({
        ok: true,
        blob: async () => new Blob(["<bible/>"], { type: "text/xml" }),
      }),
    },
  );
  assert.equal(stub.anchor.href, "blob:saved-file");
  assert.equal(stub.anchor.download, "TeluguBible.xml");
  assert.equal(stub.state.clicks, 1);
  assert.equal(stub.state.removed, 1);
  assert.deepEqual(stub.state.revoked, []);
  stub.state.deferred[0]();
  assert.deepEqual(stub.state.revoked, ["blob:saved-file"]);
});
test("failed and empty responses do not create a bogus download", async () => {
  for (const response of [
    { ok: false, status: 404 },
    { ok: true, blob: async () => new Blob([]) },
  ]) {
    const stub = browserStub();
    await assert.rejects(
      saveRemoteFile("https://example.com/file.xml", "file.xml", {
        ...stub,
        fetch: async () => response,
      }),
    );
    assert.equal(stub.state.clicks, 0);
  }
});
test("the complete catalog uses the newly selected repository and preserves unique original XML paths", () => {
  const catalog = JSON.parse(
    readFileSync(new URL("../src/bible-catalog.json", import.meta.url)),
  );
  assert.equal(catalog.repository, "nani-samireddy/Holy-Bible-XML-Format");
  assert.equal(catalog.branch, "master");
  assert.equal(catalog.count, 1048);
  assert.equal(catalog.files.length, catalog.count);
  assert.equal(
    new Set(catalog.files.map((file) => file.path)).size,
    catalog.count,
  );
  assert.ok(catalog.files.some((file) => file.filename === "TeluguBible.xml"));
  for (const file of catalog.files) {
    assert.ok(file.path.endsWith(".xml"));
    assert.ok(file.bytes > 0);
    assert.match(file.sourceSha, /^[a-f0-9]{40}$/);
  }
});
