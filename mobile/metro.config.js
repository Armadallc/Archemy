// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Find the project root directory (parent of mobile/)
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

// Add the shared directory to watchFolders and resolver
config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Allow resolving modules from the shared directory
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
};

// Add source extensions
config.resolver.sourceExts = [...config.resolver.sourceExts, 'ts', 'tsx'];

// Add CSS to asset extensions
config.resolver.assetExts = [...(config.resolver.assetExts || []), 'css'];

module.exports = config;

