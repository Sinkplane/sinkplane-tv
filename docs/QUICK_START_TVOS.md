# Quick Start: tvOS Development

## Automated Setup (Recommended)

We have a script that does everything for you:

```bash
cd /Users/cpawlukiewicz/www/ltt/sinkplane-tv
./scripts/setup-dev-env.sh
```

This script will:

- ✅ Check prerequisites (Node, npm, git, CocoaPods)
- ✅ Clone the companion app (if not exists)
- ✅ Clone and patch the cookies package for tvOS
- ✅ Install all dependencies
- ✅ Run pod install for both projects

## Manual Setup (Alternative)

If you prefer to set things up manually:

### Prerequisites

1. Clone the cookies repository with tvOS patches:

```bash
cd /Users/cpawlukiewicz/www/ltt/
git clone https://github.com/react-native-cookies/cookies.git
```

2. Apply tvOS patches (see [`tvos-cookies-workaround.md`](./tvos-cookies-workaround.md))
3. The `sinkplane-tv/package.json` is already configured to use the local package

### Manual Installation

```bash
cd /Users/cpawlukiewicz/www/ltt/sinkplane-tv

# Install dependencies (will symlink the local cookies package)
npm install

# Install iOS/tvOS pods
cd ios && pod install && cd ..
```

## Development Workflow

### Start Metro Bundler for tvOS

```bash
EXPO_TV=1 npx expo start --clear
```

### Build for Apple TV Simulator

```bash
EXPO_TV=1 npx expo run:ios
```

### Build for Apple TV Device

```bash
EXPO_TV=1 npx expo run:ios --device
```

## Current Status

✅ **Working**:

- Cookies module with tvOS support (via local symlink)
- Authentication flow
- Video playback
- Companion app pairing

⚠️ **Known Issue**:

- React Native Core build error on tvOS (see below)

## Active Issues

### React Native Core Build Error

**Error**:

```
RCTBridgeModule.h:164:1: error: property with 'retain (or strong)' attribute must be of object type
```

**Status**: Under investigation

**Next Steps**: See [`react-native-core-tvos-issue.md`](./react-native-core-tvos-issue.md) for the complete investigation plan.

## When Things Break

### Metro Can't Find Cookies Module

```bash
npx expo start --clear
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
npm install
cd ios && pod install && cd ..
```

## Documentation Index

- **[tvOS Cookies Workaround](./tvos-cookies-workaround.md)** - Detailed setup for local cookies package
- **[React Native Core Issue](./react-native-core-tvos-issue.md)** - Investigation plan for build errors
- **[Main README](../README.md)** - General project documentation

## Team Notes

- Keep the local `cookies` repository until PR #165 is merged upstream
- Don't commit changes to the cookies repository
- When PR #165 is merged, update package.json to use the published version
- Document any additional tvOS-specific issues in this directory
