"use client";

import { useEffect, useRef, useState } from "react";
import { getTodayWeatherSummary, getTodayScheduleSummary } from "@/api/services/summary";
import type { LocationData, WeatherSummaryDto } from "@/api/types/api.types";
import { SkyIcon, HourlyWeatherIcon } from "./SummaryModal/WeatherIcons";
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
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

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
                      <SkyIcon sky={sky} />
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
                            <HourlyWeatherIcon description={weather.description} />
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
