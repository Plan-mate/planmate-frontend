"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getTodaySummary, getRecommendations, LocationData } from "@/api/services/plan";
import "@/styles/summaryModal.css";
interface SummaryResponse {
  weather?: { sky?: string; message?: string };
  totalEventCount?: number;
  categoryCounts?: Array<{ categoryName: string; count: number }>;
  mainEvents?: Array<{ title?: string; start?: string; end?: string }>;
  message?: string;
}
interface SummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  locationData?: LocationData;
  onRecommend?: () => void;
}

export default function SummaryModal({ isOpen, onClose, locationData, onRecommend }: SummaryModalProps) {
  const [summaryData, setSummaryData] = useState<SummaryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [weatherDisplayText, setWeatherDisplayText] = useState("");
  const [summaryDisplayText, setSummaryDisplayText] = useState("");
  const [weatherDone, setWeatherDone] = useState(false);
  const [summaryDone, setSummaryDone] = useState(false);
  const weatherTypingIndexRef = useRef(0);
  const summaryTypingIndexRef = useRef(0);

  const sky = summaryData?.weather?.sky || "알 수 없음";
  const totalCount = summaryData?.totalEventCount ?? 0;
  const weatherMessage = summaryData?.weather?.message || "";
  const message = summaryData?.message || "";
  const noEventsText = "이번 달에 새로 추가된 일정이 없네요.\n버튼을 눌러 오늘에 어울리는 일정을 추천받아 보세요.";

  useEffect(() => {
    if (isOpen) {
      loadSummary();
    } else {
      setSummaryData(null);
      setWeatherDisplayText("");
      setSummaryDisplayText("");
      setWeatherDone(false);
      setSummaryDone(false);
      weatherTypingIndexRef.current = 0;
      summaryTypingIndexRef.current = 0;
    }
  }, [isOpen]);

  useEffect(() => {
    if (loading || !summaryData) return;
    setWeatherDisplayText("");
    setSummaryDisplayText("");
    setWeatherDone(false);
    setSummaryDone(false);
    weatherTypingIndexRef.current = 0;
    summaryTypingIndexRef.current = 0;

    let weatherInterval: any;
    let summaryInterval: any;
    if (weatherMessage) {
      weatherInterval = setInterval(() => {
        weatherTypingIndexRef.current += 1;
        setWeatherDisplayText(weatherMessage.slice(0, weatherTypingIndexRef.current));
        if (weatherTypingIndexRef.current >= weatherMessage.length) {
          clearInterval(weatherInterval);
          setWeatherDone(true);
          const hasEvents = (summaryData?.totalEventCount ?? 0) > 0;
          const target = hasEvents ? message : noEventsText;
          if (target) {
            summaryInterval = setInterval(() => {
              summaryTypingIndexRef.current += 1;
              setSummaryDisplayText(target.slice(0, summaryTypingIndexRef.current));
              if (summaryTypingIndexRef.current >= target.length) {
                clearInterval(summaryInterval);
                setSummaryDone(true);
              }
            }, 44);
          }
        }
      }, 56);
    } else if (message || (summaryData && (summaryData.totalEventCount ?? 0) === 0)) {
      setWeatherDone(true);
      const hasEvents = (summaryData?.totalEventCount ?? 0) > 0;
      const target = hasEvents ? message : noEventsText;
      summaryInterval = setInterval(() => {
        summaryTypingIndexRef.current += 1;
        setSummaryDisplayText(target.slice(0, summaryTypingIndexRef.current));
        if (summaryTypingIndexRef.current >= target.length) {
          clearInterval(summaryInterval);
          setSummaryDone(true);
        }
      }, 44);
    }

    return () => {
      if (weatherInterval) clearInterval(weatherInterval);
      if (summaryInterval) clearInterval(summaryInterval);
    };
  }, [loading, summaryData, weatherMessage, message]);

  const loadSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTodaySummary(locationData);
      const parsed: SummaryResponse = typeof data === "string" ? { message: data } : data;
      setSummaryData(parsed);
    } catch (err) {
      setError("요약을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const SkyIcon = useMemo(() => {
    const s = 80;
    const c = "#666";
    const sun = (
      <svg width={s} height={s} viewBox="0 0 24 24" aria-hidden>
        <circle cx="12" cy="12" r="5" fill="#FDB813" />
      </svg>
    );
    const clouds = (
      <svg width={s} height={s} viewBox="0 0 24 24" aria-hidden>
        <ellipse cx="9" cy="14" rx="6" ry="4" fill="#C0C6CF" />
        <ellipse cx="15" cy="14" rx="6" ry="4" fill="#D2D8E1" />
      </svg>
    );
    const overcast = (
      <svg width={s} height={s} viewBox="0 0 24 24" aria-hidden>
        <ellipse cx="12" cy="14" rx="8" ry="5" fill="#9AA1AB" />
      </svg>
    );
    const unknown = (
      <svg width={s} height={s} viewBox="0 0 24 24" aria-hidden>
        <circle cx="12" cy="12" r="10" fill="none" stroke={c} strokeWidth="2" />
        <text x="12" y="16" textAnchor="middle" fontSize="10" fill={c}>?</text>
      </svg>
    );
    return { sun, clouds, overcast, unknown };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="summary-modal-overlay">
      <div className="summary-modal">
        <div className="summary-modal-header enhanced">
          <h2 className="summary-modal-title">오늘의 요약</h2>
          <button className="summary-modal-close" onClick={onClose} aria-label="닫기">×</button>
        </div>

        <div className="summary-modal-content">
          {loading ? (
            <div className="summary-loading">
              <div className="pm-skeleton text w-100 mb-8"></div>
              <div className="pm-skeleton text w-80 mb-8"></div>
              <div className="pm-skeleton text w-90"></div>
            </div>
          ) : error ? (
            <div className="summary-error">
              <div className="error-icon">⚠️</div>
              <p>{error}</p>
              <button onClick={loadSummary} className="retry-btn">다시 시도</button>
            </div>
          ) : (
            <>
              <div className="summary-weather">
                <div className={`summary-weather__icon ${sky === '알 수 없음' ? 'unknown' : ''}`}>
                  {sky === '맑음' && SkyIcon.sun}
                  {sky === '구름 많음' && SkyIcon.clouds}
                  {sky === '흐림' && SkyIcon.overcast}
                  {sky !== '맑음' && sky !== '구름 많음' && sky !== '흐림' && SkyIcon.unknown}
                </div>
                <div className="summary-weather__text">
                  {summaryData?.weather?.message && (
                    <div className="summary-weather-message">{weatherDisplayText}</div>
                  )}
                </div>
              </div>
              {weatherDone && (
                <>
                  <div className="summary-divider"></div>
                  {totalCount === 0 ? (
                    <>
                      <div className="summary-empty-text">{summaryDisplayText}</div>
                      {summaryDone && (
                        <div className="summary-actions center">
                          <button
                            className="summary-modal-btn primary"
                            onClick={async () => {
                              try { await getRecommendations(); } catch {}
                              if (onRecommend) onRecommend();
                            }}
                            aria-label="일정 추천 받으러 가기"
                          >
                            일정 추천 받으러 가기
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="summary-text padded">{summaryDisplayText}</div>
                  )}
                </>
              )}
            </>
          )}
        </div>

        <div className="summary-modal-footer">
          <button className="summary-modal-btn primary" onClick={onClose}>닫기</button>
        </div>
      </div>
    </div>
  );
}
