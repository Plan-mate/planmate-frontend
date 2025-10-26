"use client";

import { useEffect, useMemo, useState } from "react";
import { Category, CreateEventRequest, Event, Scope } from "@/types/event";
import { createEvent, getCategory, updateEvent } from "@/api/services/plan";
import "@/styles/scheduleModal.css";
import { calculateDurationInDays, formatDateYMD, roundToTenMinutes, threeWeeksLaterYMD, todayYMD } from "@/utils/date";
import { validateScheduleForm, validateRecurrenceSettings, getValidRecurrenceTypes } from "@/utils/scheduleValidation";
import { useToast } from "./ToastProvider";

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (createdEvents: Event[]) => void;
  categories?: Category[];
  editEvent?: Event;
  isEditMode?: boolean;
  selectedScope?: Scope;
  initialDate?: string | null;
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
const MONTH_DATES = Array.from({ length: 31 }, (_, i) => i + 1);

const todayStr = todayYMD();
const formatDate = formatDateYMD;
const threeWeeksLaterStr = threeWeeksLaterYMD();

const INITIAL_FORM_DATA: CreateEventRequest = {
  title: "",
  description: "",
  categoryId: 0,
  startTime: `${todayStr}T00:00`,
  endTime: `${todayStr}T23:59`,
  isRecurring: false,
};

