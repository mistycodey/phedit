import React from 'react';

const InfoModal = ({ isOpen, onClose, title, message, type = 'info' }) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
      default:
        return 'ℹ️';
    }
  };

  const getTypeClass = () => {
    switch (type) {
      case 'success':
        return 'info-modal-success';
      case 'error':
        return 'info-modal-error';
      case 'warning':
        return 'info-modal-warning';
      case 'info':
      default:
        return 'info-modal-info';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className={`modal-content info-modal ${getTypeClass()}`} 
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        autoFocus
      >
        <div className="info-modal-header">
          <div className="info-modal-icon">
            {getIcon()}
          </div>
          <h3 className="info-modal-title">{title}</h3>
        </div>
        
        <div className="info-modal-body">
          <p className="info-modal-message">{message}</p>
        </div>

        <div className="info-modal-footer">
          <button 
            className="btn info-modal-btn" 
            onClick={onClose}
            autoFocus
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default InfoModal;
