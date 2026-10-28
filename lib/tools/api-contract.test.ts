import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { z } from "zod";

import { paginatedToolInputSchema } from "./api-request";
import { lmsFetch } from "./api-client";
import {
  createLmsCredentialStore,
  LmsCredentialError,
  lmsCredentials,
} from "./api-credential-store";
import { lmsPageSchema } from "./api-response";

const rowSchema = z.object({
  fullName: z.string(),
  progress: z.number().optional(),
  centre: z.array(z.object({ name: z.string() })).optional(),
});

const listInput = paginatedToolInputSchema(rowSchema);
const token = "lms-bearer-token";

afterEach(() => {
  lmsCredentials.clear();
});

describe("paginated LMS contract", () => {
  it("accepts nested filters, sort, and projection paths", () => {
    const parsed = listInput.parse({
      page: "1",
      rowPerPage: "12",
      order: "fullName",
      orderBy: "asc",
      advanceFilter: [
        { field: "fullName", type: "Equals", value: ["Ada"] },
      ],
      advanceFilterSelect: ["fullName", "centre.name"],
    });
    assert.equal(parsed.page, 1);
    assert.deepEqual(parsed.advanceFilter, [
      { field: "fullName", type: "Equals", value: ["Ada"] },
    ]);
  });

  it("rejects Centre paths in advanceFilter (use query.centreId)", () => {
    assert.throws(() =>
      listInput.parse({
        advanceFilter: [
          {
            field: "centre",
            type: "Contains",
            value: ["6adaedc0107374e68555b209"],
          },
        ],
      }),
    );
    assert.throws(() =>
      listInput.parse({
        advanceFilter: [
          { field: "centre.name", type: "Equals", value: ["East"] },
        ],
      }),
    );
  });

  it("rejects unknown fields, operators, and projection keys", () => {
    assert.throws(() =>
      listInput.parse({
        advanceFilter: [{ field: "password", type: "Equals", value: ["x"] }],
      }),
    );
    assert.throws(() =>
      listInput.parse({
        advanceFilter: [{ field: "fullName", type: "Include", value: ["x"] }],
      }),
    );
    assert.throws(() =>
      listInput.parse({
        advanceFilter: [{ field: "fullName", type: "$gt", value: ["x"] }],
      }),
    );
    assert.throws(() =>
      listInput.parse({
        advanceFilterSelect: ["$where"],
      }),
    );
    assert.throws(() => listInput.parse({ order: "$where", orderBy: "asc" }));
    assert.throws(() =>
      listInput.parse({
        advanceFilterSelect: { fullName: 1 },
      }),
    );
  });

  it("checks Between and Range value shapes", () => {
    assert.throws(() =>
      listInput.parse({
        advanceFilter: [
          { field: "fullName", type: "Between", value: ["01/02/2026"] },
        ],
      }),
    );
    listInput.parse({
      advanceFilter: [
        {
          field: "fullName",
          type: "Between",
          value: ["01/02/2026", "02/02/2026"],
        },
      ],
    });
    assert.throws(() =>
      listInput.parse({
        advanceFilter: [
          { field: "progress", type: "Range", value: ["1", "2"] },
        ],
      }),
    );
    listInput.parse({
      advanceFilter: [{ field: "progress", type: "Range", value: [1, 9] }],
    });
    assert.throws(() =>
      listInput.parse({
        advanceFilter: [
          {
            field: "fullName",
            type: "Equals",
            value: [{ customQuery: { $gt: 1 } }],
          },
        ],
      }),
    );
  });

  it("keeps optional userGridColumn on page payloads", () => {
    const parsed = lmsPageSchema(z.object({ _id: z.string() })).parse({
      data: [{ _id: "abc" }],
      currentPage: 1,
      totalPage: 2,
      totalItems: 3,
      userGridColumn: { fullName: true },
    });
    assert.equal(parsed.userGridColumn?.fullName, true);
  });

  it("treats null lookup fields as absent on list rows", () => {
    const page = lmsPageSchema(
      z.object({
        _id: z.string(),
        name: z.string(),
        category: z.object({ name: z.string().optional() }).optional(),
      }),
    ).parse({
      data: [
        { _id: "1", name: "A", category: { name: "Math" } },
        { _id: "2", name: "B", category: null },
      ],
      currentPage: 1,
      totalItems: 2,
    });
    assert.deepEqual(page.data[0]?.category, { name: "Math" });
    assert.equal(page.data[1]?.category, undefined);
  });

  it("accepts projected rows when advanceFilterSelect omitted fields", () => {
    const page = lmsPageSchema(
      z.object({
        _id: z.string(),
        fullName: z.string(),
        email: z.string(),
      }),
    ).parse({
      data: [{ _id: "abc", fullName: "Ada" }],
      currentPage: 1,
      totalItems: 1,
    });
    assert.equal(page.data[0]?.fullName, "Ada");
    assert.equal(page.data[0]?.email, undefined);
  });

  it("keeps blank or malformed LMS emails without failing the page", async () => {
    const { lmsEmailSchema } = await import("@/lib/zod/primitives");
    const page = lmsPageSchema(
      z.object({
        _id: z.string(),
        fullName: z.string().optional(),
        email: lmsEmailSchema,
      }),
    ).parse({
      data: [
        { _id: "a", fullName: "Ajith One", email: "ajith@example.com" },
        { _id: "b", fullName: "Ajith Two", email: "" },
        { _id: "c", fullName: "Ajith Three", email: "not-an-email" },
      ],
      totalItems: 3,
    });
    assert.equal(page.data[0]?.email, "ajith@example.com");
    assert.equal(page.data[1]?.email, undefined);
    assert.equal(page.data[2]?.email, "not-an-email");
  });

  it("allows selecting parent object paths for projection", () => {
    const parsed = listInput.parse({
      advanceFilterSelect: ["centre", "centre.name", "fullName"],
    });
    assert.deepEqual(parsed.advanceFilterSelect, [
      "centre",
      "centre.name",
      "fullName",
    ]);
  });
});

