import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
// FIX: Import missing types for Habit and Finance features.
import { TCalendar, TEvent, TTask, TNote, TTag, TCalendarCategory, TFolder, THabit, THabitCategory, THabitLog, TWallet, TTransaction, TFinanceCategory, TransactionType } from '../types';
import { DEFAULT_CALENDARS } from '../constants';

// --- TYPES ---
export type Language = 'en' | 'id' | 'tlh';
export type Theme = 'dark' | 'light' | 'cute';
// FIX: Add 'habit' and 'finance' to ActivePage to allow navigation and actions.
export type ActivePage = 'notes' | 'todo' | 'calendar' | 'habit' | 'finance';

interface AppContextType {
  calendars: TCalendar[];
  setCalendars: React.Dispatch<React.SetStateAction<TCalendar[]>>;
  events: TEvent[];
  setEvents: React.Dispatch<React.SetStateAction<TEvent[]>>;
  tasks: TTask[];
  setTasks: React.Dispatch<React.SetStateAction<TTask[]>>;
  notes: TNote[];
  setNotes: React.Dispatch<React.SetStateAction<TNote[]>>;
  tags: TTag[];
  setTags: React.Dispatch<React.SetStateAction<TTag[]>>;
  folders: TFolder[];
  setFolders: React.Dispatch<React.SetStateAction<TFolder[]>>;
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
  activeAction: ActivePage | null;
  setActiveAction: React.Dispatch<React.SetStateAction<ActivePage | null>>;
  calendarCategories: TCalendarCategory[];
  setCalendarCategories: React.Dispatch<React.SetStateAction<TCalendarCategory[]>>;
  calendarOrder: string[];
  setCalendarOrder: React.Dispatch<React.SetStateAction<string[]>>;
  calendarCategoryOrder: string[];
  setCalendarCategoryOrder: React.Dispatch<React.SetStateAction<string[]>>;
  hiddenInOverview: string[];
  setHiddenInOverview: React.Dispatch<React.SetStateAction<string[]>>;
  // FIX: Add state for Habit feature.
  habits: THabit[];
  setHabits: React.Dispatch<React.SetStateAction<THabit[]>>;
  habitLogs: THabitLog[];
  setHabitLogs: React.Dispatch<React.SetStateAction<THabitLog[]>>;
  habitCategories: THabitCategory[];
  setHabitCategories: React.Dispatch<React.SetStateAction<THabitCategory[]>>;
  // FIX: Add state for Finance feature.
  wallets: TWallet[];
  setWallets: React.Dispatch<React.SetStateAction<TWallet[]>>;
  transactions: TTransaction[];
  setTransactions: React.Dispatch<React.SetStateAction<TTransaction[]>>;
  financeCategories: TFinanceCategory[];
  setFinanceCategories: React.Dispatch<React.SetStateAction<TFinanceCategory[]>>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// --- TRANSLATION LOGIC ---
const translations: Record<Language, Record<string, any>> = {
  en: {
    nav: { notes: "Notes", todo: "Synced Tasks", calendar: "Calendar" },
    header: { notes: "Notes", todo: "Synced Tasks", calendar: "Multi Calendar", settings: "Settings", habit: "Tracked Habit", finance: "Clear Finance" },
    settings: { language: "Language", theme: "Theme", dark: "Dark", light: "Light", cute: "Cute", back: "Back to the App" },
    notes: { add: "Add New Note", filterTags: "Filter by tags...", titlePlaceholder: "Note Title...", save: "Save Note", delete: "Delete" },
    calendar: { add: "Add Event", manage: "Manage Calendar" },
    todo: { add: "Add New Task" },
    common: { save: "Save", delete: "Delete", cancel: "Cancel", create: "Create" }
  },
  id: {
    nav: { notes: "Catatan", todo: "Tugas Sinkron", calendar: "Kalender" },
    header: { notes: "Catatan", todo: "Tugas Sinkron", calendar: "Multi Kalender", settings: "Pengaturan", habit: "Pelacak Kebiasaan", finance: "Keuangan Jelas" },
    settings: { language: "Bahasa", theme: "Tema", dark: "Gelap", light: "Terang", cute: "Imut", back: "Kembali ke Aplikasi" },
    notes: { add: "Tambah Catatan Baru", filterTags: "Saring menurut tag...", titlePlaceholder: "Judul Catatan...", save: "Simpan Catatan", delete: "Hapus" },
    calendar: { add: "Tambah Acara", manage: "Kelola Kalender" },
    todo: { add: "Tambah Tugas Baru" },
    common: { save: "Simpan", delete: "Hapus", cancel: "Batal", create: "Buat" }
  },
  tlh: {
    nav: { notes: "ghItlh'e'", todo: "Qo'mey naDev", calendar: "DIvI'" },
    header: { notes: "ghItlh'e'", todo: "Qo'mey naDev", calendar: "Multi DIvI'", settings: "ghun'e'", habit: "yInroH tI'", finance: "ghoS lIj" },
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
  const [notes, setNotes] = useLocalStorage<TNote[]>('kairo-notes', []);
  const [tags, setTags] = useLocalStorage<TTag[]>('kairo-tags', []);
  const [folders, setFolders] = useLocalStorage<TFolder[]>('kairo-folders', [{id: 'uncategorized', name: 'Uncategorized'}]);
  
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isDataOpen, setIsDataOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [language, setLanguage] = useLocalStorage<Language>('kairo-language', 'en');
  const [theme, setTheme] = useLocalStorage<Theme>('kairo-theme', 'dark');
  
  const [activeAction, setActiveAction] = useState<ActivePage | null>(null);

  const [calendarCategories, setCalendarCategories] = useLocalStorage<TCalendarCategory[]>('kairo-calendarCategories', []);
  const [calendarOrder, setCalendarOrder] = useLocalStorage<string[]>('kairo-calendarOrder', []);
  const [calendarCategoryOrder, setCalendarCategoryOrder] = useLocalStorage<string[]>('kairo-calendarCategoryOrder', []);
  const [hiddenInOverview, setHiddenInOverview] = useLocalStorage<string[]>('kairo-hiddenInOverview', []);
  
  // FIX: Add state management for Habit and Finance features.
  const [habits, setHabits] = useLocalStorage<THabit[]>('kairo-habits', []);
  const [habitLogs, setHabitLogs] = useLocalStorage<THabitLog[]>('kairo-habit-logs', []);
  const [habitCategories, setHabitCategories] = useLocalStorage<THabitCategory[]>('kairo-habit-categories', [{id: 'health', name: 'Health'}, {id: 'productivity', name: 'Productivity'}]);
  const [wallets, setWallets] = useLocalStorage<TWallet[]>('kairo-wallets', [{id: 'overview', name: 'Overview', icon: 'fa-globe', color: '#f472b6'}, {id: 'cash', name: 'Cash', icon: 'fa-wallet', color: '#22d3ee'}]);
  const [transactions, setTransactions] = useLocalStorage<TTransaction[]>('kairo-transactions', []);
  const [financeCategories, setFinanceCategories] = useLocalStorage<TFinanceCategory[]>('kairo-finance-categories', [
    {id: 'food', name: 'Food', color: '#f87171', icon: 'fa-utensils', type: TransactionType.Expense},
    {id: 'transport', name: 'Transport', color: '#fb923c', icon: 'fa-bus', type: TransactionType.Expense},
    {id: 'salary', name: 'Salary', color: '#4ade80', icon: 'fa-sack-dollar', type: TransactionType.Income},
  ]);


  useEffect(() => {
    // This effect migrates notes from using calendarId to folderId.
    const isMigrated = localStorage.getItem('kairo-note-folder-migration-v1') === 'true';
    if (!isMigrated && notes.length > 0) {
        let hasChanges = false;
        const newFolders: TFolder[] = [...folders];
        const folderNameMap = new Map(newFolders.map(f => [f.name.toLowerCase(), f]));
        const calendarMap = new Map(calendars.map(c => [c.id, c]));

        const migratedNotes = notes.map(note => {
            // Check if note is in old format (has calendarId, lacks folderId)
            if ('calendarId' in note && !('folderId' in note)) {
                hasChanges = true;
                const calendar = calendarMap.get((note as any).calendarId);
                const folderName = calendar ? calendar.name : 'Uncategorized';
                let folder = folderNameMap.get(folderName.toLowerCase());

                if (!folder) {
                    folder = { id: Date.now().toString() + Math.random(), name: folderName };
                    newFolders.push(folder);
                    folderNameMap.set(folder.name.toLowerCase(), folder);
                }

                const { calendarId, ...restOfNote } = note as any;
                return { ...restOfNote, folderId: folder.id };
            }
            return note;
        });

        if (hasChanges) {
            console.log("Migrating notes to use folders...");
            if (newFolders.length > folders.length) {
                setFolders(newFolders);
            }
            setNotes(migratedNotes as TNote[]);
            localStorage.setItem('kairo-note-folder-migration-v1', 'true');
        }
    }
  }, [notes, calendars, folders, setNotes, setFolders]);

  useEffect(() => {
    // This effect migrates tasks to include createdAt and updatedAt fields for sorting.
    if (tasks.length > 0 && (!tasks[0].createdAt || !tasks[0].updatedAt)) {
        const now = new Date().toISOString();
        const migratedTasks = tasks.map(task => {
            // If either timestamp is missing, add them.
            if (!task.createdAt || !task.updatedAt) {
                return {
                    ...task,
                    createdAt: task.createdAt || now,
                    updatedAt: task.updatedAt || now,
                };
            }
            return task;
        });
        setTasks(migratedTasks);
    }
  }, [tasks, setTasks]);
  
  useEffect(() => {
    // This effect ensures calendarOrder is initialized and synchronized with the actual calendars.
    const userCalendarIds = calendars.filter(c => c.id !== 'overview').map(c => c.id);
    const orderSet = new Set(calendarOrder);
    const calendarIdSet = new Set(userCalendarIds);

    if (orderSet.size !== calendarIdSet.size || !userCalendarIds.every(id => orderSet.has(id))) {
      // Re-initialize order: keep existing order for known calendars, append new ones.
      const newOrder = calendarOrder.filter(id => calendarIdSet.has(id));
      userCalendarIds.forEach(id => {
        if (!newOrder.includes(id)) {
          newOrder.push(id);
        }
      });
      setCalendarOrder(newOrder);
    }
  }, [calendars, calendarOrder, setCalendarOrder]);
  
  useEffect(() => {
    // This effect ensures calendarCategoryOrder is initialized and synchronized with the actual categories.
    const categoryIds = calendarCategories.map(c => c.id);
    const orderSet = new Set(calendarCategoryOrder);
    const categoryIdSet = new Set(categoryIds);

    if (orderSet.size !== categoryIdSet.size || !categoryIds.every(id => orderSet.has(id))) {
      const newOrder = calendarCategoryOrder.filter(id => categoryIdSet.has(id));
      categoryIds.forEach(id => {
        if (!newOrder.includes(id)) {
          newOrder.push(id);
        }
      });
      setCalendarCategoryOrder(newOrder);
    }
  }, [calendarCategories, calendarCategoryOrder, setCalendarCategoryOrder]);


  useEffect(() => {
    document.documentElement.lang = language;
    document.body.setAttribute('data-theme', theme);
  }, [language, theme]);

  const value = {
    calendars, setCalendars,
    events, setEvents,
    tasks, setTasks,
    notes, setNotes,
    tags, setTags,
    folders, setFolders,
    isAboutOpen, setIsAboutOpen,
    isDataOpen, setIsDataOpen,
    isSettingsOpen, setIsSettingsOpen,
    language, setLanguage,
    theme, setTheme,
    activeAction, setActiveAction,
    calendarCategories, setCalendarCategories,
    calendarOrder, setCalendarOrder,
    calendarCategoryOrder, setCalendarCategoryOrder,
    hiddenInOverview, setHiddenInOverview,
    // FIX: Provide Habit and Finance state through the context.
    habits, setHabits,
    habitLogs, setHabitLogs,
    habitCategories, setHabitCategories,
    wallets, setWallets,
    transactions, setTransactions,
    financeCategories, setFinanceCategories,
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
