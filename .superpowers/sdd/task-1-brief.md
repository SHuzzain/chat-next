### Task 1: Scope helper + query `status` + wire into API + tool copy

**Files:**
- Create: `features/centres/centre-list-scope.ts`
- Create: `features/centres/centre-list-scope.test.ts`
- Modify: `features/centres/schema/centre-list.ts`
- Modify: `features/centres/centre.api.ts`
- Modify: `features/centres/centre.tool.ts`

**Interfaces:**
- Consumes: `centreStatusSchema` from `features/centres/schema/main-schema.ts`
- Produces: `applyCentreListScope(wireQuery: Record<string, unknown>): Record<string, unknown>`

- [ ] **Step 1: Write the failing tests**

Create `features/centres/centre-list-scope.test.ts`:

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { applyCentreListScope } from "./centre-list-scope";

describe("applyCentreListScope", () => {
  it("forces userType USER and defaults status ACTIVE", () => {
    const scoped = applyCentreListScope({ page: 1, rowPerPage: 12 });
    assert.equal(scoped.userType, "USER");
    assert.equal(scoped.status, "ACTIVE");
    assert.equal(scoped.page, 1);
  });

  it("preserves an explicit status (e.g. INACTIVE)", () => {
    const scoped = applyCentreListScope({
      status: "INACTIVE",
      textSearch: "east",
    });
    assert.equal(scoped.userType, "USER");
    assert.equal(scoped.status, "INACTIVE");
    assert.equal(scoped.textSearch, "east");
  });

  it("overwrites a non-USER userType from the caller", () => {
    const scoped = applyCentreListScope({ userType: "ADMIN" });
    assert.equal(scoped.userType, "USER");
    assert.equal(scoped.status, "ACTIVE");
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL (module missing)**

Run:

```bash
pnpm exec node --experimental-strip-types --experimental-transform-types --import ./lib/tools/register-test-loader.mjs --test features/centres/centre-list-scope.test.ts
```

Expected: FAIL — cannot find `./centre-list-scope` (or `applyCentreListScope` missing).

- [ ] **Step 3: Implement `applyCentreListScope`**

Create `features/centres/centre-list-scope.ts`:

```ts
/**
 * LMS scopes centres to auth.user.courseCentre when userType=USER
 * and the user has at least one centre (existing backend rule).
 */
export function applyCentreListScope(
  wireQuery: Record<string, unknown>,
): Record<string, unknown> {
  return {
    ...wireQuery,
    userType: "USER",
    status: wireQuery.status ?? "ACTIVE",
  };
}
```

- [ ] **Step 4: Re-run tests — expect PASS**

Same command as Step 2. Expected: 3 passing.

- [ ] **Step 5: Add optional `status` to centre list query schema**

In `features/centres/schema/centre-list.ts`, import `centreStatusSchema` from `./main-schema` (or from the schema barrel if that is how neighbouring files import it). Replace:

```ts
const centreListQuerySchema = paginatedQuerySchema(centreRowSchema);
```

with:

```ts
const centreListQuerySchema = paginatedQuerySchema(
  centreRowSchema,
  z.object({
    status: centreStatusSchema.optional(),
  }),
);
```

Ensure `z` is already imported (it is). Import `centreStatusSchema` from `./main-schema`.

- [ ] **Step 6: Apply scope in `centre.api.ts`**

Modify `features/centres/centre.api.ts` so the fetch uses the scoped query:

```ts
import { applyCentreListScope } from "./centre-list-scope";
// ...
  const { query: wireQuery, body: wireBody } = centreListFields.toWireRequest({
    query: centreListSchema.query.parse(query) as Record<string, unknown>,
    body: centreListSchema.body.parse(body) as Record<string, unknown>,
  });
  const payload = await lmsFetch("course-centres/advance-filter", {
    method: "POST",
    query: applyCentreListScope(wireQuery),
    body: wireBody,
    auth,
  });
```

- [ ] **Step 7: Update `list-centre` tool description**

In `features/centres/centre.tool.ts`, extend the description so the model knows:

- Results are limited to centres the signed-in user belongs to.
- Default status is ACTIVE; pass `query.status: "INACTIVE"` (or other allowed values) when the user asks for inactive / non-active centres.

Keep the existing use-cases; add 2–3 short lines, for example after the use-case list:

```
Results are limited to centres the signed-in user belongs to (LMS userType=USER).
By default only ACTIVE centres are returned; set query.status to list INACTIVE (or other) centres the user can access.
```

- [ ] **Step 8: Run full centre-related tests + lint touchpoints**

```bash
pnpm exec node --experimental-strip-types --experimental-transform-types --import ./lib/tools/register-test-loader.mjs --test features/centres/centre-list-scope.test.ts features/staff-type/schema/staff-type-list.test.ts
pnpm exec oxlint features/centres/centre-list-scope.ts features/centres/centre-list-scope.test.ts features/centres/centre.api.ts features/centres/centre.tool.ts features/centres/schema/centre-list.ts
```

Expected: tests pass; oxlint clean (or only pre-existing unrelated warnings).

- [ ] **Step 9: Commit**

```bash
git add features/centres/centre-list-scope.ts features/centres/centre-list-scope.test.ts features/centres/centre.api.ts features/centres/centre.tool.ts features/centres/schema/centre-list.ts
git commit -m "Scope centre list to signed-in user centres (userType=USER)."
```

---

