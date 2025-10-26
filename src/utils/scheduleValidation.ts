import { calculateDurationInDays } from './date';

export const getValidRecurrenceTypes = (durationDays: number): ('DAILY' | 'WEEKLY' | 'MONTHLY')[] => {
  if (durationDays <= 1) {
    return ['DAILY', 'WEEKLY', 'MONTHLY'];
  } else if (durationDays <= 7) {
    return ['WEEKLY', 'MONTHLY'];
  } else {
    return ['MONTHLY'];
  }
};

export const validateRecurrenceSettings = (
  durationDays: number,
  recurrenceType: 'DAILY' | 'WEEKLY' | 'MONTHLY',
  selectedDays: number[],
  selectedDates: number[]
): { isValid: boolean; errorMessage?: string } => {
  const validTypes = getValidRecurrenceTypes(durationDays);
  
  if (!validTypes.includes(recurrenceType)) {
    if (durationDays > 7) {
      return { isValid: false, errorMessage: `${durationDays}일 기간은 매월 반복만 가능합니다.` };
    } else if (durationDays > 1) {
      return { isValid: false, errorMessage: `${durationDays}일 기간은 매일 반복이 불가능합니다. 매주 또는 매월을 선택해주세요.` };
    }
  }

  if (recurrenceType === 'WEEKLY') {
    const maxWeeklySelections = durationDays === 1 ? 7 : Math.floor(7 / durationDays);
    if (selectedDays.length > maxWeeklySelections) {
      return { isValid: false, errorMessage: `매주 반복 시 선택 가능한 요일은 최대 ${maxWeeklySelections}개입니다.` };
    }
  }

  if (recurrenceType === 'MONTHLY') {
    const maxMonthlySelections = durationDays === 1 ? 30 : Math.floor(30 / durationDays);
    if (selectedDates.length > maxMonthlySelections) {
      return { isValid: false, errorMessage: `매월 반복 시 선택 가능한 날짜는 최대 ${maxMonthlySelections}개입니다.` };
    }
  }

  return { isValid: true };
};

export const validateScheduleForm = (
  formData: {
    title: string;
    categoryId: number;
    startTime: string;
    endTime: string;
    isRecurring: boolean;
  },
  recurrenceType: 'DAILY' | 'WEEKLY' | 'MONTHLY',
  selectedDays: number[],
  selectedDates: number[],
  recurrenceEndDate: string
): boolean => {
  if (!formData.title || !formData.title.trim()) return false;
  if (!formData.categoryId || formData.categoryId <= 0) return false;
  if (!formData.startTime || !formData.endTime) return false;
  if (new Date(formData.endTime) < new Date(formData.startTime)) return false;
  
  if (formData.isRecurring) {
    if (!recurrenceEndDate) return false;
    if (recurrenceType === 'WEEKLY' && selectedDays.length === 0) return false;
    if (recurrenceType === 'MONTHLY' && selectedDates.length === 0) return false;
    
    const durationDays = calculateDurationInDays(formData.startTime, formData.endTime);
    const validation = validateRecurrenceSettings(durationDays, recurrenceType, selectedDays, selectedDates);
    if (!validation.isValid) {
      return false;
    }
  }
  
  return true;
};

