import React from 'react';

const ConfirmModal = ({ isOpen, title = 'Confirm', message, confirmText = 'OK', cancelText = 'Cancel', onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 9999 }} onClick={onCancel}>
      <div className="invite-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px' }}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button type="button" className="close-modal" onClick={onCancel} aria-label="Close">
            <i className="fas fa-times" />
          </button>
        </div>
        <div className="modal-body">
          <p style={{ color: '#475569', lineHeight: 1.6 }}>{message}</p>
          <div className="modal-footer" style={{ marginTop: '1.5rem' }}>
            <button type="button" className="cancel-btn" onClick={onCancel}>{cancelText}</button>
            <button type="button" className="send-btn" onClick={onConfirm}>{confirmText}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
