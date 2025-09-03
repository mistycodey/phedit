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
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{width: '20px', height: '20px', fill: 'white'}}>
            <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
          </svg>
        </button>
        
        <button 
          className="btn btn-icon" 
          onClick={onPlayPause}
          disabled={!hasVideo}
          title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
        >
          {isPlaying ? (
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{width: '20px', height: '20px', fill: 'white'}}>
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{width: '20px', height: '20px', fill: 'white'}}>
              <path d="M8 5v14l11-7z"/>
            </svg>
          )}
        </button>
        
        <button 
          className="btn btn-icon" 
          onClick={() => onSeek(Math.min(duration, currentTime + 10))}
          disabled={!hasVideo || currentTime >= duration}
          title="Skip Forward 10s (→)"
        >
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{width: '20px', height: '20px', fill: 'white'}}>
            <path d="M16 18h2V6h-2M6 18l8.5-6L6 6v12z"/>
          </svg>
        </button>
      </div>
    </div>
  );
});

VideoPlayer.displayName = 'VideoPlayer';

export default VideoPlayer;
