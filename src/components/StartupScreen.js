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
          <div className="loading-spinner">⏳</div>
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
          <div className="startup-icon">⚠️</div>
          <h2>FFmpeg Required</h2>
          <p>PHEdit needs FFmpeg to process videos. Install it to continue.</p>
          
          <div className="startup-actions">
            <button className="btn btn-primary" onClick={openDownloadLink}>
              Download FFmpeg
            </button>
            <button className="btn btn-secondary" onClick={openSettings}>
              Configure Paths
            </button>
          </div>
          
          <div className="ffmpeg-info">
            <p><strong>FFmpeg</strong> is a free multimedia framework required for video processing. Download from <a href="#" onClick={openDownloadLink}>ffmpeg.org</a>, then configure paths in Settings.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="startup-screen">
      <div className="startup-content">
        <div className="startup-icon">🎞️</div>
        <h1>PHEdit</h1>
        <p>Select mode:</p>
        
        <div className="mode-selection">
          <div className="mode-card" onClick={() => selectMode('editor')}>
            <div className="mode-icon">✂️</div>
            <h3>Editor</h3>
            <p>Video editor with timeline and controls</p>
            <ul>
              <li>Video editing</li>
              <li>Fade effects & transitions</li>
              <li>Export settings</li>
            </ul>
          </div>
          
          <div className="mode-card" onClick={() => selectMode('tasks')}>
            <div className="mode-icon">⚡</div>
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
