/* global __dirname */
// Learn more https://docs.expo.io/guides/customizing-metro
const fs = require('fs');
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// @sinkplane/shared installs from GitHub Packages (see .npmrc). For local
// development, `pnpm run link:shared` points node_modules/@sinkplane/shared/dist
// at the sibling clone's dist/ build output. Metro resolves that symlink to
// its real path outside this project root, so the clone must be watched
// explicitly, and its bare imports (react, react-native, …) must resolve from
// this project's node_modules — Node-style walk-up from the sibling dir would
// miss it. The clone itself is optional, so only watch it when present.
const sharedDir = path.resolve(__dirname, '../sinkplane-shared');
if (fs.existsSync(sharedDir)) {
  config.watchFolders = [...config.watchFolders, sharedDir];
}
config.resolver.nodeModulesPaths = [
  ...(config.resolver.nodeModulesPaths ?? []),
  path.resolve(__dirname, 'node_modules'),
];

// When enabled, the optional code below will allow Metro to resolve
// and bundle source files with TV-specific extensions
// (e.g., *.ios.tv.tsx, *.android.tv.tsx, *.tv.tsx)
//
// Metro will still resolve source files with standard extensions
// as usual if TV-specific files are not found for a module.
//
if (process.env?.EXPO_TV === '1') {
  const originalSourceExts = config.resolver.sourceExts;
  const tvSourceExts = [
    ...originalSourceExts.map((e) => `tv.${e}`),
    ...originalSourceExts
  ];
  config.resolver.sourceExts = tvSourceExts;
}

module.exports = config;
