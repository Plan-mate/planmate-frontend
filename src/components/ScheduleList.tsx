"use client";

interface Schedule {
  id: number;
  title: string;
  content: string;
  time: string;
  category: string;
  isCompleted: boolean;
  startDate: string;
  endDate: string;
}

interface ScheduleListProps {
  schedules: Schedule[];
  selectedDate: string | null;
  currentMonth: string;
  viewMode: 'list' | 'detail';
  selectedSchedule: Schedule | null;
  onScheduleSelect: (schedule: Schedule) => void;
  onBackToList: () => void;
  onViewAllSchedules: () => void;
}

const CATEGORY_COLORS: { [key: string]: string } = {
  '운동': '#10b981',
  '공부': '#3b82f6',
  '일': '#f59e0b',
  '기타': '#8b5cf6'
};

export default function ScheduleList({
  schedules,
  selectedDate,
  currentMonth,
  viewMode,
  selectedSchedule,
  onScheduleSelect,
  onBackToList,
  onViewAllSchedules
}: ScheduleListProps) {
  const getSchedulesForDate = (date: string) => {
    return schedules.filter(schedule => {
      const startDate = new Date(schedule.startDate);
      const endDate = new Date(schedule.endDate);
      const currentDate = new Date(date);
      return currentDate >= startDate && currentDate <= endDate;
    });
  };

  const getCurrentMonthSchedules = () => {
    if (!currentMonth) return [];
    
    const [year, month] = currentMonth.split('-').map(Number);
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0);
    
    return schedules.filter(schedule => {
      const scheduleStartDate = new Date(schedule.startDate);
      const scheduleEndDate = new Date(schedule.endDate);
      return (scheduleStartDate <= endOfMonth && scheduleEndDate >= startOfMonth);
    });
  };

  const getCategoryColor = (category: string) => {
    return CATEGORY_COLORS[category] || '#6b7280';
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

  if (viewMode === 'detail' && selectedSchedule) {
    return (
      <div className="schedule-detail">
        <div className="detail-header">
          <button onClick={onViewAllSchedules} className="back-btn">
            ←
          </button>
          <h3 className="detail-title">{formatDate(selectedSchedule.startDate)}</h3>
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
            <div className="detail-value">{selectedSchedule.title}</div>
          </div>
          
          <div className="detail-section">
            <label className="detail-label">내용</label>
            <div className="detail-value">{selectedSchedule.content}</div>
          </div>
          
          <div className="detail-row">
            <div className="detail-section">
              <label className="detail-label">시작일</label>
              <div className="detail-value">{formatDate(selectedSchedule.startDate)}</div>
            </div>
            
            <div className="detail-section">
              <label className="detail-label">종료일</label>
              <div className="detail-value">{formatDate(selectedSchedule.endDate)}</div>
            </div>
          </div>
          
          <div className="detail-section">
            <label className="detail-label">시간</label>
            <div className="detail-value">{selectedSchedule.time}</div>
          </div>
          
          <div className="detail-section">
            <label className="detail-label">카테고리</label>
            <div className="detail-value">
              <span 
                className="category-tag"
                style={{ backgroundColor: getCategoryColor(selectedSchedule.category) }}
              >
                {selectedSchedule.category}
              </span>
            </div>
          </div>
          
          <div className="detail-section">
            <label className="detail-label">상태</label>
            <div className="detail-value">
              <span className={`status-badge ${selectedSchedule.isCompleted ? 'completed' : 'pending'}`}>
                {selectedSchedule.isCompleted ? '완료' : '진행중'}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const filteredSchedules = selectedDate 
    ? getSchedulesForDate(selectedDate)
    : getCurrentMonthSchedules();

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
            <button onClick={onViewAllSchedules} className="back-btn">
              ←
            </button>
          )}
        </div>
      </div>
      
      {filteredSchedules.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📅</div>
          <p className="empty-text">{getEmptyStateMessage()}</p>
          <button className="empty-action-btn">첫 일정 등록하기</button>
        </div>
      ) : (
        <div className="schedule-items">
          {filteredSchedules.map(schedule => (
            <div
              key={schedule.id}
              className={`schedule-item ${schedule.isCompleted ? 'completed' : ''}`}
              onClick={() => onScheduleSelect(schedule)}
            >
              <div className="schedule-main">
                <div className="schedule-header">
                  <h4 className="schedule-title">{schedule.title}</h4>
                  <span 
                    className="category-badge"
                    style={{ backgroundColor: getCategoryColor(schedule.category) }}
                  >
                    {schedule.category}
                  </span>
                </div>
                
                <p className="schedule-content">{schedule.content}</p>
                
                <div className="schedule-meta">
                  <span className="schedule-time">{schedule.time}</span>
                  {schedule.isCompleted && (
                    <span className="completion-badge">완료</span>
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
