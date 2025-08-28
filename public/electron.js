const { app, BrowserWindow, dialog, ipcMain, protocol, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const isDev = require('electron-is-dev');
const ffmpeg = require('fluent-ffmpeg');
const ConfigManager = require('./config');

let mainWindow;
let configManager;
let currentFFmpegProcess = null;





function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 600,
    minHeight: 500,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      webSecurity: false
    },
    titleBarStyle: 'default',
    autoHideMenuBar: true,
    show: false
  });

  mainWindow.loadURL(
    isDev
      ? 'http://localhost:3000'
      : `file://${path.join(__dirname, '../build/index.html')}`
  );

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  // Register custom protocol for local file access
  protocol.registerFileProtocol('phedit-file', (request, callback) => {
    const url = request.url.substr('phedit-file://'.length);
    callback({ path: path.normalize(decodeURIComponent(url)) });
  });

  configManager = new ConfigManager();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC handlers for file operations
ipcMain.handle('open-file-dialog', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      {
        name: 'Video Files',
        extensions: ['mp4', 'avi', 'mov', 'mkv', 'webm', 'flv', 'm4v']
      }
    ]
  });

  return result;
});

ipcMain.handle('save-file-dialog', async (event, exportType = 'video') => {
  const filters = exportType === 'audio' 
    ? [
        {
          name: 'WAV Audio',
          extensions: ['wav']
        },
        {
          name: 'All Files',
          extensions: ['*']
        }
      ]
    : [
        {
          name: 'Video Files',
          extensions: ['mp4']
        },
        {
          name: 'All Files',
          extensions: ['*']
        }
      ];

  const defaultExtension = exportType === 'audio' ? '.wav' : '.mp4';
  const defaultName = exportType === 'audio' ? 'audio-clip' : 'video-clip';

  const result = await dialog.showSaveDialog(mainWindow, {
    title: `Save ${exportType === 'audio' ? 'Audio' : 'Video'} File`,
    filters: filters,
    defaultPath: defaultName + defaultExtension,
    properties: ['createDirectory']
  });

  console.log('Save dialog result:', result);
  return result;
});

// Convert file path to custom protocol URL
ipcMain.handle('get-video-url', async (event, filePath) => {
  return `phedit-file://${encodeURIComponent(filePath)}`;
});

// Open file location
ipcMain.handle('show-item-in-folder', async (event, filePath) => {
  shell.showItemInFolder(filePath);
});

// Cancel export
ipcMain.handle('cancel-export', async (event) => {
  try {
    if (currentFFmpegProcess) {
      console.log('Cancelling FFmpeg process...');
      currentFFmpegProcess.kill('SIGTERM');
      currentFFmpegProcess = null;
      
      // Send cancellation notification
      event.sender.send('processing-cancelled');
      
      return { success: true, message: 'Export cancelled successfully' };
    } else {
      return { success: false, message: 'No active export process to cancel' };
    }
  } catch (error) {
    console.error('Error cancelling export:', error);
    throw new Error(`Failed to cancel export: ${error.message}`);
  }
});

// Settings IPC handlers
ipcMain.handle('get-settings', async () => {
  return configManager.getSettings();
});

ipcMain.handle('set-settings', async (event, settings) => {
  configManager.setSettings(settings);
  return true;
});

ipcMain.handle('validate-ffmpeg-path', async (event, executablePath) => {
  return configManager.validateFFmpegPath(executablePath);
});

ipcMain.handle('auto-detect-ffmpeg', async () => {
  return configManager.autoDetectFFmpegPaths();
});

// Session state IPC handlers
ipcMain.handle('save-session-state', async (event, state) => {
  configManager.saveSessionState(state);
  return true;
});

ipcMain.handle('get-session-state', async () => {
  return configManager.getSessionState();
});

ipcMain.handle('clear-session-state', async () => {
  configManager.clearSessionState();
  return true;
});

ipcMain.handle('select-executable-path', async (event, title = 'Select FFmpeg Executable') => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: title,
    properties: ['openFile'],
    filters: [
      {
        name: 'Executable Files',
        extensions: process.platform === 'win32' ? ['exe'] : ['*']
      }
    ]
  });

  return result;
});

