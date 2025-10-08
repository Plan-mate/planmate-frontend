import { authenticatedClient } from '../client';
import { CreateEventRequest, Event, Category, EventUpdateRequest, Scope } from '@/types/event';

export const createEvent = async (payload: CreateEventRequest): Promise<Event[]> => {
  const { data } = await authenticatedClient.post('/events', payload);
  return data;
};

export const updateEvent = async (payload: EventUpdateRequest): Promise<Event[]> => {
  const { data } = await authenticatedClient.patch(`/events/${payload.eventId}`, {
    scope: payload.scope,
    event: payload.event
  });
  return data;
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
