import React, { useRef, useState, useCallback } from 'react';

const Timeline = ({ currentTime, duration, inPoint, outPoint, onSeek, onSetInPoint, onSetOutPoint, formatTime, hasVideo = false, onPreviewClip, isPreviewMode = false }) => {
  const timelineRef = useRef(null);
  const clipTrackRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState(null); // 'playhead', 'in', 'out'
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartValue, setDragStartValue] = useState(0);
  const [showTooltip, setShowTooltip] = useState({ show: false, x: 0, time: 0, type: '' });
  const [dragTooltip, setDragTooltip] = useState({ show: false, x: 0, time: 0, type: '' });
  const [activeMode, setActiveMode] = useState(null); // 'in', 'out', or null
  const [editingField, setEditingField] = useState(null); // 'in' or 'out'
  const [editValue, setEditValue] = useState('');

  const getTimeFromPosition = useCallback((clientX, trackRef = null) => {
    const ref = trackRef || timelineRef.current || clipTrackRef.current;
    if (!ref || duration === 0) return 0;
    const rect = ref.getBoundingClientRect();
    const x = clientX - rect.left;
    // Account for the 15px margin on each side (30px total)
    const effectiveWidth = rect.width - 30;
    const percentage = Math.max(0, Math.min(1, x / effectiveWidth));
    return percentage * duration;
  }, [duration]);

  const getPositionFromTime = useCallback((time) => {
    if (duration === 0) return 0;
    return (time / duration) * 100;
  }, [duration]);

  const getTrackWidth = useCallback(() => {
    const ref = timelineRef.current || clipTrackRef.current;
    if (!ref) return 0;
    // Account for the 15px margin on each side (30px total)
    return ref.getBoundingClientRect().width - 30;
  }, []);

  const handleMouseDown = useCallback((e, type = 'playhead') => {
    if (!hasVideo) return; // Disable interactions when no video is loaded
    
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragging(true);
    setDragType(type);
    setDragStartX(e.clientX);
    
    // Store the starting value for the drag operation
    switch (type) {
      case 'playhead':
        setDragStartValue(currentTime);
        onSeek(getTimeFromPosition(e.clientX));
        break;
      case 'in':
        setDragStartValue(inPoint);
        break;
      case 'out':
        setDragStartValue(outPoint);
        break;
    }
  }, [currentTime, inPoint, outPoint, getTimeFromPosition, onSeek, hasVideo]);

  const handleMouseMove = useCallback((e) => {
    // Show tooltip on hover (only for main track when not dragging)
    if (!isDragging && timelineRef.current) {
      const rect = timelineRef.current.getBoundingClientRect();
      const isOverMainTrack = e.target.closest('.timeline-main-track');
      
      if (isOverMainTrack) {
        const time = getTimeFromPosition(e.clientX, timelineRef.current);
        setShowTooltip({
          show: true,
          x: e.clientX - rect.left,
          time: time,
          type: 'hover'
        });
      } else {
        setShowTooltip({ show: false, x: 0, time: 0, type: '' });
      }
    }
    
    if (isDragging && dragType) {
      const deltaX = e.clientX - dragStartX;
      const trackWidth = getTrackWidth();
      const deltaTime = (deltaX / trackWidth) * duration;
      
      let newTime;
      switch (dragType) {
        case 'playhead':
          newTime = Math.max(0, Math.min(duration, dragStartValue + deltaTime));
          onSeek(newTime);
          break;
        case 'in':
          // IN point cannot go past OUT point
          newTime = Math.max(0, Math.min(outPoint - 0.1, dragStartValue + deltaTime));
          onSetInPoint(newTime);
          break;
        case 'out':
          // OUT point cannot go before IN point
          newTime = Math.max(inPoint + 0.1, Math.min(duration, dragStartValue + deltaTime));
          onSetOutPoint(newTime);
          break;
      }
      
      // Show drag tooltip with correct positioning
      if (dragType === 'playhead' && timelineRef.current) {
        const rect = timelineRef.current.getBoundingClientRect();
        setDragTooltip({
          show: true,
          x: e.clientX - rect.left,
          time: newTime,
          type: dragType
        });
      } else if ((dragType === 'in' || dragType === 'out') && clipTrackRef.current) {
        const rect = clipTrackRef.current.getBoundingClientRect();
        setDragTooltip({
          show: true,
          x: e.clientX - rect.left,
          time: newTime,
          type: dragType
        });
      }
    }
  }, [isDragging, dragType, dragStartX, dragStartValue, duration, getTrackWidth, onSeek, onSetInPoint, onSetOutPoint, inPoint, outPoint, getTimeFromPosition]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragType(null);
    setDragStartX(0);
    setDragStartValue(0);
    setDragTooltip({ show: false, x: 0, time: 0, type: '' });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setShowTooltip({ show: false, x: 0, time: 0, type: '' });
  }, []);

  const handleClipTrackClick = useCallback((e) => {
    if (!hasVideo || !activeMode) return;
    
    console.log('Clip track clicked in mode:', activeMode);
    
    // Get the click position relative to the clip track
    const rect = clipTrackRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const trackWidth = rect.width - 30; // Account for margins
    const clickPercentage = Math.max(0, Math.min(1, clickX / trackWidth));
    const clickTime = clickPercentage * duration;
    
    console.log('Click calculations:', { clickX, trackWidth, clickPercentage, clickTime, formattedTime: formatTime(clickTime) });
    
    // Set the point based on active mode with constraints
    if (activeMode === 'in') {
      // IN point cannot go past OUT point
      const newInPoint = Math.min(clickTime, outPoint - 0.1);
      onSetInPoint(newInPoint);
      console.log(`Set IN point to: ${formatTime(newInPoint)}`);
    } else if (activeMode === 'out') {
      // OUT point cannot go before IN point
      const newOutPoint = Math.max(clickTime, inPoint + 0.1);
      onSetOutPoint(newOutPoint);
      console.log(`Set OUT point to: ${formatTime(newOutPoint)}`);
    }
  }, [duration, onSetInPoint, onSetOutPoint, hasVideo, formatTime, activeMode, inPoint, outPoint]);

  const handleInButtonClick = useCallback(() => {
    setActiveMode(activeMode === 'in' ? null : 'in');
    console.log('IN button clicked, active mode:', activeMode === 'in' ? null : 'in');
  }, [activeMode]);

  const handleOutButtonClick = useCallback(() => {
    setActiveMode(activeMode === 'out' ? null : 'out');
    console.log('OUT button clicked, active mode:', activeMode === 'out' ? null : 'out');
  }, [activeMode]);

  // Time editing functions
  const parseTimeInput = useCallback((input) => {
    // Parse HH:MM:SS:ms format
    const parts = input.split(':');
    if (parts.length === 4) {
      const hours = parseInt(parts[0]) || 0;
      const minutes = parseInt(parts[1]) || 0;
      const seconds = parseInt(parts[2]) || 0;
      const milliseconds = parseInt(parts[3]) || 0;
      return hours * 3600 + minutes * 60 + seconds + milliseconds / 1000;
    }
    return null;
  }, []);

  const handleTimeClick = useCallback((field) => {
    setEditingField(field);
    setEditValue(field === 'in' ? formatTime(inPoint) : formatTime(outPoint));
  }, [inPoint, outPoint, formatTime]);

  const handleTimeInputChange = useCallback((e) => {
    setEditValue(e.target.value);
  }, []);

  const handleTimeInputKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      const newTime = parseTimeInput(editValue);
      if (newTime !== null && newTime >= 0 && newTime <= duration) {
        if (editingField === 'in') {
          // IN point cannot go past OUT point
          const constrainedTime = Math.min(newTime, outPoint - 0.1);
          onSetInPoint(constrainedTime);
        } else if (editingField === 'out') {
          // OUT point cannot go before IN point
          const constrainedTime = Math.max(newTime, inPoint + 0.1);
          onSetOutPoint(constrainedTime);
        }
      }
      setEditingField(null);
      setEditValue('');
    } else if (e.key === 'Escape') {
      setEditingField(null);
      setEditValue('');
    }
  }, [editValue, editingField, duration, inPoint, outPoint, onSetInPoint, onSetOutPoint, parseTimeInput]);

  const handleTimeInputBlur = useCallback(() => {
    setEditingField(null);
    setEditValue('');
  }, []);

  // Calculate positions for IN and OUT points independently
  const inPointPercentage = duration > 0 ? (inPoint / duration) * 100 : 0;
  const outPointPercentage = duration > 0 ? (outPoint / duration) * 100 : 0;
  const clipWidth = Math.max(0, outPointPercentage - inPointPercentage);
  
  // Debug logging
  console.log('Timeline state:', { 
    duration, 
    inPoint, 
    outPoint, 
    inPointPercentage, 
    outPointPercentage, 
    clipWidth,
    formattedIn: formatTime(inPoint),
    formattedOut: formatTime(outPoint)
  });

  React.useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseMove = (e) => {
        handleMouseMove(e);
      };
      
      const handleGlobalMouseUp = (e) => {
        handleMouseUp(e);
      };

      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
      
      // Prevent text selection while dragging
      document.body.style.userSelect = 'none';

      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);
        document.body.style.userSelect = '';
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="timeline">
      <div className="timeline-markers">
        <span>0:00</span>
        <span>{formatTime(duration)}</span>
      </div>
      
      {/* Main Timeline Track */}
      <div
        ref={timelineRef}
        className="timeline-main-track"
        onMouseDown={(e) => handleMouseDown(e, 'playhead')}
        onMouseLeave={handleMouseLeave}
      >
        {/* Background track */}
        <div className="timeline-background" />
        
        {/* Progress fill */}
        <div
          className="timeline-progress"
          style={{ width: `${progressPercentage}%` }}
        />
        
        {/* Playhead Handle */}
        <div
          className="timeline-handle playhead-handle"
          style={{ left: `${progressPercentage}%` }}
          onMouseDown={(e) => {
            e.stopPropagation();
            handleMouseDown(e, 'playhead');
          }}
          title={`Current Time: ${formatTime(currentTime)}`}
        />

        {/* Hover Tooltip */}
        {showTooltip.show && !isDragging && (
          <div
            className="timeline-tooltip"
            style={{ left: `${showTooltip.x}px` }}
          >
            {formatTime(showTooltip.time)}
          </div>
        )}

        {/* Drag Tooltip for playhead */}
        {dragTooltip.show && dragType === 'playhead' && (
          <div
            className="timeline-tooltip drag-tooltip"
            style={{ left: `${dragTooltip.x}px` }}
          >
            {formatTime(dragTooltip.time)}
          </div>
        )}
      </div>

      {/* Video Trimming Track */}
      {duration > 0 && (
        <div 
          ref={clipTrackRef} 
          className={`timeline-clip-track ${activeMode ? 'active-mode' : ''}`}
          onClick={handleClipTrackClick}
          onMouseDown={(e) => {
            // Prevent main track from interfering with clip track
            e.stopPropagation();
          }}
        >
          {/* Clip region background */}
          <div className="clip-track-background" />
          
          {/* Clip region */}
          <div
            className="clip-region"
            style={{
              left: `${inPointPercentage}%`,
              width: `${clipWidth}%`
            }}
          />

          {/* In Point Handle */}
          <div
            className={`timeline-handle in-point-handle ${activeMode === 'in' ? 'active' : ''}`}
            style={{ left: `${inPointPercentage}%` }}
            title={`In Point: ${formatTime(inPoint)}`}
            onMouseDown={activeMode === 'in' ? (e) => {
              e.preventDefault();
              e.stopPropagation();
              handleMouseDown(e, 'in');
            } : undefined}
          >
            <div className="handle-label">IN</div>
          </div>

          {/* Out Point Handle */}
          <div
            className={`timeline-handle out-point-handle ${activeMode === 'out' ? 'active' : ''}`}
            style={{ left: `${outPointPercentage}%` }}
            title={`Out Point: ${formatTime(outPoint)}`}
            onMouseDown={activeMode === 'out' ? (e) => {
              e.preventDefault();
              e.stopPropagation();
              handleMouseDown(e, 'out');
            } : undefined}
          >
            <div className="handle-label">OUT</div>
          </div>

          {/* Clip track labels */}
          <div className="clip-track-label">
            <span>Video Trimming</span>
          </div>
        </div>
      )}

      {/* IN/OUT Control Buttons */}
      {duration > 0 && (
        <div className="timeline-controls">
          <button 
            className={`btn btn-sm ${activeMode === 'in' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={handleInButtonClick}
            disabled={!hasVideo}
          >
            {activeMode === 'in' ? '✓ IN Active' : 'Set IN Point'}
          </button>
          <button 
            className={`btn btn-sm ${activeMode === 'out' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={handleOutButtonClick}
            disabled={!hasVideo}
          >
            {activeMode === 'out' ? '✓ OUT Active' : 'Set OUT Point'}
          </button>
          <button 
            className="btn btn-sm btn-secondary"
            onClick={() => onPreviewClip(inPoint, outPoint)}
            disabled={!hasVideo || outPoint <= inPoint}
            title="Play video between IN and OUT points"
          >
            Preview Clip
          </button>
        </div>
      )}
      
      <div className="timeline-info">
        <div className="timeline-info-section">
          <span className="info-label">Current:</span>
          <span className="info-value">{formatTime(currentTime)}</span>
        </div>
        <div className="timeline-info-section">
          <span className="info-label">In:</span>
          {editingField === 'in' ? (
            <input
              type="text"
              className="time-input"
              value={editValue}
              onChange={handleTimeInputChange}
              onKeyDown={handleTimeInputKeyDown}
              onBlur={handleTimeInputBlur}
              autoFocus
              placeholder="HH:MM:SS:ms"
            />
          ) : (
            <span 
              className="info-value clickable-time"
              onClick={() => handleTimeClick('in')}
              title="Click to edit time"
            >
              {formatTime(inPoint)}
            </span>
          )}
        </div>
        <div className="timeline-info-section">
          <span className="info-label">Out:</span>
          {editingField === 'out' ? (
            <input
              type="text"
              className="time-input"
              value={editValue}
              onChange={handleTimeInputChange}
              onKeyDown={handleTimeInputKeyDown}
              onBlur={handleTimeInputBlur}
              autoFocus
              placeholder="HH:MM:SS:ms"
            />
          ) : (
            <span 
              className="info-value clickable-time"
              onClick={() => handleTimeClick('out')}
              title="Click to edit time"
            >
              {formatTime(outPoint)}
            </span>
          )}
        </div>
        <div className="timeline-info-section">
          <span className="info-label">Duration:</span>
          <span className="info-value">{formatTime(outPoint - inPoint)}</span>
        </div>
      </div>
      
      <div className="timeline-instructions">
        <span>
          Top: Click to seek playback • Bottom: Click IN/OUT buttons, then click timeline to position • Green=IN, Red=OUT
          {isPreviewMode && <span style={{ color: '#4a9eff', fontWeight: 'bold' }}> • Preview Mode Active</span>}
        </span>
      </div>
    </div>
  );
};

export default Timeline;
