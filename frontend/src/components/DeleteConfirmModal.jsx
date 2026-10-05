import React, { useEffect } from 'react';
import { scrollToTop } from '../utils/scrollToTop';

const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, isDeleting }) => {
  useEffect(() => {
    if (isOpen) {
      scrollToTop();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 w-screen h-screen bg-slate-900/40 backdrop-blur-sm z-[10000] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-[400px] rounded-3xl p-8 text-center shadow-2xl border border-slate-100 transform transition-all">
        <div className="w-14 h-14 bg-red-100 text-red-500 rounded-full flex items-center justify-center text-2xl mx-auto mb-5">
          <i className="fa-solid fa-triangle-exclamation"></i>
        </div>
        <h2 className="text-slate-900 text-xl font-bold mb-2">Delete Post?</h2>
        <p className="text-slate-500 text-sm leading-relaxed mb-6">
          This action cannot be undone. Are you sure you want to permanently delete this post?
        </p>
        <div className="flex gap-3">
          <button
            className="flex-1 py-3 px-4 rounded-xl font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50 text-sm"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            className="flex-1 py-3 px-4 rounded-xl font-semibold text-white bg-red-500 hover:bg-red-600 shadow-md shadow-red-500/20 transition-all disabled:opacity-50 text-sm flex items-center justify-center gap-2"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                <span>Deleting...</span>
              </>
            ) : (
              "Delete"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
