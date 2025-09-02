import React, { useState, useEffect, useRef } from 'react';

const ExportProgressOverlay = ({ 
  isVisible, 
  progress, 
  exportType, 
  onCancel,
  sourceFile,
  outputFile,
  exportOptions,
  isPreparing = false
}) => {
  const [startTime, setStartTime] = useState(null);
  const [estimatedTimeLeft, setEstimatedTimeLeft] = useState(null);
  const [displayProgress, setDisplayProgress] = useState(0);
  const lastValidProgressRef = useRef(0);

  // Debug logging for all prop changes
  console.log('ExportProgressOverlay render:', { 
    isVisible, 
    progress, 
    displayProgress, 
    isPreparing,
    progressIsNaN: isNaN(progress)
  });

  // Helper function to validate progress value
  const isValidProgress = (value) => {
    return !isNaN(value) && value != null && isFinite(value) && value >= 0 && value <= 100;
  };

  // Helper function to get safe progress value for display
  // Note: displayProgress should never be NaN since we only update it with valid values
  const getSafeProgress = (value) => {
    return isNaN(value) ? 0 : value;
  };

  // Reset display progress when export starts/stops
  useEffect(() => {
    if (!isVisible) {
      console.log('Export overlay hidden, resetting progress to 0');
      setDisplayProgress(0);
    }
  }, [isVisible]);

  // Update display progress only with valid values that don't go backwards
  useEffect(() => {
    if (isValidProgress(progress)) {
      // Store the valid progress in ref
      lastValidProgressRef.current = progress;
      
      // Only update if progress is moving forward or is significantly different
      if (progress >= displayProgress || Math.abs(progress - displayProgress) > 5) {
        const newProgress = Math.min(100, Math.max(0, progress));
        console.log(`Progress update: ${progress} -> ${newProgress} (was: ${displayProgress})`);
        setDisplayProgress(newProgress);
      }
    } else {
      console.log(`Invalid progress received: ${progress} (keeping: ${displayProgress}, lastValid: ${lastValidProgressRef.current})`);
      // Use the last valid progress from ref if current displayProgress is somehow invalid
      if (isNaN(displayProgress) && lastValidProgressRef.current >= 0) {
        console.log(`Restoring from lastValidProgress: ${lastValidProgressRef.current}`);
        setDisplayProgress(lastValidProgressRef.current);
      }
    }
  }, [progress, displayProgress]);

  useEffect(() => {
    if (isVisible && displayProgress > 0 && !isPreparing) {
      if (!startTime) {
        setStartTime(Date.now());
        setEstimatedTimeLeft(null);
      } else {
        // Calculate estimated time remaining
        const elapsed = Date.now() - startTime;
        const progressDecimal = displayProgress / 100;
        
        // Only calculate if we have meaningful progress (> 1%) to avoid wild estimates
        if (progressDecimal > 0.01) {
          const totalEstimatedTime = elapsed / progressDecimal;
          const remaining = totalEstimatedTime - elapsed;
          
          // If progress is very high (>95%), show minimal time or "almost done"
          if (displayProgress >= 95) {
            setEstimatedTimeLeft(Math.min(remaining, 10000)); // Cap at 10 seconds max
          } else {
            // Apply light smoothing only if we have a previous estimate and the change isn't too dramatic
            const currentEstimate = Math.max(0, remaining);
            
            if (estimatedTimeLeft !== null) {
              const changeRatio = Math.abs(currentEstimate - estimatedTimeLeft) / estimatedTimeLeft;
              
              // If change is dramatic (>50%), don't smooth - use new estimate
              if (changeRatio > 0.5) {
                setEstimatedTimeLeft(currentEstimate);
              } else {
                // Light smoothing for small changes
                const smoothingFactor = 0.4;
                const smoothedRemaining = (currentEstimate * smoothingFactor) + (estimatedTimeLeft * (1 - smoothingFactor));
                setEstimatedTimeLeft(Math.max(0, smoothedRemaining));
              }
            } else {
              setEstimatedTimeLeft(currentEstimate);
            }
          }
        }
      }
    } else if (!isVisible || isPreparing) {
      setStartTime(null);
      setEstimatedTimeLeft(null);
    }
  }, [isVisible, displayProgress, isPreparing]);

  const formatTime = (milliseconds) => {
    if (!milliseconds || milliseconds < 0) return 'Calculating...';
    
    const totalSeconds = Math.ceil(milliseconds / 1000); // Round up to avoid showing 0 seconds when close
    
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!isVisible) return null;

  return (
    <div className="export-progress-overlay">
      <div className="export-progress-container">
        <div className="export-progress-title">
          {isPreparing ? 'Preparing Export...' : `Exporting ${exportType === 'audio' ? 'Audio' : 'Video'}`}
        </div>
        
        <div className="export-progress-message">
          {isPreparing 
            ? 'Preparing your export, please wait...'
            : `Please wait while your ${exportType === 'audio' ? 'audio' : 'video'} is being processed...`
          }
        </div>

        {isPreparing && (
          <div className="export-preparing-indicator">
            <div className="preparing-spinner"></div>
          </div>
        )}
        
        {!isPreparing && (
          <div className="export-progress-bar-container">
            <div className="export-progress-bar">
              <div 
                className="export-progress-fill" 
                style={{ 
                  width: `${(() => {
                    const safeProgress = getSafeProgress(displayProgress);
                    const finalWidth = safeProgress >= 98 ? 100 : Math.max(0, Math.min(100, safeProgress));
                    console.log(`Progress bar width: ${finalWidth}% (from displayProgress: ${displayProgress})`);
                    return isNaN(finalWidth) ? 0 : finalWidth;
                  })()}%`
                }}
              />
            </div>
            
            <div className="export-progress-text">
              <span className="export-progress-percentage">
                {Math.round(getSafeProgress(displayProgress))}%
              </span>
              <span className="export-progress-time">
                {getSafeProgress(displayProgress) >= 98 ? 'Almost done...' : 
                 getSafeProgress(displayProgress) >= 95 ? 'Finishing up...' :
                 estimatedTimeLeft && estimatedTimeLeft > 1000 ? `${formatTime(estimatedTimeLeft)} remaining` : 'Calculating time...'}
              </span>
            </div>
          </div>
        )}

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
                  {exportOptions.startTime.toFixed(2)}s - {(exportOptions.startTime + (isNaN(exportOptions.duration) ? 0 : exportOptions.duration)).toFixed(2)}s 
                  ({isNaN(exportOptions.duration) ? 'Unknown' : exportOptions.duration.toFixed(2)}s duration)
                </span>
              </div>
              
              {(exportOptions.fadeIn > 0 || exportOptions.fadeOut > 0) && (
                <div className="export-detail-row">
                  <span className="export-detail-label">Video Fades:</span>
                  <span className="export-detail-value">
                    {exportOptions.fadeIn > 0 ? `In: ${exportOptions.fadeIn.toFixed(2)}s` : ''}
                    {exportOptions.fadeIn > 0 && exportOptions.fadeOut > 0 ? ', ' : ''}
                    {exportOptions.fadeOut > 0 ? `Out: ${exportOptions.fadeOut.toFixed(2)}s` : ''}
                  </span>
                </div>
              )}
              
              {(exportOptions.audioFadeIn > 0 || exportOptions.audioFadeOut > 0) && (
                <div className="export-detail-row">
                  <span className="export-detail-label">Audio Fades:</span>
                  <span className="export-detail-value">
                    {exportOptions.audioFadeIn > 0 ? `In: ${exportOptions.audioFadeIn.toFixed(2)}s` : ''}
                    {exportOptions.audioFadeIn > 0 && exportOptions.audioFadeOut > 0 ? ', ' : ''}
                    {exportOptions.audioFadeOut > 0 ? `Out: ${exportOptions.audioFadeOut.toFixed(2)}s` : ''}
                  </span>
                </div>
              )}
              
              {exportOptions.silenceAtStart > 0 && (
                <div className="export-detail-row">
                  <span className="export-detail-label">Silence:</span>
                  <span className="export-detail-value">{exportOptions.silenceAtStart.toFixed(2)}s at start</span>
                </div>
              )}
              
              {exportOptions.blackScreenAtStart > 0 && (
                <div className="export-detail-row">
                  <span className="export-detail-label">Black Screen:</span>
                  <span className="export-detail-value">{exportOptions.blackScreenAtStart.toFixed(2)}s at start</span>
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
            {isPreparing ? 'Cancel' : 'Cancel Export'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportProgressOverlay;
