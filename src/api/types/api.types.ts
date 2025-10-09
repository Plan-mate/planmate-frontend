// Auth 관련 타입
export interface LoginCredentials {
  token: string;
}

export interface DailyLoginResponse {
  firstLoginToday: boolean;
}

export interface MeResponse {
  id: number;
  nickname: string;
  profileImage: string;
}

// Summary 관련 타입
export interface LocationData {
  cityName: string;
  nx: number;
  ny: number;
}

export interface HourlyWeatherDto {
  time: string;
  description: string;
  temperature: number;
}

export interface WeatherSummaryDto {
  sky: string;
  summary: string;
  hourlyWeathers: HourlyWeatherDto[];
}

export interface RecommendEventReqDto {
  categoryId: number;
  description: string;
  startTime: string;
  endTime: string;
  title: string;
  isRecurring: boolean;
  recurrenceRule?: any | null;
}

// Notification 관련 타입
export interface NotificationDto {
  id: number;
  title: string;
  body: string;
  read: boolean;
  triggerTime: string;
  sentAt: string;
  status: string;
}
