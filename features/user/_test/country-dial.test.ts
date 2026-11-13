import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  dialCodeForCountryName,
  resolveCountryDialFromCentres,
} from "@/features/user/lib/country-dial";

describe("dialCodeForCountryName", () => {
  it("maps known country names", () => {
    assert.equal(dialCodeForCountryName("Singapore"), "+65");
    assert.equal(dialCodeForCountryName("india"), "+91");
    assert.equal(dialCodeForCountryName("United States"), "+1");
  });

  it("returns undefined for unknown names", () => {
    assert.equal(dialCodeForCountryName("Atlantis"), undefined);
    assert.equal(dialCodeForCountryName(""), undefined);
  });
});

describe("resolveCountryDialFromCentres", () => {
  it("auto-selects when all centres share one dial", () => {
    const result = resolveCountryDialFromCentres([
      { country: { name: "Singapore" } },
      { country: { name: "Singapore" } },
    ]);
    assert.equal(result.status, "single");
    if (result.status === "single") {
      assert.equal(result.countryCode, "+65");
    }
  });

  it("returns multiple when dials differ", () => {
    const result = resolveCountryDialFromCentres([
      { country: { name: "Singapore" } },
      { country: { name: "India" } },
    ]);
    assert.equal(result.status, "multiple");
    if (result.status === "multiple") {
      assert.deepEqual(result.options.sort(), ["+65", "+91"].sort());
    }
  });

  it("asks when country metadata is missing", () => {
    const result = resolveCountryDialFromCentres([
      { name: "Nishant Test Centre" },
    ]);
    assert.equal(result.status, "ask");
    if (result.status === "ask") {
      assert.equal(result.reason, "missing");
    }
  });

  it("asks when country is unmapped", () => {
    const result = resolveCountryDialFromCentres([
      { country: { name: "France" } },
    ]);
    assert.equal(result.status, "ask");
    if (result.status === "ask") {
      assert.equal(result.reason, "unmapped");
    }
  });

  it("asks when some centres lack country even if others map", () => {
    const result = resolveCountryDialFromCentres([
      { country: { name: "Singapore" } },
      { name: "No country" },
    ]);
    assert.equal(result.status, "ask");
  });
});
