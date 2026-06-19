# Perka Mobile — Screens, Components & API Reference

Complete reference for the Expo React Native app: navigation, every screen, components, types, API client, and state. For setup commands see [`mobile/README.md`](./README.md).

---

## 1. Tech Stack

| Concern | Choice |
|---------|--------|
| Framework | Expo (~51) + React Native (0.74) |
| Language | TypeScript |
| Routing | Expo Router (file-based) |
| State | Zustand |
| HTTP | Axios |
| Token storage | `expo-secure-store` |
| Icons | `lucide-react-native` |
| Styling | React Native `StyleSheet` (dark theme) |

Path alias: `@/*` → project root (configured in `tsconfig.json`), e.g. `@/lib/api`, `@/store/authStore`, `@/types`.

---

## 2. Directory Layout

```
mobile/
├── app/                       # Expo Router routes (file = screen)
│   ├── _layout.tsx            # Root stack + auth redirect gate
│   ├── (auth)/                # Unauthenticated group
│   │   ├── welcome.tsx
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── (tabs)/                # Authenticated tab navigator
│   │   ├── _layout.tsx        # Tab bar (Home, Explore, AI, Wallet, Profile)
│   │   ├── index.tsx          # Home feed
│   │   ├── explore.tsx        # Marketplace
│   │   ├── ai.tsx             # AI concierge chat
│   │   ├── wallet.tsx         # Wallet
│   │   └── profile.tsx        # Profile
│   ├── offers/[id].tsx        # Offer detail
│   ├── packages/[id].tsx      # Package detail + submit request
│   ├── requests/[id].tsx      # Request status timeline
│   └── redemptions/[id].tsx   # QR redemption
├── components/                # Reusable UI components
├── lib/api.ts                 # Axios instance + API modules
├── store/authStore.ts         # Zustand auth state
├── types/index.ts             # Shared TypeScript types
├── assets/                    # Icons / splash
└── .env.example
```

---

## 3. Navigation & Auth Gate

- **`app/_layout.tsx`** hydrates the auth store on launch, then redirects:
  - no user & not in `(auth)` → `/(auth)/welcome`
  - logged in & in `(auth)` → `/(tabs)`
- Root `Stack` registers the `(auth)` and `(tabs)` groups plus the four detail routes (`offers/[id]`, `packages/[id]`, `requests/[id]`, `redemptions/[id]`).
- **`app/(tabs)/_layout.tsx`** defines the 5-tab bar with lucide icons; active tint `#22C55E`.

---

## 4. Screens

All screens exist and are wired to the backend (or to local state where noted). 🧑‍💼 = requires employee login.

| Route | File | Purpose | Backend calls |
|-------|------|---------|---------------|
| `/(auth)/welcome` | `app/(auth)/welcome.tsx` | Slogan + Login / Register CTAs | — |
| `/(auth)/login` | `app/(auth)/login.tsx` | Email/password login | `authApi.login` → `authApi.me` (via store) |
| `/(auth)/register` | `app/(auth)/register.tsx` | Create account | `authApi.register` |
| `/(tabs)` (Home) | `app/(tabs)/index.tsx` | Wallet summary, AI pick, recommended packages, new drops, challenges | `walletApi.getWallet`, `aiApi.recommendations`, `packagesApi.list`, `offersApi.list`, `challengesApi.list` |
| `/(tabs)/explore` | `app/(tabs)/explore.tsx` | Categories, search, filters, offer cards | `offersApi.list` (with filters) |
| `/(tabs)/ai` | `app/(tabs)/ai.tsx` | AI concierge chat | `aiApi.concierge` |
| `/(tabs)/wallet` | `app/(tabs)/wallet.tsx` | Budget + history | `walletApi.getWallet`, `walletApi.getHistory` |
| `/(tabs)/profile` | `app/(tabs)/profile.tsx` | Taste profile, saved offers, settings, logout | `usersApi`/`offersApi.getSaved`, `authStore.logout` |
| `/offers/[id]` | `app/offers/[id].tsx` | Offer detail + request/save | `offersApi.getById`, `requestsApi.create` |
| `/packages/[id]` | `app/packages/[id].tsx` | Package detail + submit request | `packagesApi.getById`, `requestsApi.create` |
| `/requests/[id]` | `app/requests/[id].tsx` | Request status timeline | `requestsApi.getById` |
| `/redemptions/[id]` | `app/redemptions/[id].tsx` | Approved benefit + QR code | `redemptionsApi.getById` |

> Navigate to a detail screen with `router.push('/offers/123')` etc.

---

## 5. Components (`components/`)

