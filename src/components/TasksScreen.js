import React, { useState } from 'react';
import InfoModal from './InfoModal';
import ConfirmModal from './ConfirmModal';
import ExportProgressOverlay from './ExportProgressOverlay';
import './TasksScreen.css';

const { ipcRenderer } = window.require('electron');
const path = window.require('path');

const TasksScreen = ({ onBack }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [outputFilePath, setOutputFilePath] = useState(null);
  const [inputFilePath, setInputFilePath] = useState(null);
  const [currentTask, setCurrentTask] = useState(null); // 'quick-fade' or 'audio-rip'
  const [taskSteps, setTaskSteps] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState({ inputFile: '', outputFile: '' });
  const [taskState, setTaskState] = useState({ inputPath: '', outputPath: '' });
  const [infoModal, setInfoModal] = useState({ isOpen: false, title: '', message: '', type: 'info' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

  const showInfoModal = (title, message, type = 'info') => {
    setInfoModal({ isOpen: true, title, message, type });
  };

  const closeInfoModal = () => {
    setInfoModal({ isOpen: false, title: '', message: '', type: 'info' });
  };

  const showConfirmModal = (title, message, onConfirm) => {
    setConfirmModal({ isOpen: true, title, message, onConfirm });
  };

  const closeConfirmModal = () => {
    setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null });
  };

  const handleQuickFade = async () => {
    // Initialize task steps
    const steps = [
      { id: 1, text: 'Choose video file', completed: false, details: '', action: 'select-input' },
      { id: 2, text: 'Choose save file', completed: false, details: '', action: 'select-output' },
      { id: 3, text: 'Process now', completed: false, details: '', action: 'process' }
    ];
    setTaskSteps(steps);
    setCurrentTask('quick-fade');
    setCurrentStep(0);
    setSelectedFiles({ inputFile: '', outputFile: '' });
    setTaskState({ inputPath: '', outputPath: '' });

  };

  const handleQuickFadeStep1 = async () => {
    try {
      setCurrentStep(0);
      setTaskSteps(prev => prev.map(step => 
        step.id === 1 ? { ...step, details: 'Waiting for user input...' } : step
      ));
      
      const inputResult = await ipcRenderer.invoke('open-file-dialog', {
        title: 'Select Video File for Quick Fade',
        filters: [
          { name: 'Video Files', extensions: ['mp4', 'avi', 'mov', 'mkv', 'wmv', 'flv', 'webm'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      });

      if (inputResult.canceled || inputResult.filePaths.length === 0) {
        setTaskSteps(prev => prev.map(step => 
          step.id === 1 ? { ...step, details: 'Cancelled' } : step
        ));
        return;
      }

      const inputPath = inputResult.filePaths[0];
      const inputFileName = path.basename(inputPath);
      const inputName = path.parse(inputFileName).name;

      // Update selected files and mark step 1 as completed
      setSelectedFiles(prev => ({ ...prev, inputFile: inputFileName }));
      setTaskState(prev => ({ ...prev, inputPath }));
      setTaskSteps(prev => prev.map(step => 
        step.id === 1 ? { ...step, completed: true, details: inputFileName } : step
      ));
    } catch (error) {
      console.error('Error selecting input file:', error);
      setTaskSteps(prev => prev.map(step => 
        step.id === 1 ? { ...step, details: 'Error: ' + error.message } : step
      ));
    }
  };

  const handleQuickFadeStep2 = async () => {
    try {
      if (!taskState.inputPath) {
        showInfoModal('No Input File', 'Please select an input file first.', 'warning');
        return;
      }

      setCurrentStep(1);
      setTaskSteps(prev => prev.map(step => 
        step.id === 2 ? { ...step, details: 'Waiting for user input...' } : step
      ));

      const inputName = path.parse(path.basename(taskState.inputPath)).name;
      const outputResult = await ipcRenderer.invoke('save-file-dialog', 'video', {
        title: 'Save Faded Video As',
        defaultPath: `${inputName}_faded.mp4`,
        filters: [
          { name: 'MP4 Files', extensions: ['mp4'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      });

      if (outputResult.canceled || !outputResult.filePath) {
        setTaskSteps(prev => prev.map(step => 
          step.id === 2 ? { ...step, details: 'Cancelled' } : step
        ));
        return;
      }

      const outputFileName = path.basename(outputResult.filePath);
      // Update selected files and mark step 2 as completed
      setSelectedFiles(prev => ({ ...prev, outputFile: outputFileName }));
      setTaskState(prev => ({ ...prev, outputPath: outputResult.filePath }));
      setTaskSteps(prev => prev.map(step => 
        step.id === 2 ? { ...step, completed: true, details: outputFileName } : step
      ));
    } catch (error) {
      console.error('Error selecting output file:', error);
      setTaskSteps(prev => prev.map(step => 
        step.id === 2 ? { ...step, details: 'Error: ' + error.message } : step
      ));
    }
  };

  const handleQuickFadeStep3 = async () => {
    try {
      if (!taskState.inputPath || !taskState.outputPath) {
        showInfoModal('Missing Files', 'Please select both input and output files first.', 'warning');
        return;
      }

      setCurrentStep(2);
      setTaskSteps(prev => prev.map(step => 
        step.id === 3 ? { ...step, details: 'Processing...' } : step
      ));

      // Store both input and output paths for progress overlay
      setOutputFilePath(taskState.outputPath);
      setInputFilePath(taskState.inputPath);

      const fadeSettings = {
        videoFadeIn: 6,
        videoFadeOut: 3,
        audioFadeIn: 3,
        audioFadeOut: 3
      };

      const exportResult = await ipcRenderer.invoke('process-quick-fade', {
        inputPath: taskState.inputPath,
        outputPath: taskState.outputPath,
        fadeSettings: fadeSettings
      });

      // Mark step 3 as completed
      setTaskSteps(prev => prev.map(step => 
        step.id === 3 ? { ...step, completed: true, details: 'Processing complete' } : step
      ));

      setIsProcessing(false);
      setOutputFilePath(null);
      setInputFilePath(null);
      setCurrentTask(null);
      setTaskSteps([]);

      const fileName = path.basename(taskState.outputPath);
      showInfoModal(
        'Quick Fade Complete',
        `Video processed successfully!\n\nFile: ${fileName}\nLocation: ${path.dirname(taskState.outputPath)}`,
        'success'
      );

      // Show file in folder after a delay
      setTimeout(async () => {
        try {
          await ipcRenderer.invoke('show-item-in-folder', taskState.outputPath);
        } catch (error) {
          console.log('Could not show file in folder:', error);
        }
      }, 2000);

    } catch (error) {
      console.error('Error processing quick fade:', error);
      setIsProcessing(false);
      setOutputFilePath(null);
      setInputFilePath(null);
      setTaskSteps(prev => prev.map(step => 
        step.id === 3 ? { ...step, details: 'Error: ' + error.message } : step
      ));
      
      if (error.message.includes('cancelled by user')) {
        showInfoModal('Processing Cancelled', 'The quick fade process was cancelled.', 'info');
      } else {
        showInfoModal('Processing Error', `Failed to process video: ${error.message}`, 'error');
      }
    }
  };

  const handleAudioRip = async () => {
    // Initialize task steps
    const steps = [
      { id: 1, text: 'Choose video file', completed: false, details: '', action: 'select-input' },
      { id: 2, text: 'Choose save file', completed: false, details: '', action: 'select-output' },
      { id: 3, text: 'Process now', completed: false, details: '', action: 'process' }
    ];
    setTaskSteps(steps);
    setCurrentTask('audio-rip');
    setCurrentStep(0);
    setSelectedFiles({ inputFile: '', outputFile: '' });
    setTaskState({ inputPath: '', outputPath: '' });

  };

  const handleAudioRipStep1 = async () => {
    try {
      setCurrentStep(0);
      setTaskSteps(prev => prev.map(step => 
        step.id === 1 ? { ...step, details: 'Waiting for user input...' } : step
      ));
      
      const inputResult = await ipcRenderer.invoke('open-file-dialog', {
        title: 'Select Video File for Audio Extraction',
        filters: [
          { name: 'Video Files', extensions: ['mp4', 'avi', 'mov', 'mkv', 'wmv', 'flv', 'webm'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      });

      if (inputResult.canceled || inputResult.filePaths.length === 0) {
        setTaskSteps(prev => prev.map(step => 
          step.id === 1 ? { ...step, details: 'Cancelled' } : step
        ));
        return;
      }

      const inputPath = inputResult.filePaths[0];
      const inputFileName = path.basename(inputPath);
      const inputName = path.parse(inputFileName).name;

      // Update selected files and mark step 1 as completed
      setSelectedFiles(prev => ({ ...prev, inputFile: inputFileName }));
      setTaskState(prev => ({ ...prev, inputPath }));
      setTaskSteps(prev => prev.map(step => 
        step.id === 1 ? { ...step, completed: true, details: inputFileName } : step
      ));
    } catch (error) {
      console.error('Error selecting input file:', error);
      setTaskSteps(prev => prev.map(step => 
        step.id === 1 ? { ...step, details: 'Error: ' + error.message } : step
      ));
    }
  };

  const handleAudioRipStep2 = async () => {
    try {
      if (!taskState.inputPath) {
        showInfoModal('No Input File', 'Please select an input file first.', 'warning');
        return;
      }

      setCurrentStep(1);
      setTaskSteps(prev => prev.map(step => 
        step.id === 2 ? { ...step, details: 'Waiting for user input...' } : step
      ));

      const inputName = path.parse(path.basename(taskState.inputPath)).name;
      const outputResult = await ipcRenderer.invoke('save-file-dialog', 'audio', {
        title: 'Save Audio As',
        defaultPath: `${inputName}_audio.mp3`,
        filters: [
          { name: 'MP3 Files', extensions: ['mp3'] },
          { name: 'WAV Files', extensions: ['wav'] },
          { name: 'AAC Files', extensions: ['aac'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      });

      if (outputResult.canceled || !outputResult.filePath) {
        setTaskSteps(prev => prev.map(step => 
          step.id === 2 ? { ...step, details: 'Cancelled' } : step
        ));
        return;
      }

      const outputFileName = path.basename(outputResult.filePath);
      // Update selected files and mark step 2 as completed
      setSelectedFiles(prev => ({ ...prev, outputFile: outputFileName }));
      setTaskState(prev => ({ ...prev, outputPath: outputResult.filePath }));
      setTaskSteps(prev => prev.map(step => 
        step.id === 2 ? { ...step, completed: true, details: outputFileName } : step
      ));
    } catch (error) {
      console.error('Error selecting output file:', error);
      setTaskSteps(prev => prev.map(step => 
        step.id === 2 ? { ...step, details: 'Error: ' + error.message } : step
      ));
    }
  };

  const handleAudioRipStep3 = async () => {
    try {
      if (!taskState.inputPath || !taskState.outputPath) {
        showInfoModal('Missing Files', 'Please select both input and output files first.', 'warning');
        return;
      }

      setCurrentStep(2);
      setTaskSteps(prev => prev.map(step => 
        step.id === 3 ? { ...step, details: 'Processing...' } : step
      ));

      // Store both input and output paths for progress overlay
      setOutputFilePath(taskState.outputPath);
      setInputFilePath(taskState.inputPath);

      const exportResult = await ipcRenderer.invoke('process-audio-rip', {
        inputPath: taskState.inputPath,
        outputPath: taskState.outputPath
      });

      // Mark step 3 as completed
      setTaskSteps(prev => prev.map(step => 
        step.id === 3 ? { ...step, completed: true, details: 'Processing complete' } : step
      ));

      setIsProcessing(false);
      setOutputFilePath(null);
      setInputFilePath(null);
      setCurrentTask(null);
      setTaskSteps([]);

      const fileName = path.basename(taskState.outputPath);
      showInfoModal(
        'Audio Extraction Complete',
        `Audio extracted successfully!\n\nFile: ${fileName}\nLocation: ${path.dirname(taskState.outputPath)}`,
        'success'
      );

      // Show file in folder after a delay
      setTimeout(async () => {
        try {
          await ipcRenderer.invoke('show-item-in-folder', taskState.outputPath);
        } catch (error) {
          console.log('Could not show file in folder:', error);
        }
      }, 2000);

    } catch (error) {
      console.error('Error processing audio rip:', error);
      setIsProcessing(false);
      setOutputFilePath(null);
      setInputFilePath(null);
      setTaskSteps(prev => prev.map(step => 
        step.id === 3 ? { ...step, details: 'Error: ' + error.message } : step
      ));
      
      if (error.message.includes('cancelled by user')) {
        showInfoModal('Processing Cancelled', 'The audio extraction was cancelled.', 'info');
      } else {
        showInfoModal('Processing Error', `Failed to extract audio: ${error.message}`, 'error');
      }
    }
  };

  const handleCancelExport = async () => {
    try {
      const result = await ipcRenderer.invoke('cancel-export');
      if (!result.success) {
        showInfoModal('Cancel Error', result.message, 'warning');
      }
    } catch (error) {
      console.error('Cancel export error:', error);
      showInfoModal('Cancel Error', `Error cancelling export: ${error.message}`, 'error');
    }
  };

  const handleStepClick = async (step) => {
    if (currentTask === 'quick-fade') {
      switch (step.id) {
        case 1:
          await handleQuickFadeStep1();
          break;
        case 2:
          await handleQuickFadeStep2();
          break;
        case 3:
          await handleQuickFadeStep3();
          break;
        default:
          break;
      }
    } else if (currentTask === 'audio-rip') {
      switch (step.id) {
        case 1:
          await handleAudioRipStep1();
          break;
        case 2:
          await handleAudioRipStep2();
          break;
        case 3:
          await handleAudioRipStep3();
          break;
        default:
          break;
      }
    }
  };

  // Set up processing event listeners
  React.useEffect(() => {
    ipcRenderer.on('processing-started', () => {
      setIsProcessing(true);
      setProcessingProgress(0);
    });

    ipcRenderer.on('processing-progress', (event, progress) => {
      setProcessingProgress(progress.percent || 0);
    });

    ipcRenderer.on('processing-cancelled', () => {
      setIsProcessing(false);
      setProcessingProgress(0);
      showInfoModal('Processing Cancelled', 'The processing was cancelled successfully.', 'info');
    });

    return () => {
      ipcRenderer.removeAllListeners('processing-started');
      ipcRenderer.removeAllListeners('processing-progress');
      ipcRenderer.removeAllListeners('processing-cancelled');
    };
  }, []);

  return (
    <div className="app">
             <div className="header">
         <div className="header-controls">
           <button className="btn btn-secondary btn-icon-only" onClick={onBack}>
             <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
               <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
             </svg>
           </button>
           {currentTask && (
             <button className="btn btn-secondary btn-icon-only" onClick={() => {
               setCurrentTask(null);
               setTaskSteps([]);
               setCurrentStep(0);
               setSelectedFiles({ inputFile: '', outputFile: '' });
               setTaskState({ inputPath: '', outputPath: '' });
             }}>
               <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                 <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
               </svg>
             </button>
           )}
         </div>
         <h1>Quick Tasks</h1>
       </div>

      {/* Task Steps Indicator */}
      {currentTask && taskSteps.length > 0 && (
        <div className="task-steps-container">
          <div className="task-steps-header">
            <h3>{currentTask === 'quick-fade' ? 'Quick Fade' : 'Audio Rip'}</h3>
          </div>
          <div className="task-steps">
            {taskSteps.map((step, index) => (
              <div 
                key={step.id} 
                className={`task-step ${step.completed ? 'completed' : ''} ${index === currentStep ? 'current' : ''}`}
              >
                <div className="step-number">
                  {step.completed ? '✓' : index + 1}
                </div>
                <div className="step-content">
                  <div className="step-text">{step.text}</div>
                  {step.details && (
                    <div className="step-details">{step.details}</div>
                  )}
                </div>
                <div className="step-action">
                  {!step.completed && (
                    <button 
                      className="btn btn-primary btn-sm"
                      onClick={() => handleStepClick(step)}
                      disabled={step.details === 'Processing...'}
                    >
                      {step.details === 'Processing...' ? 'Processing...' : 
                       step.id === 1 ? 'Choose' :
                       step.id === 2 ? 'Choose' :
                       step.id === 3 ? 'Process' : 'Start'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="main-content">
        {!currentTask && (
          <div style={{ paddingTop: '20px' }}>
            <div className="tasks-grid">
            <div className="task-card" onClick={handleQuickFade}>
            <div className="task-icon">
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{width: '28px', height: '28px', fill: 'white'}}>
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <h3>Quick Fade</h3>
            <p>Add fade effects to your video</p>
            <div className="task-details">
              <ul>
                <li>6-second video fade in</li>
                <li>3-second audio fade in</li>
                <li>3-second fade out (video + audio)</li>
                <li>Export processed video</li>
              </ul>
            </div>
            <div className="task-action">
              <button className="btn">Start Quick Fade</button>
            </div>
          </div>

          <div className="task-card" onClick={handleAudioRip}>
            <div className="task-icon">
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{width: '28px', height: '28px', fill: 'white'}}>
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
              </svg>
            </div>
            <h3>Audio Rip</h3>
            <p>Extract audio from video files</p>
            <div className="task-details">
              <ul>
                <li>Extract audio track only</li>
                <li>Multiple output formats</li>
                <li>Preserve original quality</li>
                <li>Fast processing</li>
              </ul>
            </div>
            <div className="task-action">
                           <button className="btn">Start Audio Rip</button>
                       </div>
         </div>
         </div>
       </div>
        )}


      </div>

      <InfoModal
        isOpen={infoModal.isOpen}
        onClose={closeInfoModal}
        title={infoModal.title}
        message={infoModal.message}
        type={infoModal.type}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={closeConfirmModal}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
      />

      <ExportProgressOverlay
        isVisible={isProcessing}
        progress={processingProgress}
        exportType="video"
        onCancel={handleCancelExport}
        sourceFile={inputFilePath ? path.basename(inputFilePath) : 'Processing...'}
        outputFile={outputFilePath ? path.basename(outputFilePath) : 'Not started'}
        exportOptions={isProcessing ? {
          startTime: 0,
          duration: 0,
          fadeIn: 6,
          fadeOut: 3,
          audioFadeIn: 3,
          audioFadeOut: 3,
          exportQuality: 'high',
          exportSize: 100
        } : null}
      />
    </div>
  );
};

export default TasksScreen;