// FFmpeg processing
ipcMain.handle('process-video', async (event, options) => {
  const { inputPath, outputPath, startTime, duration, fadeIn, fadeOut, audioFadeIn, audioFadeOut, silenceAtStart = 0, blackScreenAtStart = 0, exportQuality = 'high', exportSize = 100, exportType = 'video' } = options;
  const ffmpegPaths = configManager.getFFmpegPaths();
  
  console.log('Processing video with options:', {
    inputPath,
    outputPath,
    startTime,
    duration,
    fadeIn,
    fadeOut,
    audioFadeIn,
    audioFadeOut,
    silenceAtStart,
    blackScreenAtStart,
    exportQuality,
    exportSize,
    exportType
  });
  
  // Validate paths
  if (!inputPath) {
    throw new Error('Input path is required');
  }
  if (!outputPath) {
    throw new Error('Output path is required');
  }
  
  return new Promise((resolve, reject) => {
    try {
      let command = ffmpeg(inputPath);
      
      // Set FFmpeg and FFprobe paths
      if (ffmpegPaths.ffmpegPath && ffmpegPaths.ffmpegPath !== 'ffmpeg') {
        command.setFfmpegPath(ffmpegPaths.ffmpegPath);
      }
      if (ffmpegPaths.ffprobePath && ffmpegPaths.ffprobePath !== 'ffprobe') {
        command.setFfprobePath(ffmpegPaths.ffprobePath);
      }
    
         // Set start time and duration if clipping
     if (startTime !== undefined && startTime > 0) {
       command = command.seekInput(startTime);
     }
     
     if (duration !== undefined && duration > 0) {
       command = command.duration(duration);
     }
     
     // Configure video quality and size settings
     if (exportType === 'video') {
       // Set video quality based on exportQuality setting
       switch (exportQuality) {
         case 'low':
           command = command.videoCodec('libx264').videoBitrate('800k');
           break;
         case 'medium':
           command = command.videoCodec('libx264').videoBitrate('2000k');
           break;
         case 'high':
         default:
           command = command.videoCodec('libx264').videoBitrate('4000k');
           break;
       }
     }
    
    // Configure based on export type
    if (exportType === 'audio') {
      // Audio-only export - always use WAV format (most compatible)
      command = command.noVideo();
      command = command.audioCodec('pcm_s16le'); // Standard WAV codec
      
      console.log('Using WAV audio codec (pcm_s16le)');
      
      // Add audio fade effects with silence at start
      const audioFilters = [];
      if (silenceAtStart > 0) {
        // Add silence at the beginning
        audioFilters.push(`adelay=${Math.round(silenceAtStart * 1000)}|${Math.round(silenceAtStart * 1000)}`);
      }
      if (audioFadeIn > 0) {
        // Apply fade-in after silence
        const fadeStartTime = silenceAtStart;
        audioFilters.push(`afade=t=in:st=${fadeStartTime}:d=${audioFadeIn}`);
      }
      if (audioFadeOut > 0) {
        audioFilters.push(`afade=t=out:st=${duration - audioFadeOut}:d=${audioFadeOut}`);
      }
      
      if (audioFilters.length > 0) {
        command = command.audioFilters(audioFilters);
      }
         } else {
       // Video + Audio export (default)
       const videoFilters = [];
       
       // Add black screen at start if specified
       if (blackScreenAtStart > 0) {
         // Add black padding at the start using tpad filter
         videoFilters.push(`tpad=start_duration=${blackScreenAtStart}:start_mode=add:color=black`);
         
         // Adjust fade-in timing to account for black screen
         if (fadeIn > 0) {
           videoFilters.push(`fade=t=in:st=${blackScreenAtStart}:d=${fadeIn}`);
         }
         if (fadeOut > 0) {
           videoFilters.push(`fade=t=out:st=${blackScreenAtStart + duration - fadeOut}:d=${fadeOut}`);
         }
       } else {
         // Add fade effects without black screen
         if (fadeIn > 0) {
           videoFilters.push(`fade=t=in:st=0:d=${fadeIn}`);
         }
         if (fadeOut > 0) {
           videoFilters.push(`fade=t=out:st=${duration - fadeOut}:d=${fadeOut}`);
         }
       }
       
       // Add video scaling if not 100%
       if (exportSize !== 100) {
         videoFilters.push(`scale=iw*${exportSize/100}:ih*${exportSize/100}`);
       }
       
       if (videoFilters.length > 0) {
         command = command.videoFilters(videoFilters);
       }
      
      // Also add audio fade effects for video export with silence at start
      const audioFilters = [];
      if (silenceAtStart > 0) {
        // Add silence at the beginning
        audioFilters.push(`adelay=${Math.round(silenceAtStart * 1000)}|${Math.round(silenceAtStart * 1000)}`);
      }
      if (audioFadeIn > 0) {
        // Apply fade-in after silence
        const fadeStartTime = silenceAtStart;
        audioFilters.push(`afade=t=in:st=${fadeStartTime}:d=${audioFadeIn}`);
      }
      if (audioFadeOut > 0) {
        audioFilters.push(`afade=t=out:st=${duration - audioFadeOut}:d=${audioFadeOut}`);
      }
      
      // Add audio delay for black screen if specified
      if (blackScreenAtStart > 0) {
        // Add delay to audio to match black screen duration
        audioFilters.push(`adelay=${Math.round(blackScreenAtStart * 1000)}|${Math.round(blackScreenAtStart * 1000)}`);
      }
      
      if (audioFilters.length > 0) {
        command = command.audioFilters(audioFilters);
      }
    }
    
    // Store the command reference for cancellation
    currentFFmpegProcess = command
        .output(outputPath)
        .on('start', (commandLine) => {
          console.log('Spawned Ffmpeg with command: ' + commandLine);
          event.sender.send('processing-started');
        })
        .on('progress', (progress) => {
          console.log('Processing progress:', progress);
          event.sender.send('processing-progress', progress);
        })
        .on('end', () => {
          console.log('Processing finished successfully');
          currentFFmpegProcess = null;
          resolve({ success: true, outputPath });
        })
        .on('error', (err) => {
          console.error('Error during processing:', err);
          currentFFmpegProcess = null;
          
          // Check if this was a cancellation
          if (err.message && (err.message.includes('SIGTERM') || err.message.includes('cancelled'))) {
            reject(new Error('Export was cancelled by user'));
          } else {
            reject(new Error(`FFmpeg processing failed: ${err.message}`));
          }
        })
        .run();
    } catch (error) {
      console.error('Error setting up FFmpeg command:', error);
      reject(new Error(`Failed to setup FFmpeg command: ${error.message}`));
    }
  });
});

// Get video metadata
ipcMain.handle('get-video-info', async (event, filePath) => {
  const ffmpegPaths = configManager.getFFmpegPaths();
  
  return new Promise((resolve, reject) => {
    // Set FFprobe path if configured
    if (ffmpegPaths.ffprobePath && ffmpegPaths.ffprobePath !== 'ffprobe') {
      ffmpeg.setFfprobePath(ffmpegPaths.ffprobePath);
    }
    
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        console.error('FFprobe error:', err);
        reject(err);
      } else {
        resolve(metadata);
      }
    });
  });
});
