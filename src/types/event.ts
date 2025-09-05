export interface Category {
  id: number;
  name: string;
  color: string;
}

export interface Event {
  id: number | null;
  category: Category;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  isRecurring: boolean;
  originalEventId?: number | null;
  recurrenceRule?: RecurrenceRule | null;
  createdAt: string;
  updatedAt: string;
}

export interface RecurrenceRule {
  daysOfMonth: number[] | null;
  daysOfWeek: string[] | null;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  interval: number;
  endDate: string | null;
}

export interface CreateEventRequest {
  title: string;
  description: string;
  categoryId: number;
  startTime: string;
  endTime: string;
  isRecurring: boolean;
  recurrenceRule?: {
    frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
    interval: number;
    daysOfWeek?: number[];
    daysOfMonth?: number[];
    endDate?: string;
  };
}

export interface UpdateEventRequest extends Partial<CreateEventRequest> {
  id: number;
}

export type Scope = 'SINGLE' | 'THIS' | 'THIS_AND_FUTURE' | 'ALL';

export interface EventUpdateRequest {
  eventId: number;
  scope: Scope;
  event: Partial<CreateEventRequest>;
}
