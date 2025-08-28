import React, { useState, useEffect } from 'react';
import InfoModal from './InfoModal';
import ConfirmModal from './ConfirmModal';

const { ipcRenderer } = window.require('electron');

const Settings = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState({
    ffmpegPath: '',
    ffprobePath: '',
    autoDetectPaths: true,
    lastUsedDirectory: ''
  });
  const [isValidating, setIsValidating] = useState(false);
  const [validationResults, setValidationResults] = useState({
    ffmpegPath: null,
    ffprobePath: null
  });
  const [isAutoDetecting, setIsAutoDetecting] = useState(false);
  const [infoModal, setInfoModal] = useState({ isOpen: false, title: '', message: '', type: 'info' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

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

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    try {
      const currentSettings = await ipcRenderer.invoke('get-settings');
      setSettings(currentSettings);
      
      // Validate current paths
      if (currentSettings.ffmpegPath) {
        validatePath('ffmpegPath', currentSettings.ffmpegPath);
      }
      if (currentSettings.ffprobePath) {
        validatePath('ffprobePath', currentSettings.ffprobePath);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const validatePath = async (pathType, path) => {
    if (!path) {
      setValidationResults(prev => ({ ...prev, [pathType]: null }));
      return;
    }

    try {
      const isValid = await ipcRenderer.invoke('validate-ffmpeg-path', path);
      setValidationResults(prev => ({ ...prev, [pathType]: isValid }));
    } catch (error) {
      setValidationResults(prev => ({ ...prev, [pathType]: false }));
    }
  };

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    
    // Validate path changes immediately
    if ((key === 'ffmpegPath' || key === 'ffprobePath') && value) {
      validatePath(key, value);
    } else if ((key === 'ffmpegPath' || key === 'ffprobePath') && !value) {
      setValidationResults(prev => ({ ...prev, [key]: null }));
    }
  };

  const selectExecutablePath = async (pathType, title) => {
    try {
      const result = await ipcRenderer.invoke('select-executable-path', title);
      if (!result.canceled && result.filePaths.length > 0) {
        const selectedPath = result.filePaths[0];
        handleSettingChange(pathType, selectedPath);
      }
    } catch (error) {
      console.error('Error selecting executable path:', error);
    }
  };

  const autoDetectPaths = async () => {
    setIsAutoDetecting(true);
    try {
      const detected = await ipcRenderer.invoke('auto-detect-ffmpeg');
      
      if (detected.ffmpegPath) {
        handleSettingChange('ffmpegPath', detected.ffmpegPath);
      }
      if (detected.ffprobePath) {
        handleSettingChange('ffprobePath', detected.ffprobePath);
      }
      
      if (!detected.ffmpegPath && !detected.ffprobePath) {
        showInfoModal('Auto-Detection Failed', 'Could not auto-detect FFmpeg executables. Please set paths manually.', 'warning');
      } else {
        const detectedPaths = [];
        if (detected.ffmpegPath) detectedPaths.push(`FFmpeg: ${detected.ffmpegPath}`);
        if (detected.ffprobePath) detectedPaths.push(`FFprobe: ${detected.ffprobePath}`);
        showInfoModal('Auto-Detection Successful', `Auto-detected:\n${detectedPaths.join('\n')}`, 'success');
      }
    } catch (error) {
      console.error('Error auto-detecting paths:', error);
      showInfoModal('Auto-Detection Error', error.message, 'error');
    } finally {
      setIsAutoDetecting(false);
    }
  };

  const saveSettings = async () => {
    setIsValidating(true);
    try {
      // Validate all paths before saving
      let allValid = true;
      
      if (settings.ffmpegPath && !settings.autoDetectPaths) {
        const ffmpegValid = await ipcRenderer.invoke('validate-ffmpeg-path', settings.ffmpegPath);
        if (!ffmpegValid) {
          allValid = false;
          showInfoModal('Invalid FFmpeg Path', 'Please check the file exists and is executable.', 'error');
        }
      }
      
      if (settings.ffprobePath && !settings.autoDetectPaths) {
        const ffprobeValid = await ipcRenderer.invoke('validate-ffmpeg-path', settings.ffprobePath);
        if (!ffprobeValid) {
          allValid = false;
          showInfoModal('Invalid FFprobe Path', 'Please check the file exists and is executable.', 'error');
        }
      }
      
      if (allValid) {
        await ipcRenderer.invoke('set-settings', settings);
        showInfoModal('Settings Saved', 'Settings saved successfully!', 'success');
        setTimeout(() => {
          closeInfoModal();
          onClose();
        }, 1500);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      showInfoModal('Save Error', error.message, 'error');
    } finally {
      setIsValidating(false);
    }
  };

  const resetSettings = async () => {
    showConfirmModal(
      'Reset Settings',
      'Are you sure you want to reset all settings to defaults?',
      () => {
        setSettings({
          ffmpegPath: '',
          ffprobePath: '',
          autoDetectPaths: true,
          lastUsedDirectory: ''
        });
        setValidationResults({
          ffmpegPath: null,
          ffprobePath: null
        });
        showInfoModal('Settings Reset', 'All settings have been reset to defaults.', 'info');
      }
    );
  };

  const getValidationIcon = (pathType) => {
    const result = validationResults[pathType];
    if (result === null) return '';
    return result ? '✅' : '❌';
  };

  const getValidationText = (pathType) => {
    const result = validationResults[pathType];
    if (result === null) return '';
    return result ? 'Valid' : 'Invalid path';
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content settings-modal">
        <div className="modal-header">
          <h2>Settings</h2>
          <button className="btn btn-close" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="settings-section">
            <h3>FFmpeg Configuration</h3>
            
            <div className="setting-item">
              <label className="setting-label">
                <input
                  type="checkbox"
                  checked={settings.autoDetectPaths}
                  onChange={(e) => handleSettingChange('autoDetectPaths', e.target.checked)}
                />
                Auto-detect FFmpeg executables
              </label>
              <p className="setting-description">
                Automatically find FFmpeg and FFprobe executables in common locations and PATH.
              </p>
            </div>

            {!settings.autoDetectPaths && (
              <>
                <div className="setting-item">
                  <label className="setting-label">FFmpeg Executable Path:</label>
                  <div className="path-input-group">
                    <input
                      type="text"
                      value={settings.ffmpegPath}
                      onChange={(e) => handleSettingChange('ffmpegPath', e.target.value)}
                      placeholder="Path to ffmpeg executable"
                      className="path-input"
                    />
                    <button 
                      className="btn btn-secondary"
                      onClick={() => selectExecutablePath('ffmpegPath', 'Select FFmpeg Executable')}
                    >
                      Browse
                    </button>
                    <span className="validation-indicator">
                      {getValidationIcon('ffmpegPath')} {getValidationText('ffmpegPath')}
                    </span>
                  </div>
                </div>

                <div className="setting-item">
                  <label className="setting-label">FFprobe Executable Path:</label>
                  <div className="path-input-group">
                    <input
                      type="text"
                      value={settings.ffprobePath}
                      onChange={(e) => handleSettingChange('ffprobePath', e.target.value)}
                      placeholder="Path to ffprobe executable"
                      className="path-input"
                    />
                    <button 
                      className="btn btn-secondary"
                      onClick={() => selectExecutablePath('ffprobePath', 'Select FFprobe Executable')}
                    >
                      Browse
                    </button>
                    <span className="validation-indicator">
                      {getValidationIcon('ffprobePath')} {getValidationText('ffprobePath')}
                    </span>
                  </div>
                </div>
              </>
            )}

            <div className="setting-actions">
              <button 
                className="btn btn-secondary"
                onClick={autoDetectPaths}
                disabled={isAutoDetecting}
              >
                {isAutoDetecting ? 'Detecting...' : 'Auto-Detect Paths'}
              </button>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={resetSettings}>
            Reset to Defaults
          </button>
          <div className="modal-footer-right">
            <button className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button 
              className="btn" 
              onClick={saveSettings}
              disabled={isValidating}
            >
              {isValidating ? 'Validating...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>

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
        confirmText="Reset"
        cancelText="Cancel"
        type="warning"
      />
    </div>
  );
};

export default Settings;
