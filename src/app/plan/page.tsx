"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { getAccessToken } from "@/api/utils/tokenStorage";
import Calendar from "@/components/Calendar";
import ScheduleList from "@/components/ScheduleList";
import ScheduleModal from "@/components/ScheduleModal";
import { Event, Category, CreateEventRequest } from "@/types/event";
import "@/styles/planPage.css";

const getMockCategories = (): Category[] => [
  { id: 1, name: "운동", color: "#10b981" },
  { id: 2, name: "공부", color: "#3b82f6" },
  { id: 3, name: "일", color: "#f59e0b" },
  { id: 4, name: "기타", color: "#8b5cf6" },
];

const getMockEvents = (): Event[] => [
  { 
    id: 1, 
    category: getMockCategories()[3], 
    title: "여행", 
    description: "부산 여행", 
    startTime: "2025-09-01T09:00:00", 
    endTime: "2025-09-03T18:00:00", 
    isRecurring: false,
    createdAt: "2024-01-01T00:00:00", 
    updatedAt: "2024-01-01T00:00:00" 
  },
  { 
    id: 2, 
    category: getMockCategories()[2], 
    title: "회의", 
    description: "팀 워크샵", 
    startTime: "2025-09-02T10:00:00", 
    endTime: "2025-09-07T18:00:00", 
    isRecurring: false,
    createdAt: "2024-01-01T00:00:00", 
    updatedAt: "2024-01-01T00:00:00" 
  },
  { 
    id: 3, 
    category: getMockCategories()[0], 
    title: "운동", 
    description: "헬스장", 
    startTime: "2025-09-10T19:00:00", 
    endTime: "2025-09-12T21:00:00", 
    isRecurring: false,
    createdAt: "2024-01-01T00:00:00", 
    updatedAt: "2024-01-01T00:00:00" 
  },
  { 
    id: 4, 
    category: getMockCategories()[1], 
    title: "공부", 
    description: "집중 학습 기간", 
    startTime: "2025-09-15T09:00:00", 
    endTime: "2025-09-17T18:00:00", 
    isRecurring: false,
    createdAt: "2024-01-01T00:00:00", 
    updatedAt: "2024-01-01T00:00:00" 
  },
  { 
    id: 5, 
    category: getMockCategories()[3], 
    title: "청소", 
    description: "대청소", 
    startTime: "2025-09-20T10:00:00", 
    endTime: "2025-09-22T16:00:00", 
    isRecurring: false,
    createdAt: "2024-01-01T00:00:00", 
    updatedAt: "2024-01-01T00:00:00" 
  },
  { 
    id: 6, 
    category: getMockCategories()[2], 
    title: "프로젝트", 
    description: "포트폴리오 작업", 
    startTime: "2025-09-25T14:00:00", 
    endTime: "2025-09-27T18:00:00", 
    isRecurring: false,
    createdAt: "2024-01-01T00:00:00", 
    updatedAt: "2024-01-01T00:00:00" 
  },
  { 
    id: 7, 
    category: getMockCategories()[3], 
    title: "휴식", 
    description: "휴가", 
    startTime: "2025-09-29T00:00:00", 
    endTime: "2025-09-30T23:59:59", 
    isRecurring: false,
    createdAt: "2024-01-01T00:00:00", 
    updatedAt: "2024-01-01T00:00:00" 
  },
  { 
    id: 8, 
    category: getMockCategories()[1], 
    title: "독서", 
    description: "자기계발 책 읽기", 
    startTime: "2025-09-01T20:00:00", 
    endTime: "2025-09-01T22:00:00", 
    isRecurring: false,
    createdAt: "2024-01-01T00:00:00", 
    updatedAt: "2024-01-01T00:00:00" 
  },
  { 
    id: 9, 
    category: getMockCategories()[3], 
    title: "장보기", 
    description: "식료품 구매", 
    startTime: "2025-09-04T19:00:00", 
    endTime: "2025-09-04T21:00:00", 
    isRecurring: false,
    createdAt: "2024-01-01T00:00:00", 
    updatedAt: "2024-01-01T00:00:00" 
  },
  { 
    id: 10, 
    category: getMockCategories()[3], 
    title: "영화보기", 
    description: "새로 개봉한 영화", 
    startTime: "2025-09-09T19:30:00", 
    endTime: "2025-09-09T22:00:00", 
    isRecurring: false,
    createdAt: "2024-01-01T00:00:00", 
    updatedAt: "2024-01-01T00:00:00" 
  },
];

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
    setEvents(getMockEvents());
    setCategories(getMockCategories());
  }, []);

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

  const handleSubmitEvent = (req: CreateEventRequest) => {
    const selectedCategory = categories.find(cat => cat.id === req.categoryId);
    if (!selectedCategory) return;

    const newEvent: Event = {
      id: Date.now(),
      category: selectedCategory,
      title: req.title,
      description: req.description,
      startTime: req.startTime,
      endTime: req.endTime,
      isRecurring: req.isRecurring,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setEvents(prev => [...prev, newEvent]);
    setIsModalOpen(false);
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
            />
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
    </>
  );
}


