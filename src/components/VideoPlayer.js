import React, { forwardRef, useEffect } from 'react';

const VideoPlayer = forwardRef(({ 
  src, 
  onTimeUpdate, 
  onLoadedMetadata, 
  currentTime, 
  videoMetadata,
  isPlaying,
  onPlayPause,
  onSeek,
  duration,
  hasVideo
}, ref) => {
  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      onTimeUpdate(video.currentTime);
    };

    const handleLoadedMetadata = (e) => {
      if (onLoadedMetadata) {
        onLoadedMetadata(e);
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [ref, onTimeUpdate, onLoadedMetadata]);

  // Handle window resize to ensure video scales properly
  useEffect(() => {
    const handleResize = () => {
      const video = ref.current;
      if (video) {
        // Force the video to recalculate its size
        video.style.width = '100%';
        video.style.height = '100%';
      }
    };

    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [ref]);



  return (
    <div className="video-player-container">
      <video
        ref={ref}
        src={src}
        className="video-player"
        controls={false}
        preload="metadata"
      />
      
      {/* Video Overlay Controls */}
      <div className="video-overlay-controls">
        <button 
          className="btn btn-icon" 
          onClick={() => onSeek(Math.max(0, currentTime - 10))}
          disabled={!hasVideo || currentTime <= 0}
          title="Skip Back 10s (←)"
        >
          ⏮
        </button>
        
        <button 
          className="btn btn-icon" 
          onClick={onPlayPause}
          disabled={!hasVideo}
          title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
        >
          {isPlaying ? '⏸️' : '▶️'}
        </button>
        
        <button 
          className="btn btn-icon" 
          onClick={() => onSeek(Math.min(duration, currentTime + 10))}
          disabled={!hasVideo || currentTime >= duration}
          title="Skip Forward 10s (→)"
        >
          ⏭
        </button>
      </div>
    </div>
  );
});

VideoPlayer.displayName = 'VideoPlayer';

export default VideoPlayer;
