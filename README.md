# PHEdit - Minimal FFmpeg Video Editor

A minimal video editor built with Electron and React, powered by FFmpeg for video processing.

## Features

- **Load Video**: Support for multiple video formats (MP4, AVI, MOV, MKV, WebM, FLV, M4V)
- **Video Scrubbing**: Click anywhere on the timeline to jump to that position
- **Clip Selection**: Set in and out points to define the clip you want to export
- **Fade Effects**: Add fade-in and fade-out effects to your video
- **Video Export**: Process and export your edited video using FFmpeg
- **Progress Tracking**: Real-time progress updates during video processing
- **Settings System**: Configure FFmpeg executable paths with auto-detection and validation
- **Persistent Configuration**: Settings are automatically saved and restored between sessions

## Prerequisites

Before running this application, you need to have FFmpeg installed on your system:

### Windows
1. Download FFmpeg from https://ffmpeg.org/download.html
2. Extract the files to a folder (e.g., `C:\ffmpeg`)
3. Add the `bin` folder to your system PATH environment variable

### macOS
```bash
# Using Homebrew
brew install ffmpeg
```

### Linux
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install ffmpeg

# CentOS/RHEL/Fedora
sudo yum install ffmpeg
# or
sudo dnf install ffmpeg
```

## Installation

1. Clone this repository:
```bash
git clone <repository-url>
cd phedit
```

2. Install dependencies:
```bash
npm install
```

## Development

To run the application in development mode:

```bash
npm run electron-dev
```

This will:
- Start the React development server on http://localhost:3000
- Launch the Electron application
- Enable hot reloading for React components
- Open developer tools automatically

## Building

To build the application for production:

```bash
npm run build
npm run electron-pack
```

The built application will be available in the `dist` folder.

## Usage

### First Time Setup

1. **Configure FFmpeg Paths** (if needed):
   - Click the "Settings" button in the header
   - The application will try to auto-detect FFmpeg executables
   - If auto-detection fails, manually set the paths to `ffmpeg` and `ffprobe` executables
   - Click "Save Settings" to store your configuration

### Video Editing Workflow

1. **Load a Video**: Click the "Load Video" button in the header to select a video file
2. **Playback**: Use the Play/Pause button to control video playback
3. **Scrub Timeline**: Click anywhere on the timeline to jump to that position
4. **Set Clip Points**: 
   - Click "Set In Point" to mark the start of your clip
   - Click "Set Out Point" to mark the end of your clip
   - The red region on the timeline shows your selected clip
5. **Add Fade Effects**:
   - Set fade-in duration (in seconds) to fade from black at the start
   - Set fade-out duration (in seconds) to fade to black at the end
6. **Export**: Click "Export Video" to process and save your edited video

### Settings

The Settings panel allows you to:
- **Auto-detect FFmpeg paths**: Automatically find FFmpeg executables in common locations
- **Manual path configuration**: Specify exact paths to FFmpeg and FFprobe executables
- **Path validation**: Real-time validation of executable paths
- **Reset to defaults**: Restore all settings to their default values

Settings are automatically saved to a configuration file and persist between application sessions.

## Technical Details

- **Frontend**: React with custom CSS for a dark, professional video editor UI
- **Backend**: Electron main process handles file operations and FFmpeg processing
- **Video Processing**: Uses fluent-ffmpeg library to interface with FFmpeg
- **Configuration**: Uses electron-store for persistent settings management
- **File Formats**: Supports common video formats for input, exports to MP4
- **Cross-Platform**: Auto-detection works on Windows, macOS, and Linux

## Project Structure

```
phedit/
├── public/
│   ├── electron.js          # Electron main process
│   ├── config.js            # Configuration management
│   └── index.html          # HTML template
├── src/
│   ├── components/
│   │   ├── VideoPlayer.js  # Video playback component
│   │   ├── Timeline.js     # Timeline scrubbing component
│   │   ├── Controls.js     # Control panel component
│   │   └── Settings.js     # Settings modal component
│   ├── App.js              # Main React application
│   ├── App.css             # App-specific styles
│   ├── index.js            # React entry point
│   └── index.css           # Global styles and modal styles
└── package.json            # Dependencies and scripts
```

## Future Enhancements

This is a minimal implementation. Potential future features could include:
- Multiple video tracks
- Audio editing capabilities
- More transition effects
- Video filters and color correction
- Batch processing
- Keyboard shortcuts
- Undo/Redo functionality
- Project saving/loading

## Troubleshooting

**FFmpeg not found**: 
- Use the Settings panel to configure FFmpeg paths
- Try the "Auto-Detect Paths" feature
- Ensure FFmpeg is installed and executables are accessible

**Video won't load**: 
- Ensure your video file is in a supported format and not corrupted
- Check that FFprobe is properly configured in Settings

**Export fails**: 
- Verify FFmpeg path is correctly set in Settings
- Check that you have write permissions to the output directory
- Ensure sufficient disk space is available

**Settings won't save**: 
- Check that the application has write permissions to its config directory
- Try running the application as administrator (Windows) if needed

**Performance issues**: For large video files, consider using proxy media or lower resolution previews.
