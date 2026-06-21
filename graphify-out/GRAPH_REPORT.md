# Graph Report - TeamSystem  (2026-06-21)

## Corpus Check
- 232 files · ~229,466 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1636 nodes · 2988 edges · 138 communities (130 shown, 8 thin omitted)
- Extraction: 80% EXTRACTED · 20% INFERRED · 0% AMBIGUOUS · INFERRED: 590 edges (avg confidence: 0.55)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b9406b46`
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
- [[_COMMUNITY_Community 25|Community 25]]
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
- [[_COMMUNITY_Community 91|Community 91]]
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
- [[_COMMUNITY_Community 103|Community 103]]
- [[_COMMUNITY_Community 104|Community 104]]
- [[_COMMUNITY_Community 105|Community 105]]
- [[_COMMUNITY_Community 106|Community 106]]
- [[_COMMUNITY_Community 107|Community 107]]
- [[_COMMUNITY_Community 113|Community 113]]
- [[_COMMUNITY_Community 114|Community 114]]
- [[_COMMUNITY_Community 115|Community 115]]
- [[_COMMUNITY_Community 116|Community 116]]
- [[_COMMUNITY_Community 117|Community 117]]
- [[_COMMUNITY_Community 118|Community 118]]
- [[_COMMUNITY_Community 119|Community 119]]
- [[_COMMUNITY_Community 120|Community 120]]
- [[_COMMUNITY_Community 121|Community 121]]
- [[_COMMUNITY_Community 122|Community 122]]
- [[_COMMUNITY_Community 123|Community 123]]
- [[_COMMUNITY_Community 124|Community 124]]
- [[_COMMUNITY_Community 125|Community 125]]
- [[_COMMUNITY_Community 126|Community 126]]
- [[_COMMUNITY_Community 127|Community 127]]
- [[_COMMUNITY_Community 128|Community 128]]
- [[_COMMUNITY_Community 129|Community 129]]
- [[_COMMUNITY_Community 130|Community 130]]
- [[_COMMUNITY_Community 131|Community 131]]
- [[_COMMUNITY_Community 132|Community 132]]
- [[_COMMUNITY_Community 133|Community 133]]
- [[_COMMUNITY_Community 134|Community 134]]
- [[_COMMUNITY_Community 135|Community 135]]

## God Nodes (most connected - your core abstractions)
1. `User` - 93 edges
2. `Offer` - 64 edges
3. `colors` - 55 edges
4. `radius` - 51 edges
5. `fonts` - 51 edges
6. `EmployeeProfile` - 45 edges
7. `spacing` - 44 edges
8. `auth()` - 35 edges
9. `Provider` - 31 edges
10. `BenefitRequest` - 31 edges

## Surprising Connections (you probably didn't know these)
- `HTTPAuthorizationCredentials` --uses--> `User`  [INFERRED]
  backend/app/core/deps.py → backend/app/models/user.py
- `Session` --uses--> `User`  [INFERRED]
  backend/app/core/deps.py → backend/app/models/user.py
- `test_concierge_endpoint()` --calls--> `auth()`  [INFERRED]
  backend/tests/test_ai.py → backend/tests/conftest.py
- `test_recommendations_endpoint()` --calls--> `auth()`  [INFERRED]
  backend/tests/test_ai.py → backend/tests/conftest.py
- `test_employee_cannot_access_approvals()` --calls--> `auth()`  [INFERRED]
  backend/tests/test_approval_flow.py → backend/tests/conftest.py

## Import Cycles
- 1-file cycle: `backend/app/api/v1/routes/analytics.py -> backend/app/api/v1/routes/analytics.py`
- 1-file cycle: `backend/app/services/challenge_service.py -> backend/app/services/challenge_service.py`
- 1-file cycle: `backend/app/api/v1/routes/team.py -> backend/app/api/v1/routes/team.py`
- 1-file cycle: `backend/app/seed/seed_analytics_history.py -> backend/app/seed/seed_analytics_history.py`

## Communities (138 total, 8 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (27): CATEGORY_ICONS, styles, CATEGORIES, categoryColor(), Provider, ProviderCard(), styles, MONTH_NAMES (+19 more)

### Community 1 - "Community 1"
Cohesion: 0.07
Nodes (21): AI_ICON, AiInsight, CAT_COLOR, ConversionFunnel, ConversionFunnelCard(), fmtALL(), fmtDelta(), FunnelStage (+13 more)

### Community 2 - "Community 2"
Cohesion: 0.25
Nodes (20): Session, User, Base, CollaborationItem, ProviderCollaboration, Provider, ProviderCollaboration, _build_collab_out() (+12 more)

### Community 3 - "Community 3"
Cohesion: 0.15
Nodes (16): auth(), Return a function that logs in and yields Authorization headers., Employer insights aggregate real benefit activity for the company., test_insights_empty_company(), test_insights_reflect_approved_spend(), test_insights_require_employer(), test_filter_offers_by_category(), test_filter_offers_by_max_price() (+8 more)

### Community 4 - "Community 4"
Cohesion: 0.09
Nodes (17): getDateLabel(), PlatformTopBar(), ROUTE_MAP, RouteMeta, adminApi, CATEGORIES, empty(), Form (+9 more)

### Community 5 - "Community 5"
Cohesion: 0.12
Nodes (16): 5. Data Models, BenefitRequest, Challenge, ChallengeProgress, Company, EmployeeProfile, Notification, Offer (+8 more)

### Community 6 - "Community 6"
Cohesion: 0.05
Nodes (36): dependencies, axios, expo, expo-font, @expo-google-fonts/space-grotesk, @expo-google-fonts/space-mono, expo-image-picker, expo-linear-gradient (+28 more)

### Community 7 - "Community 7"
Cohesion: 0.12
Nodes (18): RegisterRequest, Session, Session, User, get_admin_user(), get_current_user(), get_employee(), get_employer_admin() (+10 more)

### Community 8 - "Community 8"
Cohesion: 0.40
Nodes (4): CAT, categoryConfig(), OfferRow(), styles

### Community 9 - "Community 9"
Cohesion: 0.09
Nodes (22): backgroundColor, foregroundImage, adaptiveIcon, expo, android, assetBundlePatterns, icon, ios (+14 more)

### Community 10 - "Community 10"
Cohesion: 0.32
Nodes (11): Session, User, ShakeAttempt, ShakeCredit, _get_or_create_credits(), _pick_prize(), play_shake(), shake_status() (+3 more)

### Community 11 - "Community 11"
Cohesion: 0.08
Nodes (24): CATEGORY_ICONS, OfferCard(), Props, styles, CATEGORY_ICONS, CategoryCircle(), PackageCard(), Props (+16 more)

### Community 12 - "Community 12"
Cohesion: 0.12
Nodes (15): 10. Environment, 11. What to Build / Polish Next, 12. Running, 1. Tech Stack, 2. Directory Layout, 3. Navigation & Auth Gate, 4. Screens, 5. Components (`components/`) (+7 more)

### Community 13 - "Community 13"
Cohesion: 0.06
Nodes (38): Session, User, Session, User, Session, Offer, Session, Challenge (+30 more)

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
Cohesion: 0.18
Nodes (10): Props, RequestStatusTimeline(), Step, styles, STATUS_BADGE, STEPS, stepsDone(), styles (+2 more)

### Community 21 - "Community 21"
Cohesion: 0.29
Nodes (6): compilerOptions, moduleResolution, paths, strict, extends, @/*

### Community 25 - "Community 25"
Cohesion: 0.09
Nodes (12): Collab, CollabCard(), CollabItem, formatPrice(), providerLine(), styles, HomeContentSkeleton(), ProfileContentSkeleton() (+4 more)

### Community 38 - "Community 38"
Cohesion: 0.13
Nodes (12): Badge(), Props, statusBadge(), Variant, variantClasses, Props, providerApi, CATEGORIES (+4 more)

### Community 39 - "Community 39"
Cohesion: 0.07
Nodes (17): AIReply, QUICK_PROMPTS, styles, FAQS, styles, styles, ALL_CATEGORIES, styles (+9 more)

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
Cohesion: 0.30
Nodes (18): Session, Provider, ProviderAdminOut, ProviderCreate, ProviderOut, ProviderUpdate, admin_create_provider(), admin_list_providers() (+10 more)

### Community 44 - "Community 44"
Cohesion: 0.20
Nodes (9): 1. Persist saved offers ✅ DONE, 2. Auto-approve requests below threshold ✅ DONE, 3. Provider offer validation ✅ DONE (incl. OfferUpdate + PATCH /provider/offers/{id}), 4. Challenge progress automation ✅ DONE (added Challenge.category; see challenge_service.py), 5. Employer insights — real aggregation ✅ DONE (see insights_service.py), 6. AI chatbot with tool calling ✅ DONE (OpenAI + rule-based fallback; see llm_concierge.py), 7. Notifications on approval/rejection ✅ DONE, Backend Task Plan (+1 more)

### Community 45 - "Community 45"
Cohesion: 0.25
Nodes (8): 7. Business Logic, AI concierge — `app/services/ai_service.py` + `llm_concierge.py`, Approval flow — `app/services/approval_service.py`, Challenge progress — `app/services/challenge_service.py`, Employer insights — `app/services/insights_service.py`, Notifications — `app/services/notification_service.py`, Recommendation scoring — `app/services/recommendation_service.py`, Submit flow — `app/api/v1/routes/benefit_requests.py`

### Community 46 - "Community 46"
Cohesion: 0.07
Nodes (59): Session, User, Session, Session, User, Session, User, BaseModel (+51 more)

### Community 47 - "Community 47"
Cohesion: 0.14
Nodes (8): hash_password(), employee(), employer(), _fresh_db(), offer(), provider_admin(), Shared pytest fixtures.  Tests run against an in-memory SQLite database (no Post, Create a clean schema for every test, drop it afterwards.

### Community 48 - "Community 48"
Cohesion: 0.13
Nodes (10): Layout(), Props, Role, PlatformLayout(), Deal, Offer, DEMO_ACCOUNTS, LoginPage() (+2 more)

### Community 50 - "Community 50"
Cohesion: 0.33
Nodes (16): Session, Package, PackageItem, Package, PackageCreate, PackageItem, PackageItemOut, PackageOut (+8 more)

### Community 51 - "Community 51"
Cohesion: 0.13
Nodes (14): Architecture notes, Auth flow, Available scripts, CORS, Demo accounts, Environment variables, Manual backend setup (without Docker), Perka Webapp — Admin Management Portal (+6 more)

### Community 52 - "Community 52"
Cohesion: 0.11
Nodes (18): ChallengeCard(), Props, styles, FadeCarousel(), Props, styles, Props, ServiceModal() (+10 more)

### Community 53 - "Community 53"
Cohesion: 0.17
Nodes (11): analyticsApi, aiApi, apiClient, authApi, collaborationsApi, dealsApi, notificationsApi, offersApi (+3 more)

### Community 54 - "Community 54"
Cohesion: 0.13
Nodes (8): _ConciergeTools, OpenAI-powered benefits concierge with tool calling.  The LLM is given a set of, Executes tool calls against the DB, scoped to one employee., Tests for the OpenAI concierge tool layer and the LLM/rule-based orchestration., test_tool_build_package_totals_offers(), test_tool_search_offers(), test_tool_search_offers_respects_max_price(), test_tool_wallet_balance()

### Community 55 - "Community 55"
Cohesion: 0.11
Nodes (14): CATEGORY_COLORS, BenefitRequest, Company, EmployerInsights, Offer, Package, PackageItem, Payment (+6 more)

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
Cohesion: 0.06
Nodes (27): PayMethod, QUICK_AMOUNTS, styles, CardDetailScreen(), deriveExpiry(), HistoryItem, mc, styles (+19 more)

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
Cohesion: 0.35
Nodes (17): datetime, Session, _ai_insights(), analytics_overview(), _category_spend_in_range(), _conversion_funnel(), _geography(), _health_status() (+9 more)

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
Cohesion: 0.22
Nodes (14): BenefitRequest, Session, Offer, Session, BenefitRequestCreate, BenefitRequestOut, Offer, cancel_request() (+6 more)

### Community 88 - "Community 88"
Cohesion: 0.09
Nodes (13): Badge, BADGES, Stats, styles, DEPARTMENTS, styles, Entry, styles (+5 more)

### Community 89 - "Community 89"
Cohesion: 0.13
Nodes (26): ConciergeResponse, Session, User, Session, User, BenefitRequest, Session, ConciergeResponse (+18 more)

### Community 91 - "Community 91"
Cohesion: 0.12
Nodes (15): Props, BenefitRequest, Company, Offer, Package, PackageItem, Payment, Provider (+7 more)

### Community 92 - "Community 92"
Cohesion: 0.07
Nodes (58): ApprovalAction, Session, Session, Session, Session, User, BenefitRequest, Session (+50 more)

### Community 93 - "Community 93"
Cohesion: 0.24
Nodes (10): _best_package(), _check_greeting(), _detect_categories(), AI concierge service.  `concierge()` uses the OpenAI tool-calling engine when OP, rule_based_concierge(), test_concierge_endpoint(), test_concierge_learning_suggests_learning(), test_concierge_relax_suggests_wellness_and_food() (+2 more)

### Community 94 - "Community 94"
Cohesion: 0.24
Nodes (8): CATEGORY_COLORS, CATEGORY_ICONS, Collab, CollabDetailScreen(), CollabItem, formatPrice(), paymentSplit(), styles

### Community 95 - "Community 95"
Cohesion: 0.33
Nodes (14): datetime, Session, User, Invite, create_invite(), _effective_role(), InviteCreate, list_invites() (+6 more)

### Community 96 - "Community 96"
Cohesion: 0.28
Nodes (7): getConfig(), Notification, NotifRow(), relativeTime(), ROUTE_MAP, styles, TYPE_CONFIG

### Community 97 - "Community 97"
Cohesion: 0.16
Nodes (12): AiInsight, Approval, buildWeeklyData(), CAT_COLOR, CategorySpend, DashData, Deal, fmtMoney() (+4 more)

### Community 98 - "Community 98"
Cohesion: 0.07
Nodes (27): styles, styles, styles, PrimaryButton(), Props, styles, Variant, VARIANT_MAP (+19 more)

### Community 99 - "Community 99"
Cohesion: 0.33
Nodes (9): End-to-end test of the core demo flow: employee submits a request → budget reser, _submit_single_offer_request(), test_auto_approval_below_threshold(), test_cancel_pending_request(), test_employee_cannot_access_approvals(), test_full_approval_creates_payment_and_redemption(), test_reject_releases_pending_budget(), test_submit_insufficient_budget_fails() (+1 more)

### Community 100 - "Community 100"
Cohesion: 0.40
Nodes (13): Session, ConciergeRequest, EmployerInsightRequest, GeneratePackageRequest, ai_daily_pick(), AiPickOut, concierge(), employer_insights_route() (+5 more)

### Community 101 - "Community 101"
Cohesion: 0.25
Nodes (5): Brand, BRANDS, Card, modal, styles

### Community 103 - "Community 103"
Cohesion: 0.11
Nodes (17): challengesApi, swipeApi, aiApi, apiClient, authApi, collaborationsApi, dealsApi, notificationsApi (+9 more)

### Community 104 - "Community 104"
Cohesion: 0.11
Nodes (7): Props, employerApi, Redemption, fmtM(), WalletRow, WalletsPage(), EmployerDashboard

### Community 105 - "Community 105"
Cohesion: 0.40
Nodes (3): Collab, CollabItem, Offer

### Community 106 - "Community 106"
Cohesion: 0.40
Nodes (13): Session, User, DailyDeal, DailyDeal, boost_deal(), _build_deal_out(), create_daily_deal(), DailyDealIn (+5 more)

### Community 107 - "Community 107"
Cohesion: 0.15
Nodes (9): settingsApi, BrandColors, ConnectedWorkspace, fmtDate(), NotificationPrefs, Policies, SecurityPrefs, SettingsPage() (+1 more)

### Community 113 - "Community 113"
Cohesion: 0.23
Nodes (10): Session, User, Session, Notification, Notification, mark_all_read(), mark_read(), my_notifications() (+2 more)

### Community 114 - "Community 114"
Cohesion: 0.15
Nodes (9): broadcastsApi, BroadcastRow, CHANNEL_COLOR, CHANNEL_ICON, Channels, Overview, Stats, STATUS_COLOR (+1 more)

### Community 116 - "Community 116"
Cohesion: 0.43
Nodes (6): Approval and rejection create in-app notifications for the employee., _submit(), test_approval_creates_notification(), test_mark_notification_read(), test_no_notifications_initially(), test_rejection_creates_notification()

### Community 117 - "Community 117"
Cohesion: 0.17
Nodes (9): campaignsApi, CalendarDay, CampaignRow, CampaignsPage(), fmtK(), Funnel, Overview, Stats (+1 more)

### Community 118 - "Community 118"
Cohesion: 0.33
Nodes (5): Provider offer creation (validated) and editing., test_cannot_edit_other_providers_offer(), test_create_and_update_offer(), test_create_offer_validates_price(), test_update_missing_offer()

### Community 119 - "Community 119"
Cohesion: 0.60
Nodes (4): _approved_redemption_id(), Confirming a redemption advances matching challenge progress and awards XP., test_redemption_advances_matching_challenge(), test_redemption_skips_non_matching_category()

### Community 121 - "Community 121"
Cohesion: 0.17
Nodes (8): buildProposals(), CAT_DOT, Offer, PackageItem, PAIR_CATS, PkgData, Proposal, shortName()

### Community 122 - "Community 122"
Cohesion: 0.38
Nodes (11): Session, User, SavedOffer, Offer, OfferOut, get_offer(), get_saved_offers(), list_offers() (+3 more)

### Community 123 - "Community 123"
Cohesion: 0.17
Nodes (9): teamApi, Matrix, MatrixCapability, MemberRow, Overview, ROLE_ICON, ROLE_OPTIONS, RoleRow (+1 more)

### Community 124 - "Community 124"
Cohesion: 0.36
Nodes (10): Session, User, get_wallet(), get_wallet_history(), top_up_wallet(), TopUpBody, transfer_budget(), TransferBody (+2 more)

### Community 125 - "Community 125"
Cohesion: 0.24
Nodes (8): CAT, catCfg(), DailyDropPage(), Deal, discountPct(), hoursLeft(), OfferSnap, ScheduleModalProps

### Community 126 - "Community 126"
Cohesion: 0.18
Nodes (3): CAT, HEALTH_STYLE, Provider

### Community 127 - "Community 127"
Cohesion: 0.22
Nodes (5): CategoriesPage(), CategoryMeta, DEFAULT_COLORS, defaultMetaFor(), Offer

### Community 128 - "Community 128"
Cohesion: 0.20
Nodes (4): CAT_DOT, Collab, CollabItem, Offer

### Community 129 - "Community 129"
Cohesion: 0.31
Nodes (7): Session, User, SwipeInteraction, get_swipe_deck(), Returns offers the user hasn't swiped yet., swipe_offer(), SwipeIn

### Community 132 - "Community 132"
Cohesion: 0.29
Nodes (4): avgHandleTime(), DEFAULT_RULES, Req, RequestsPage()

### Community 133 - "Community 133"
Cohesion: 0.60
Nodes (5): datetime, random_time_in(), Backfills 8 weeks of realistic historical activity (swipes, saves, requests, pay, run(), week_start()

## Knowledge Gaps
- **567 isolated node(s):** `{ width: SCREEN_WIDTH }`, `CATEGORY_EMOJI`, `styles`, `apiClient`, `authApi` (+562 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Offer` connect `Community 55` to `Community 103`?**
  _High betweenness centrality (0.088) - this node is a cross-community bridge._
- **Why does `User` connect `Community 89` to `Community 129`, `Community 2`, `Community 133`, `Community 7`, `Community 106`, `Community 75`, `Community 10`, `Community 13`, `Community 46`, `Community 124`, `Community 113`, `Community 54`, `Community 122`, `Community 92`, `Community 95`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **Why does `ProviderDashboard` connect `Community 38` to `Community 55`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **Are the 91 inferred relationships involving `User` (e.g. with `ApprovalAction` and `datetime`) actually correct?**
  _`User` has 91 INFERRED edges - model-reasoned connections that need verification._
- **Are the 62 inferred relationships involving `Offer` (e.g. with `Session` and `BenefitRequest`) actually correct?**
  _`Offer` has 62 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Backfills demo data for the three platform-admin console pages added after the a`, `Backfills 8 weeks of realistic historical activity (swipes, saves, requests, pay`, `{ width: SCREEN_WIDTH }` to the rest of the system?**
  _592 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.06423034330011074 - nodes in this community are weakly interconnected._