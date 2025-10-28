import { Event } from "@/types/event";
import { getKoreaDateString } from "@/utils/date";

export const isPastEvent = (event: Event): boolean => {
  const todayStr = getKoreaDateString();
  const eventEndDateStr = event.endTime.split('T')[0];
  return eventEndDateStr < todayStr;
};

export const canEditEvent = (event: Event): boolean => {
  const todayStr = getKoreaDateString();
  const eventStartDateStr = event.startTime.split('T')[0];
  const eventEndDateStr = event.endTime.split('T')[0];
  
  if (eventStartDateStr <= todayStr && eventEndDateStr >= todayStr) {
    return true;
  }
  
  if (eventEndDateStr < todayStr) {
    return false;
  }
  
  return true;
};

export const getEventsForDate = (date: string, events: Event[]): Event[] => {
  return events.filter(event => {
    const [sY, sM, sD] = event.startTime.split('T')[0].split('-').map(Number);
    const [eY, eM, eD] = event.endTime.split('T')[0].split('-').map(Number);
    const [cY, cM, cD] = date.split('-').map(Number);
    const eventStartDate = new Date(sY, (sM || 1) - 1, sD || 1);
    const eventEndDate = new Date(eY, (eM || 1) - 1, eD || 1);
    const currentDate = new Date(cY, (cM || 1) - 1, cD || 1);
    return currentDate >= eventStartDate && currentDate <= eventEndDate;
  });
};

export const getCurrentMonthEvents = (currentMonth: string, events: Event[]): Event[] => {
  if (!currentMonth) return [];
  
  const [year, month] = currentMonth.split('-').map(Number);
  const startOfMonth = new Date(year, (month || 1) - 1, 1);
  const endOfMonth = new Date(year, (month || 1), 0);
  
  return events.filter(event => {
    const [sY, sM, sD] = event.startTime.split('T')[0].split('-').map(Number);
    const [eY, eM, eD] = event.endTime.split('T')[0].split('-').map(Number);
    const eventStartDate = new Date(sY, (sM || 1) - 1, sD || 1);
    const eventEndDate = new Date(eY, (eM || 1) - 1, eD || 1);
    return (eventStartDate <= endOfMonth && eventEndDate >= startOfMonth);
  });
};

