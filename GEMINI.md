# Sinkplane TV

Sinkplane TV is a fan-made React Native application for [floatplane.com](https://www.floatplane.com), specifically designed for Apple TV and Android TV. It leverages the Expo ecosystem along with the `react-native-tvos` fork to provide a native TV experience.

## Project Overview

- **Main Technologies:** React Native (TVOS fork), Expo (SDK 54), Expo Router, TanStack Query, React Native Reanimated.
- **Platform Support:** Apple TV (tvOS) and Android TV.
- **Authentication:** Uses a companion app ([Sinkplane Companion](https://github.com/Sinkplane/sinkplane-companion)) that connects to the TV app via a local network TCP server (port 9999).
- **Video Playback:** Uses `react-native-video` with Mux Data integration.

## Architecture

- **`app/`**: File-based routing using Expo Router.
  - `(tabs)/`: Main navigation tabs (Home, Live, About).
  - `video/[id].tsx`: Video player screen.
  - `sign-in.tsx`: Authentication screen.
- **`components/`**: UI components.
  - `authentication/`: Auth-related UI (QR codes, status).
  - `videos/`: Video listing and player components.
  - `Themed*.tsx`: Theme-aware base components.
- **`hooks/`**: Custom hooks for business logic and platform integration.
  - `authentication/`: Hooks for OIDC device flow and profile management.
  - `videos/`: Hooks for fetching video lists and delivery data.
  - `useScale.ts`: Provides a scaling factor (`width / 1000`) for responsive TV layouts.
- **`constants/`**: API endpoints, colors, and text styles.
- **`assets/`**: Images, fonts, and TV-specific app icons.

## Development Workflow

### Prerequisites
- macOS (for Apple TV builds).
- Android Studio / Xcode.
- Node.js & npm/yarn.

### Setup
Run the automated setup script to configure the environment:
```bash
./scripts/setup-dev-env.sh
```

### Common Commands
- **Start Development:** `npm start` (sets `EXPO_TV=1`)
- **Run on Apple TV:** `npm run ios`
- **Run on Android TV:** `npm run android`
- **Clean TV Prebuild:** `npm run prebuild:tv`
- **Linting:** `npm run lint`

### TV-Specific Development
- **File Extensions:** Metro is configured to resolve `.tv.tsx`, `.ios.tv.tsx`, and `.android.tv.tsx` when `EXPO_TV=1` is set. Use these for platform-specific overrides.
- **Focus Management:** TV navigation relies on focus. Use `onFocus`, `onBlur`, and `TouchableHighlight` or `Pressable` with appropriate focus states.
- **Scaling:** Always use the `useScale()` hook to scale dimensions, margins, and font sizes to ensure consistency across different TV resolutions.

## Development Conventions

- **Language:** Strict TypeScript.
- **Imports:** Use the `@/*` path alias for absolute imports from the project root.
- **Components:** Prefer functional components with hooks.
- **Styling:** Use `ThemedText` and `ThemedView` for automatic light/dark mode support.
- **Validation:** Prefer `joi` for validation logic (per project preference).
- **Naming:** Follow existing file-based routing conventions in the `app/` directory.

## Testing & Validation
- No automated test framework is currently configured.
- When adding tests, follow the convention:
  - Integration tests in `apps/api-provisioning-api-e2e` (if applicable).
  - Unit tests alongside the source files.

## Environment Variables
- `EXPO_TV=1`: Must be set for all TV-related development and build commands.
