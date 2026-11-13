import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  avatarFileFromParts,
  avatarPartsFromSecret,
} from "@/features/user/lib/avatar-from-secret";

describe("avatarPartsFromSecret", () => {
  it("reads avatar* keys and builds a File", () => {
    const pngBase64 = Buffer.from([137, 80, 78, 71]).toString("base64");
    const parts = avatarPartsFromSecret({
      avatarBase64: pngBase64,
      avatarFilename: "ada.png",
      avatarMediaType: "image/png",
    });
    assert.equal(parts.filename, "ada.png");
    const file = avatarFileFromParts(parts);
    assert.equal(file.name, "ada.png");
    assert.equal(file.type, "image/png");
  });

  it("rejects non-image filenames", () => {
    assert.throws(() =>
      avatarPartsFromSecret({
        avatarBase64: "aaaa",
        avatarFilename: "notes.pdf",
      }),
    );
  });
});
