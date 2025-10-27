import { useState } from 'react';
import { Event } from '@/types/event';
import { getRecommendations } from '@/api/services/summary';
import type { LocationData, RecommendEventReqDto } from '@/api/types/api.types';
import { useToast } from '@/components/ToastProvider';
import { getKoreaDate, formatDateYMD } from '@/utils/date';

export const useRecommendation = (resolvedLocation: LocationData | null) => {
  const { showToast } = useToast();
  const [isRecommendOpen, setIsRecommendOpen] = useState(false);
  const [isRecommendLoading, setIsRecommendLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<RecommendEventReqDto[] | null>(null);
  const [pendingCreatedEvents, setPendingCreatedEvents] = useState<Event[]>([]);
  const [recommendTargetDate, setRecommendTargetDate] = useState<string | null>(null);

  const handleFirstScheduleAdd = async (
    dateFromList: string | null | undefined,
    selectedDate: string | null,
    forceToday?: boolean
  ) => {
    const koreaTime = getKoreaDate();
    const currentHour = koreaTime.getHours();
    
    let baseDate = new Date(koreaTime);
    if (currentHour >= 23) {
      baseDate.setDate(baseDate.getDate() + 1);
    }
    const today = formatDateYMD(baseDate);
    
    let targetDate: string;
    if (forceToday) {
      targetDate = today;
    } else if (dateFromList) {
      const targetDateObj = new Date(dateFromList);
      const todayDateObj = new Date(koreaTime);
      todayDateObj.setHours(0, 0, 0, 0);
      targetDateObj.setHours(0, 0, 0, 0);
      
      if (targetDateObj.getTime() === todayDateObj.getTime() && currentHour >= 23) {
        const nextDay = new Date(targetDateObj);
        nextDay.setDate(nextDay.getDate() + 1);
        targetDate = formatDateYMD(nextDay);
      } else {
        targetDate = dateFromList;
      }
    } else {
      if (selectedDate) {
        const targetDateObj = new Date(selectedDate);
        const todayDateObj = new Date(koreaTime);
        todayDateObj.setHours(0, 0, 0, 0);
        targetDateObj.setHours(0, 0, 0, 0);
        
        if (targetDateObj.getTime() === todayDateObj.getTime() && currentHour >= 23) {
          const nextDay = new Date(targetDateObj);
          nextDay.setDate(nextDay.getDate() + 1);
          targetDate = formatDateYMD(nextDay);
        } else {
          targetDate = selectedDate;
        }
      } else {
        targetDate = today;
      }
    }
    
    setRecommendTargetDate(targetDate);
    setIsRecommendOpen(true);
    setIsRecommendLoading(true);
    setPendingCreatedEvents([]);
    try {
      const data = await getRecommendations(resolvedLocation || undefined, targetDate);
      setRecommendations(Array.isArray(data) ? data : []);
    } catch (e) {
      try { showToast('추천 요청에 실패했어요. 잠시 후 다시 시도해주세요.', 'error'); } catch {}
      setRecommendations([]);
    } finally {
      setIsRecommendLoading(false);
    }
  };

  const handleRecommendEventsCreated = (createdEvents: Event[]) => {
    setPendingCreatedEvents(prev => [...prev, ...createdEvents]);
  };

  const handleRecommendModalClose = (setEvents: React.Dispatch<React.SetStateAction<Event[]>>) => {
    if (pendingCreatedEvents.length > 0) {
      setEvents(prev => [...prev, ...pendingCreatedEvents]);
      setPendingCreatedEvents([]);
    }
    setIsRecommendOpen(false);
    setRecommendTargetDate(null);
  };

  return {
    isRecommendOpen,
    isRecommendLoading,
    recommendations,
    pendingCreatedEvents,
    recommendTargetDate,
    handleFirstScheduleAdd,
    handleRecommendEventsCreated,
    handleRecommendModalClose
  };
};

