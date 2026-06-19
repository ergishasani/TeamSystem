# Backend Task Plan

All outstanding backend work for Perka, derived from `API_REFERENCE.md` §9 and the current
state of the codebase. Each feature is broken into small, sequential checklist items
(model/migration → schema → logic → route wiring → manual check) so any item can be picked up
on its own. Not split by owner.

> **Status (current):** All tasks (1–7) are **done** and covered by the pytest suite.
> Task 6 ships as an OpenAI tool-calling concierge (`llm_concierge.py`) with an automatic
> rule-based fallback, so it works with or without an `OPENAI_API_KEY`.

## 1. Persist saved offers ✅ DONE
`app/api/v1/routes/offers.py:16` stores saved offers in an in-memory `_saved_offers` dict —
lost on restart, broken across multiple server instances.
- [ ] Add `SavedOffer` model: `id, user_id (FK), offer_id (FK), created_at` in `app/models/`
- [ ] Register the model in `app/models/__init__.py`
- [ ] Generate + apply Alembic migration (`alembic revision --autogenerate -m "add saved_offer"`)
- [ ] Update `POST /offers/{id}/save` to insert a `SavedOffer` row instead of touching the dict
- [ ] Update `DELETE /offers/{id}/save` to delete the row
- [ ] Update `GET /offers/users/me/saved-offers` to query `SavedOffer` joined to `Offer`
- [ ] Remove the `_saved_offers` dict entirely
- [ ] Manually verify: save → restart server → saved offer still listed

## 2. Auto-approve requests below threshold ✅ DONE
`Company.approval_required_above` exists on the model but is never read.
- [ ] In `benefit_requests.py`'s create-request route, after computing `total_amount`, fetch the
      employee's `Company.approval_required_above`
- [ ] If `total_amount < approval_required_above`: call the same approve logic
      `approval_service.py` uses (extract it into a reusable function if it's currently inline
      in the route) instead of leaving `status = pending`
- [ ] If `total_amount >= threshold`: keep existing pending behavior, unchanged
- [ ] Manually verify both paths: a cheap request auto-approves, an expensive one stays pending
      for employer approval

## 3. Provider offer validation ✅ DONE (incl. OfferUpdate + PATCH /provider/offers/{id})
`POST /provider/offers` takes a raw dict with no validation.
- [ ] Add `OfferCreate` Pydantic schema in `app/schemas/offer.py` matching the `Offer` model
      fields (title, description, category, price, currency, city, country,
      discount_percent, quantity_available, valid_until, is_limited_drop, image_url)
- [ ] Add `OfferUpdate` schema (all fields optional) for future PATCH support
- [ ] Update the route in `provider_routes.py` to accept `OfferCreate` instead of `dict`
- [ ] Confirm `provider_id` is still set from the authenticated provider, not from the body
- [ ] Manually verify: posting an invalid payload (e.g. missing `title`) now returns 422

## 4. Challenge progress automation ✅ DONE (added Challenge.category; see challenge_service.py)
`ChallengeProgress.progress` is never incremented automatically.
- [ ] Decide the matching rule for "relevant" redemption → challenge (start simple: match
      `Challenge.type` to the redeemed offer's `category`)
- [ ] Add a helper function (e.g. in `challenges.py` or a new spot in `services/`) that, given a
      `user_id` and `offer_id`, finds active matching challenges and increments
      `ChallengeProgress.progress` for that user (creating the progress row if missing)
- [ ] Call that helper from `POST /provider/redemptions/{id}/confirm` in `provider_routes.py`
      after marking the redemption `redeemed`
- [ ] Set `completed = True` when `progress >= goal`
- [ ] Manually verify: confirm a redemption for an offer matching an active challenge, check
      `GET /challenges/me/progress` reflects the increment

## 5. Employer insights — real aggregation ✅ DONE (see insights_service.py)
`POST /ai/employer-insights` in `routes/ai.py` returns canned/stub analytics.
- [ ] Write a query for total spend by offer category (join `BenefitRequest`/`Payment` →
      `Offer.category`) scoped to the requesting employer's company
- [ ] Write a query for approval rate (`approved` count / total count) over the company's
      requests
- [ ] Write a query for budget utilization per employee (`EmployeeProfile.used_amount /
      monthly_budget`)
- [ ] Write a query for pending vs. approved totals
- [ ] Wire these into the `POST /ai/employer-insights` response, replacing the stub
- [ ] Manually verify against seeded demo data that numbers look sane

## 6. AI chatbot with tool calling ✅ DONE (OpenAI + rule-based fallback; see llm_concierge.py)
Implemented with OpenAI (`gpt-4o-mini` by default). Tools: search_offers, get_wallet_balance,
get_recommendations, build_package — all read-only and scoped to the calling employee. Falls back
to the rule-based engine when `OPENAI_API_KEY` is unset or the API errors.
- [ ] Decide which backend functions the chatbot can call as tools (e.g. search offers, check
      wallet balance, submit a benefit request, build a package) — confirm with the group
- [ ] Decide LLM provider/SDK (Anthropic, OpenAI, etc.)
- [ ] Add provider API key to `core/config.py` + `.env.example`
- [ ] Define each tool as a function with a JSON-schema description for the LLM
- [ ] Implement the chat loop in `app/services/ai_service.py` (replace
      `rule_based_concierge`), keeping the existing `ConciergeResponse` schema so
      `routes/ai.py` doesn't need changes
- [ ] Manually verify: ask the chatbot something requiring at least one tool call (e.g. "what's
      my budget") and confirm it calls the tool rather than guessing

## 7. Notifications on approval/rejection ✅ DONE
No notification mechanism exists when a `BenefitRequest` is approved or rejected.
- [ ] Add a `Notification` model: `id, user_id (FK), message, type, read, created_at`
- [ ] Generate + apply Alembic migration
- [ ] Add `notification_service.py` with a `create_notification(db, user_id, message, type)`
      helper
- [ ] Call it from `approval_service.py`'s approve path ("Your request was approved")
- [ ] Call it from the reject path ("Your request was rejected: {reason}")
- [ ] Add `GET /notifications/me` route (list current user's notifications)
- [ ] Add `PATCH /notifications/{id}/read` route
- [ ] Manually verify: approve/reject a request, confirm a notification row appears

## Migration hygiene (applies to tasks 1, 2, 7)
Multiple tasks above touch the DB schema. Before running
`alembic revision --autogenerate`, pull latest `main` and run `alembic upgrade head` locally
first, so migration chains don't conflict. Land and merge migrations one at a time —
don't let two unmerged migrations stack up.
