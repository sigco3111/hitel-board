
import React from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode;
  confirmButtonText?: string;
  cancelButtonText?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmButtonText = '확인',
  cancelButtonText = '취소',
}) => {
  if (!isOpen) return null;

  return (
    <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmation-title"
    >
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-sm m-4 transform transition-all" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 text-center">
          <h3 id="confirmation-title" className="text-lg font-semibold text-slate-800">{title}</h3>
          <div className="mt-2 text-sm text-slate-600 leading-relaxed">{message}</div>
        </div>
        <div className="px-6 py-4 bg-slate-50 rounded-b-xl flex justify-center space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {cancelButtonText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            {confirmButtonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
