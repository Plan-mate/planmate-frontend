"use client";

import { useEffect } from "react";
import "@/styles/loginModal.css";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function LoginRequiredModal({ open, onClose }: Props) {
  if (!open) return null;

  const handleKakaoLogin = () => {
    const clientId = process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY;
    const redirectUri = process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI;
    if (!clientId || !redirectUri) {
      return;
    }
    const authUrl = `https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}`;
    window.location.href = authUrl;
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="pm-modal-overlay" onClick={onClose}>
      <div className="pm-modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="pm-modal-title">로그인이 필요합니다</h2>
        <p className="pm-modal-desc">이 기능은 로그인 후 이용할 수 있어요.<br/>로그인을 진행해주세요.</p>
        <div className="pm-modal-actions">
          <button onClick={onClose} className="pm-btn pm-btn-cancel">취소</button>
          <button onClick={handleKakaoLogin} className="pm-btn pm-btn-kakao">
            <span className="pm-kakao-icon" aria-hidden>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <ellipse cx="12" cy="12" rx="12" ry="12" fill="#3C1E1E"/>
                <path d="M12 6C8.13 6 5 8.686 5 12c0 2.02 1.29 3.78 3.24 4.77-.09.7-.49 2.01-.56 2.23 0 0-.01.03.01.04.02.01.04.01.06 0 .25-.03 2.36-1.62 3.32-2.29.3.03.61.05.93.05 3.87 0 7-2.69 7-6s-3.13-6-7-6z" fill="#FEE500"/>
              </svg>
            </span>
            카카오로 시작하기
          </button>
        </div>
      </div>
    </div>
  );
}


