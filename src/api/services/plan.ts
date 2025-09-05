import { authenticatedClient } from '../client';
import { CreateEventRequest, Event, Category, EventUpdateRequest, Scope } from '@/types/event';

export const createEvent = async (payload: CreateEventRequest): Promise<Event[]> => {
  const { data } = await authenticatedClient.post('/events', payload);
  return data as Event[];
};

export const updateEvent = async (payload: EventUpdateRequest): Promise<Event[]> => {
  const { data } = await authenticatedClient.patch(`/events/${payload.eventId}`, {
    scope: payload.scope,
    event: payload.event
  });
  console.log('data', data);
  return data as Event[];
};

export const deleteEvent = async (eventId: number, scope: Scope): Promise<void> => {
  await authenticatedClient.delete(`/events/${eventId}?scope=${scope}`);
};

export const getEvents = async (year: number, month: number): Promise<Event[]> => {
  const { data } = await authenticatedClient.get(`/events/list?year=${year}&month=${month}`);
  return data;
};

export const getCategory = async (): Promise<Category[]> => {
  const { data } = await authenticatedClient.get('/events/category');
  return data;
};

