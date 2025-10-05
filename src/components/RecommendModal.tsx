"use client";

import { useEffect, useMemo, useState } from "react";
import { LocationData, RecommendEventReqDto, getCategory, createEvent } from "@/api/services/plan";
import { Category } from "@/types/event";
import { useToast } from "@/components/ToastProvider";
import "@/styles/summaryModal.css";

interface RecommendModalProps {
  isOpen: boolean;
  onClose: () => void;
  locationData?: LocationData;
  onReload?: () => Promise<void> | void;
  categories?: Category[];
  recommendations?: RecommendEventReqDto[];
  loading?: boolean;
  targetDate?: string | null;
  onEventsCreated?: (events: any[]) => void;
}

export default function RecommendModal({ isOpen, onClose, locationData, onReload, categories = [], recommendations = [], loading = false, targetDate, onEventsCreated }: RecommendModalProps) {
  const { showToast } = useToast();
  const [pending, setPending] = useState<number | null>(null);
  const [addedIds, setAddedIds] = useState<Set<number>>(new Set());
  const [categoriesLocal, setCategoriesLocal] = useState<Category[]>(categories);

  useEffect(() => {
    if (!isOpen) {
      setPending(null);
      setAddedIds(new Set());
    }
  }, [isOpen]);

  useEffect(() => {
    setCategoriesLocal(categories);
  }, [categories]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!isOpen) return;
      if (categories && categories.length > 0) return;
      try {
        const data = await getCategory();
        if (mounted) setCategoriesLocal(data as Category[]);
      } catch (e) {}
    })();
    return () => { mounted = false; };
  }, [isOpen, categories]);

  const mappedRecommendations = useMemo(() => {
    const catById = new Map<number, Category>();
    (categoriesLocal || []).forEach(c => catById.set(Number(c.id), c));
    return (recommendations || []).map((rec, idx) => {
      const categoryKey = Number((rec as any).categoryId);
      const cat = catById.get(categoryKey);
      return {
        key: `${rec.title}|${rec.categoryId}|${rec.startTime}|${rec.endTime}|${idx}`,
        id: idx + 1,
        categoryName: cat ? cat.name : '미분류',
        categoryColor: cat ? cat.color : '#E5E7EB',
        raw: rec
      };
    });
  }, [categoriesLocal, recommendations]);

  if (!isOpen) return null;

  const handleAdd = async (id: number) => {
    try {
      setPending(id);
      const target = mappedRecommendations.find(m => m.id === id);
      if (!target) return;
      
      let adjustedStartTime = target.raw.startTime;
      let adjustedEndTime = target.raw.endTime;
      
      if (targetDate) {
        const backendTime = target.raw.startTime.split('T')[1];
        const backendEndTime = target.raw.endTime.split('T')[1];
        adjustedStartTime = `${targetDate}T${backendTime}`;
        adjustedEndTime = `${targetDate}T${backendEndTime}`;
      }
      
      const createRequest = {
        title: target.raw.title,
        description: target.raw.description,
        categoryId: target.raw.categoryId,
        startTime: adjustedStartTime,
        endTime: adjustedEndTime,
        isRecurring: target.raw.isRecurring,
        recurrenceRule: target.raw.recurrenceRule
      };
      
      const createdEvents = await createEvent(createRequest);
      if (onEventsCreated && Array.isArray(createdEvents)) {
        onEventsCreated(createdEvents);
      }
      
      try { showToast('추천 일정이 추가되었습니다', 'success'); } catch {}
      setAddedIds(prev => {
        const next = new Set(prev);
        next.add(id);
        return next;
      });
    } catch {
      try { showToast('추천 일정 추가에 실패했어요', 'error'); } catch {}
    } finally {
      setPending(null);
    }
  };

  const handleRefresh = () => {
    onClose();
  };

  return (
    <div className="summary-modal-overlay">
      <div className="summary-modal">
        <div className="summary-modal-header enhanced">
          <h2 className="summary-modal-title">추천이 준비됐어요</h2>
          <button className="summary-modal-close" onClick={onClose} aria-label="닫기">×</button>
        </div>

        <div className="summary-modal-content" style={{ minHeight: 260 }}>
          <div className="summary-text padded" style={{ display: 'grid', gap: 14 }}>
            <div>날씨와 등록된 일정 정보를 바탕으로 어울리는 일정을 추천했어요.</div>

            <div style={{ display: 'grid', gap: 10 }}>
              {loading && (
                <>
                  <div className="pm-skeleton block" style={{ height: 52 }}></div>
                  <div className="pm-skeleton block" style={{ height: 52 }}></div>
                  <div className="pm-skeleton block" style={{ height: 52 }}></div>
                </>
              )}
              {!loading && mappedRecommendations.length === 0 && (
                <div className="pm-card" style={{ padding: 12, color: '#6B7280' }}>
                  표시할 추천이 없어요.
                </div>
              )}
              {!loading && mappedRecommendations.map(item => (
                <div key={item.id} className="pm-card" style={{ padding: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: item.categoryColor, display: 'inline-block' }} />
                    <div style={{ display: 'grid', gap: 2, minWidth: 0 }}>
                      <div style={{ fontSize: 12, color: '#6B7280' }}>[{item.categoryName}]</div>
                      <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.raw.title}</div>
                      <div style={{ fontSize: 12, color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.raw.description}</div>
                    </div>
                  </div>
                  <button
                    className={`summary-modal-btn ${addedIds.has(item.id) ? '' : 'primary'}`}
                    onClick={() => handleAdd(item.id)}
                    disabled={pending === item.id || addedIds.has(item.id)}
                    aria-label="추천 일정 추가하기"
                    style={Object.assign(
                      { marginLeft: 4, whiteSpace: 'nowrap', flexShrink: 0 },
                      addedIds.has(item.id)
                        ? { background: '#E5E7EB', color: '#6B7280', cursor: 'default' }
                        : {}
                    )}
                  >
                    {pending === item.id ? '추가 중...' : (addedIds.has(item.id) ? '추가됨' : '추가')}
                  </button>
                </div>
              ))}
            </div>

            <div className="pm-hint" style={{ color: '#667085', fontSize: 13 }}>추가한 일정은 캘린더에서 확인할 수 있어요.</div>
          </div>
        </div>

        <div className="summary-modal-footer" style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="summary-modal-btn primary" onClick={handleRefresh}>캘린더 새로고침</button>
        </div>
      </div>
    </div>
  );
}


