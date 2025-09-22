import React, { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4"
    >
      <div
        className="rounded-2xl shadow-2xl w-full max-w-sm p-6 transform transition-all duration-300 ease-in-out scale-95 animate-scale-in"
        style={{ backgroundColor: 'var(--bg-secondary)'}}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-fuchsia-400" style={{ color: 'var(--accent-primary)'}}>{title}</h2>
          <button
            onClick={onClose}
            className="transition-all text-2xl transform hover:scale-125 active:scale-95"
            style={{ color: 'var(--text-secondary)'}}
          >
            &times;
          </button>
        </div>
        <div>{children}</div>
      </div>
       <style>{`
        @keyframes scale-in {
            0% { transform: scale(0.95); opacity: 0; }
            100% { transform: scale(1); opacity: 1; }
        }
        .animate-scale-in {
            animation: scale-in 0.2s ease-out forwards;
        }
    `}</style>
    </div>
  );
};

export default Modal;