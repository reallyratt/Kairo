import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useAppContext, useTranslation } from '../context/AppContext';
import { TEvent, TCalendar, TCalendarCategory } from '../types';
import Modal from '../components/Modal';
import Header from '../components/Header';
import { COLORS } from '../constants';
import CustomSelect from '../components/CustomSelect';
import { toYYYYMMDD, dateFromYYYYMMDD } from '../utils';

const LABEL_STYLE = "block text-sm font-medium text-slate-400 mb-1";
type RepetitionType = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
type EditScope = 'single' | 'future' | 'all';

// --- Add/Edit Event Modal ---
interface EventFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: Partial<TEvent>, instruction: RepetitionType | EditScope) => void;
  onDelete: (eventId: string, scope: EditScope) => void;
  initialData?: Partial<TEvent>;
  activeCalendarId: string;
}

const EventFormModal: React.FC<EventFormModalProps> = ({ isOpen, onClose, onSave, onDelete, initialData, activeCalendarId }) => {
  type View = 'form' | 'confirm_delete' | 'confirm_close' | 'confirm_save';
  const { calendars, calendarCategories, calendarOrder, calendarCategoryOrder } = useAppContext();
  const { lang } = useTranslation();
  const [formData, setFormData] = useState<Partial<TEvent>>({});
  const [repetition, setRepetition] = useState<RepetitionType>('none');
  const [view, setView] = useState<View>('form');
  const [animationClass, setAnimationClass] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const initialFormData = useRef<Partial<TEvent>>({});
  const animationTimer = useRef<number | null>(null);

  const isEditing = !!initialData?.id;
  const isRecurring = !!initialData?.seriesId;

  const changeView = (newView: View) => {
    if (view === newView) return;
    setAnimationClass('animate-view-out');
    animationTimer.current = window.setTimeout(() => {
        setView(newView);
        setAnimationClass('animate-view-in');
    }, 150); // Match animation duration
  };

  useEffect(() => {
    if (isOpen) {
      const defaultStartTime = new Date();
      const defaultEndTime = new Date(defaultStartTime.getTime() + 60 * 60 * 1000);
      const formatTime = (date: Date) => `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
      const firstCalendarId = calendars.find(c => c.id !== 'overview')?.id || '';

      const data = {
        name: '',
        description: '',
        date: toYYYYMMDD(new Date()),
        startTime: formatTime(defaultStartTime),
        endTime: formatTime(defaultEndTime),
        color: COLORS[0],
        ...initialData,
        calendarId: initialData?.calendarId || (activeCalendarId === 'overview' ? firstCalendarId : activeCalendarId),
      };
      
      setFormData(data);
      initialFormData.current = data;
      setRepetition('none');
      setView('form');
      setAnimationClass('animate-view-in');
      setErrors({});
    }
    return () => {
        if(animationTimer.current) clearTimeout(animationTimer.current);
    }
  }, [isOpen, initialData, activeCalendarId, calendars]);

  useEffect(() => {
    if (formData.startTime && formData.endTime) {
        if (formData.endTime <= formData.startTime) {
            setErrors(prev => ({ ...prev, time: 'End time must be after start time.' }));
        } else {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.time;
                return newErrors;
            });
        }
    }
  }, [formData.startTime, formData.endTime]);


  const handleChange = (field: keyof Omit<TEvent, 'id'> | 'calendarId', value: string) => {
    if (errors[field as keyof typeof errors]) {
        setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[field as keyof typeof errors];
            return newErrors;
        });
    }

    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      if (field === 'startTime') {
        const [hours, minutes] = value.split(':').map(Number);
        if (!isNaN(hours) && !isNaN(minutes)) {
          const startTimeDate = new Date();
          startTimeDate.setHours(hours, minutes, 0, 0);
          startTimeDate.setHours(startTimeDate.getHours() + 1);
          const endHours = startTimeDate.getHours().toString().padStart(2, '0');
          const endMinutes = startTimeDate.getMinutes().toString().padStart(2, '0');
          newData.endTime = `${endHours}:${endMinutes}`;
        }
      }
      return newData;
    });
  };

  const hasChanges = JSON.stringify(formData) !== JSON.stringify(initialFormData.current) || (repetition !== 'none' && !isEditing);

  const handleCloseAttempt = () => {
    if (hasChanges && view === 'form') {
      changeView('confirm_close');
    } else {
      onClose();
    }
  };

  const validateOnSubmit = (): boolean => {
    const newErrors: { [key: string]: string } = { ...errors };
    if (!formData.name?.trim()) newErrors.name = 'Event name is required.';
    if (!isEditing && !formData.calendarId) newErrors.calendarId = 'Please select a calendar.';
    if (!formData.date) newErrors.date = 'Date is required.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateOnSubmit()) return;

    if (isEditing && isRecurring) {
        changeView('confirm_save');
    } else {
        onSave(formData, isEditing ? 'single' : repetition);
    }
  };

  const handleSaveWithScope = (scope: EditScope) => {
    onSave(formData, scope);
  };

  const handleDelete = (scope: EditScope) => {
    if (formData.id) {
      onDelete(formData.id, scope);
    }
  };
  
  const getTitle = () => {
    switch(view) {
        case 'confirm_delete': return isRecurring ? 'Delete Recurring Event' : 'Are you sure?';
        case 'confirm_close': return 'Unsaved Changes';
        case 'confirm_save': return 'Save Recurring Event';
        case 'form':
        default: return isEditing ? 'Edit Event' : 'Create New Event';
    }
  }

  const repetitionOptions = [
    { value: 'none', label: 'Does not repeat' },
    { value: 'daily', label: 'Every Day' },
    { value: 'weekly', label: 'Every Week' },
    { value: 'monthly', label: 'Every Month' },
    { value: 'yearly', label: 'Every Year' },
  ];
  
  const calendarOptions = useMemo(() => {
    const options: any[] = [];
    const userCalendars = calendars.filter(c => c.id !== 'overview');
    
    const sortedCalendars = calendarOrder
        .map(id => userCalendars.find(c => c.id === id))
        .filter((c): c is TCalendar => !!c);
    
    const categorized = new Map<string, TCalendar[]>();
    const uncategorized: TCalendar[] = [];

    sortedCalendars.forEach(cal => {
        if (cal.categoryId && calendarCategories.find(cat => cat.id === cal.categoryId)) {
            if (!categorized.has(cal.categoryId)) {
                categorized.set(cal.categoryId, []);
            }
            categorized.get(cal.categoryId)!.push(cal);
        } else {
            uncategorized.push(cal);
        }
    });
    
    uncategorized.forEach(cal => options.push({ value: cal.id, label: cal.name }));
    
    if (uncategorized.length > 0 && categorized.size > 0) {
        options.push({ isHeader: true, label: ' ' }); 
    }

    calendarCategoryOrder.forEach(catId => {
        const cat = calendarCategories.find(c => c.id === catId);
        if (cat) {
            const cals = categorized.get(cat.id);
            if (cals && cals.length > 0) {
                options.push({ isHeader: true, label: cat.name });
                cals.forEach(cal => options.push({ value: cal.id, label: cal.name }));
            }
        }
    });

    return options;
  }, [calendars, calendarOrder, calendarCategories, calendarCategoryOrder]);

  return (
    <Modal isOpen={isOpen} onClose={handleCloseAttempt} title={getTitle()}>
      <div className={animationClass}>
        {view === 'form' && (
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {!isEditing && (
                <div className="flex items-center gap-3">
                    <i className="fa-solid fa-folder-open w-6 text-center text-lg" style={{color: 'var(--text-secondary)'}}></i>
                    <div className="flex-grow">
                        <CustomSelect
                            options={calendarOptions}
                            value={formData.calendarId || ''}
                            onChange={val => handleChange('calendarId', val)}
                        />
                        {errors.calendarId && <p className="text-xs mt-1" style={{color: 'var(--danger-primary)'}}>{errors.calendarId}</p>}
                    </div>
                </div>
            )}
            <div className="flex items-center gap-3">
                <i className="fa-solid fa-pen-nib w-6 text-center text-lg" style={{color: 'var(--text-secondary)'}}></i>
                <div className="flex-grow">
                    <input id="eventName" type="text" placeholder="Event Name (Required)" value={formData.name || ''} onChange={e => handleChange('name', e.target.value)} className="form-input" required />
                    {errors.name && <p className="text-xs mt-1" style={{color: 'var(--danger-primary)'}}>{errors.name}</p>}
                </div>
            </div>
             <div className="flex items-start gap-3">
                <i className="fa-solid fa-paragraph w-6 text-center text-lg pt-2" style={{color: 'var(--text-secondary)'}}></i>
                <div className="flex-grow">
                    <textarea id="description" placeholder="Description (Optional)" value={formData.description || ''} onChange={e => handleChange('description', e.target.value)} className="form-input h-24 resize-none"></textarea>
                </div>
            </div>
             <div className="flex items-center gap-3">
                <i className="fa-solid fa-clock w-6 text-center text-lg" style={{color: 'var(--text-secondary)'}}></i>
                <div className="flex-grow">
                    <div className="grid grid-cols-2 gap-4">
                        <input id="startTime" type="time" title="Start Time" value={formData.startTime || ''} onChange={e => handleChange('startTime', e.target.value)} className="form-input" required />
                        <input id="endTime" type="time" title="End Time" value={formData.endTime || ''} onChange={e => handleChange('endTime', e.target.value)} className="form-input" required />
                    </div>
                    {errors.time && <p className="text-xs mt-1" style={{color: 'var(--danger-primary)'}}>{errors.time}</p>}
                </div>
            </div>
             <div className="flex items-center gap-3">
                <i className="fa-solid fa-calendar-day w-6 text-center text-lg" style={{color: 'var(--text-secondary)'}}></i>
                <div className="flex-grow">
                    <input id="eventDate" type="date" title="Event Date" value={formData.date || ''} onChange={e => handleChange('date', e.target.value)} className="form-input" required />
                    {errors.date && <p className="text-xs mt-1" style={{color: 'var(--danger-primary)'}}>{errors.date}</p>}
                </div>
            </div>
            <div className={`transition-all duration-300 ease-in-out ${isEditing ? 'max-h-0 opacity-0 overflow-hidden' : 'max-h-40 opacity-100'}`}>
              <div className="flex items-center gap-3">
                  <i className="fa-solid fa-repeat w-6 text-center text-lg" style={{color: 'var(--text-secondary)'}}></i>
                  <div className="flex-grow">
                    <CustomSelect options={repetitionOptions} value={repetition} onChange={(v) => setRepetition(v as RepetitionType)} />
                  </div>
              </div>
            </div>
             <div className="flex items-start gap-3">
                <i className="fa-solid fa-palette w-6 text-center text-lg pt-1" style={{color: 'var(--text-secondary)'}}></i>
                <div className="flex-grow">
                    <div className="grid grid-cols-7 gap-2">
                        {COLORS.map(c => (
                            <button type="button" key={c} onClick={() => handleChange('color', c)} className={`w-7 h-7 rounded-full transition-all transform hover:scale-110 active:scale-95 ${formData.color === c ? 'ring-2 ring-offset-2 ring-white' : ''}`} style={{ backgroundColor: c, '--tw-ring-offset-color': 'var(--bg-secondary)' } as React.CSSProperties}></button>
                        ))}
                    </div>
                </div>
            </div>
            <div className="flex gap-2 pt-2">
              {isEditing && (
                  <button type="button" onClick={() => changeView('confirm_delete')} className="btn btn-danger btn-icon" aria-label="Delete"><i className="fa-solid fa-trash"></i></button>
              )}
              <button type="submit" className="flex-grow btn btn-primary"><i className="fa-solid fa-check text-lg"></i></button>
            </div>
          </form>
        )}

        {view === 'confirm_save' && (
          <div className="space-y-4">
            <p className="text-slate-300 mb-4 text-center" style={{color: 'var(--text-secondary)'}}>How would you like to save your changes?</p>
            <div className="space-y-2">
              <button type="button" onClick={() => handleSaveWithScope('single')} className="w-full btn btn-secondary">This event only</button>
              <button type="button" onClick={() => handleSaveWithScope('future')} className="w-full btn btn-secondary">This and following events</button>
              <button type="button" onClick={() => handleSaveWithScope('all')} className="w-full btn btn-secondary">All events in series</button>
            </div>
          </div>
        )}

        {view === 'confirm_delete' && (
          <div className="space-y-4">
              {isRecurring ? (
                  <div>
                      <p className="text-slate-300 mb-4 text-center" style={{color: 'var(--text-secondary)'}}>This is a recurring event. Which instances do you want to delete?</p>
                      <div className="space-y-2">
                          <button type="button" onClick={() => handleDelete('single')} className="w-full btn btn-secondary">This event only</button>
                          <button type="button" onClick={() => handleDelete('future')} className="w-full btn btn-secondary">This and following events</button>
                          <button type="button" onClick={() => handleDelete('all')} className="w-full btn btn-secondary">All events in series</button>
                      </div>
                  </div>
              ) : (
                  <div className="text-center">
                      <p className="text-slate-300" style={{color: 'var(--text-secondary)'}}>Deleting an event will also remove any associated tasks.</p>
                      <div className="pt-4">
                          <button type="button" onClick={() => handleDelete('single')} className="w-full btn btn-danger">Yes</button>
                      </div>
                  </div>
              )}
          </div>
        )}

        {view === 'confirm_close' && (
          <div className="space-y-4 text-center">
              <p className="text-slate-300" style={{color: 'var(--text-secondary)'}}>You have unsaved changes. Are you sure you want to discard them?</p>
              <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => changeView('form')} className="flex-1 btn btn-secondary">Keep Editing</button>
                  <button type="button" onClick={onClose} className="flex-1 btn btn-danger">Discard</button>
              </div>
          </div>
        )}
      </div>
    </Modal>
  )
};

// --- Unified Management Modal ---
type ManagedItem = {
    id: string;
    type: 'category' | 'calendar';
    data: TCalendarCategory | TCalendar;
};
const ManageModal: React.FC<{isOpen: boolean, onClose: () => void;}> = ({ isOpen, onClose }) => {
    const {
        calendars, setCalendars,
        calendarCategories, setCalendarCategories,
        calendarOrder, setCalendarOrder,
        calendarCategoryOrder, setCalendarCategoryOrder,
        hiddenInOverview, setHiddenInOverview
    } = useAppContext();
    
    const [managedItems, setManagedItems] = useState<ManagedItem[]>([]);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [categoryError, setCategoryError] = useState('');
    const [editingCategory, setEditingCategory] = useState<TCalendarCategory | null>(null);
    const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
    
    const [isDraggingCalendar, setIsDraggingCalendar] = useState(false);

    const draggedItemIndex = useRef<number | null>(null);

    // Build the unified list for management
    useEffect(() => {
        if (!isOpen) return;

        setNewCategoryName('');
        setCategoryError('');
        setEditingCategory(null);

        const finalRenderList: ManagedItem[] = [];
        const calendarMap = new Map(calendars.map(c => [c.id, c]));

        const calendarsToRender = calendarOrder
            .map(id => calendarMap.get(id))
            .filter((c): c is TCalendar => !!c && c.id !== 'overview');

        const calendarsByCat = new Map<string, TCalendar[]>();
        const uncategorized: TCalendar[] = [];

        for (const cal of calendarsToRender) {
            const categoryExists = cal.categoryId && calendarCategories.some(cat => cat.id === cal.categoryId);
            if (cal.categoryId && categoryExists) {
                if (!calendarsByCat.has(cal.categoryId)) {
                    calendarsByCat.set(cal.categoryId, []);
                }
                calendarsByCat.get(cal.categoryId)!.push(cal);
            } else {
                uncategorized.push(cal);
            }
        }
        
        // Add uncategorized calendars first to display them at the top
        uncategorized.forEach(cal => {
            finalRenderList.push({ id: cal.id, type: 'calendar', data: cal });
        });

        const categoryMap = new Map(calendarCategories.map(c => [c.id, c]));
        calendarCategoryOrder.forEach(catId => {
            const category = categoryMap.get(catId);
            if (category) {
                finalRenderList.push({ id: category.id, type: 'category', data: category });
                const cals = calendarsByCat.get(catId) || [];
                cals.forEach(cal => {
                    finalRenderList.push({ id: cal.id, type: 'calendar', data: cal });
                });
            }
        });

        setManagedItems(finalRenderList);
    }, [isOpen, calendars, calendarCategories, calendarOrder, calendarCategoryOrder]);

    const updateGlobalState = (items: ManagedItem[]) => {
        const newCalendarOrder: string[] = [];
        const newCategoryOrder: string[] = [];
        const updatedCalendars = [...calendars];

        let currentCategoryId: string | undefined = undefined;

        items.forEach(item => {
            if (item.type === 'category') {
                currentCategoryId = item.id;
                newCategoryOrder.push(item.id);
            } else {
                newCalendarOrder.push(item.id);
                const calIndex = updatedCalendars.findIndex(c => c.id === item.id);
                if (calIndex > -1) {
                    updatedCalendars[calIndex].categoryId = currentCategoryId;
                }
            }
        });

        setCalendarOrder(newCalendarOrder);
        setCalendarCategoryOrder(newCategoryOrder);
        setCalendars(updatedCalendars);
    };
    
    const handleAddCategory = (e: React.FormEvent) => {
        e.preventDefault();
        if (newCategoryName.trim()) {
            const newCat = { id: Date.now().toString(), name: newCategoryName.trim() };
            setCalendarCategories(prev => [...prev, newCat]);
            setCalendarCategoryOrder(prev => [newCat.id, ...prev]);
            setNewCategoryName('');
            setCategoryError('');
        } else {
            setCategoryError('Category name cannot be empty.');
        }
    };

    const handleUpdateCategory = () => {
        if (editingCategory && editingCategory.name.trim()) {
            setCalendarCategories(prev => prev.map(c => c.id === editingCategory.id ? { ...c, name: editingCategory.name.trim() } : c));
            setEditingCategory(null);
        } else {
            setEditingCategory(null); // Cancel edit if name is empty
        }
    };
    
    const handleDeleteCategory = (id: string) => {
        setCalendarCategories(prev => prev.filter(c => c.id !== id));
        setCalendars(prev => prev.map(cal => cal.categoryId === id ? { ...cal, categoryId: undefined } : cal));
    };
    
    const handleVisibilityToggle = (calendarId: string) => {
        setHiddenInOverview(prev => 
            prev.includes(calendarId) 
                ? prev.filter(id => id !== calendarId) 
                : [...prev, calendarId]
        );
    };
    
    const handleDragStart = (e: React.DragEvent, index: number) => {
        const item = managedItems[index];
        draggedItemIndex.current = index;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', item.id);
    
        setTimeout(() => {
            setDraggedItemId(item.id);
            if (item.type === 'calendar') {
                setIsDraggingCalendar(true);
            }
        }, 0);
    };

    const handleDrop = (e: React.DragEvent, dropIndex: number) => {
        e.preventDefault();
        const dragIndex = draggedItemIndex.current;
        
        if (dragIndex === null || dragIndex === dropIndex) return;

        const listCopy = [...managedItems];
        const draggedItem = listCopy[dragIndex];

        const dropItem = listCopy[dropIndex];
        const isDropTargetUncategorized = dropItem.type === 'calendar' && !calendars.find(c => c.id === dropItem.id)?.categoryId;
        if (draggedItem.type === 'category' && isDropTargetUncategorized) return;

        listCopy.splice(dragIndex, 1);
        listCopy.splice(dropIndex, 0, draggedItem);
        
        updateGlobalState(listCopy);
    };

    const handleUncategorizeDrop = (e: React.DragEvent) => {
        e.preventDefault();
        if (draggedItemIndex.current === null) return;
    
        const listCopy = [...managedItems];
        const [draggedItemContent] = listCopy.splice(draggedItemIndex.current, 1);
    
        if (draggedItemContent.type === 'calendar') {
            listCopy.unshift(draggedItemContent);
            updateGlobalState(listCopy);
        }
    };

    const handleDragEnd = () => {
        setDraggedItemId(null);
        draggedItemIndex.current = null;
        setIsDraggingCalendar(false);
    };
    
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Manage">
            <div 
                className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 rounded-lg transition-all"
                onDragOver={isDraggingCalendar ? handleDragOver : undefined}
                onDrop={isDraggingCalendar ? handleUncategorizeDrop : undefined}
            >
                <form onSubmit={handleAddCategory} className="flex gap-2">
                    <div className="flex-grow relative flex items-center">
                        <i className="fa-solid fa-folder-plus absolute left-3 text-lg pointer-events-none" style={{color: 'var(--text-tertiary)'}}></i>
                        <input type="text" placeholder="New category name" value={newCategoryName} onChange={e => { setNewCategoryName(e.target.value); if(categoryError) setCategoryError(''); }} className="form-input flex-grow pl-10" />
                    </div>
                    <button type="submit" className="btn btn-primary btn-icon flex-shrink-0" aria-label="Add Category"><i className="fa-solid fa-plus"></i></button>
                </form>
                {categoryError && <p className="text-xs mt-1" style={{color: 'var(--danger-primary)'}}>{categoryError}</p>}

                <p className="text-xs" style={{color: 'var(--text-secondary)'}}>Drag and drop to reorder calendars and assign them to categories.</p>

                <div className="space-y-2">
                    {managedItems.map((item, index) => {
                        const isBeingDragged = draggedItemId === item.id;
                        if (item.type === 'category') {
                            const category = item.data as TCalendarCategory;
                            return (
                                <div 
                                    key={category.id} 
                                    className={`flex items-center gap-2 p-2 rounded-md cursor-grab active:cursor-grabbing ${isBeingDragged ? 'dragging' : ''}`}
                                    style={{backgroundColor: 'var(--bg-tertiary)'}}
                                    draggable
                                    onDragStart={e => handleDragStart(e, index)}
                                    onDragOver={handleDragOver}
                                    onDrop={e => { e.stopPropagation(); handleDrop(e, index); }}
                                    onDragEnd={handleDragEnd}
                                >
                                    <i className="fa-solid fa-grip-vertical" style={{color: 'var(--text-tertiary)'}}></i>
                                    {editingCategory?.id === category.id ? (
                                        <input
                                            type="text"
                                            value={editingCategory.name}
                                            onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                                            onBlur={handleUpdateCategory}
                                            onKeyDown={e => { if (e.key === 'Enter') handleUpdateCategory(); if (e.key === 'Escape') setEditingCategory(null); }}
                                            className="form-input flex-grow text-lg font-bold p-1 h-auto"
                                            autoFocus
                                        />
                                    ) : (
                                      <span className="flex-grow font-bold text-lg">{category.name}</span>
                                    )}
                                    <button onClick={() => setEditingCategory(category)} className="btn btn-secondary btn-icon text-xs" aria-label="Rename Category"><i className="fa-solid fa-pencil"></i></button>
                                    <button onClick={() => handleDeleteCategory(category.id)} className="btn btn-danger btn-icon text-xs" aria-label="Delete Category"><i className="fa-solid fa-trash"></i></button>
                                </div>
                            )
                        } else {
                            const cal = item.data as TCalendar;
                            const isUncategorized = !cal.categoryId || !calendarCategories.some(c => c.id === cal.categoryId);
                            return (
                                <div
                                    key={cal.id} 
                                    className={`flex items-center gap-3 p-2 rounded-md cursor-grab active:cursor-grabbing ${isUncategorized ? '' : 'ml-4'} ${isBeingDragged ? 'dragging' : ''}`}
                                    style={{backgroundColor: 'var(--bg-quaternary)'}}
                                    draggable
                                    onDragStart={e => handleDragStart(e, index)}
                                    onDragOver={handleDragOver}
                                    onDrop={e => { e.stopPropagation(); handleDrop(e, index); }}
                                    onDragEnd={handleDragEnd}
                                >
                                    <i className="fa-solid fa-grip-vertical" style={{color: 'var(--text-tertiary)'}}></i>
                                     <input 
                                        type="checkbox" 
                                        checked={!hiddenInOverview.includes(cal.id)} 
                                        onChange={() => handleVisibilityToggle(cal.id)}
                                        className="w-5 h-5 rounded accent-fuchsia-500 bg-slate-600 flex-shrink-0"
                                        style={{accentColor: 'var(--accent-primary)'}}
                                    />
                                    <span className="flex-grow font-semibold truncate" style={{color: cal.color}}>{cal.name}</span>
                                </div>
                            )
                        }
                    })}
                </div>
            </div>
        </Modal>
    );
};


// --- Main Calendar Page ---
function CalendarPage() {
  const { calendars, setCalendars, events, setEvents, tasks, setTasks, activeAction, setActiveAction, calendarCategories, calendarOrder, setCalendarOrder, hiddenInOverview, setHiddenInOverview, calendarCategoryOrder, setCalendarCategoryOrder } = useAppContext();
  const { t, lang } = useTranslation();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedCalendarId, setSelectedCalendarId] = useState('overview');
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isAddCalendarModalOpen, setIsAddCalendarModalOpen] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [isManageOverviewOpen, setIsManageOverviewOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [editingEvent, setEditingEvent] = useState<TEvent | null>(null);

  useEffect(() => {
    if (activeAction === 'calendar') {
      openAddEventModal();
      setActiveAction(null);
    }
  }, [activeAction, setActiveAction]);

  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const startDate = new Date(startOfMonth);
  startDate.setDate(startDate.getDate() - startOfMonth.getDay());
  const endDate = new Date(endOfMonth);
  endDate.setDate(endDate.getDate() + (6 - endOfMonth.getDay()));

  const calendarDays = [];
  let day = new Date(startDate);
  while (day <= endDate) {
    calendarDays.push(new Date(day));
    day.setDate(day.getDate() + 1);
  }

  const eventsByDay = useMemo(() => {
    const map = new Map<string, TEvent[]>();
    const relevantEvents = selectedCalendarId === 'overview'
      ? events.filter(e => !hiddenInOverview.includes(e.calendarId))
      : events.filter(e => e.calendarId === selectedCalendarId);

    relevantEvents.forEach(event => {
      const day = event.date;
      if (!map.has(day)) map.set(day, []);
      map.get(day)?.push(event);
    });
    return map;
  }, [events, selectedCalendarId, hiddenInOverview]);

  const displayedEvents = useMemo(() => {
    if (selectedDate) {
        const dateString = toYYYYMMDD(selectedDate);
        return (eventsByDay.get(dateString) || [])
            .sort((a, b) => a.startTime.localeCompare(b.startTime));
    }

    const relevantEvents = selectedCalendarId === 'overview'
        ? events.filter(e => !hiddenInOverview.includes(e.calendarId))
        : events.filter(e => e.calendarId === selectedCalendarId);

    const monthEvents = relevantEvents.filter(event => {
        const eventDate = dateFromYYYYMMDD(event.date);
        return eventDate.getFullYear() === currentDate.getFullYear() &&
               eventDate.getMonth() === currentDate.getMonth();
    });

    return monthEvents.sort((a, b) => {
        if (a.date < b.date) return -1;
        if (a.date > b.date) return 1;
        return a.startTime.localeCompare(b.startTime);
    });
  }, [eventsByDay, selectedDate, currentDate, events, selectedCalendarId, hiddenInOverview]);
  
  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const handleDateClick = (date: Date) => {
    if (selectedDate && selectedDate.toDateString() === date.toDateString()) {
      setSelectedDate(null);
    } else {
      setSelectedDate(date);
    }
  };

  const openAddEventModal = () => {
    setEditingEvent(null);
    setIsEventModalOpen(true);
  };
  
  const openEditEventModal = (event: TEvent) => {
    setEditingEvent(event);
    setIsEventModalOpen(true);
  };
  
  const handleSaveEvent = (eventData: Partial<TEvent>, instruction: RepetitionType | EditScope) => {
    const isRecurringCreation = !eventData.id && ['daily', 'weekly', 'monthly', 'yearly'].includes(instruction);
    
    if (isRecurringCreation) {
      if (!eventData.calendarId || !eventData.date) return;
      const seriesId = Date.now().toString();
      const originalDate = dateFromYYYYMMDD(eventData.date);
      const eventsToAdd: TEvent[] = [];
      const repetitionType = instruction as RepetitionType;

      const maxIterations = { daily: 730, weekly: 104, monthly: 24, yearly: 5 };
      const limit = maxIterations[repetitionType] || 0;

      for (let i = 0; i < limit; i++) {
        const newDate = new Date(originalDate);
        if (repetitionType === 'daily') newDate.setDate(originalDate.getDate() + i);
        else if (repetitionType === 'weekly') newDate.setDate(originalDate.getDate() + i * 7);
        else if (repetitionType === 'monthly') {
            newDate.setMonth(originalDate.getMonth() + i);
            if (newDate.getDate() !== originalDate.getDate()) continue; // Skip if day changes (e.g., Jan 31 to Feb 28)
        }
        else if (repetitionType === 'yearly') newDate.setFullYear(originalDate.getFullYear() + i);

        const newEvent: TEvent = {
            ...(eventData as Omit<TEvent, 'id' | 'seriesId'>),
            id: `${seriesId}-${i}`,
            seriesId: seriesId,
            date: toYYYYMMDD(newDate),
        };
        eventsToAdd.push(newEvent);
      }
      setEvents(prev => [...prev, ...eventsToAdd]);

    } else if (eventData.id) { // Editing an existing event
      const scope = instruction as EditScope;
      const originalEvent = events.find(e => e.id === eventData.id);
      if (!originalEvent) return;
      
      const isRecurringEdit = !!originalEvent.seriesId;

      if (!isRecurringEdit || scope === 'single') {
          // Standard single event update
          setEvents(prev => prev.map(e => e.id === eventData.id ? { ...e, ...eventData } as TEvent : e));
      } else {
          // Recurring event update ('future' or 'all')
          const { seriesId } = originalEvent;
          const changesToApply = {
              name: eventData.name,
              description: eventData.description,
              startTime: eventData.startTime,
              endTime: eventData.endTime,
              color: eventData.color,
          };

          setEvents(prevEvents => {
              return prevEvents.map(e => {
                  if (e.seriesId !== seriesId) {
                      return e;
                  }
                  
                  const shouldUpdate = 
                      (scope === 'all') || 
                      (scope === 'future' && e.date >= originalEvent.date);

                  if (shouldUpdate) {
                      const updatedEvent = { ...e, ...changesToApply };
                      
                      if (e.id === eventData.id) {
                          updatedEvent.date = eventData.date || e.date;
                      }
                      
                      return updatedEvent;
                  }
                  return e;
              });
          });
      }
    } else { // Adding single event
      if (!eventData.calendarId) return;
      const newEvent: TEvent = {
          ...(eventData as Omit<TEvent, 'id'>),
          id: Date.now().toString(),
      }
      setEvents(prev => [...prev, newEvent]);
    }
    setIsEventModalOpen(false);
  };

  const handleDeleteEvent = (eventId: string, scope: EditScope) => {
    const eventToDelete = events.find(e => e.id === eventId);
    if (!eventToDelete) return;

    let idsToDelete: Set<string>;

    if (scope === 'single' || !eventToDelete.seriesId) {
        idsToDelete = new Set([eventId]);
    } else if (scope === 'future') {
        idsToDelete = new Set(
            events
                .filter(e => e.seriesId === eventToDelete.seriesId && e.date >= eventToDelete.date)
                .map(e => e.id)
        );
    } else { // 'all'
        idsToDelete = new Set(
            events
                .filter(e => e.seriesId === eventToDelete.seriesId)
                .map(e => e.id)
        );
    }
    
    setTasks(prev => prev.filter(t => !idsToDelete.has(t.eventId || '')));
    setEvents(prev => prev.filter(e => !idsToDelete.has(e.id)));
    setIsEventModalOpen(false);
  }
  
  const handleAddCalendar = (name: string, color: string) => {
    if (!name || !color) return;
    const newCal: TCalendar = { id: Date.now().toString(), name, color };
    setCalendars([...calendars, newCal]);
    setCalendarOrder(prev => [...prev, newCal.id]);
    setIsAddCalendarModalOpen(false);
  };

  const handleUpdateCalendar = (id: string, name: string, color: string) => {
    setCalendars(calendars.map(c => c.id === id ? { ...c, name, color } : c));
  };

  const handleDeleteCalendar = (id: string) => {
    const eventsToDelete = events.filter(e => e.calendarId === id).map(e => e.id);
    setEvents(prev => prev.filter(e => e.calendarId !== id));
    setTasks(prev => prev.filter(t => t.calendarId !== id && !eventsToDelete.includes(t.eventId || '')));
    setCalendars(prev => prev.filter(c => c.id !== id));
    setCalendarOrder(prev => prev.filter(calId => calId !== id));
    setHiddenInOverview(prev => prev.filter(calId => calId !== id));
    if (selectedCalendarId === id) {
        setSelectedCalendarId('overview');
    }
  };

  const selectedCalendar = calendars.find(c => c.id === selectedCalendarId);
  
  const calendarOptions = useMemo(() => {
    const options: any[] = [{ value: 'overview', label: 'Overview', className: 'text-lg font-bold py-1' }];
    
    const userCalendars = calendars.filter(c => c.id !== 'overview');
    const sortedCalendars = calendarOrder
        .map(id => userCalendars.find(c => c.id === id))
        .filter((c): c is TCalendar => !!c);
    
    const categorized = new Map<string, TCalendar[]>();
    const uncategorized: TCalendar[] = [];

    sortedCalendars.forEach(cal => {
        if (cal.categoryId && calendarCategories.find(cat => cat.id === cal.categoryId)) {
            if (!categorized.has(cal.categoryId)) {
                categorized.set(cal.categoryId, []);
            }
            categorized.get(cal.categoryId)!.push(cal);
        } else {
            uncategorized.push(cal);
        }
    });
    
    // Uncategorized calendars now go directly at the top
    uncategorized.forEach(cal => options.push({ value: cal.id, label: cal.name }));
    
    // Add separator only if there are both uncategorized and categorized calendars
    if (uncategorized.length > 0 && categorized.size > 0) {
        options.push({ isHeader: true, label: ' ' }); 
    }

    calendarCategoryOrder.forEach(catId => {
        const cat = calendarCategories.find(c => c.id === catId);
        if (cat) {
            const cals = categorized.get(cat.id);
            if (cals && cals.length > 0) {
                options.push({ isHeader: true, label: cat.name });
                cals.forEach(cal => options.push({ value: cal.id, label: cal.name }));
            }
        }
    });

    return options;
  }, [calendars, calendarOrder, calendarCategories, calendarCategoryOrder]);

  const formatTime = (time: string) => new Date(`1970-01-01T${time}`).toLocaleTimeString(lang, { hour: 'numeric', minute: '2-digit' });

  return (
    <div className="pb-10">
      <Header titleKey="header.calendar" />

      <div className="px-4 pt-4 space-y-6">
          {/* --- Calendar Box --- */}
          <div className="bg-slate-900 rounded-2xl p-4 shadow-lg" style={{backgroundColor: 'var(--bg-secondary)'}}>
              {/* --- Calendar Selection Bar --- */}
              <div className="flex items-center gap-2 mb-4">
                  <CustomSelect options={calendarOptions} value={selectedCalendarId} onChange={setSelectedCalendarId} className="flex-grow" />
                  <button onClick={() => selectedCalendarId === 'overview' ? setIsManageOverviewOpen(true) : setIsManageModalOpen(true)} className="btn btn-secondary btn-icon flex-shrink-0"><i className="fa-solid fa-gear"></i></button>
                  <button onClick={() => setIsAddCalendarModalOpen(true)} className="btn btn-secondary btn-icon flex-shrink-0"><i className="fa-solid fa-plus"></i></button>
              </div>

              {/* --- Calendar View --- */}
              <div>
                  <div className="flex justify-between items-center mb-4">
                      <button onClick={handlePrevMonth} className="btn btn-icon bg-transparent hover:bg-slate-800"><i className="fa-solid fa-chevron-left"></i></button>
                      <h2 className="text-lg font-bold text-slate-100" style={{color: 'var(--text-primary)'}}>{currentDate.toLocaleString(lang, { month: 'long', year: 'numeric' })}</h2>
                      <button onClick={handleNextMonth} className="btn btn-icon bg-transparent hover:bg-slate-800"><i className="fa-solid fa-chevron-right"></i></button>
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-400 mb-2" style={{color: 'var(--text-secondary)'}}>
                      {['S','M','T','W','T','F','S'].map(d => <div key={d}>{d}</div>)}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                      {calendarDays.map(date => {
                          const isCurrentMonth = date.getMonth() === currentDate.getMonth();
                          const isToday = new Date().toDateString() === date.toDateString();
                          const isSelected = selectedDate?.toDateString() === date.toDateString();
                          const dateKey = toYYYYMMDD(date);
                          const dayEvents = eventsByDay.get(dateKey) || [];

                          return (
                              <div key={date.toString()} className={`aspect-square rounded-lg p-1 flex flex-col items-center justify-start cursor-pointer transition-all duration-150 ${isSelected ? 'scale-105' : ''}`} style={{backgroundColor: isSelected ? 'var(--accent-primary)' : 'transparent', opacity: isSelected ? 0.5 : 1}} onClick={() => handleDateClick(date)}>
                                  <span className={`font-bold text-sm mb-1 ${isToday ? 'bg-fuchsia-500 text-slate-50 rounded-full w-6 h-6 flex items-center justify-center' : ''} ${isCurrentMonth ? 'text-slate-200' : 'text-slate-600'}`} style={{
                                    backgroundColor: isToday ? 'var(--accent-primary)' : 'transparent',
                                    color: isToday ? 'var(--accent-text)' : isCurrentMonth ? 'var(--text-primary)' : 'var(--text-tertiary)'
                                  }}>
                                      {date.getDate()}
                                  </span>
                                  <div className="w-full space-y-0.5">
                                      {selectedCalendarId === 'overview' 
                                        ? Array.from(new Set(dayEvents.map(e => e.calendarId)))
                                            .slice(0, 3)
                                            .map(calId => {
                                                const cal = calendars.find(c => c.id === calId);
                                                return cal ? <div key={cal.id} className="h-1 rounded-full" style={{ backgroundColor: cal.color }}></div> : null;
                                            })
                                        : dayEvents.slice(0, 3).map(event => (
                                            <div key={event.id} className="h-1 rounded-full" style={{ backgroundColor: event.color }}></div>
                                        ))}
                                  </div>
                              </div>
                          );
                      })}
                  </div>
              </div>
          </div>
          
          {/* --- Event Details View --- */}
          <div>
              <h2 className="text-xl font-bold text-slate-100 mb-3" style={{color: 'var(--text-primary)'}}>
                  {selectedDate ? (
                    <>
                      Events for <span style={{color: 'var(--accent-primary)'}}>{selectedDate.toLocaleDateString(lang, {month: 'long', day: 'numeric'})}</span>
                    </>
                  ) : (
                    <>
                      Events for <span style={{color: 'var(--accent-primary)'}}>{currentDate.toLocaleDateString(lang, {month: 'long', year: 'numeric'})}</span>
                    </>
                  )}
              </h2>
              <div className="space-y-3">
                  {displayedEvents.length > 0 ? displayedEvents.map(event => {
                      const cal = calendars.find(c => c.id === event.calendarId);
                      const barColor = selectedCalendarId === 'overview' && cal ? cal.color : event.color;
                      
                      return (
                          <button key={event.id} onClick={() => openEditEventModal(event)} className="w-full text-left flex gap-4 p-4 rounded-lg transition-all duration-150 active:scale-[0.99]" style={{backgroundColor: 'var(--bg-secondary)'}}>
                              <div className="w-1.5 self-stretch shrink-0 rounded-full" style={{backgroundColor: barColor}}></div>
                              <div className="flex-grow">
                                  <div className="flex items-center justify-between">
                                      <p className="font-bold">{event.name}</p>
                                      {event.seriesId && <i className="fa-solid fa-repeat text-xs" style={{color: 'var(--text-secondary)'}}></i>}
                                  </div>
                                  <p className="text-sm" style={{color: 'var(--text-secondary)'}}>
                                    {!selectedDate && (
                                      <span className="font-medium mr-2">{dateFromYYYYMMDD(event.date).toLocaleDateString(lang, { weekday: 'short', day: 'numeric' })}</span>
                                    )}
                                    {formatTime(event.startTime)} - {formatTime(event.endTime)}
                                  </p>
                                  {event.description && <p className="text-sm mt-1">{event.description}</p>}
                              </div>
                          </button>
                      );
                  }) : <div className="text-center py-6 rounded-lg flex flex-col items-center justify-center h-40" style={{color: 'var(--text-tertiary)', backgroundColor: 'var(--bg-secondary)'}}><i className="fa-solid fa-calendar-check text-5xl"></i></div>}
              </div>
          </div>
      </div>
      
      <EventFormModal 
        isOpen={isEventModalOpen} 
        onClose={() => setIsEventModalOpen(false)} 
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
        initialData={editingEvent || { date: toYYYYMMDD(selectedDate || new Date()) }}
        activeCalendarId={selectedCalendarId}
      />
      <AddCalendarModal isOpen={isAddCalendarModalOpen} onClose={() => setIsAddCalendarModalOpen(false)} onAdd={handleAddCalendar} />
      {selectedCalendar && selectedCalendar.id !== 'overview' && (
          <ManageCalendarModal isOpen={isManageModalOpen} onClose={() => setIsManageModalOpen(false)} calendar={selectedCalendar} onUpdate={handleUpdateCalendar} onDelete={handleDeleteCalendar} />
      )}
      <ManageModal isOpen={isManageOverviewOpen} onClose={() => setIsManageOverviewOpen(false)} />
    </div>
  );
}

// --- Add/Manage Calendar Modals ---
const AddCalendarModal: React.FC<{isOpen: boolean, onClose: () => void, onAdd: (name: string, color: string) => void}> = ({isOpen, onClose, onAdd}) => {
    const [name, setName] = useState('');
    const [color, setColor] = useState(COLORS[0]);

    useEffect(() => {
        if (isOpen) {
            setName('');
            setColor(COLORS[0]);
        }
    }, [isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onAdd(name, color);
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add New Calendar">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex items-center gap-3">
                    <i className="fa-solid fa-pen-nib w-6 text-center text-lg" style={{color: 'var(--text-secondary)'}}></i>
                    <div className="flex-grow">
                        <input id="calName" type="text" placeholder="Calendar Name (Required)" value={name} onChange={e => setName(e.target.value)} className="form-input" required />
                    </div>
                </div>
                <div className="flex items-start gap-3">
                    <i className="fa-solid fa-palette w-6 text-center text-lg pt-1" style={{color: 'var(--text-secondary)'}}></i>
                    <div className="flex-grow">
                        <div className="grid grid-cols-7 gap-2">
                            {COLORS.map(c => (
                                <button type="button" key={c} onClick={() => setColor(c)} className={`w-7 h-7 rounded-full transition-all transform hover:scale-110 active:scale-95 ${color === c ? 'ring-2 ring-offset-2 ring-white' : ''}`} style={{ backgroundColor: c, '--tw-ring-offset-color': 'var(--bg-secondary)' } as React.CSSProperties}></button>
                            ))}
                        </div>
                    </div>
                </div>
                <button type="submit" className="w-full btn btn-primary"><i className="fa-solid fa-plus text-lg"></i></button>
            </form>
        </Modal>
    )
}

interface ManageCalendarModalProps {
    isOpen: boolean;
    onClose: () => void;
    calendar: TCalendar;
    onUpdate: (id: string, name: string, color: string) => void;
    onDelete: (id: string) => void;
}
const ManageCalendarModal: React.FC<ManageCalendarModalProps> = ({ isOpen, onClose, calendar, onUpdate, onDelete }) => {
    const { t } = useTranslation();
    const [name, setName] = useState(calendar.name);
    const [color, setColor] = useState(calendar.color);
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setName(calendar.name);
            setColor(calendar.color);
            setShowConfirmDelete(false);
        }
    }, [calendar, isOpen]);

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        onUpdate(calendar.id, name, color);
        onClose();
    };

    const handleDeleteConfirm = () => {
        onDelete(calendar.id);
        onClose();
    };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={showConfirmDelete ? "Are you sure?" : t('calendar.manage')}>
            {showConfirmDelete ? (
                <div className="space-y-4 text-center">
                    <p style={{color: 'var(--text-secondary)'}}>
                        This will permanently delete the calendar and all its events. This action cannot be undone.
                    </p>
                    <div className="pt-2">
                        <button type="button" onClick={handleDeleteConfirm} className="w-full btn btn-danger">Yes</button>
                    </div>
                </div>
            ) : (
                <form onSubmit={handleUpdate} className="space-y-4">
                    <div className="flex items-center gap-3">
                        <i className="fa-solid fa-pen-nib w-6 text-center text-lg" style={{color: 'var(--text-secondary)'}}></i>
                        <div className="flex-grow">
                            <input id="editCalName" type="text" placeholder="Calendar Name (Required)" value={name} onChange={e => setName(e.target.value)} className="form-input" required />
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <i className="fa-solid fa-palette w-6 text-center text-lg pt-1" style={{color: 'var(--text-secondary)'}}></i>
                        <div className="flex-grow">
                            <div className="grid grid-cols-7 gap-2">
                                {COLORS.map(c => (
                                    <button type="button" key={c} onClick={() => setColor(c)} className={`w-7 h-7 rounded-full transition-all transform hover:scale-110 active:scale-95 ${color === c ? 'ring-2 ring-offset-2 ring-white' : ''}`} style={{ backgroundColor: c, '--tw-ring-offset-color': 'var(--bg-secondary)' } as React.CSSProperties}></button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                        <button type="button" onClick={() => setShowConfirmDelete(true)} className="btn btn-danger btn-icon" aria-label={t('common.delete')}><i className="fa-solid fa-trash"></i></button>
                        <button type="submit" className="flex-grow btn btn-primary">{t('common.save')}</button>
                    </div>
                </form>
            )}
        </Modal>
    )
}

export default CalendarPage;