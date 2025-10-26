"use client";

import { useEffect } from "react";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onClose: () => void;
}

export default function ConfirmModal({ isOpen, title, description, confirmText = '확인', cancelText = '취소', onConfirm, onClose }: ConfirmModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content toss-style pm-modal pm-confirm" onClick={(e) => e.stopPropagation()}>
        <div className="pm-confirm__header">
          <div className="pm-confirm__icon" aria-hidden>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 9v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="12" cy="16" r="1" fill="currentColor"/>
              <path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z" stroke="currentColor" strokeWidth="1.6"/>
            </svg>
          </div>
          <h2 className="pm-confirm__title">{title}</h2>
          <button className="close-btn pm-confirm__close" onClick={onClose} aria-label="닫기">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>
        {description && (
          <div className="pm-confirm__body">
            <p className="pm-confirm__desc">{description}</p>
          </div>
        )}
        <div className="pm-confirm__actions">
          <button className="pm-btn pm-btn--ghost" onClick={onClose}>{cancelText}</button>
          <button className="pm-btn pm-btn--danger" onClick={onConfirm}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
}