describe("LMS credentials", () => {
  it("sends the stored bearer only after the principal matches", async () => {
    process.env.LMS_BACKEND_URL = "http://lms.test";
    const credentialId = lmsCredentials.put({
      token,
      principalId: "user-1",
    });
    const original = globalThis.fetch;
    let authorization = "";
    globalThis.fetch = async (_url, init) => {
      authorization = new Headers(init?.headers).get("authorization") ?? "";
      return new Response(
        JSON.stringify({ success: true, payload: { data: [] } }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    };
    try {
      await lmsFetch("reports/users", {
        method: "POST",
        auth: {
          token: "not-the-stored-token",
          credentialId,
          principalId: "user-1",
        },
        body: { advanceFilter: [] },
      });
    } finally {
      globalThis.fetch = original;
    }
    assert.equal(authorization, `Bearer ${token}`);
  });

  it("rejects a credential stored for a different user before calling LMS", async () => {
    const credentialId = lmsCredentials.put({
      token,
      principalId: "user-1",
    });
    let called = false;
    const original = globalThis.fetch;
    globalThis.fetch = async () => {
      called = true;
      return new Response(JSON.stringify({ success: true, payload: {} }));
    };
    try {
      await assert.rejects(
        () =>
          lmsFetch("reports/users", {
            auth: { token, credentialId, principalId: "user-2" },
          }),
        (error: unknown) => {
          assert.ok(error instanceof LmsCredentialError);
          assert.equal(error.reason, "mismatch");
          assert.equal(error.message.includes(token), false);
          return true;
        },
      );
    } finally {
      globalThis.fetch = original;
    }
    assert.equal(called, false);
  });

  it("rejects expired credentials and a cleared store", () => {
    const now = Date.UTC(2026, 0, 1);
    const credentialId = lmsCredentials.put(
      { token, principalId: "user-1" },
      now,
    );
    assert.throws(
      () => lmsCredentials.read(credentialId, "user-1", now + 10 * 60 * 1000),
      (error: unknown) => {
        assert.ok(error instanceof LmsCredentialError);
        assert.equal(error.reason, "expired");
        assert.equal(error.message.includes(token), false);
        return true;
      },
    );
    const freshId = lmsCredentials.put({ token, principalId: "user-1" });
    lmsCredentials.clear();
    assert.throws(
      () => lmsCredentials.read(freshId, "user-1"),
      (error: unknown) => {
        assert.ok(error instanceof LmsCredentialError);
        assert.equal(error.reason, "missing");
        return true;
      },
    );
  });

  it("does not share credentials across store instances", () => {
    const other = createLmsCredentialStore();
    const credentialId = lmsCredentials.put({
      token,
      principalId: "user-1",
    });
    assert.throws(
      () => other.read(credentialId, "user-1"),
      (error: unknown) => {
        assert.ok(error instanceof LmsCredentialError);
        assert.equal(error.reason, "missing");
        return true;
      },
    );
  });
});
