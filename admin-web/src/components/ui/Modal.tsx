import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children, footer }: ModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 overflow-y-auto flex-1">
          {children}
        </div>
        {footer && <div className="p-4 border-t bg-slate-50 rounded-b-lg">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}
