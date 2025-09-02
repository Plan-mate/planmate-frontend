"use client";

import { useEffect, useMemo, useState } from "react";
import { Category, CreateEventRequest } from "@/types/event";
import { createEvent, getCategory } from "@/api/services/plan";
import "@/styles/scheduleModal.css";

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (eventData: CreateEventRequest) => void;
  categories?: Category[];
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
const MONTH_DATES = Array.from({ length: 31 }, (_, i) => i + 1);

const todayStr = (() => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
})();

const formatDate = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const threeWeeksLaterStr = (() => {
  const d = new Date();
  d.setDate(d.getDate() + 21);
  return formatDate(d);
})();

// 10분 단위 반올림 보정 (가장 가까운 10분)
const roundToTenMinutes = (value: string): string => {
  if (!value) return value;
  const [datePart, timePart] = value.split('T');
  if (!timePart) return value;
  const [hh, mm] = timePart.split(':');
  const hours = Number(hh);
  const minutes = Number(mm);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return value;
  const rounded = Math.round(minutes / 10) * 10;
  let newHours = hours;
  let newMinutes = rounded;
  if (rounded === 60) {
    newMinutes = 0;
    newHours = (hours + 1) % 24;
  }
  const hhStr = String(newHours).padStart(2, '0');
  const mmStr = String(newMinutes).padStart(2, '0');
  return `${datePart}T${hhStr}:${mmStr}`;
};

const INITIAL_FORM_DATA: CreateEventRequest = {
  title: "",
  description: "",
  categoryId: 0,
  startTime: `${todayStr}T00:00`,
  endTime: `${todayStr}T23:59`,
  isRecurring: false,
};

