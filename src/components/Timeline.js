import React, { useRef, useState, useCallback } from 'react';

const Timeline = ({ currentTime, duration, inPoint, outPoint, onSeek, onSetInPoint, onSetOutPoint, formatTime, hasVideo = false }) => {
  const timelineRef = useRef(null);
  const clipTrackRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState(null); // 'playhead', 'in', 'out'
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartValue, setDragStartValue] = useState(0);
  const [showTooltip, setShowTooltip] = useState({ show: false, x: 0, time: 0, type: '' });
  const [dragTooltip, setDragTooltip] = useState({ show: false, x: 0, time: 0, type: '' });

  const getTimeFromPosition = useCallback((clientX, trackRef = null) => {
    const ref = trackRef || timelineRef.current || clipTrackRef.current;
    if (!ref || duration === 0) return 0;
    const rect = ref.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    return percentage * duration;
  }, [duration]);

  const getPositionFromTime = useCallback((time) => {
    if (duration === 0) return 0;
    return (time / duration) * 100;
  }, [duration]);

  const getTrackWidth = useCallback(() => {
    const ref = timelineRef.current || clipTrackRef.current;
    if (!ref) return 0;
    return ref.getBoundingClientRect().width;
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
        const time = getTimeFromPosition(e.clientX);
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
          newTime = Math.max(0, Math.min(outPoint - 0.1, dragStartValue + deltaTime));
          onSetInPoint(newTime);
          break;
        case 'out':
          newTime = Math.max(inPoint + 0.1, Math.min(duration, dragStartValue + deltaTime));
          onSetOutPoint(newTime);
          break;
      }
      
      // Show drag tooltip
      const trackRef = dragType === 'playhead' ? timelineRef.current : clipTrackRef.current;
      if (trackRef) {
        const rect = trackRef.getBoundingClientRect();
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

  const handleDoubleClick = useCallback((e) => {
    const time = getTimeFromPosition(e.clientX);
    const currentPercentage = getPositionFromTime(currentTime);
    const clickPercentage = getPositionFromTime(time);
    
    // Set in point if clicking before current time, out point if after
    if (clickPercentage < currentPercentage) {
      onSetInPoint(time);
    } else {
      onSetOutPoint(time);
    }
  }, [getTimeFromPosition, getPositionFromTime, currentTime, onSetInPoint, onSetOutPoint]);

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
  const inPointPercentage = duration > 0 ? (inPoint / duration) * 100 : 0;
  const outPointPercentage = duration > 0 ? (outPoint / duration) * 100 : 0;
  const clipWidth = outPointPercentage - inPointPercentage;

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
        onDoubleClick={handleDoubleClick}
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

      {/* Clip Selection Track */}
      {duration > 0 && (
        <div ref={clipTrackRef} className={`timeline-clip-track ${isDragging && (dragType === 'in' || dragType === 'out') ? 'dragging' : ''}`}>
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
            className="timeline-handle in-point-handle"
            style={{ left: `${inPointPercentage}%` }}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleMouseDown(e, 'in');
            }}
            title={`In Point: ${formatTime(inPoint)}`}
          >
            <div className="handle-label">IN</div>
          </div>

          {/* Out Point Handle */}
          <div
            className="timeline-handle out-point-handle"
            style={{ left: `${outPointPercentage}%` }}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleMouseDown(e, 'out');
            }}
            title={`Out Point: ${formatTime(outPoint)}`}
          >
            <div className="handle-label">OUT</div>
          </div>

          {/* Clip track labels */}
          <div className="clip-track-label">
            <span>Clip Selection</span>
          </div>

          {/* Drag tooltip for clip track */}
          {dragTooltip.show && (dragType === 'in' || dragType === 'out') && (
            <div
              className="timeline-tooltip drag-tooltip"
              style={{ left: `${dragTooltip.x}px` }}
            >
              {dragType === 'in' ? 'IN: ' : 'OUT: '}{formatTime(dragTooltip.time)}
            </div>
          )}
        </div>
      )}
      
      <div className="timeline-info">
        <div className="timeline-info-section">
          <span className="info-label">Current:</span>
          <span className="info-value">{formatTime(currentTime)}</span>
        </div>
        <div className="timeline-info-section">
          <span className="info-label">In:</span>
          <span className="info-value">{formatTime(inPoint)}</span>
        </div>
        <div className="timeline-info-section">
          <span className="info-label">Out:</span>
          <span className="info-value">{formatTime(outPoint)}</span>
        </div>
        <div className="timeline-info-section">
          <span className="info-label">Duration:</span>
          <span className="info-value">{formatTime(outPoint - inPoint)}</span>
        </div>
      </div>
      
      <div className="timeline-instructions">
        <span>Top: Click to seek playback • Bottom: Drag to set clip boundaries</span>
      </div>
    </div>
  );
};

export default Timeline;
