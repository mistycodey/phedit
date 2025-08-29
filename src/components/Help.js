import React from 'react';
import './Help.css';

const Help = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="help-overlay" onClick={onClose}>
      <div className="help-modal" onClick={(e) => e.stopPropagation()}>
        <div className="help-header">
          <h2>PHEdit Help Guide</h2>
          <button className="help-close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="help-content">
          <div className="help-section">
            <h3>Getting Started</h3>
            <p>PHEdit is a simple video editing tool that lets you create edited videos with professional effects.</p>
            
            <h4>Step 1: Load a Video</h4>
            <ol>
              <li>Click the "Load Video" button in the top-right corner</li>
              <li>Select any video file from your computer (MP4, AVI, MOV, MKV, etc.)</li>
              <li>The video will appear in the player and you can start editing</li>
            </ol>
          </div>

          <div className="help-section">
            <h3>Creating a Clip</h3>
            <p>To create a clip, you need to set two points: where the clip starts and where it ends.</p>
            
            <h4>Setting Clip Points</h4>
            <ol>
              <li><strong>Play the video</strong> using the play button or press the spacebar</li>
              <li><strong>Navigate to where you want the clip to start</strong> by:
                <ul>
                  <li>Clicking and dragging the timeline slider</li>
                  <li>Using the left/right arrow keys to jump 10 seconds</li>
                  <li>Clicking anywhere on the timeline</li>
                </ul>
              </li>
              <li><strong>Set the start point</strong> by clicking the "Set In Point" button (or press 'I')</li>
              <li><strong>Navigate to where you want the clip to end</strong></li>
              <li><strong>Set the end point</strong> by clicking the "Set Out Point" button (or press 'O')</li>
            </ol>
            
            <p><strong>Tip:</strong> You can see your selected section highlighted in blue on the timeline.</p>
          </div>

          <div className="help-section">
            <h3>Adding Professional Effects</h3>
            
            <h4>Fade Effects</h4>
            <ul>
              <li><strong>Video Fade In:</strong> Creates a smooth fade from black at the start of your clip</li>
              <li><strong>Video Fade Out:</strong> Creates a smooth fade to black at the end of your clip</li>
              <li><strong>Audio Fade In:</strong> Gradually increases the volume at the start</li>
              <li><strong>Audio Fade Out:</strong> Gradually decreases the volume at the end</li>
            </ul>
            
            <h4>Timing Effects</h4>
            <ul>
              <li><strong>Silence at Start:</strong> Adds a period of silence before your audio begins</li>
              <li><strong>Black Screen at Start:</strong> Adds a black screen before your video begins</li>
            </ul>
            
            <h4>Quality Settings</h4>
            <ul>
              <li><strong>Low Quality:</strong> Smaller file size, faster processing</li>
              <li><strong>Medium Quality:</strong> Balanced quality and file size</li>
              <li><strong>High Quality:</strong> Best quality, larger file size</li>
            </ul>
            
            <h4>Size Settings</h4>
            <ul>
              <li><strong>100%:</strong> Original video size</li>
              <li><strong>75%:</strong> 75% of original size (good for web)</li>
              <li><strong>50%:</strong> Half the original size (smaller files)</li>
            </ul>
          </div>

          <div className="help-section">
            <h3>Exporting Your Clip</h3>
            
            <h4>Video Export</h4>
            <ol>
              <li>Make sure you have set your In and Out points</li>
              <li>Adjust any effects you want (fades, timing, quality, size)</li>
              <li>Click the "Export Video" button</li>
              <li>Choose where to save your file and give it a name</li>
              <li>Wait for the processing to complete</li>
            </ol>
            
            <h4>Audio Export</h4>
            <ol>
              <li>Set your In and Out points</li>
              <li>Adjust audio effects (audio fades, silence at start)</li>
              <li>Click the "Export Audio" button</li>
              <li>Choose where to save your WAV file</li>
              <li>Wait for the processing to complete</li>
            </ol>
            
            <p><strong>Note:</strong> You can cancel an export at any time by clicking the "Cancel" button.</p>
          </div>

          <div className="help-section">
            <h3>Keyboard Shortcuts</h3>
            
            <h4>Playback Control</h4>
            <ul>
              <li><strong>Spacebar:</strong> Play/Pause video</li>
              <li><strong>Left Arrow:</strong> Jump back 10 seconds</li>
              <li><strong>Right Arrow:</strong> Jump forward 10 seconds</li>
            </ul>
            
            <h4>In/Out Point Control</h4>
            <ul>
              <li><strong>I:</strong> Set In Point at current position</li>
              <li><strong>O:</strong> Set Out Point at current position</li>
              <li><strong>Shift + Left/Right:</strong> Nudge In Point by 0.1 seconds</li>
              <li><strong>Shift + Up/Down:</strong> Nudge Out Point by 0.1 seconds</li>
              <li><strong>Shift + Ctrl + Left/Right:</strong> Nudge In Point by 1 second</li>
              <li><strong>Shift + Ctrl + Up/Down:</strong> Nudge Out Point by 1 second</li>
            </ul>
            
            <h4>Timeline Interaction</h4>
            <ul>
              <li><strong>Click:</strong> Seek to position</li>
              <li><strong>Drag handles:</strong> Adjust In/Out points directly</li>
              <li><strong>Right-click:</strong> Context menu with quick actions</li>
              <li><strong>Shift + Drag:</strong> Select range on timeline</li>
            </ul>
          </div>

          <div className="help-section">
            <h3>FFmpeg Installation</h3>
            <p>PHEdit requires FFmpeg to process videos. If you haven't installed it yet:</p>
            
            <h4>Windows</h4>
            <ol>
              <li>Go to <a href="https://ffmpeg.org/download.html" target="_blank" rel="noopener noreferrer">https://ffmpeg.org/download.html</a></li>
              <li>Click "Windows Builds"</li>
              <li>Download the latest release (choose "essentials" build)</li>
              <li>Extract the ZIP file to a folder (e.g., C:\ffmpeg)</li>
              <li>In PHEdit Settings, set the FFmpeg path to the extracted ffmpeg.exe file</li>
            </ol>
            
            <h4>macOS</h4>
            <ol>
              <li>Install Homebrew if you don't have it: <a href="https://brew.sh" target="_blank" rel="noopener noreferrer">https://brew.sh</a></li>
              <li>Open Terminal and run: <code>brew install ffmpeg</code></li>
              <li>PHEdit should automatically detect FFmpeg</li>
            </ol>
            
            <h4>Linux</h4>
            <ol>
              <li>Open Terminal and run: <code>sudo apt update && sudo apt install ffmpeg</code> (Ubuntu/Debian)</li>
              <li>Or: <code>sudo yum install ffmpeg</code> (CentOS/RHEL)</li>
              <li>PHEdit should automatically detect FFmpeg</li>
            </ol>
            
            <p><strong>Alternative:</strong> You can also download FFmpeg from <a href="https://www.gyan.dev/ffmpeg/builds/" target="_blank" rel="noopener noreferrer">https://www.gyan.dev/ffmpeg/builds/</a> for Windows.</p>
          </div>

          <div className="help-section">
            <h3>Troubleshooting</h3>
            
            <h4>Common Issues</h4>
            <ul>
              <li><strong>Video won't load:</strong> Make sure the file is a supported video format</li>
              <li><strong>Export fails:</strong> Check that FFmpeg is properly installed and configured in Settings</li>
              <li><strong>Poor quality:</strong> Try increasing the quality setting to "High"</li>
              <li><strong>Large file size:</strong> Try reducing the quality setting or video size</li>
            </ul>
            
            <h4>Supported Video Formats</h4>
            <p>MP4, AVI, MOV, MKV, WebM, FLV, M4V, and most other common video formats.</p>
          </div>

          <div className="help-section">
            <h3>Tips for Best Results</h3>
            <ul>
              <li>Use high-quality source videos for the best output</li>
              <li>Keep fade effects under 3 seconds for most videos</li>
              <li>Use "High" quality for important projects</li>
              <li>Use "Medium" or "Low" quality for web sharing or quick previews</li>
              <li>Test your settings on a short clip first</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Help;
