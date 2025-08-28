import React from 'react';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', cancelText = 'Cancel', type = 'warning' }) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return '🗑️';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '❓';
    }
  };

  const getTypeClass = () => {
    switch (type) {
      case 'danger':
        return 'confirm-modal-danger';
      case 'warning':
        return 'confirm-modal-warning';
      case 'info':
        return 'confirm-modal-info';
      default:
        return 'confirm-modal-default';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      onConfirm();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className={`modal-content confirm-modal ${getTypeClass()}`} 
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        autoFocus
      >
        <div className="confirm-modal-header">
          <div className="confirm-modal-icon">
            {getIcon()}
          </div>
          <h3 className="confirm-modal-title">{title}</h3>
        </div>
        
        <div className="confirm-modal-body">
          <p className="confirm-modal-message">{message}</p>
        </div>

        <div className="confirm-modal-footer">
          <button 
            className="btn btn-secondary" 
            onClick={onClose}
          >
            {cancelText}
          </button>
          <button 
            className="btn btn-danger" 
            onClick={handleConfirm}
            autoFocus
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
