# Graph Report - TeamSystem  (2026-06-20)

## Corpus Check
- 143 files · ~35,886 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 896 nodes · 1413 edges · 87 communities (86 shown, 1 thin omitted)
- Extraction: 81% EXTRACTED · 19% INFERRED · 0% AMBIGUOUS · INFERRED: 269 edges (avg confidence: 0.58)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `7d0b7330`
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

## God Nodes (most connected - your core abstractions)
1. `EmployeeProfile` - 37 edges
2. `auth()` - 35 edges
3. `Offer` - 33 edges
4. `User` - 32 edges
5. `useAuthStore` - 19 edges
6. `Perka — Feature Reference` - 17 edges
7. `compilerOptions` - 17 edges
8. `_ConciergeTools` - 17 edges
9. `BenefitRequest` - 17 edges
10. `5. Data Models` - 16 edges

## Surprising Connections (you probably didn't know these)
- `LoginScreen()` --calls--> `useAuthStore`  [EXTRACTED]
  mobile/app/(auth)/login.tsx → webapp/src/store/authStore.ts
- `RegisterScreen()` --calls--> `useAuthStore`  [EXTRACTED]
  mobile/app/(auth)/register.tsx → webapp/src/store/authStore.ts
- `RootLayout()` --calls--> `useAuthStore`  [EXTRACTED]
  mobile/app/_layout.tsx → webapp/src/store/authStore.ts
- `HomeScreen()` --calls--> `useAuthStore`  [EXTRACTED]
  mobile/app/(tabs)/index.tsx → webapp/src/store/authStore.ts
- `ProfileScreen()` --calls--> `useAuthStore`  [EXTRACTED]
  mobile/app/(tabs)/profile.tsx → webapp/src/store/authStore.ts

## Import Cycles
- 1-file cycle: `backend/app/services/challenge_service.py -> backend/app/services/challenge_service.py`

## Communities (87 total, 1 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.07
Nodes (28): LoginScreen(), styles, RegisterScreen(), styles, styles, LoadingState(), styles, PrimaryButton() (+20 more)

### Community 1 - "Community 1"
Cohesion: 0.16
Nodes (17): Session, Session, User, UserInteraction, SavedOffer, InteractionCreate, log_interaction(), search_offers() (+9 more)

### Community 2 - "Community 2"
Cohesion: 0.60
Nodes (4): Session, join_challenge(), list_challenges(), my_progress()

### Community 3 - "Community 3"
Cohesion: 0.07
Nodes (40): auth(), Return a function that logs in and yields Authorization headers., End-to-end test of the core demo flow: employee submits a request → budget reser, _submit_single_offer_request(), test_auto_approval_below_threshold(), test_cancel_pending_request(), test_employee_cannot_access_approvals(), test_full_approval_creates_payment_and_redemption() (+32 more)

### Community 4 - "Community 4"
Cohesion: 0.07
Nodes (38): Session, BaseModel, OfferCreate, OfferUpdate, confirm_redemption(), create_offer(), provider_dashboard(), provider_offers() (+30 more)

### Community 5 - "Community 5"
Cohesion: 0.12
Nodes (16): 5. Data Models, BenefitRequest, Challenge, ChallengeProgress, Company, EmployeeProfile, Notification, Offer (+8 more)

### Community 6 - "Community 6"
Cohesion: 0.07
Nodes (29): dependencies, axios, expo, expo-router, expo-secure-store, expo-status-bar, @expo/vector-icons, lucide-react-native (+21 more)

### Community 7 - "Community 7"
Cohesion: 0.05
Nodes (30): RegisterRequest, Session, Session, User, Session, get_current_user(), get_employee(), get_employer_admin() (+22 more)

### Community 8 - "Community 8"
Cohesion: 0.13
Nodes (26): Session, User, ConciergeResponse, Session, User, ConciergeResponse, Offer, Session (+18 more)

### Community 9 - "Community 9"
Cohesion: 0.09
Nodes (22): backgroundColor, foregroundImage, adaptiveIcon, expo, android, assetBundlePatterns, icon, ios (+14 more)

### Community 10 - "Community 10"
Cohesion: 0.20
Nodes (16): Session, ConciergeRequest, EmployerInsightRequest, GeneratePackageRequest, concierge(), employer_insights_route(), generate_package(), my_recommendations() (+8 more)

### Community 11 - "Community 11"
Cohesion: 0.13
Nodes (8): _ConciergeTools, OpenAI-powered benefits concierge with tool calling.  The LLM is given a set of, Executes tool calls against the DB, scoped to one employee., Tests for the OpenAI concierge tool layer and the LLM/rule-based orchestration., test_tool_build_package_totals_offers(), test_tool_search_offers(), test_tool_search_offers_respects_max_price(), test_tool_wallet_balance()

