# GEMINI.md

This file provides guidance to Gemini CLI when working with code in this repository.

## Project Overview

Sinkplane TV is a fan-made React Native app for [floatplane.com](https://www.floatplane.com), targeting **Apple TV (tvOS)** and **Android TV**. Built on Expo (SDK 57) with the [`react-native-tvos`](https://github.com/react-native-tvos/react-native-tvos) fork and Expo Router for file-based navigation. Package manager is **pnpm** (config in `pnpm-workspace.yaml`; settings like `nodeLinker: hoisted` live there, NOT in `.npmrc`).

Authentication is via Floatplane's official **OIDC device flow** against the `auth.floatplane.com` instance (client ID `hydravion`, same as [Hydravion](https://github.com/Inertia-Network/Hydravion)): the sign-in screen shows a QR code / device code, the user approves at `floatplane.com/link`, and the TV stores the tokens in `expo-secure-store` with automatic refresh. This exists because TV platforms cannot render WebView for Cloudflare Turnstile.

## Essential Commands

```bash
# Setup (first time) — clones shared package, installs deps, runs pod install
./scripts/setup-dev-env.sh

# Install dependencies (postinstall runs patch-package, currently a no-op)
pnpm install

# TV development (EXPO_TV=1 is set by these scripts)
pnpm start           # Expo bundler for TV
pnpm run ios         # Build & run on Apple TV
pnpm run android     # Build & run on Android TV
pnpm run prebuild:tv # Clean Expo prebuild WITH TV modifications (required before first TV run)

# Mobile development
pnpm run prebuild     # Clean prebuild WITHOUT TV modifications
pnpm exec expo run:ios     # iOS mobile
pnpm exec expo run:android # Android mobile

# Quality gates — run these before considering work done
pnpm run lint        # ESLint (expo lint)
pnpm exec tsc --noEmit     # Typecheck (no dedicated script; use tsc directly)

# Other
pnpm run web         # Web dev server
pnpm run deploy      # Export web + EAS deploy
pnpm run reset-project
```

### EAS Build Profiles

```bash
eas build --profile development_tv   # TV dev (internal, simulator/apk)
eas build --profile preview_tv       # TV preview (internal)
eas build --profile production_tv    # TV production
eas build --profile development      # Mobile dev
eas build --profile preview          # Mobile preview
eas build --profile production       # Mobile production
```

## Architecture

### Directory Structure

- **`app/`** — Expo Router screens (file-based routing, typed routes enabled).
  - `_layout.tsx` — Root layout (theme provider, font loading).
  - `(tabs)/` — Tab navigation (Home, Live, About).
  - `video/[id].tsx` — Video player screen.
  - `sign-in.tsx` — Authentication screen.
  - `+not-found.tsx`, `+html.tsx` — 404 and web HTML wrapper.
- **`components/`** — Reusable UI.
  - `ThemedText`, `ThemedView` — Theme-aware base components (use these for light/dark support).
  - `authentication/` — Auth UI (QR codes, status).
  - `videos/` — Video listing and player components.
  - `EventHandlingDemo.tsx` — Reference for TV focus-handling patterns.
- **`hooks/`** — TV-specific hooks only. **`useScale.ts`** (`width / 1000`) powers responsive TV layouts — **always use it** for dimensions/margins/font sizes on TV — together with `useTextStyles`. Reusable hooks/auth/connection code lives in `@sinkplane/shared` (see Shared Package below).
- **`constants/`** — TV app text styles (`text-styles.ts`) and playback config (`video.ts`). API endpoints and colors live in `@sinkplane/shared`.
- **`layouts/`** — Layout components (`DualLayoutGridScreen`, `FocusLayoutFlexbox`, `TabLayout`).
- **`types/`** — TV app asset typings (`images.d.ts`). All Floatplane API / TV protocol interfaces live in `@sinkplane/shared`.
- **`assets/`** — Images, fonts, TV-specific app icons.
- **`scripts/`** — `setup-dev-env.sh` (env setup), `reset-project.js`.
- **`docs/`** — tvOS setup and known-issue docs.
- **`patches/`** — pnpm patches (`patchedDependencies` in `pnpm-workspace.yaml`); notably the `react-native-video` patch. **Do not delete.**
- **`plugins/`** — Expo config plugins (`with-tv-scene-lifecycle.js` — UIKit scene lifecycle adoption required by iOS/tvOS 27).

### Shared Package (`@sinkplane/shared`)

`@sinkplane/shared` is published to GitHub Packages and installed as a regular dependency (`@sinkplane/shared@^0.1.1`; registry/auth configured in `.npmrc`) so EAS builds resolve the compiled `dist/` output. The sibling repo `../sinkplane-shared` (cloned by `scripts/setup-dev-env.sh`) is the development source: `pnpm run link:shared` symlinks `node_modules/@sinkplane/shared/dist` to the clone's `dist/` build output (Metro watches the clone — see `metro.config.js`), and Jest maps the package to the clone's TypeScript sources directly (see `jest.config.js`). It holds everything reusable across Sinkplane apps:

- Floatplane API client (`authenticatedFetch`), OIDC device flow, token refresh
- Auth context (`SessionProvider` / `useSession`)
- Content query hooks (videos, delivery, progress, history), `useStorageState`, theme context/hooks, shared colors
- All shared Floatplane API types

Import from the barrel: `import { useSession } from '@sinkplane/shared'`. The few names that collide with content-side types (`Channel`, `Creator`) are imported via subpath `@sinkplane/shared/types/creator-list.interface`.

`sinkplane-shared` intentionally has **no `node_modules` of its own**: its `node_modules` is a symlink to `../sinkplane-tv/node_modules` (created by `setup-dev-env.sh`) so every tool resolves the exact same module instances. **Never run `pnpm install` inside `sinkplane-shared`** — its `pnpm-workspace.yaml` disables pnpm's install-before-run behavior for exactly this reason.

> ⚠️ EAS builds resolve `@sinkplane/shared` from GitHub Packages — set `GITHUB_PACKAGES_TOKEN` as an EAS build environment variable (EAS substitutes it in `.npmrc`; a PAT with `read:packages` on the Sinkplane org). pnpm never expands `${...}` in repo-controlled credentials, so locally the token is read from `~/.npmrc` instead. Re-run `pnpm run link:shared` after `pnpm install` — a reinstall recreates `dist/` as a real directory.

### Key Technologies

| Concern | Library |
|---|---|
| React Native (TV fork) | `react-native-tvos@0.86.3-0` |
| Routing | `expo-router` v57 (typed routes) |
| Data fetching | `@tanstack/react-query` |
| Animations | `react-native-reanimated` v4.5 |
| Video | `react-native-video` + `@mux/mux-data-react-native-video` |
| Auth/token storage | `expo-secure-store` |
| Auth cookies | Sent manually on request headers (`sails.sid`) |
| TV config plugin | `@react-native-tvos/config-tv` |

## TV-Specific Development

### The `EXPO_TV` Environment Variable

`EXPO_TV=1` controls TV vs. mobile mode. It is set automatically by `pnpm start`, `pnpm run ios`, `pnpm run android`, and the `*_tv` EAS profiles. For manual commands, prefix with `EXPO_TV=1`.

### TV File Extensions

When `EXPO_TV=1`, Metro (see `metro.config.js`) resolves TV-specific source files in this priority order: `.ios.tv.tsx`, `.android.tv.tsx`, `.tv.tsx`, then standard extensions. Use these for platform-specific overrides.

### Focus Management

TV navigation is remote-based and focus-driven:
- Use `onFocus` / `onBlur` handlers.
- Use `TouchableHighlight` or `Pressable` with focus states.
- Ensure all interactive elements are focusable.
- Consider focus trapping for modals/overlays.
- Reference: `components/EventHandlingDemo.tsx`.

### Scaling

Use the `useScale()` hook for all dimensions, margins, and font sizes so the UI stays consistent across TV resolutions.

### TV Builds Require Clean Prebuild

TV builds need `pnpm run prebuild:tv` (clean prebuild with TV modifications) to properly generate native code. Mobile uses `pnpm run prebuild` (no TV modifications).

## Code Style & Conventions

### TypeScript

- **Strict mode** is on (`tsconfig.json` extends `expo/tsconfig.base`).
- **Path alias**: `@/*` maps to project root — prefer `@/components/...` over relative imports.
- **No `any`** (`@typescript-eslint/no-explicit-any: error`).
- Avoid `any` types; document complex types/interfaces.
- Prefer functional components with hooks over class components.

### Linting / Formatting (enforced)

- ESLint config in `eslint.config.js` runs on commit via Husky `pre-commit` → `lint-staged` → `expo lint --fix`.
- Notable rules: `max-len: 140`, `complexity: 12`, `eqeqeq: smart`, `no-var`, `prefer-const`, `no-shadow`, `camelcase`, `no-bitwise`.
- Prettier (`.prettierrc`): single quotes, no trailing comma issues (trailingComma `all`), 2-space indent, `printWidth: 140`, LF line endings, `arrowParens: avoid`.

### File Naming

- Component files: **PascalCase** (`MyComponent.tsx`).
- Utility files: **kebab-case** (`my-utility.ts`).
- TV-specific variants: `.tv.tsx`, `.ios.tv.tsx`, `.android.tv.tsx`.

### Validation

- Use **joi** for validation (not yup). Keep schemas near their usage.

### Components

- Use `ThemedText` / `ThemedView` for automatic light/dark mode.
- Named exports preferred.
- Reusable components → `/components`; screen components → `/app` (Expo Router conventions).

## Known Issues & Gotchas

1. **iOS/tvOS 27 require scene lifecycle** — UIKit asserts at launch unless the app adopts scene-based lifecycle. `plugins/with-tv-scene-lifecycle.js` registers `ExpoAppSceneDelegate` (shipped with Expo) via a config plugin. Drop the plugin when the Expo template adopts scenes natively.

2. **React Native Core tvOS build error (historical)** — the old Xcode 16 `dispatch_queue_t strong` issue in `RCTBridgeModule.h` is fixed upstream in RN 0.86; no Podfile hook is needed anymore. See `docs/react-native-core-tvos-issue.md`.

3. **pnpm settings live in `pnpm-workspace.yaml`** — pnpm v12 no longer reads the `pnpm` field in `package.json` or settings from `.npmrc`. `nodeLinker: hoisted` (required for RN/Metro/CocoaPods), `allowBuilds`, `patchedDependencies`, the `@react-native/metro-config` override, and `minimumReleaseAgeExclude` live there. EAS detects pnpm from `pnpm-lock.yaml` / the `packageManager` field. `react-native` is aliased to `npm:react-native-tvos@...` in dependencies and excluded via `expo.install.exclude`.

4. **CocoaPods on Homebrew Ruby** — `pod` installs to `/opt/homebrew/lib/ruby/gems/<ver>/bin`, which is NOT on PATH by default. It is exported in `~/.zshrc`; `expo run:ios` from non-interactive shells may fail with `spawn pod ENOENT`.

## Testing

Jest is configured with two suites (both run in CI on PRs to `main`):
- **Unit tests** — `pnpm exec jest --config jest.config.unit.js` (colocated `*.test.ts(x)` files).
- **E2E integration tests** — `pnpm exec jest` (config in `jest.config.js`); boots the real Expo Router app in Jest against a mocked Floatplane API (see `__tests__/e2e/`), with a 90% coverage floor.

Gates are **lint + typecheck + tests**.

## Commit Conventions

Follow **Conventional Commits**:

```
<type>(<scope>): <subject>

feat(tv): add focus management for Android TV navigation
fix(mobile): resolve crash on iOS device rotation
docs(readme): update installation instructions
refactor(hooks): simplify useScale hook logic
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `ci`.

### Pull Requests

- Lint + typecheck must pass.
- Test on relevant platforms (iOS/Android, TV/Mobile).
- Include screenshots/videos for UI changes (especially TV).
- Reference related issues.
- **Do not commit unless explicitly asked.** Only stage intended files; never commit secrets.

## Development Tips

- Use absolute paths when running commands (avoid `cd` chains).
- If Metro can't resolve modules, run `pnpm exec expo start --clear` and/or `rm -rf node_modules/.cache`.
- If pod install fails: `cd ios && rm -rf Pods Podfile.lock ~/Library/Developer/Xcode/DerivedData/sinkplane-* && pod install`.
