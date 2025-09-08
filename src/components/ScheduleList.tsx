"use client";

import { Event, Category, Scope } from "@/types/event";
import { formatDisplayDate, formatDisplayMonth, formatDisplayTime } from "@/utils/date";
import RecurrenceBadge from "./RecurrenceBadge";

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
  onEditEvent?: (event: Event, scope?: Scope) => void;
  onDeleteEvent?: (event: Event) => void;
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
  onEditEvent,
  onDeleteEvent
}: ScheduleListProps) {
  const getEventsForDate = (date: string) => {
    return events.filter(event => {
      const eventStartDate = new Date(event.startTime.split('T')[0]);
      const eventEndDate = new Date(event.endTime.split('T')[0]);
      const currentDate = new Date(date);
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
  if (viewMode === 'detail' && selectedEvent) {
    return (
      <div className="schedule-detail">
        <div className="detail-header">
          <button onClick={onViewAllEvents} className="back-btn">
            ←
          </button>
          <h3 className="detail-title">{formatDisplayDate(selectedEvent.startTime)}</h3>
          <div className="detail-actions-top">
            <button 
              className="pm-btn pm-btn--icon" 
              title="수정"
              onClick={(e) => { e.stopPropagation(); onEditEvent?.(selectedEvent); }}
            >
              ✏
            </button>
            <button className="pm-btn pm-btn--icon" title="삭제" onClick={(e) => { e.stopPropagation(); onDeleteEvent?.(selectedEvent); }}>
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
              <div className="detail-value">{formatDisplayDate(selectedEvent.startTime)}</div>
            </div>
            
            <div className="detail-section">
              <label className="detail-label">종료일</label>
              <div className="detail-value">{formatDisplayDate(selectedEvent.endTime)}</div>
            </div>
          </div>
          
          <div className="detail-section">
            <label className="detail-label">시간</label>
            <div className="detail-value">
              {formatDisplayTime(selectedEvent.startTime)} - {formatDisplayTime(selectedEvent.endTime)}
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
            <div className="detail-value" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <RecurrenceBadge event={selectedEvent} />
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
    return `${formatDisplayMonth(currentMonth)}에 등록된 일정이 없습니다.`;
  };

  return (
    <div className="schedule-list">
      <div className="list-header">
        <h3 className="list-title">
          {selectedDate ? `${formatDisplayDate(selectedDate)}` : `${formatDisplayMonth(currentMonth)} 전체 일정`}
        </h3>
        <div className="header-actions">
          {selectedDate && (
            <button onClick={onViewAllEvents} className="pm-btn pm-btn--ghost">
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
                
                <div className="schedule-meta" style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span className="schedule-time" style={{ color: '#64748b', fontSize: '.9rem' }}>
                    {formatDisplayTime(event.startTime)} - {formatDisplayTime(event.endTime)}
                  </span>
                  <RecurrenceBadge event={event} />
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
