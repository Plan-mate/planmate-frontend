"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { getAccessToken } from "@/api/utils/tokenStorage";
import Calendar from "@/components/Calendar";
import ScheduleList from "@/components/ScheduleList";
import ScheduleModal from "@/components/ScheduleModal";
import ScopeSelectionModal from "@/components/ScopeSelectionModal";
import { Event, Category, Scope } from "@/types/event";
import { getEvents, getCategory } from "@/api/services/plan";
import "@/styles/planPage.css";

const getCurrentMonthString = (): string => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
};

export default function PlanPage() {
  const router = useRouter();
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
  const [selectedScope, setSelectedScope] = useState<Scope>('ALL');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    console.log(token);
    
    if (!token) {
      router.replace("/?loginRequired=1");
    }
  }, [router]);

  useEffect(() => {
    setCurrentMonth(getCurrentMonthString());
  }, []);

  // 이벤트와 카테고리 데이터 로드
  useEffect(() => {
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
        console.error('데이터 로드 실패:', err);
        setError('데이터를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentMonth]);

  // events 상태 변경 감지
  useEffect(() => {
    console.log('=== events 상태 변경 감지 ===');
    console.log('현재 이벤트 수:', events.length);
    console.log('이벤트 목록:', events.map(e => ({ id: e.id, title: e.title, category: e.category.name })));
    console.log('============================');
  }, [events]);

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

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  const handleEditEvent = (event: Event, scope?: Scope) => {
    if (scope) {
      setSelectedScope(scope);
      setEditingEvent(event);
      setIsEditModalOpen(true);
    } else {
      if (event.id === null) {
        setPendingEditEvent(event);
        setIsScopeModalOpen(true);
      } else {
        // 당일일정은 SINGLE, 반복일정 원본은 ALL로 설정
        const scope = event.isRecurring && !event.originalEventId ? 'ALL' : 'SINGLE';
        setSelectedScope(scope);
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
  };

  const handleSelectScope = (scope: Scope) => {
    if (pendingEditEvent) {
      setSelectedScope(scope);
      setEditingEvent(pendingEditEvent);
      setIsEditModalOpen(true);
      setIsScopeModalOpen(false);
      setPendingEditEvent(null);
    }
  };

  const handleSubmitEvent = async (createdEvents: Event[]) => {
    try {
      if (!createdEvents || createdEvents.length === 0) return;
      setEvents(prev => [...prev, ...createdEvents]);
      setIsModalOpen(false);
      setIsEditModalOpen(false);
    } catch (err) {
      console.error('이벤트 생성 처리 실패:', err);
      setError('이벤트 생성 처리에 실패했습니다.');
    }
  };

  const handleUpdateEvent = async (updatedEvents: Event[]) => {
    try {
      if (!updatedEvents || updatedEvents.length === 0) return;
      
      console.log('=== 이벤트 업데이트 처리 ===');
      console.log('updatedEvents:', updatedEvents);
      console.log('editingEvent:', editingEvent);
      
      // 백엔드에서 반환된 모든 이벤트를 처리
      // id가 null인 이벤트들도 임시로 처리 (백엔드 수정 전까지 임시 해결책)
      const processedEvents = updatedEvents.map((event, index) => {
        if (event.id === null) {
          // id가 null인 경우 임시 ID 생성 (화면 표시용)
          return {
            ...event,
            id: -(Date.now() + index) // 음수 ID로 임시 구분
          } as Event;
        }
        return event;
      });
      
      console.log('processedEvents (모든 이벤트 처리):', processedEvents);
      
      if (processedEvents.length === 0) {
        console.log('processedEvents가 비어있음 - 모달 닫기');
        setIsEditModalOpen(false);
        setEditingEvent(null);
        return;
      }

      // 수정된 이벤트들로 목록 업데이트
      setEvents(prev => {
        console.log('기존 이벤트 목록:', prev.map(e => ({ id: e.id, title: e.title })));
        const updatedEventIds = processedEvents.map(e => e.id);
        console.log('updatedEventIds:', updatedEventIds);
        
        // 기존 이벤트에서 업데이트된 이벤트들과 관련된 모든 이벤트 제거
        const filteredEvents = prev.filter(existingEvent => {
          // 업데이트된 이벤트 ID와 직접 매칭되는 경우 제거
          if (existingEvent.id !== null && updatedEventIds.includes(existingEvent.id)) {
            console.log('제거할 이벤트 ID:', existingEvent.id);
            return false;
          }
          
          // 반복일정의 경우, 원본 이벤트 ID와 매칭되는 인스턴스들도 제거
          if (editingEvent && editingEvent.isRecurring) {
            const originalEventId = editingEvent.originalEventId || editingEvent.id;
            if (existingEvent.originalEventId === originalEventId || existingEvent.id === originalEventId) {
              console.log('제거할 반복일정 인스턴스 ID:', existingEvent.id);
              return false;
            }
          }
          
          return true;
        });
        
        console.log('filteredEvents (제거 후):', filteredEvents.length);
        console.log('processedEvents (추가할):', processedEvents.length);
        console.log('최종 결과 이벤트 수:', filteredEvents.length + processedEvents.length);
        
        const result = [...filteredEvents, ...processedEvents];
        console.log('최종 결과:', result);
        
        // 현재 선택된 이벤트가 수정된 이벤트라면 selectedEvent도 업데이트
        if (selectedEvent && processedEvents.length > 0) {
          const updatedSelectedEvent = processedEvents.find(e => e.id === selectedEvent.id);
          if (updatedSelectedEvent) {
            console.log('selectedEvent 업데이트:', updatedSelectedEvent);
            setSelectedEvent(updatedSelectedEvent);
          }
        }
        
        return result;
      });
      
      setIsEditModalOpen(false);
      setEditingEvent(null);
      
      // 상태 업데이트 완료 후 추가 확인
      setTimeout(() => {
        console.log('상태 업데이트 후 현재 이벤트 수:', events.length);
        console.log('현재 선택된 날짜:', selectedDate);
        console.log('현재 월:', currentMonth);
        console.log('모든 이벤트:', events.map(e => ({ 
          id: e.id, 
          title: e.title, 
          startTime: e.startTime,
          endTime: e.endTime 
        })));
      }, 100);
    } catch (err) {
      console.error('이벤트 수정 처리 실패:', err);
      setError('이벤트 수정 처리에 실패했습니다.');
    }
  };

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
            />
          </div>
          <div className="schedule-section">
            {loading ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>일정을 불러오는 중...</p>
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
        event={pendingEditEvent || {} as Event}
      />
    </>
  );
}


