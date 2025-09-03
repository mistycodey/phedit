import React, { useState, useEffect } from 'react';
import InfoModal from './InfoModal';

const { ipcRenderer } = window.require('electron');

const StartupScreen = ({ onModeSelect }) => {
  const [ffmpegStatus, setFfmpegStatus] = useState('checking'); // 'checking', 'installed', 'not-installed'
  const [isChecking, setIsChecking] = useState(true);
  const [infoModal, setInfoModal] = useState({ isOpen: false, title: '', message: '', type: 'info' });

  const showInfoModal = (title, message, type = 'info') => {
    setInfoModal({ isOpen: true, title, message, type });
  };

  const closeInfoModal = () => {
    setInfoModal({ isOpen: false, title: '', message: '', type: 'info' });
  };

  useEffect(() => {
    checkFfmpegStatus();
  }, []);

  const checkFfmpegStatus = async () => {
    setIsChecking(true);
    try {
      const status = await ipcRenderer.invoke('check-ffmpeg-status');
      setFfmpegStatus(status);
    } catch (error) {
      console.error('Error checking FFmpeg status:', error);
      setFfmpegStatus('not-installed');
    } finally {
      setIsChecking(false);
    }
  };

  const openSettings = () => {
    onModeSelect('settings');
  };

  const openDownloadLink = () => {
    ipcRenderer.invoke('open-external-link', 'https://ffmpeg.org/download.html');
  };

  const selectMode = (mode) => {
    if (ffmpegStatus !== 'installed') {
      showInfoModal('FFmpeg Required', 'Please install and configure FFmpeg before using the application.', 'warning');
      return;
    }
    onModeSelect(mode);
  };

  if (isChecking) {
    return (
      <div className="startup-screen">
        <div className="startup-content">
          <div className="loading-spinner">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{width: '48px', height: '48px', fill: 'white'}}>
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/>
              <path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"/>
            </svg>
          </div>
          <h2>Checking FFmpeg Installation...</h2>
          <p>Please wait while we verify your FFmpeg setup.</p>
        </div>
      </div>
    );
  }

  if (ffmpegStatus === 'not-installed') {
    return (
      <div className="startup-screen">
        <div className="startup-content">
          <div className="startup-icon">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{width: '56px', height: '56px', fill: 'white'}}>
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
          <h2>FFmpeg Not Found</h2>
          <p>FFmpeg is required to run this application. Please install FFmpeg and ensure it's available in your system PATH.</p>
          
          <div className="startup-actions">
            <button className="btn btn-secondary" onClick={openDownloadLink}>
              Download FFmpeg
            </button>
            <button className="btn btn-secondary" onClick={openSettings}>
              Check Settings
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="startup-screen">
      <div className="startup-content">
        <div className="startup-icon">
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{width: '56px', height: '56px', fill: 'white'}}>
            <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/>
          </svg>
        </div>
        <h1>PHEdit</h1>
        <p>Select mode:</p>
        
        <div className="mode-selection">
          <div className="mode-card" onClick={() => selectMode('editor')}>
            <div className="mode-icon">
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{width: '48px', height: '48px', fill: 'white'}}>
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
              </svg>
            </div>
            <h3>Editor</h3>
            <p>Video editor with timeline and controls</p>
            <ul>
              <li>Video editing</li>
              <li>Fade effects & transitions</li>
              <li>Export settings</li>
            </ul>
          </div>
          
          <div className="mode-card" onClick={() => selectMode('tasks')}>
            <div className="mode-icon">
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{width: '48px', height: '48px', fill: 'white'}}>
                <path d="M13 2.05v3.03c3.39.49 6 3.39 6 6.92 0 .9-.18 1.75-.48 2.54l2.6 1.53c.56-1.24.88-2.62.88-4.07 0-5.18-3.95-9.45-9-9.95zM12 19c-3.87 0-7-3.13-7-7 0-3.53 2.61-6.43 6-6.92V2.05c-5.05.5-9 4.76-9 9.95 0 5.52 4.47 10 9.99 10 3.31 0 6.24-1.61 8.06-4.09l-2.6-1.53C16.17 17.98 14.21 19 12 19z"/>
              </svg>
            </div>
            <h3>Tasks</h3>
            <p>Video processing operations</p>
            <ul>
              <li>Fade effects</li>
              <li>Audio extraction</li>
              <li>Batch operations</li>
            </ul>
          </div>
        </div>
        
        <div className="startup-footer">
          <button className="btn btn-secondary" onClick={openSettings}>
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{width: '20px', height: '20px', fill: 'white', marginRight: '8px'}}>
              <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
            </svg>
            Settings
          </button>
        </div>
      </div>

      <InfoModal
        isOpen={infoModal.isOpen}
        onClose={closeInfoModal}
        title={infoModal.title}
        message={infoModal.message}
        type={infoModal.type}
      />
    </div>
  );
};

export default StartupScreen;
