import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext, useTranslation } from '../context/AppContext';
import { THabit, HabitType, THabitLog, THabitCategory } from '../types';
import Modal from '../components/Modal';
import Header from '../components/Header';
import { COLORS } from '../constants';
import { toYYYYMMDD, dateFromYYYYMMDD } from '../utils';
import CustomSelect from '../components/CustomSelect';

const getStartOfWeek = (date: Date): Date => {
    const d = new Date(date);
    d.setHours(0,0,0,0);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
};

const getWeekDays = (startDate: Date): Date[] => {
    return Array.from({ length: 7 }).map((_, i) => {
        const day = new Date(startDate);
        day.setDate(startDate.getDate() + i);
        return day;
    });
};

const LABEL_STYLE = "block text-sm font-medium text-slate-400 mb-1";


// --- Habit Archive View ---
const HabitArchiveView: React.FC<{
    habit: THabit;
    logs: THabitLog[];
    onBack: () => void;
    onEdit: (habit: THabit) => void;
    onDelete: (habitId: string) => void;
}> = ({ habit, logs, onBack, onEdit, onDelete }) => {
    const { lang } = useTranslation();
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);

    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    const startDate = new Date(startOfMonth);
    startDate.setDate(startDate.getDate() - startOfMonth.getDay());
    const endDate = new Date(endOfMonth);
    endDate.setDate(endDate.getDate() + (6 - endOfMonth.getDay()));

    const calendarDays: Date[] = [];
    let day = new Date(startDate);
    while (day <= endDate) {
        calendarDays.push(new Date(day));
        day.setDate(day.getDate() + 1);
    }
    
    const habitLogsForMonth = useMemo(() => {
        const map = new Map<string, number>();
        logs.forEach(log => {
            if (log.habitId === habit.id) {
                map.set(log.date, log.value);
            }
        });
        return map;
    }, [logs, habit.id]);

    const handlePrevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    const handleNextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

    const handleDeleteConfirm = () => {
        onDelete(habit.id);
    };

    return (
        <div className="animate-view-in">
            <Header titleKey="header.habit" />
            <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                    <button onClick={onBack} className="btn btn-secondary"><i className="fa-solid fa-arrow-left mr-2"></i>Back</button>
                    <div className="text-center">
                        <h2 className="text-xl font-bold" style={{color: habit.color}}>{habit.name}</h2>
                        <p className="text-sm" style={{color: 'var(--text-secondary)'}}>Monthly Archive</p>
                    </div>
                    <div className="flex gap-2">
                         <button onClick={() => onEdit(habit)} className="btn btn-secondary btn-icon" aria-label="Edit habit"><i className="fa-solid fa-pencil"></i></button>
                         <button onClick={() => setShowConfirmDelete(true)} className="btn btn-danger btn-icon" aria-label="Delete habit"><i className="fa-solid fa-trash"></i></button>
                    </div>
                </div>

                <div className="rounded-2xl p-4 shadow-lg" style={{backgroundColor: 'var(--bg-secondary)'}}>
                    <div className="flex justify-between items-center mb-4">
                        <button onClick={handlePrevMonth} className="btn btn-icon btn-secondary" aria-label="Previous month"><i className="fa-solid fa-chevron-left"></i></button>
                        <h3 className="text-lg font-bold">{currentMonth.toLocaleString(lang, { month: 'long', year: 'numeric' })}</h3>
                        <button onClick={handleNextMonth} className="btn btn-icon btn-secondary" aria-label="Next month"><i className="fa-solid fa-chevron-right"></i></button>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold mb-2" style={{color: 'var(--text-secondary)'}}>
                        {['S','M','T','W','T','F','S'].map(d => <div key={d}>{d}</div>)}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                        {calendarDays.map(date => {
                            const dateKey = toYYYYMMDD(date);
                            const logValue = habitLogsForMonth.get(dateKey);
                            const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
                            const opacity = isCurrentMonth ? 1 : 0.4;
                            const hasLog = logValue !== undefined;

                            let bgColor = 'transparent';
                            if (hasLog && habit.type === HabitType.YesNo) {
                                bgColor = habit.color;
                            } else if (hasLog && habit.type === HabitType.Number) {
                                bgColor = 'var(--bg-quaternary)';
                            }

                            return (
                                <div key={date.toString()} 
                                     className="aspect-square p-1 flex flex-col items-center justify-between rounded-lg transition-colors" 
                                     style={{ opacity, backgroundColor: bgColor }}
                                >
                                    <span className="self-end text-xs" style={{ color: (hasLog && habit.type === 'yes-no') ? 'var(--accent-text)' : 'var(--text-tertiary)' }}>
                                        {date.getDate()}
                                    </span>
                                    
                                    {hasLog && habit.type === HabitType.Number && (
                                        <span className="text-sm font-bold">
                                            {logValue}
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
            
            <Modal isOpen={showConfirmDelete} onClose={() => setShowConfirmDelete(false)} title="Are you sure?">
                <div className="text-center">
                    <p className="mb-4" style={{color: 'var(--text-secondary)'}}>
                        This will permanently delete this habit and all its logs. This action cannot be undone.
                    </p>
                    <div className="pt-2">
                        <button type="button" onClick={handleDeleteConfirm} className="w-full btn btn-danger">Yes</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};


// --- Habit Row Component ---
interface HabitRowProps {
    habit: THabit;
    week: Date[];
    logs: THabitLog[];
    onLogChange: (habitId: string, date: string, value: number | null) => void;
    onHabitClick: (habit: THabit) => void;
}

const HabitRow: React.FC<HabitRowProps> = ({ habit, week, logs, onLogChange, onHabitClick }) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return (
        <div className="flex gap-3 p-3 rounded-lg" style={{backgroundColor: 'var(--bg-tertiary)'}}>
            <div className="w-1.5 self-stretch shrink-0 rounded-full" style={{ backgroundColor: habit.color }}></div>
            <button className="flex-grow text-left" onClick={() => onHabitClick(habit)}>
                <p className="font-bold">{habit.name}</p>
                {habit.description && <p className="text-sm" style={{color: 'var(--text-secondary)'}}>{habit.description}</p>}
            </button>
            <div className="grid grid-cols-7 gap-1.5 text-center flex-shrink-0">
                {week.map(day => {
                    const dateKey = toYYYYMMDD(day);
                    const log = logs.find(l => l.habitId === habit.id && l.date === dateKey);
                    const isFuture = day > today;

                    if (habit.type === HabitType.YesNo) {
                        return (
                            <button
                                key={dateKey}
                                aria-label={`Log ${habit.name} for ${dateKey}`}
                                disabled={isFuture}
                                onClick={() => onLogChange(habit.id, dateKey, log ? null : 1)}
                                className={`w-8 h-8 rounded-lg transition-all transform ${isFuture ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}`}
                                style={{
                                    backgroundColor: log ? habit.color : 'var(--bg-quaternary)',
                                    opacity: log ? 1 : 0.7
                                }}
                            ></button>
                        );
                    }
                    if (habit.type === HabitType.Number) {
                        return (
                            <input
                                key={dateKey}
                                type="number"
                                min="0"
                                aria-label={`Log value for ${habit.name} on ${dateKey}`}
                                disabled={isFuture}
                                placeholder="-"
                                defaultValue={log?.value}
                                onBlur={(e) => {
                                    let value = e.target.value ? parseInt(e.target.value) : null;
                                    if (value !== null && value < 0) {
                                        value = 0;
                                        e.target.value = '0';
                                    }
                                    onLogChange(habit.id, dateKey, value)
                                }}
                                className="w-8 h-8 text-center rounded-md text-sm hide-arrows disabled:opacity-50"
                                style={{backgroundColor: 'var(--bg-quaternary)'}}
                            />
                        );
                    }
                    return null;
                })}
            </div>
        </div>
    )
};

// --- Habit Form Modal ---
interface HabitFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Partial<THabit>) => void;
    onDelete: (id: string) => void;
    initialData?: Partial<THabit>;
}

const HabitFormModal: React.FC<HabitFormModalProps> = ({ isOpen, onClose, onSave, onDelete, initialData }) => {
    const { habitCategories } = useAppContext();
    const [formData, setFormData] = useState<Partial<THabit>>({});
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);

    const isEditing = !!initialData?.id;

    // Effect 1: Initialize form data when the modal opens or a different habit is selected for editing.
    useEffect(() => {
        if (isOpen) {
            setFormData({
                name: '',
                description: '',
                type: HabitType.YesNo,
                color: COLORS[0],
                unit: '',
                // Set a default category, which will be overwritten by initialData if it exists.
                categoryId: habitCategories[0]?.id || '',
                ...initialData
            });
            setShowConfirmDelete(false);
        }
    }, [isOpen, initialData]); // Intentionally omitting habitCategories to prevent form reset on category changes.

    // Effect 2: Synchronize the category selection if the list of categories changes while the modal is open.
    useEffect(() => {
        if (isOpen) {
            setFormData(prev => {
                const categoryExists = habitCategories.some(c => c.id === prev.categoryId);
                if (!categoryExists) {
                    return { ...prev, categoryId: habitCategories[0]?.id || '' };
                }
                return prev;
            });
        }
    }, [isOpen, habitCategories]);


    const handleChange = (field: keyof Omit<THabit, 'id'>, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name?.trim() || !formData.categoryId) return;
        onSave(formData);
    };

    const handleDeleteConfirm = () => {
        if (formData.id) {
            onDelete(formData.id);
        }
    }

    const categoryOptions = habitCategories.map(c => ({ value: c.id, label: c.name }));
    const typeOptions = [
        { value: HabitType.YesNo, label: 'Checkbox' },
        { value: HabitType.Number, label: 'Unit' },
    ];

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={showConfirmDelete ? "Are you sure?" : (isEditing ? 'Edit Habit' : 'Add Habit')}>
             {showConfirmDelete ? (
                <div className="text-center">
                    <p className="mb-4" style={{color: 'var(--text-secondary)'}}>
                        This will permanently delete this habit and all its logs. This action cannot be undone.
                    </p>
                    <div className="pt-2">
                        <button type="button" onClick={handleDeleteConfirm} className="w-full btn btn-danger">Yes</button>
                    </div>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="habitName" className={LABEL_STYLE} style={{color: 'var(--text-secondary)'}}>Habit Name</label>
                        <input id="habitName" type="text" placeholder="e.g. Drink Water" value={formData.name || ''} onChange={e => handleChange('name', e.target.value)} className="form-input" required />
                    </div>
                    <div>
                        <label htmlFor="habitDesc" className={LABEL_STYLE} style={{color: 'var(--text-secondary)'}}>Description</label>
                        <textarea id="habitDesc" placeholder="(Optional)" value={formData.description || ''} onChange={e => handleChange('description', e.target.value)} className="form-input h-20 resize-none"></textarea>
                    </div>
                    <div>
                        <label className={LABEL_STYLE} style={{color: 'var(--text-secondary)'}}>Category</label>
                         <CustomSelect options={categoryOptions} value={formData.categoryId || ''} onChange={val => handleChange('categoryId', val)} />
                    </div>
                    <div>
                        <label className={LABEL_STYLE} style={{color: 'var(--text-secondary)'}}>Type</label>
                        <CustomSelect options={typeOptions} value={formData.type || ''} onChange={val => handleChange('type', val)} />
                    </div>
                    {formData.type === HabitType.Number && (
                         <div>
                            <label htmlFor="habitUnit" className={LABEL_STYLE} style={{color: 'var(--text-secondary)'}}>Unit</label>
                            <input id="habitUnit" type="text" placeholder="e.g. glasses, km, pages" value={formData.unit || ''} onChange={e => handleChange('unit', e.target.value)} className="form-input" />
                        </div>
                    )}
                    <div>
                        <label className={LABEL_STYLE} style={{color: 'var(--text-secondary)'}}>Color</label>
                        <div className="grid grid-cols-7 gap-2">
                            {COLORS.map(c => (
                                <button type="button" key={c} onClick={() => handleChange('color', c)} className={`w-7 h-7 rounded-full transition-all transform hover:scale-110 active:scale-95 ${formData.color === c ? 'ring-2 ring-offset-2 ring-[var(--accent-secondary)]' : ''}`} style={{ backgroundColor: c, '--tw-ring-offset-color': 'var(--bg-secondary)' } as React.CSSProperties}></button>
                            ))}
                        </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                        {isEditing && <button type="button" onClick={() => setShowConfirmDelete(true)} className="btn btn-danger btn-icon" aria-label="Delete"><i className="fa-solid fa-trash"></i></button>}
                        <button type="submit" className="flex-grow btn btn-primary">{isEditing ? 'Save Changes' : 'Save Habit'}</button>
                    </div>
                </form>
            )}
        </Modal>
    );
};


