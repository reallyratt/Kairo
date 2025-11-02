

export interface TFolder {
  id: string;
  name: string;
}

export interface TTag {
  id: string;
  name: string;
}

export interface TNote {
  id: string;
  folderId: string;
  title: string;
  content: string; // HTML content
  tagIds: string[];
  createdAt: string; // ISO String
  updatedAt: string; // ISO String
  noteTheme?: string;
}

export interface TCalendarCategory {
  id:string;
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

export interface TTaskGroup {
  id: string;
  name: string;
  color?: string;
}

export interface TTask {
  id:string;
  calendarId: string;
  eventId?: string;
  taskGroupId?: string;
  name: string;
  description?: string;
  color: string;
  dueDate?: string; // ISO 8601
  completed: boolean;
  urgency?: Urgency;
  createdAt: string; // ISO String
  updatedAt: string; // ISO String
}
// FIX: Add missing types for Habit tracker feature
export interface THabitCategory {
  id: string;
  name: string;
}

export enum HabitType {
  YesNo = 'yes-no',
  Number = 'number',
}

export interface THabit {
  id: string;
  name: string;
  description?: string;
  color: string;
  type: HabitType;
  categoryId: string;
  unit?: string;
}

export interface THabitLog {
  id: string;
  habitId: string;
  date: string; // YYYY-MM-DD
  value: number;
}

// FIX: Add missing types for Finance tracker feature
export interface TWallet {
    id: string;
    name: string;
    icon: string;
    color: string;
}

export enum TransactionType {
    Income = 'income',
    Expense = 'expense',
}

export interface TFinanceCategory {
    id: string;
    name: string;
    color: string;
    icon: string;
    type: TransactionType;
}

export interface TTransaction {
    id: string;
    walletId: string;
    title: string;
    description?: string;
    amount: number;
    type: TransactionType;
    date: string; // YYYY-MM-DD
    categoryId: string;
}