# Ride-Book Store Readiness Checklist

This document lists everything required to ship the **Ride-Book Rider** and **Ride-Book Partner** apps to the **Google Play Store** and **Apple App Store** — along with what has already been done in the repo and what must be completed inside the developer consoles.

---

## What's already handled in the codebase

| Requirement | Status |
|---|---|
| Terms & Conditions consent gate (must agree before using app) | Done — both apps |
| Privacy Policy consent gate | Done — both apps |
| In-app "We only use your data to provide the service" notice | Done — both apps |
| Legal screens reachable from Profile menu | Done — both apps |
| `android.versionCode` / `ios.buildNumber` | Done (1) |
| iOS `NSLocation*UsageDescription`, camera, photo-library strings | Done |
| Android location + foreground-service permissions | Done |
| Android adaptive icon + legacy icon + splash | Done (`assets/`) |
| iOS `UIBackgroundModes: location` (Partner) | Done |
| Android 13+ foreground service type `FOREGROUND_SERVICE_LOCATION` (Partner) | Done |

## Consistency notes (defaults to change only if you need different IDs)

- Rider: `android.package = com.ridebook.rider`, `ios.bundleIdentifier = com.ridebook.rider`
- Partner: `android.package = com.ridebook.partner`, `ios.bundleIdentifier = com.ridebook.partner`
- These must be unique and never change after first publish.

---

## Must be completed in the dev consoles (cannot be automated from code)

### 1. Google Play Console (play.google.com/console)
- [ ] Create org + two apps (Rider, Partner) with matching package IDs
- [ ] Upload (or configure) **App signing key** (EAS or Play App Signing)
- [ ] Complete **App content** questionnaire
- [ ] **Data safety** form — declare collections listed below
- [ ] **Permissions** — justify location (foreground for Rider, background+foreground for Partner)
- [ ] **Ads** — "No ads"
- [ ] **Age rating questionnaire** (e.g., 12+ due to location tracking / ride service; transportation apps typically 12+ or 16+)
- [ ] **Target audience** — general / 18+ adult content
- [ ] **Privacy policy URL** — host `store/privacy-policy-rider.html` and `store/privacy-policy-partner.html` (or a single policy) on your website
- [ ] **Store listing** — app name, short description, full description, feature graphic (1024x500), phone screenshots (min 2; 8 recommended), icon 512x512 (we ship 1024x1024 — resize ok)
- [ ] **Content rating certification** (IARC)
- [ ] **API level**: Expo SDK 54 targets Android 16 (API 36) — satisfies the Aug 2025 target-API requirement
- [ ] **Release** — closed test → production track, `versionCode` ≥ 1

### 2. Data Safety form (recommended declarations)
| Data | Rider | Partner |
|---|---|---|
| Approximate location | Collected (on-demand only) | Collected |
| Precise location | Collected (on-demand only) | Collected (online, incl. background) |
| Name | Collected | Collected |
| Phone number | Collected | Collected |
| Email | Collected | Collected |
| Photos | Collected (profile) | Collected (documents) |
| Files & docs | No | Collected (licence, registration, insurance) |
| Crash logs / diagnostics | Collected | Collected |
| App interactions | Collected | Collected |
| Financial info (fares/payments) | Collected | Collected |
| Device / other IDs | Collected | Collected |

- Location is **not** shared with third parties; used to connect riders with drivers.
- Photo/docs used for **identity verification** (Partner) and **profile** (Rider).

### 3. Apple App Store (appstoreconnect.apple.com)
- [ ] Two app records matching `bundleIdentifier`s
- [ ] **App Privacy** — "Data collection" + privacy nutrition labels mirroring the Data Safety table above
- [ ] **Privacy policy URL** (required)
- [ ] **Age rating** questionnaire (location/travel → usually 12+)
- [ ] Screenshots (6.7", 5.5", 6.5", iPad if supporting tablet)
- [ ] Version + build upload (`buildNumber` auto-increments)
- [ ] **Account deletion**: provide in-app account deletion path (see roadmap note below)
- [ ] Review notes describing background location usage for Partner

### 4. Apple "Sign in with Apple" (if you add social login later)
- [ ] Enable capability in Add ID / infoPlist; optional in this build.

---

## Build instructions

```bash
# 1. Generate native projects (needed for background location on Android partner app)
cd partner-app
npx expo run:android        # or: npx expo prebuild && ./gradlew assembleRelease
npx expo run:ios

cd ../mobile-app
npx expo run:android
npx expo run:ios
```

- Background location requires a **development build** (Expo Go disables background tasks). Use `npx expo run:android` or EAS Build.
- Replace `YOUR_GOOGLE_MAPS_ANDROID_API_KEY` in `app.json` (both apps) with your real Google Maps Android key before building a release AAB.

### EAS Build (recommended for store uploads)
```bash
npm install -g eas-cli
eas login
# first time: eas project:init
eas build --platform android --profile production
eas build --platform ios --profile production
eas submit --platform android
eas submit --platform ios
```

---

## Account deletion (Play Store requirement, Aug 2024+)
Google requires apps that collect accounts to offer **in-app account deletion**. Done in this repo:
- **Backend**: `DELETE /api/auth/account` (Auth-guarded) — hard-deletes the user, their rides (as rider and as driver), their vehicle record, and returns a confirmation. Implemented in `backend/src/controllers/authController.js` (`deleteAccount`) and routed in `backend/src/routes/authRoutes.js`.
- **Rider app**: "Delete My Account" button in Profile → confirmation dialog → `DELETE /auth/account`, clears `token` + `terms_accepted`, logs out.
- **Partner app**: same flow in Profile → clears `driver_token` + `driver_terms_accepted`.

Still to complete in the Play Console: fill the "Account deletion" section and link the Data Safety form declaration to it.

---

## Note on this environment
- LAN IP `192.168.1.10` is used only for local dev. For a real store launch the backend must be hosted publicly over HTTPS, and `API_BASE_URL` in each app's `src/constants/config.ts` must point to it.
- `privacy-policy-rider.html` / `privacy-policy-partner.html` are generated under `store/` in this repo for you to host.