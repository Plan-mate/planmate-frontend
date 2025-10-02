import { authenticatedClient } from '../client';
import { CreateEventRequest, Event, Category, EventUpdateRequest, Scope } from '@/types/event';

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


export const createEvent = async (payload: CreateEventRequest): Promise<Event[]> => {
  const { data } = await authenticatedClient.post('/events', payload);
  return data as Event[];
};

export const updateEvent = async (payload: EventUpdateRequest): Promise<Event[]> => {
  const { data } = await authenticatedClient.patch(`/events/${payload.eventId}`, {
    scope: payload.scope,
    event: payload.event
  });
  return data as Event[];
};

export const deleteEvent = async (eventId: number, scope: Scope, targetTime?: string): Promise<void> => {
  await authenticatedClient.delete(`/events/${eventId}`, {
    data: { scope, targetTime }
  });
};

export const getEvents = async (year: number, month: number): Promise<Event[]> => {
  const { data } = await authenticatedClient.get(`/events/list?year=${year}&month=${month}`);
  return data;
};

export const getCategory = async (): Promise<Category[]> => {
  const { data } = await authenticatedClient.get('/events/category');
  return data;
};


export const getTodayWeatherSummary = async (locationData?: LocationData): Promise<WeatherSummaryDto> => {
  let url = '/summary/today/weather';

  let params: URLSearchParams | null = null;
  if (locationData) {
    params = new URLSearchParams({
      locationName: locationData.cityName,
      nx: locationData.nx.toString(),
      ny: locationData.ny.toString()
    });
  }

  if (params) {
    url += `?${params.toString()}`;
  }

  const { data } = await authenticatedClient.get(url);
  return data;
};

export const getTodayScheduleSummary = async (): Promise<any> => {
  const { data } = await authenticatedClient.get('/summary/today/event');
  return data;
};

export const getRecommendations = async (): Promise<void> => {
  await authenticatedClient.get('/summary/recommend');
};