export default function ScheduleModal({ isOpen, onClose, onSubmit, categories, editEvent, isEditMode = false, selectedScope = 'ALL', initialDate }: ScheduleModalProps) {
  const { showToast } = useToast();
  const [formData, setFormData] = useState<CreateEventRequest>(INITIAL_FORM_DATA);
  const [recurrenceType, setRecurrenceType] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>('DAILY');
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [selectedDates, setSelectedDates] = useState<number[]>([]);
  const [recurrenceEndDate, setRecurrenceEndDate] = useState<string>("");
  const [isAllDay, setIsAllDay] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categoriesLocal, setCategoriesLocal] = useState<Category[]>(categories ?? []);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [validationError, setValidationError] = useState<string>("");
  const [isInitialized, setIsInitialized] = useState(false);
  const [noChangesMessage, setNoChangesMessage] = useState<string>("");

  const isValid = useMemo(() => {
    return validateScheduleForm(
      formData,
      recurrenceType,
      selectedDays,
      selectedDates,
      recurrenceEndDate
    );
  }, [formData, recurrenceType, selectedDays, selectedDates, recurrenceEndDate]);

  useEffect(() => {
    if (formData.isRecurring) {
      const durationDays = calculateDurationInDays(formData.startTime, formData.endTime);
      const validation = validateRecurrenceSettings(durationDays, recurrenceType, selectedDays, selectedDates);
      if (!validation.isValid) {
        setValidationError(validation.errorMessage || "");
      } else {
        setValidationError("");
      }
    } else {
      setValidationError("");
    }
  }, [formData.isRecurring, formData.startTime, formData.endTime, recurrenceType, selectedDays, selectedDates]);

  useEffect(() => {
    if (!formData.isRecurring) {
      setRecurrenceType('DAILY');
      setSelectedDays([]);
      setSelectedDates([]);
      setRecurrenceEndDate("");
      setValidationError("");
    } else {
      if (!recurrenceEndDate) {
        const endDate = new Date(formData.endTime);
        endDate.setDate(endDate.getDate() + 30);
        setRecurrenceEndDate(formatDate(endDate));
      }
    }
  }, [formData.isRecurring, formData.endTime, recurrenceEndDate]);

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
        if (mounted) {
          showToast('카테고리를 불러오지 못했어요', 'error');
        }
      } finally {
        if (mounted) setIsLoadingCategories(false);
      }
    })();
    return () => { mounted = false; };
  }, [isOpen, categories]);

  useEffect(() => {
    if (isOpen && !isEditMode) {
      const now = new Date();
      const nextHour = new Date(now);
      nextHour.setMinutes(0, 0, 0);
      nextHour.setHours(nextHour.getHours() + 1);
      
      const startDate = formatDate(nextHour);
      const startHour = nextHour.getHours();
      
      const endHour = new Date(nextHour);
      endHour.setHours(endHour.getHours() + 1);
      const endDate = formatDate(endHour);
      const endHourNum = endHour.getHours();
      
      const startHourStr = String(startHour).padStart(2, '0');
      const endHourStr = String(endHourNum).padStart(2, '0');
      
      const startTime = `${startDate}T${startHourStr}:00`;
      const endTime = `${endDate}T${endHourStr}:00`;

      setIsAllDay(false);
      setFormData(prev => ({
        ...prev,
        startTime,
        endTime
      }));
    }
  }, [isOpen, isEditMode, initialDate]);

  useEffect(() => {
    if (isOpen && isEditMode && editEvent) {
      setFormData({
        title: editEvent.title,
        description: editEvent.description,
        categoryId: editEvent.category.id,
        startTime: editEvent.startTime,
        endTime: editEvent.endTime,
        isRecurring: editEvent.isRecurring,
      });
      
      const startTime = editEvent.startTime.split('T')[1];
      const endTime = editEvent.endTime.split('T')[1];
      const isAllDayEvent = (startTime === '00:00' || startTime === '00:00:00') && (endTime === '23:59' || endTime === '23:59:00');
      setIsAllDay(isAllDayEvent);
      
      if (editEvent.isRecurring && editEvent.recurrenceRule) {
        const rule = editEvent.recurrenceRule;
        setRecurrenceType(rule.frequency);
        
        if (rule.endDate) {
          const endDate = new Date(rule.endDate);
          setRecurrenceEndDate(formatDate(endDate));
        } else {
          setRecurrenceEndDate("");
        }
        
        if (rule.frequency === 'WEEKLY' && rule.daysOfWeek) {
          setSelectedDays(rule.daysOfWeek.map(day => parseInt(day)));
        } else {
          setSelectedDays([]);
        }
        
        if (rule.frequency === 'MONTHLY' && rule.daysOfMonth) {
          setSelectedDates(rule.daysOfMonth);
        } else {
          setSelectedDates([]);
        }
      } else {
        setRecurrenceType('DAILY');
        setSelectedDays([]);
        setSelectedDates([]);
        setRecurrenceEndDate("");
      }
      setIsInitialized(true);
    } else if (isOpen && !isEditMode) {
      setIsInitialized(true);
    }
  }, [isOpen, isEditMode, editEvent]);

  const handleInputChange = (field: keyof CreateEventRequest, value: string | boolean | number) => {
    setFormData(prev => ({ ...prev, [field]: value } as CreateEventRequest));
  };

  const handleDayToggle = (dayIndex: number) => {
    const durationDays = calculateDurationInDays(formData.startTime, formData.endTime);
    const maxSelections = durationDays === 1 ? 7 : Math.floor(7 / durationDays);
    setSelectedDays(prev => {
      const newDays = prev.includes(dayIndex) ? prev.filter(d => d !== dayIndex) : [...prev, dayIndex];
      return newDays.slice(0, maxSelections);
    });
  };

  const handleDateToggle = (date: number) => {
    const durationDays = calculateDurationInDays(formData.startTime, formData.endTime);
    const maxSelections = durationDays === 1 ? 30 : Math.floor(30 / durationDays);
    setSelectedDates(prev => {
      const newDates = prev.includes(date) ? prev.filter(d => d !== date) : [...prev, date];
      return newDates.slice(0, maxSelections);
    });
  };

  const handleAllDayToggle = (checked: boolean) => {
    setIsAllDay(checked);
    const baseDate = formData.startTime ? formData.startTime.slice(0,10) : todayStr;
    if (checked) {
      setFormData(prev => ({ ...prev, startTime: `${baseDate}T00:00`, endTime: `${baseDate}T23:59` }));
    } else {
      const now = new Date();
      const nextHour = new Date(now);
      nextHour.setMinutes(0, 0, 0);
      nextHour.setHours(nextHour.getHours() + 1);
      
      const startDate = formatDate(nextHour);
      const startHour = nextHour.getHours();
      
      const endHour = new Date(nextHour);
      endHour.setHours(endHour.getHours() + 1);
      const endDate = formatDate(endHour);
      const endHourNum = endHour.getHours();
      
      const startHourStr = String(startHour).padStart(2, '0');
      const endHourStr = String(endHourNum).padStart(2, '0');
      
      const startTime = `${startDate}T${startHourStr}:00`;
      const endTime = `${endDate}T${endHourStr}:00`;
      
      setFormData(prev => ({ ...prev, startTime, endTime }));
    }
  };

  const handleAllDayDateChange = (dateValue: string, which: 'start' | 'end') => {
    if (!dateValue) return;
    if (which === 'start') {
      setFormData(prev => ({ ...prev, startTime: `${dateValue}T00:00`, endTime: `${dateValue}T23:59` }));
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
    
    const toLocalDateTimeString = (datetimeLocal: string): string => {
      return `${datetimeLocal}:00`;
    };
    
    return {
      title: formData.title,
      description: formData.description,
      categoryId: formData.categoryId,
      startTime: toLocalDateTimeString(formData.startTime),
      endTime: toLocalDateTimeString(formData.endTime),
      isRecurring: formData.isRecurring,
      recurrenceRule: formData.isRecurring ? {
        frequency: recurrenceType,
        interval: 1,
        daysOfWeek: recurrenceType === 'WEEKLY' ? selectedDays : undefined,
        daysOfMonth: recurrenceType === 'MONTHLY' ? selectedDates : undefined,
        endDate: recurrenceEndDate ? `${recurrenceEndDate}T23:59:59` : undefined,
      } : undefined,
    };
  };

  const getChangedFields = (original: Event, updated: CreateEventRequest) => {
    const changes: Partial<CreateEventRequest> = {};
    
    if (original.title !== updated.title) {
      changes.title = updated.title;
    }
    
    if (original.description !== updated.description) {
      changes.description = updated.description;
    }
    
    if (original.category.id !== updated.categoryId) {
      changes.categoryId = updated.categoryId;
    }
    
    if (original.startTime !== updated.startTime) {
      changes.startTime = updated.startTime;
    }
    
    if (original.endTime !== updated.endTime) {
      changes.endTime = updated.endTime;
    }
    
    if (original.originalEventId !== null) {
      changes.startTime = original.startTime;
      changes.endTime = original.endTime;
    }
    
    if (original.isRecurring !== updated.isRecurring) {
      changes.isRecurring = updated.isRecurring;
    }

    if (original.isRecurring === false && updated.isRecurring === true) {
      changes.startTime = updated.startTime;
      changes.endTime = updated.endTime;
    }
    
    if (original.isRecurring === true && updated.isRecurring === false) {
      changes.isRecurring = false;
      changes.recurrenceRule = undefined;
    }
    
    if (original.isRecurring && updated.isRecurring) {
      const originalRule = original.recurrenceRule;
      const updatedRule = updated.recurrenceRule;
      
      if (originalRule && updatedRule) {
        const frequencyChanged = originalRule.frequency !== updatedRule.frequency;
        const intervalChanged = originalRule.interval !== updatedRule.interval;
        
        const originalDaysOfWeek = originalRule.daysOfWeek ? [...originalRule.daysOfWeek].map(Number).sort() : [];
        const updatedDaysOfWeek = updatedRule.daysOfWeek ? [...updatedRule.daysOfWeek].map(Number).sort() : [];
        const daysOfWeekChanged = JSON.stringify(originalDaysOfWeek) !== JSON.stringify(updatedDaysOfWeek);
        
        const originalDaysOfMonth = originalRule.daysOfMonth || null;
        const updatedDaysOfMonth = updatedRule.daysOfMonth || null;
        const daysOfMonthChanged = JSON.stringify(originalDaysOfMonth) !== JSON.stringify(updatedDaysOfMonth);
        
        const endDateChanged = originalRule.endDate !== updatedRule.endDate;
        
        if (frequencyChanged || intervalChanged || daysOfWeekChanged || daysOfMonthChanged || endDateChanged) {
          changes.recurrenceRule = updatedRule;
          changes.isRecurring = true;
        }
      } else if (originalRule !== updatedRule) {
        changes.recurrenceRule = updatedRule;
        if (updatedRule) {
          changes.isRecurring = true;
        }
      }
    } else if (original.isRecurring !== updated.isRecurring) {
      changes.recurrenceRule = updated.recurrenceRule;
    }
    
    return changes;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!isValid) return;
    setIsSubmitting(true);

    try {
      const req = buildRequest();
      
      if (isEditMode && editEvent) {
        if (!isInitialized) {
          showToast('아직 로딩 중입니다. 잠시 후 다시 시도해주세요', 'error');
          setIsSubmitting(false);
          return;
        }
        
        const changedFields = getChangedFields(editEvent, req);
        
        if (Object.keys(changedFields).length === 0) {
          setNoChangesMessage('변경된 내용이 없습니다.');
          setIsSubmitting(false);
          return;
        }
        
        const scopeForUpdate = selectedScope;
        const updateReq = {
          eventId: editEvent.id || editEvent.originalEventId || 0,
          scope: scopeForUpdate,
          event: changedFields
        };
        
        try {
          const updated = await updateEvent(updateReq);
          onSubmit(updated as Event[]);
          showToast('일정을 수정했어요', 'success');
        } catch (error) {
          setValidationError('이벤트 수정에 실패했습니다. 다시 시도해주세요.');
          showToast('일정 수정에 실패했어요', 'error');
          setIsSubmitting(false);
          return;
        }
      } else {
        const created = await createEvent(req);
        onSubmit(created as Event[]);
        showToast('일정을 등록했어요', 'success');
      }
      
      handleClose();
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err?.message || '알 수 없는 오류';
      showToast(isEditMode ? '일정 수정에 실패했어요' : '일정 생성에 실패했어요', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecurrenceTypeChange = (newType: 'DAILY' | 'WEEKLY' | 'MONTHLY') => {
    const durationDays = calculateDurationInDays(formData.startTime, formData.endTime);
    const validTypes = getValidRecurrenceTypes(durationDays);
    
    if (validTypes.includes(newType)) {
      setRecurrenceType(newType);
      if (newType === 'WEEKLY') {
        setSelectedDates([]);
      } else if (newType === 'MONTHLY') {
        setSelectedDays([]);
      }
    }
  };

  const handleClose = () => {
    setFormData(INITIAL_FORM_DATA);
    setRecurrenceType('DAILY');
    setSelectedDays([]);
    setSelectedDates([]);
    setRecurrenceEndDate("");
    setValidationError("");
    setIsSubmitting(false);
    setIsInitialized(false);
    setNoChangesMessage("");
    onClose();
  };

  if (!isOpen) return null;

  const startDateOnly = formData.startTime ? formData.startTime.slice(0,10) : todayStr;
  const endDateOnly = formData.endTime ? formData.endTime.slice(0,10) : todayStr;
  const durationDays = calculateDurationInDays(formData.startTime, formData.endTime);
  const validRecurrenceTypes = getValidRecurrenceTypes(durationDays);

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content toss-style wide pm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header toss-header">
          <button className="close-btn toss-close" onClick={handleClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <h2 className="modal-title">{isEditMode ? '일정 수정' : '새 일정'}</h2>
        </div>

        {noChangesMessage && (
          <div className="no-changes-message">
            <div className="message-content">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="message-icon">
                <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>{noChangesMessage}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="schedule-form toss-form compact pm-form">
          <div className="form-section">
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

            <div className={`row date-row ${isAllDay ? 'is-all-day' : 'is-range'}`}>
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
              <div className={`row-field field-inline nowrap date-inline ${isAllDay ? 'all-day' : 'time-range'}`}>
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

            <div className="row recur-row">
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
                {isLoadingCategories && (
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>카테고리를 불러오는 중...</div>
                )}
                {formData.isRecurring && (
                  <div className="field-inline nowrap recur-inline">
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
                    <div className="segmented recur-tabs">
                      <button 
                        type="button" 
                        className={`seg-btn ${recurrenceType === 'DAILY' ? 'active' : ''} ${!validRecurrenceTypes.includes('DAILY') ? 'disabled' : ''}`} 
                        onClick={() => handleRecurrenceTypeChange('DAILY')}
                        disabled={!validRecurrenceTypes.includes('DAILY')}
                        title={!validRecurrenceTypes.includes('DAILY') ? `${durationDays}일 기간은 매일 반복이 불가능합니다` : ''}
                      >
                        매일
                      </button>
                      <button 
                        type="button" 
                        className={`seg-btn ${recurrenceType === 'WEEKLY' ? 'active' : ''} ${!validRecurrenceTypes.includes('WEEKLY') ? 'disabled' : ''}`} 
                        onClick={() => handleRecurrenceTypeChange('WEEKLY')}
                        disabled={!validRecurrenceTypes.includes('WEEKLY')}
                        title={!validRecurrenceTypes.includes('WEEKLY') ? `${durationDays}일 기간은 매주 반복이 불가능합니다` : ''}
                      >
                        매주
                      </button>
                      <button 
                        type="button" 
                        className={`seg-btn ${recurrenceType === 'MONTHLY' ? 'active' : ''} ${!validRecurrenceTypes.includes('MONTHLY') ? 'disabled' : ''}`} 
                        onClick={() => handleRecurrenceTypeChange('MONTHLY')}
                        disabled={!validRecurrenceTypes.includes('MONTHLY')}
                        title={!validRecurrenceTypes.includes('MONTHLY') ? `${durationDays}일 기간은 매월 반복이 불가능합니다` : ''}
                      >
                        매월
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className={`recur-container ${formData.isRecurring ? 'open' : ''}`} aria-hidden={!formData.isRecurring}>
              <div className="recur-inner">
                {validationError && (
                  <div className="validation-error" style={{ color: '#ff4444', fontSize: '14px', marginBottom: '12px', textAlign: 'center' }}>
                    {validationError}
                  </div>
                )}
                <div className="recurrence-block recur-panels center">
                  {recurrenceType === 'WEEKLY' && (
                    <div>
                      <div className="selection-limit-info" style={{ fontSize: '12px', color: '#666', marginBottom: '8px', textAlign: 'center' }}>
                        {(() => {
                          const durationDays = calculateDurationInDays(formData.startTime, formData.endTime);
                          const maxSelections = durationDays === 1 ? 7 : Math.floor(7 / durationDays);
                          return `최대 ${maxSelections}개 요일 선택 가능`;
                        })()}
                      </div>
                      <div className="weekday-picker">
                        {WEEKDAYS.map((day, index) => {
                          const durationDays = calculateDurationInDays(formData.startTime, formData.endTime);
                          const maxSelections = durationDays === 1 ? 7 : Math.floor(7 / durationDays);
                          const isDisabled = selectedDays.length >= maxSelections && !selectedDays.includes(index);
                          const tooltipText = isDisabled ? `최대 ${maxSelections}개까지만 선택 가능합니다` : '';
                          
                          return (
                            <button 
                              key={day} 
                              type="button" 
                              className={`day-btn pm-day-btn small ${selectedDays.includes(index) ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`} 
                              onClick={() => handleDayToggle(index)}
                              disabled={isDisabled}
                              title={tooltipText}
                            >
                              {day}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {recurrenceType === 'MONTHLY' && (
                    <div>
                      <div className="selection-limit-info" style={{ fontSize: '12px', color: '#666', marginBottom: '8px', textAlign: 'center' }}>
                        {(() => {
                          const durationDays = calculateDurationInDays(formData.startTime, formData.endTime);
                          const maxSelections = durationDays === 1 ? 30 : Math.floor(30 / durationDays);
                          return `최대 ${maxSelections}개 날짜 선택 가능`;
                        })()}
                      </div>
                      <div className="date-selector pm-date-selector">
                        {MONTH_DATES.map(date => {
                          const durationDays = calculateDurationInDays(formData.startTime, formData.endTime);
                          const maxSelections = durationDays === 1 ? 30 : Math.floor(30 / durationDays);
                          const isDisabled = selectedDates.length >= maxSelections && !selectedDates.includes(date);
                          const tooltipText = isDisabled ? `최대 ${maxSelections}개까지만 선택 가능합니다` : '';
                          
                          return (
                            <button 
                              key={date} 
                              type="button" 
                              className={`date-btn pm-date-btn small ${selectedDates.includes(date) ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`} 
                              onClick={() => handleDateToggle(date)}
                              disabled={isDisabled}
                              title={tooltipText}
                            >
                              {date}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="form-actions pm-actions">
            <button type="button" className="pm-btn pm-btn--ghost" onClick={handleClose}>취소</button>
            <button type="submit" className="pm-btn pm-btn--primary" disabled={isSubmitting || !isValid}>
              {isEditMode ? '수정' : '등록'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
