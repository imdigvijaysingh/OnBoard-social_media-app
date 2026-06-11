import React from 'react';
import '../styles/DeleteConfirmModal.css';

const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, isDeleting }) => {
  if (!isOpen) return null;

  return (
    <div className="delete-modal-overlay">
      <div className="delete-modal-card">
        <div className="delete-modal-icon">
          <i className="fa-solid fa-triangle-exclamation"></i>
        </div>
        <h2>Delete Post?</h2>
        <p>This action cannot be undone. Are you sure you want to permanently delete this post?</p>
        <div className="delete-modal-actions">
          <button className="btn-cancel" onClick={onClose} disabled={isDeleting}>Cancel</button>
          <button className="btn-delete" onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
