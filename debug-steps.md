# Debug Steps for SHA-1 Error

## 🚨 Emergency Fix - Step by Step

### Step 1: Complete Clean
```bash
# Remove ALL cache and generated files
rm -rf .metro-cache/
rm -rf node_modules/.cache/
rm -rf runtime-resolver/temp/
rm -rf metro-runtime-integration/*.tmp

# Reset Metro completely
npx metro --reset-cache
```

### Step 2: Use Emergency Config
Replace your `metro.config.js` with this minimal version:

```javascript
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Minimal config - no wrapper generation
const originalResolver = config.resolver?.resolveRequest;

config.resolver = config.resolver || {};
config.resolver.resolveRequest = (context, moduleName, platform) => {
  try {
    const resolution = originalResolver 
      ? originalResolver(context, moduleName, platform)
      : context.resolveRequest(context, moduleName, platform);
    
    // Just log, don't modify
    if (platform === 'web' && moduleName.includes('react-native')) {
      console.log(`Resolving ${moduleName} for web`);
    }
    
    return resolution;
  } catch (error) {
    console.error(`Error resolving ${moduleName}:`, error.message);
    throw error;
  }
};

module.exports = config;
```

### Step 3: Test Basic Setup
```bash
# Start with clean cache
npm run web
# or
expo start --web
```

### Step 4: If Still Failing
Check these files exist:
- `runtime-resolver/src/index.js` 
- `metro-runtime-integration/` directory

### Step 5: Nuclear Option
If still getting SHA-1 errors:

```javascript
// metro.config.js - Completely disable any custom resolution
const { getDefaultConfig } = require('expo/metro-config');

module.exports = getDefaultConfig(__dirname);
```

### Step 6: Gradual Re-enable
Once basic setup works, gradually add back:

1. First: Add basic error handling
2. Then: Add module detection
3. Finally: Add wrapper generation

## 🔍 Debug Information

### Check These Files
```bash
# Check if runtime resolver exists
ls -la runtime-resolver/src/
ls -la metro-runtime-integration/

# Check cache contents
ls -la .metro-cache/runtime-wrappers/
```

### Common Issues
1. **Path Problems**: Windows vs Unix paths
2. **Permission Issues**: Cache directory not writable
3. **Module Not Found**: runtime-resolver not in correct location
4. **Syntax Errors**: Generated wrapper files have invalid JavaScript

### Logs to Look For
```
✅ Good: "Resolving react-native-camera for web"
❌ Bad: "Failed to get SHA-1 for"
❌ Bad: "SyntaxError in generated file"
```

## 🔧 Alternative Approach

If wrappers keep failing, use runtime-only approach:

```javascript
// In your components, manually wrap imports
import { createRuntimeResolver } from './runtime-resolver/src/index';

const resolver = createRuntimeResolver();

// Manual wrapping
import CameraOriginal from 'react-native-camera';
const Camera = resolver.resolve('react-native-camera', CameraOriginal);

// Use Camera safely
```

This bypasses Metro entirely and handles wrapping at the component level.