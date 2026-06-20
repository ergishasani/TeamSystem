# Graph Report - TeamSystem  (2026-06-20)

## Corpus Check
- 160 files · ~42,858 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1008 nodes · 1517 edges · 103 communities (97 shown, 6 thin omitted)
- Extraction: 80% EXTRACTED · 20% INFERRED · 0% AMBIGUOUS · INFERRED: 304 edges (avg confidence: 0.58)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1862fe46`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 65|Community 65]]
- [[_COMMUNITY_Community 66|Community 66]]
- [[_COMMUNITY_Community 67|Community 67]]
- [[_COMMUNITY_Community 68|Community 68]]
- [[_COMMUNITY_Community 69|Community 69]]
- [[_COMMUNITY_Community 74|Community 74]]
- [[_COMMUNITY_Community 75|Community 75]]
- [[_COMMUNITY_Community 76|Community 76]]
- [[_COMMUNITY_Community 77|Community 77]]
- [[_COMMUNITY_Community 78|Community 78]]
- [[_COMMUNITY_Community 79|Community 79]]
- [[_COMMUNITY_Community 80|Community 80]]
- [[_COMMUNITY_Community 81|Community 81]]
- [[_COMMUNITY_Community 82|Community 82]]
- [[_COMMUNITY_Community 83|Community 83]]
- [[_COMMUNITY_Community 84|Community 84]]
- [[_COMMUNITY_Community 85|Community 85]]
- [[_COMMUNITY_Community 86|Community 86]]
- [[_COMMUNITY_Community 87|Community 87]]
- [[_COMMUNITY_Community 88|Community 88]]
- [[_COMMUNITY_Community 89|Community 89]]
- [[_COMMUNITY_Community 90|Community 90]]
- [[_COMMUNITY_Community 92|Community 92]]
- [[_COMMUNITY_Community 93|Community 93]]
- [[_COMMUNITY_Community 94|Community 94]]
- [[_COMMUNITY_Community 95|Community 95]]
- [[_COMMUNITY_Community 96|Community 96]]
- [[_COMMUNITY_Community 97|Community 97]]
- [[_COMMUNITY_Community 98|Community 98]]
- [[_COMMUNITY_Community 99|Community 99]]
- [[_COMMUNITY_Community 100|Community 100]]
- [[_COMMUNITY_Community 101|Community 101]]

## God Nodes (most connected - your core abstractions)
1. `EmployeeProfile` - 37 edges
2. `auth()` - 35 edges
3. `Offer` - 33 edges
4. `User` - 32 edges
5. `BenefitRequest` - 17 edges
6. `_ConciergeTools` - 17 edges
7. `compilerOptions` - 17 edges
8. `Perka — Feature Reference` - 17 edges
9. `5. Data Models` - 16 edges
10. `6. API Endpoint Reference` - 15 edges

## Surprising Connections (you probably didn't know these)
- `get_current_user()` --calls--> `decode_token()`  [INFERRED]
  backend/app/core/deps.py → backend/app/core/security.py
- `HTTPAuthorizationCredentials` --uses--> `User`  [INFERRED]
  backend/app/core/deps.py → backend/app/models/user.py
- `Session` --uses--> `User`  [INFERRED]
  backend/app/core/deps.py → backend/app/models/user.py
- `test_concierge_endpoint()` --calls--> `auth()`  [INFERRED]
  backend/tests/test_ai.py → backend/tests/conftest.py
- `test_recommendations_endpoint()` --calls--> `auth()`  [INFERRED]
  backend/tests/test_ai.py → backend/tests/conftest.py

## Import Cycles
- 1-file cycle: `backend/app/services/challenge_service.py -> backend/app/services/challenge_service.py`

## Communities (103 total, 6 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.07
Nodes (27): CATEGORY_COLORS, styles, styles, styles, styles, LoadingState(), styles, PrimaryButton() (+19 more)

### Community 1 - "Community 1"
Cohesion: 0.14
Nodes (19): Session, Session, User, Offer, Session, UserInteraction, SavedOffer, InteractionCreate (+11 more)

### Community 2 - "Community 2"
Cohesion: 0.15
Nodes (12): BenefitRequest, Company, Offer, Package, PackageItem, Payment, Provider, Redemption (+4 more)

### Community 3 - "Community 3"
Cohesion: 0.07
Nodes (40): auth(), Return a function that logs in and yields Authorization headers., End-to-end test of the core demo flow: employee submits a request → budget reser, _submit_single_offer_request(), test_auto_approval_below_threshold(), test_cancel_pending_request(), test_employee_cannot_access_approvals(), test_full_approval_creates_payment_and_redemption() (+32 more)

### Community 4 - "Community 4"
Cohesion: 0.06
Nodes (51): Session, User, Session, User, Session, User, BaseModel, CollaborationItem (+43 more)

### Community 5 - "Community 5"
Cohesion: 0.12
Nodes (16): 5. Data Models, BenefitRequest, Challenge, ChallengeProgress, Company, EmployeeProfile, Notification, Offer (+8 more)

### Community 6 - "Community 6"
Cohesion: 0.06
Nodes (30): dependencies, axios, expo, expo-linking, expo-router, expo-secure-store, expo-status-bar, @expo/vector-icons (+22 more)

### Community 7 - "Community 7"
Cohesion: 0.07
Nodes (24): RegisterRequest, Session, RegisterRequest, Session, User, create_access_token(), decode_token(), hash_password() (+16 more)

### Community 8 - "Community 8"
Cohesion: 0.17
Nodes (10): Collab, CollabItem, Offer, Deal, Offer, apiClient, collaborationsApi, dealsApi (+2 more)

### Community 9 - "Community 9"
Cohesion: 0.09
Nodes (22): backgroundColor, foregroundImage, adaptiveIcon, expo, android, assetBundlePatterns, icon, ios (+14 more)

### Community 10 - "Community 10"
Cohesion: 0.49
Nodes (9): Session, User, _get_or_create_credits(), _pick_prize(), play_shake(), shake_status(), ShakeResultOut, ShakeStatusOut (+1 more)

### Community 11 - "Community 11"
Cohesion: 0.29
Nodes (6): aiApi, aiFilterApi, Message, Mode, styles, AIConciergeResponse

### Community 12 - "Community 12"
Cohesion: 0.12
Nodes (15): 10. Environment, 11. What to Build / Polish Next, 12. Running, 1. Tech Stack, 2. Directory Layout, 3. Navigation & Auth Gate, 4. Screens, 5. Components (`components/`) (+7 more)

### Community 13 - "Community 13"
Cohesion: 0.15
Nodes (14): Offer, Session, Base, Challenge, datetime, Challenge, ChallengeProgress, Provider (+6 more)

### Community 14 - "Community 14"
Cohesion: 0.15
Nodes (12): Build Status, Continuous Integration, Core Demo Flow, Demo Accounts, Documentation map, Known stubs / next steps, Monorepo Structure, Option A — Docker (recommended for the backend) (+4 more)

### Community 15 - "Community 15"
Cohesion: 0.20
Nodes (9): AI Service, Creating a New Migration, Demo Credentials, Key Endpoints, Perka Backend — FastAPI, Project Structure, Requirements, Setup (+1 more)

### Community 16 - "Community 16"
Cohesion: 0.22
Nodes (8): Design System, Environment Variables, First Files to Edit, Perka Mobile — Expo React Native, Project Structure, Requirements, Setup, Type-checking

### Community 17 - "Community 17"
Cohesion: 0.08
Nodes (23): dependencies, axios, lucide-react, react, react-dom, react-router-dom, zustand, devDependencies (+15 more)

### Community 20 - "Community 20"
Cohesion: 0.13
Nodes (13): CategoryPill(), Props, styles, EmptyState(), Props, styles, CATEGORY_COLORS, CATEGORY_ICONS (+5 more)

### Community 21 - "Community 21"
Cohesion: 0.29
Nodes (6): compilerOptions, moduleResolution, paths, strict, extends, @/*

### Community 38 - "Community 38"
Cohesion: 0.19
Nodes (7): Badge(), Props, statusBadge(), Variant, variantClasses, providerApi, ProviderDashboard

### Community 39 - "Community 39"
Cohesion: 0.12
Nodes (15): Props, styles, BenefitRequest, Company, Offer, Package, PackageItem, Payment (+7 more)

### Community 40 - "Community 40"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleResolution, noEmit (+11 more)

### Community 41 - "Community 41"
Cohesion: 0.13
Nodes (15): 6. API Endpoint Reference, AI — `/ai`, Auth — `/auth`, Benefit Requests — `/benefit-requests`, Challenges — `/challenges`, Employer — `/employer`, Interactions — `/interactions`, Notifications — `/notifications` (+7 more)

### Community 42 - "Community 42"
Cohesion: 0.17
Nodes (11): 10. Running, 1. Tech Stack, 2. Directory Layout, 3. Configuration (`.env`), 4. Authentication & Roles, 8. Seed Data (`python -m app.seed.seed_demo`), 9. What to Build / Improve Next, First files to edit (+3 more)

### Community 43 - "Community 43"
Cohesion: 0.23
Nodes (9): Session, User, Session, Notification, Notification, mark_read(), my_notifications(), create_notification() (+1 more)

### Community 44 - "Community 44"
Cohesion: 0.20
Nodes (9): 1. Persist saved offers ✅ DONE, 2. Auto-approve requests below threshold ✅ DONE, 3. Provider offer validation ✅ DONE (incl. OfferUpdate + PATCH /provider/offers/{id}), 4. Challenge progress automation ✅ DONE (added Challenge.category; see challenge_service.py), 5. Employer insights — real aggregation ✅ DONE (see insights_service.py), 6. AI chatbot with tool calling ✅ DONE (OpenAI + rule-based fallback; see llm_concierge.py), 7. Notifications on approval/rejection ✅ DONE, Backend Task Plan (+1 more)

### Community 45 - "Community 45"
Cohesion: 0.25
Nodes (8): 7. Business Logic, AI concierge — `app/services/ai_service.py` + `llm_concierge.py`, Approval flow — `app/services/approval_service.py`, Challenge progress — `app/services/challenge_service.py`, Employer insights — `app/services/insights_service.py`, Notifications — `app/services/notification_service.py`, Recommendation scoring — `app/services/recommendation_service.py`, Submit flow — `app/api/v1/routes/benefit_requests.py`

### Community 46 - "Community 46"
Cohesion: 0.22
Nodes (17): BenefitRequest, Session, BenefitRequest, Session, BenefitRequestCreate, EmployerInsightResponse, Offer, Package (+9 more)

### Community 47 - "Community 47"
Cohesion: 0.67
Nodes (3): Session, get_provider(), list_providers()

### Community 48 - "Community 48"
Cohesion: 0.24
Nodes (5): Layout(), Props, Role, LoginPage(), App()

### Community 50 - "Community 50"
Cohesion: 0.33
Nodes (9): ApprovalAction, Session, Payment, approve(), employer_dashboard(), employer_employees(), employer_payments(), list_approvals() (+1 more)

### Community 51 - "Community 51"
Cohesion: 0.13
Nodes (14): Architecture notes, Auth flow, Available scripts, CORS, Demo accounts, Environment variables, Manual backend setup (without Docker), Perka Webapp — Admin Management Portal (+6 more)

### Community 52 - "Community 52"
Cohesion: 0.19
Nodes (10): ChallengeCard(), Props, styles, PackageCard(), Props, styles, challengesApi, CATEGORY_COLORS (+2 more)

### Community 53 - "Community 53"
Cohesion: 0.18
Nodes (4): Props, Props, employerApi, EmployerDashboard

### Community 54 - "Community 54"
Cohesion: 0.05
Nodes (54): Session, Session, User, Session, User, ConciergeResponse, Session, User (+46 more)

### Community 56 - "Community 56"
Cohesion: 0.33
Nodes (4): employerNav, Props, providerNav, Role

### Community 57 - "Community 57"
Cohesion: 0.33
Nodes (6): 3. Employer — Approvals, APIs, Response shapes, Side effects of approve, Side effects of reject, What it renders

### Community 58 - "Community 58"
Cohesion: 0.20
Nodes (9): 2. Mobile — Home screen, 6. Mobile — Wallet, 9. Mobile — Profile, Endpoints used, Perka — Feature Reference, Table of contents, What it shows, What it shows (+1 more)

### Community 59 - "Community 59"
Cohesion: 0.40
Nodes (4): Error handling, Perka Webapp — Pages & API Reference, Shared authentication endpoints, Table of contents

### Community 60 - "Community 60"
Cohesion: 0.40
Nodes (5): 1. Login, APIs, Response shapes, Role redirect after login, What it renders

### Community 61 - "Community 61"
Cohesion: 0.40
Nodes (5): 6. Employer — AI Insights, APIs, Backend logic, Response shape, What it renders

### Community 62 - "Community 62"
Cohesion: 0.40
Nodes (5): 8. Provider — Offers, APIs, Request shapes, Response shape, What it renders

### Community 63 - "Community 63"
Cohesion: 0.40
Nodes (5): 9. Provider — Redemptions, APIs, Response shape, Side effects of confirm, What it renders

### Community 64 - "Community 64"
Cohesion: 0.27
Nodes (7): Props, styles, WalletCard(), walletApi, STATUS_COLORS, styles, Wallet

### Community 65 - "Community 65"
Cohesion: 0.50
Nodes (4): 10. Provider — Payments, APIs, Response shape, What it renders

### Community 66 - "Community 66"
Cohesion: 0.50
Nodes (4): 2. Employer — Dashboard, APIs, Response shapes, What it renders

### Community 67 - "Community 67"
Cohesion: 0.50
Nodes (4): 4. Employer — Employees, APIs, Response shape, What it renders

### Community 68 - "Community 68"
Cohesion: 0.50
Nodes (4): 5. Employer — Payments, APIs, Response shape, What it renders

### Community 69 - "Community 69"
Cohesion: 0.50
Nodes (4): 7. Provider — Dashboard, APIs, Response shapes, What it renders

### Community 74 - "Community 74"
Cohesion: 0.33
Nodes (6): 11. Web admin — Employer portal, AI Insights (`/employer/insights`), Approvals (`/employer/approvals`), Dashboard (`/employer`), Employees (`/employer/employees`), Payments (`/employer/payments`)

### Community 76 - "Community 76"
Cohesion: 0.40
Nodes (5): 10. Benefit request & approval flow, Approve (employer admin), Cancel (employee), Reject (employer admin), Submit (employee)

### Community 77 - "Community 77"
Cohesion: 0.40
Nodes (5): 12. Web admin — Provider portal, Dashboard (`/provider`), Offers (`/provider/offers`), Payments (`/provider/payments`), Redemptions (`/provider/redemptions`)

### Community 78 - "Community 78"
Cohesion: 0.50
Nodes (4): 13. Challenges & XP system, Challenge types, How progress works, Mobile screens

### Community 79 - "Community 79"
Cohesion: 0.50
Nodes (4): 15. AI & recommendations, AI Concierge (chat), Employer insights (web admin), Personalised recommendations

### Community 80 - "Community 80"
Cohesion: 0.50
Nodes (4): 1. Authentication, Endpoints used, How it works, Roles

### Community 81 - "Community 81"
Cohesion: 0.50
Nodes (4): 3. Mobile — Explore, Endpoint used, How filtering works, What it shows

### Community 82 - "Community 82"
Cohesion: 0.50
Nodes (4): 4. Mobile — Offer detail & request, Endpoints used, How requesting works, What it shows

### Community 83 - "Community 83"
Cohesion: 0.50
Nodes (4): 5. Mobile — Package detail & request, Endpoints used, How requesting works, What it shows

### Community 84 - "Community 84"
Cohesion: 0.50
Nodes (4): 7. Mobile — AI Concierge, Endpoint used, How it works, What it shows

### Community 85 - "Community 85"
Cohesion: 0.67
Nodes (3): 14. Notifications, Reading notifications (mobile), When they are created

### Community 86 - "Community 86"
Cohesion: 0.67
Nodes (3): 8. Mobile — Redemption viewer, Endpoint used, What it shows

### Community 87 - "Community 87"
Cohesion: 0.40
Nodes (4): CATEGORIES, emptyForm(), OfferForm, OffersPage()

### Community 92 - "Community 92"
Cohesion: 0.24
Nodes (15): Session, Redemption, OfferCreate, OfferUpdate, confirm_redemption(), create_offer(), provider_dashboard(), provider_offers() (+7 more)

### Community 93 - "Community 93"
Cohesion: 0.29
Nodes (8): Session, cancel_request(), create_request(), get_request(), my_requests(), approve_request(), _generate_qr(), Handles the employer approval flow:   1. Mark request as approved   2. Deduct em

### Community 94 - "Community 94"
Cohesion: 0.67
Nodes (3): Session, get_redemption(), my_redemptions()

### Community 95 - "Community 95"
Cohesion: 0.60
Nodes (4): Session, join_challenge(), list_challenges(), my_progress()

### Community 96 - "Community 96"
Cohesion: 0.31
Nodes (7): Session, User, get_current_user(), get_employee(), get_employer_admin(), get_provider_admin(), HTTPAuthorizationCredentials

### Community 97 - "Community 97"
Cohesion: 0.62
Nodes (6): Session, Package, _build_package_out(), create_package(), get_package(), list_packages()

### Community 98 - "Community 98"
Cohesion: 0.29
Nodes (5): shakeApi, PRIZE_EMOJI, ShakeResult, ShakeStatus, styles

### Community 99 - "Community 99"
Cohesion: 0.29
Nodes (5): swipeApi, CATEGORY_COLORS, CATEGORY_EMOJI, styles, { width: SCREEN_WIDTH }

### Community 100 - "Community 100"
Cohesion: 0.33
Nodes (4): ALL_INTERESTS, ICONS, styles, onboardingApi

### Community 101 - "Community 101"
Cohesion: 0.43
Nodes (6): Session, User, get_swipe_deck(), Returns offers the user hasn't swiped yet., swipe_offer(), SwipeIn

## Knowledge Gaps
- **367 isolated node(s):** `ALL_INTERESTS`, `ICONS`, `styles`, `styles`, `Mode` (+362 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `datetime` connect `Community 13` to `Community 1`, `Community 3`, `Community 4`, `Community 7`, `Community 10`, `Community 43`, `Community 46`, `Community 54`, `Community 92`, `Community 93`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **Why does `EmployeeProfile` connect `Community 54` to `Community 1`, `Community 7`, `Community 13`, `Community 46`, `Community 93`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **Why does `Offer` connect `Community 46` to `Community 1`, `Community 97`, `Community 13`, `Community 54`, `Community 92`, `Community 93`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **Are the 35 inferred relationships involving `EmployeeProfile` (e.g. with `Session` and `Session`) actually correct?**
  _`EmployeeProfile` has 35 INFERRED edges - model-reasoned connections that need verification._
- **Are the 4 inferred relationships involving `datetime` (e.g. with `Challenge` and `ChallengeProgress`) actually correct?**
  _`datetime` has 4 INFERRED edges - model-reasoned connections that need verification._
- **Are the 32 inferred relationships involving `auth()` (e.g. with `test_concierge_endpoint()` and `test_recommendations_endpoint()`) actually correct?**
  _`auth()` has 32 INFERRED edges - model-reasoned connections that need verification._
- **Are the 31 inferred relationships involving `Offer` (e.g. with `Session` and `Session`) actually correct?**
  _`Offer` has 31 INFERRED edges - model-reasoned connections that need verification._