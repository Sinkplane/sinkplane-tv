# Scripts Directory

This directory contains utility scripts for development and deployment.

## Available Scripts

### `setup-dev-env.sh`

**Purpose**: Automated setup of the complete development environment

**What it does**:

1. ✅ Checks prerequisites (Node.js, npm, git, CocoaPods)
2. ✅ Clones the companion app repository (if not exists)
3. ✅ Installs npm dependencies for sinkplane-tv
4. ✅ Applies the repo `patch-package` tvOS fix for the cookie manager
5. ✅ Installs npm dependencies for companion app
6. ✅ Runs pod install for both iOS projects

**Usage**:

```bash
cd /path/to/sinkplane-tv
./scripts/setup-dev-env.sh
```

**When to use**:

- First time setting up the project
- After a fresh clone of the repository
- When dependencies get corrupted and you need a clean slate
- When onboarding new developers

**What it creates**:

```
parent-directory/
├── sinkplane-tv/           (current project)
└── sinkplane-companion/    (companion mobile app)
```

**Re-running the script**:

- Safe to run multiple times
- Will prompt before re-cloning or re-patching existing repos
- Can be used to update repositories

**Troubleshooting**:

- If the script fails, check that you have all prerequisites installed
- Ensure you have internet access for cloning repositories
- On macOS, ensure Xcode Command Line Tools are installed

### `reset-project.js`

**Purpose**: Reset the project to a clean state (Expo default)

**Usage**:

```bash
npm run reset-project
```

**Note**: This is the default Expo script and probably not needed for this project.

## Creating New Scripts

When adding new scripts to this directory:

1. **Make them executable**:

   ```bash
   chmod +x scripts/your-script.sh
   ```

2. **Add a shebang** at the top:

   ```bash
   #!/bin/bash
   ```

3. **Document them** in this README

4. **Use colors** for output (see `setup-dev-env.sh` for examples)

5. **Handle errors gracefully**:

   ```bash
   set -e  # Exit on error
   ```

6. **Provide clear success/failure messages**

## Script Conventions

- Use descriptive names with hyphens: `setup-dev-env.sh`
- Include error checking and validation
- Use colored output for better UX:
  - 🔵 Blue for informational messages
  - ✅ Green for success messages
  - ⚠️ Yellow for warnings
  - ❌ Red for errors
- Provide a summary at the end
- Include "Next Steps" when appropriate
