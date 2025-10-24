# Sinplane TV 👋

<img width="1920" height="1080" alt="Simulator Screenshot - Apple TV 4K (3rd generation) - 2025-10-24 at 15 48 37" src="https://i.imgur.com/QNuIqCv.jpeg" />

This is a fan-made AppleTV and AndroidTV app for floatplane.com. 

## Usage Information
- This currently only works on Apple TV (planning to add Google TV soon)
- This is not yet available in the app store / play store (will take some weeks for apple developer entitlements and app store approvals)
- Auth is currently janky, you will need to copy your auth cookie from floatplane.com to get it to work and paste it into the text box. You will eventually be able to sign in through the companion app once everything is live in the app stores

## How can I help
- Read the [FAQ](https://github.com/Sinkplane/sinkplane-tv/blob/main/TODO.md)
- Help me pay Apple Developers rediculolus fees - [Buy Me A Coffee](https://buymeacoffee.com/paynoattn)
- [File a ticket if you encounter a bug](https://github.com/Sinkplane/sinkplane-tv/issues)
- If you know what youre doing look at the [TODO](https://github.com/Sinkplane/sinkplane-tv/blob/main/TODO.md) and open a pull request (no AI slop please).

## Developer Information
This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

This project uses

- the [React Native TV fork](https://github.com/react-native-tvos/react-native-tvos), which supports both phone (Android and iOS) and TV (Android TV and Apple TV) targets
- the [React Native TV config plugin](https://github.com/react-native-tvos/config-tv/tree/main/packages/config-tv) to allow Expo prebuild to modify the project's native files for TV builds

## 🚀 How to use

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

### TV specific file extensions

This project includes an [example Metro configuration](./metro.config.js) that allows Metro to resolve application source files with TV-specific code, indicated by specific file extensions (`*.ios.tv.tsx`, `*.android.tv.tsx`, `*.tv.tsx`).

### Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.
