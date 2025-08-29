import React, { useRef, useState, useCallback } from 'react';

const Timeline = ({ currentTime, duration, inPoint, outPoint, onSeek, onSetInPoint, onSetOutPoint, formatTime, hasVideo = false, onPreviewClip, isPreviewMode = false }) => {
  const timelineRef = useRef(null);
  const clipTrackRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState(null); // 'playhead', 'in', 'out', 'range'
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartValue, setDragStartValue] = useState(0);
  const [showTooltip, setShowTooltip] = useState({ show: false, x: 0, time: 0, type: '' });
  const [dragTooltip, setDragTooltip] = useState({ show: false, x: 0, time: 0, type: '' });
  const [editingField, setEditingField] = useState(null); // 'in' or 'out'
  const [editValue, setEditValue] = useState('');
  const [contextMenu, setContextMenu] = useState({ show: false, x: 0, y: 0, time: 0 });
  const [isRangeSelecting, setIsRangeSelecting] = useState(false);
  const [rangeStart, setRangeStart] = useState(0);

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
    
    // Hide context menu if open
    setContextMenu({ show: false, x: 0, y: 0, time: 0 });
    
    // Handle range selection for clip track
    if (type === 'range' && e.shiftKey) {
      setIsRangeSelecting(true);
      const time = getTimeFromPosition(e.clientX);
      setRangeStart(time);
      return;
    }
    
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
      case 'range':
        // Start range selection
        const time = getTimeFromPosition(e.clientX);
        setRangeStart(time);
        setIsRangeSelecting(true);
        break;
    }
  }, [currentTime, inPoint, outPoint, getTimeFromPosition, onSeek, hasVideo]);

  const handleMouseMove = useCallback((e) => {
    // Show tooltip on hover (only for main track when not dragging)
    if (!isDragging && !isRangeSelecting && timelineRef.current) {
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
    
    // Handle range selection
    if (isRangeSelecting && clipTrackRef.current) {
      const currentTime = getTimeFromPosition(e.clientX);
      const startTime = Math.min(rangeStart, currentTime);
      const endTime = Math.max(rangeStart, currentTime);
      
      // Update in/out points during range selection
      onSetInPoint(Math.max(0, startTime));
      onSetOutPoint(Math.min(duration, endTime));
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
  }, [isDragging, isRangeSelecting, dragType, dragStartX, dragStartValue, duration, getTrackWidth, onSeek, onSetInPoint, onSetOutPoint, inPoint, outPoint, getTimeFromPosition, rangeStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragType(null);
    setDragStartX(0);
    setDragStartValue(0);
    setDragTooltip({ show: false, x: 0, time: 0, type: '' });
    setIsRangeSelecting(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setShowTooltip({ show: false, x: 0, time: 0, type: '' });
  }, []);
  
  const handleContextMenu = useCallback((e) => {
    if (!hasVideo) return;
    
    e.preventDefault();
    const time = getTimeFromPosition(e.clientX);
    
    setContextMenu({
      show: true,
      x: e.clientX,
      y: e.clientY,
      time: time
    });
  }, [hasVideo, getTimeFromPosition]);
  
  const handleContextMenuAction = useCallback((action, time) => {
    switch (action) {
      case 'setIn':
        onSetInPoint(Math.min(time, outPoint - 0.1));
        break;
      case 'setOut':
        onSetOutPoint(Math.max(time, inPoint + 0.1));
        break;
      case 'seek':
        onSeek(time);
        break;
      case 'setBoth':
        // Set current position as in-point and extend 10 seconds for out-point
        const newOutPoint = Math.min(time + 10, duration);
        onSetInPoint(time);
        onSetOutPoint(newOutPoint);
        break;
    }
    setContextMenu({ show: false, x: 0, y: 0, time: 0 });
  }, [onSetInPoint, onSetOutPoint, onSeek, inPoint, outPoint, duration]);
  
  const hideContextMenu = useCallback(() => {
    setContextMenu({ show: false, x: 0, y: 0, time: 0 });
  }, []);

  const handleClipTrackClick = useCallback((e) => {
    if (!hasVideo) return;
    
    // If shift is held, start range selection
    if (e.shiftKey) {
      handleMouseDown(e, 'range');
      return;
    }
    
    // Otherwise, seek to clicked position
    const time = getTimeFromPosition(e.clientX);
    onSeek(time);
  }, [hasVideo, handleMouseDown, getTimeFromPosition, onSeek]);

  const handleSetInAtCurrent = useCallback(() => {
    onSetInPoint(Math.min(currentTime, outPoint - 0.1));
  }, [currentTime, outPoint, onSetInPoint]);

  const handleSetOutAtCurrent = useCallback(() => {
    onSetOutPoint(Math.max(currentTime, inPoint + 0.1));
  }, [currentTime, inPoint, onSetOutPoint]);
  
  const handleClearInOut = useCallback(() => {
    onSetInPoint(0);
    onSetOutPoint(duration);
  }, [onSetInPoint, onSetOutPoint, duration]);
  
  const handleExtendSelection = useCallback((seconds) => {
    const newInPoint = Math.max(0, inPoint - seconds);
    const newOutPoint = Math.min(duration, outPoint + seconds);
    onSetInPoint(newInPoint);
    onSetOutPoint(newOutPoint);
  }, [inPoint, outPoint, duration, onSetInPoint, onSetOutPoint]);

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

  React.useEffect(() => {
    if (isDragging || isRangeSelecting) {
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
  }, [isDragging, isRangeSelecting, handleMouseMove, handleMouseUp]);
  
  // Close context menu when clicking elsewhere
  React.useEffect(() => {
    if (contextMenu.show) {
      const handleClickOutside = () => hideContextMenu();
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [contextMenu.show, hideContextMenu]);

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
        onContextMenu={handleContextMenu}
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
          className="timeline-clip-track"
          onClick={handleClipTrackClick}
          onContextMenu={handleContextMenu}
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

          {/* In Point Handle - Always draggable */}
          <div
            className="timeline-handle in-point-handle"
            style={{ left: `${inPointPercentage}%` }}
            title={`In Point: ${formatTime(inPoint)} - Drag to adjust`}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleMouseDown(e, 'in');
            }}
          >
            <div className="handle-label">IN</div>
          </div>

          {/* Out Point Handle - Always draggable */}
          <div
            className="timeline-handle out-point-handle"
            style={{ left: `${outPointPercentage}%` }}
            title={`Out Point: ${formatTime(outPoint)} - Drag to adjust`}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleMouseDown(e, 'out');
            }}
          >
            <div className="handle-label">OUT</div>
          </div>

          {/* Clip track labels */}
          <div className="clip-track-label">
            <span>Video Trimming</span>
          </div>
        </div>
      )}

      {/* Enhanced Control Buttons */}
      {duration > 0 && (
        <div className="timeline-controls">
          <button 
            className="btn btn-sm btn-secondary"
            onClick={handleSetInAtCurrent}
            disabled={!hasVideo}
            title="Set IN point at current playhead position (I)"
          >
            <span className="button-playhead-icon"></span>
            Set IN Here
          </button>
          <button 
            className="btn btn-sm btn-secondary"
            onClick={handleSetOutAtCurrent}
            disabled={!hasVideo}
            title="Set OUT point at current playhead position (O)"
          >
            <span className="button-playhead-icon"></span>
            Set OUT Here
          </button>
          <button 
            className={`btn btn-sm ${isPreviewMode ? 'btn-primary preview-active' : 'btn-secondary'}`}
            onClick={() => onPreviewClip(inPoint, outPoint)}
            disabled={!hasVideo || outPoint <= inPoint}
            title={isPreviewMode ? "Preview clip is playing..." : "Play video between IN and OUT points"}
          >
            {isPreviewMode ? (
              <>
                <span className="preview-indicator">●</span> Previewing...
              </>
            ) : (
              <>
                <span className="button-play-icon">▶</span>
                Preview Clip
              </>
            )}
          </button>
          <button 
            className="btn btn-sm btn-outline"
            onClick={handleClearInOut}
            disabled={!hasVideo}
            title="Reset IN and OUT points to full video"
          >
            <span className="button-reset-icon">↻</span>
            Clear Clip Points
          </button>
          <div className="timeline-extend-controls">
            <button 
              className="btn btn-xs btn-outline"
              onClick={() => handleExtendSelection(-5)}
              disabled={!hasVideo}
              title="Extend selection by 5 seconds on each side"
            >
              -5s
            </button>
            <button 
              className="btn btn-xs btn-outline"
              onClick={() => handleExtendSelection(5)}
              disabled={!hasVideo}
              title="Shrink selection by 5 seconds on each side"
            >
              +5s
            </button>
          </div>
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
          Click to seek • Drag handles to adjust IN/OUT • Right-click for options • Shift+drag to select range
          {isPreviewMode && (
            <span className="preview-mode-indicator">
              <span className="preview-dot">●</span> Preview clip playing - adjust OUT point to change end time
            </span>
          )}
        </span>
      </div>
      
      {/* Context Menu */}
      {contextMenu.show && (
        <div 
          className="timeline-context-menu"
          style={{ 
            left: contextMenu.x, 
            top: contextMenu.y,
            position: 'fixed',
            zIndex: 1000
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="context-menu-header">
            At {formatTime(contextMenu.time)}
          </div>
          <button 
            className="context-menu-item"
            onClick={() => handleContextMenuAction('seek', contextMenu.time)}
          >
            Seek Here
          </button>
          <button 
            className="context-menu-item"
            onClick={() => handleContextMenuAction('setIn', contextMenu.time)}
          >
            Set IN Point
          </button>
          <button 
            className="context-menu-item"
            onClick={() => handleContextMenuAction('setOut', contextMenu.time)}
          >
            Set OUT Point
          </button>
          <button 
            className="context-menu-item"
            onClick={() => handleContextMenuAction('setBoth', contextMenu.time)}
          >
            Set 10s Clip Here
          </button>
        </div>
      )}
    </div>
  );
};

export default Timeline;
