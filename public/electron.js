const { app, BrowserWindow, dialog, ipcMain, protocol, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const isDev = require('electron-is-dev');
const ffmpeg = require('fluent-ffmpeg');
const ConfigManager = require('./config');
const packageJson = require('../package.json');

let mainWindow;
let configManager;
let currentFFmpegProcess = null;





function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800, /* Increased minimum width for better layout */
    minHeight: 600, /* Increased minimum height to ensure all UI elements are visible */
    title: `PHEdit v${packageJson.version}`,
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
    // Set title after content loads to ensure it overrides HTML title
    mainWindow.setTitle(`PHEdit v${packageJson.version}`);
  });

  // Also set title when page finishes loading
  mainWindow.webContents.once('did-finish-load', () => {
    mainWindow.setTitle(`PHEdit v${packageJson.version}`);
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
ipcMain.handle('open-file-dialog', async (event, options = {}) => {
  const defaultOptions = {
    properties: ['openFile'],
    filters: [
      {
        name: 'Video Files',
        extensions: ['mp4', 'avi', 'mov', 'mkv', 'webm', 'flv', 'm4v']
      }
    ]
  };

  const result = await dialog.showOpenDialog(mainWindow, {
    ...defaultOptions,
    ...options
  });

  return result;
});

ipcMain.handle('save-file-dialog', async (event, exportType = 'video', options = {}) => {
  const defaultFilters = exportType === 'audio' 
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

  const defaultOptions = {
    title: `Save ${exportType === 'audio' ? 'Audio' : 'Video'} File`,
    filters: defaultFilters,
    defaultPath: defaultName + defaultExtension,
    properties: ['createDirectory']
  };

  const result = await dialog.showSaveDialog(mainWindow, {
    ...defaultOptions,
    ...options
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
  console.log('Raw options received:', options);
  const { inputPath, outputPath, startTime, duration, inPoint, outPoint, fadeIn, fadeOut, audioFadeIn, audioFadeOut, silenceAtStart = 0, blackScreenAtStart = 0, exportQuality = 'high', exportSize = 100, exportType = 'video' } = options;
  
  // Convert inPoint/outPoint to startTime/duration if provided
  let actualStartTime = startTime;
  let actualDuration = duration;
  
  console.log('Destructured values:', { inPoint, outPoint, startTime, duration });
  
  // Try to get inPoint and outPoint from options directly if destructuring failed
  const directInPoint = options.inPoint;
  const directOutPoint = options.outPoint;
  console.log('Direct access values:', { directInPoint, directOutPoint });
  
  if ((inPoint !== undefined && outPoint !== undefined) || (directInPoint !== undefined && directOutPoint !== undefined)) {
    const finalInPoint = inPoint !== undefined ? inPoint : directInPoint;
    const finalOutPoint = outPoint !== undefined ? outPoint : directOutPoint;
    
    actualStartTime = finalInPoint;
    actualDuration = finalOutPoint - finalInPoint;
    console.log('Converted inPoint/outPoint to startTime/duration:', { finalInPoint, finalOutPoint, actualStartTime, actualDuration });
  } else {
    console.log('inPoint or outPoint is undefined, using original startTime/duration');
  }
  const ffmpegPaths = configManager.getFFmpegPaths();
  
  console.log('Processing video with options:', {
    inputPath,
    outputPath,
    startTime,
    duration,
    inPoint,
    outPoint,
    actualStartTime,
    actualDuration,
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
  
  console.log('All options keys:', Object.keys(options));
  console.log('inPoint type and value:', typeof inPoint, inPoint);
  console.log('outPoint type and value:', typeof outPoint, outPoint);
  console.log('Direct access to inPoint:', options.inPoint);
  console.log('Direct access to outPoint:', options.outPoint);
  
  // Validate paths
  if (!inputPath) {
    throw new Error('Input path is required');
  }
  if (!outputPath) {
    throw new Error('Output path is required');
  }
  
  return new Promise(async (resolve, reject) => {
    try {
      let command = ffmpeg(inputPath);
      
      // Set FFmpeg and FFprobe paths
      if (ffmpegPaths.ffmpegPath && ffmpegPaths.ffmpegPath !== 'ffmpeg') {
        command.setFfmpegPath(ffmpegPaths.ffmpegPath);
      }
      if (ffmpegPaths.ffprobePath && ffmpegPaths.ffprobePath !== 'ffprobe') {
        command.setFfprobePath(ffmpegPaths.ffprobePath);
      }
    
      // Get video duration for fade calculations
      let videoDuration = actualDuration;
      if ((fadeOut > 0 || audioFadeOut > 0) && (actualDuration === undefined || actualDuration <= 0)) {
        try {
          const metadata = await new Promise((resolve, reject) => {
            ffmpeg.ffprobe(inputPath, (err, metadata) => {
              if (err) reject(err);
              else resolve(metadata);
            });
          });
          videoDuration = metadata.format.duration;
          console.log('Retrieved full video duration for fade calculations:', videoDuration);
        } catch (error) {
          console.warn('Could not get video duration, fade out effects may not work correctly:', error.message);
          // If we can't get duration, disable fade out effects
          fadeOut = 0;
          audioFadeOut = 0;
        }
      }
      
      // Ensure videoDuration is set for fade calculations
      if (videoDuration === undefined || videoDuration <= 0) {
        console.warn('No valid duration available for fade calculations, disabling fade out effects');
        fadeOut = 0;
        audioFadeOut = 0;
      } else {
        console.log('Using duration for fade calculations:', videoDuration);
      }
    
      // Set start time and duration if clipping
      if (actualStartTime !== undefined && actualStartTime > 0) {
        command = command.seekInput(actualStartTime);
      }
      
      if (actualDuration !== undefined && actualDuration > 0) {
        command = command.duration(actualDuration);
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
      if (audioFadeOut > 0 && videoDuration) {
        const fadeOutStart = videoDuration - audioFadeOut;
        console.log('Audio fade out calculation (audio export):', { videoDuration, audioFadeOut, fadeOutStart });
        audioFilters.push(`afade=t=out:st=${fadeOutStart}:d=${audioFadeOut}`);
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
                 if (fadeOut > 0 && videoDuration) {
          const fadeOutStart = blackScreenAtStart + videoDuration - fadeOut;
          console.log('Video fade out calculation (with black screen):', { blackScreenAtStart, videoDuration, fadeOut, fadeOutStart });
          videoFilters.push(`fade=t=out:st=${fadeOutStart}:d=${fadeOut}`);
        }
       } else {
         // Add fade effects without black screen
         if (fadeIn > 0) {
           videoFilters.push(`fade=t=in:st=0:d=${fadeIn}`);
         }
                 if (fadeOut > 0 && videoDuration) {
          const fadeOutStart = videoDuration - fadeOut;
          console.log('Video fade out calculation (no black screen):', { videoDuration, fadeOut, fadeOutStart });
          videoFilters.push(`fade=t=out:st=${fadeOutStart}:d=${fadeOut}`);
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
      if (audioFadeOut > 0 && videoDuration) {
        const fadeOutStart = videoDuration - audioFadeOut;
        console.log('Audio fade out calculation (video export):', { videoDuration, audioFadeOut, fadeOutStart });
        audioFilters.push(`afade=t=out:st=${fadeOutStart}:d=${audioFadeOut}`);
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

// Check FFmpeg status
ipcMain.handle('check-ffmpeg-status', async () => {
  try {
    const ffmpegPaths = configManager.getFFmpegPaths();
    
    // Check if FFmpeg is available
    const ffmpegValid = await configManager.validateFFmpegPath(ffmpegPaths.ffmpegPath || 'ffmpeg');
    const ffprobeValid = await configManager.validateFFmpegPath(ffmpegPaths.ffprobePath || 'ffprobe');
    
    if (ffmpegValid && ffprobeValid) {
      return 'installed';
    } else {
      return 'not-installed';
    }
  } catch (error) {
    console.error('Error checking FFmpeg status:', error);
    return 'not-installed';
  }
});

// Open external link
ipcMain.handle('open-external-link', async (event, url) => {
  try {
    await shell.openExternal(url);
    return true;
  } catch (error) {
    console.error('Error opening external link:', error);
    throw error;
  }
});

// Quick fade processing
ipcMain.handle('process-quick-fade', async (event, options) => {
  const { inputPath, outputPath, fadeSettings } = options;
  const ffmpegPaths = configManager.getFFmpegPaths();
  
  console.log('Processing quick fade with options:', {
    inputPath,
    outputPath,
    fadeSettings
  });
  
  if (!inputPath || !outputPath) {
    throw new Error('Input and output paths are required');
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
      
      // Get video duration first
      ffmpeg.ffprobe(inputPath, (err, metadata) => {
        if (err) {
          reject(new Error(`Failed to get video metadata: ${err.message}`));
          return;
        }
        
        const duration = metadata.format.duration;
        
        // Apply fade effects
        const videoFilters = [];
        const audioFilters = [];
        
        // Video fade in
        if (fadeSettings.videoFadeIn > 0) {
          videoFilters.push(`fade=t=in:st=0:d=${fadeSettings.videoFadeIn}`);
        }
        
        // Video fade out
        if (fadeSettings.videoFadeOut > 0) {
          videoFilters.push(`fade=t=out:st=${duration - fadeSettings.videoFadeOut}:d=${fadeSettings.videoFadeOut}`);
        }
        
        // Audio fade in
        if (fadeSettings.audioFadeIn > 0) {
          audioFilters.push(`afade=t=in:st=0:d=${fadeSettings.audioFadeIn}`);
        }
        
        // Audio fade out
        if (fadeSettings.audioFadeOut > 0) {
          audioFilters.push(`afade=t=out:st=${duration - fadeSettings.audioFadeOut}:d=${fadeSettings.audioFadeOut}`);
        }
        
        // Apply filters
        if (videoFilters.length > 0) {
          command = command.videoFilters(videoFilters);
        }
        if (audioFilters.length > 0) {
          command = command.audioFilters(audioFilters);
        }
        
        // Set high quality output
        command = command.videoCodec('libx264').videoBitrate('4000k');
        
        // Store the command reference for cancellation
        currentFFmpegProcess = command
          .output(outputPath)
          .on('start', (commandLine) => {
            console.log('Spawned FFmpeg with command: ' + commandLine);
            event.sender.send('processing-started');
          })
          .on('progress', (progress) => {
            console.log('Processing progress:', progress);
            event.sender.send('processing-progress', progress);
          })
          .on('end', () => {
            console.log('Quick fade processing finished successfully');
            currentFFmpegProcess = null;
            resolve({ success: true, outputPath });
          })
          .on('error', (err) => {
            console.error('Error during quick fade processing:', err);
            currentFFmpegProcess = null;
            
            // Check if this was a cancellation
            if (err.message && (err.message.includes('SIGTERM') || err.message.includes('cancelled'))) {
              reject(new Error('Processing was cancelled by user'));
            } else {
              reject(new Error(`FFmpeg processing failed: ${err.message}`));
            }
          })
          .run();
      });
    } catch (error) {
      console.error('Error setting up quick fade FFmpeg command:', error);
      reject(new Error(`Failed to setup FFmpeg command: ${error.message}`));
    }
  });
});

// Audio rip processing
ipcMain.handle('process-audio-rip', async (event, options) => {
  const { inputPath, outputPath } = options;
  const ffmpegPaths = configManager.getFFmpegPaths();
  
  console.log('Processing audio rip with options:', {
    inputPath,
    outputPath
  });
  
  if (!inputPath || !outputPath) {
    throw new Error('Input and output paths are required');
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
      
      // Determine output format based on file extension
      const outputExt = path.extname(outputPath).toLowerCase();
      let audioCodec = 'pcm_s16le'; // Default to WAV
      
      switch (outputExt) {
        case '.mp3':
          audioCodec = 'libmp3lame';
          break;
        case '.aac':
          audioCodec = 'aac';
          break;
        case '.wav':
        default:
          audioCodec = 'pcm_s16le';
          break;
      }
      
      // Configure for audio-only output
      command = command.noVideo().audioCodec(audioCodec);
      
      // Store the command reference for cancellation
      currentFFmpegProcess = command
        .output(outputPath)
        .on('start', (commandLine) => {
          console.log('Spawned FFmpeg with command: ' + commandLine);
          event.sender.send('processing-started');
        })
        .on('progress', (progress) => {
          console.log('Processing progress:', progress);
          event.sender.send('processing-progress', progress);
        })
        .on('end', () => {
          console.log('Audio rip processing finished successfully');
          currentFFmpegProcess = null;
          resolve({ success: true, outputPath });
        })
        .on('error', (err) => {
          console.error('Error during audio rip processing:', err);
          currentFFmpegProcess = null;
          
          // Check if this was a cancellation
          if (err.message && (err.message.includes('SIGTERM') || err.message.includes('cancelled'))) {
            reject(new Error('Processing was cancelled by user'));
          } else {
            reject(new Error(`FFmpeg processing failed: ${err.message}`));
          }
        })
        .run();
    } catch (error) {
      console.error('Error setting up audio rip FFmpeg command:', error);
      reject(new Error(`Failed to setup FFmpeg command: ${error.message}`));
    }
  });
});
