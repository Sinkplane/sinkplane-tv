# AGENTS.md

Guidance for AI coding agents (opencode, Claude Code, Cursor, etc.) working in this repository.

## Project Overview

Sinkplane TV is a fan-made React Native app for [floatplane.com](https://www.floatplane.com), targeting **Apple TV (tvOS)** and **Android TV**. Built on Expo (SDK 54) with the [`react-native-tvos`](https://github.com/react-native-tvos/react-native-tvos) fork and Expo Router for file-based navigation.

Authentication is handled via a **companion mobile app** ([sinkplane-companion](https://github.com/Sinkplane/sinkplane-companion)) that discovers the TV on the local network (Bonjour/Zeroconf) and sends credentials over a **TCP server on port 9999**. This exists because TV platforms cannot render WebView for Cloudflare Turnstile. A manual cookie (`sails.sid`) entry fallback also exists on the sign-in screen.

## Essential Commands

```bash
# Setup (first time) — clones companion app, installs deps, applies patches, runs pod install
./scripts/setup-dev-env.sh

# Install dependencies (ALSO runs patch-package via postinstall — keep patches/ intact)
npm install

# TV development (EXPO_TV=1 is set by these scripts)
npm start            # Expo bundler for TV
npm run ios          # Build & run on Apple TV
npm run android      # Build & run on Android TV
npm run prebuild:tv  # Clean Expo prebuild WITH TV modifications (required before first TV run)

# Mobile development
npm run prebuild     # Clean prebuild WITHOUT TV modifications
npx expo run:ios     # iOS mobile
npx expo run:android # Android mobile

# Quality gates — run these before considering work done
npm run lint         # ESLint (expo lint)
npx tsc --noEmit     # Typecheck (no dedicated script; use tsc directly)

# Other
npm run web          # Web dev server
npm run deploy       # Export web + EAS deploy
npm run reset-project
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
- **`hooks/`** — Business logic and platform integration.
  - `authentication/` — OIDC device flow, profile management.
  - `videos/` — Fetching video lists and delivery data (TanStack Query).
  - `useScale.ts` — Scaling factor (`width / 1000`) for responsive TV layouts. **Always use this** for dimensions/margins/font sizes on TV.
- **`constants/`** — API endpoints (`api.ts`), colors, text styles.
- **`layouts/`** — Layout components (`DualLayoutGridScreen`, `FocusLayoutFlexbox`, `TabLayout`).
- **`types/`** — TypeScript interfaces (API responses, video, user, etc.).
- **`assets/`** — Images, fonts, TV-specific app icons.
- **`scripts/`** — `setup-dev-env.sh` (env setup), `reset-project.js`.
- **`docs/`** — tvOS setup and known-issue docs.
- **`patches/`** — `patch-package` patches (notably the cookie-manager tvOS patch). **Do not delete.**

### Key Technologies

| Concern | Library |
|---|---|
| React Native (TV fork) | `react-native-tvos@0.81.4-0` |
| Routing | `expo-router` (typed routes) |
| Data fetching | `@tanstack/react-query` |
| Animations | `react-native-reanimated` v4.1 |
| Video | `react-native-video` + `@mux/mux-data-react-native-video` |
| Auth/token storage | `expo-secure-store` |
| Companion comms | `react-native-tcp-socket` (port 9999), `react-native-zeroconf` (discovery) |
| Cookies | `@preeternal/react-native-cookie-manager` (with tvOS patch) |
| TV config plugin | `@react-native-tvos/config-tv` |

## TV-Specific Development

### The `EXPO_TV` Environment Variable

`EXPO_TV=1` controls TV vs. mobile mode. It is set automatically by `npm start`, `npm run ios`, `npm run android`, and the `*_tv` EAS profiles. For manual commands, prefix with `EXPO_TV=1`.

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

TV builds need `npm run prebuild:tv` (clean prebuild with TV modifications) to properly generate native code. Mobile uses `npm run prebuild` (no TV modifications).

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

1. **`postinstall` runs `patch-package`** — Keep `patches/` intact so the cookie-manager tvOS patch applies after every `npm install`.

2. **React Native Core tvOS build error** — Xcode 16.x enforces stricter type checking; `dispatch_queue_t` cannot have the `strong` attribute. This is patched automatically via a `post_install` hook in `ios/Podfile` (patches `RCTBridgeModule.h` from `strong` → `assign`). See `docs/react-native-core-tvos-issue.md`. If you regenerate the iOS project, re-verify this hook survives.

3. **`legacy-peer-deps`** — Set globally on EAS via `eas-build-pre-install`. The `react-native` override (`npm:react-native-tvos@...`) and `expo.install.exclude` in `package.json` exclude the stock react-native package.

4. **Companion app is a sibling repo** — Expected at `../sinkplane-companion` (cloned by `setup-dev-env.sh`). The TV app publishes a Bonjour service `sinkplane-tv._tcp`.

## Testing

No automated test framework is currently configured. Current gates are **lint + typecheck**. When adding tests in the future:
- Unit tests alongside source files.
- Integration / E2E tests in `apps/api-provisioning-api-e2e` (per project convention).
- Planned: Jest, React Testing Library, Detox.

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
- If Metro can't resolve modules, run `npx expo start --clear` and/or `rm -rf node_modules/.cache`.
- If pod install fails: `cd ios && rm -rf Pods Podfile.lock ~/Library/Developer/Xcode/DerivedData/sinkplane-* && pod install`.
- Verifying the TV server is running — logs should show `TV Server listening on port 9999` and `TV Service published`.
