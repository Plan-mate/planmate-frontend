"use client";

import { useEffect, useState } from "react";
import LogoIcon from "@/components/LogoIcon";
import NotificationModal from "@/components/NotificationModal";
import { getMe, logout } from "@/api/services/auth";
import { markAllAsRead } from "@/api/services/notification";
import { requestNotificationPermissionAndGetToken } from "@/lib/fcm";
// import { hasUnread } from "@/api/services/notification"; // 실제 API 사용 시
import type { MeResponse } from "@/api/types/api.types";
import { getAccessToken } from "@/api/utils/tokenStorage";
import "@/styles/header.css";

export default function Header() {
  const [user, setUser] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [hasUnreadNotification, setHasUnreadNotification] = useState<boolean>(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState<boolean>(false);

  const handleKakaoLogin = () => {
    const clientId = process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY;
    const redirectUri = process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI;
    const authUrl = `https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}`;
    window.location.href = authUrl;
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    window.location.href = "/";
  };

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      setLoading(false);
      return;
    }

    const initializeFcmToken = () => {
      requestNotificationPermissionAndGetToken();
    };

    getMe()
      .then((userData) => {
        setUser(userData);
        checkUnreadNotifications();
        
        initializeFcmToken();
      })
      .finally(() => setLoading(false));

    const handleVisibilityChange = () => {
      if (!document.hidden && getAccessToken()) {
        initializeFcmToken();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const checkUnreadNotifications = async () => {
    try {
      // 목 데이터: 읽지 않은 알림 있음으로 표시 (알림 있을 때 테스트용)
      setHasUnreadNotification(true);
      
      // 목 데이터: 읽지 않은 알림 없음으로 표시 (빈 알림 테스트용)
      // setHasUnreadNotification(false);
      
      // 실제 API 사용 시:
      // const unread = await hasUnread();
      // setHasUnreadNotification(unread);
    } catch (error) {
      console.error('읽지 않은 알림 확인 실패:', error);
    }
  };

  const handleNotificationClick = () => {
    setIsNotificationModalOpen(true);
  };

  const handleNotificationModalClose = async () => {
    setIsNotificationModalOpen(false);
    try {
      await markAllAsRead();
      setHasUnreadNotification(false);
    } catch (error) {
      console.error('알림 읽음 처리 실패:', error);
    }
  };
  
  const renderUserSection = () => {
    if (loading) {
      return <div className="loading-spacer" />;
    }
    
    if (user) {
      return (
        <div className="user-section">
          <button 
            className="notification-bell-btn" 
            onClick={handleNotificationClick}
            aria-label="알림"
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path 
                d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" 
                fill="currentColor"
              />
            </svg>
            {hasUnreadNotification && <span className="notification-badge" />}
          </button>
          <img src={user.profileImage} alt="profile" className="profile-image" />
          <span className="nickname">{user.nickname}</span>
          <button onClick={handleLogout} className="pm-btn pm-btn--ghost">로그아웃</button>
        </div>
      );
    }
    
    return (
      <button className="pm-btn pm-btn--primary" onClick={handleKakaoLogin}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="12" cy="12" rx="12" ry="12" fill="#3C1E1E"/>
          <path d="M12 6C8.13 6 5 8.686 5 12c0 2.02 1.29 3.78 3.24 4.77-.09.7-.49 2.01-.56 2.23 0 0-.01.03.01.04.02.01.04.01.06 0 .25-.03 2.36-1.62 3.32-2.29.3.03.61.05.93.05 3.87 0 7-2.69 7-6s-3.13-6-7-6z" fill="#FEE500"/>
        </svg>
        카카오로 시작하기
      </button>
    );
  };
  
  return (
    <>
      <header className="header-container">
        <div className="logo">
          <LogoIcon />
          <span>PLANMATE</span>
        </div>
        {renderUserSection()}
      </header>
      <NotificationModal 
        isOpen={isNotificationModalOpen} 
        onClose={handleNotificationModalClose} 
      />
    </>
  );
}
