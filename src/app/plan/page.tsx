"use client";

import { useEffect, useState } from "react";
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
import { Event, Scope } from "@/types/event";
import { getCurrentMonthString, getKoreaDateString, parseYMDToLocalDate } from "@/utils/date";
import { useEventManagement } from "@/hooks/useEventManagement";
import { useLocation } from "@/hooks/useLocation";
import { useRecommendation } from "@/hooks/useRecommendation";
import "@/styles/planPage.css";

export default function PlanPage() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
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
  const [clickedDateForAdd, setClickedDateForAdd] = useState<string | null>(null);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);

  const {
    events,
    setEvents,
    categories,
    loading,
    error,
    selectedScopeRef,
    isOriginalRecurring,
    loadData,
    reloadEvents,
    handleSubmitEvent,
    handleUpdateEvent,
    handleConfirmDelete
  } = useEventManagement();

  const { resolvedLocation, shouldShowSummary, setShouldShowSummary } = useLocation();

  const {
    isRecommendOpen,
    isRecommendLoading,
    recommendations,
    pendingCreatedEvents,
    recommendTargetDate,
    handleFirstScheduleAdd,
    handleRecommendEventsCreated,
    handleRecommendModalClose
  } = useRecommendation(resolvedLocation);

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
      const selectedDateObj = parseYMDToLocalDate(selectedDate);
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

  const handleSubmitWithModalClose = async (createdEvents: Event[]) => {
    await handleSubmitEvent(createdEvents);
    setIsModalOpen(false);
    setIsEditModalOpen(false);
  };

  const handleUpdateWithModalClose = async (updatedEvents: Event[]) => {
    await handleUpdateEvent(updatedEvents, editingEvent, selectedEvent, setSelectedEvent);
    setIsEditModalOpen(false);
    setEditingEvent(null);
  };

  const handleConfirmDeleteWrapper = () => {
    handleConfirmDelete(
      pendingDeleteEvent,
      pendingDeleteScope,
      setViewMode,
      setSelectedEvent,
      setIsConfirmOpen,
      setPendingDeleteEvent,
      setPendingDeleteScope,
      reloadEvents,
      currentMonth
    );
  };

  const handleRecommendClose = () => {
    handleRecommendModalClose(setEvents);
  };

  const handleFirstScheduleAddWrapper = (date?: string | null) => {
    handleFirstScheduleAdd(date, selectedDate);
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
    loadData(currentMonth);
  }, [currentMonth]);

  useEffect(() => {
    if (shouldShowSummary) {
      setIsSummaryModalOpen(true);
      setShouldShowSummary(false);
    }
  }, [shouldShowSummary, setShouldShowSummary]);

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
                onFirstScheduleAdd={handleFirstScheduleAddWrapper}
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
        onSubmit={handleSubmitWithModalClose}
        initialDate={clickedDateForAdd}
      />

      <ScheduleModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onSubmit={handleUpdateWithModalClose}
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
        onConfirm={handleConfirmDeleteWrapper}
        onClose={() => setIsConfirmOpen(false)}
      />

      <SummaryModal
        isOpen={isSummaryModalOpen}
        onClose={() => setIsSummaryModalOpen(false)}
        locationData={resolvedLocation || undefined}
        onRecommend={() => {
          const today = getKoreaDateString();
          handleFirstScheduleAdd(null, today);
        }}
      />

      <RecommendModal
        isOpen={isRecommendOpen}
        onClose={handleRecommendClose}
        locationData={resolvedLocation || undefined}
        categories={categories}
        recommendations={recommendations || []}
        loading={isRecommendLoading}
        targetDate={recommendTargetDate}
        onEventsCreated={handleRecommendEventsCreated}
        onReload={async () => {
          await reloadEvents(currentMonth);
          setIsSummaryModalOpen(false);
          handleRecommendClose();
        }}
      />
    </>
  );
}
