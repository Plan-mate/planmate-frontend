import { authenticatedClient } from '../client';
import { CreateEventRequest } from '@/types/event';

export const createEvent = async (payload: CreateEventRequest) => {
  const { data } = await authenticatedClient.post('/events', payload);
  return data;
};

export const getCategory = async () => {
  const { data } = await authenticatedClient.get('/events/category');
  return data;
};

