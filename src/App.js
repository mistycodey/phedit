import React, { useState, useRef, useEffect, useCallback } from 'react';
import VideoPlayer from './components/VideoPlayer';
import Controls from './components/Controls';
import Settings from './components/Settings';
import InfoModal from './components/InfoModal';
import ConfirmModal from './components/ConfirmModal';
import SessionRestoreModal from './components/SessionRestoreModal';

import ExportProgressOverlay from './components/ExportProgressOverlay';
import Help from './components/Help';
import StartupScreen from './components/StartupScreen';
import TasksScreen from './components/TasksScreen';
import './App.css';

const { ipcRenderer } = window.require('electron');
const path = window.require('path');

function App() {
  // App mode state
  const [appMode, setAppMode] = useState('startup'); // 'startup', 'editor', 'tasks', 'settings'
  
  // Single video state
  const [videoFile, setVideoFile] = useState(null);
  const [videoFilePath, setVideoFilePath] = useState(null);
  const [videoFileName, setVideoFileName] = useState(null);
  const [videoMetadata, setVideoMetadata] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [inPoint, setInPoint] = useState(0);
  const [outPoint, setOutPoint] = useState(0);
  
  // Preview monitoring ref
  const previewMonitorRef = useRef(null);
  const [fadeIn, setFadeIn] = useState(0);
  const [fadeOut, setFadeOut] = useState(0);
  const [audioFadeIn, setAudioFadeIn] = useState(0);
  const [audioFadeOut, setAudioFadeOut] = useState(0);
  const [silenceAtStart, setSilenceAtStart] = useState(0);
  const [blackScreenAtStart, setBlackScreenAtStart] = useState(0);
  const [exportQuality, setExportQuality] = useState('high'); // 'low', 'medium', 'high'
  const [exportSize, setExportSize] = useState(100); // percentage of original size
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [outputFilePath, setOutputFilePath] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [exportType, setExportType] = useState('video'); // 'video' or 'audio'
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [infoModal, setInfoModal] = useState({ isOpen: false, title: '', message: '', type: 'info' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

     const [showHelp, setShowHelp] = useState(false);
   const [isRestoringSession, setIsRestoringSession] = useState(false);
   const [sessionRestoreModal, setSessionRestoreModal] = useState({ isOpen: false, sessionState: null });
   const [mouseTimelinePosition, setMouseTimelinePosition] = useState(null);

  const videoRef = useRef(null);

  const showInfoModal = (title, message, type = 'info') => {
    setInfoModal({ isOpen: true, title, message, type });
  };

  const closeInfoModal = () => {
    setInfoModal({ isOpen: false, title: '', message: '', type: 'info' });
  };

  const showConfirmModal = (title, message, onConfirm) => {
    setConfirmModal({ isOpen: true, title, message, onConfirm });
  };

     const closeConfirmModal = () => {
     setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null });
   };

   const closeSessionRestoreModal = () => {
     setSessionRestoreModal({ isOpen: false, sessionState: null });
   };



  const handleModeSelect = (mode) => {
    setAppMode(mode);
  };

  const handleBackToStartup = () => {
    setAppMode('startup');
  };

  useEffect(() => {
    // Listen for processing events
    ipcRenderer.on('processing-started', () => {
      setIsPreparing(false); // Clear preparing state when actual processing starts
      setIsProcessing(true);
      setProcessingProgress(0);
    });

    ipcRenderer.on('processing-progress', (event, progress) => {
      console.log('Received progress from backend:', progress);
      // Only update if we have a valid progress value, otherwise keep the current value
      if (progress && typeof progress.percent === 'number' && !isNaN(progress.percent)) {
        setProcessingProgress(progress.percent);
      } else {
        console.log('Invalid progress received, keeping current value');
      }
    });

    ipcRenderer.on('processing-cancelled', () => {
      setIsProcessing(false);
      setIsPreparing(false); // Clear preparing state when cancelled
      setProcessingProgress(0);
      showInfoModal('Export Cancelled', 'The export process was cancelled successfully.', 'info');
    });

         // Check for session state to restore
     const checkSessionState = async () => {
       try {
         const sessionState = await ipcRenderer.invoke('get-session-state');
         if (sessionState && sessionState.videoFilePath) {
           setSessionRestoreModal({ isOpen: true, sessionState });
         }
       } catch (error) {
         console.log('No session state to restore or error loading:', error);
       }
     };

    checkSessionState();

    return () => {
      ipcRenderer.removeAllListeners('processing-started');
      ipcRenderer.removeAllListeners('processing-progress');
      ipcRenderer.removeAllListeners('processing-cancelled');
    };
  }, []);

  // Cleanup preview monitoring on unmount
  useEffect(() => {
    return () => {
      if (previewMonitorRef.current) {
        cancelAnimationFrame(previewMonitorRef.current);
        previewMonitorRef.current = null;
      }
    };
  }, []);

  // Monitor outPoint changes during preview mode
  useEffect(() => {
    if (isPreviewMode && videoRef.current && !videoRef.current.paused) {
      // Restart monitoring with new outPoint value
      if (previewMonitorRef.current) {
        cancelAnimationFrame(previewMonitorRef.current);
      }
      
      const checkTime = () => {
        if (videoRef.current && isPreviewMode) {
          const currentVideoTime = videoRef.current.currentTime;
          
          // Check if we've reached or passed the current out point
          if (currentVideoTime >= outPoint) {
            videoRef.current.pause();
            setIsPlaying(false);
            setIsPreviewMode(false);
            if (previewMonitorRef.current) {
              cancelAnimationFrame(previewMonitorRef.current);
              previewMonitorRef.current = null;
            }
            return;
          }
          
          // Continue monitoring only if video is still playing and in preview mode
          if (!videoRef.current.paused && isPreviewMode) {
            previewMonitorRef.current = requestAnimationFrame(checkTime);
          } else {
            // Clean up if video paused or preview mode ended
            if (previewMonitorRef.current) {
              cancelAnimationFrame(previewMonitorRef.current);
              previewMonitorRef.current = null;
            }
          }
        } else {
          // Clean up if not in preview mode or video ref missing
          if (previewMonitorRef.current) {
            cancelAnimationFrame(previewMonitorRef.current);
            previewMonitorRef.current = null;
          }
        }
      };
      
      checkTime();
    }
  }, [outPoint, isPreviewMode]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!videoFile) return; // Only handle shortcuts if video is loaded
      
      switch (event.key) {
        case ' ':
          event.preventDefault();
          handlePlayPause();
          break;
        case 'ArrowLeft':
          if (event.shiftKey && event.ctrlKey) {
            // Shift+Ctrl+Left: Nudge IN point left by 1 second
            event.preventDefault();
            handleSetInPoint(Math.max(0, inPoint - 1));
          } else if (event.shiftKey) {
            // Shift+Left: Nudge IN point left by 0.1 seconds
            event.preventDefault();
            handleSetInPoint(Math.max(0, inPoint - 0.1));
          } else {
            // Normal: Skip back 10 seconds
            event.preventDefault();
            handleSeek(Math.max(0, currentTime - 10));
          }
          break;
        case 'ArrowRight':
          if (event.shiftKey && event.ctrlKey) {
            // Shift+Ctrl+Right: Nudge IN point right by 1 second
            event.preventDefault();
            handleSetInPoint(Math.min(outPoint - 0.1, inPoint + 1));
          } else if (event.shiftKey) {
            // Shift+Right: Nudge IN point right by 0.1 seconds
            event.preventDefault();
            handleSetInPoint(Math.min(outPoint - 0.1, inPoint + 0.1));
          } else {
            // Normal: Skip forward 10 seconds
            event.preventDefault();
            handleSeek(Math.min(duration, currentTime + 10));
          }
          break;
        case 'i':
        case 'I':
          event.preventDefault();
          // Use mouse position if available, otherwise use current time
          handleSetInPoint(mouseTimelinePosition !== null ? mouseTimelinePosition : currentTime);
          break;
        case 'o':
        case 'O':
          event.preventDefault();
          // Use mouse position if available, otherwise use current time
          handleSetOutPoint(mouseTimelinePosition !== null ? mouseTimelinePosition : currentTime);
          break;
        case 'ArrowUp':
          if (event.shiftKey && event.ctrlKey) {
            // Shift+Ctrl+Up: Nudge OUT point right by 1 second
            event.preventDefault();
            handleSetOutPoint(Math.min(duration, outPoint + 1));
          } else if (event.shiftKey) {
            // Shift+Up: Nudge OUT point right by 0.1 seconds
            event.preventDefault();
            handleSetOutPoint(Math.min(duration, outPoint + 0.1));
          }
          break;
        case 'ArrowDown':
          if (event.shiftKey && event.ctrlKey) {
            // Shift+Ctrl+Down: Nudge OUT point left by 1 second
            event.preventDefault();
            handleSetOutPoint(Math.max(inPoint + 0.1, outPoint - 1));
          } else if (event.shiftKey) {
            // Shift+Down: Nudge OUT point left by 0.1 seconds
            event.preventDefault();
            handleSetOutPoint(Math.max(inPoint + 0.1, outPoint - 0.1));
          }
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [videoFile, currentTime, duration]);

  const handleLoadVideo = async () => {
    try {
      const result = await ipcRenderer.invoke('open-file-dialog');
      if (!result.canceled && result.filePaths.length > 0) {
        const filePath = result.filePaths[0];
        const fileName = path.basename(filePath);
        
        // Get video metadata and URL
        const metadata = await ipcRenderer.invoke('get-video-info', filePath);
        const videoUrl = await ipcRenderer.invoke('get-video-url', filePath);
        
        setVideoFilePath(filePath);
        setVideoFileName(fileName);
        setVideoFile(videoUrl);
        setVideoMetadata(metadata);
        
        const videoDuration = metadata.format.duration;
        setDuration(videoDuration);
        setOutPoint(videoDuration);
        
        // Reset other values
        setCurrentTime(0);
        setInPoint(0);
        setFadeIn(0);
        setFadeOut(0);
        setAudioFadeIn(0);
        setAudioFadeOut(0);
        setSilenceAtStart(0);
        setBlackScreenAtStart(0);
      }
    } catch (error) {
      console.error('Error loading video:', error);
      showInfoModal('Error Loading Video', error.message, 'error');
    }
  };

  const handleTimeUpdate = (time) => {
    setCurrentTime(time);
  };

  const handleSeek = (time, fromPreview = false) => {
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      // If we were in preview mode and user manually seeks (not from preview), exit preview mode
      if (isPreviewMode && !fromPreview) {
        setIsPreviewMode(false);
        // Clean up preview monitoring
        if (previewMonitorRef.current) {
          cancelAnimationFrame(previewMonitorRef.current);
          previewMonitorRef.current = null;
        }
      }
    }
  };

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        // If we were in preview mode and user manually paused, exit preview mode
        if (isPreviewMode) {
          setIsPreviewMode(false);
          // Clean up preview monitoring
          if (previewMonitorRef.current) {
            cancelAnimationFrame(previewMonitorRef.current);
            previewMonitorRef.current = null;
          }
        }
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSetInPoint = (time = currentTime) => {
    setInPoint(time);
  };

  const handleSetOutPoint = (time = currentTime) => {
    setOutPoint(time);
  };

  const handleMousePositionUpdate = (position) => {
    setMouseTimelinePosition(position);
  };
  


  const handlePreviewClip = (startTime, endTime) => {
    if (!videoRef.current) return;
    
    // Clean up any existing preview monitoring
    if (previewMonitorRef.current) {
      cancelAnimationFrame(previewMonitorRef.current);
      previewMonitorRef.current = null;
    }
    
    setIsPreviewMode(true);
    setIsPlaying(true);
    
    // Seek to start time
    handleSeek(startTime, true);
    
    // Wait a moment for seek to complete, then play
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.play().catch(error => {
          console.error('Error playing preview:', error);
          setIsPlaying(false);
          setIsPreviewMode(false);
        });
      }
    }, 100);
  };

  const handleClearClipPoints = () => {
    showConfirmModal(
      'Clear Clip Points',
      'Are you sure you want to clear the current in and out points? This will reset the clip to the full video duration.',
      () => {
        setInPoint(0);
        setOutPoint(duration);
        closeConfirmModal();
      }
    );
  };

  const handleSessionRestore = async (restoreData) => {
    try {
      setIsRestoringSession(true);
      
      // Restore video file if selected
      if (restoreData.videoFilePath) {
        setVideoFilePath(restoreData.videoFilePath);
        setVideoFileName(restoreData.videoFileName);
        
        // Get video metadata and URL
        const metadata = await ipcRenderer.invoke('get-video-info', restoreData.videoFilePath);
        setVideoMetadata(metadata);
        
        const videoUrl = await ipcRenderer.invoke('get-video-url', restoreData.videoFilePath);
        setVideoFile(videoUrl);
        
        const videoDuration = metadata.format.duration;
        setDuration(videoDuration);
        
        // Reset current time
        setCurrentTime(0);
        
        // Set IN and OUT points - use restored values if available, otherwise use defaults
        const restoredInPoint = restoreData.inPoint !== undefined ? restoreData.inPoint : 0;
        const restoredOutPoint = restoreData.outPoint !== undefined ? restoreData.outPoint : videoDuration;
        
        setInPoint(restoredInPoint);
        setOutPoint(restoredOutPoint);
      } else {
        // If not restoring video file, just restore the in/out points
        if (restoreData.inPoint !== undefined) setInPoint(restoreData.inPoint);
        if (restoreData.outPoint !== undefined) setOutPoint(restoreData.outPoint);
      }
      
             // Restore other values
       if (restoreData.fadeIn !== undefined) setFadeIn(restoreData.fadeIn);
       if (restoreData.fadeOut !== undefined) setFadeOut(restoreData.fadeOut);
       if (restoreData.audioFadeIn !== undefined) setAudioFadeIn(restoreData.audioFadeIn);
       if (restoreData.audioFadeOut !== undefined) setAudioFadeOut(restoreData.audioFadeOut);
       if (restoreData.silenceAtStart !== undefined) setSilenceAtStart(restoreData.silenceAtStart);
       if (restoreData.blackScreenAtStart !== undefined) setBlackScreenAtStart(restoreData.blackScreenAtStart);
       if (restoreData.exportQuality !== undefined) setExportQuality(restoreData.exportQuality);
       if (restoreData.exportSize !== undefined) setExportSize(restoreData.exportSize);
       if (restoreData.exportType !== undefined) setExportType(restoreData.exportType);
    } catch (error) {
      console.error('Error restoring session:', error);
      showInfoModal('Restore Error', 'Failed to restore some session settings. The video file may no longer be available.', 'warning');
    } finally {
      // Clear the restoring flag after a brief delay to allow metadata loading to complete
      setTimeout(() => {
        setIsRestoringSession(false);
      }, 500);
    }
  };

  // Save session state whenever relevant values change
  const saveSessionState = async () => {
    if (videoFilePath) {
      const sessionState = {
        videoFilePath,
        videoFileName,
        inPoint,
        outPoint,
        fadeIn,
        fadeOut,
        audioFadeIn,
        audioFadeOut,
        silenceAtStart,
        blackScreenAtStart,
        exportQuality,
        exportSize,
        exportType
      };
      
      try {
        await ipcRenderer.invoke('save-session-state', sessionState);
      } catch (error) {
        console.error('Error saving session state:', error);
      }
    }
  };

  // Auto-save session state when values change
  useEffect(() => {
    saveSessionState();
  }, [videoFilePath, videoFileName, inPoint, outPoint, fadeIn, fadeOut, audioFadeIn, audioFadeOut, silenceAtStart, blackScreenAtStart, exportQuality, exportSize, exportType]);

    const handleExport = async () => {
    if (!videoFile) {
      showInfoModal('Export Error', 'No video loaded. Please load a video first.', 'error');
      return;
    }

    const clipDuration = outPoint - inPoint;
    if (clipDuration <= 0) {
      showInfoModal('Export Error', 'Invalid clip duration. Please set valid in and out points.', 'error');
      return;
    }

    try {
      console.log('Opening save dialog for export type:', exportType);
      const result = await ipcRenderer.invoke('save-file-dialog', exportType);
      console.log('Save dialog result:', result);
      
      if (result.canceled) {
        console.log('User canceled save dialog');
        return;
      }
      
      if (!result.filePath) {
        showInfoModal('Export Error', 'No file path selected.', 'error');
        return;
      }

      // Show preparing modal immediately after save dialog is confirmed
      setIsPreparing(true);
      setOutputFilePath(result.filePath);

      console.log('Starting export with parameters:', {
        inputPath: videoFilePath,
        outputPath: result.filePath,
        inPoint: inPoint,
        outPoint: outPoint,
        fadeIn: fadeIn,
        fadeOut: fadeOut,
        audioFadeIn: audioFadeIn,
        audioFadeOut: audioFadeOut,
        silenceAtStart: silenceAtStart,
        blackScreenAtStart: blackScreenAtStart,
        exportQuality: exportQuality,
        exportSize: exportSize,
        exportType: exportType
      });

      const exportResult = await ipcRenderer.invoke('process-video', {
        inputPath: videoFilePath,
        outputPath: result.filePath,
        inPoint: inPoint,
        outPoint: outPoint,
        fadeIn: fadeIn,
        fadeOut: fadeOut,
        audioFadeIn: audioFadeIn,
        audioFadeOut: audioFadeOut,
        silenceAtStart: silenceAtStart,
        blackScreenAtStart: blackScreenAtStart,
        exportQuality: exportQuality,
        exportSize: exportSize,
        exportType: exportType
      });
      
      console.log('Export completed:', exportResult);
      setIsProcessing(false);
      setIsPreparing(false);
      setOutputFilePath(null);
      const fileType = exportType === 'audio' ? 'Audio' : 'Video';
      
      // Show success modal with option to open folder
      const fileName = path.basename(result.filePath);
      showInfoModal(
        'Export Successful', 
        `${fileType} exported successfully!\n\nFile: ${fileName}\nLocation: ${path.dirname(result.filePath)}`, 
        'success'
      );
      
      // Optionally show the file in folder after a delay
      setTimeout(async () => {
        try {
          await ipcRenderer.invoke('show-item-in-folder', result.filePath);
        } catch (error) {
          console.log('Could not show file in folder:', error);
        }
      }, 2000);
      
    } catch (error) {
      console.error('Error exporting:', error);
      
      // Handle cancellation differently from other errors
      if (error.message.includes('cancelled by user')) {
        showInfoModal('Export Cancelled', 'The export was cancelled by the user.', 'info');
      } else {
        showInfoModal('Export Error', `Failed to export: ${error.message}`, 'error');
      }
      setIsProcessing(false);
      setIsPreparing(false);
      setOutputFilePath(null);
    }
  };

  const handleCancelExport = async () => {
    try {
      // If we're still in preparing phase, just reset states
      if (isPreparing && !isProcessing) {
        setIsPreparing(false);
        setOutputFilePath(null);
        showInfoModal('Export Cancelled', 'The export preparation was cancelled.', 'info');
        return;
      }
      
      // Otherwise, cancel the actual export process
      const result = await ipcRenderer.invoke('cancel-export');
      if (!result.success) {
        showInfoModal('Cancel Error', result.message, 'warning');
      }
    } catch (error) {
      console.error('Cancel export error:', error);
      showInfoModal('Cancel Error', `Error cancelling export: ${error.message}`, 'error');
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = (seconds % 60).toFixed(2);
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.padStart(5, '0')}`;
  };

  // Render different screens based on app mode
  if (appMode === 'startup') {
    return <StartupScreen onModeSelect={handleModeSelect} />;
  }

  if (appMode === 'tasks') {
    return <TasksScreen onBack={handleBackToStartup} />;
  }

  if (appMode === 'settings') {
    return (
      <div className="app">
        <div className="header">
          <div className="logo">PHEdit</div>
          <div className="header-controls">
            <button className="btn btn-secondary" onClick={handleBackToStartup}>
              ← Back to Menu
            </button>
          </div>
        </div>
        <Settings isOpen={true} onClose={handleBackToStartup} />
      </div>
    );
  }

  // Editor mode (default app interface)
  return (
    <div className={`app ${!videoFile ? 'no-video-loaded' : ''}`}>
      <div className="header">
        <div className="header-controls">
          <button className="btn btn-secondary btn-icon-only" onClick={handleBackToStartup}>
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
            </svg>
          </button>
          <button className="btn btn-secondary btn-icon-only" onClick={() => setShowHelp(true)}>
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>
            </svg>
          </button>
          <button className="btn btn-secondary btn-icon-only" onClick={() => setShowSettings(true)}>
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
            </svg>
          </button>
        </div>
        <button className="btn" onClick={handleLoadVideo}>
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{width: '20px', height: '20px', fill: 'white', marginRight: '8px'}}>
            <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
          </svg>
          Load Video
        </button>
      </div>
      
      <div className="main-content">
        <div className={`video-container ${isPlaying ? 'playing' : ''}`}>
          {videoFile ? (
            <>
              <VideoPlayer
                ref={videoRef}
                src={videoFile}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={(e) => {
                  setDuration(e.target.duration);
                  // Only set OUT point to duration if we're not restoring a session
                  if (!isRestoringSession) {
                    setOutPoint(e.target.duration);
                  }
                }}
                currentTime={currentTime}
                videoMetadata={videoMetadata}
                isPlaying={isPlaying}
                onPlayPause={handlePlayPause}
                onSeek={handleSeek}
                duration={duration}
                hasVideo={!!videoFile}
              />
              <div className="file-info">
                <div className="file-name">{videoFileName}</div>
                <div className="file-path">{videoFilePath}</div>
              </div>
            </>
          ) : (
            <div className="no-video">
              <div className="no-video-content">
                <div className="no-video-icon">🎬</div>
                <h3>No Video Loaded</h3>
                <p>Click "Load Video" to get started</p>
                <p className="no-video-hint">All controls will be enabled once you load a video file</p>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="controls-panel">
          <Controls
            isPlaying={isPlaying}
            onPlayPause={handlePlayPause}
            onSetInPoint={handleSetInPoint}
            onSetOutPoint={handleSetOutPoint}
            onClearClipPoints={handleClearClipPoints}
            inPoint={inPoint}
            outPoint={outPoint}
            fadeIn={fadeIn}
            fadeOut={fadeOut}
            onFadeInChange={setFadeIn}
            onFadeOutChange={setFadeOut}
            audioFadeIn={audioFadeIn}
            audioFadeOut={audioFadeOut}
            onAudioFadeInChange={setAudioFadeIn}
            onAudioFadeOutChange={setAudioFadeOut}
            silenceAtStart={silenceAtStart}
            onSilenceAtStartChange={setSilenceAtStart}
            blackScreenAtStart={blackScreenAtStart}
            onBlackScreenAtStartChange={setBlackScreenAtStart}
            exportQuality={exportQuality}
            onExportQualityChange={setExportQuality}
            exportSize={exportSize}
            onExportSizeChange={setExportSize}
            onExport={handleExport}
            onCancelExport={handleCancelExport}
            isProcessing={isProcessing || isPreparing}
            processingProgress={processingProgress}
            formatTime={formatTime}
            hasVideo={!!videoFile}
            exportType={exportType}
            onExportTypeChange={setExportType}
            currentTime={currentTime}
            duration={duration}
            onSeek={handleSeek}
            onPreviewClip={handlePreviewClip}
            isPreviewMode={isPreviewMode}
            onMousePositionUpdate={handleMousePositionUpdate}
          />
        </div>
      </div>

      <Settings 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
      />

      <Help
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
      />

      <InfoModal
        isOpen={infoModal.isOpen}
        onClose={closeInfoModal}
        title={infoModal.title}
        message={infoModal.message}
        type={infoModal.type}
      />

             <ConfirmModal
         isOpen={confirmModal.isOpen}
         onClose={closeConfirmModal}
         onConfirm={confirmModal.onConfirm}
         title={confirmModal.title}
         message={confirmModal.message}
       />

       <SessionRestoreModal
         isOpen={sessionRestoreModal.isOpen}
         onClose={closeSessionRestoreModal}
         onRestore={handleSessionRestore}
         sessionState={sessionRestoreModal.sessionState}
       />

       <ExportProgressOverlay
        isVisible={isProcessing || isPreparing}
        progress={processingProgress}
        isPreparing={isPreparing}
        exportType={exportType}
        onCancel={handleCancelExport}
        sourceFile={videoFileName || 'Unknown'}
        outputFile={outputFilePath ? path.basename(outputFilePath) : 'Not started'}
        exportOptions={isProcessing ? {
          startTime: inPoint,
          duration: isNaN(outPoint) || isNaN(inPoint) ? 0 : Math.max(0, outPoint - inPoint),
          fadeIn,
          fadeOut,
          audioFadeIn,
          audioFadeOut,
          silenceAtStart,
          blackScreenAtStart,
          exportQuality,
          exportSize
        } : null}
      />
    </div>
  );
}

export default App;
