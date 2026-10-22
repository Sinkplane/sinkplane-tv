# Sinkplane TV 👋

<img width="1920" height="1080" alt="Simulator Screenshot - Apple TV 4K (3rd generation) - 2025-10-24 at 15 48 37" src="https://i.imgur.com/QNuIqCv.jpeg" />

This is a fan-made AppleTV and AndroidTV app for floatplane.com.

## 📺 Project Status

The core app is up and running on both platforms. What works today:

- **Authentication** — via Floatplane's **OIDC device flow** (`auth.floatplane.com`, the same instance [Hydravion](https://github.com/Inertia-Network/Hydravion) uses): scan a QR code on the sign-in screen and approve the login on another device. Tokens are stored securely and refreshed automatically.
- **Browsing** — home page with list & card views, sorting, and a channel switcher
- **Video playback** — with progress tracking (resume where you left off, progress pushed back to the API), native tvOS scrubbing, custom playback speeds (remembered between videos), now-playing metadata, and closed captions
- **Livestreams** — live tab with the active stream
- **Watch history** — history tab and suggested videos at the end of playback
- **Dark mode**

Not yet available in the app store / play store (will take some weeks for apple developer entitlements and app store approvals).

### Engineering status

- Unit + E2E (Jest) test suites in `__tests__/`, with CI running them on PRs to `main` (`.github/workflows/ci.yml`)
- Android TV EAS build workflow with GitHub release publishing (`.github/workflows/android-tv-release.yml`)
- Shared Floatplane API/auth code lives in [`@sinkplane/shared`](https://github.com/Sinkplane/sinkplane-shared), consumed from GitHub Packages
- Lint (ESLint) + typecheck (tsc) enforced on commits and PRs

## ⚠️ tvOS Development Setup

This project requires special configuration for tvOS support:

- Uses the [`react-native-tvos`](https://github.com/react-native-tvos/react-native-tvos) fork (aliased as `react-native`) with the [`@react-native-tvos/config-tv`](https://github.com/react-native-tvos/config-tv) config plugin
- iOS/tvOS 27 require scene-based lifecycle; the `plugins/with-tv-scene-lifecycle.js` Expo config plugin registers `ExpoAppSceneDelegate` for this.

---

## Usage Information

- Works on both Apple TV and Android TV
- Not yet available in the app store / play store (will take some weeks for apple developer entitlements and app store approvals)
- **Authentication**: sign in with Floatplane's official device flow — scan the QR code on the sign-in screen, or visit `floatplane.com/link` on any device and enter the shown code

## How can I help

- Read the [FAQ](https://github.com/Sinkplane/sinkplane-tv/blob/main/FAQ.md)
- Help me pay Apple Developers rediculolus fees - [Buy Me A Coffee](https://buymeacoffee.com/paynoattn)
- [File a ticket if you encounter a bug](https://github.com/Sinkplane/sinkplane-tv/issues)
- If you know what youre doing look at the [TODO](https://github.com/Sinkplane/sinkplane-tv/blob/main/TODO.md) and open a pull request - [(please read contribution guidelines)](https://github.com/Sinkplane/sinkplane-tv/blob/main/CONTRIBUTING.md).

## Developer Information

This is an [Expo](https://expo.dev) project (SDK 57) created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app), using **pnpm**.

This project uses

- the [React Native TV fork](https://github.com/react-native-tvos/react-native-tvos) — `react-native-tvos@0.86.3-0` aliased to `react-native` — which supports both phone (Android and iOS) and TV (Android TV and Apple TV) targets
- the [React Native TV config plugin](https://github.com/react-native-tvos/config-tv/tree/main/packages/config-tv) to allow Expo prebuild to modify the project's native files for TV builds
- [Expo Router](https://docs.expo.dev/router/introduction) for file-based routing, [@tanstack/react-query](https://tanstack.com/query) for data fetching, `react-native-video` for playback
- [`@sinkplane/shared`](https://github.com/Sinkplane/sinkplane-shared) for the Floatplane API client, auth/session, TV connection protocol, and shared types — published to GitHub Packages

### Shared package development

`@sinkplane/shared` is installed as a regular dependency from GitHub Packages. For local development, `./scripts/setup-dev-env.sh` clones it as a sibling repo, and `pnpm run link:shared` symlinks `node_modules/@sinkplane/shared/dist` to the clone's build output so Metro picks up changes immediately. Re-run `pnpm run link:shared` after every `pnpm install`.

> ⚠️ EAS builds resolve `@sinkplane/shared` from GitHub Packages — a PAT with `read:packages` on the Sinkplane org must be set as the `GITHUB_PACKAGES_TOKEN` EAS environment variable.

## 🚀 How to use

### First Time Setup

We provide an automated setup script that configures everything:

```sh
cd sinkplane-tv
./scripts/setup-dev-env.sh
```

This will:

- Clone the shared package as a sibling repo (if not already present)
- Install all dependencies with `pnpm install`
- Set up CocoaPods

**See**: [`docs/QUICK_START_TVOS.md`](docs/QUICK_START_TVOS.md) for detailed setup instructions.

### Development

- `cd` into the project

- For TV development (these scripts set `EXPO_TV=1` automatically):

```sh
pnpm install
pnpm run prebuild:tv # Clean Expo prebuild WITH TV modifications (required before first TV run)
pnpm run ios   # Build and run for Apple TV
pnpm run android # Build and run for Android TV
pnpm start     # Metro bundler for TV
pnpm run web   # Run the project on web from localhost
```

- For mobile development:

```sh
pnpm run prebuild # Clean prebuild WITHOUT TV modifications
pnpm exec expo run:ios
pnpm exec expo run:android
```

### Quality gates

Run these before considering work done:

```sh
pnpm run lint        # ESLint (expo lint)
pnpm exec tsc --noEmit # Typecheck
```

### Testing

The project has Jest-based unit and E2E integration suites (no simulator needed — the E2E suite boots the real Expo Router app in Jest against a mocked Floatplane API):

```sh
pnpm exec jest --config jest.config.unit.js # Unit tests
pnpm exec jest                              # E2E integration tests
pnpm run test:coverage                      # Coverage (90% floor enforced)
```

CI (`.github/workflows/ci.yml`) runs both suites on PRs to `main`.

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

This project includes a [demo](./components/EventHandlingDemo.tsx) showing how to use React Native TV APIs to highlight controls as the user navigates the screen with the remote control.

### Testing authentication

The sign-in screen automatically starts Floatplane's OIDC **device authorization flow** (against `auth.floatplane.com`):

1. **Start the TV app** (sign-in screen appears when no session is stored):
   ```bash
   pnpm run ios # or pnpm run android for Android TV
   ```

2. **Scan the QR code** with your phone, or visit `floatplane.com/link` on any device and enter the code shown on screen.

3. **Approve the login** on the other device — the TV signs in automatically. Tokens are stored in `expo-secure-store` and refreshed automatically via the refresh token.

### TV specific file extensions

This project includes an [example Metro configuration](./metro.config.js) that allows Metro to resolve application source files with TV-specific code, indicated by specific file extensions (`*.ios.tv.tsx`, `*.android.tv.tsx`, `*.tv.tsx`). `EXPO_TV=1` controls TV vs. mobile mode.

### Get a fresh project

When you're ready, run:

```bash
pnpm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.