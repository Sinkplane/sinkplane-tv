# Sinplane TV 👋

<img width="1920" height="1080" alt="Simulator Screenshot - Apple TV 4K (3rd generation) - 2025-10-24 at 15 48 37" src="https://i.imgur.com/QNuIqCv.jpeg" />

This is a fan-made AppleTV and AndroidTV app for floatplane.com.

## ⚠️ tvOS Development Setup

This project requires special configuration for tvOS support:

### Cookies Module Workaround

The `@react-native-cookies/cookies` package doesn't officially support tvOS yet. We're using a locally patched version until [PR #165](https://github.com/react-native-cookies/cookies/pull/165) is merged.

**📖 See**: [`docs/tvos-cookies-workaround.md`](docs/tvos-cookies-workaround.md) for detailed setup instructions.

### Known Build Issues

There is currently a build issue with React Native Core on tvOS related to `dispatch_queue_t` properties.

**📋 See**: [`docs/react-native-core-tvos-issue.md`](docs/react-native-core-tvos-issue.md) for the investigation and fix plan.

---

## Usage Information

- Works on both Apple TV and Android TV
- Not yet available in the app store / play store (will take some weeks for apple developer entitlements and app store approvals)
- **Authentication**: Use the [Sinkplane Companion app](../sinkplane-companion) to sign in to your TV
  - Sign in on your mobile device
  - The companion app will discover your TV on the network
  - Send your credentials to the TV with one tap

## How can I help

- Read the [FAQ](https://github.com/Sinkplane/sinkplane-tv/blob/main/FAQ.md)
- Help me pay Apple Developers rediculolus fees - [Buy Me A Coffee](https://buymeacoffee.com/paynoattn)
- [File a ticket if you encounter a bug](https://github.com/Sinkplane/sinkplane-tv/issues)
- If you know what youre doing look at the [TODO](https://github.com/Sinkplane/sinkplane-tv/blob/main/TODO.md) and open a pull request - [(please read contribution guidelines)](https://github.com/Sinkplane/sinkplane-tv/blob/main/CONTRIBUTING.md).

## Developer Information

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

This project uses

- the [React Native TV fork](https://github.com/react-native-tvos/react-native-tvos), which supports both phone (Android and iOS) and TV (Android TV and Apple TV) targets
- the [React Native TV config plugin](https://github.com/react-native-tvos/config-tv/tree/main/packages/config-tv) to allow Expo prebuild to modify the project's native files for TV builds

## 🚀 How to use

### First Time Setup

We provide an automated setup script that configures everything:

```sh
cd sinkplane-tv
./scripts/setup-dev-env.sh
```

This will:
- Clone required dependencies (cookies package, companion app)
- Apply tvOS patches
- Install all dependencies
- Set up CocoaPods

**See**: [`docs/QUICK_START_TVOS.md`](docs/QUICK_START_TVOS.md) for detailed setup instructions.

### Development

- `cd` into the project

- For TV development:

```sh
yarn
yarn prebuild:tv # Executes clean Expo prebuild with TV modifications
yarn ios # Build and run for Apple TV
yarn android # Build for Android TV
yarn web # Run the project on web from localhost
```

### Development

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

This project includes a [demo](./components/EventHandlingDemo.tsx) showing how to use React Native TV APIs to highlight controls as the user navigates the screen with the remote control.

### Development with Companion App

To test authentication and companion features during development:

1. **Start the TV app** (this starts a TCP server on port 9999):
   ```bash
   EXPO_TV=1 npx expo run:android  # or run:ios for Apple TV
   ```

2. **Start the companion app** in a separate terminal:
   ```bash
   cd ../sinkplane-companion
   ./scripts/setup-dev-env.sh android  # or appletv
   npx expo start
   ```

The companion app will automatically discover and connect to your TV. See the [Companion App README](../sinkplane-companion/README.md) for detailed setup instructions.

#### Verifying TV Server

When the TV app starts, you should see in the logs:
```
[TV Server] useTVServer useEffect mounting
TV Server listening on port 9999
TV Service published
```

This means the TV is ready to accept connections from the companion app.

### TV specific file extensions

This project includes an [example Metro configuration](./metro.config.js) that allows Metro to resolve application source files with TV-specific code, indicated by specific file extensions (`*.ios.tv.tsx`, `*.android.tv.tsx`, `*.tv.tsx`).

### Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.
