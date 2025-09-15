import { authenticatedClient } from '../client';
import { CreateEventRequest, Event, Category, EventUpdateRequest, Scope } from '@/types/event';

export interface LocationData {
  cityName: string;
  nx: number;
  ny: number;
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


export const getTodaySummary = async (locationData?: LocationData): Promise<string> => {
  let url = '/summary/today';

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

export const getRecommendations = async (): Promise<void> => {
  await authenticatedClient.get('/summary/recommend');
};