export default function ScheduleModal({ isOpen, onClose, onSubmit, categories }: ScheduleModalProps) {
  const [formData, setFormData] = useState<CreateEventRequest>(INITIAL_FORM_DATA);
  const [recurrenceType, setRecurrenceType] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>('DAILY');
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [selectedDates, setSelectedDates] = useState<number[]>([]);
  const [recurrenceEndDate, setRecurrenceEndDate] = useState<string>("");
  const [isAllDay, setIsAllDay] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categoriesLocal, setCategoriesLocal] = useState<Category[]>(categories ?? []);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);

  const isValid = useMemo(() => {
    if (!formData.title || !formData.title.trim()) return false;
    if (!formData.categoryId || formData.categoryId <= 0) return false;
    if (!formData.startTime || !formData.endTime) return false;
    if (new Date(formData.endTime) < new Date(formData.startTime)) return false;
    if (formData.isRecurring) {
      if (!recurrenceEndDate) return false;
      if (recurrenceType === 'WEEKLY' && selectedDays.length === 0) return false;
      if (recurrenceType === 'MONTHLY' && selectedDates.length === 0) return false;
    }
    return true;
  }, [formData.title, formData.categoryId, formData.startTime, formData.endTime, formData.isRecurring, recurrenceEndDate, recurrenceType, selectedDays, selectedDates]);

  useEffect(() => {
    if (!isOpen) return;
    let mounted = true;
    (async () => {
      try {
        setIsLoadingCategories(true);
        const data = await getCategory();
        if (mounted) setCategoriesLocal(data as Category[]);
      } catch (e) {
        if (mounted && categories && categories.length) {
          setCategoriesLocal(categories);
        }
      } finally {
        if (mounted) setIsLoadingCategories(false);
      }
    })();
    return () => { mounted = false; };
  }, [isOpen, categories]);

  const handleInputChange = (field: keyof CreateEventRequest, value: string | boolean | number) => {
    setFormData(prev => ({ ...prev, [field]: value } as CreateEventRequest));
  };

  const handleDayToggle = (dayIndex: number) => {
    setSelectedDays(prev => prev.includes(dayIndex) ? prev.filter(d => d !== dayIndex) : [...prev, dayIndex]);
  };

  const handleDateToggle = (date: number) => {
    setSelectedDates(prev => prev.includes(date) ? prev.filter(d => d !== date) : [...prev, date]);
  };

  const handleAllDayToggle = (checked: boolean) => {
    setIsAllDay(checked);
    const baseDate = formData.startTime ? formData.startTime.slice(0,10) : todayStr;
    if (checked) {
      setFormData(prev => ({ ...prev, startTime: `${baseDate}T00:00`, endTime: `${baseDate}T23:59` }));
    }
  };

  const handleAllDayDateChange = (dateValue: string, which: 'start' | 'end') => {
    if (!dateValue) return;
    if (which === 'start') {
      let endDate = formData.endTime ? formData.endTime.slice(0,10) : dateValue;
      if (new Date(endDate) < new Date(dateValue)) endDate = dateValue;
      setFormData(prev => ({ ...prev, startTime: `${dateValue}T00:00`, endTime: `${endDate}T23:59` }));
    } else {
      let endDate = dateValue;
      const startDate = formData.startTime ? formData.startTime.slice(0,10) : dateValue;
      if (new Date(endDate) < new Date(startDate)) endDate = startDate;
      setFormData(prev => ({ ...prev, endTime: `${endDate}T23:59` }));
    }
  };

  const buildRequest = (): CreateEventRequest => {
    if (!formData.categoryId || formData.categoryId <= 0) {
      throw new Error('카테고리를 선택하세요');
    }
    const req: CreateEventRequest = {
      title: formData.title,
      description: formData.description,
      categoryId: formData.categoryId,
      startTime: formData.startTime,
      endTime: formData.endTime,
      isRecurring: formData.isRecurring,
      recurrenceRule: formData.isRecurring ? {
        frequency: recurrenceType,
        interval: 1,
        daysOfWeek: recurrenceType === 'WEEKLY' ? selectedDays : undefined,
        daysOfMonth: recurrenceType === 'MONTHLY' ? selectedDates : undefined,
        endDate: recurrenceEndDate || undefined,
      } : undefined,
    };
    return req;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!isValid) return;
    setIsSubmitting(true);

    try {
      const req = buildRequest();
      await createEvent(req);
      onSubmit(req);
      handleClose();
    } catch (err) {
      console.error(err);
      alert('일정 생성에 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData(INITIAL_FORM_DATA);
    setRecurrenceType('DAILY');
    setSelectedDays([]);
    setSelectedDates([]);
    setRecurrenceEndDate("");
    setIsAllDay(true);
    onClose();
  };

  if (!isOpen) return null;

  const startDateOnly = formData.startTime ? formData.startTime.slice(0,10) : todayStr;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content toss-style wide pm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header toss-header">
          <button className="close-btn toss-close" onClick={handleClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <h2 className="modal-title">새 일정</h2>
        </div>

        <form onSubmit={handleSubmit} className="schedule-form toss-form compact pm-form">
          <div className="form-section">
            {/* 제목 */}
            <div className="row">
              <div className="row-label">제목</div>
              <div className="row-field">
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value.slice(0,50))}
                  placeholder="일정 제목 (최대 50자)"
                  className="toss-input small pm-input full"
                  required
                  maxLength={50}
                  autoFocus
                />
              </div>
            </div>

            {/* 메모 */}
            <div className="row">
              <div className="row-label">메모</div>
              <div className="row-field">
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value.slice(0,50))}
                  placeholder="여기에 메모를 입력하세요 (선택)"
                  className="toss-input small pm-input full"
                  maxLength={50}
                />
              </div>
            </div>

            {/* 카테고리 */}
            <div className="row">
              <div className="row-label">카테고리</div>
              <div className="row-field">
                <div className="category-chips compact wrap pm-chips">
                  {(categoriesLocal || []).map(category => {
                    const selected = formData.categoryId === category.id;
                    return (
                      <button
                        key={category.id}
                        type="button"
                        className={`chip small pm-chip ${selected ? 'selected' : ''}`}
                        style={{ borderColor: selected ? category.color : undefined }}
                        onClick={() => handleInputChange('categoryId', category.id)}
                      >
                        <span className="chip-dot pm-chip__dot" style={{ backgroundColor: category.color }} />
                        {category.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 날짜 (하루종일 포함) */}
            <div className="row">
              <div className="row-label">날짜
                <button
                  type="button"
                  title="하루 종일"
                  aria-label="하루 종일 토글"
                  className={`icon-toggle ${isAllDay ? 'active' : ''}`}
                  onClick={() => handleAllDayToggle(!isAllDay)}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 4V2M12 22v-2M4.93 4.93 3.51 3.51M20.49 20.49l-1.42-1.42M20 12h2M2 12h2M4.93 19.07l-1.42 1.42M20.49 3.51l-1.42 1.42" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                    <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="1.6"/>
                  </svg>
                </button>
              </div>
              <div className="row-field field-inline nowrap date-inline">
                {!isAllDay ? (
                  <div className="inline-time">
                    <input
                      type="datetime-local"
                      value={formData.startTime}
                      step={600}
                      onChange={(e) => {
                        const v = roundToTenMinutes(e.target.value);
                        handleInputChange('startTime', v);
                        if (formData.endTime && new Date(formData.endTime) < new Date(v)) {
                          handleInputChange('endTime', v);
                        }
                      }}
                      className="toss-input small pm-input"
                      required
                    />
                    <span className="tilde">~</span>
                    <input
                      type="datetime-local"
                      value={formData.endTime}
                      step={600}
                      min={formData.startTime || undefined}
                      onChange={(e) => {
                        const v = roundToTenMinutes(e.target.value);
                        if (formData.startTime && new Date(v) < new Date(formData.startTime)) {
                          handleInputChange('endTime', formData.startTime);
                        } else {
                          handleInputChange('endTime', v);
                        }
                      }}
                      className="toss-input small pm-input"
                      required
                    />
                  </div>
                ) : (
                  <div className="inline-time">
                    <input
                      type="date"
                      value={startDateOnly}
                      onChange={(e) => handleAllDayDateChange(e.target.value, 'start')}
                      className="toss-input small pm-input"
                      required
                    />
                  </div>
                )}
              </div>
            </div>

            {/* 반복 */}
            <div className="row">
              <div className="row-label">반복
                <button
                  type="button"
                  title="반복"
                  aria-label="반복 토글"
                  className={`icon-toggle ${formData.isRecurring ? 'active' : ''}`}
                  onClick={() => handleInputChange('isRecurring', !formData.isRecurring)}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17 1v-0.01V5h-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M7 23v-4h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M20.49 12A8.5 8.5 0 0 0 9 4.2L7 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                    <path d="M3.51 12A8.5 8.5 0 0 0 15 19.8l2-0.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
              <div className="row-field">
                {formData.isRecurring && (
                  <div className="field-inline nowrap recur-inline">
                    <div className="segmented recur-tabs">
                      <button type="button" className={`seg-btn ${recurrenceType === 'DAILY' ? 'active' : ''}`} onClick={() => setRecurrenceType('DAILY')}>매일</button>
                      <button type="button" className={`seg-btn ${recurrenceType === 'WEEKLY' ? 'active' : ''}`} onClick={() => setRecurrenceType('WEEKLY')}>매주</button>
                      <button type="button" className={`seg-btn ${recurrenceType === 'MONTHLY' ? 'active' : ''}`} onClick={() => setRecurrenceType('MONTHLY')}>매월</button>
                    </div>
                    <div className="end-date-row inline">
                      <span className="end-date-label">종료일</span>
                      <input
                        type="date"
                        value={recurrenceEndDate}
                        min={threeWeeksLaterStr}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (v && new Date(v) < new Date(threeWeeksLaterStr)) {
                            setRecurrenceEndDate(threeWeeksLaterStr);
                          } else {
                            setRecurrenceEndDate(v);
                          }
                        }}
                        className="toss-input small pm-input"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 반복 상세 옵션: 레이아웃 점프 방지 grid 전환 */}
            <div className={`recur-container ${formData.isRecurring ? 'open' : ''}`} aria-hidden={!formData.isRecurring}>
              <div className="recur-inner">
                <div className="recurrence-block recur-panels center">
                  {recurrenceType === 'WEEKLY' && (
                    <div className="weekday-picker">
                      {WEEKDAYS.map((day, index) => (
                        <button key={day} type="button" className={`day-btn pm-day-btn small ${selectedDays.includes(index) ? 'selected' : ''}`} onClick={() => handleDayToggle(index)}>{day}</button>
                      ))}
                    </div>
                  )}
                  {recurrenceType === 'MONTHLY' && (
                    <div className="date-selector pm-date-selector">
                      {MONTH_DATES.map(date => (
                        <button key={date} type="button" className={`date-btn pm-date-btn small ${selectedDates.includes(date) ? 'selected' : ''}`} onClick={() => handleDateToggle(date)}>{date}</button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="form-actions pm-actions">
            <button type="button" className="cancel-btn pm-btn pm-btn--ghost" onClick={handleClose}>취소</button>
            <button type="submit" className="submit-btn pm-btn pm-btn--primary" disabled={isSubmitting || !isValid}>등록</button>
          </div>
        </form>
      </div>
    </div>
  );
}
