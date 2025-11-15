# tvOS Cookies Module Workaround

## Background

The `@react-native-cookies/cookies` package does not currently support tvOS in its published version. However, there is an open PR ([#165](https://github.com/react-native-cookies/cookies/pull/165)) that adds tvOS support.

Until this PR is merged and published, we're using a local symlinked version of the cookies package with the tvOS patches applied.

## Setup Instructions

### Automated Setup (Recommended)

The easiest way to set up the entire environment is to use our setup script:

```bash
cd /Users/cpawlukiewicz/www/ltt/sinkplane-tv
./scripts/setup-dev-env.sh
```

This will automatically clone the cookies repo, apply all patches, and set up dependencies.

### Manual Setup (Alternative)

If you prefer to set things up manually, follow these steps:

#### 1. Clone the Cookies Repository

The cookies repository should be cloned into the parent directory alongside `sinkplane-tv`:

```bash
cd /Users/cpawlukiewicz/www/ltt/
git clone https://github.com/react-native-cookies/cookies.git
cd cookies
```

### 2. Apply tvOS Patches

The following changes have been applied to add tvOS support:

#### `react-native-cookies.podspec`

- Added tvOS platform support with deployment target 7.0
- Updated platform configuration to include both iOS and tvOS

#### `ios/RNCookieManagerIOS/RNCookieManagerIOS.h`

- Added conditional `__has_include(<WebKit/WebKit.h>)` check
- WebKit is not available on tvOS, so the import is conditional

#### `ios/RNCookieManagerIOS/RNCookieManagerIOS.m`

- Wrapped all WebKit usage in `#if __has_include(<WebKit/WebKit.h>)` blocks
- Added fallback error messages when WebKit is not available
- Fixed code quality issues (boolean returns, unused variables)

#### `README.md`

- Updated platform support list to include tvOS and AndroidTV

#### `package.json` (Important!)

- **Added `index.js` to the `files` array** - This was missing in the original package and caused Metro bundler to fail resolving the module

```json
"files": [
  "android",
  "ios",
  "index.js",     // ← Added this!
  "index.d.ts",
  "react-native-cookies.podspec"
]
```

Without this, npm would symlink the package but not include the main `index.js` file, causing "Unable to resolve @react-native-cookies/cookies" errors at runtime.

### 3. Link the Local Package

The `package.json` in `sinkplane-tv` has been updated to use the local cookies package:

```json
{
  "dependencies": {
    "@react-native-cookies/cookies": "file:../cookies"
  }
}
```

### 4. Install Dependencies

```bash
cd /Users/cpawlukiewicz/www/ltt/sinkplane-tv
npm install
cd ios && pod install
```

## Current Status

✅ **tvOS support for cookies module is fully working**

- The cookies module compiles successfully with tvOS support
- The Metro bundler correctly resolves the symlinked package
- Both Xcode build and runtime resolution are working

### Metro Configuration

The `metro.config.js` has been updated to handle the symlinked cookies package:

```javascript
// Configure Metro to handle symlinked packages
const cookiesPath = path.resolve(__dirname, '../cookies');

config.watchFolders = [projectRoot, cookiesPath];
config.resolver = {
  ...config.resolver,
  nodeModulesPaths: [
    path.resolve(projectRoot, 'node_modules'),
    path.resolve(cookiesPath, 'node_modules'),
  ],
};
```

This ensures Metro can find and bundle the symlinked package and its dependencies.

## When to Remove This Workaround

Once PR #165 is merged and a new version of `@react-native-cookies/cookies` is published with tvOS support, you can:

1. Update `package.json` to use the published version:

```json
{
  "dependencies": {
    "@react-native-cookies/cookies": "^6.3.0" // or whatever version includes tvOS
  }
}
```

2. Run `npm install` and `pod install` to use the published package

3. Delete the local `cookies` repository clone if no longer needed

## Testing

To verify the cookies module is properly linked:

```bash
# Check that the symlink is working
ls -la node_modules/@react-native-cookies/cookies

# It should show a symlink to ../../../cookies
```

## Troubleshooting

### Metro bundler can't find the module

Clear the Metro cache:

```bash
npx expo start --clear
```

### Pod install fails

Clean and reinstall:

```bash
cd ios
pod deintegrate
pod install
```

### Build errors related to WebKit

Ensure the tvOS patches have been applied correctly. The WebKit includes and usage should all be wrapped in `#if __has_include(<WebKit/WebKit.h>)` blocks.
