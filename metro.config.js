const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);
// expo-sqlite uses a WebAssembly worker on web. Keep the native build unchanged
// while allowing Metro to resolve the worker's `.wasm` asset.
config.resolver.assetExts.push("wasm");

module.exports = withNativeWind(config, {
  input: "./global.css",
  // Force write CSS to file system instead of virtual modules
  // This fixes iOS styling issues in development mode
  forceWriteFileSystem: true,
});
