"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { getAccessToken } from "@/api/utils/tokenStorage";
import Calendar from "@/components/Calendar";
import ScheduleList from "@/components/ScheduleList";
import ScheduleModal from "@/components/ScheduleModal";
import ScopeSelectionModal from "@/components/ScopeSelectionModal";
import ConfirmModal from "@/components/ConfirmModal";
import SummaryModal from "@/components/SummaryModal";
import RecommendModal from "@/components/RecommendModal";
import { Event, Category, Scope } from "@/types/event";
import { getEvents, getCategory, deleteEvent } from "@/api/services/plan";
import { getRecommendations } from "@/api/services/summary";
import { checkDailyLogin } from "@/api/services/auth";
import type { LocationData, RecommendEventReqDto } from "@/api/types/api.types";
import { getCurrentMonthString } from "@/utils/date";
import { getWeatherGridCoords } from "@/utils/weatherGrid";
import { useToast } from "@/components/ToastProvider";
import "@/styles/planPage.css";

export default function PlanPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [currentMonth, setCurrentMonth] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [isScopeModalOpen, setIsScopeModalOpen] = useState(false);
  const [pendingEditEvent, setPendingEditEvent] = useState<Event | null>(null);
  const [pendingDeleteEvent, setPendingDeleteEvent] = useState<Event | null>(null);
  const [pendingDeleteScope, setPendingDeleteScope] = useState<Scope | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState<string>("");
  const [confirmDesc, setConfirmDesc] = useState<string>("");
  const [selectedScope, setSelectedScope] = useState<Scope>('ALL');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [resolvedLocation, setResolvedLocation] = useState<LocationData | null>(null);
  const [isRecommendOpen, setIsRecommendOpen] = useState(false);
  const [isRecommendLoading, setIsRecommendLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<RecommendEventReqDto[] | null>(null);
  const [pendingCreatedEvents, setPendingCreatedEvents] = useState<Event[]>([]);
  const [clickedDateForAdd, setClickedDateForAdd] = useState<string | null>(null);
  const [recommendTargetDate, setRecommendTargetDate] = useState<string | null>(null);
  
  const selectedScopeRef = useRef<Scope>('ALL');
  const summaryShownRef = useRef<boolean>(false);

  const isOriginalRecurring = (ev: Event): boolean => 
    ev.isRecurring === true && (ev.originalEventId === null || ev.originalEventId === undefined);
  
  const buildKey = (e: Event) => 
    `${e.title}|${e.category.id}|${e.startTime}|${e.endTime}`;

  const getGeolocationOnce = (options?: PositionOptions): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject('Geolocation is not supported by your browser');
        return;
      }
      navigator.geolocation.getCurrentPosition(resolve, reject, options);
    });
  };

  const getLocation = async (): Promise<GeolocationPosition> => {
    try {
      return await getGeolocationOnce({ enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 });
    } catch (err: any) {
      try {
        return await getGeolocationOnce({ enableHighAccuracy: false, timeout: 15000, maximumAge: 600000 });
      } catch (err2) {
        throw err2 || err;
      }
    }
  };

  const getWeatherLocationInfo = async (lat: number, lon: number): Promise<{locationName: string, nx: number, ny: number}> => {
    try {
      const KAKAO_API_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY || '2e118497c276958d5cf90a061f09fbad';
      const url = `https://dapi.kakao.com/v2/local/geo/coord2address.json?x=${lon}&y=${lat}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `KakaoAK ${KAKAO_API_KEY}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`카카오맵 API 에러: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.documents && data.documents.length > 0) {
        const addressInfo = data.documents[0].address;
        const locationName = `${addressInfo.region_1depth_name} ${addressInfo.region_2depth_name}`;
        const { nx, ny } = getWeatherGridCoords(lat, lon);
        
        return { locationName, nx, ny };
      }
      
      throw new Error('위치 정보를 찾을 수 없습니다');
    } catch (error) {
      const { nx, ny } = getWeatherGridCoords(lat, lon);
      return {
        locationName: '알 수 없는 위치',
        nx,
        ny
      };
    }
  };

  const loadData = async () => {
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

  const reloadEvents = async () => {
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

  const resetView = () => {
    setSelectedDate(null);
    setViewMode('list');
    setSelectedEvent(null);
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setViewMode('list');
    setSelectedEvent(null);
  };

  const handleMonthChange = (month: string) => {
    setCurrentMonth(month);
    resetView();
  };

  const handleEventSelect = (event: Event) => {
    setSelectedEvent(event);
    setViewMode('detail');
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedEvent(null);
  };

  const handleViewAllEvents = () => {
    if (selectedDate) {
      const selectedDateObj = new Date(selectedDate);
      const monthStr = `${selectedDateObj.getFullYear()}-${String(selectedDateObj.getMonth() + 1).padStart(2, '0')}`;
      setCurrentMonth(monthStr);
    }
    resetView();
  };

  const handleOpenModal = () => {
    if (!clickedDateForAdd && selectedDate) {
      setClickedDateForAdd(selectedDate);
    }
    setIsModalOpen(true);
  };

  const handleFirstScheduleAdd = async (dateFromList?: string | null, forceToday: boolean = false) => {
    const now = new Date();
    const koreaTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
    const today = koreaTime.toISOString().split('T')[0];
    
    let targetDate: string;
    if (forceToday) {
      targetDate = today;
    } else if (dateFromList) {
      targetDate = dateFromList;
    } else {
      targetDate = selectedDate || today;
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

  const handleRecommendModalClose = () => {
    if (pendingCreatedEvents.length > 0) {
      setEvents(prev => [...prev, ...pendingCreatedEvents]);
      setPendingCreatedEvents([]);
    }
    setIsRecommendOpen(false);
    setRecommendTargetDate(null);
  };
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setClickedDateForAdd(null);
  };
  
  const handleDateClickForAdd = (date: string) => {
    setClickedDateForAdd(date);
  };

  const handleDeleteEvent = (event: Event) => {
    if (!event.isRecurring) {
      setPendingDeleteEvent(event);
      setPendingDeleteScope('SINGLE');
      setConfirmTitle('일정 삭제');
      setConfirmDesc('이 일정은 삭제 후 복구할 수 없습니다.\n정말 삭제하시겠어요?');
      setIsConfirmOpen(true);
      return;
    }

    if (isOriginalRecurring(event)) {
      setPendingDeleteEvent(event);
      setPendingDeleteScope('ALL');
      setConfirmTitle('반복 일정 전체 삭제');
      setConfirmDesc('이 반복 일정의 모든 인스턴스가 삭제됩니다.\n삭제 후에는 복구할 수 없습니다. 계속하시겠어요?');
      setIsConfirmOpen(true);
      return;
    }

    setPendingDeleteEvent(event);
    setIsScopeModalOpen(true);
  };

  const handleEditEvent = (event: Event, scope?: Scope) => {
    if (scope) {
      setSelectedScope(scope);
      selectedScopeRef.current = scope;
      setEditingEvent(event);
      setIsEditModalOpen(true);
    } else {
      if (event.id === null) {
        setPendingEditEvent(event);
        setIsScopeModalOpen(true);
      } else {
        const scope = event.isRecurring && !event.originalEventId ? 'ALL' : 'SINGLE';
        setSelectedScope(scope);
        selectedScopeRef.current = scope;
        setEditingEvent(event);
        setIsEditModalOpen(true);
      }
    }
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingEvent(null);
  };

  const handleCloseScopeModal = () => {
    setIsScopeModalOpen(false);
    setPendingEditEvent(null);
    setPendingDeleteEvent(null);
    setPendingDeleteScope(null);
  };

  const handleSelectScope = (scope: Scope) => {
    if (pendingDeleteEvent) {
      setPendingDeleteScope(scope);
      setIsScopeModalOpen(false);
      const scopeText = scope === 'ALL' ? '반복 일정 전체' : 
                      scope === 'THIS_AND_FUTURE' ? '이 일정 이후의 반복 일정' : '이 일정만';
      setConfirmTitle('일정 삭제');
      setConfirmDesc(`선택한 범위: ${scopeText}\n삭제 후에는 복구할 수 없습니다.\n정말 삭제하시겠어요?`);
      setIsConfirmOpen(true);
      return;
    }
    if (pendingEditEvent) {
      setSelectedScope(scope);
      selectedScopeRef.current = scope;
      setEditingEvent(pendingEditEvent);
      setIsEditModalOpen(true);
      setIsScopeModalOpen(false);
      setPendingEditEvent(null);
    }
  };

  const handleConfirmDelete = () => {
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

    (async () => {
      try {
        const targetTime = (scope === 'THIS' || scope === 'THIS_AND_FUTURE') ? `${pendingDeleteEvent.startTime}` : undefined;
        await deleteEvent(id, scope, targetTime);
        showToast('일정을 삭제했어요', 'success');
      } catch (e) {
        showToast('일정 삭제에 실패했어요', 'error');
        await reloadEvents();
      } finally {
        setViewMode('list');
        setSelectedEvent(null);
        setIsConfirmOpen(false);
        setPendingDeleteEvent(null);
        setPendingDeleteScope(null);
      }
    })();
  };

  const handleSubmitEvent = async (createdEvents: Event[]) => {
    try {
      if (!createdEvents || createdEvents.length === 0) return;
      setEvents(prev => [...prev, ...createdEvents]);
      setIsModalOpen(false);
      setIsEditModalOpen(false);
    } catch (err) {
      setError('이벤트 생성 처리에 실패했습니다.');
    }
  };

  const handleUpdateEvent = async (updatedEvents: Event[]) => {
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
        setIsEditModalOpen(false);
        setEditingEvent(null);
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
      
      setIsEditModalOpen(false);
      setEditingEvent(null);
    } catch (err) {
      setError('이벤트 수정 처리에 실패했습니다.');
    }
  };

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.replace("/?loginRequired=1");
    }
  }, [router]);

  useEffect(() => {
    setCurrentMonth(getCurrentMonthString());
  }, []);

  useEffect(() => {
    loadData();
  }, [currentMonth]);

  const requestLocationPermission = async (): Promise<{lat: number, lon: number} | null> => {
    try {
      const perm = (navigator as any).permissions?.query ? await (navigator as any).permissions.query({ name: 'geolocation' as any }) : null;
      
      if (perm && perm.state !== 'granted') {
        try {
          const cached = localStorage.getItem('pm:lastLocation');
          if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed && typeof parsed.lat === 'number' && typeof parsed.lon === 'number') {
              return { lat: parsed.lat, lon: parsed.lon };
            }
          }
        } catch {}
        return null;
      }

      try {
        const lastFailStr = localStorage.getItem('pm:lastGeoFailTs');
        if (lastFailStr) {
          const lastFail = Number(lastFailStr);
          if (Number.isFinite(lastFail) && Date.now() - lastFail < 5 * 60 * 1000) {
            const cached = localStorage.getItem('pm:lastLocation');
            if (cached) {
              const parsed = JSON.parse(cached);
              if (parsed && typeof parsed.lat === 'number' && typeof parsed.lon === 'number') {
                return { lat: parsed.lat, lon: parsed.lon };
              }
            }
            return null;
          }
        }
      } catch {}

      let position: GeolocationPosition | null = null;
      try {
        position = await getLocation();
      } catch (e) {
        position = null;
        try { localStorage.setItem('pm:lastGeoFailTs', String(Date.now())); } catch {}
      }
      const coords = {
        lat: position?.coords.latitude as number,
        lon: position?.coords.longitude as number
      };

      try {
        localStorage.setItem('pm:lastLocation', JSON.stringify({ ...coords, ts: Date.now() }));
      } catch {}

      if (Number.isFinite(coords.lat) && Number.isFinite(coords.lon)) {
        return coords as {lat: number, lon: number};
      }
      try { localStorage.setItem('pm:lastGeoFailTs', String(Date.now())); } catch {}
      return null;
    } catch (error) {
      try {
        const cached = localStorage.getItem('pm:lastLocation');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && typeof parsed.lat === 'number' && typeof parsed.lon === 'number') {
            return { lat: parsed.lat, lon: parsed.lon };
          }
        }
      } catch {}

      return null;
    }
  };

  const handleLocationRequest = async (): Promise<LocationData> => {
    const coords = await requestLocationPermission();
    
    if (!coords) {
      const defaultLocation = { cityName: '서울특별시', nx: 60, ny: 127 };
      try { showToast('현재 위치를 가져오지 못해 서울로 설정했어요', 'info'); } catch {}
      return defaultLocation;
    }
    
    const weatherInfo = await getWeatherLocationInfo(coords.lat, coords.lon);
    const isValidNumber = (v: any) => typeof v === 'number' && isFinite(v) && v > 0;
    const resolved = isValidNumber(weatherInfo.nx) && isValidNumber(weatherInfo.ny)
      ? {
          cityName: weatherInfo.locationName || '서울특별시',
          nx: weatherInfo.nx,
          ny: weatherInfo.ny
        }
      : { cityName: '서울특별시', nx: 60, ny: 127 };
    return resolved;
  };

  useEffect(() => {
    let isMounted = true;
    
    (async () => {
      try {
        const login = await checkDailyLogin();        
        if (!isMounted) return;
        
        const locationData = await handleLocationRequest();
        if (!isMounted) return;
        setResolvedLocation(locationData);
        
        try {
            if (login.firstLoginToday) {
              setIsSummaryModalOpen(true);
              summaryShownRef.current = true;
          }
        } catch {}
      } catch (e) {}
    })();
    
    return () => {
      isMounted = false;
    };
  }, []);


  return (
    <>
      <Header />
      <main className="plan-container">
        <div className="plan-content">
          <div className="calendar-section">
            <Calendar 
              events={events}
              selectedDate={selectedDate}
              onDateSelect={handleDateSelect}
              onMonthChange={handleMonthChange}
              onDateClickForAdd={handleDateClickForAdd}
            />
          </div>
          <div className="schedule-section">
            {loading ? (
              <div className="loading-state">
                <div className="pm-skeleton title" style={{ width: '40%', marginBottom: 12 }}></div>
                <div className="pm-skeleton text" style={{ width: '70%', marginBottom: 8 }}></div>
                <div className="pm-skeleton block" style={{ width: '100%' }}></div>
              </div>
            ) : error ? (
              <div className="error-state">
                <div className="error-icon">⚠️</div>
                <p>{error}</p>
                <button 
                  onClick={() => window.location.reload()} 
                  className="retry-btn"
                >
                  다시 시도
                </button>
              </div>
            ) : (
              <ScheduleList
                events={events}
                categories={categories}
                selectedDate={selectedDate}
                currentMonth={currentMonth}
                viewMode={viewMode}
                selectedEvent={selectedEvent}
                onEventSelect={handleEventSelect}
                onBackToList={handleBackToList}
                onViewAllEvents={handleViewAllEvents}
                onEditEvent={handleEditEvent}
                onDeleteEvent={handleDeleteEvent}
                onFirstScheduleAdd={(date) => handleFirstScheduleAdd(date)}
              />
            )}
          </div>
        </div>
      </main>
      
      <button className="floating-add-btn" title="새 일정 추가" onClick={handleOpenModal}>
        +
      </button>

      <ScheduleModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmitEvent}
        initialDate={clickedDateForAdd}
      />

      <ScheduleModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onSubmit={handleUpdateEvent}
        editEvent={editingEvent || undefined}
        isEditMode={true}
        selectedScope={selectedScope}
      />

      <ScopeSelectionModal
        isOpen={isScopeModalOpen}
        onClose={handleCloseScopeModal}
        onSelectScope={handleSelectScope}
        event={(pendingEditEvent || pendingDeleteEvent || {} as Event)}
        mode={pendingDeleteEvent ? 'delete' : 'edit'}
      />

      <ConfirmModal
        isOpen={isConfirmOpen}
        title={confirmTitle}
        description={confirmDesc}
        confirmText="삭제"
        cancelText="취소"
        onConfirm={handleConfirmDelete}
        onClose={() => setIsConfirmOpen(false)}
      />

      <SummaryModal
        isOpen={isSummaryModalOpen}
        onClose={() => setIsSummaryModalOpen(false)}
        locationData={resolvedLocation || undefined}
        onRecommend={() => handleFirstScheduleAdd(null, true)}
      />

      <RecommendModal
        isOpen={isRecommendOpen}
        onClose={handleRecommendModalClose}
        locationData={resolvedLocation || undefined}
        categories={categories}
        recommendations={recommendations || []}
        loading={isRecommendLoading}
        targetDate={recommendTargetDate}
        onEventsCreated={handleRecommendEventsCreated}
        onReload={async () => {
          await reloadEvents();
          setIsSummaryModalOpen(false);
          handleRecommendModalClose();
        }}
      />
    </>
  );
}