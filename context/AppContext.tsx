import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { TCalendar, TEvent, TTask, THabitCategory, THabit, THabitLog, TFinanceCategory, TTransaction, TNote, TTag, TWallet } from '../types';
import { DEFAULT_CALENDARS, DEFAULT_FINANCE_CATEGORIES, DEFAULT_HABIT_CATEGORIES, DEFAULT_WALLETS } from '../constants';

// --- TYPES ---
export type Language = 'en' | 'id' | 'tlh';
export type Theme = 'dark' | 'light' | 'cute';

interface AppContextType {
  calendars: TCalendar[];
  setCalendars: React.Dispatch<React.SetStateAction<TCalendar[]>>;
  events: TEvent[];
  setEvents: React.Dispatch<React.SetStateAction<TEvent[]>>;
  tasks: TTask[];
  setTasks: React.Dispatch<React.SetStateAction<TTask[]>>;
  habitCategories: THabitCategory[];
  setHabitCategories: React.Dispatch<React.SetStateAction<THabitCategory[]>>;
  habits: THabit[];
  setHabits: React.Dispatch<React.SetStateAction<THabit[]>>;
  habitLogs: THabitLog[];
  setHabitLogs: React.Dispatch<React.SetStateAction<THabitLog[]>>;
  wallets: TWallet[];
  setWallets: React.Dispatch<React.SetStateAction<TWallet[]>>;
  financeCategories: TFinanceCategory[];
  setFinanceCategories: React.Dispatch<React.SetStateAction<TFinanceCategory[]>>;
  transactions: TTransaction[];
  setTransactions: React.Dispatch<React.SetStateAction<TTransaction[]>>;
  notes: TNote[];
  setNotes: React.Dispatch<React.SetStateAction<TNote[]>>;
  tags: TTag[];
  setTags: React.Dispatch<React.SetStateAction<TTag[]>>;
  isAboutOpen: boolean;
  setIsAboutOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isDataOpen: boolean;
  setIsDataOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isSettingsOpen: boolean;
  setIsSettingsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  language: Language;
  setLanguage: React.Dispatch<React.SetStateAction<Language>>;
  theme: Theme;
  setTheme: React.Dispatch<React.SetStateAction<Theme>>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// --- TRANSLATION LOGIC ---
const translations: Record<Language, Record<string, any>> = {
  en: {
    nav: { notes: "Notes", todo: "To Do", calendar: "Calendar", habit: "Habit", finance: "Finance" },
    header: { notes: "Notes", todo: "To-Do List", calendar: "Calendar", habit: "Habit Tracker", finance: "Finances", settings: "Settings" },
    settings: { language: "Language", theme: "Theme", dark: "Dark", light: "Light", cute: "Cute", back: "Back to the App" },
    notes: { add: "Add New Note", filterTags: "Filter by tags...", titlePlaceholder: "Note Title...", save: "Save Note", delete: "Delete" },
    calendar: { add: "Add Event", manage: "Manage Calendar" },
    todo: { add: "Add New Task" },
    common: { save: "Save", delete: "Delete", cancel: "Cancel", create: "Create" }
  },
  id: {
    nav: { notes: "Catatan", todo: "Tugas", calendar: "Kalender", habit: "Kebiasaan", finance: "Keuangan" },
    header: { notes: "Catatan", todo: "Daftar Tugas", calendar: "Kalender", habit: "Pelacak Kebiasaan", finance: "Keuangan", settings: "Pengaturan" },
    settings: { language: "Bahasa", theme: "Tema", dark: "Gelap", light: "Terang", cute: "Imut", back: "Kembali ke Aplikasi" },
    notes: { add: "Tambah Catatan Baru", filterTags: "Saring menurut tag...", titlePlaceholder: "Judul Catatan...", save: "Simpan Catatan", delete: "Hapus" },
    calendar: { add: "Tambah Acara", manage: "Kelola Kalender" },
    todo: { add: "Tambah Tugas Baru" },
    common: { save: "Simpan", delete: "Hapus", cancel: "Batal", create: "Buat" }
  },
  tlh: {
    nav: { notes: "ghItlh'e'", todo: "Qo'mey", calendar: "DIvI'", habit: "ghoj", finance: "chovnatlh" },
    header: { notes: "ghItlh'e'", todo: "Qo'mey DIvI'", calendar: "DIvI'", habit: "ghoj luj", finance: "chovnatlh", settings: "ghun'e'" },
    settings: { language: "Hol", theme: "Tema'", dark: "qIj", light: "leS", cute: "yIn", back: "AppDaq jImev" },
    notes: { add: "ghItlh'e' chu' yaj", filterTags: "matlhvaD yuch...", titlePlaceholder: "ghItlh'e' mI'", save: "baS ghItlh'e'", delete: "Qaw'" },
    calendar: { add: "wanI' Doch", manage: "DIvI' vIH" },
    todo: { add: "Qo' chu' Doch" },
    common: { save: "baS", delete: "Qaw'", cancel: "qIl", create: "vI'" }
  }
};

const getTranslation = (lang: Language, key: string): string => {
    const keys = key.split('.');
    let result: any = translations[lang];
    for (const k of keys) {
        result = result?.[k];
        if (result === undefined) {
            console.warn(`Translation key not found: ${key} for language ${lang}`);
            return key;
        }
    }
    return result;
};

export const useTranslation = () => {
    const { language } = useAppContext();
    return {
        t: (key: string) => getTranslation(language, key),
        lang: language
    };
};

// --- APP PROVIDER ---
export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [calendars, setCalendars] = useLocalStorage<TCalendar[]>('kairo-calendars', DEFAULT_CALENDARS);
  const [events, setEvents] = useLocalStorage<TEvent[]>('kairo-events', []);
  const [tasks, setTasks] = useLocalStorage<TTask[]>('kairo-tasks', []);
  const [habitCategories, setHabitCategories] = useLocalStorage<THabitCategory[]>('kairo-habitCategories', DEFAULT_HABIT_CATEGORIES);
  const [habits, setHabits] = useLocalStorage<THabit[]>('kairo-habits', []);
  const [habitLogs, setHabitLogs] = useLocalStorage<THabitLog[]>('kairo-habitLogs', []);
  const [wallets, setWallets] = useLocalStorage<TWallet[]>('kairo-wallets', DEFAULT_WALLETS);
  const [financeCategories, setFinanceCategories] = useLocalStorage<TFinanceCategory[]>('kairo-financeCategories', DEFAULT_FINANCE_CATEGORIES);
  const [transactions, setTransactions] = useLocalStorage<TTransaction[]>('kairo-transactions', []);
  const [notes, setNotes] = useLocalStorage<TNote[]>('kairo-notes', []);
  const [tags, setTags] = useLocalStorage<TTag[]>('kairo-tags', []);
  
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isDataOpen, setIsDataOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [language, setLanguage] = useLocalStorage<Language>('kairo-language', 'en');
  const [theme, setTheme] = useLocalStorage<Theme>('kairo-theme', 'dark');

  useEffect(() => {
    document.documentElement.lang = language;
    document.body.setAttribute('data-theme', theme);
  }, [language, theme]);

  const value = {
    calendars, setCalendars,
    events, setEvents,
    tasks, setTasks,
    habitCategories, setHabitCategories,
    habits, setHabits,
    habitLogs, setHabitLogs,
    wallets, setWallets,
    financeCategories, setFinanceCategories,
    transactions, setTransactions,
    notes, setNotes,
    tags, setTags,
    isAboutOpen, setIsAboutOpen,
    isDataOpen, setIsDataOpen,
    isSettingsOpen, setIsSettingsOpen,
    language, setLanguage,
    theme, setTheme
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};