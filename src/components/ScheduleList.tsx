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
  onEditEvent?: (event: Event) => void;
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
  onViewAllEvents,
  onEditEvent
}: ScheduleListProps) {
  const getEventsForDate = (date: string) => {
    return events.filter(event => {
      const eventStartDate = new Date(event.startTime.split('T')[0]);
      const eventEndDate = new Date(event.endTime.split('T')[0]);
      const currentDate = new Date(date);
      
      // 정확한 날짜 매칭 (시간 부분 제외)
      return currentDate >= eventStartDate && currentDate <= eventEndDate;
    });
  };

  const getCurrentMonthEvents = () => {
    if (!currentMonth) return [];
    
    const [year, month] = currentMonth.split('-').map(Number);
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0);
    
    return events.filter(event => {
      const eventStartDate = new Date(event.startTime.split('T')[0]);
      const eventEndDate = new Date(event.endTime.split('T')[0]);
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
            <button 
              className="action-icon-btn edit-icon-btn" 
              title="수정"
              onClick={() => onEditEvent?.(selectedEvent)}
            >
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
                {selectedEvent.isRecurring ? (selectedEvent.originalEventId ? '반복' : '원본') : '일회성'}
              </span>
              {selectedEvent.isRecurring && selectedEvent.recurrenceRule && (
                <div style={{ marginTop: '8px', fontSize: '0.875rem', color: '#6b7280' }}>
                  {selectedEvent.recurrenceRule.frequency === 'DAILY' && '매일'}
                  {selectedEvent.recurrenceRule.frequency === 'WEEKLY' && '매주'}
                  {selectedEvent.recurrenceRule.frequency === 'MONTHLY' && '매월'}
                  {selectedEvent.recurrenceRule.daysOfWeek && selectedEvent.recurrenceRule.daysOfWeek.length > 0 && (
                    <span> ({selectedEvent.recurrenceRule.daysOfWeek.map(day => 
                      ['일', '월', '화', '수', '목', '금', '토'][parseInt(day)]
                    ).join(', ')})</span>
                  )}
                  {selectedEvent.recurrenceRule.endDate && (
                    <div style={{ marginTop: '4px' }}>
                      종료: {new Date(selectedEvent.recurrenceRule.endDate).toLocaleDateString()}
                    </div>
                  )}
                </div>
              )}
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
          {filteredEvents.map((event, index) => (
            <div
              key={event.id || `event-${index}`}
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
                    <span className="completion-badge">
                      {event.originalEventId ? '반복' : '원본'}
                    </span>
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
