import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
// FIX: Import missing types for Habit and Finance features.
import { TCalendar, TEvent, TTask, TNote, TTag, TCalendarCategory, TFolder, THabit, THabitCategory, THabitLog, TWallet, TTransaction, TFinanceCategory, TransactionType } from '../types';
import { DEFAULT_CALENDARS } from '../constants';

// --- TYPES ---
export type Language = 'en' | 'id' | 'tlh';
export type Theme = 'dark' | 'light';
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
    header: { notes: "Notes", todo: "Synced Tasks", calendar: "Multi Calendar", settings: "Settings", habit: "Tracked Habit", finance: "Clear Finance", data: "Data", about: "About" },
    settings: { language: "Language", theme: "Theme", dark: "Dark", light: "Light", back: "Back to the App" },
    notes: { add: "Add New Note", filterTags: "Filter by tags...", titlePlaceholder: "Note Title...", save: "Save Note", delete: "Delete", allNotes: "All Notes", uncategorized: "Uncategorized", untitledNote: "Untitled Note", manageTags: "Manage Tags", manageFolders: "Manage Folders", newTagPlaceholder: "New tag name...", newFolderPlaceholder: "New folder name...", selectTagsPlaceholder: "Select tags...", confirmCancelTitle: "Unsaved Changes", confirmCancelMessage: "Discard changes?", confirmCancelDiscard: "Discard", confirmDeleteTitle: "Are you sure?", confirmDeleteMessage: "Permanently delete this note?", confirmDeleteConfirm: "Yes", insertLinkTitle: "Insert Link", insertLinkURL: "URL", insertLinkText: "Text to display", insertLinkPlaceholder: "Leave empty to use URL", insertLinkInsert: "Insert", drawingPadTitle: "Drawing Pad", drawingPadColor: "Color:", drawingPadSize: "Size:", drawingPadClear: "Clear", drawingPadSave: "Save Drawing", theme: "Theme", default: "Default" },
    todo: { add: "Add New Task", overview: "Overview", defaultGrouping: "Default Grouping", sortByDate: "Sort by Due Date", sortByName: "Sort by Name (A-Z)", sortByUrgency: "Sort by Urgency", sortByModified: "Sort by Last Modified", sortByCreated: "Sort by Date Created", pending: "Pending", completed: "Completed ({count})", generalTasks: "General Tasks", linkedTasks: "Linked Tasks", clearCompleted: "Clear completed tasks", confirmClearTitle: "Are you sure", confirmClearMessage: "Do you want to permanently delete all completed tasks?", confirmClearConfirm: "Yes", noUrgency: "No Urgency", lowUrgency: "Low", mediumUrgency: "Medium", highUrgency: "High", noCalendarSync: "No Calendar Sync", selectCalendarFirst: "Select a calendar first", noEvent: "No Event", eventDate: "Event Date", selectEvent: "Select Event", eventLinkHint: "Select a date to find and link an event. This won't change the task's due date.", confirmDeleteTaskTitle: "Are you sure?", confirmDeleteTaskMessage: "This action will permanently delete this task and cannot be undone." },
    calendar: { add: "Add Event", manage: "Manage Calendar", overview: "Overview", addCalendar: "Add New Calendar", eventsForDate: "Events for {date}", eventsForMonth: "Events for {month}", editEvent: "Edit Event", createEvent: "New Event", confirmDeleteRecurringTitle: "Delete Recurring Event", confirmSaveRecurringTitle: "Save Recurring Event", confirmUnsavedTitle: "Unsaved Changes", eventNamePlaceholder: "Event Name (Required)", descriptionPlaceholder: "Description (Optional)", repetition: "Repetition", doesNotRepeat: "Does not repeat", everyDay: "Every Day", everyWeek: "Every Week", everyMonth: "Every Month", everyYear: "Every Year", saveRecurringPrompt: "How would you like to save your changes?", saveThisOnly: "This event only", saveThisAndFuture: "This and following events", saveAllInSeries: "All events in series", deleteRecurringPrompt: "This is a recurring event. Which instances do you want to delete?", deleteThisOnly: "This event only", deleteThisAndFuture: "This and following events", deleteAllInSeries: "All events in series", confirmDeleteEventMessage: "Deleting an event will also remove any associated tasks.", confirmUnsavedMessage: "You have unsaved changes. Are you sure you want to discard them?", keepEditing: "Keep Editing", discard: "Discard", manageModalTitle: "Manage", newCategoryPlaceholder: "New category name", dragAndDropHint: "Drag and drop to reorder calendars and assign them to categories.", addCalendarNamePlaceholder: "Calendar Name (Required)", confirmDeleteCalendarMessage: "This will permanently delete the calendar and all its events. This action cannot be undone." },
    common: { save: "Save", delete: "Delete", cancel: "Cancel", create: "Create", yes: "Yes" },
    fab: { addNote: "Add Note", addTask: "Add Task", addEvent: "Add Event" }
  },
  id: {
    nav: { notes: "Catatan", todo: "Tugas Sinkron", calendar: "Kalender" },
    header: { notes: "Catatan", todo: "Tugas Sinkron", calendar: "Multi Kalender", settings: "Pengaturan", habit: "Pelacak Kebiasaan", finance: "Keuangan Jelas", data: "Data", about: "Tentang" },
    settings: { language: "Bahasa", theme: "Tema", dark: "Gelap", light: "Terang", back: "Kembali ke Aplikasi" },
    notes: { add: "Tambah Catatan Baru", filterTags: "Saring menurut tag...", titlePlaceholder: "Judul Catatan...", save: "Simpan Catatan", delete: "Hapus", allNotes: "Semua Catatan", uncategorized: "Tanpa Kategori", untitledNote: "Catatan Tanpa Judul", manageTags: "Kelola Tag", manageFolders: "Kelola Folder", newTagPlaceholder: "Nama tag baru...", newFolderPlaceholder: "Nama folder baru...", selectTagsPlaceholder: "Pilih tag...", confirmCancelTitle: "Perubahan Belum Disimpan", confirmCancelMessage: "Buang perubahan?", confirmCancelDiscard: "Buang", confirmDeleteTitle: "Anda yakin?", confirmDeleteMessage: "Hapus catatan ini secara permanen?", confirmDeleteConfirm: "Ya", insertLinkTitle: "Sisipkan Tautan", insertLinkURL: "URL", insertLinkText: "Teks untuk ditampilkan", insertLinkPlaceholder: "Biarkan kosong untuk menggunakan URL", insertLinkInsert: "Sisipkan", drawingPadTitle: "Kanvas Gambar", drawingPadColor: "Warna:", drawingPadSize: "Ukuran:", drawingPadClear: "Bersihkan", drawingPadSave: "Simpan Gambar", theme: "Tema", default: "Default" },
    todo: { add: "Tambah Tugas Baru", overview: "Gambaran Umum", defaultGrouping: "Pengelompokan Default", sortByDate: "Urutkan berdasarkan Tanggal", sortByName: "Urutkan berdasarkan Nama (A-Z)", sortByUrgency: "Urutkan berdasarkan Urgensi", sortByModified: "Urutkan berdasarkan Terakhir Diubah", sortByCreated: "Urutkan berdasarkan Tanggal Dibuat", pending: "Tertunda", completed: "Selesai ({count})", generalTasks: "Tugas Umum", linkedTasks: "Tugas Terkait", clearCompleted: "Hapus tugas yang selesai", confirmClearTitle: "Anda yakin", confirmClearMessage: "Apakah Anda ingin menghapus semua tugas yang telah selesai secara permanen?", confirmClearConfirm: "Ya", noUrgency: "Tanpa Urgensi", lowUrgency: "Rendah", mediumUrgency: "Sedang", highUrgency: "Tinggi", noCalendarSync: "Tidak Ada Sinkronisasi Kalender", selectCalendarFirst: "Pilih kalender terlebih dahulu", noEvent: "Tidak Ada Acara", eventDate: "Tanggal Acara", selectEvent: "Pilih Acara", eventLinkHint: "Pilih tanggal untuk mencari dan menautkan acara. Ini tidak akan mengubah tanggal jatuh tempo tugas.", confirmDeleteTaskTitle: "Anda yakin?", confirmDeleteTaskMessage: "Tindakan ini akan menghapus tugas ini secara permanen dan tidak dapat dibatalkan." },
    calendar: { add: "Tambah Acara", manage: "Kelola Kalender", overview: "Gambaran Umum", addCalendar: "Tambah Kalender Baru", eventsForDate: "Acara untuk {date}", eventsForMonth: "Acara untuk {month}", editEvent: "Edit Acara", createEvent: "Acara Baru", confirmDeleteRecurringTitle: "Hapus Acara Berulang", confirmSaveRecurringTitle: "Simpan Acara Berulang", confirmUnsavedTitle: "Perubahan Belum Disimpan", eventNamePlaceholder: "Nama Acara (Wajib)", descriptionPlaceholder: "Deskripsi (Opsional)", repetition: "Pengulangan", doesNotRepeat: "Tidak berulang", everyDay: "Setiap Hari", everyWeek: "Setiap Minggu", everyMonth: "Setiap Bulan", everyYear: "Setiap Tahun", saveRecurringPrompt: "Bagaimana Anda ingin menyimpan perubahan Anda?", saveThisOnly: "Hanya acara ini", saveThisAndFuture: "Acara ini dan selanjutnya", saveAllInSeries: "Semua acara dalam seri", deleteRecurringPrompt: "Ini adalah acara berulang. Instans mana yang ingin Anda hapus?", deleteThisOnly: "Hanya acara ini", deleteThisAndFuture: "Acara ini dan selanjutnya", deleteAllInSeries: "Semua acara dalam seri", confirmDeleteEventMessage: "Menghapus sebuah acara juga akan menghapus semua tugas yang terkait.", confirmUnsavedMessage: "Anda memiliki perubahan yang belum disimpan. Apakah Anda yakin ingin membuangnya?", keepEditing: "Tetap Mengedit", discard: "Buang", manageModalTitle: "Kelola", newCategoryPlaceholder: "Nama kategori baru", dragAndDropHint: "Seret dan lepas untuk menyusun ulang kalender dan menempatkannya ke dalam kategori.", addCalendarNamePlaceholder: "Nama Kalender (Wajib)", confirmDeleteCalendarMessage: "Ini akan menghapus kalender dan semua acaranya secara permanen. Tindakan ini tidak dapat dibatalkan." },
    common: { save: "Simpan", delete: "Hapus", cancel: "Batal", create: "Buat", yes: "Ya" },
    fab: { addNote: "Tambah Catatan", addTask: "Tambah Tugas", addEvent: "Tambah Acara" }
  },
  tlh: {
    nav: { notes: "ghItlh'e'", todo: "Qo'mey naDev", calendar: "DIvI'" },
    header: { notes: "ghItlh'e'", todo: "Qo'mey naDev", calendar: "Multi DIvI'", settings: "ghun'e'", habit: "yInroH tI'", finance: "ghoS lIj", data: "Data'", about: "paq" },
    settings: { language: "Hol", theme: "Tema'", dark: "qIj", light: "leS", back: "AppDaq jImev" },
    notes: { add: "ghItlh'e' chu' yaj", filterTags: "matlhvaD yuch...", titlePlaceholder: "ghItlh'e' mI'", save: "baS ghItlh'e'", delete: "Qaw'", allNotes: "ghItlh'e' Hoch", uncategorized: "categorizedbe'", untitledNote: "mI'be' ghItlh'e'", manageTags: "matlh vIH", manageFolders: "QI'lop vIH", newTagPlaceholder: "matlh mI' chu'...", newFolderPlaceholder: "QI'lop mI' chu'...", selectTagsPlaceholder: "matlhvaD yuch...", confirmCancelTitle: "baSbe'choH", confirmCancelMessage: "choH QaQbe'?", confirmCancelDiscard: "QaQbe'", confirmDeleteTitle: "Su'?", confirmDeleteMessage: "ghItlh'e'vam Qaw'bej?", confirmDeleteConfirm: "HIja'", insertLinkTitle: "mIw yaj", insertLinkURL: "URL", insertLinkText: "ghItlh mIw", insertLinkPlaceholder: "URLvamDaq, ghItlhbe'", insertLinkInsert: "yaj", drawingPadTitle: "DIr yor", drawingPadColor: "DIr:", drawingPadSize: "Har:", drawingPadClear: "chol", drawingPadSave: "baS DIr" },
    todo: { add: "Qo' chu' Doch", overview: "Hoch pIH", defaultGrouping: "HochHom", sortByDate: "DIvI'meyDaq yur", sortByName: "mI'meyDaq yur (A-Z)", sortByUrgency: "urgencyDaq yur", sortByModified: "choHta'Daq yur", sortByCreated: "yajta'Daq yur", pending: "pending", completed: "pItlh ({count})", generalTasks: "Qo'mey", linkedTasks: "Qo'mey mIw", clearCompleted: "pItlh Qo'mey Qaw'", confirmClearTitle: "Su'?", confirmClearMessage: "pItlh Qo'mey Hoch Qaw'bej?", confirmClearConfirm: "HIja'", noUrgency: "urgencybe'", lowUrgency: "mach", mediumUrgency: "raS", highUrgency: "HIgh", noCalendarSync: "DIvI' syncbe'", selectCalendarFirst: "DIvI' yaj", noEvent: "wanI'be'", eventDate: "wanI' DIvI'", selectEvent: "wanI' yaj", eventLinkHint: "wanI' yaj DIvI'vamDaq. Qo' due date choHbe'.", confirmDeleteTaskTitle: "Su'?", confirmDeleteTaskMessage: "Qo'vam Qaw'bej. choHlaHbe'." },
    calendar: { add: "wanI' Doch", manage: "DIvI' vIH", overview: "Hoch pIH", addCalendar: "DIvI' chu' Doch", eventsForDate: "wanI'mey {date}", eventsForMonth: "wanI'mey {month}", editEvent: "wanI' choH", createEvent: "wanI' chu'", confirmDeleteRecurringTitle: "Qaw' wanI'", confirmSaveRecurringTitle: "baS wanI'", confirmUnsavedTitle: "baSbe'choH", eventNamePlaceholder: "wanI' mI' (required)", descriptionPlaceholder: "paq (optional)", repetition: "repetition", doesNotRepeat: "repeatbe'", everyDay: "Hoch jaj", everyWeek: "Hoch rep", everyMonth: "Hoch jar", everyYear: "Hoch DIS", saveRecurringPrompt: "choHvam baS?", saveThisOnly: "wanI'vam", saveThisAndFuture: "wanI'vam 'ej future", saveAllInSeries: "Hoch wanI'mey", deleteRecurringPrompt: "wanI'vam repeat. Qaw'?", deleteThisOnly: "wanI'vam", deleteThisAndFuture: "wanI'vam 'ej future", deleteAllInSeries: "Hoch wanI'mey", confirmDeleteEventMessage: "wanI' Qaw'taH, Qo'mey Qaw'taH.", confirmUnsavedMessage: "baSbe'choH. QaQbe'?", keepEditing: "choHlI'", discard: "QaQbe'", manageModalTitle: "vIH", newCategoryPlaceholder: "category mI' chu'", dragAndDropHint: "yur DIvI'mey. categoryDaq yaj DIvI'mey.", addCalendarNamePlaceholder: "DIvI' mI' (required)", confirmDeleteCalendarMessage: "DIvI'vam 'ej wanI'mey Qaw'bej. choHlaHbe'." },
    common: { save: "baS", delete: "Qaw'", cancel: "qIl", create: "vI'", yes: "HIja'" },
    fab: { addNote: "ghItlh'e' Doch", addTask: "Qo' Doch", addEvent: "wanI' Doch" }
  }
};

const getTranslation = (lang: Language, key: string, params?: { [key: string]: string | number }): string => {
    const keys = key.split('.');
    let result: any = translations[lang];
    for (const k of keys) {
        result = result?.[k];
        if (result === undefined) {
            console.warn(`Translation key not found: ${key} for language ${lang}`);
            // Fallback to English
            let fallbackResult: any = translations['en'];
            for (const fk of keys) {
                fallbackResult = fallbackResult?.[fk];
            }
            result = fallbackResult || key;
            break;
        }
    }

    if (typeof result === 'string' && params) {
        Object.keys(params).forEach(paramKey => {
            result = result.replace(`{${paramKey}}`, String(params[paramKey]));
        });
    }

    return result;
};

export const useTranslation = () => {
    const { language } = useAppContext();
    return {
        t: (key: string, params?: { [key: string]: string | number }) => getTranslation(language, key, params),
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