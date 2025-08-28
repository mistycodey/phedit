import React, { useState, useEffect } from 'react';

const ExportProgressOverlay = ({ 
  isVisible, 
  progress, 
  exportType, 
  onCancel,
  sourceFile,
  outputFile,
  exportOptions
}) => {
  const [startTime, setStartTime] = useState(null);
  const [estimatedTimeLeft, setEstimatedTimeLeft] = useState(null);

  useEffect(() => {
    if (isVisible && progress > 0) {
      if (!startTime) {
        setStartTime(Date.now());
      } else {
        // Calculate estimated time remaining
        const elapsed = Date.now() - startTime;
        const progressDecimal = progress / 100;
        const totalEstimatedTime = elapsed / progressDecimal;
        const remaining = totalEstimatedTime - elapsed;
        setEstimatedTimeLeft(Math.max(0, remaining));
      }
    } else if (!isVisible) {
      setStartTime(null);
      setEstimatedTimeLeft(null);
    }
  }, [isVisible, progress, startTime]);

  const formatTime = (milliseconds) => {
    if (!milliseconds || milliseconds < 0) return '--:--';
    
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (!isVisible) return null;

  return (
    <div className="export-progress-overlay">
      <div className="export-progress-container">
        <div className="export-progress-title">
          Exporting {exportType === 'audio' ? 'Audio' : 'Video'}
        </div>
        
        <div className="export-progress-message">
          Please wait while your {exportType === 'audio' ? 'audio' : 'video'} is being processed...
        </div>
        
        <div className="export-progress-bar-container">
          <div className="export-progress-bar">
            <div 
              className="export-progress-fill" 
              style={{ width: `${progress}%` }}
            />
          </div>
          
          <div className="export-progress-text">
            <span className="export-progress-percentage">
              {Math.round(progress)}%
            </span>
            <span className="export-progress-time">
              {estimatedTimeLeft ? `~${formatTime(estimatedTimeLeft)} remaining` : 'Calculating...'}
            </span>
          </div>
        </div>

        {/* Export Details */}
        <div className="export-progress-details">
          <div className="export-detail-section">
            <div className="export-detail-row">
              <span className="export-detail-label">Source:</span>
              <span className="export-detail-value">{sourceFile}</span>
            </div>
            <div className="export-detail-row">
              <span className="export-detail-label">Output:</span>
              <span className="export-detail-value">{outputFile}</span>
            </div>
          </div>

          {exportOptions && (
            <div className="export-detail-section">
              <div className="export-detail-row">
                <span className="export-detail-label">Clip:</span>
                <span className="export-detail-value">
                  {exportOptions.startTime}s - {exportOptions.startTime + exportOptions.duration}s 
                  ({exportOptions.duration}s duration)
                </span>
              </div>
              
              {(exportOptions.fadeIn > 0 || exportOptions.fadeOut > 0) && (
                <div className="export-detail-row">
                  <span className="export-detail-label">Video Fades:</span>
                  <span className="export-detail-value">
                    {exportOptions.fadeIn > 0 ? `In: ${exportOptions.fadeIn}s` : ''}
                    {exportOptions.fadeIn > 0 && exportOptions.fadeOut > 0 ? ', ' : ''}
                    {exportOptions.fadeOut > 0 ? `Out: ${exportOptions.fadeOut}s` : ''}
                  </span>
                </div>
              )}
              
              {(exportOptions.audioFadeIn > 0 || exportOptions.audioFadeOut > 0) && (
                <div className="export-detail-row">
                  <span className="export-detail-label">Audio Fades:</span>
                  <span className="export-detail-value">
                    {exportOptions.audioFadeIn > 0 ? `In: ${exportOptions.audioFadeIn}s` : ''}
                    {exportOptions.audioFadeIn > 0 && exportOptions.audioFadeOut > 0 ? ', ' : ''}
                    {exportOptions.audioFadeOut > 0 ? `Out: ${exportOptions.audioFadeOut}s` : ''}
                  </span>
                </div>
              )}
              
              {exportOptions.silenceAtStart > 0 && (
                <div className="export-detail-row">
                  <span className="export-detail-label">Silence:</span>
                  <span className="export-detail-value">{exportOptions.silenceAtStart}s at start</span>
                </div>
              )}
              
              {exportOptions.blackScreenAtStart > 0 && (
                <div className="export-detail-row">
                  <span className="export-detail-label">Black Screen:</span>
                  <span className="export-detail-value">{exportOptions.blackScreenAtStart}s at start</span>
                </div>
              )}
              
              {exportType === 'video' && (
                <>
                  <div className="export-detail-row">
                    <span className="export-detail-label">Quality:</span>
                    <span className="export-detail-value">{exportOptions.exportQuality}</span>
                  </div>
                  <div className="export-detail-row">
                    <span className="export-detail-label">Size:</span>
                    <span className="export-detail-value">{exportOptions.exportSize}% of original</span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
        
        <div className="export-progress-cancel">
          <button 
            className="btn btn-secondary" 
            onClick={onCancel}
          >
            Cancel Export
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportProgressOverlay;
