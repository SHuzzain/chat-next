import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  staffTypeListBodySchema,
  staffTypeListFields,
  staffTypeListSchema,
} from "./staff-type-list";

describe("staffTypeListSchema", () => {
  it("accepts advanceFilter and advanceFilterSelect", () => {
    const body = staffTypeListBodySchema.parse({
      advanceFilter: [
        {
          field: "staffType",
          type: "Contains",
          value: ["Teacher"],
        },
      ],
      advanceFilterSelect: ["_id", "staffType", "businessType"],
      businessTypeIds: ["507f1f77bcf86cd799439011"],
    });
    assert.equal(body.advanceFilter?.length, 1);
    assert.deepEqual(body.advanceFilterSelect, [
      "_id",
      "staffType",
      "businessType",
    ]);
    assert.equal(body.businessTypeIds?.length, 1);
  });

  it("maps centreId to courseCentre on the wire query", () => {
    const parsed = staffTypeListSchema.query.parse({
      centreId: "507f1f77bcf86cd799439011",
      textSearch: "Principal",
    });
    const { query } = staffTypeListFields.toWireRequest({
      query: parsed as Record<string, unknown>,
      body: {},
    });
    assert.equal(query.courseCentre, "507f1f77bcf86cd799439011");
    assert.equal(query.centreId, undefined);
    assert.equal(query.textSearch, "Principal");
  });
});
