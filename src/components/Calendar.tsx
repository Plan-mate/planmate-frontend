"use client";

import { useState, useMemo, useEffect } from "react";
import { Event } from "@/types/event";
import EventIndicators from "./Calendar/EventIndicators";
import { formatDate, isToday, isCurrentMonth, getEventsForDate, generateCalendarDays } from "@/utils/calendarHelpers";

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
    return generateCalendarDays(currentDate);
  }, [currentDate]);

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
            const dayEvents = getEventsForDate(date, events);
            const isSelected = selectedDate === dateStr;
            
            return (
              <div
                key={index}
                className={`calendar-day ${!isCurrentMonth(date, currentDate) ? 'other-month' : ''} ${isToday(date) ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
                onClick={() => {
                  onDateSelect(dateStr);
                  if (onDateClickForAdd) {
                    onDateClickForAdd(dateStr);
                  }
                }}
              >
                <span className="day-number">{date.getDate()}</span>
                {dayEvents.length > 0 && <EventIndicators dayEvents={dayEvents} dateStr={dateStr} />}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
