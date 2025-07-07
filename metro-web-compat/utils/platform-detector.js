const DEFAULT_WEB_PLATFORMS = ['web', 'browser', 'dom'];

function isWebPlatform(platform, webPlatforms = DEFAULT_WEB_PLATFORMS) {
  if (!platform) return false;
  return webPlatforms.includes(platform.toLowerCase());
}

function isMobilePlatform(platform) {
  const mobilePlatforms = ['ios', 'android', 'native'];
  if (!platform) return false;
  return mobilePlatforms.includes(platform.toLowerCase());
}

function isPlatformSpecific(platform) {
  return isWebPlatform(platform) || isMobilePlatform(platform);
}

function getCurrentPlatform() {
  if (typeof window !== 'undefined') {
    return 'web';
  }
  if (typeof process !== 'undefined' && process.platform) {
    return process.platform;
  }
  return 'unknown';
}

function detectBuildTarget(context) {
  if (context && context.platform) {
    return context.platform;
  }
  
  if (typeof process !== 'undefined' && process.env.EXPO_PLATFORM) {
    return process.env.EXPO_PLATFORM;
  }
  
  if (typeof process !== 'undefined' && process.env.PLATFORM) {
    return process.env.PLATFORM;
  }
  
  return getCurrentPlatform();
}

function isWebBuild(context) {
  const platform = detectBuildTarget(context);
  return isWebPlatform(platform);
}

function isMobileBuild(context) {
  const platform = detectBuildTarget(context);
  return isMobilePlatform(platform);
}

function getPlatformExtensions(platform) {
  const extensions = ['.js', '.jsx', '.ts', '.tsx', '.json'];
  
  if (isWebPlatform(platform)) {
    return ['.web.js', '.web.jsx', '.web.ts', '.web.tsx', ...extensions];
  }
  
  if (platform === 'ios') {
    return ['.ios.js', '.ios.jsx', '.ios.ts', '.ios.tsx', '.native.js', '.native.jsx', '.native.ts', '.native.tsx', ...extensions];
  }
  
  if (platform === 'android') {
    return ['.android.js', '.android.jsx', '.android.ts', '.android.tsx', '.native.js', '.native.jsx', '.native.ts', '.native.tsx', ...extensions];
  }
  
  return extensions;
}

function shouldUsePlatformSpecificVersion(filePath, platform) {
  const platformExtensions = getPlatformExtensions(platform);
  const platformSpecificExtensions = platformExtensions.slice(0, 4); // Only platform-specific ones
  
  return platformSpecificExtensions.some(ext => filePath.includes(ext));
}

module.exports = {
  isWebPlatform,
  isMobilePlatform,
  isPlatformSpecific,
  getCurrentPlatform,
  detectBuildTarget,
  isWebBuild,
  isMobileBuild,
  getPlatformExtensions,
  shouldUsePlatformSpecificVersion,
  DEFAULT_WEB_PLATFORMS
};