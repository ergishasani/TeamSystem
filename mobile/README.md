# Perka Mobile — Expo React Native

## Requirements
- Node.js 18+
- Expo Go app on your phone, OR Android/iOS emulator

## Setup

```bash
cd mobile

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
# Edit .env — set EXPO_PUBLIC_API_URL to your backend URL

# Start Expo dev server
npx expo start
```

Scan the QR code with **Expo Go** on your phone, or press `a` for Android emulator / `i` for iOS simulator.

## Environment Variables
```env
EXPO_PUBLIC_API_URL=http://localhost:8000/api/v1
```

> On a physical device, replace `localhost` with your machine's local IP (e.g. `http://192.168.1.5:8000/api/v1`)

## Project Structure
```
app/
  _layout.tsx          # Root layout with auth redirect
  (auth)/              # Welcome, Login, Register screens
  (tabs)/              # Tab navigator (Home, Explore, AI, Wallet, Profile)
  offers/[id].tsx      # Offer detail screen
  packages/[id].tsx    # Package detail + submit request
  requests/[id].tsx    # Request status timeline
  redemptions/[id].tsx # QR code redemption screen
components/            # Reusable UI components
lib/api.ts             # Axios client + all API modules
store/authStore.ts     # Zustand auth state
types/index.ts         # All TypeScript types
```

## First Files to Edit
1. **`lib/api.ts`** — Add more API calls as you build features
2. **`app/(tabs)/index.tsx`** — Customize the home feed layout
3. **`app/(tabs)/explore.tsx`** — Add sorting and more filters
4. **`components/OfferCard.tsx`** — Refine offer card design
5. **`store/authStore.ts`** — Add user preferences to store

## Design System
- Background: `#111111`
- Primary: `#22C55E` (green)
- Accent/Error: `#EF4444` (red)
- Text: `#FFFFFF`
- Muted: `#A1A1AA`
- Card: `#1E1E1E`
