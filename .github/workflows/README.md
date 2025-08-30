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

### 2. `build-simple.yml` - Simple Build Pipeline  
- **Triggers**: Push to main branch only
- **Features**:
  - Builds for Windows, macOS, and Linux
  - Uploads artifacts (no releases)
  - Simpler setup, good for testing

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
1. **Build fails on macOS**: Code signing issues - the workflow disables auto-discovery
2. **Missing artifacts**: Check file paths in workflow match your actual build output
3. **Permission errors**: Ensure GITHUB_TOKEN has sufficient permissions

### Testing:
- Use the simple workflow first to test your build process
- Check the Actions tab in your GitHub repository for build logs
- Download artifacts from completed workflow runs to test

## Customization

You can modify the workflows to:
- Change trigger conditions
- Add additional build steps
- Modify artifact retention
- Add notifications (Slack, email, etc.)
- Include automated testing before builds
