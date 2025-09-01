"use client";

import { useState } from "react";
import "@/styles/scheduleModal.css";

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (scheduleData: ScheduleFormData) => void;
}

export interface ScheduleFormData {
  title: string;
  description: string;
  category: string;
  start_time: string;
  end_time: string;
  is_recurring: boolean;
  recurrence_type?: 'daily' | 'weekly' | 'monthly';
  recurrence_days?: number[];
  recurrence_dates?: number[];
}

const CATEGORIES = ['운동', '공부', '일', '기타'];
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
const MONTH_DATES = Array.from({ length: 31 }, (_, i) => i + 1);

const INITIAL_FORM_DATA: ScheduleFormData = {
  title: "",
  description: "",
  category: "기타",
  start_time: "",
  end_time: "",
  is_recurring: false,
};

export default function ScheduleModal({ isOpen, onClose, onSubmit }: ScheduleModalProps) {
  const [formData, setFormData] = useState<ScheduleFormData>(INITIAL_FORM_DATA);
  const [recurrenceType, setRecurrenceType] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [selectedDates, setSelectedDates] = useState<number[]>([]);

  const handleInputChange = (field: keyof ScheduleFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDayToggle = (dayIndex: number) => {
    setSelectedDays(prev => 
      prev.includes(dayIndex) 
        ? prev.filter(d => d !== dayIndex)
        : [...prev, dayIndex]
    );
  };

  const handleDateToggle = (date: number) => {
    setSelectedDates(prev => 
      prev.includes(date) 
        ? prev.filter(d => d !== date)
        : [...prev, date]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = { ...formData };
    
    if (formData.is_recurring) {
      submitData.recurrence_type = recurrenceType;
      
      if (recurrenceType === 'weekly') {
        submitData.recurrence_days = selectedDays;
      } else if (recurrenceType === 'monthly') {
        submitData.recurrence_dates = selectedDates;
      }
    }

    onSubmit(submitData);
    handleClose();
  };

  const handleClose = () => {
    setFormData(INITIAL_FORM_DATA);
    setRecurrenceType('daily');
    setSelectedDays([]);
    setSelectedDates([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>새 일정 등록</h2>
          <button className="close-btn" onClick={handleClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="schedule-form">
          <div className="form-group">
            <label htmlFor="title">제목 *</label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="일정 제목을 입력하세요"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">설명</label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="일정에 대한 설명을 입력하세요"
              rows={3}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="category">카테고리</label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
              >
                {CATEGORIES.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.is_recurring}
                  onChange={(e) => handleInputChange('is_recurring', e.target.checked)}
                />
                반복 일정
              </label>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="start_time">시작 시간 *</label>
              <input
                type="datetime-local"
                id="start_time"
                value={formData.start_time}
                onChange={(e) => handleInputChange('start_time', e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="end_time">종료 시간 *</label>
              <input
                type="datetime-local"
                id="end_time"
                value={formData.end_time}
                onChange={(e) => handleInputChange('end_time', e.target.value)}
                required
              />
            </div>
          </div>

          {formData.is_recurring && (
            <div className="recurrence-section">
              <h3>반복 설정</h3>
              
              <div className="form-group">
                <label>반복 주기</label>
                <div className="radio-group">
                  <label>
                    <input
                      type="radio"
                      name="recurrenceType"
                      value="daily"
                      checked={recurrenceType === 'daily'}
                      onChange={(e) => setRecurrenceType(e.target.value as 'daily' | 'weekly' | 'monthly')}
                    />
                    매일
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="recurrenceType"
                      value="weekly"
                      checked={recurrenceType === 'weekly'}
                      onChange={(e) => setRecurrenceType(e.target.value as 'daily' | 'weekly' | 'monthly')}
                    />
                    매주
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="recurrenceType"
                      value="monthly"
                      checked={recurrenceType === 'monthly'}
                      onChange={(e) => setRecurrenceType(e.target.value as 'daily' | 'weekly' | 'monthly')}
                    />
                    매월
                  </label>
                </div>
              </div>

              {recurrenceType === 'weekly' && (
                <div className="form-group">
                  <label>요일 선택</label>
                  <div className="day-selector">
                    {WEEKDAYS.map((day, index) => (
                      <button
                        key={day}
                        type="button"
                        className={`day-btn ${selectedDays.includes(index) ? 'selected' : ''}`}
                        onClick={() => handleDayToggle(index)}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {recurrenceType === 'monthly' && (
                <div className="form-group">
                  <label>일 선택</label>
                  <div className="date-selector">
                    {MONTH_DATES.map(date => (
                      <button
                        key={date}
                        type="button"
                        className={`date-btn ${selectedDates.includes(date) ? 'selected' : ''}`}
                        onClick={() => handleDateToggle(date)}
                      >
                        {date}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={handleClose}>
              취소
            </button>
            <button type="submit" className="submit-btn">
              등록
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
