"use client";

import { useEffect, useState } from "react";
// import { getMyNotifications } from "@/api/services/notification"; // 실제 API 사용 시
import type { NotificationDto } from "@/api/types/api.types";
import "@/styles/notificationModal.css";

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// 목 데이터 (알림이 있을 때 테스트용)
const MOCK_NOTIFICATIONS: NotificationDto[] = [
  {
    id: 1,
    title: "오늘의 일정 알림",
    body: "30분 후 '팀 회의'가 시작됩니다. 준비해주세요!",
    read: false,
    triggerTime: new Date(Date.now() - 5 * 60000).toISOString(),
    sentAt: new Date(Date.now() - 5 * 60000).toISOString(),
    status: "SENT"
  },
  {
    id: 2,
    title: "일정 추천",
    body: "오늘 날씨가 좋습니다. '공원 산책' 일정을 추가해보는 건 어떨까요?",
    read: false,
    triggerTime: new Date(Date.now() - 2 * 3600000).toISOString(),
    sentAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    status: "SENT"
  },
  {
    id: 3,
    title: "일정 완료",
    body: "'아침 운동' 일정을 완료하셨네요! 훌륭합니다 💪",
    read: true,
    triggerTime: new Date(Date.now() - 5 * 3600000).toISOString(),
    sentAt: new Date(Date.now() - 5 * 3600000).toISOString(),
    status: "SENT"
  },
  {
    id: 4,
    title: "다가오는 일정",
    body: "내일 '치과 예약'이 있습니다. 시간을 확인해주세요.",
    read: true,
    triggerTime: new Date(Date.now() - 86400000).toISOString(),
    sentAt: new Date(Date.now() - 86400000).toISOString(),
    status: "SENT"
  },
  {
    id: 5,
    title: "주간 리포트",
    body: "이번 주 완료한 일정: 15개 🎉 목표 달성률 85%입니다!",
    read: true,
    triggerTime: new Date(Date.now() - 2 * 86400000).toISOString(),
    sentAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    status: "SENT"
  },
  {
    id: 6,
    title: "날씨 알림",
    body: "오늘 오후 비 예보가 있습니다. 우산을 챙겨주세요 ☔",
    read: true,
    triggerTime: new Date(Date.now() - 3 * 86400000).toISOString(),
    sentAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    status: "SENT"
  },
  {
    id: 7,
    title: "반복 일정 알림",
    body: "'영어 공부' 시간입니다. 오늘도 화이팅!",
    read: true,
    triggerTime: new Date(Date.now() - 5 * 86400000).toISOString(),
    sentAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    status: "SENT"
  },
  {
    id: 8,
    title: "일정 변경 알림",
    body: "'프로젝트 미팅' 일정이 오후 3시로 변경되었습니다.",
    read: true,
    triggerTime: new Date(Date.now() - 7 * 86400000).toISOString(),
    sentAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    status: "SENT"
  }
];

// 빈 알림 (알림이 없을 때 테스트용)
// const MOCK_NOTIFICATIONS: NotificationDto[] = [];

export default function NotificationModal({ isOpen, onClose }: NotificationModalProps) {
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      // 목 데이터 사용 (실제 API 호출 대신)
      await new Promise(resolve => setTimeout(resolve, 500)); // 로딩 시뮬레이션
      setNotifications(MOCK_NOTIFICATIONS);
      
      // 실제 API 사용 시:
      // const data = await getMyNotifications();
      // setNotifications(data);
    } catch (error) {
      console.error('알림 목록을 불러오는데 실패했습니다:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '방금 전';
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    if (days < 7) return `${days}일 전`;
    
    return date.toLocaleDateString('ko-KR', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="notification-modal-overlay" onClick={onClose} />
      <div className="notification-modal">
        <div className="notification-modal-header">
          <h3>알림</h3>
          <button className="notification-close-btn" onClick={onClose} aria-label="닫기">
            ×
          </button>
        </div>
        
        <div className="notification-modal-content">
          {loading ? (
            <div className="notification-loading">
              <div className="pm-skeleton text skeleton-w-100 skeleton-mb-8"></div>
              <div className="pm-skeleton text skeleton-w-90 skeleton-mb-8"></div>
              <div className="pm-skeleton text skeleton-w-95"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="notification-empty">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z" fill="#999"/>
              </svg>
              <p>알림이 없습니다</p>
            </div>
          ) : (
            <div className="notification-list">
              {notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                >
                  <div className="notification-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" fill="#4A90E2" opacity="0.1"/>
                      <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="#4A90E2"/>
                    </svg>
                  </div>
                  <div className="notification-content">
                    <div className="notification-title">{notification.title}</div>
                    <div className="notification-body">{notification.body}</div>
                    <div className="notification-time">{formatDate(notification.sentAt)}</div>
                  </div>
                  {!notification.read && <div className="notification-unread-dot" />}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