| Component | Purpose |
|-----------|---------|
| `OfferCard` | Offer tile (title, price, category, image) |
| `PackageCard` | Package tile with total price + AI reason |
| `WalletCard` | Budget summary card (remaining / used / pending) |
| `CategoryPill` | Selectable category chip for filters |
| `AIRecommendationCard` | Highlighted AI pick card |
| `ChallengeCard` | Gamification challenge card |
| `RequestStatusTimeline` | Vertical status stepper for a benefit request |
| `ProviderMiniCard` | Compact provider summary |
| `PrimaryButton` | Themed primary button (with loading state) |
| `ScreenHeader` | Consistent screen title/back header |
| `LoadingState` | Centered spinner placeholder |
| `EmptyState` | Empty-list message + optional CTA |

---

## 6. TypeScript Types (`types/index.ts`)

Mirror the backend response shapes:

`UserRole`, `User`, `Company`, `Provider`, `Offer`, `PackageItem`, `Package`, `RequestStatus`, `BenefitRequest`, `Wallet`, `Payment`, `RedemptionStatus`, `Redemption`, `Challenge`, `AIConciergeResponse`, `RecommendedOffer`.

Keep these in sync whenever a backend schema changes.

---

## 7. API Client (`lib/api.ts`)

- `apiClient` — Axios instance; `baseURL = process.env.EXPO_PUBLIC_API_URL` (fallback `http://localhost:8000/api/v1`), 10s timeout.
- A request interceptor reads `auth_token` from `expo-secure-store` and sets `Authorization: Bearer <token>` automatically.

### Modules
| Module | Methods |
|--------|---------|
| `authApi` | `login(email, password)`, `register(data)`, `me()` |
| `walletApi` | `getWallet()`, `getHistory()` |
| `offersApi` | `list(params?)`, `getById(id)`, `save(id)`, `unsave(id)`, `getSaved()` |
| `packagesApi` | `list()`, `getById(id)`, `create(data)` |
| `aiApi` | `concierge(message, budget?)`, `generatePackage(message, budget?)`, `recommendations()` |
| `requestsApi` | `create(data)`, `myRequests()`, `getById(id)`, `cancel(id)` |
| `redemptionsApi` | `myRedemptions()`, `getById(id)` |
| `challengesApi` | `list()`, `myProgress()`, `join(id)` |
| `providersApi` | `list()`, `getById(id)` |

> To add a feature, add a method to the relevant module (or a new module) here — every screen imports from `lib/api.ts`.

---

## 8. State — Auth Store (`store/authStore.ts`)

Zustand store: `{ user, token, isLoading, isHydrated, login, logout, hydrate }`.

- `hydrate()` — on launch, reads the stored token and calls `authApi.me()`; clears the token on failure.
- `login(email, password)` — stores the token in SecureStore, fetches the user, updates state.
- `logout()` — deletes the token and clears state.

Use in any screen: `const { user, login, logout } = useAuthStore();`

---

## 9. Theme

| Token | Value |
|-------|-------|
| Background | `#111111` |
| Card | `#1E1E1E` / `#1A1A1A` (tab bar) |
| Primary | `#22C55E` (green) |
| Accent / Error | `#EF4444` (red) |
| Text | `#FFFFFF` |
| Muted text | `#A1A1AA` |

---

## 10. Environment

```env
EXPO_PUBLIC_API_URL=http://localhost:8000/api/v1
```
> On a **physical device**, replace `localhost` with your machine's LAN IP (e.g. `http://192.168.1.5:8000/api/v1`). Emulators/web work with `localhost`.

---

## 11. What to Build / Polish Next

1. **QR scanner** for providers (`react-native-qrcode-svg` to render, camera to scan).
2. **Build-a-package UI** — let employees compose offers and call `packagesApi.create`.
3. **Pull-to-refresh & pagination** on Explore/Home (the backend `/offers` supports `limit`/`offset`).
4. **Optimistic save/unsave** on `OfferCard`.
5. **Form validation & error toasts** on login/register.
6. **Profile editing** — wire `PATCH /users/me` and `/users/me/interests`.

### First files to edit
| Goal | File |
|------|------|
| Add/adjust an API call | `lib/api.ts` |
| Change the home feed | `app/(tabs)/index.tsx` |
| Add filters/sorting | `app/(tabs)/explore.tsx` |
| Restyle a card | `components/OfferCard.tsx` / `PackageCard.tsx` |
| Add user state | `store/authStore.ts` |
| Keep types aligned | `types/index.ts` |

---

## 12. Running

```bash
cd mobile
npm install
copy .env.example .env     # Windows (use cp on Mac/Linux)
npx expo start             # press a (Android), i (iOS), w (web), or scan with Expo Go
```
