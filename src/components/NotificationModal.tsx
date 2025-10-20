"use client";

import { useEffect, useState } from "react";
import { getMyNotifications, markAllAsRead } from "@/api/services/notification";
import type { NotificationDto } from "@/api/types/api.types";
import "@/styles/notificationModal.css";

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNotificationsRead?: () => void;
}


export default function NotificationModal({ isOpen, onClose, onNotificationsRead }: NotificationModalProps) {
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
      const data = await getMyNotifications();
      setNotifications(data);
    } catch (error) {
      console.error('알림 목록을 불러오는데 실패했습니다:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = async () => {
    try {
      await markAllAsRead();
      onNotificationsRead?.();
    } catch (error) {
      console.error('알림 읽음 처리 실패:', error);
    } finally {
      onClose();
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
      <div className="notification-modal-overlay" onClick={handleClose} />
      <div className="notification-modal">
        <div className="notification-modal-header">
          <h3>알림</h3>
          <button className="notification-close-btn" onClick={handleClose} aria-label="닫기">
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

