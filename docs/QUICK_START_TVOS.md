# Quick Start: tvOS Development

## Automated Setup (Recommended)

We have a script that does everything for you:

```bash
cd sinkplane-tv
./scripts/setup-dev-env.sh
```

This script will:

- ✅ Check prerequisites (Node, pnpm, git, CocoaPods)
- ✅ Clone the companion app and shared package as sibling repos (if not present)
- ✅ Install all dependencies with `pnpm install`
- ✅ Apply the tvOS cookie-manager patch (via pnpm `patchedDependencies` in `pnpm-workspace.yaml`)
- ✅ Run pod install for both projects

## Manual Setup (Alternative)

If you prefer to set things up manually:

### Prerequisites

1. Make sure dependencies are installed from `package.json`
2. Keep the repo `patches/` directory intact — pnpm applies the tvOS cookie-manager patch via `patchedDependencies` in `pnpm-workspace.yaml` during install

### Manual Installation

```bash
pnpm install

# Install iOS/tvOS pods
cd ios && pod install && cd ..
```

> **Note:** `pod` from Homebrew Ruby installs to `/opt/homebrew/lib/ruby/gems/<ver>/bin`, which is not on PATH in non-interactive shells. If `pod install` fails with `spawn pod ENOENT`, export that directory on your PATH first.

## Development Workflow

TV scripts set `EXPO_TV=1` automatically.

### Start Metro Bundler for tvOS

```bash
pnpm start
# or, if you need a clean cache:
pnpm exec expo start --clear
```

### Build for Apple TV Simulator

```bash
pnpm run ios
```

### Build for Apple TV Device

```bash
EXPO_TV=1 pnpm exec expo run:ios --device
```

> A clean prebuild with TV modifications (`pnpm run prebuild:tv`) is required before the first TV run, and again whenever native configuration changes.

## Current Status

✅ **Working**:

- Cookies module with tvOS support (via the pnpm patch in `patches/`)
- Authentication flow (companion app + manual `sails.sid` fallback) with token refresh
- Video playback (progress tracking, scrubbing, playback speeds, closed captions)
- Companion app pairing
- Unit + E2E Jest suites and CI on PRs to `main`

✅ **Resolved issues**:

- The React Native Core tvOS build error (`dispatch_queue_t` / `strong` attribute in `RCTBridgeModule.h`) is fixed upstream in `react-native-tvos` 0.86 — no Podfile hook is needed anymore. See [`react-native-core-tvos-issue.md`](./react-native-core-tvos-issue.md) for the history.

## When Things Break

### Metro Can't Find Cookie Manager

```bash
pnpm exec expo start --clear
rm -rf node_modules/.cache
```

### Pod Install Fails

```bash
cd ios
rm -rf Pods Podfile.lock ~/Library/Developer/Xcode/DerivedData/sinkplane-*
pod install
cd ..
```

### Build Fails with Weird Errors

```bash
# Clean everything
cd ios
xcodebuild clean
rm -rf ~/Library/Developer/Xcode/DerivedData/sinkplane-*
cd ..
rm -rf node_modules
pnpm install
pnpm run link:shared # reinstall recreates dist/ as a real directory
cd ios && pod install && cd ..
```

## Documentation Index

- **[React Native Core Issue (resolved)](./react-native-core-tvos-issue.md)** — Historical investigation of the tvOS build error, fixed in RN 0.86
- **[Main README](../README.md)** — General project documentation
- **[TODO](../TODO.md)** — Feature roadmap and project status
- **[CLAUDE.md / AGENTS.md](../CLAUDE.md)** — Full developer documentation (architecture, commands, gotchas)

## Team Notes

- Keep the `patches/` entry for the cookie manager until upstream ships tvOS support
- If upstream adds tvOS support, remove the patch and verify pods/builds still work
- Keep the `plugins/with-tv-scene-lifecycle.js` config plugin until the Expo template adopts scene-based lifecycle natively (required by iOS/tvOS 27)
- Document any additional tvOS-specific issues in this directory