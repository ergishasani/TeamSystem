# Graph Report - TeamSystem  (2026-06-19)

## Corpus Check
- 100 files · ~20,182 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 556 nodes · 866 edges · 37 communities (36 shown, 1 thin omitted)
- Extraction: 80% EXTRACTED · 20% INFERRED · 0% AMBIGUOUS · INFERRED: 169 edges (avg confidence: 0.59)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f42cc1f9`
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
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]

## God Nodes (most connected - your core abstractions)
1. `EmployeeProfile` - 24 edges
2. `auth()` - 21 edges
3. `Offer` - 19 edges
4. `User` - 18 edges
5. `expo` - 14 edges
6. `5. Data Models` - 14 edges
7. `6. API Endpoint Reference` - 14 edges
8. `BenefitRequest` - 13 edges
9. `Perka Mobile — Screens, Components & API Reference` - 13 edges
10. `useAuthStore` - 11 edges

## Surprising Connections (you probably didn't know these)
- `get_current_user()` --calls--> `decode_token()`  [INFERRED]
  backend/app/core/deps.py → backend/app/core/security.py
- `test_concierge_endpoint()` --calls--> `auth()`  [INFERRED]
  backend/tests/test_ai.py → backend/tests/conftest.py
- `test_recommendations_endpoint()` --calls--> `auth()`  [INFERRED]
  backend/tests/test_ai.py → backend/tests/conftest.py
- `employer_insights()` --calls--> `EmployerInsightResponse`  [INFERRED]
  backend/app/api/v1/routes/ai.py → backend/app/schemas/ai.py
- `login()` --calls--> `TokenResponse`  [INFERRED]
  backend/app/api/v1/routes/auth.py → backend/app/schemas/auth.py

## Import Cycles
- None detected.

## Communities (37 total, 1 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (39): RootLayout(), LoginScreen(), styles, RegisterScreen(), styles, styles, LoadingState(), styles (+31 more)

### Community 1 - "Community 1"
Cohesion: 0.08
Nodes (46): ApprovalAction, Session, Session, Session, Session, Session, Session, Base (+38 more)

### Community 2 - "Community 2"
Cohesion: 0.05
Nodes (47): Props, styles, CategoryPill(), Props, styles, ChallengeCard(), Props, styles (+39 more)

### Community 3 - "Community 3"
Cohesion: 0.07
Nodes (26): auth(), _fresh_db(), offer(), Shared pytest fixtures.  Tests run against an in-memory SQLite database (no Post, Return a function that logs in and yields Authorization headers., Create a clean schema for every test, drop it afterwards., End-to-end test of the core demo flow: employee submits a request → budget reser, _submit_single_offer_request() (+18 more)

### Community 4 - "Community 4"
Cohesion: 0.09
Nodes (26): BaseModel, ConciergeRequest, ConciergeResponse, EmployerInsightRequest, EmployerInsightResponse, GeneratePackageRequest, RecommendationsResponse, RecommendedOffer (+18 more)

### Community 5 - "Community 5"
Cohesion: 0.04
Nodes (44): 10. Running, 1. Tech Stack, 2. Directory Layout, 3. Configuration (`.env`), 4. Authentication & Roles, 5. Data Models, 6. API Endpoint Reference, 7. Business Logic (+36 more)

### Community 6 - "Community 6"
Cohesion: 0.07
Nodes (29): dependencies, axios, expo, expo-router, expo-secure-store, expo-status-bar, @expo/vector-icons, lucide-react-native (+21 more)

### Community 7 - "Community 7"
Cohesion: 0.13
Nodes (20): RegisterRequest, Session, RegisterRequest, Session, User, create_access_token(), decode_token(), hash_password() (+12 more)

### Community 8 - "Community 8"
Cohesion: 0.13
Nodes (21): Session, User, Session, User, Session, User, get_current_user(), get_employee() (+13 more)

### Community 9 - "Community 9"
Cohesion: 0.09
Nodes (22): backgroundColor, foregroundImage, adaptiveIcon, expo, android, assetBundlePatterns, icon, ios (+14 more)

### Community 10 - "Community 10"
Cohesion: 0.12
Nodes (25): Session, Session, Session, ConciergeRequest, ConciergeResponse, EmployerInsightRequest, GeneratePackageRequest, EmployeeProfile (+17 more)

### Community 11 - "Community 11"
Cohesion: 0.22
Nodes (14): Session, Session, User, UserInteraction, SavedOffer, InteractionCreate, log_interaction(), search_offers() (+6 more)

### Community 12 - "Community 12"
Cohesion: 0.12
Nodes (15): 10. Environment, 11. What to Build / Polish Next, 12. Running, 1. Tech Stack, 2. Directory Layout, 3. Navigation & Auth Gate, 4. Screens, 5. Components (`components/`) (+7 more)

### Community 13 - "Community 13"
Cohesion: 0.36
Nodes (6): Session, Challenge, ChallengeProgress, join_challenge(), list_challenges(), my_progress()

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
Cohesion: 0.40
Nodes (4): Session, Provider, get_provider(), list_providers()

### Community 21 - "Community 21"
Cohesion: 0.33
Nodes (5): compilerOptions, paths, strict, extends, @/*

## Knowledge Gaps
- **160 isolated node(s):** `name`, `slug`, `version`, `orientation`, `icon` (+155 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `EmployeeProfile` connect `Community 10` to `Community 8`, `Community 1`, `Community 7`?**
  _High betweenness centrality (0.043) - this node is a cross-community bridge._
- **Why does `auth()` connect `Community 3` to `Community 10`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._
- **Are the 22 inferred relationships involving `EmployeeProfile` (e.g. with `Session` and `Session`) actually correct?**
  _`EmployeeProfile` has 22 INFERRED edges - model-reasoned connections that need verification._
- **Are the 18 inferred relationships involving `auth()` (e.g. with `test_concierge_endpoint()` and `test_recommendations_endpoint()`) actually correct?**
  _`auth()` has 18 INFERRED edges - model-reasoned connections that need verification._
- **Are the 17 inferred relationships involving `Offer` (e.g. with `Session` and `Session`) actually correct?**
  _`Offer` has 17 INFERRED edges - model-reasoned connections that need verification._
- **Are the 16 inferred relationships involving `User` (e.g. with `ApprovalAction` and `Session`) actually correct?**
  _`User` has 16 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Run with: python -m app.seed.seed_demo Creates demo companies, users, providers,`, `Rule-based AI service for demo purposes. Replace the rule_based_concierge / gene`, `Handles the employer approval flow:   1. Mark request as approved   2. Deduct em` to the rest of the system?**
  _169 weakly-connected nodes found - possible documentation gaps or missing edges._