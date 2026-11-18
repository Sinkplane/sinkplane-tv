# Agents

Sinkplane TV: a fan-made [floatplane.com](https://www.floatplane.com) client for **Apple TV (tvOS)** and **Android TV**, on Expo SDK 57 with the [`react-native-tvos`](https://github.com/react-native-tvos/react-native-tvos) fork, Expo Router, React 19 and React Compiler. Package manager is **pnpm** (Node from `.nvmrc`). Every rule that matters is a gate; run it instead of reading about it.

## Commands

- `make setup` once (frozen install, points git at `.githooks`). `make check` before you stop: the stop hook, the pre-push hook and CI run it too.
- Fast feedback: `make test` (unit), `make acceptance` (E2E), `make lint` (eslint `--max-warnings=0`, then knip), `make typecheck`, `make arch`, `make build` (Metro TV export).
- `make crap` after `make coverage`. `make mutate SCOPE=changed` while hardening (CI runs it on PRs).
- `make gauntlet` = `check mutate qa`. `make help` lists every target.
- App: `pnpm start`, `pnpm run ios`, `pnpm run android` (all set `EXPO_TV=1`). Native code needs `pnpm run prebuild:tv` first. EAS profiles: `development_tv`, `preview_tv`, `production_tv`.

## Gates

| Gate                                     | Threshold                                                              |
| ---------------------------------------- | ---------------------------------------------------------------------- |
| ESLint `strictTypeChecked` + React rules | zero warnings; complexity ≤ 6, ≤ 40 lines/function, ≤ 300 lines/file   |
| tsc strictest                            | `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, and the rest |
| Coverage (E2E suite)                     | ≥ 90% statements, branches, functions, lines                           |
| CRAP (`scripts/crap.mts`)                | ≤ 6 per function, from the unit + E2E coverage reports                 |
| dependency-cruiser                       | zero violations                                                        |
| Stryker                                  | `break` in `stryker.config.json`, ratcheted up as tests kill mutants   |

## Rules

- Files in `.gates-protected` need human approval to change. Never loosen a gate to get green.
- No `useEffect`, no manual memoization, no comments, no `as` (`as const` is fine). Lint errors say what to do instead.
- Suppressions need `-- reason`; size, complexity, comment and cast rules cannot be disabled inline; coverage and mutation ignore comments are banned.
- Skills live in `.cursor/skills` (also `.claude/skills`). The `gauntlet` skill runs a story through specifier → coder → cleaner → hardener → qa.
- Do not commit unless asked. Conventional Commits (`feat(tv): …`, `fix(player): …`).

### No effects

- Derive values during render instead of syncing them into state.
- Run side effects in the event handler that causes them (`onPress`, `onLoad`, `onEnd`, `onEndReached`).
- Read server data with react-query (the `@sinkplane/shared` hooks); poll with `refetchInterval`.
- Subscribe to anything external (timers, native emitters) with `useSyncExternalStore`, or a React 19 ref callback that returns its cleanup.
- Refresh on screen focus with expo-router's `useFocusEffect`; handle the remote with `useTVEventHandler`.
- Reset state with a `key`.

## Layout

Layers, top to bottom (`make arch` enforces it): `app` → `layouts` → `components` → `hooks` → `constants`, `types`.

- `app/`: Expo Router routes (typed routes). Only routes default-export. `(tabs)/` = Home, History, Live; `video/[id].tsx` = player; `sign-in.tsx` = OIDC device flow.
- `layouts/`: `TabLayout.tsx` (native tabs on tvOS; `TabLayout.web.tsx` is the JS tab bar used on Android TV and web).
- `components/`: `ThemedText`/`ThemedView`/`ThemedButton`/`ThemedModal` for light/dark, `videos/` for lists, cards and the player.
- `hooks/`: `useScale` (`width / 1000` on TV) and `useTextStyles`. Size everything with them, using the tokens in `constants/layout.ts` (`SPACE.md * scale`).
- `constants/`, `types/`: pure values, helpers and typings.
- Unit tests sit next to the code as `*.test.ts(x)`. E2E: `__tests__/e2e/*.e2e.test.tsx` boot the real router against an in-memory Floatplane API (`__tests__/e2e/helpers`). QA procedures: `qa/procedures/`.

## TV specifics

- `EXPO_TV=1` switches Metro to TV mode and resolves `.ios.tv.tsx`, `.android.tv.tsx`, `.tv.tsx` before the standard extensions (`metro.config.js`).
- Navigation is focus-driven: every interactive element is a focusable `Pressable` with a visible focus state; trap focus in modals.
- Auth is Floatplane's OIDC device flow on `auth.floatplane.com` (client `hydravion`): QR code / device code on the TV, approval at `floatplane.com/link`, tokens in `expo-secure-store` with automatic refresh. TV platforms cannot render the Turnstile WebView.

## `@sinkplane/shared`

API client, OIDC device flow, token refresh, `SessionProvider`/`useSession`, content query hooks, theme and colors, and all Floatplane types. Import from the barrel (`import { useSession } from '@sinkplane/shared'`); `Channel`/`Creator` come from `@sinkplane/shared/types/creator-list.interface`.

- Installed from GitHub Packages (`.npmrc`); locally the token comes from `~/.npmrc`, on EAS from the `GITHUB_PACKAGES_TOKEN` environment variable, which `scripts/eas-npmrc-auth.mjs` (`eas-build-pre-install`) writes to the worker's `~/.npmrc`. pnpm never expands `${...}` in repo credentials.
- The sibling clone `../sinkplane-shared` is the development source: `pnpm run link:shared` points `node_modules/@sinkplane/shared/dist` at its build (re-run after every install), and Jest maps the package to its TypeScript sources (`jest.config.base.js`). Its `node_modules` is a symlink to this app's; never run `pnpm install` inside it.
- The barrel still re-exports the retired TV companion server (`useTVServer`), so `react-native-tcp-socket`, `react-native-zeroconf` and the cookie manager stay installed.

## Gotchas

- iOS/tvOS 27 require the UIKit scene lifecycle: `plugins/with-tv-scene-lifecycle.js` registers `ExpoAppSceneDelegate`. Drop it once the Expo template adopts scenes.
- pnpm 12 reads settings only from `pnpm-workspace.yaml` (`nodeLinker: hoisted`, `allowBuilds`, `patchedDependencies`, overrides); `.npmrc` holds only registry and auth. `react-native` is aliased to `react-native-tvos` and excluded from `expo install`. Keep `patches/`.
- CocoaPods on Homebrew Ruby is not on PATH in non-interactive shells (`spawn pod ENOENT`); it is exported in `~/.zshrc`.
- Metro cannot resolve a module: `pnpm exec expo start --clear`.