// --- Manage Categories Modal ---
interface ManageCategoriesModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ManageCategoriesModal: React.FC<ManageCategoriesModalProps> = ({ isOpen, onClose }) => {
    const { habitCategories, setHabitCategories, habits, setHabits, setHabitLogs } = useAppContext();
    const [newCategoryName, setNewCategoryName] = useState('');
    const [editingCategory, setEditingCategory] = useState<THabitCategory | null>(null);

    const handleAddCategory = (e: React.FormEvent) => {
        e.preventDefault();
        if (newCategoryName.trim()) {
            setHabitCategories(prev => [...prev, { id: Date.now().toString(), name: newCategoryName.trim() }]);
            setNewCategoryName('');
        }
    };
    
    const handleUpdateCategory = () => {
        if(editingCategory) {
            setHabitCategories(prev => prev.map(c => c.id === editingCategory.id ? editingCategory : c));
            setEditingCategory(null);
        }
    };

    const handleDeleteCategory = (id: string) => {
        if (window.confirm("Are you sure? Deleting a category will also delete all habits and logs within it.")) {
            const habitsToDelete = habits.filter(h => h.categoryId === id).map(h => h.id);
            setHabits(prev => prev.filter(h => h.categoryId !== id));
            setHabitLogs(prev => prev.filter(l => !habitsToDelete.includes(l.habitId)));
            setHabitCategories(prev => prev.filter(c => c.id !== id));
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Manage Categories">
            <div className="space-y-4">
                <form onSubmit={handleAddCategory} className="flex gap-2">
                    <input type="text" placeholder="New category name" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} className="form-input flex-grow" />
                    <button type="submit" className="btn btn-primary flex-shrink-0">Add</button>
                </form>
                <div className="max-h-60 overflow-y-auto space-y-2">
                    {habitCategories.map(cat => (
                        <div key={cat.id} className="flex items-center gap-2 p-2 rounded-md" style={{backgroundColor: 'var(--bg-tertiary)'}}>
                            {editingCategory?.id === cat.id ? (
                                <input 
                                    type="text" 
                                    value={editingCategory.name} 
                                    onChange={(e) => setEditingCategory({...editingCategory, name: e.target.value})}
                                    onBlur={handleUpdateCategory}
                                    onKeyDown={e => e.key === 'Enter' && handleUpdateCategory()}
                                    className="form-input flex-grow" 
                                    autoFocus
                                />
                            ) : (
                                <span className="flex-grow">{cat.name}</span>
                            )}
                            <button onClick={() => setEditingCategory(cat)} className="btn btn-secondary btn-icon"><i className="fa-solid fa-pencil"></i></button>
                            <button onClick={() => handleDeleteCategory(cat.id)} className="btn btn-danger btn-icon"><i className="fa-solid fa-trash"></i></button>
                        </div>
                    ))}
                </div>
            </div>
        </Modal>
    );
};

