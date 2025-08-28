const Store = require('electron-store');
const path = require('path');
const fs = require('fs');

class ConfigManager {
  constructor() {
    this.store = new Store({
      name: 'phedit-config',
      defaults: {
        ffmpegPath: '',
        ffprobePath: '',
        autoDetectPaths: true,
        lastUsedDirectory: '',
        sessionState: {
          videoFilePath: null,
          videoFileName: null,
          inPoint: 0,
          outPoint: 0,
          fadeIn: 0,
          fadeOut: 0,
          audioFadeIn: 0,
          audioFadeOut: 0,
          silenceAtStart: 0,
          exportType: 'video'
        }
      }
    });
  }

  // Get all settings
  getSettings() {
    return this.store.store;
  }

  // Get specific setting
  get(key) {
    return this.store.get(key);
  }

  // Set specific setting
  set(key, value) {
    this.store.set(key, value);
  }

  // Set multiple settings
  setSettings(settings) {
    Object.keys(settings).forEach(key => {
      this.store.set(key, settings[key]);
    });
  }

  // Reset to defaults
  reset() {
    this.store.clear();
  }

  // Validate FFmpeg executable path
  validateFFmpegPath(executablePath) {
    if (!executablePath) return false;
    
    try {
      return fs.existsSync(executablePath) && fs.statSync(executablePath).isFile();
    } catch (error) {
      return false;
    }
  }

  // Auto-detect FFmpeg paths
  autoDetectFFmpegPaths() {
    const commonPaths = {
      win32: [
        'C:\\ffmpeg\\bin\\ffmpeg.exe',
        'C:\\Program Files\\ffmpeg\\bin\\ffmpeg.exe',
        'C:\\Program Files (x86)\\ffmpeg\\bin\\ffmpeg.exe',
        path.join(process.env.USERPROFILE || '', 'ffmpeg', 'bin', 'ffmpeg.exe')
      ],
      darwin: [
        '/usr/local/bin/ffmpeg',
        '/opt/homebrew/bin/ffmpeg',
        '/usr/bin/ffmpeg'
      ],
      linux: [
        '/usr/bin/ffmpeg',
        '/usr/local/bin/ffmpeg',
        '/snap/bin/ffmpeg'
      ]
    };

    const probePaths = {
      win32: [
        'C:\\ffmpeg\\bin\\ffprobe.exe',
        'C:\\Program Files\\ffmpeg\\bin\\ffprobe.exe',
        'C:\\Program Files (x86)\\ffmpeg\\bin\\ffprobe.exe',
        path.join(process.env.USERPROFILE || '', 'ffmpeg', 'bin', 'ffprobe.exe')
      ],
      darwin: [
        '/usr/local/bin/ffprobe',
        '/opt/homebrew/bin/ffprobe',
        '/usr/bin/ffprobe'
      ],
      linux: [
        '/usr/bin/ffprobe',
        '/usr/local/bin/ffprobe',
        '/snap/bin/ffprobe'
      ]
    };

    const platform = process.platform;
    const ffmpegPaths = commonPaths[platform] || [];
    const ffprobePaths = probePaths[platform] || [];

    let detectedFFmpeg = '';
    let detectedFFprobe = '';

    // Try to find ffmpeg
    for (const execPath of ffmpegPaths) {
      if (this.validateFFmpegPath(execPath)) {
        detectedFFmpeg = execPath;
        break;
      }
    }

    // Try to find ffprobe
    for (const execPath of ffprobePaths) {
      if (this.validateFFmpegPath(execPath)) {
        detectedFFprobe = execPath;
        break;
      }
    }

    // If not found in common paths, try PATH environment
    if (!detectedFFmpeg || !detectedFFprobe) {
      const { spawn } = require('child_process');
      
      // Try ffmpeg in PATH
      if (!detectedFFmpeg) {
        try {
          const ffmpegCmd = platform === 'win32' ? 'where ffmpeg' : 'which ffmpeg';
          const result = spawn(ffmpegCmd.split(' ')[0], ffmpegCmd.split(' ').slice(1), { 
            stdio: 'pipe',
            shell: true 
          });
          
          result.stdout.on('data', (data) => {
            const pathResult = data.toString().trim().split('\n')[0];
            if (pathResult && this.validateFFmpegPath(pathResult)) {
              detectedFFmpeg = pathResult;
            }
          });
        } catch (error) {
          console.log('Could not detect ffmpeg in PATH');
        }
      }

      // Try ffprobe in PATH
      if (!detectedFFprobe) {
        try {
          const ffprobeCmd = platform === 'win32' ? 'where ffprobe' : 'which ffprobe';
          const result = spawn(ffprobeCmd.split(' ')[0], ffprobeCmd.split(' ').slice(1), { 
            stdio: 'pipe',
            shell: true 
          });
          
          result.stdout.on('data', (data) => {
            const pathResult = data.toString().trim().split('\n')[0];
            if (pathResult && this.validateFFmpegPath(pathResult)) {
              detectedFFprobe = pathResult;
            }
          });
        } catch (error) {
          console.log('Could not detect ffprobe in PATH');
        }
      }
    }

    return {
      ffmpegPath: detectedFFmpeg,
      ffprobePath: detectedFFprobe
    };
  }

  // Save session state
  saveSessionState(state) {
    this.store.set('sessionState', state);
  }

  // Get session state
  getSessionState() {
    return this.store.get('sessionState');
  }

  // Clear session state
  clearSessionState() {
    this.store.set('sessionState', {
      videoFilePath: null,
      videoFileName: null,
      inPoint: 0,
      outPoint: 0,
      fadeIn: 0,
      fadeOut: 0,
      audioFadeIn: 0,
      audioFadeOut: 0,
      silenceAtStart: 0,
      exportType: 'video'
    });
  }

  // Get effective FFmpeg paths (configured or auto-detected)
  getFFmpegPaths() {
    const settings = this.getSettings();
    
    if (settings.autoDetectPaths || !settings.ffmpegPath || !settings.ffprobePath) {
      const detected = this.autoDetectFFmpegPaths();
      return {
        ffmpegPath: settings.ffmpegPath || detected.ffmpegPath || 'ffmpeg',
        ffprobePath: settings.ffprobePath || detected.ffprobePath || 'ffprobe'
      };
    }

    return {
      ffmpegPath: settings.ffmpegPath,
      ffprobePath: settings.ffprobePath
    };
  }
}

module.exports = ConfigManager;
