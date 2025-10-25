# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Project Overview

This is an Expo-based React Native application that supports TV platforms using the React Native TV fork (react-native-tvos). The app uses Expo Router for file-based navigation and includes TV-specific optimizations for Apple TV and Android TV.

## Common Development Commands

### TV Development

```bash
# Install dependencies
npm install

# Start development for TV
npm start           # Starts Expo with EXPO_TV=1 enabled
npm run ios        # Build and run for Apple TV
npm run android    # Build for Android TV

# Prebuild for TV (generates native code)
npm run prebuild:tv  # Clean prebuild with TV modifications
```

### Mobile Development

```bash
# Prebuild for mobile (no TV modifications)
npm run prebuild    # Clean prebuild for mobile platforms

# Run on mobile (after prebuild)
npx expo run:ios     # iOS mobile
npx expo run:android # Android mobile
```

### Other Commands

```bash
npm run web         # Run on web from localhost
npm run lint        # Run linting with expo lint
npm run deploy      # Deploy web version via EAS
npm run reset-project # Reset to blank starter project
```

### EAS Build Commands

```bash
# Development builds
eas build --platform ios --profile development_tv     # Apple TV dev
eas build --platform android --profile development_tv  # Android TV dev
eas build --platform ios --profile development        # iOS mobile dev
eas build --platform android --profile development    # Android mobile dev

# Preview builds
eas build --profile preview_tv    # TV preview builds
eas build --profile preview       # Mobile preview builds

# Production builds
eas build --profile production_tv # TV production
eas build --profile production    # Mobile production
```

## Architecture

### Project Structure

- **app/**: Contains all screen components using Expo Router's file-based routing
  - `_layout.tsx`: Root layout with theme provider and font loading
  - `(tabs)/`: Tab-based navigation screens
  - `+not-found.tsx`: 404 error page
  - `+html.tsx`: Custom HTML wrapper for web
- **components/**: Reusable UI components

  - Theme-aware components (`ThemedText`, `ThemedView`)
  - TV-specific demo component (`EventHandlingDemo`)
  - Navigation components

- **hooks/**: Custom React hooks including `useScale` for responsive sizing

- **constants/**: App constants and configuration

- **layouts/**: Layout components (DualLayoutGridScreen, FocusLayoutFlexbox)

- **assets/**: Images, fonts, and TV-specific icons

### Key Technologies

- **React Native TV Fork**: Uses `react-native-tvos` for TV support
- **Expo Router**: File-based routing with typed routes
- **React Native Reanimated**: Animation library (v4.1.0)
- **TV Config Plugin**: `@react-native-tvos/config-tv` for TV-specific modifications

### TV-Specific Features

- **File Extensions**: Metro resolves TV-specific files (`.tv.tsx`, `.ios.tv.tsx`, `.android.tv.tsx`)
- **Focus Management**: TV remote control navigation with onFocus/onBlur handlers
- **Scaling**: Responsive sizing using the `useScale` hook for different screen sizes
- **TV Icons**: Configured in app.json for Apple TV and Android TV home screens

### Environment Variables

- `EXPO_TV=1`: Enables TV mode for builds and development

### TypeScript Configuration

- Strict mode enabled
- Path alias: `@/*` maps to project root
- Includes expo types and environment definitions

### Validation

User prefers joi over yup for validation in projects (based on user rules).

### Testing

No test framework currently configured. When adding tests:

- Integration tests should go in `apps/api-provisioning-api-e2e` folder (based on user rules)
- Consider adding test scripts to package.json

## Development Tips

- The EXPO_TV environment variable controls whether the app builds for TV or mobile platforms
- Use absolute paths when running commands to avoid cd navigation issues
- TV builds require clean prebuild to properly configure native code
- The EventHandlingDemo component demonstrates TV-specific focus handling patterns
- Scale values using the useScale hook for responsive TV interfaces

## Code Style and Patterns

- Use TypeScript strict mode for all new code
- Prefer functional components with hooks over class components
- Use the `@/*` path alias for cleaner imports
- Follow Expo Router conventions for navigation and routing
- Create TV-specific variants using `.tv.tsx` file extensions when needed
- Use the `useScale` hook for TV-responsive layouts
