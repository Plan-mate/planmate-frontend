"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { getAccessToken } from "@/api/utils/tokenStorage";
import Calendar from "@/components/Calendar";
import ScheduleList from "@/components/ScheduleList";
import ScheduleModal, { ScheduleFormData } from "@/components/ScheduleModal";
import "@/styles/planPage.css";

interface Schedule {
  id: number;
  title: string;
  content: string;
  time: string;
  category: string;
  isCompleted: boolean;
  startDate: string;
  endDate: string;
}

const getMockSchedules = (): Schedule[] => [
  { id: 1, title: "여행", content: "부산 여행", startDate: "2025-09-01", endDate: "2025-09-03", time: "09:00", category: "기타", isCompleted: false },
  { id: 2, title: "회의", content: "팀 워크샵", startDate: "2025-09-02", endDate: "2025-09-07", time: "10:00", category: "일", isCompleted: false },
  { id: 3, title: "운동", content: "헬스장", startDate: "2025-09-10", endDate: "2025-09-12", time: "19:00", category: "운동", isCompleted: false },
  { id: 4, title: "공부", content: "집중 학습 기간", startDate: "2025-09-15", endDate: "2025-09-17", time: "09:00", category: "공부", isCompleted: false },
  { id: 5, title: "청소", content: "대청소", startDate: "2025-09-20", endDate: "2025-09-22", time: "10:00", category: "기타", isCompleted: false },
  { id: 6, title: "프로젝트", content: "포트폴리오 작업", startDate: "2025-09-25", endDate: "2025-09-27", time: "14:00", category: "일", isCompleted: false },
  { id: 7, title: "휴식", content: "휴가", startDate: "2025-09-29", endDate: "2025-09-30", time: "00:00", category: "기타", isCompleted: false },
  { id: 8, title: "독서", content: "자기계발 책 읽기", startDate: "2025-09-01", endDate: "2025-09-01", time: "20:00", category: "공부", isCompleted: true },
  { id: 9, title: "장보기", content: "식료품 구매", startDate: "2025-09-04", endDate: "2025-09-04", time: "19:00", category: "기타", isCompleted: false },
  { id: 10, title: "영화보기", content: "새로 개봉한 영화", startDate: "2025-09-09", endDate: "2025-09-09", time: "19:30", category: "기타", isCompleted: false },
  { id: 11, title: "친구 만나기", content: "카페에서 수다", startDate: "2025-09-13", endDate: "2025-09-13", time: "15:00", category: "기타", isCompleted: false },
  { id: 12, title: "산책", content: "공원에서 산책", startDate: "2025-09-14", endDate: "2025-09-14", time: "16:00", category: "운동", isCompleted: false },
  { id: 13, title: "게임", content: "친구들과 게임", startDate: "2025-09-19", endDate: "2025-09-19", time: "20:00", category: "기타", isCompleted: false },
  { id: 14, title: "정리", content: "책상 정리하기", startDate: "2025-09-19", endDate: "2025-09-19", time: "11:00", category: "기타", isCompleted: false },
  { id: 15, title: "학습", content: "온라인 강의 듣기", startDate: "2025-09-19", endDate: "2025-09-19", time: "14:00", category: "공부", isCompleted: false },
  { id: 16, title: "쇼핑", content: "옷 쇼핑하기", startDate: "2025-09-24", endDate: "2025-09-24", time: "15:00", category: "기타", isCompleted: false },
  { id: 17, title: "조깅", content: "아침 조깅", startDate: "2025-09-26", endDate: "2025-09-26", time: "07:00", category: "운동", isCompleted: false },
  { id: 18, title: "독서", content: "소설 읽기", startDate: "2025-09-29", endDate: "2025-09-29", time: "21:00", category: "공부", isCompleted: false },
];

const getCurrentMonthString = (): string => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
};

export default function PlanPage() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
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
    setSchedules(getMockSchedules());
  }, []);

  const resetView = () => {
    setSelectedDate(null);
    setViewMode('list');
    setSelectedSchedule(null);
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setViewMode('list');
    setSelectedSchedule(null);
  };

  const handleMonthChange = (month: string) => {
    setCurrentMonth(month);
    resetView();
  };

  const handleScheduleSelect = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setViewMode('detail');
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedSchedule(null);
  };

  const handleViewAllSchedules = () => {
    if (selectedDate) {
      const selectedDateObj = new Date(selectedDate);
      const monthStr = `${selectedDateObj.getFullYear()}-${String(selectedDateObj.getMonth() + 1).padStart(2, '0')}`;
      setCurrentMonth(monthStr);
    }
    resetView();
  };

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  const handleSubmitSchedule = (scheduleData: ScheduleFormData) => {
    console.log('새 일정 데이터:', scheduleData);
    
    const newSchedule: Schedule = {
      id: Date.now(),
      title: scheduleData.title,
      content: scheduleData.description,
      time: scheduleData.start_time.split('T')[1] || '00:00',
      category: scheduleData.category,
      isCompleted: false,
      startDate: scheduleData.start_time.split('T')[0],
      endDate: scheduleData.end_time.split('T')[0],
    };
    
    setSchedules(prev => [...prev, newSchedule]);
  };

  return (
    <>
      <Header />
      <main className="plan-container">
        <div className="plan-content">
          <div className="calendar-section">
            <Calendar 
              schedules={schedules}
              selectedDate={selectedDate}
              onDateSelect={handleDateSelect}
              onMonthChange={handleMonthChange}
            />
          </div>
          <div className="schedule-section">
            <ScheduleList
              schedules={schedules}
              selectedDate={selectedDate}
              currentMonth={currentMonth}
              viewMode={viewMode}
              selectedSchedule={selectedSchedule}
              onScheduleSelect={handleScheduleSelect}
              onBackToList={handleBackToList}
              onViewAllSchedules={handleViewAllSchedules}
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
        onSubmit={handleSubmitSchedule}
      />
    </>
  );
}


