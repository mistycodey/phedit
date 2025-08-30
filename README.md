# PHEdit - Minimal FFmpeg Video Editor

A minimal video editor built with Electron and React, powered by FFmpeg for video processing.
This is a hobby project that just uses AI in the Cursor IDE to create the code. Half challenge, half helpful :)

## Features

### Startup & Mode Selection
- **FFmpeg Detection**: Automatic detection of FFmpeg installation on startup
- **Mode Selection**: Choose between Editor and Tasks modes
- **Settings Integration**: Easy access to FFmpeg configuration from startup screen

### Editor Mode
- **Single Video Editing**: Load and edit individual video files
- **Advanced Editing**: Set in/out points, fade effects, and transitions
- **Video Scrubbing**: Click anywhere on the timeline to jump to that position
- **Video Trimming**: Set in and out points to define the section you want to export
- **Fade Effects**: Add fade-in and fade-out effects to your video
- **Video Export**: Process and export your edited video using FFmpeg
- **Progress Tracking**: Real-time progress updates during video processing

### Tasks Mode
- **Quick Fade**: Add professional fade effects (6s fade in, 3s fade out) with one click
- **Audio Rip**: Extract audio from video files in multiple formats (MP3, WAV, AAC)
- **Batch Processing Ready**: Simple interface for quick operations

### System Features
- **Settings System**: Configure FFmpeg executable paths with auto-detection and validation
- **Persistent Configuration**: Settings are automatically saved and restored between sessions
- **Comprehensive Help System**: Built-in help guide with step-by-step instructions and FFmpeg installation guidance

## Prerequisites

Before running this application, you need to have FFmpeg installed on your system:

### Windows
1. Download FFmpeg from https://ffmpeg.org/download.html
2. Extract the files to a folder (e.g., `C:\ffmpeg`)
3. Add the `bin` folder to your system PATH environment variable, or choose the paths to ffmpeg and ffprobe in the Settings area once the app has started.

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

1. **Startup Screen**: 
   - The app will automatically check for FFmpeg installation
   - If FFmpeg is not found, you'll see options to download it or configure paths
   - Click "Download FFmpeg" to visit the official download page
   - Click "Configure FFmpeg Paths" to open Settings

2. **Configure FFmpeg Paths** (if needed):
   - Use the Settings panel to configure FFmpeg executable paths
   - The application will try to auto-detect FFmpeg executables
   - If auto-detection fails, manually set the paths to `ffmpeg` and `ffprobe` executables
   - Click "Save Settings" to store your configuration

3. **Choose Your Mode**:
   - **Editor**: Full-featured video editor with timeline and advanced controls
   - **Tasks**: Quick processing for common operations like fades and audio extraction

### Editor Mode Workflow

1. **Load Video**: Click "Load Video" to select a video file from your computer
2. **Single Video Editing**: 
   - The video is loaded into the editor
   - Use the timeline to navigate through the video
   - Set in/out points to define your clip
3. **Playback**: Use the Play/Pause button to control video playback
4. **Scrub Timeline**: Click anywhere on the timeline to jump to that position
5. **Set Clip Points**: 
   - Click "Set In Point" to mark the start of your clip
   - Click "Set Out Point" to mark the end of your clip
   - The red region on the timeline shows your selected section
6. **Add Fade Effects**:
   - Set fade-in duration (in seconds) to fade from black at the start
   - Set fade-out duration (in seconds) to fade to black at the end
7. **Export**: Click "Export" to process and save your edited video

### Tasks Mode Workflow

1. **Quick Fade**:
   - Click "Start Quick Fade" to select a video file
   - Choose output location and filename
   - The app automatically applies 6-second fade in and 3-second fade out
   - Processing starts immediately

2. **Audio Rip**:
   - Click "Start Audio Rip" to select a video file
   - Choose output format (MP3, WAV, AAC) and location
   - Audio is extracted with original quality preserved

### Keyboard Shortcuts

- **Spacebar**: Play/Pause video
- **Left Arrow**: Jump back 10 seconds
- **Right Arrow**: Jump forward 10 seconds
- **I**: Set In Point
- **O**: Set Out Point

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
- Multiple video tracks and multi-clip editing (future enhancement)
- Audio editing capabilities
- More transition effects
- Video filters and color correction
- Batch processing
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
