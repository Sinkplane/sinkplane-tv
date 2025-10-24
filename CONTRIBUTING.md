# Contributing to Sinkplane TV

Thank you for your interest in contributing to Sinkplane TV! This document provides guidelines and information for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing](#testing)
- [TV-Specific Considerations](#tv-specific-considerations)
- [Reporting Issues](#reporting-issues)
- [Feature Requests](#feature-requests)

## Code of Conduct

We are committed to providing a welcoming and inclusive environment for all contributors. Please be respectful and constructive in all interactions.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/sinkplane-tv.git
   cd sinkplane-tv
   ```
3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/ORIGINAL_OWNER/sinkplane-tv.git
   ```
4. **Install dependencies**:
   ```bash
   npm install
   ```

## Development Setup

### Prerequisites

- Node.js (LTS version recommended)
- npm or yarn
- Expo CLI
- For iOS development: Xcode 15+ and macOS
- For Android development: Android Studio and Android SDK
- For TV development: Apple TV simulator or Android TV emulator

### Environment Configuration

The project uses the `EXPO_TV` environment variable to control TV vs. mobile builds:

- **TV Development**: `EXPO_TV=1` (automatically set by `npm start`)
- **Mobile Development**: Unset or `EXPO_TV=0`

### Running the App

**For TV:**
```bash
npm start           # Starts Expo with TV mode
npm run ios         # Build and run for Apple TV
npm run android     # Build for Android TV
npm run prebuild:tv # Generate native code for TV
```

**For Mobile:**
```bash
npm run prebuild    # Generate native code for mobile
npx expo run:ios    # Run on iOS mobile
npx expo run:android # Run on Android mobile
```

**For Web:**
```bash
npm run web         # Run web version
```

## Development Workflow

1. **Create a feature branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following our coding standards

3. **Test your changes** on relevant platforms (TV and/or mobile)

4. **Lint your code**:
   ```bash
   npm run lint
   ```

5. **Commit your changes** following our commit guidelines

6. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

7. **Open a Pull Request** against the `main` branch

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Enable strict type checking (already configured)
- Avoid `any` types when possible
- Document complex types and interfaces

### Code Style

- Follow the existing code style (enforced by ESLint)
- Use meaningful variable and function names
- Keep functions small and focused
- Add comments for complex logic
- Use absolute imports with `@/` prefix

### Component Guidelines

- Use functional components with hooks
- Prefer theme-aware components (`ThemedText`, `ThemedView`)
- Export components as named exports
- Place reusable components in `/components`
- Place screen components in `/app` following Expo Router conventions

### File Naming

- Use PascalCase for component files: `MyComponent.tsx`
- Use kebab-case for utility files: `my-utility.ts`
- Use TV-specific extensions when needed: `.tv.tsx`, `.ios.tv.tsx`, `.android.tv.tsx`

### Validation

- Use **joi** for validation (not yup)
- Keep validation schemas close to where they're used

## Commit Guidelines

We follow conventional commits for clear and semantic commit messages:

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, no logic change)
- **refactor**: Code refactoring
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **chore**: Build process or tooling changes
- **ci**: CI/CD changes

### Examples

```
feat(tv): add focus management for Android TV navigation

fix(mobile): resolve crash on iOS device rotation

docs(readme): update installation instructions

refactor(hooks): simplify useScale hook logic
```

## Pull Request Process

1. **Update documentation** if you've changed functionality
2. **Add tests** if applicable (we're building out test infrastructure)
3. **Ensure all checks pass** (linting, type checking)
4. **Update CHANGELOG.md** if your change is user-facing
5. **Request review** from maintainers
6. **Address feedback** promptly and professionally
7. **Squash commits** if requested before merging

### Pull Request Template

When opening a PR, please include:

- **Description**: What does this PR do?
- **Motivation**: Why is this change needed?
- **Testing**: How was this tested?
- **Screenshots/Videos**: For UI changes (especially TV interface)
- **Platforms**: Which platforms were tested? (iOS/Android/Web, TV/Mobile)
- **Breaking Changes**: Any breaking changes?
- **Related Issues**: Link to related issues

## Testing

### Manual Testing

Currently, the project relies on manual testing. When testing:

- Test on both **TV and mobile** platforms if your change affects both
- Test on **iOS and Android** when possible
- Test different **screen sizes and orientations**
- For TV: Test **focus navigation** with remote controls
- For TV: Test on both **Apple TV and Android TV** simulators/devices

### Future Testing Infrastructure

We're planning to add:
- Unit tests with Jest
- Component tests with React Testing Library
- E2E tests with Detox
- Integration tests (will go in `apps/api-provisioning-api-e2e`)

## TV-Specific Considerations

### Focus Management

- Use `onFocus` and `onBlur` handlers for TV navigation
- Test focus flow with TV remote controls
- Ensure all interactive elements are focusable
- Consider focus trapping for modals and overlays

### Responsive Sizing

- Use the `useScale` hook for responsive TV interfaces
- Test on different TV screen sizes
- Consider safe areas for TV displays

### Platform-Specific Files

- Use `.tv.tsx` extensions for TV-only components
- Use `.ios.tv.tsx` or `.android.tv.tsx` for platform-specific TV code
- Metro will automatically resolve the correct file

### Performance

- TV apps should maintain 60fps
- Optimize images and assets for TV screens
- Use React Native Reanimated for performant animations

## Reporting Issues

### Before Submitting

- Search existing issues to avoid duplicates
- Test on the latest version
- Gather relevant information (platform, version, steps to reproduce)

### Issue Template

**Bug Report:**
- Description
- Steps to reproduce
- Expected behavior
- Actual behavior
- Platform (iOS/Android/Web, TV/Mobile)
- Environment (device, OS version, app version)
- Screenshots/videos if applicable

**Feature Request:**
- Description
- Use case
- Proposed solution (optional)
- Alternatives considered (optional)

## Feature Requests

We welcome feature suggestions! When proposing a feature:

1. **Check existing feature requests** to avoid duplicates
2. **Explain the use case** and problem you're solving
3. **Consider TV implications** if the feature affects TV platforms
4. **Be open to discussion** about implementation approaches

## Questions?

If you have questions about contributing:

- Open a **Discussion** on GitHub
- Tag maintainers in your PR
- Check existing documentation in `/WARP.md` and `README.md`

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.

---

Thank you for contributing to Sinkplane TV! 🚀📺
