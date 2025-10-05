"use client";

import { useState, useMemo, useEffect } from "react";
import { Event } from "@/types/event";

interface CalendarProps {
  events: Event[];
  selectedDate: string | null;
  onDateSelect: (date: string) => void;
  onMonthChange?: (month: string) => void;
  onDateClickForAdd?: (date: string) => void;
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

export default function Calendar({ events, selectedDate, onDateSelect, onMonthChange, onDateClickForAdd }: CalendarProps) {
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

  const getEventsForDate = (date: Date) => {
    const dateStr = formatDate(date);
    return events.filter(event => {
      const eventStartDate = new Date(event.startTime.split('T')[0]);
      const eventEndDate = new Date(event.endTime.split('T')[0]);
      const currentDate = new Date(dateStr);
      
      return currentDate >= eventStartDate && currentDate <= eventEndDate;
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

  const renderEventIndicators = (dayEvents: Event[], dateStr: string) => {
    const multiDayEvents = dayEvents.filter(event => 
      event.startTime.split('T')[0] !== event.endTime.split('T')[0]
    );
    
    const singleDayEvents = dayEvents.filter(event => 
      event.startTime.split('T')[0] === event.endTime.split('T')[0]
    );
    
    return (
      <div className="schedule-indicators">
        {multiDayEvents.slice(0, 3).map((event, idx) => {
          const startDate = new Date(event.startTime);
          const endDate = new Date(event.endTime);
          const currentDate = new Date(dateStr);
          
          const isStart = currentDate.getTime() === startDate.getTime();
          const isEnd = currentDate.getTime() === endDate.getTime();
          const isMiddle = currentDate > startDate && currentDate < endDate;
          
          if (isStart || isMiddle || isEnd) {
            return (
              <div
                key={`multi-${idx}`}
                className={`schedule-highlight ${isStart ? 'start' : ''} ${isMiddle ? 'middle' : ''} ${isEnd ? 'end' : ''}`}
                style={{ backgroundColor: event.category.color }}
                title={`${event.title} (${event.startTime.split('T')[0]} ~ ${event.endTime.split('T')[0]})`}
              />
            );
          }
          return null;
        })}
        
        {singleDayEvents.slice(0, 2).map((event, idx) => (
          <div
            key={`single-${idx}`}
            className="schedule-dot"
            style={{ backgroundColor: event.category.color }}
            title={`${event.title} (${event.startTime.split('T')[1]})`}
          />
        ))}
        
        {dayEvents.length > 5 && (
          <span className="more-indicator">+{dayEvents.length - 5}</span>
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
            const dayEvents = getEventsForDate(date);
            const isSelected = selectedDate === dateStr;
            
            return (
              <div
                key={index}
                className={`calendar-day ${!isCurrentMonth(date) ? 'other-month' : ''} ${isToday(date) ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
                onClick={() => {
                  onDateSelect(dateStr);
                  if (onDateClickForAdd) {
                    onDateClickForAdd(dateStr);
                  }
                }}
              >
                <span className="day-number">{date.getDate()}</span>
                {dayEvents.length > 0 && renderEventIndicators(dayEvents, dateStr)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
