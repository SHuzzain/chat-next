# Task 1 Report: Scope helper + query status + wire into API + tool copy

## Status

DONE

## TDD Evidence

### RED (Step 2)

Command:

```bash
pnpm exec node --experimental-strip-types --experimental-transform-types --import ./lib/tools/register-test-loader.mjs --test features/centres/centre-list-scope.test.ts
```

Result: **FAIL** — `ERR_MODULE_NOT_FOUND`: Cannot find module `centre-list-scope` (module not yet created).

### GREEN (Step 4 / Step 8)

Same focused test command after implementing `centre-list-scope.ts`:

- 3 tests passing in `applyCentreListScope` suite

Full verification (Step 8):

```bash
pnpm exec node ... --test features/centres/centre-list-scope.test.ts features/staff-type/schema/staff-type-list.test.ts
```

Result: **5 tests, 2 suites, 0 failures** (3 centre scope + 2 staff-type list schema).

```bash
pnpm exec oxlint features/centres/centre-list-scope.ts features/centres/centre-list-scope.test.ts features/centres/centre.api.ts features/centres/centre.tool.ts features/centres/schema/centre-list.ts
```

Result: **clean** (exit 0, no output).

## Files Changed

| File | Change |
|------|--------|
| `features/centres/centre-list-scope.ts` | **Created** — `applyCentreListScope` forces `userType: "USER"`, defaults `status` to `ACTIVE` when omitted, spreads caller query |
| `features/centres/centre-list-scope.test.ts` | **Created** — three unit tests per brief |
| `features/centres/schema/centre-list.ts` | Import `centreStatusSchema`; extend `paginatedQuerySchema` with optional `status` |
| `features/centres/centre.api.ts` | Import scope helper; pass `applyCentreListScope(wireQuery)` to `lmsFetch` query |
| `features/centres/centre.tool.ts` | Tool description: user-scoped centres, default ACTIVE, `query.status` for INACTIVE |

## Commit

- **SHA:** `98dfc69`
- **Subject:** Scope centre list to signed-in user centres (userType=USER).

## Self-Review

1. **Global constraints**
   - `userType: "USER"` is always set in `applyCentreListScope`, overwriting caller values (tested).
   - Default `status` is `"ACTIVE"` only via `??`; explicit `INACTIVE` (and other enum values from schema) preserved.
   - No `userId` query param added.

2. **Agent-only**
   - No LMS backend files touched; scoping relies on documented LMS behaviour when `userType=USER`.

3. **Schema**
   - `status` is agent-query optional using existing `centreStatusSchema` from `main-schema.ts`, consistent with centre row model.

4. **API wiring**
   - Scope applied on wire query after `toWireRequest`, so pagination/filter fields remain intact while LMS receives forced scope fields.

5. **Tool copy**
   - Two lines added after use-cases; does not remove existing guidance.

## Concerns

None blocking.

- **Runtime verification against live LMS** was not performed in this task; behaviour depends on backend honouring `userType=USER` + auth token centres as in design spec.
- Branch is `feat/widget-chat`; commit is local only (not pushed).

## Verification Commands (recorded)

```bash
pnpm exec node --experimental-strip-types --experimental-transform-types --import ./lib/tools/register-test-loader.mjs --test features/centres/centre-list-scope.test.ts features/staff-type/schema/staff-type-list.test.ts
pnpm exec oxlint features/centres/centre-list-scope.ts features/centres/centre-list-scope.test.ts features/centres/centre.api.ts features/centres/centre.tool.ts features/centres/schema/centre-list.ts
```