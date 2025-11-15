# React Native Core tvOS Build Issue

## Problem Description

When building the sinkplane-tv app for tvOS, the build fails with the following error:

```
/Users/cpawlukiewicz/www/ltt/sinkplane-tv/ios/Pods/Headers/Public/React-Core/React/RCTBridgeModule.h:164:1:
error: property with 'retain (or strong)' attribute must be of object type
  164 | @property (nonatomic, strong, readonly) dispatch_queue_t methodQueue RCT_DEPRECATED;
      | ^
```

## Root Cause

The error occurs in `RCTBridgeModule.h` where `dispatch_queue_t` is declared with the `strong` attribute. In Objective-C, `dispatch_queue_t` is a C type (not an Objective-C object) when not using ARC for dispatch objects.

This appears to be a compatibility issue between:

- React Native tvOS version: `0.81.4-0`
- Xcode version: 16.x (with updated clang compiler)
- tvOS SDK version: 18.5

## Investigation Plan

### Phase 1: Understand the Issue (Estimated: 30 minutes)

1. **Check React Native tvOS Version Compatibility**

   - Current version: `npm:react-native-tvos@0.81.4-0`
   - Check if there's a newer version available
   - Review react-native-tvos changelog for related fixes

2. **Examine RCTBridgeModule.h**

   ```bash
   cat ios/Pods/Headers/Public/React-Core/React/RCTBridgeModule.h | grep -A 5 -B 5 "dispatch_queue_t"
   ```

3. **Check Compiler Flags**
   - Review if `OS_OBJECT_USE_OBJC` is properly set
   - Check ARC settings in Podfile and project configuration

### Phase 2: Research Solutions (Estimated: 1 hour)

1. **Search for Known Issues**

   - Check react-native-tvos GitHub issues
   - Search for similar errors with dispatch_queue_t
   - Check if this is fixed in newer versions

2. **Review React Native Core Changes**
   - Compare with standard React Native (non-tvOS)
   - Check if iOS builds have the same issue
   - Review recent commits to RCTBridgeModule.h

### Phase 3: Implement Fix (Estimated: 1-2 hours)

#### Option A: Update React Native tvOS Version

If a newer version with the fix exists:

1. Update `package.json`:

```json
{
  "dependencies": {
    "react-native": "npm:react-native-tvos@<newer-version>"
  }
}
```

2. Run:

```bash
npm install
cd ios && pod install
```

#### Option B: Apply Patch to React Native Core

If no updated version exists, create a patch:

1. **Create patch file**: `patches/react-native-tvos+0.81.4-0.patch`

2. **Modify RCTBridgeModule.h** to fix the property declaration:

```objective-c
// Before (line 164):
@property (nonatomic, strong, readonly) dispatch_queue_t methodQueue RCT_DEPRECATED;

// After:
@property (nonatomic, assign, readonly) dispatch_queue_t methodQueue RCT_DEPRECATED;
// OR
@property (nonatomic, readonly) dispatch_queue_t methodQueue RCT_DEPRECATED;
```

3. **Install patch-package**:

```bash
npm install --save-dev patch-package
```

4. **Update package.json scripts**:

```json
{
  "scripts": {
    "postinstall": "patch-package"
  }
}
```

#### Option C: Configure Build Settings

If it's a compiler configuration issue:

1. **Update Podfile** to set proper compiler flags:

```ruby
post_install do |installer|
  installer.pods_project.targets.each do |target|
    target.build_configurations.each do |config|
      config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] ||= ['$(inherited)']
      config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] << 'OS_OBJECT_USE_OBJC=0'
    end
  end
end
```

2. Run:

```bash
cd ios && pod install
```

#### Option D: Use React Native Core Prebuilt

Check if using the prebuilt version helps:

1. Update `app.json` or build configuration to use prebuilt
2. Clean and rebuild

### Phase 4: Test and Validate (Estimated: 30 minutes)

1. **Clean Build**

```bash
cd ios
rm -rf build/ Pods/ Podfile.lock ~/Library/Developer/Xcode/DerivedData/sinkplane-*
pod install
cd ..
```

2. **Build for tvOS Simulator**

```bash
xcodebuild -workspace ios/sinkplane.xcworkspace \
  -scheme sinkplane \
  -configuration Debug \
  -sdk appletvsimulator \
  -destination 'platform=tvOS Simulator,name=Apple TV' \
  clean build
```

3. **Test App Functionality**

```bash
EXPO_TV=1 npx expo run:ios
```

