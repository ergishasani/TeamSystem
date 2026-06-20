# Webapp ↔ Backend Alignment Plan

Findings from comparing the FastAPI backend (`backend/`) against the admin webapp
(`webapp/`). Each task below names a real issue, what's broken or missing today, and what
fixing it actually achieves — so it's clear why the task matters, not just what to type.

---

## 1. Fix the Employer Insights chart (real bug)

**What's wrong today:** The backend (`backend/app/services/insights_service.py`) returns
`category_spend` as a **list** of objects: `[{category: "wellness", total: 1200}, ...]`. The
webapp's type (`webapp/src/types/index.ts` lines 130-139) and `InsightsPage.tsx` both treat it
as a **dictionary**: `{ "wellness": 1200, ... }`. Calling `Object.keys()` /
`Object.entries()` on an array gives you index numbers (`"0"`, `"1"`) and raw objects instead of
category names and amounts.

**What it achieves once fixed:** The "Spend by Category" chart on `/employer/insights` will
actually show real category names and real spend amounts instead of `NaN` values and numeric
index labels. Right now this page is silently broken for every employer admin who opens it.

- [ ] Decide which side changes: either (a) update the webapp to consume the list shape Pydantic
      already returns, or (b) change the backend to return a dict (more backend churn, less
      webapp churn) — recommend (a), the list is more useful for future sorting/charting
- [ ] If (a): update `webapp/src/types/index.ts`'s `EmployerInsights.category_spend` type to
      `{ category: string; total: number }[]`
- [ ] Update `InsightsPage.tsx` to map over the array directly instead of using
      `Object.keys`/`Object.entries`/`Object.values`
- [ ] Add the missing `total_requests` field to the webapp type (backend already returns it,
      webapp silently drops it — decide if it should be displayed)
- [ ] Fix `webapp/PAGES_API_REFERENCE.md` (lines 230-241) — it documents the wrong dict shape,
      which is presumably how this bug happened in the first place
- [ ] Manually verify: open `/employer/insights` with seeded demo data, confirm real category
      names and dollar/lek amounts render, not `NaN` or array indices

---

## 2. Resolve the dead `platform_admin` role — ✅ DONE (deleted)

**Decision:** deleted, not built. Nothing referenced it beyond a comment in
`backend/app/models/user.py` and type unions/docs — no dependency, no route guard, no webapp
page ever existed for it, so there was no real functionality to preserve.

**Changes:** removed `platform_admin` from `backend/app/models/user.py` comment,
`webapp/src/types/index.ts` and `mobile/types/index.ts` `UserRole`, and references in
`backend/API_REFERENCE.md`, `webapp/README.md`, `FEATURES.md`. The `role` DB column is a plain
`String` (no DB-level enum constraint), so no migration was needed.

---

## 3. Decide the fate of unused employee-facing endpoints in the webapp — ✅ DECIDED (admin-only)

**What's wrong today:** The webapp only ever calls 13 of ~35 documented backend endpoints. Every
employee-scoped endpoint — wallet, browsing offers, saved offers, packages, AI concierge,
recommendations, submitting/cancelling benefit requests, viewing own redemptions, challenges,
interaction logging, notifications — is fully built and working on the backend but has **zero**
UI in the webapp. An employee who logs into the webapp today gets redirected straight back to
`/login` with no page to land on (`webapp/src/App.tsx` line 26).

**What it achieves once decided:** Right now it's ambiguous whether this is intentional (the
webapp is "Perka Admin" per its own login page copy, and the employee experience is meant to live
in `mobile/`) or an oversight. Pinning this down prevents wasted effort — either we stop treating
it as a gap, or we scope real work to close it.

**Decision:** webapp is permanently admin-only (`employer_admin` + `provider_admin`). All
employee features intentionally live in `mobile/` only — this matches the webapp's own "Perka
Admin" framing on its login page. No code change needed; this section documents the decision so
it stops looking like a gap to the next person who audits the repo.

---

## 4. Surface notifications in the webapp — ✅ NOT APPLICABLE (no admin-facing notifications exist)

**What's wrong today:** The backend creates `Notification` rows on approve/reject
(`approval_service.py`), and exposes `GET /notifications/me` / `PATCH /notifications/{id}/read`.
The webapp never calls either.

**Why this isn't being built:** Checked `approval_service.py` directly — `create_notification`
is only ever called with `req.employee_id`. Employer/provider admins are **never** notified of
anything today; only employees are. Combined with Task 3's decision (webapp stays admin-only,
employees never log into webapp), there is currently no notification an admin could ever see —
building a bell/inbox in the webapp right now would be dead UI with no data source.

**To actually close this gap**, scope it as new work, not a quick fix: add notification triggers
for admin-relevant events (e.g. `create_notification(employer_admin_user_id, ...)` when an
employee submits a new pending request; same for `provider_admin` on redemption confirmation),
*then* add the webapp API helper, type, and bell UI to consume them. Left undone here since it's
net-new backend behavior, not an alignment fix between existing webapp and backend code.

---

## 5. Keep webapp docs in sync with backend schemas going forward — ✅ DONE

**What's wrong today:** `webapp/PAGES_API_REFERENCE.md` was written by reading the webapp's own
code/types rather than the backend's actual Pydantic schemas, which is exactly how the Task 1
insights bug slipped through unnoticed — the doc and the code agreed with each other, both
wrongly, against what the backend actually returns.

**What it achieves once fixed:** Prevents the next "looks right because the docs agree" bug —
both docs become friendly to cross-check before writing webapp code, rather than each describing
their own side in isolation.

- [x] Re-verified every response/request shape in `webapp/PAGES_API_REFERENCE.md` against the
      corresponding Pydantic schemas (`backend/app/schemas/auth.py`, `user.py`, `offer.py`,
      `request.py`, `ai.py`) and route handlers (`employer.py`, `provider_routes.py`,
      `auth.py`). Everything matched except `OfferCreate`, which was missing the optional
      `image_url` / `status` fields — added them.
- [x] Added a source-of-truth note at the top of `PAGES_API_REFERENCE.md` pointing to
      `backend/API_REFERENCE.md` and the Pydantic schemas (removed the now-redundant duplicate
      note that previously lived only in §6)

---

## Suggested order
1. **Task 1** (Insights bug) first — it's a confirmed, isolated runtime bug with no dependencies.
2. **Task 2** (`platform_admin`) and **Task 3** (employee scope decision) next — both are quick
   group decisions before any code is written.
3. **Task 4** (notifications UI) after Task 3 is resolved, since its testability depends on that
   decision.
4. **Task 5** (docs sync) last, as a wrap-up once the others are settled.
