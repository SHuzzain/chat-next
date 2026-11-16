# Centre list scoped to signed-in user

**Date:** 2026-11-16  
**Status:** Approved for planning  
**Scope:** lms-agent only (no LMS backend change)

## Problem

Create-user and `list-centre` call `POST /course-centres/advance-filter` without `userType=USER`. The LMS then returns centres beyond the signed-in user’s `courseCentre` membership. Operators can pick centres they do not belong to when creating users.

The LMS GET already supports scoping when `userType=USER`: if the auth user has `courseCentre.length > 0`, results are limited to `_id ∈ user.courseCentre`. No separate `userId` query param is required — the bearer token identifies the user.

## Goal

Every agent centre list/resolve call must send `userType=USER` (and default `status=ACTIVE`) so results match centres the signed-in user belongs to.

## Non-goals

- Backend changes to `getCentres` / `advance-filter`
- Passing an arbitrary `userId` for another user’s centres
- Changing create-user wire payload shape beyond centre resolution behaviour

## Approach (chosen)

**Force query flags in `features/centres/centre.api.ts`** inside `listCourseCentresByAdvanceFilter`, after schema parse / wire mapping and before `lmsFetch`:

- Always set `userType: "USER"`
- Set `status` to `"ACTIVE"` when the caller did not provide `status`

This covers:

- `list-centre` tool / centre picker widget
- `resolveCentresForCreate` in create-user

## Data flow

```
Agent (list-centre | create-user resolve)
  → listCourseCentresByAdvanceFilter
  → wire query + { userType: "USER", status: status ?? "ACTIVE" }
  → POST {LMS_BACKEND_URL}course-centres/advance-filter
  → LMS filters by auth.user.courseCentre when non-empty
  → agent page / validation
```

## Edge cases

| Case | Behaviour |
|------|-----------|
| Auth user has `courseCentre` ids | LMS returns only those centres (existing backend rule) |
| Auth user has empty `courseCentre` | LMS does **not** apply the `$in` filter today; agent still sends `userType=USER` (no backend change in this work) |
| Caller passes `status` | Preserved; only defaulted when omitted |
| Model omits / overrides `userType` | Ignored — API layer always forces `USER` |

## Tool copy

Update `list-centre` description to state that results are limited to centres the signed-in user belongs to.

## Testing

- Unit/API-layer test: after call setup, wire query includes `userType: "USER"` and defaults `status: "ACTIVE"` when unset.
- When `status` is provided (e.g. `INACTIVE`), it is preserved alongside `userType: "USER"`.

## Out of scope follow-ups

- Backend always enforcing membership without relying on `userType` (option B/C from brainstorming)
- Empty-`courseCentre` SUPER_ADMIN semantics on the LMS side