### Community 12 - "Community 12"
Cohesion: 0.12
Nodes (15): 10. Environment, 11. What to Build / Polish Next, 12. Running, 1. Tech Stack, 2. Directory Layout, 3. Navigation & Auth Gate, 4. Screens, 5. Components (`components/`) (+7 more)

### Community 13 - "Community 13"
Cohesion: 0.27
Nodes (12): Offer, Session, Base, Challenge, datetime, Challenge, ChallengeProgress, Offer (+4 more)

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
Cohesion: 0.07
Nodes (31): CategoryPill(), Props, styles, ChallengeCard(), Props, styles, EmptyState(), Props (+23 more)

### Community 21 - "Community 21"
Cohesion: 0.25
Nodes (7): compilerOptions, ignoreDeprecations, moduleResolution, paths, strict, extends, @/*

### Community 38 - "Community 38"
Cohesion: 0.16
Nodes (11): Badge(), Props, statusBadge(), Variant, variantClasses, providerApi, CATEGORIES, emptyForm() (+3 more)

### Community 39 - "Community 39"
Cohesion: 0.18
Nodes (8): CATEGORY_COLORS, aiApi, apiClient, providersApi, Message, styles, AIConciergeResponse, EmployerInsights

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
Cohesion: 0.15
Nodes (10): Props, styles, Company, PackageItem, ProviderDashboard, RecommendedOffer, Redemption, RedemptionStatus (+2 more)

### Community 47 - "Community 47"
Cohesion: 0.67
Nodes (3): Session, get_provider(), list_providers()

### Community 48 - "Community 48"
Cohesion: 0.19
Nodes (12): RootLayout(), authApi, LoginPage(), App(), RequireAuth(), RootRedirect(), AuthState, useAuthStore (+4 more)

### Community 50 - "Community 50"
Cohesion: 0.17
Nodes (16): ApprovalAction, Session, BenefitRequest, Session, Payment, Redemption, approve(), employer_dashboard() (+8 more)

### Community 51 - "Community 51"
Cohesion: 0.13
Nodes (14): Architecture notes, Auth flow, Available scripts, CORS, Demo accounts, Environment variables, Manual backend setup (without Docker), Perka Webapp — Admin Management Portal (+6 more)

### Community 52 - "Community 52"
Cohesion: 0.38
Nodes (10): Session, Package, PackageItem, Package, PackageCreate, PackageOut, _build_package_out(), create_package() (+2 more)

### Community 53 - "Community 53"
Cohesion: 0.18
Nodes (4): Props, Props, employerApi, EmployerDashboard

### Community 54 - "Community 54"
Cohesion: 0.21
Nodes (12): Session, User, BenefitRequest, Session, EmployerInsightResponse, BenefitRequest, get_wallet(), get_wallet_history() (+4 more)

### Community 55 - "Community 55"
Cohesion: 0.25
Nodes (9): Session, RegisterRequest, User, BenefitRequestCreate, Company, cancel_request(), create_request(), get_request() (+1 more)

### Community 56 - "Community 56"
Cohesion: 0.20
Nodes (8): Layout(), Props, Role, employerNav, Props, providerNav, Role, Sidebar()

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
Cohesion: 0.67
Nodes (3): Session, get_redemption(), my_redemptions()

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

### Community 75 - "Community 75"
Cohesion: 0.50
Nodes (3): Props, styles, Provider

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

## Knowledge Gaps
- **320 isolated node(s):** `Table of contents`, `How it works`, `Roles`, `Endpoints used`, `What it shows` (+315 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `datetime` connect `Community 13` to `Community 1`, `Community 3`, `Community 4`, `Community 7`, `Community 8`, `Community 43`, `Community 50`, `Community 52`, `Community 54`, `Community 55`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **Why does `auth()` connect `Community 3` to `Community 10`, `Community 7`?**
  _High betweenness centrality (0.035) - this node is a cross-community bridge._
- **Why does `Offer` connect `Community 13` to `Community 1`, `Community 4`, `Community 8`, `Community 11`, `Community 50`, `Community 52`, `Community 54`, `Community 55`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Are the 35 inferred relationships involving `EmployeeProfile` (e.g. with `Session` and `Session`) actually correct?**
  _`EmployeeProfile` has 35 INFERRED edges - model-reasoned connections that need verification._
- **Are the 32 inferred relationships involving `auth()` (e.g. with `test_concierge_endpoint()` and `test_recommendations_endpoint()`) actually correct?**
  _`auth()` has 32 INFERRED edges - model-reasoned connections that need verification._
- **Are the 31 inferred relationships involving `Offer` (e.g. with `Session` and `Session`) actually correct?**
  _`Offer` has 31 INFERRED edges - model-reasoned connections that need verification._
- **Are the 30 inferred relationships involving `User` (e.g. with `ApprovalAction` and `Session`) actually correct?**
  _`User` has 30 INFERRED edges - model-reasoned connections that need verification._