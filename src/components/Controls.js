import React from 'react';
import Timeline from './Timeline';

const Controls = ({
  isPlaying,
  onPlayPause,
  onSetInPoint,
  onSetOutPoint,
  onClearClipPoints,
  inPoint,
  outPoint,
  fadeIn,
  fadeOut,
  onFadeInChange,
  onFadeOutChange,
  audioFadeIn,
  audioFadeOut,
  onAudioFadeInChange,
  onAudioFadeOutChange,
  silenceAtStart,
  onSilenceAtStartChange,
  blackScreenAtStart,
  onBlackScreenAtStartChange,
  exportQuality,
  onExportQualityChange,
  exportSize,
  onExportSizeChange,
  onExport,
  onCancelExport,
  isProcessing,
  processingProgress,
  formatTime,
  hasVideo,
  exportType,
  onExportTypeChange,
  currentTime,
  duration,
  onSeek
}) => {
  const clipDuration = outPoint - inPoint;
  const maxFadeIn = clipDuration / 2;
  const maxFadeOut = clipDuration / 2;
  const maxAudioFadeIn = clipDuration / 2;
  const maxAudioFadeOut = clipDuration / 2;

  return (
    <div className="controls">
      {/* Timeline at the top */}
      <div className="control-section">
        <Timeline
          currentTime={currentTime}
          duration={duration}
          inPoint={inPoint}
          outPoint={outPoint}
          onSeek={onSeek}
          onSetInPoint={onSetInPoint}
          onSetOutPoint={onSetOutPoint}
          formatTime={formatTime}
        />
      </div>

      {/* Horizontal Control Panes */}
      <div className="controls-grid">


        {/* Clip Selection */}
        <div className="control-pane">
          <h3>Clip Selection</h3>
          <div className="control-row">
            <button 
              className="btn btn-secondary" 
              onClick={onSetInPoint}
              disabled={!hasVideo}
            >
              Set In Point
            </button>
            <span className="status-text">In: {formatTime(inPoint)}</span>
          </div>
          <div className="control-row">
            <button 
              className="btn btn-secondary" 
              onClick={onSetOutPoint}
              disabled={!hasVideo}
            >
              Set Out Point
            </button>
            <span className="status-text">Out: {formatTime(outPoint)}</span>
          </div>
          <div className="control-row">
            <span className="status-text">
              Clip Duration: {formatTime(clipDuration)}
            </span>
          </div>
          <div className="control-row">
            <button 
              className="btn btn-secondary" 
              onClick={onClearClipPoints}
              disabled={!hasVideo}
            >
              Clear Clip Points
            </button>
          </div>
          <div className="control-row">
            <span className="status-text">
              Keyboard shortcuts: Space (Play/Pause), ← → (Skip 10s)
            </span>
          </div>
        </div>

        {/* Video Fade Effects */}
        <div className="control-pane">
          <h3>Video Fade Effects</h3>
          <div className="control-row">
            <div className="input-group">
              <label>Video Fade In:</label>
              <input
                type="number"
                min="0"
                max={maxFadeIn}
                step="0.1"
                value={fadeIn}
                onChange={(e) => onFadeInChange(parseFloat(e.target.value) || 0)}
                disabled={!hasVideo}
              />
              <span className="status-text">seconds</span>
            </div>
          </div>
          <div className="control-row">
            <div className="input-group">
              <label>Video Fade Out:</label>
              <input
                type="number"
                min="0"
                max={maxFadeOut}
                step="0.1"
                value={fadeOut}
                onChange={(e) => onFadeOutChange(parseFloat(e.target.value) || 0)}
                disabled={!hasVideo}
              />
              <span className="status-text">seconds</span>
            </div>
          </div>
        </div>

        {/* Audio Fade Effects */}
        <div className="control-pane">
          <h3>Audio Fade Effects</h3>
          <div className="control-row">
            <div className="input-group">
              <label>Audio Fade In:</label>
              <input
                type="number"
                min="0"
                max={maxAudioFadeIn}
                step="0.1"
                value={audioFadeIn}
                onChange={(e) => onAudioFadeInChange(parseFloat(e.target.value) || 0)}
                disabled={!hasVideo}
              />
              <span className="status-text">seconds</span>
            </div>
          </div>
          <div className="control-row">
            <div className="input-group">
              <label>Audio Fade Out:</label>
              <input
                type="number"
                min="0"
                max={maxAudioFadeOut}
                step="0.1"
                value={audioFadeOut}
                onChange={(e) => onAudioFadeOutChange(parseFloat(e.target.value) || 0)}
                disabled={!hasVideo}
              />
              <span className="status-text">seconds</span>
            </div>
          </div>
        </div>

        {/* Audio Silence Control */}
        <div className="control-pane">
          <h3>Audio Silence</h3>
          <div className="control-row">
            <div className="input-group">
              <label>Silence at Start:</label>
              <input
                type="number"
                min="0"
                max="30"
                step="0.1"
                value={silenceAtStart}
                onChange={(e) => onSilenceAtStartChange(parseFloat(e.target.value) || 0)}
                disabled={!hasVideo}
              />
              <span className="status-text">seconds</span>
            </div>
          </div>
          <div className="control-row">
            <span className="status-text">
              Adds silence before audio fade-in effect
            </span>
          </div>
        </div>

        {/* Black Screen Control */}
        <div className="control-pane">
          <h3>Black Screen</h3>
          <div className="control-row">
            <div className="input-group">
              <label>Black Screen at Start:</label>
              <input
                type="number"
                min="0"
                max="30"
                step="0.1"
                value={blackScreenAtStart}
                onChange={(e) => onBlackScreenAtStartChange(parseFloat(e.target.value) || 0)}
                disabled={!hasVideo}
              />
              <span className="status-text">seconds</span>
            </div>
          </div>
          <div className="control-row">
            <span className="status-text">
              Adds black screen before video fade-in effect
            </span>
          </div>
        </div>

        {/* Export Options */}
        {exportType === 'video' && (
          <div className="control-pane">
            <h3>Export Options</h3>
            <div className="control-row">
              <div className="input-group">
                <label>Quality:</label>
                <select
                  value={exportQuality}
                  onChange={(e) => onExportQualityChange(e.target.value)}
                  disabled={!hasVideo}
                >
                  <option value="low">Low (Smaller file)</option>
                  <option value="medium">Medium (Balanced)</option>
                  <option value="high">High (Best quality)</option>
                </select>
              </div>
            </div>
            <div className="control-row">
              <div className="input-group">
                <label>Size:</label>
                <select
                  value={exportSize}
                  onChange={(e) => onExportSizeChange(parseInt(e.target.value))}
                  disabled={!hasVideo}
                >
                  <option value={25}>25% (Quarter size)</option>
                  <option value={50}>50% (Half size)</option>
                  <option value={75}>75% (Three quarters)</option>
                  <option value={100}>100% (Original size)</option>
                </select>
              </div>
            </div>
            <div className="control-row">
              <span className="status-text">
                Quality affects file size and processing time. Size affects video dimensions.
              </span>
            </div>
          </div>
        )}

        {/* Export */}
        <div className="control-pane">
          <h3>Export</h3>
          <div className="control-row">
            <div className="export-type-group">
              <label className="export-type-label">Export Type:</label>
              <div className="radio-group">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="exportType"
                    value="video"
                    checked={exportType === 'video'}
                    onChange={(e) => onExportTypeChange(e.target.value)}
                    disabled={!hasVideo}
                  />
                  Video + Audio (.mp4)
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="exportType"
                    value="audio"
                    checked={exportType === 'audio'}
                    onChange={(e) => onExportTypeChange(e.target.value)}
                    disabled={!hasVideo}
                  />
                  Audio Only (.wav)
                </label>
              </div>
            </div>
          </div>
          <div className="control-row export-buttons">
            <button 
              className="btn btn-danger" 
              onClick={onExport}
              disabled={!hasVideo || isProcessing || clipDuration <= 0}
            >
              {isProcessing ? 'Processing...' : `Export ${exportType === 'audio' ? 'Audio' : 'Video'}`}
            </button>
            
            {isProcessing && (
              <button 
                className="btn btn-secondary" 
                onClick={onCancelExport}
              >
                Cancel
              </button>
            )}
          </div>
          
          
        </div>
      </div>
    </div>
  );
};

export default Controls;
