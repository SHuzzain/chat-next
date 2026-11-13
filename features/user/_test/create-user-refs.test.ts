import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  businessTypeIdsFromCentres,
  centreLabels,
  type ResolvedCentre,
} from "@/features/user/lib/create-user-refs";

describe("centreLabels", () => {
  it("prefers name, then code, then id", () => {
    const centres: ResolvedCentre[] = [
      { _id: "1", name: "East Campus" },
      { _id: "2", code: "WEST" },
      { _id: "3" },
    ];
    assert.equal(centreLabels(centres), "East Campus, WEST, 3");
  });
});

describe("businessTypeIdsFromCentres", () => {
  it("returns unique business type ids", () => {
    assert.deepEqual(
      businessTypeIdsFromCentres([
        { _id: "1", businessTypeId: "bt-a" },
        { _id: "2", businessTypeId: "bt-a" },
        { _id: "3", businessTypeId: "bt-b" },
        { _id: "4" },
      ]),
      ["bt-a", "bt-b"],
    );
  });

  it("returns an empty array when centres have no business types", () => {
    assert.deepEqual(
      businessTypeIdsFromCentres([{ _id: "1" }, { _id: "2" }]),
      [],
    );
  });
});
