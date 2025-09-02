# PHEdit GitHub Workflows

This directory contains GitHub Actions workflows for automating the build and release process of PHEdit.

## Available Workflows

### 1. `build.yml` - Full Build and Release Pipeline
- **Triggers**: Push to main branch, Pull requests to main
- **Features**:
  - Builds for Windows, macOS, and Linux
  - Creates GitHub releases automatically
  - Uploads build artifacts to releases
  - Includes version tagging

## Setup Instructions

### 1. Choose Your Workflow
- For automatic releases: Use `build.yml` (rename `build-simple.yml` to something else)
- For simple builds: Use `build-simple.yml` (delete or rename `build.yml`)

### 2. Update package.json
Make sure to update the `publish` section in `package.json`:
```json
"publish": {
  "provider": "github",
  "owner": "YOUR-GITHUB-USERNAME",
  "repo": "phedit"
}
```

### 3. Add App Icons (Optional)
For better-looking builds, add icons to your `build/` directory:
- `build/icon.ico` (Windows)
- `build/icon.icns` (macOS) 
- `build/icon.png` (Linux)

### 4. Repository Settings
Ensure your GitHub repository has:
- Actions enabled
- Write permissions for GITHUB_TOKEN (usually default)

## How It Works

1. **On Push to Main**: 
   - Workflow triggers automatically
   - Installs Node.js and dependencies
   - Builds React app (`npm run build`)
   - Packages Electron app (`npm run electron-pack`)
   - Uploads artifacts or creates releases

2. **Build Artifacts**:
   - Windows: `.exe` installer
   - macOS: `.dmg` disk image
   - Linux: `.AppImage` executable

3. **Releases** (full workflow only):
   - Creates tagged releases
   - Uploads platform-specific installers
   - Includes build information and changelog

## Troubleshooting

### Common Issues:
1. **macOS "damaged" error**: The app appears damaged when users try to open it
   - **Cause**: macOS requires apps to be code signed and notarized
   - **Solution**: Set up proper code signing (see macOS Code Signing section below)
   - **Quick workaround**: Users can bypass by right-clicking → "Open" or running: `xattr -cr /path/to/PHEdit.app`
2. **Build fails on macOS**: Code signing issues - the workflow disables auto-discovery by default
3. **Missing artifacts**: Check file paths in workflow match your actual build output
4. **Permission errors**: Ensure GITHUB_TOKEN has sufficient permissions

### Testing:
- Use the simple workflow first to test your build process
- Check the Actions tab in your GitHub repository for build logs
- Download artifacts from completed workflow runs to test

## macOS Code Signing Setup

To fix the "damaged" error on macOS, you need to set up proper code signing and notarization:

### Prerequisites
1. **Apple Developer Account** ($99/year)
2. **Developer ID Application Certificate** from Apple Developer Portal

### Step 1: Create Certificates
1. Go to [Apple Developer Portal](https://developer.apple.com/account/resources/certificates/list)
2. Create a "Developer ID Application" certificate
3. Download the certificate and install it in Keychain Access
4. Export as .p12 file with a password

### Step 2: Set Up GitHub Secrets
Add these secrets to your GitHub repository (Settings → Secrets and variables → Actions):

- `CSC_LINK`: Base64-encoded .p12 certificate file
  ```bash
  base64 -i YourCertificate.p12 | pbcopy
  ```
- `CSC_KEY_PASSWORD`: Password for the .p12 file
- `APPLE_ID`: Your Apple ID email
- `APPLE_APP_SPECIFIC_PASSWORD`: Generate at [appleid.apple.com](https://appleid.apple.com)
- `APPLE_TEAM_ID`: Found in Apple Developer Portal → Membership

### Step 3: Enable Code Signing
In `.github/workflows/build.yml`, uncomment the code signing environment variables:
```yaml
CSC_LINK: ${{ secrets.CSC_LINK }}
CSC_KEY_PASSWORD: ${{ secrets.CSC_KEY_PASSWORD }}
APPLE_ID: ${{ secrets.APPLE_ID }}
APPLE_APP_SPECIFIC_PASSWORD: ${{ secrets.APPLE_APP_SPECIFIC_PASSWORD }}
APPLE_TEAM_ID: ${{ secrets.APPLE_TEAM_ID }}
```
And remove: `CSC_IDENTITY_AUTO_DISCOVERY: false`

### Alternative: User Workaround (No Code Signing)
If you can't set up code signing, users can bypass the security warning:

**Method 1: Right-click method**
1. Right-click on PHEdit.app
2. Select "Open"
3. Click "Open" in the security dialog

**Method 2: Command line**
```bash
# Remove quarantine attribute
xattr -cr /Applications/PHEdit.app

# Or for downloaded .dmg
xattr -cr ~/Downloads/PHEdit-*.dmg
```

**Method 3: System Preferences**
1. System Preferences → Security & Privacy → General
2. Click "Open Anyway" after the first launch attempt

## Customization

You can modify the workflows to:
- Change trigger conditions
- Add additional build steps
- Modify artifact retention
- Add notifications (Slack, email, etc.)
- Include automated testing before builds
