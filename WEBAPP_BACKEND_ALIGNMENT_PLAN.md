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

## 2. Resolve the dead `platform_admin` role

**What's wrong today:** `platform_admin` exists as a role value in both the backend `User`
model and the webapp's `UserRole` type, but nothing anywhere uses it. The backend has no
`get_platform_admin` dependency in `core/deps.py` and no route guards for it. The webapp has no
page, route, or redirect logic for it — a user with this role who logs in just bounces back to
`/login` with nowhere to go.

**What it achieves once fixed:** Either you get a real platform-admin capability (useful for a
"super admin" managing multiple companies/providers), or you remove dead, misleading code that
currently suggests a feature exists when it doesn't — confusing for anyone reading the codebase
later, including future you.

- [ ] Decide: build it, or delete it (this is a product decision — discuss with the group)
- [ ] **If building:** add `get_platform_admin` dependency in `backend/app/core/deps.py`, add
      at least one guarded route (e.g. list all companies), add a webapp landing page + route
      guard in `App.tsx`, add a login redirect case
- [ ] **If deleting:** remove `platform_admin` from the backend `User.role` enum/values, remove
      it from the webapp `UserRole` type in `types/index.ts`, check the seed data and any docs
      (`API_REFERENCE.md` §4) for references and remove those too

---

## 3. Decide the fate of unused employee-facing endpoints in the webapp

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

- [ ] Confirm with the group: is the webapp permanently admin-only (employer_admin +
      provider_admin), with all employee features intentionally living in `mobile/` only?
- [ ] **If yes (recommended, matches current webapp framing):** no code change needed — just
      note this scope decision somewhere (e.g. webapp's README) so it stops looking like a bug
      to the next person who audits it
- [ ] **If no:** scope a new set of employee-facing webapp pages (wallet view, offer browsing,
      AI chat, request history) as a separate, larger plan — don't fold this into quick fixes

---

## 4. Surface notifications in the webapp

**What's wrong today:** The backend creates `Notification` rows when a benefit request is
approved or rejected (`approval_service.py`, part of Task 7 in `backend/PLAN.md`), and exposes
`GET /notifications/me` and `PATCH /notifications/{id}/read`. The webapp never calls either —
there's no notification inbox or indicator anywhere in the UI.

**What it achieves once fixed:** Employer admins approving/rejecting requests, and any future
employee-facing UI, would actually surface "your request was approved/rejected" instead of that
information existing only in the database with no one able to see it. Right now this whole
feature is invisible despite being fully built server-side.

- [ ] Add a notifications API helper in `webapp/src/lib/api.ts` (`getNotifications`,
      `markNotificationRead`)
- [ ] Add a simple notification bell/dropdown in the webapp's shared layout/header
- [ ] Add the relevant TypeScript type matching `NotificationOut` from the backend schema
- [ ] Manually verify: approve a request as employer admin, confirm a notification appears
      somewhere in the webapp UI for the affected user (note: since employees have no webapp
      login per Task 3 above, this may only be meaningfully testable once that's resolved —
      flag this dependency when picking up the task)

---

## 5. Keep webapp docs in sync with backend schemas going forward

**What's wrong today:** `webapp/PAGES_API_REFERENCE.md` was written by reading the webapp's own
code/types rather than the backend's actual Pydantic schemas, which is exactly how the Task 1
insights bug slipped through unnoticed — the doc and the code agreed with each other, both
wrongly, against what the backend actually returns.

**What it achieves once fixed:** Prevents the next "looks right because the docs agree" bug —
both docs become friendly to cross-check before writing webapp code, rather than each describing
their own side in isolation.

- [ ] After fixing Task 1, re-verify every response shape in `webapp/PAGES_API_REFERENCE.md`
      against the corresponding Pydantic schema in `backend/app/schemas/`
- [ ] Add a short note at the top of `PAGES_API_REFERENCE.md` pointing to
      `backend/API_REFERENCE.md` as the source of truth for response shapes

---

## Suggested order
1. **Task 1** (Insights bug) first — it's a confirmed, isolated runtime bug with no dependencies.
2. **Task 2** (`platform_admin`) and **Task 3** (employee scope decision) next — both are quick
   group decisions before any code is written.
3. **Task 4** (notifications UI) after Task 3 is resolved, since its testability depends on that
   decision.
4. **Task 5** (docs sync) last, as a wrap-up once the others are settled.
