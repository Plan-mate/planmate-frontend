"use client";

import { Event, Scope } from "@/types/event";

interface ScopeSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectScope: (scope: Scope) => void;
  event: Event;
}

const SCOPE_OPTIONS: { value: Scope; label: string; description: string }[] = [
  {
    value: 'THIS',
    label: '이 일정만',
    description: '선택한 일정만 수정합니다'
  },
  {
    value: 'THIS_AND_FUTURE',
    label: '이 일정부터 모든 일정',
    description: '선택한 일정부터 앞으로의 모든 반복 일정을 수정합니다'
  },
  {
    value: 'ALL',
    label: '전체 일정',
    description: '이 반복 일정의 모든 인스턴스를 수정합니다'
  }
];

export default function ScopeSelectionModal({ 
  isOpen, 
  onClose, 
  onSelectScope, 
  event 
}: ScopeSelectionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content toss-style pm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header toss-header">
          <button className="close-btn toss-close" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <h2 className="modal-title">수정 범위 선택</h2>
        </div>

        <div className="scope-selection-content">
          <div className="event-info">
            <h3 className="event-title">{event.title}</h3>
            <p className="event-description">
              반복 일정의 수정 범위를 선택해주세요.
            </p>
          </div>

          <div className="scope-options">
            {SCOPE_OPTIONS.map((option) => (
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
