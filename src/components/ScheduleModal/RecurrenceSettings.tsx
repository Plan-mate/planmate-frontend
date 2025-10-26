import { Category, CreateEventRequest } from "@/types/event";
import { calculateDurationInDays, formatDateYMD } from "@/utils/date";

interface RecurrenceSettingsProps {
  formData: CreateEventRequest;
  recurrenceType: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  selectedDays: number[];
  selectedDates: number[];
  recurrenceEndDate: string;
  validationError: string;
  onRecurrenceTypeChange: (type: 'DAILY' | 'WEEKLY' | 'MONTHLY') => void;
  onDayToggle: (dayIndex: number) => void;
  onDateToggle: (date: number) => void;
  onRecurrenceEndDateChange: (date: string) => void;
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
const MONTH_DATES = Array.from({ length: 31 }, (_, i) => i + 1);

export default function RecurrenceSettings({
  formData,
  recurrenceType,
  selectedDays,
  selectedDates,
  recurrenceEndDate,
  validationError,
  onRecurrenceTypeChange,
  onDayToggle,
  onDateToggle,
  onRecurrenceEndDateChange
}: RecurrenceSettingsProps) {
  const durationDays = calculateDurationInDays(formData.startTime, formData.endTime);
  
  const getValidRecurrenceTypes = (): ('DAILY' | 'WEEKLY' | 'MONTHLY')[] => {
    if (durationDays <= 1) {
      return ['DAILY', 'WEEKLY', 'MONTHLY'];
    } else if (durationDays <= 7) {
      return ['WEEKLY', 'MONTHLY'];
    } else {
      return ['MONTHLY'];
    }
  };

  const validTypes = getValidRecurrenceTypes();

  return (
    <div className="recurrence-settings">
      <div className="form-group">
        <label>반복 주기</label>
        <div className="recurrence-type-options">
          {validTypes.includes('DAILY') && (
            <button
              type="button"
              className={`recurrence-btn ${recurrenceType === 'DAILY' ? 'active' : ''}`}
              onClick={() => onRecurrenceTypeChange('DAILY')}
            >
              매일
            </button>
          )}
          {validTypes.includes('WEEKLY') && (
            <button
              type="button"
              className={`recurrence-btn ${recurrenceType === 'WEEKLY' ? 'active' : ''}`}
              onClick={() => onRecurrenceTypeChange('WEEKLY')}
            >
              매주
            </button>
          )}
          {validTypes.includes('MONTHLY') && (
            <button
              type="button"
              className={`recurrence-btn ${recurrenceType === 'MONTHLY' ? 'active' : ''}`}
              onClick={() => onRecurrenceTypeChange('MONTHLY')}
            >
              매월
            </button>
          )}
        </div>
      </div>

      {recurrenceType === 'WEEKLY' && (
        <div className="form-group">
          <label>요일 선택</label>
          <div className="day-selector">
            {WEEKDAYS.map((day, index) => {
              const maxSelections = durationDays === 1 ? 7 : Math.floor(7 / durationDays);
              const isSelected = selectedDays.includes(index);
              const isDisabled = !isSelected && selectedDays.length >= maxSelections;
              
              return (
                <button
                  key={index}
                  type="button"
                  className={`day-btn ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
                  onClick={() => !isDisabled && onDayToggle(index)}
                  disabled={isDisabled}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {recurrenceType === 'MONTHLY' && (
        <div className="form-group">
          <label>날짜 선택</label>
          <div className="date-selector">
            {MONTH_DATES.map(date => {
              const maxSelections = durationDays === 1 ? 30 : Math.floor(30 / durationDays);
              const isSelected = selectedDates.includes(date);
              const isDisabled = !isSelected && selectedDates.length >= maxSelections;
              
              return (
                <button
                  key={date}
                  type="button"
                  className={`date-btn ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
                  onClick={() => !isDisabled && onDateToggle(date)}
                  disabled={isDisabled}
                >
                  {date}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="form-group">
        <label>반복 종료일</label>
        <input
          type="date"
          value={recurrenceEndDate}
          onChange={(e) => onRecurrenceEndDateChange(e.target.value)}
          min={formatDateYMD(new Date(formData.endTime))}
        />
      </div>

      {validationError && (
        <div className="validation-error">{validationError}</div>
      )}
    </div>
  );
}

