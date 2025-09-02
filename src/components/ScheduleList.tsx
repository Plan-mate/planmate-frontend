"use client";

import { Event, Category } from "@/types/event";

interface ScheduleListProps {
  events: Event[];
  categories: Category[];
  selectedDate: string | null;
  currentMonth: string;
  viewMode: 'list' | 'detail';
  selectedEvent: Event | null;
  onEventSelect: (event: Event) => void;
  onBackToList: () => void;
  onViewAllEvents: () => void;
}

export default function ScheduleList({
  events,
  categories,
  selectedDate,
  currentMonth,
  viewMode,
  selectedEvent,
  onEventSelect,
  onBackToList,
  onViewAllEvents
}: ScheduleListProps) {
  const getEventsForDate = (date: string) => {
    return events.filter(event => {
      const startDate = new Date(event.startTime);
      const endDate = new Date(event.endTime);
      const currentDate = new Date(date);
      return currentDate >= startDate && currentDate <= endDate;
    });
  };

  const getCurrentMonthEvents = () => {
    if (!currentMonth) return [];
    
    const [year, month] = currentMonth.split('-').map(Number);
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0);
    
    return events.filter(event => {
      const eventStartDate = new Date(event.startTime);
      const eventEndDate = new Date(event.endTime);
      return (eventStartDate <= endOfMonth && eventEndDate >= startOfMonth);
    });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];
    return `${month}월 ${day}일 (${dayOfWeek})`;
  };

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-').map(Number);
    return `${year}년 ${month}월`;
  };

  const formatTime = (dateTimeStr: string) => {
    return dateTimeStr.split('T')[1].substring(0, 5);
  };

  if (viewMode === 'detail' && selectedEvent) {
    return (
      <div className="schedule-detail">
        <div className="detail-header">
          <button onClick={onViewAllEvents} className="back-btn">
            ←
          </button>
          <h3 className="detail-title">{formatDate(selectedEvent.startTime)}</h3>
          <div className="detail-actions-top">
            <button className="action-icon-btn edit-icon-btn" title="수정">
              ✏
            </button>
            <button className="action-icon-btn delete-icon-btn" title="삭제">
              ✕
            </button>
          </div>
        </div>
        
        <div className="detail-content">
          <div className="detail-section">
            <label className="detail-label">제목</label>
            <div className="detail-value">{selectedEvent.title}</div>
          </div>
          
          <div className="detail-section">
            <label className="detail-label">내용</label>
            <div className="detail-value">{selectedEvent.description}</div>
          </div>
          
          <div className="detail-row">
            <div className="detail-section">
              <label className="detail-label">시작일</label>
              <div className="detail-value">{formatDate(selectedEvent.startTime)}</div>
            </div>
            
            <div className="detail-section">
              <label className="detail-label">종료일</label>
              <div className="detail-value">{formatDate(selectedEvent.endTime)}</div>
            </div>
          </div>
          
          <div className="detail-section">
            <label className="detail-label">시간</label>
            <div className="detail-value">
              {formatTime(selectedEvent.startTime)} - {formatTime(selectedEvent.endTime)}
            </div>
          </div>
          
          <div className="detail-section">
            <label className="detail-label">카테고리</label>
            <div className="detail-value">
              <span 
                className="category-tag"
                style={{ backgroundColor: selectedEvent.category.color }}
              >
                {selectedEvent.category.name}
              </span>
            </div>
          </div>
          
          <div className="detail-section">
            <label className="detail-label">반복</label>
            <div className="detail-value">
              <span className={`status-badge ${selectedEvent.isRecurring ? 'completed' : 'pending'}`}>
                {selectedEvent.isRecurring ? '반복' : '일회성'}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const filteredEvents = selectedDate 
    ? getEventsForDate(selectedDate)
    : getCurrentMonthEvents();

  const getEmptyStateMessage = () => {
    if (selectedDate) {
      return '이 날짜에 등록된 일정이 없습니다.';
    }
    return `${formatMonth(currentMonth)}에 등록된 일정이 없습니다.`;
  };

  return (
    <div className="schedule-list">
      <div className="list-header">
        <h3 className="list-title">
          {selectedDate ? `${formatDate(selectedDate)}` : `${formatMonth(currentMonth)} 전체 일정`}
        </h3>
        <div className="header-actions">
          {selectedDate && (
            <button onClick={onViewAllEvents} className="back-btn">
              ←
            </button>
          )}
        </div>
      </div>
      
      {filteredEvents.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📅</div>
          <p className="empty-text">{getEmptyStateMessage()}</p>
          <button className="empty-action-btn">첫 일정 등록하기</button>
        </div>
      ) : (
        <div className="schedule-items">
          {filteredEvents.map(event => (
            <div
              key={event.id}
              className="schedule-item"
              onClick={() => onEventSelect(event)}
            >
              <div className="schedule-main">
                <div className="schedule-header">
                  <h4 className="schedule-title">{event.title}</h4>
                  <span 
                    className="category-badge"
                    style={{ backgroundColor: event.category.color }}
                  >
                    {event.category.name}
                  </span>
                </div>
                
                <p className="schedule-content">{event.description}</p>
                
                <div className="schedule-meta">
                  <span className="schedule-time">
                    {formatTime(event.startTime)} - {formatTime(event.endTime)}
                  </span>
                  {event.isRecurring && (
                    <span className="completion-badge">반복</span>
                  )}
                </div>
              </div>
              
              <div className="schedule-arrow">›</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
