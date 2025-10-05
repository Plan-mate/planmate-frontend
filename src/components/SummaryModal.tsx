"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getTodayWeatherSummary, getTodayScheduleSummary, getRecommendations, LocationData, WeatherSummaryDto } from "@/api/services/plan";
import "@/styles/summaryModal.css";
interface SummaryResponse {
  weather?: WeatherSummaryDto;
  scheduleSummary?: string;
  totalEventCount?: number;
  categoryCounts?: Array<{ categoryName: string; count: number }>;
  mainEvents?: Array<{ title?: string; start?: string; end?: string }>;
}
interface SummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  locationData?: LocationData;
  onRecommend?: () => void;
}

export default function SummaryModal({ isOpen, onClose, locationData, onRecommend }: SummaryModalProps) {
  const [summaryData, setSummaryData] = useState<SummaryResponse | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [weatherDisplayText, setWeatherDisplayText] = useState("");
  const [summaryDisplayText, setSummaryDisplayText] = useState("");
  const [weatherDone, setWeatherDone] = useState(false);
  const [summaryDone, setSummaryDone] = useState(false);
  const weatherTypingIndexRef = useRef(0);
  const summaryTypingIndexRef = useRef(0);

  const sky = summaryData?.weather?.sky || "알 수 없음";
  const totalCount = summaryData?.totalEventCount ?? 0;
  const weatherSummary = summaryData?.weather?.summary || "";
  const hourlyWeathers = summaryData?.weather?.hourlyWeathers || [];
  const scheduleSummary = summaryData?.scheduleSummary || "";
  const noEventsText = "오늘은 추가된 일정이 없네요.\n버튼을 눌러 오늘에 어울리는 일정을 추천받아 보세요.";

  useEffect(() => {
    if (isOpen) {
      if (!summaryData) {
        loadWeatherSummary();
        loadScheduleSummary();
      }
    } else {
      setSummaryData(null);
      setWeatherDisplayText("");
      setSummaryDisplayText("");
      setWeatherDone(false);
      setSummaryDone(false);
      setWeatherError(null);
      setScheduleError(null);
      weatherTypingIndexRef.current = 0;
      summaryTypingIndexRef.current = 0;
    }
  }, [isOpen]);

  useEffect(() => {
    if ((weatherLoading || scheduleLoading) || !summaryData) return;
    if (weatherDone && summaryDone) return;
    
    if (sky === '알 수 없음') {
      if (!weatherDone) setWeatherDone(true);
    }

    if (!weatherDone && weatherSummary && !weatherError) {
      setWeatherDisplayText("");
      setSummaryDisplayText("");
      setWeatherDone(false);
      setSummaryDone(false);
      weatherTypingIndexRef.current = 0;
      summaryTypingIndexRef.current = 0;

      let weatherInterval: any;
      let summaryInterval: any;
      
      weatherInterval = setInterval(() => {
        weatherTypingIndexRef.current += 1;
        setWeatherDisplayText(weatherSummary.slice(0, weatherTypingIndexRef.current));
        if (weatherTypingIndexRef.current >= weatherSummary.length) {
          clearInterval(weatherInterval);
          setWeatherDone(true);
          const hasEvents = (summaryData?.totalEventCount ?? 0) > 0;
          const target = hasEvents ? scheduleSummary : noEventsText;
          if (target && !scheduleError) {
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

      return () => {
        if (weatherInterval) clearInterval(weatherInterval);
        if (summaryInterval) clearInterval(summaryInterval);
      };
    } else if (!summaryDone && (scheduleSummary || (summaryData && (summaryData.totalEventCount ?? 0) === 0)) && !scheduleError) {
      if (!weatherDone) setWeatherDone(true);
      setSummaryDisplayText("");
      summaryTypingIndexRef.current = 0;
      const hasEvents = (summaryData?.totalEventCount ?? 0) > 0;
      const target = hasEvents ? scheduleSummary : noEventsText;
      
      let summaryInterval: any;
      summaryInterval = setInterval(() => {
        summaryTypingIndexRef.current += 1;
        setSummaryDisplayText(target.slice(0, summaryTypingIndexRef.current));
        if (summaryTypingIndexRef.current >= target.length) {
          clearInterval(summaryInterval);
          setSummaryDone(true);
        }
      }, 44);

      return () => {
        if (summaryInterval) clearInterval(summaryInterval);
      };
    }
  }, [summaryData, weatherSummary, scheduleSummary, weatherError, scheduleError, sky, weatherDone, summaryDone]);

  const loadWeatherSummary = async () => {
    setWeatherLoading(true);
    setWeatherError(null);
    
    try {
      const weatherData = await getTodayWeatherSummary(locationData);
      setSummaryData(prev => ({
        ...prev,
        weather: weatherData
      }));
    } catch (err) {
      setWeatherError("기상청에서 데이터를 받아올 수 없습니다.");
    } finally {
      setWeatherLoading(false);
    }
  };

  const loadScheduleSummary = async () => {
    setScheduleLoading(true);
    setScheduleError(null);
    try {
      const scheduleData = await getTodayScheduleSummary();
      if (typeof scheduleData === 'string') {
        setSummaryData(prev => ({ ...prev, scheduleSummary: scheduleData }));
      } else if (scheduleData && typeof scheduleData === 'object') {
        const message = scheduleData.message || '';
        setSummaryData(prev => ({ ...prev, scheduleSummary: message, totalEventCount: scheduleData.totalEventCount }));
      }
    } catch (err) {
      setScheduleError("일정 요약을 불러오는데 실패했습니다.");
    } finally {
      setScheduleLoading(false);
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
        <ellipse cx="10" cy="13" rx="7" ry="5" fill="#8B95A1" />
        <ellipse cx="16" cy="14.5" rx="7" ry="5.5" fill="#9AA4B2" />
        <rect x="5" y="19" width="14" height="2.2" rx="1.1" fill="#B0B8C1" />
        <rect x="7" y="22" width="12" height="2" rx="1" fill="#C4CAD2" />
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

  const getHourlyWeatherIcon = (description: string) => {
    const size = 32;
    const stroke = "#5B6472";
    const cloudFill = "#B8C2CE";
    const cloudFill2 = "#C8D0DA";
    const sun1 = "#FDB813";
    const sun2 = "#FFE55C";
    const rain = "#4F8DD6";
    const snow = "#8EC8FF";

    const d = (description || '').trim();

    if (d.includes('비/눈') || d.includes('빗방울/눈날림')) {
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
          <ellipse cx="9" cy="11" rx="6" ry="4" fill={cloudFill} />
          <ellipse cx="16" cy="12.5" rx="6" ry="4.5" fill={cloudFill2} />
          <path d="M8 17 L6 21" stroke={rain} strokeWidth="2" strokeLinecap="round" />
          <path d="M12 17 L10 21" stroke={rain} strokeWidth="2" strokeLinecap="round" />
          <path d="M16 17 L14 21" stroke={rain} strokeWidth="2" strokeLinecap="round" />
          <g stroke={snow} strokeWidth="1.6" strokeLinecap="round">
            <path d="M18 17 l0 3" />
            <path d="M16.8 18.2 l2.4 0" />
            <path d="M17 17.4 l2 2" />
            <path d="M19 17.4 l-2 2" />
          </g>
        </svg>
      );
    }

    if (d.includes('비')) {
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
          <ellipse cx="9" cy="11" rx="6" ry="4" fill={cloudFill} />
          <ellipse cx="16" cy="12.5" rx="6" ry="4.5" fill={cloudFill2} />
          <path d="M8 17 L6 21" stroke={rain} strokeWidth="2.2" strokeLinecap="round" />
          <path d="M12 17 L10 21" stroke={rain} strokeWidth="2.2" strokeLinecap="round" />
          <path d="M16 17 L14 21" stroke={rain} strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      );
    }

    if (d.includes('빗방울')) {
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
          <ellipse cx="9" cy="11" rx="6" ry="4" fill={cloudFill} />
          <ellipse cx="16" cy="12.5" rx="6" ry="4.5" fill={cloudFill2} />
          <path d="M9 17 L8 19" stroke={rain} strokeWidth="2" strokeLinecap="round" />
          <path d="M13 17 L12 19" stroke={rain} strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    }

    if (d.includes('눈날림')) {
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
          <ellipse cx="9" cy="11" rx="6" ry="4" fill={cloudFill} />
          <ellipse cx="16" cy="12.5" rx="6" ry="4.5" fill={cloudFill2} />
          <g stroke={snow} strokeWidth="1.8" strokeLinecap="round">
            <path d="M10 17 l0 3" />
            <path d="M8.8 18.2 l2.4 0" />
            <path d="M9 17.4 l2 2" />
            <path d="M11 17.4 l-2 2" />
          </g>
          <g stroke={snow} strokeWidth="1.8" strokeLinecap="round">
            <path d="M15 17 l0 3" />
            <path d="M13.8 18.2 l2.4 0" />
            <path d="M14 17.4 l2 2" />
            <path d="M16 17.4 l-2 2" />
          </g>
        </svg>
      );
    }

    if (d.includes('눈')) {
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
          <ellipse cx="9" cy="11" rx="6" ry="4" fill={cloudFill} />
          <ellipse cx="16" cy="12.5" rx="6" ry="4.5" fill={cloudFill2} />
          <g stroke={snow} strokeWidth="2" strokeLinecap="round">
            <path d="M8 17 l0 3" />
            <path d="M6.8 18.2 l2.4 0" />
            <path d="M7 17.4 l2 2" />
            <path d="M9 17.4 l-2 2" />
          </g>
          <g stroke={snow} strokeWidth="2" strokeLinecap="round">
            <path d="M12 17 l0 3" />
            <path d="M10.8 18.2 l2.4 0" />
            <path d="M11 17.4 l2 2" />
            <path d="M13 17.4 l-2 2" />
          </g>
          <g stroke={snow} strokeWidth="2" strokeLinecap="round">
            <path d="M16 17 l0 3" />
            <path d="M14.8 18.2 l2.4 0" />
            <path d="M15 17.4 l2 2" />
            <path d="M17 17.4 l-2 2" />
          </g>
        </svg>
      );
    }

    if (d.includes('흐림')) {
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
          <ellipse cx="9" cy="12" rx="7" ry="5" fill="#8B95A1" />
          <ellipse cx="16" cy="13.5" rx="7" ry="5.5" fill="#9AA4B2" />
        </svg>
      );
    }

    if (d.includes('구름')) {
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
          <ellipse cx="8" cy="14" rx="5" ry="4" fill="#A8B2C0" />
          <ellipse cx="16" cy="14" rx="5" ry="4" fill="#C0C6CF" />
          <ellipse cx="12" cy="12" rx="6" ry="3" fill="#D2D8E1" />
        </svg>
      );
    }

    if (d.includes('맑음') || d.includes('맑은')) {
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
          <circle cx="12" cy="12" r="4.2" fill={sun1} />
          <circle cx="12" cy="12" r="3.2" fill={sun2} />
        </svg>
      );
    }

    return (
      <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
        <circle cx="12" cy="12" r="10" fill="none" stroke={stroke} strokeWidth="2" />
        <text x="12" y="16" textAnchor="middle" fontSize="8" fill={stroke}>?</text>
      </svg>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="summary-modal-overlay">
      <div className="summary-modal">
        <div className="summary-modal-header enhanced">
          <h2 className="summary-modal-title">오늘의 요약</h2>
          <button className="summary-modal-close" onClick={onClose} aria-label="닫기">×</button>
        </div>

        <div className="summary-modal-content">
          {(weatherLoading || scheduleLoading) ? (
            <div className="summary-loading">
              <div className="pm-skeleton text skeleton-w-100 skeleton-mb-8"></div>
              <div className="pm-skeleton text skeleton-w-80 skeleton-mb-8"></div>
              <div className="pm-skeleton text skeleton-w-90"></div>
            </div>
          ) : (
            <>
              <div className={`summary-weather ${weatherError || sky === '알 수 없음' ? 'error-state' : ''}`}>
                {weatherError || sky === '알 수 없음' ? (
                  <div className="weather-error">
                    <div className="error-icon">🌤️</div>
                    <p>기상청에서 데이터를 받아올 수 없습니다.</p>
                  </div>
                ) : (
                  <>
                    <div className={`summary-weather__icon ${sky === '알 수 없음' ? 'unknown' : ''}`}>
                      {sky === '맑음' && SkyIcon.sun}
                      {(sky === '구름 많음' || sky === '흐림') && SkyIcon.overcast}
                      {sky !== '맑음' && sky !== '구름 많음' && sky !== '흐림' && SkyIcon.unknown}
                    </div>
                    <div className="summary-weather__text">
                      {weatherSummary && (
                        <div className="summary-weather-message">{weatherDisplayText}</div>
                      )}
                    </div>
                  </>
                )}
              </div>
              
              {weatherDone && hourlyWeathers.length > 0 && (
                <div className="hourly-weather-section">
                  <h3 className="hourly-weather-title">시간별 날씨</h3>
                  <div className="hourly-weather-scroll">
                    <div className="hourly-weather-container">
              {hourlyWeathers.map((weather, index) => (
                        <div key={index} className="hourly-weather-item">
                          <div className="hourly-weather-time">{weather.time}</div>
                          <div className="hourly-weather-icon">
                            {getHourlyWeatherIcon(weather.description)}
                          </div>
                          <div className="hourly-weather-temp">{weather.temperature}°</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <>
                <div className="summary-divider"></div>
                {scheduleError ? (
                  <div className="schedule-error">
                    <div className="error-icon">📅</div>
                    <p>{scheduleError}</p>
                    <button onClick={loadScheduleSummary} className="retry-btn">일정 다시 시도</button>
                  </div>
                ) : totalCount === 0 ? (
                  <>
                    <div className="summary-empty-text">{summaryDisplayText}</div>
                    {summaryDone && (
                      <div className="summary-actions center">
                        <button
                          className="summary-modal-btn primary"
                          onClick={() => { if (onRecommend) onRecommend(); }}
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
