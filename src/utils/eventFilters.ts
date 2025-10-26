import { Event } from "@/types/event";

export const isPastEvent = (event: Event): boolean => {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const eventEndDateStr = event.endTime.split('T')[0];
  return eventEndDateStr < todayStr;
};

export const canEditEvent = (event: Event): boolean => {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
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
    const eventStartDate = new Date(event.startTime.split('T')[0]);
    const eventEndDate = new Date(event.endTime.split('T')[0]);
    const currentDate = new Date(date);
    return currentDate >= eventStartDate && currentDate <= eventEndDate;
  });
};

export const getCurrentMonthEvents = (currentMonth: string, events: Event[]): Event[] => {
  if (!currentMonth) return [];
  
  const [year, month] = currentMonth.split('-').map(Number);
  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0);
  
  return events.filter(event => {
    const eventStartDate = new Date(event.startTime.split('T')[0]);
    const eventEndDate = new Date(event.endTime.split('T')[0]);
    return (eventStartDate <= endOfMonth && eventEndDate >= startOfMonth);
  });
};

