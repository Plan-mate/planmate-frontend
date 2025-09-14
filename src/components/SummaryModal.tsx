"use client";

import { useEffect, useState } from "react";
import { getTodaySummary } from "@/api/services/plan";
import "@/styles/summaryModal.css";

interface SummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SummaryModal({ isOpen, onClose }: SummaryModalProps) {
  const [summary, setSummary] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadSummary();
    }
  }, [isOpen]);

  const loadSummary = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const summaryData = await getTodaySummary();
      setSummary(summaryData);
    } catch (err) {
      setError('요약을 불러오는데 실패했습니다.');
      console.error('Summary loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="summary-modal-overlay">
      <div className="summary-modal">
        <div className="summary-modal-header">
          <h2>오늘의 요약</h2>
          <button 
            className="summary-modal-close" 
            onClick={onClose}
            aria-label="닫기"
          >
            ×
          </button>
        </div>
        
        <div className="summary-modal-content">
          {loading ? (
            <div className="summary-loading">
              <div className="pm-skeleton text" style={{ width: '100%', marginBottom: 8 }}></div>
              <div className="pm-skeleton text" style={{ width: '80%', marginBottom: 8 }}></div>
              <div className="pm-skeleton text" style={{ width: '90%' }}></div>
            </div>
          ) : error ? (
            <div className="summary-error">
              <div className="error-icon">⚠️</div>
              <p>{error}</p>
              <button 
                onClick={loadSummary} 
                className="retry-btn"
              >
                다시 시도
              </button>
            </div>
          ) : (
            <div className="summary-text">
              {summary}
            </div>
          )}
        </div>
        
        <div className="summary-modal-footer">
          <button 
            className="summary-modal-btn primary" 
            onClick={onClose}
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
