# EAS CLI Setup - Troubleshooting npm Permissions

## Issue

You're encountering npm permission errors when trying to install EAS CLI globally:
```
npm error code EACCES
npm error path /usr/local/lib/node_modules/eas-cli
npm error errno -13
```

## Solutions

### Option 1: Use npx (Recommended - No Installation Needed)

You can run EAS CLI commands using `npx` without installing it globally:

```bash
cd mobile

# Login to Expo
npx eas-cli@latest login

# Initialize EAS
npx eas-cli@latest init

# Build for iOS
npx eas-cli@latest build --platform ios --profile preview
```

### Option 2: Use npm Scripts (Already Added)

I've added EAS scripts to `package.json`. You can use:

```bash
cd mobile

# Login
npm run eas:login

# Initialize
npm run eas:init

# Build for iOS (preview)
npm run eas:build:ios:preview

# Build for iOS (production)
npm run eas:build:ios:prod

# Submit to App Store
npm run eas:submit
```

### Option 3: Fix npm Permissions (If You Want Global Install)

If you want to install EAS CLI globally, fix npm permissions:

**Using Homebrew (Recommended):**
```bash
# Install Homebrew if not installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node via Homebrew (this fixes permissions)
brew install node

# Now install EAS CLI
npm install -g eas-cli
```

**Or fix npm directory permissions:**
```bash
# Create a directory for global packages
mkdir ~/.npm-global

# Configure npm to use the new directory
npm config set prefix '~/.npm-global'

# Add to your ~/.zshrc or ~/.bash_profile
export PATH=~/.npm-global/bin:$PATH

# Reload shell
source ~/.zshrc  # or source ~/.bash_profile

# Now install EAS CLI
npm install -g eas-cli
```

### Option 4: Use Node Version Manager (nvm)

Install nvm to manage Node versions and avoid permission issues:

```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Reload shell
source ~/.zshrc

# Install Node
nvm install --lts
nvm use --lts

# Install EAS CLI
npm install -g eas-cli
```

## Recommended Approach

**Use Option 1 (npx) or Option 2 (npm scripts)** - they don't require fixing system permissions and work immediately.

## Next Steps

Once you can run EAS commands:

1. **Login to Expo:**
   ```bash
   cd mobile
   npm run eas:login
   # or: npx eas-cli@latest login
   ```

2. **Initialize EAS:**
   ```bash
   npm run eas:init
   # or: npx eas-cli@latest init
   ```

3. **Build for iOS:**
   ```bash
   npm run eas:build:ios:preview
   # or: npx eas-cli@latest build --platform ios --profile preview
   ```

## Notes

- The `eas.json` file is already created and configured
- The `app.json` is already set up for iOS builds
- You just need to be able to run EAS commands to proceed


