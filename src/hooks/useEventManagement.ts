import { useState, useRef } from 'react';
import { Event, Category, Scope } from '@/types/event';
import { getEvents, getCategory, deleteEvent } from '@/api/services/plan';
import { useToast } from '@/components/ToastProvider';

export const useEventManagement = () => {
  const { showToast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selectedScopeRef = useRef<Scope>('ALL');

  const isOriginalRecurring = (ev: Event): boolean => 
    ev.isRecurring === true && (ev.originalEventId === null || ev.originalEventId === undefined);
  
  const buildKey = (e: Event) => 
    `${e.title}|${e.category.id}|${e.startTime}|${e.endTime}`;

  const loadData = async (currentMonth: string) => {
    if (!currentMonth) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const [year, month] = currentMonth.split('-').map(Number);
      const [eventsData, categoriesData] = await Promise.all([
        getEvents(year, month),
        getCategory()
      ]);
      
      setEvents(eventsData);
      setCategories(categoriesData);
    } catch (err) {
      setError('데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const reloadEvents = async (currentMonth: string) => {
    try {
      const [year, month] = currentMonth.split('-').map(Number);
      const [eventsData, categoriesData] = await Promise.all([
        getEvents(year, month),
        getCategory()
      ]);
      setEvents(eventsData);
      setCategories(categoriesData);
    } catch (err) {
      setError('데이터를 새로고침하는데 실패했습니다.');
    }
  };

  const handleSubmitEvent = async (createdEvents: Event[]) => {
    try {
      if (!createdEvents || createdEvents.length === 0) return;
      setEvents(prev => [...prev, ...createdEvents]);
    } catch (err) {
      setError('이벤트 생성 처리에 실패했습니다.');
    }
  };

  const handleUpdateEvent = async (updatedEvents: Event[], editingEvent: Event | null, selectedEvent: Event | null, setSelectedEvent: (event: Event | null) => void) => {
    try {
      if (!updatedEvents || updatedEvents.length === 0) return;
      
      const processedEvents = updatedEvents.map((event, index) => {
        if (event.id === null) {
          return {
            ...event,
            id: -(Date.now() + index)
          } as Event;
        }
        return event;
      });
      
      if (processedEvents.length === 0) {
        return;
      }

      const scopeSnapshot = selectedScopeRef.current;
      setEvents(prev => {
        if (!editingEvent) return [...prev, ...processedEvents];
        
        const updatedEventIds = processedEvents.map(e => e.id).filter(id => id !== null);
        
        const filteredEvents = prev.filter(existingEvent => {
          if (existingEvent.id !== null && updatedEventIds.includes(existingEvent.id)) {
            return false;
          }
          
          if (editingEvent.isRecurring) {
            const originalEventId = editingEvent.originalEventId || editingEvent.id;
            const isSeriesMember = (existingEvent.originalEventId === originalEventId || existingEvent.id === originalEventId);
            
            if (scopeSnapshot === 'ALL') {
              return !isSeriesMember;
            } else if (scopeSnapshot === 'THIS_AND_FUTURE') {
              if (isSeriesMember) {
                try {
                  const pivot = new Date(editingEvent.startTime);
                  const cur = new Date(existingEvent.startTime);
                  if (!isNaN(pivot.getTime()) && !isNaN(cur.getTime()) && cur >= pivot) {
                    return false;
                  }
                } catch {}
              }
            } else if (scopeSnapshot === 'THIS') {
              if (isSeriesMember) {
                try {
                  const pivotStart = new Date(editingEvent.startTime).getTime();
                  const curStart = new Date(existingEvent.startTime).getTime();
                  if (!isNaN(pivotStart) && !isNaN(curStart) && curStart === pivotStart) {
                    return false;
                  }
                } catch {
                  if (existingEvent.id === editingEvent.id) return false;
                }
              }
            }
          } else {
            if (existingEvent.id === editingEvent.id) {
              return false;
            }
          }
          
          return true;
        });
        
        const combined = [...filteredEvents, ...processedEvents];
        const seen = new Set<string>();
        const result = combined.filter(ev => {
          const key = `${ev.isRecurring ? (ev.originalEventId || ev.id) : (ev.originalEventId || ev.id)}|${ev.startTime}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        
        if (selectedEvent && processedEvents.length > 0) {
          const updatedSelectedEvent = processedEvents.find(e => e.id === selectedEvent.id);
          if (updatedSelectedEvent) {
            setSelectedEvent(updatedSelectedEvent);
          }
        }
        
        return result;
      });
    } catch (err) {
      setError('이벤트 수정 처리에 실패했습니다.');
    }
  };

  const handleConfirmDelete = async (
    pendingDeleteEvent: Event | null,
    pendingDeleteScope: Scope | null,
    setViewMode: (mode: 'list' | 'detail') => void,
    setSelectedEvent: (event: Event | null) => void,
    setIsConfirmOpen: (open: boolean) => void,
    setPendingDeleteEvent: (event: Event | null) => void,
    setPendingDeleteScope: (scope: Scope | null) => void,
    reloadEvents: (currentMonth: string) => Promise<void>,
    currentMonth: string
  ) => {
    if (!pendingDeleteEvent) { 
      setIsConfirmOpen(false); 
      return; 
    }
    
    const scope = pendingDeleteScope || 'SINGLE';
    const id = (pendingDeleteEvent.id && pendingDeleteEvent.id > 0)
      ? pendingDeleteEvent.id
      : (pendingDeleteEvent.originalEventId || 0);
    
    setEvents(prev => {
      if (!pendingDeleteEvent) return prev;
      const target = pendingDeleteEvent;
      
      if (scope === 'SINGLE') {
        return prev.filter(ev => ev.id !== target.id);
      }
      if (scope === 'ALL') {
        const originalId = target.originalEventId || target.id;
        return prev.filter(ev => {
          const isSeriesMember = (ev.id === originalId || ev.originalEventId === originalId);
          if (!isSeriesMember) return true;
          return ev.isRecurring === false ? true : false;
        });
      }
      if (scope === 'THIS') {
        if (target.id !== null) {
          return prev.filter(ev => ev.id !== target.id);
        }
        const key = buildKey(target);
        return prev.filter(ev => buildKey(ev) !== key);
      }
      if (scope === 'THIS_AND_FUTURE') {
        const originalId = target.originalEventId || target.id;
        const pivot = new Date(target.startTime);
        return prev.filter(ev => {
          const isSeriesMember = (ev.originalEventId === originalId || ev.id === originalId);
          if (!isSeriesMember) return true;
          if (ev.isRecurring === false) return true;
          const cur = new Date(ev.startTime);
          if (isNaN(cur.getTime()) || isNaN(pivot.getTime())) return true;
          return cur < pivot;
        });
      }
      return prev;
    });

    try {
      const targetTime = (scope === 'THIS' || scope === 'THIS_AND_FUTURE') ? `${pendingDeleteEvent.startTime}` : undefined;
      await deleteEvent(id, scope, targetTime);
      showToast('일정을 삭제했어요', 'success');
    } catch (e) {
      showToast('일정 삭제에 실패했어요', 'error');
      await reloadEvents(currentMonth);
    } finally {
      setViewMode('list');
      setSelectedEvent(null);
      setIsConfirmOpen(false);
      setPendingDeleteEvent(null);
      setPendingDeleteScope(null);
    }
  };

  return {
    events,
    setEvents,
    categories,
    loading,
    error,
    selectedScopeRef,
    isOriginalRecurring,
    buildKey,
    loadData,
    reloadEvents,
    handleSubmitEvent,
    handleUpdateEvent,
    handleConfirmDelete
  };
};

