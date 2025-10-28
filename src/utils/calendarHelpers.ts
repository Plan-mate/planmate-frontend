import { Event } from "@/types/event";
import { getKoreaDate } from "@/utils/date";

export const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const isToday = (date: Date): boolean => {
  const today = getKoreaDate();
  return date.toDateString() === today.toDateString();
};

export const isCurrentMonth = (date: Date, currentDate: Date): boolean => {
  return date.getMonth() === currentDate.getMonth();
};

export const getEventsForDate = (date: Date, events: Event[]): Event[] => {
  const dateStr = formatDate(date);
  return events.filter(event => {
    const [sY, sM, sD] = event.startTime.split('T')[0].split('-').map(Number);
    const [eY, eM, eD] = event.endTime.split('T')[0].split('-').map(Number);
    const eventStartDate = new Date(sY, (sM || 1) - 1, sD || 1);
    const eventEndDate = new Date(eY, (eM || 1) - 1, eD || 1);
    const [cY, cM, cD] = dateStr.split('-').map(Number);
    const currentDate = new Date(cY, (cM || 1) - 1, cD || 1);
    
    return currentDate >= eventStartDate && currentDate <= eventEndDate;
  });
};

export const generateCalendarDays = (currentDate: Date): Date[] => {
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
};

