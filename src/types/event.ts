export interface Category {
  id: number;
  name: string;
  color: string;
}

export interface Event {
  id: number;
  category: Category;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  isRecurring: boolean;
  originalEventId?: number | null;
  recurrenceRule?: RecurrenceRule;
  createdAt: string;
  updatedAt: string;
}

export interface RecurrenceRule {
  id: number;
  eventId: number;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  interval: number;
  daysOfWeek?: string; // JSON string: "[1,2,3]" (월,화,수)
  daysOfMonth?: string; // JSON string: "[1,15,30]"
  endDate?: string;
  createdAt: string;
  updatedAt: string;
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
