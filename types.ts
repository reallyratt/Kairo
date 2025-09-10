

export interface TTag {
  id: string;
  name: string;
}

export interface TNote {
  id: string;
  calendarId: string;
  title: string;
  content: string; // HTML content
  tagIds: string[];
  createdAt: string; // ISO String
  updatedAt: string; // ISO String
}

export interface TCalendarCategory {
  id: string;
  name: string;
}

export interface TCalendar {
  id: string;
  name: string;
  color: string;
  categoryId?: string;
}

export interface TEvent {
  id: string;
  calendarId: string;
  seriesId?: string; // To group recurring events
  name: string;
  description?: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  color: string;
}

export enum Urgency {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
}

export interface TTask {
  id:string;
  calendarId: string;
  eventId?: string;
  name: string;
  description?: string;
  color: string;
  dueDate?: string; // ISO 8601
  completed: boolean;
  urgency?: Urgency;
  createdAt: string; // ISO String
  updatedAt: string; // ISO String
}

export enum HabitType {
  YesNo = 'yes-no',
  Number = 'number',
}

export interface THabitCategory {
  id: string;
  name: string;
}

export interface THabit {
  id: string;
  categoryId: string;
  name: string;
  description?: string;
  color: string;
  type: HabitType;
  unit?: string;
}

export interface THabitLog {
  id: string;
  habitId: string;
  date: string; // YYYY-MM-DD
  value: number; // 1 for yes, 0 for no, or the number value
}

export enum TransactionType {
  Income = 'income',
  Expense = 'expense',
}

export interface TFinanceCategory {
  id: string;
  name: string;
  color: string;
  icon: string; // Font Awesome icon class e.g., 'fa-utensils'
  type: TransactionType;
}

export interface TWallet {
  id: string;
  name: string;
  icon: string; // Font Awesome icon class e.g., 'fa-solid fa-wallet'
  color: string;
}

export interface TTransaction {
  id: string;
  walletId: string;
  type: TransactionType;
  categoryId: string;
  title: string;
  description?: string;
  amount: number;
  date: string; // YYYY-MM-DD
}