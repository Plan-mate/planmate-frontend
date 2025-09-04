"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { getAccessToken } from "@/api/utils/tokenStorage";
import Calendar from "@/components/Calendar";
import ScheduleList from "@/components/ScheduleList";
import ScheduleModal from "@/components/ScheduleModal";
import { Event, Category } from "@/types/event";
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

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingEvent(null);
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
        onSubmit={handleSubmitEvent}
        editEvent={editingEvent || undefined}
        isEditMode={true}
      />
    </>
  );
}