// --- Main Page Component ---
function HabitPage() {
    const { habits, setHabits, habitLogs, setHabitLogs, habitCategories, activeAction, setActiveAction } = useAppContext();
    const { lang } = useTranslation();

    const [view, setView] = useState<'list' | 'archive'>('list');
    const [selectedHabit, setSelectedHabit] = useState<THabit | null>(null);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isManageModalOpen, setIsManageModalOpen] = useState(false);
    const [editingHabit, setEditingHabit] = useState<THabit | null>(null);

    const weekStart = getStartOfWeek(currentDate);
    const weekDays = getWeekDays(weekStart);
    
    const openAddHabitModal = () => {
        setEditingHabit(null);
        setIsFormModalOpen(true);
    };

    useEffect(() => {
        if (activeAction === 'habit') {
          openAddHabitModal();
          setActiveAction(null);
        }
      }, [activeAction, setActiveAction]);

    const handlePrevWeek = () => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() - 7)));
    const handleNextWeek = () => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() + 7)));

    const groupedHabits = useMemo(() => {
        const groups: { [catId: string]: { category: THabitCategory, habits: THabit[] } } = {};
        habitCategories.forEach(cat => {
            if (cat) groups[cat.id] = { category: cat, habits: [] }
        });
        habits.forEach(habit => {
            if (habit && groups[habit.categoryId]) {
                groups[habit.categoryId].habits.push(habit);
            }
        });
        return Object.values(groups).filter(g => g.habits.length > 0);
    }, [habits, habitCategories]);

    const handleLogChange = (habitId: string, date: string, value: number | null) => {
        setHabitLogs(prev => {
            const existingLogIndex = prev.findIndex(l => l.habitId === habitId && l.date === date);
            if (value === null || value === undefined || (typeof value === 'string' && value === '')) { // Delete log
                return prev.filter((_, index) => index !== existingLogIndex);
            }
            if (existingLogIndex > -1) { // Update log
                const newLogs = [...prev];
                newLogs[existingLogIndex] = { ...newLogs[existingLogIndex], value: Number(value) };
                return newLogs;
            } else { // Create log
                const newLog: THabitLog = { id: Date.now().toString(), habitId, date, value: Number(value) };
                return [...prev, newLog];
            }
        });
    };

    const handleSaveHabit = (habitData: Partial<THabit>) => {
        if (habitData.id) { // Editing
            setHabits(prev => prev.map(h => h.id === habitData.id ? { ...h, ...habitData } as THabit : h));
        } else { // Adding
            if (!habitData.categoryId) return; // Should not happen
            const newHabit: THabit = {
                name: 'Untitled Habit',
                description: '',
                type: HabitType.YesNo,
                color: COLORS[0],
                ...habitData,
                id: Date.now().toString(),
            } as THabit;
            setHabits(prev => [...prev, newHabit]);
        }
        setIsFormModalOpen(false);
    };

    const handleDeleteHabit = (habitId: string) => {
        setHabits(prev => prev.filter(h => h.id !== habitId));
        setHabitLogs(prev => prev.filter(l => l.habitId !== habitId));
        setIsFormModalOpen(false);
        setView('list');
        setSelectedHabit(null);
    };
    
    const openEditHabitModal = (habit: THabit) => {
        setEditingHabit(habit);
        setIsFormModalOpen(true);
    };
    
    const openArchiveView = (habit: THabit) => {
        setSelectedHabit(habit);
        setView('archive');
    };

    return (
        <div>
            {view === 'list' && (
                <>
                    <Header titleKey="header.habit" />
                    <div className="p-4 space-y-4">
                        {/* Week Navigator */}
                        <div className="rounded-2xl p-3 shadow-lg flex justify-between items-center" style={{backgroundColor: 'var(--bg-secondary)'}}>
                            <button onClick={handlePrevWeek} className="btn btn-icon btn-secondary" aria-label="Previous week"><i className="fa-solid fa-chevron-left"></i></button>
                            <div className="text-center">
                                <p className="font-bold text-lg">{weekStart.toLocaleString(lang, { month: 'short', day: 'numeric' })} - {weekDays[6].toLocaleString(lang, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                            </div>
                            <button onClick={handleNextWeek} className="btn btn-icon btn-secondary" aria-label="Next week"><i className="fa-solid fa-chevron-right"></i></button>
                        </div>

                         {/* Action Buttons */}
                         <div className="flex gap-2">
                            <button onClick={openAddHabitModal} className="flex-grow btn btn-primary" disabled={habitCategories.length === 0}>
                                <i className="fa-solid fa-plus mr-2"></i>
                                {habitCategories.length === 0 ? "Create category first" : "Add Habit"}
                            </button>
                             <button onClick={() => setIsManageModalOpen(true)} className="btn btn-secondary flex-shrink-0 px-4" aria-label="Manage Categories">
                                <i className="fa-solid fa-gear"></i>
                            </button>
                        </div>

                        {/* Weekday headers and Habit List */}
                        {habits.length === 0 ? (
                            <div className="text-center py-10 rounded-lg mt-4" style={{backgroundColor: 'var(--bg-secondary)'}}>
                                <i className="fa-solid fa-repeat text-4xl mb-3" style={{color: 'var(--text-tertiary)'}}></i>
                                <p style={{color: 'var(--text-secondary)'}}>No habits yet. Let's build some!</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex gap-3 px-3">
                                   <div className="w-1.5 shrink-0" />
                                   <div className="flex-grow" />
                                   <div className="grid grid-cols-7 gap-1.5 text-center flex-shrink-0">
                                       {weekDays.map(day => (
                                           <div key={day.toISOString()} className="w-8">
                                               <p className="text-xs" style={{color: 'var(--text-tertiary)'}}>{day.toLocaleString(lang, { weekday: 'short' })}</p>
                                               <p className="font-bold">{day.getDate()}</p>
                                           </div>
                                       ))}
                                   </div>
                                </div>

                                {groupedHabits.map(({ category, habits: categoryHabits }) => (
                                    <div key={category.id}>
                                        <h3 className="font-bold text-lg mb-2" style={{color: 'var(--text-primary)'}}>{category.name}</h3>
                                        <div className="space-y-2">
                                            {categoryHabits.map(habit => (
                                                <HabitRow 
                                                    key={habit.id}
                                                    habit={habit}
                                                    week={weekDays}
                                                    logs={habitLogs}
                                                    onLogChange={handleLogChange}
                                                    onHabitClick={openArchiveView}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}

            {view === 'archive' && selectedHabit && (
                <HabitArchiveView
                    habit={selectedHabit}
                    logs={habitLogs}
                    onBack={() => setView('list')}
                    onEdit={openEditHabitModal}
                    onDelete={handleDeleteHabit}
                />
            )}
            
            <HabitFormModal 
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                onSave={handleSaveHabit}
                onDelete={handleDeleteHabit}
                initialData={editingHabit || { categoryId: habitCategories[0]?.id }}
            />
            
            <ManageCategoriesModal
                isOpen={isManageModalOpen}
                onClose={() => setIsManageModalOpen(false)}
            />
        </div>
    );
}

export default HabitPage;