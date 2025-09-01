"use client";

import { useState, useMemo, useEffect } from "react";

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

interface CalendarProps {
  schedules: Schedule[];
  selectedDate: string | null;
  onDateSelect: (date: string) => void;
  onMonthChange?: (month: string) => void;
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

const CATEGORY_COLORS: { [key: string]: string } = {
  '운동': '#10b981',
  '공부': '#3b82f6',
  '일': '#f59e0b',
  '기타': '#8b5cf6'
};

export default function Calendar({ schedules, selectedDate, onDateSelect, onMonthChange }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [pendingMonthChange, setPendingMonthChange] = useState<string | null>(null);

  useEffect(() => {
    if (pendingMonthChange && onMonthChange) {
      onMonthChange(pendingMonthChange);
      setPendingMonthChange(null);
    }
  }, [pendingMonthChange, onMonthChange]);

  const calendarData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const currentDateObj = new Date(startDate);
    
    while (currentDateObj <= lastDay || currentDateObj.getDay() !== 0) {
      days.push(new Date(currentDateObj));
      currentDateObj.setDate(currentDateObj.getDate() + 1);
    }
    
    return days;
  }, [currentDate]);

  const getSchedulesForDate = (date: Date) => {
    const dateStr = formatDate(date);
    return schedules.filter(schedule => {
      const startDate = new Date(schedule.startDate);
      const endDate = new Date(schedule.endDate);
      const currentDate = new Date(dateStr);
      return currentDate >= startDate && currentDate <= endDate;
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getCategoryColor = (category: string) => {
    return CATEGORY_COLORS[category] || '#6b7280';
  };

  const createMonthChangeHandler = (direction: 'prev' | 'next') => () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev.getFullYear(), prev.getMonth() + (direction === 'next' ? 1 : -1), 1);
      const monthStr = `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}`;
      setPendingMonthChange(monthStr);
      return newDate;
    });
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    const monthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    setPendingMonthChange(monthStr);
    onDateSelect(formatDate(today));
  };

  const renderScheduleIndicators = (daySchedules: Schedule[], dateStr: string) => {
    const multiDaySchedules = daySchedules.filter(schedule => 
      schedule.startDate !== schedule.endDate
    );
    
    const singleDaySchedules = daySchedules.filter(schedule => 
      schedule.startDate === schedule.endDate
    );
    
    return (
      <div className="schedule-indicators">
        {multiDaySchedules.slice(0, 3).map((schedule, idx) => {
          const startDate = new Date(schedule.startDate);
          const endDate = new Date(schedule.endDate);
          const currentDate = new Date(dateStr);
          
          const isStart = currentDate.getTime() === startDate.getTime();
          const isEnd = currentDate.getTime() === endDate.getTime();
          const isMiddle = currentDate > startDate && currentDate < endDate;
          
          if (isStart || isMiddle || isEnd) {
            return (
              <div
                key={`multi-${idx}`}
                className={`schedule-highlight ${isStart ? 'start' : ''} ${isMiddle ? 'middle' : ''} ${isEnd ? 'end' : ''}`}
                style={{ backgroundColor: getCategoryColor(schedule.category) }}
                title={`${schedule.title} (${schedule.startDate} ~ ${schedule.endDate})`}
              />
            );
          }
          return null;
        })}
        
        {singleDaySchedules.slice(0, 2).map((schedule, idx) => (
          <div
            key={`single-${idx}`}
            className="schedule-dot"
            style={{ backgroundColor: getCategoryColor(schedule.category) }}
            title={`${schedule.title} (${schedule.time})`}
          />
        ))}
        
        {daySchedules.length > 5 && (
          <span className="more-indicator">+{daySchedules.length - 5}</span>
        )}
      </div>
    );
  };

  return (
    <div className="calendar">
      <div className="calendar-header">
        <button onClick={createMonthChangeHandler('prev')} className="calendar-nav-btn">
          ‹
        </button>
        <h2 className="calendar-title">
          {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
        </h2>
        <button onClick={createMonthChangeHandler('next')} className="calendar-nav-btn">
          ›
        </button>
      </div>
      
      <button onClick={goToToday} className="today-btn">
        Today
      </button>
      
      <div className="calendar-grid">
        <div className="calendar-weekdays">
          {WEEKDAYS.map(day => (
            <div key={day} className="weekday">{day}</div>
          ))}
        </div>
        
        <div className="calendar-days">
          {calendarData.map((date, index) => {
            const dateStr = formatDate(date);
            const daySchedules = getSchedulesForDate(date);
            const isSelected = selectedDate === dateStr;
            
            return (
              <div
                key={index}
                className={`calendar-day ${!isCurrentMonth(date) ? 'other-month' : ''} ${isToday(date) ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
                onClick={() => onDateSelect(dateStr)}
              >
                <span className="day-number">{date.getDate()}</span>
                {daySchedules.length > 0 && renderScheduleIndicators(daySchedules, dateStr)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