4. **Verify Cookies Module Works**
   - Test cookie get/set operations
   - Verify no crashes on tvOS
   - Check that fallback (non-WebKit) code path works

### Phase 5: Document Solution (Estimated: 15 minutes)

1. Update this document with the working solution
2. Add to project README if needed
3. Consider contributing fix upstream if appropriate

## Progress Tracking

- [x] Phase 1: Investigation completed
- [x] Phase 2: Research completed
- [x] Phase 3: Fix implemented
- [x] Phase 4: Testing completed
- [x] Phase 5: Documentation updated

## Solution

### What Worked:

**Option C Modified: Podfile Post-Install Hook**

The issue was resolved by adding a post-install hook to the Podfile that patches the RCTBridgeModule.h header files in the prebuilt React-Core xcframework. The fix changes the `dispatch_queue_t` property attribute from `strong` to `assign`, which is the correct attribute for C types in modern Objective-C with ARC.

### Root Cause:

In Xcode 16.x, the clang compiler enforces stricter type checking. The `dispatch_queue_t` type is a C type (not an Objective-C object), and therefore cannot have the `strong` attribute. The prebuilt React Native tvOS version 0.81.4-0 contained this incompatibility in its header files.

### Files Modified:

- `ios/Podfile` - Added post-install hook to patch RCTBridgeModule.h files

### Commands Used:

```bash
# After modifying the Podfile, run:
cd ios
pod install

# Then build for tvOS:
cd ..
EXPO_TV=1 npx expo run:ios --device "Apple TV"
```

### The Fix:

Add the following to the `post_install` hook in `ios/Podfile` (after the `react_native_post_install` call):

```ruby
# Fix for Xcode 16.x: dispatch_queue_t cannot have 'strong' attribute
# This patches the RCTBridgeModule.h header in the prebuilt React-Core framework
puts "Patching RCTBridgeModule.h for Xcode 16.x compatibility..."

# Find all RCTBridgeModule.h files in the React-Core-prebuilt xcframework
Dir.glob("#{installer.sandbox.root}/React-Core-prebuilt/**/**/RCTBridgeModule.h").each do |file|
  # Make file writable
  FileUtils.chmod("u+w", file)

  content = File.read(file)

  # Replace 'strong' with 'assign' for dispatch_queue_t property
  updated_content = content.gsub(
    /@property \(nonatomic, strong, readonly\) dispatch_queue_t methodQueue/,
    '@property (nonatomic, assign, readonly) dispatch_queue_t methodQueue'
  )

  if content != updated_content
    File.write(file, updated_content)
    puts "  ✓ Patched: #{file}"
  end
end
```

### What Changed:

Line 164 in RCTBridgeModule.h:

- **Before:** `@property (nonatomic, strong, readonly) dispatch_queue_t methodQueue RCT_DEPRECATED;`
- **After:** `@property (nonatomic, assign, readonly) dispatch_queue_t methodQueue RCT_DEPRECATED;`

### Files Patched:

The post-install hook automatically patches 6 instances of RCTBridgeModule.h across all architectures:

1. Headers/React_Core/RCTBridgeModule.h
2. ios-arm64/React.framework/Headers/React_Core/RCTBridgeModule.h
3. ios-arm64_x86_64-maccatalyst/React.framework/Headers/React_Core/RCTBridgeModule.h
4. ios-arm64_x86_64-simulator/React.framework/Headers/React_Core/RCTBridgeModule.h
5. tvos-arm64/React.framework/Headers/React_Core/RCTBridgeModule.h
6. tvos-arm64_x86_64-simulator/React.framework/Headers/React_Core/RCTBridgeModule.h

### Additional Notes:

- This fix is applied automatically every time `pod install` is run
- The patch makes the xcframework files writable before modifying them (they are read-only by default)
- Build tested successfully on:
  - Xcode: 16.4
  - React Native tvOS: 0.81.4-0
  - tvOS Simulator: Apple TV
- No code changes are required in the app itself
- This approach is preferred over patch-package because it works with prebuilt frameworks and doesn't require maintaining a separate patch file

## Related Resources

- [React Native tvOS Repository](https://github.com/react-native-tvos/react-native-tvos)
- [React Native tvOS Releases](https://github.com/react-native-tvos/react-native-tvos/releases)
- [Apple Documentation: dispatch_queue_t](https://developer.apple.com/documentation/dispatch/dispatch_queue_t)
- [Objective-C ARC and Dispatch Objects](https://clang.llvm.org/docs/AutomaticReferenceCounting.html#dispatch-objects)
