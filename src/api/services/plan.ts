import { authenticatedClient } from '../client';
import { CreateEventRequest, Event, Category } from '@/types/event';

export const createEvent = async (payload: CreateEventRequest): Promise<Event[]> => {
  const { data } = await authenticatedClient.post('/events', payload);
  return data as Event[];
};

export const getEvents = async (year: number, month: number): Promise<Event[]> => {
  const { data } = await authenticatedClient.get(`/events/list?year=${year}&month=${month}`);
  return data;
};

export const getCategory = async (): Promise<Category[]> => {
  const { data } = await authenticatedClient.get('/events/category');
  return data;
};

