/* global __dirname */
// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const fs = require('fs');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

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

// Configure Metro to handle symlinked packages (like @react-native-cookies/cookies)
const projectRoot = __dirname;
const cookiesPath = path.resolve(__dirname, '../cookies');

// Only add cookies path if it exists
const watchFolders = [projectRoot];
if (fs.existsSync(cookiesPath)) {
  watchFolders.push(cookiesPath);
}

config.watchFolders = watchFolders;

// Ensure Metro can resolve modules from the symlinked package
config.resolver = {
  ...config.resolver,
  nodeModulesPaths: [
    path.resolve(projectRoot, 'node_modules'),
    ...(fs.existsSync(cookiesPath) ? [path.resolve(cookiesPath, 'node_modules')] : []),
  ],
  // Ensure we follow symlinks
  resolveRequest: null,
};

// Disable the transformer cache to avoid issues with symlinks
config.resetCache = true;

module.exports = config;
