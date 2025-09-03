import React, { useState } from 'react';

const SessionRestoreModal = ({ isOpen, onClose, onRestore, sessionState }) => {
  const [selectedItems, setSelectedItems] = useState({
    videoFile: true,
    inOutPoints: true,
    fadeValues: true,
    silenceValues: true,
    exportType: true
  });

  if (!isOpen || !sessionState) return null;

  const handleCheckboxChange = (key) => {
    setSelectedItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleRestore = () => {
    const restoreData = {};
    
    if (selectedItems.videoFile && sessionState.videoFilePath) {
      restoreData.videoFilePath = sessionState.videoFilePath;
      restoreData.videoFileName = sessionState.videoFileName;
    }
    
    if (selectedItems.inOutPoints) {
      restoreData.inPoint = sessionState.inPoint;
      restoreData.outPoint = sessionState.outPoint;
    }
    
    if (selectedItems.fadeValues) {
      restoreData.fadeIn = sessionState.fadeIn;
      restoreData.fadeOut = sessionState.fadeOut;
      restoreData.audioFadeIn = sessionState.audioFadeIn;
      restoreData.audioFadeOut = sessionState.audioFadeOut;
    }
    
    if (selectedItems.silenceValues) {
      restoreData.silenceAtStart = sessionState.silenceAtStart;
    }
    
    if (selectedItems.exportType) {
      restoreData.exportType = sessionState.exportType;
    }
    
    onRestore(restoreData);
    onClose();
  };

  const handleSkip = () => {
    onClose();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(2);
    return `${mins.toString().padStart(2, '0')}:${secs.padStart(5, '0')}`;
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content session-restore-modal">
        <div className="modal-header">
          <h2>Use last settings?</h2>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          
          <div className="restore-options">
            {sessionState.videoFilePath && (
              <div className="restore-option">
                <label className="restore-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedItems.videoFile}
                    onChange={() => handleCheckboxChange('videoFile')}
                  />
                  <span className="checkmark"></span>
                  <div className="option-content">
                    <div className="option-title">Video File</div>
                    <div className="option-details">
                      {sessionState.videoFileName}
                    </div>
                  </div>
                </label>
              </div>
            )}
            
            <div className="restore-option">
              <label className="restore-checkbox">
                <input
                  type="checkbox"
                  checked={selectedItems.inOutPoints}
                  onChange={() => handleCheckboxChange('inOutPoints')}
                />
                <span className="checkmark"></span>
                <div className="option-content">
                  <div className="option-title">In/Out Points</div>
                  <div className="option-details">
                    In: {formatTime(sessionState.inPoint)} | Out: {formatTime(sessionState.outPoint)}
                  </div>
                </div>
              </label>
            </div>
            
            <div className="restore-option">
              <label className="restore-checkbox">
                <input
                  type="checkbox"
                  checked={selectedItems.fadeValues}
                  onChange={() => handleCheckboxChange('fadeValues')}
                />
                <span className="checkmark"></span>
                <div className="option-content">
                  <div className="option-title">Fade Effects</div>
                  <div className="option-details">
                    Video: {sessionState.fadeIn}s in, {sessionState.fadeOut}s out | 
                    Audio: {sessionState.audioFadeIn}s in, {sessionState.audioFadeOut}s out
                  </div>
                </div>
              </label>
            </div>
            
            <div className="restore-option">
              <label className="restore-checkbox">
                <input
                  type="checkbox"
                  checked={selectedItems.silenceValues}
                  onChange={() => handleCheckboxChange('silenceValues')}
                />
                <span className="checkmark"></span>
                <div className="option-content">
                  <div className="option-title">Silence Settings</div>
                  <div className="option-details">
                    {sessionState.silenceAtStart}s silence at start
                  </div>
                </div>
              </label>
            </div>
            
            <div className="restore-option">
              <label className="restore-checkbox">
                <input
                  type="checkbox"
                  checked={selectedItems.exportType}
                  onChange={() => handleCheckboxChange('exportType')}
                />
                <span className="checkmark"></span>
                <div className="option-content">
                  <div className="option-title">Export Type</div>
                  <div className="option-details">
                    {sessionState.exportType === 'audio' ? 'Audio Only (.wav)' : 'Video + Audio (.mp4)'}
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>
        
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={handleSkip}>
            Skip
          </button>
          <button className="btn" onClick={handleRestore}>
            Restore Selected
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionRestoreModal;
