#!/bin/bash

# Sinkplane TV - Development Environment Setup Script
# This script sets up the complete development environment including:
# - Companion app repository
# - Cookies package with tvOS patches
# - Dependencies and pod installation

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_header() {
    echo -e "\n${BLUE}================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Get the parent directory (where all repos should be)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
PARENT_DIR="$(dirname "$PROJECT_DIR")"
PROJECT_NAME="$(basename "$PROJECT_DIR")"

print_header "Sinkplane TV Development Environment Setup"

echo "Project Directory: $PROJECT_DIR"
echo "Parent Directory: $PARENT_DIR"
echo ""

# Check prerequisites
print_header "Checking Prerequisites"

if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi
print_success "Node.js $(node --version) is installed"

if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi
print_success "npm $(npm --version) is installed"

if ! command -v git &> /dev/null; then
    print_error "git is not installed. Please install git first."
    exit 1
fi
print_success "git is installed"

if [[ "$OSTYPE" == "darwin"* ]]; then
    if ! command -v pod &> /dev/null; then
        print_warning "CocoaPods is not installed. iOS/tvOS builds will not work."
        echo "Install with: sudo gem install cocoapods"
    else
        print_success "CocoaPods $(pod --version) is installed"
    fi
fi

# Clone Companion App
print_header "Setting Up Companion App"

COMPANION_DIR="$PARENT_DIR/sinkplane-companion"
if [ -d "$COMPANION_DIR" ]; then
    print_info "Companion app already exists at $COMPANION_DIR"
    read -p "Do you want to update it? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cd "$COMPANION_DIR"
        print_info "Pulling latest changes..."
        git pull
        print_success "Companion app updated"
    fi
else
    print_info "Cloning companion app repository..."
    cd "$PARENT_DIR"
    # Adjust this URL to the actual companion app repository
    if git clone https://github.com/Sinkplane/sinkplane-companion.git 2>/dev/null; then
        print_success "Companion app cloned successfully"
    else
        print_warning "Could not clone companion app (repository may not be public yet)"
        print_info "Please manually clone the companion app to: $COMPANION_DIR"
    fi
fi

# Clone and Setup Cookies Package
print_header "Setting Up Cookies Package with tvOS Support"

COOKIES_DIR="$PARENT_DIR/cookies"
if [ -d "$COOKIES_DIR" ]; then
    print_info "Cookies package already exists at $COOKIES_DIR"
    read -p "Do you want to re-apply tvOS patches? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Skipping cookies setup"
    else
        cd "$COOKIES_DIR"
        git reset --hard HEAD
        print_info "Applying tvOS patches..."
        # Apply patches (will be done below)
    fi
else
    print_info "Cloning cookies repository..."
    cd "$PARENT_DIR"
    git clone git@github.com:Sinkplane/cookies.git
    cd "$COOKIES_DIR"
    print_success "Cookies repository cloned"
fi

# Apply tvOS patches to cookies
if [[ ! -f "$COOKIES_DIR/.tvos_patched" ]]; then
    print_info "Applying tvOS patches to cookies package..."
    
    cd "$COOKIES_DIR"
    
    # Patch 1: Update podspec for tvOS support
    print_info "Patching react-native-cookies.podspec..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' 's/s.platform.*= :ios, "7.0"/s.platform            = { :ios => "7.0", :tvos => "7.0" }/' react-native-cookies.podspec
        sed -i '' '/s.platform/a\
  s.ios.deployment_target = "7.0"\
  s.tvos.deployment_target = "7.0"
' react-native-cookies.podspec
    else
        sed -i 's/s.platform.*= :ios, "7.0"/s.platform            = { :ios => "7.0", :tvos => "7.0" }/' react-native-cookies.podspec
        sed -i '/s.platform/a\  s.ios.deployment_target = "7.0"\n  s.tvos.deployment_target = "7.0"' react-native-cookies.podspec
    fi
    
    # Patch 2: Update RNCookieManagerIOS.h
    print_info "Patching RNCookieManagerIOS.h..."
    cat > ios/RNCookieManagerIOS/RNCookieManagerIOS.h << 'EOF'
/**		
  * Copyright (c) Joseph P. Ferraro		
  *		
  * This source code is licensed under the MIT license found in the		
  * LICENSE file here: https://github.com/joeferraro/react-native-cookies/blob/master/LICENSE.md.		
  */

#import <React/RCTBridgeModule.h>

#if __has_include(<WebKit/WebKit.h>)
#import <WebKit/WebKit.h>
#endif

@interface RNCookieManagerIOS : NSObject <RCTBridgeModule>

@property (nonatomic, strong) NSDateFormatter *formatter;

@end
EOF
    
    # Patch 3: Update README
    print_info "Patching README.md..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' 's/- ✅ iOS/- ✅ iOS\
- ✅ tvOS/' README.md
        sed -i '' 's/- ✅ Android/- ✅ Android\
- ✅ AndroidTV/' README.md
    else
        sed -i 's/- ✅ iOS/- ✅ iOS\n- ✅ tvOS/' README.md
        sed -i 's/- ✅ Android/- ✅ Android\n- ✅ AndroidTV/' README.md
    fi
    
    # Patch 4: Update RNCookieManagerIOS.m (complex patch - using Python)
    print_info "Patching RNCookieManagerIOS.m..."
    
    python3 << 'PYTHON_SCRIPT'
import re

file_path = 'ios/RNCookieManagerIOS/RNCookieManagerIOS.m'

with open(file_path, 'r') as f:
    content = f.read()

# Fix 1: Wrap set method's useWebKit block
content = re.sub(
    r'(\s+if \(useWebKit\) \{\n)(\s+if \(@available\(iOS 11\.0, \*\)\))',
    r'\1#if __has_include(<WebKit/WebKit.h>)\n\2',
    content, count=1
)

content = re.sub(
    r'(reject\(@"", NOT_AVAILABLE_ERROR_MESSAGE, nil\);\n\s+\}\n)(\s+\} else \{[\s\S]*?setCookie:cookie\];)',
    r'\1#else\n        reject(@"", NOT_AVAILABLE_ERROR_MESSAGE, nil);\n        return;\n#endif\n\2',
    content, count=1
)

# Fix 2: Wrap get method's useWebKit block
pattern = r'(RCT_EXPORT_METHOD\(\s+get:\(NSURL \*\)url[\s\S]*?if \(useWebKit\) \{\n)(\s+if \(@available)'
replacement = r'\1#if __has_include(<WebKit/WebKit.h>)\n\2'
content = re.sub(pattern, replacement, content, count=1)

# Add endif for get method
pattern = r'(reject\(@"", NOT_AVAILABLE_ERROR_MESSAGE, nil\);\n\s+\}\n)(\s+\} else \{\n\s+NSMutableDictionary \*cookies = \[NSMutableDictionary dictionary\];[\s\S]*?for \(NSHTTPCookie)'
replacement = r'\1#else\n        reject(@"", NOT_AVAILABLE_ERROR_MESSAGE, nil);\n        return;\n#endif\n\2'
content = re.sub(pattern, replacement, content, count=1)

# Fix 3: Wrap clearAll method's useWebKit block
pattern = r'(RCT_EXPORT_METHOD\(\s+clearAll:\(BOOL\)useWebKit[\s\S]*?if \(useWebKit\) \{\n)(\s+if \(@available)'
replacement = r'\1#if __has_include(<WebKit/WebKit.h>)\n\2'
content = re.sub(pattern, replacement, content, count=1)

# Add endif for clearAll
pattern = r'(completionHandler:\^\(\) \{\n\s+resolve\(@\(YES\)\);\n\s+\}\];\n\s+\}\);\n\s+\} else \{\n\s+reject\(@"", NOT_AVAILABLE_ERROR_MESSAGE, nil\);\n\s+\}\n)(\s+\} else \{)'
replacement = r'\1#else\n        reject(@"", NOT_AVAILABLE_ERROR_MESSAGE, nil);\n        return;\n#endif\n\2'
content = re.sub(pattern, replacement, content, count=1)

# Fix 4: Wrap clearByName method
pattern = r'(rejecter:\(RCTPromiseRejectBlock\)reject\) \{\n\s+__block NSNumber \* foundCookies = @NO;\n\s+NSMutableArray<NSHTTPCookie \*> \* foundCookiesList = \[NSMutableArray new\];\n\s+if \(useWebKit\) \{\n)(\s+if \(@available)'
replacement = r'\1        NSMutableArray<NSHTTPCookie *> * foundCookiesList = [NSMutableArray new];\n#if __has_include(<WebKit/WebKit.h>)\n\2'
content = re.sub(pattern, replacement, content, count=1)

# Move foundCookiesList and add endif for clearByName
pattern = r'(__block NSNumber \* foundCookies = @NO;)\n(\s+NSMutableArray<NSHTTPCookie \*> \* foundCookiesList = \[NSMutableArray new\];)\n\s+if \(useWebKit\) \{'
replacement = r'\1\n\n    if (useWebKit) {\n        NSMutableArray<NSHTTPCookie *> * foundCookiesList = [NSMutableArray new];'
content = re.sub(pattern, replacement, content, count=1)

pattern = r'(\}\];\n\s+\}\);\n\s+\} else \{\n\s+reject\(@"", NOT_AVAILABLE_ERROR_MESSAGE, nil\);\n\s+\}\n)(\s+\} else \{\n\s+NSHTTPCookieStorage \*cookieStorage)'
replacement = r'\1#else\n        reject(@"", NOT_AVAILABLE_ERROR_MESSAGE, nil);\n        return;\n#endif\n\2'
content = re.sub(pattern, replacement, content, count=1)

# Fix 5: Wrap getAll method
pattern = r'(RCT_EXPORT_METHOD\(\s+getAll:\(BOOL\)useWebKit[\s\S]*?if \(useWebKit\) \{\n)(\s+if \(@available)'
replacement = r'\1#if __has_include(<WebKit/WebKit.h>)\n\2'
content = re.sub(pattern, replacement, content, count=1)

pattern = r'(\}\];\n\s+\}\);\n\s+\} else \{\n\s+reject\(@"", NOT_AVAILABLE_ERROR_MESSAGE, nil\);\n\s+\}\n)(\s+\} else \{\n\s+NSHTTPCookieStorage \*cookieStorage = \[NSHTTPCookieStorage sharedHTTPCookieStorage\];\n\s+resolve\(\[self createCookieList:cookieStorage\.cookies\]\);\n\s+\}\n\})'
replacement = r'\1#else\n        reject(@"", NOT_AVAILABLE_ERROR_MESSAGE, nil);\n#endif\n\2'
content = re.sub(pattern, replacement, content, count=1)

# Fix 6: Fix boolean return value
content = content.replace('return @YES;', 'return YES;')

with open(file_path, 'w') as f:
    f.write(content)

print("Successfully patched RNCookieManagerIOS.m")
PYTHON_SCRIPT
    
    # Mark as patched
    touch .tvos_patched
    
    print_success "tvOS patches applied successfully"
else
    print_info "Cookies package already patched for tvOS"
fi

# Install Sinkplane TV Dependencies
print_header "Installing Sinkplane TV Dependencies"

cd "$PROJECT_DIR"
print_info "Running npm install..."
npm install

if [[ "$OSTYPE" == "darwin"* ]]; then
    print_info "Installing iOS/tvOS pods..."
    cd ios
    pod install
    cd ..
    print_success "Pods installed successfully"
fi

print_success "Sinkplane TV dependencies installed"

# Install Companion App Dependencies (if it exists)
if [ -d "$COMPANION_DIR" ]; then
    print_header "Installing Companion App Dependencies"
    
    cd "$COMPANION_DIR"
    
    if [ -f "package.json" ]; then
        print_info "Running npm install..."
        npm install
        
        if [[ "$OSTYPE" == "darwin"* ]] && [ -d "ios" ]; then
            print_info "Installing iOS pods..."
            cd ios
            pod install
            cd ..
            print_success "Companion app pods installed"
        fi
        
        print_success "Companion app dependencies installed"
    else
        print_warning "No package.json found in companion app"
    fi
fi

# Summary
print_header "Setup Complete!"

echo -e "${GREEN}✅ Development environment is ready!${NC}\n"

echo "📁 Project Structure:"
echo "   $PARENT_DIR/"
echo "   ├── sinkplane-tv/      (TV app)"
echo "   ├── sinkplane-companion/ (Companion app)"
echo "   └── cookies/           (Cookies with tvOS patches)"
echo ""

echo "🚀 Next Steps:"
echo ""
echo "1. Start the TV app:"
echo "   cd $PROJECT_DIR"
echo "   EXPO_TV=1 npx expo start"
echo ""
echo "2. In another terminal, start the companion app:"
echo "   cd $COMPANION_DIR"
echo "   npx expo start"
echo ""
echo "3. Read the documentation:"
echo "   - Quick Start: docs/QUICK_START_TVOS.md"
echo "   - Cookies Workaround: docs/tvos-cookies-workaround.md"
echo "   - Known Issues: docs/react-native-core-tvos-issue.md"
echo ""

print_warning "Note: There is a known build issue with React Native Core on tvOS."
print_info "See docs/react-native-core-tvos-issue.md for details and solutions."
echo ""

print_success "Happy coding! 🎉"

