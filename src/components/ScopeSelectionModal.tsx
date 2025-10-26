"use client";

import { useEffect } from "react";
import { Event, Scope } from "@/types/event";

interface ScopeSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectScope: (scope: Scope) => void;
  event: Event;
  mode?: 'edit' | 'delete';
}

const SCOPE_OPTIONS_EDIT: { value: Scope; label: string; description: string }[] = [
  { value: 'THIS', label: '이 일정만', description: '선택한 일정만 수정합니다' },
  { value: 'THIS_AND_FUTURE', label: '이 일정 이후', description: '선택 시 이 일정 시점 이후만 수정합니다' },
  { value: 'ALL', label: '전체 일정', description: '반복 전체를 수정합니다' }
];

const SCOPE_OPTIONS_DELETE: { value: Scope; label: string; description: string }[] = [
  { value: 'THIS', label: '이 일정만', description: '이 한 일정만 삭제합니다' },
  { value: 'THIS_AND_FUTURE', label: '이 일정 이후', description: '이 일정 시점 이후 반복 일정만 삭제합니다' },
  { value: 'ALL', label: '전체 일정', description: '반복 전체를 삭제합니다' }
];

export default function ScopeSelectionModal({ 
  isOpen, 
  onClose, 
  onSelectScope, 
  event,
  mode = 'edit'
}: ScopeSelectionModalProps) {
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

  const isDelete = mode === 'delete';
  const options = isDelete ? SCOPE_OPTIONS_DELETE : SCOPE_OPTIONS_EDIT;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content toss-style pm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header toss-header">
          <button className="close-btn toss-close" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <h2 className="modal-title">{isDelete ? '삭제 범위 선택' : '수정 범위 선택'}</h2>
        </div>

        <div className="scope-selection-content">
          <div className="event-info">
            <h3 className="event-title">{event.title}</h3>
            <p className="event-description">
              {isDelete ? '반복 일정의 삭제 범위를 선택해주세요.' : '반복 일정의 수정 범위를 선택해주세요.'}
            </p>
          </div>

          <div className="scope-options">
            {options.map((option) => (
              <button
                key={option.value}
                className="scope-option"
                onClick={() => onSelectScope(option.value)}
              >
                <div className="scope-option-content">
                  <div className="scope-option-header">
                    <span className="scope-option-label">{option.label}</span>
                  </div>
                  <p className="scope-option-description">{option.description}</p>
                </div>
                <div className="scope-option-arrow">›</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
