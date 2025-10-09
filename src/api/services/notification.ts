import { authenticatedClient } from '../client';
import type { NotificationDto } from '../types/api.types';

export const hasUnread = async (): Promise<boolean> => {
  const { data } = await authenticatedClient.get('/notifications/has-unread');
  return data;
};

export const getMyNotifications = async (): Promise<NotificationDto[]> => {
  const { data } = await authenticatedClient.get('/notifications');
  return data;
};

export const markAllAsRead = async (): Promise<void> => {
  await authenticatedClient.patch('/notifications/read-all');
};

