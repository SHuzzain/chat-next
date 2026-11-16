import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";

import { takeCreateUserPassword } from "@/features/user/lib/create-user-secrets";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("takeCreateUserPassword", () => {
  it("reads password from the Next take API", async () => {
    globalThis.fetch = async (input, init) => {
      assert.match(String(input), /\/api\/agent\/secrets\/take/);
      assert.equal(init?.method, "POST");
      const body = JSON.parse(String(init?.body)) as { secretId: string };
      assert.equal(body.secretId, "secret-1");
      return new Response(JSON.stringify({ values: { password: "Complex1!" } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    };

    const password = await takeCreateUserPassword("secret-1", {
      token: "bearer",
      role: "ADMIN",
    });
    assert.equal(password, "Complex1!");
  });

  it("maps missing reason to a re-submit message", async () => {
    globalThis.fetch = async () =>
      new Response(
        JSON.stringify({ message: "Secret is unavailable.", reason: "missing" }),
        { status: 404, headers: { "Content-Type": "application/json" } },
      );

    await assert.rejects(
      () => takeCreateUserPassword("gone", { token: "bearer" }),
      /not found|Re-submit/i,
    );
  });

  it("maps expired reason distinctly", async () => {
    globalThis.fetch = async () =>
      new Response(
        JSON.stringify({ message: "Secret has expired.", reason: "expired" }),
        { status: 410, headers: { "Content-Type": "application/json" } },
      );

    await assert.rejects(
      () => takeCreateUserPassword("old", { token: "bearer" }),
      /expired/i,
    );
  });

  it("maps mismatch reason distinctly", async () => {
    globalThis.fetch = async () =>
      new Response(
        JSON.stringify({
          message: "Secret does not match the signed-in user.",
          reason: "mismatch",
        }),
        { status: 403, headers: { "Content-Type": "application/json" } },
      );

    await assert.rejects(
      () => takeCreateUserPassword("other-user", { token: "bearer" }),
      /does not match/i,
    );
  });
});
