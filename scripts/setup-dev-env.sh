#!/bin/bash

# Sinkplane TV - Development Environment Setup Script
# This script sets up the complete development environment including:
# - Companion app repository
# - Sinkplane TV dependencies
# - iOS/tvOS pod installation

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() {
    echo -e "\n${BLUE}================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}[ok]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[warn]${NC} $1"
}

print_error() {
    echo -e "${RED}[error]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[info]${NC} $1"
}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
PARENT_DIR="$(dirname "$PROJECT_DIR")"

print_header "Sinkplane TV Development Environment Setup"
echo "Project Directory: $PROJECT_DIR"
echo "Parent Directory: $PARENT_DIR"
echo ""

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
    if git clone https://github.com/Sinkplane/sinkplane-companion.git 2>/dev/null; then
        print_success "Companion app cloned successfully"
    else
        print_warning "Could not clone companion app automatically."
        print_info "Please manually clone the companion app to: $COMPANION_DIR"
    fi
fi

print_header "Installing Sinkplane TV Dependencies"

cd "$PROJECT_DIR"
print_info "Running npm install (patch-package will apply the tvOS cookie-manager patch)..."
npm install

if [[ "$OSTYPE" == "darwin"* ]]; then
    print_info "Installing iOS/tvOS pods..."
    cd ios
    pod install
    cd ..
    print_success "Pods installed successfully"
fi

print_success "Sinkplane TV dependencies installed"

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

print_header "Setup Complete"

echo -e "${GREEN}[ok]${NC} Development environment is ready!\n"
echo "Project Structure:"
echo "  $PARENT_DIR/"
echo "  |- sinkplane-tv/"
echo "  |- sinkplane-companion/"
echo ""
echo "Next Steps:"
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
echo "   - Known Issues: docs/react-native-core-tvos-issue.md"
echo ""

print_warning "There is still a known React Native Core issue on tvOS."
print_info "See docs/react-native-core-tvos-issue.md for details and solutions."

