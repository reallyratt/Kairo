import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useAppContext, useTranslation } from '../context/AppContext';
import { TEvent, TCalendar } from '../types';
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
}

const EventFormModal: React.FC<EventFormModalProps> = ({ isOpen, onClose, onSave, onDelete, initialData }) => {
  type View = 'form' | 'confirm_delete' | 'confirm_close';
  const { lang } = useTranslation();
  const [formData, setFormData] = useState<Partial<TEvent>>({});
  const [repetition, setRepetition] = useState<RepetitionType>('none');
  const [view, setView] = useState<View>('form');
  const [animationClass, setAnimationClass] = useState('');
  const initialFormData = useRef<Partial<TEvent>>({});
  // FIX: Initialize useRef with null to provide an initial value.
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

      const data = {
        name: '',
        description: '',
        date: toYYYYMMDD(new Date()),
        startTime: formatTime(defaultStartTime),
        endTime: formatTime(defaultEndTime),
        color: COLORS[0],
        ...initialData
      };
      
      setFormData(data);
      initialFormData.current = data;
      setRepetition('none');
      setView('form');
      setAnimationClass('animate-view-in');
    }
    return () => {
        if(animationTimer.current) clearTimeout(animationTimer.current);
    }
  }, [isOpen, initialData]);

  const handleChange = (field: keyof Omit<TEvent, 'id' | 'calendarId'>, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const hasChanges = JSON.stringify(formData) !== JSON.stringify(initialFormData.current) || (repetition !== 'none' && !isEditing);

  const handleCloseAttempt = () => {
    if (hasChanges && view === 'form') {
      changeView('confirm_close');
    } else {
      onClose();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) return;
    onSave(formData, isEditing ? 'single' : repetition);
  };

  const handleDelete = (scope: EditScope) => {
    if (formData.id) {
      onDelete(formData.id, scope);
    }
  };
  
  const getTitle = () => {
    switch(view) {
        case 'confirm_delete': return 'Confirm Deletion';
        case 'confirm_close': return 'Unsaved Changes';
        case 'form':
        default: return isEditing ? 'Edit Event' : 'Add Event';
    }
  }

  const repetitionOptions = [
    { value: 'none', label: 'Does not repeat' },
    { value: 'daily', label: 'Every Day' },
    { value: 'weekly', label: 'Every Week' },
    { value: 'monthly', label: 'Every Month' },
    { value: 'yearly', label: 'Every Year' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={handleCloseAttempt} title={getTitle()}>
      <div className={animationClass}>
        {view === 'form' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="eventName" className={LABEL_STYLE} style={{color: 'var(--text-secondary)'}}>Event Name</label>
                <input id="eventName" type="text" placeholder="Event Name" value={formData.name || ''} onChange={e => handleChange('name', e.target.value)} className="form-input" required />
            </div>
            <div>
                <label htmlFor="description" className={LABEL_STYLE} style={{color: 'var(--text-secondary)'}}>Description</label>
                <textarea id="description" placeholder="(Optional)" value={formData.description || ''} onChange={e => handleChange('description', e.target.value)} className="form-input h-24 resize-none"></textarea>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="startTime" className={LABEL_STYLE} style={{color: 'var(--text-secondary)'}}>Start Time</label>
                    <input id="startTime" type="time" value={formData.startTime || ''} onChange={e => handleChange('startTime', e.target.value)} className="form-input" required />
                </div>
                <div>
                    <label htmlFor="endTime" className={LABEL_STYLE} style={{color: 'var(--text-secondary)'}}>End Time</label>
                    <input id="endTime" type="time" value={formData.endTime || ''} onChange={e => handleChange('endTime', e.target.value)} className="form-input" required />
                </div>
            </div>
            <div>
                <label htmlFor="eventDate" className={LABEL_STYLE} style={{color: 'var(--text-secondary)'}}>Date</label>
                <input id="eventDate" type="date" value={formData.date || ''} onChange={e => handleChange('date', e.target.value)} className="form-input" required />
            </div>
            <div className={`transition-all duration-300 ease-in-out ${isEditing ? 'max-h-0 opacity-0 overflow-hidden' : 'max-h-40 opacity-100 pt-1'}`}>
              <div>
                <label className={LABEL_STYLE} style={{color: 'var(--text-secondary)'}}>Repetition</label>
                <CustomSelect options={repetitionOptions} value={repetition} onChange={(v) => setRepetition(v as RepetitionType)} />
              </div>
            </div>
            <div>
                <label className={LABEL_STYLE} style={{color: 'var(--text-secondary)'}}>Color</label>
                <div className="grid grid-cols-7 gap-2">
                    {COLORS.map(c => (
                        // FIX: Replace `ringOffsetColor` with `--tw-ring-offset-color` and cast style object to `React.CSSProperties`.
                        <button type="button" key={c} onClick={() => handleChange('color', c)} className={`w-7 h-7 rounded-full transition-all transform hover:scale-110 active:scale-95 ${formData.color === c ? 'ring-2 ring-offset-2 ring-white' : ''}`} style={{ backgroundColor: c, '--tw-ring-offset-color': 'var(--bg-secondary)' } as React.CSSProperties}></button>
                    ))}
                </div>
            </div>
            <div className="flex gap-2 pt-2">
              {isEditing && (
                  <button type="button" onClick={() => changeView('confirm_delete')} className="btn btn-danger">Delete</button>
              )}
              <button type="submit" disabled={!formData.name?.trim()} className="flex-grow btn btn-primary">{isEditing ? 'Save Changes' : 'Save Event'}</button>
            </div>
          </form>
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
                       <div className="mt-4">
                          <button type="button" onClick={() => changeView('form')} className="w-full btn btn-danger">Cancel</button>
                      </div>
                  </div>
              ) : (
                  <div className="text-center">
                      <p className="text-slate-300" style={{color: 'var(--text-secondary)'}}>Are you sure? Deleting an event will also remove any associated tasks.</p>
                      <div className="flex gap-2 pt-4">
                          <button type="button" onClick={() => changeView('form')} className="flex-1 btn btn-secondary">Cancel</button>
                          <button type="button" onClick={() => handleDelete('single')} className="flex-1 btn btn-danger">Confirm Delete</button>
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


// --- Main Calendar Page ---
function CalendarPage() {
  const { calendars, setCalendars, events, setEvents, tasks, setTasks } = useAppContext();
  const { t, lang } = useTranslation();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedCalendarId, setSelectedCalendarId] = useState('overview');
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isAddCalendarModalOpen, setIsAddCalendarModalOpen] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [editingEvent, setEditingEvent] = useState<TEvent | null>(null);

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
      ? events
      : events.filter(e => e.calendarId === selectedCalendarId);

    relevantEvents.forEach(event => {
      const day = event.date;
      if (!map.has(day)) map.set(day, []);
      map.get(day)?.push(event);
    });
    return map;
  }, [events, selectedCalendarId]);

  const displayedEvents = useMemo(() => {
    if (selectedDate) {
        const dateString = toYYYYMMDD(selectedDate);
        return (eventsByDay.get(dateString) || [])
            .sort((a, b) => a.startTime.localeCompare(b.startTime));
    }

    const relevantEvents = selectedCalendarId === 'overview'
        ? events
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
  }, [eventsByDay, selectedDate, currentDate, events, selectedCalendarId]);
  
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
    const isRecurringCreation = ['daily', 'weekly', 'monthly', 'yearly'].includes(instruction);
    
    if (isRecurringCreation) {
      if (selectedCalendarId === 'overview' || !eventData.date) return;
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
            ...(eventData as Omit<TEvent, 'id' | 'calendarId'>),
            id: `${seriesId}-${i}`,
            calendarId: selectedCalendarId,
            seriesId: seriesId,
            date: toYYYYMMDD(newDate),
        };
        eventsToAdd.push(newEvent);
      }
      setEvents(prev => [...prev, ...eventsToAdd]);

    } else if (eventData.id) { // Editing
      setEvents(prev => prev.map(e => e.id === eventData.id ? { ...e, ...eventData } as TEvent : e));
    } else { // Adding single event
      if (selectedCalendarId === 'overview') return;
      const newEvent: TEvent = {
          ...(eventData as Omit<TEvent, 'id' | 'calendarId'>),
          id: Date.now().toString(),
          calendarId: selectedCalendarId,
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
    if (selectedCalendarId === id) {
        setSelectedCalendarId('overview');
    }
  };

  const selectedCalendar = calendars.find(c => c.id === selectedCalendarId);
  const calendarOptions = calendars.map(cal => ({ value: cal.id, label: cal.name }));
  const formatTime = (time: string) => new Date(`1970-01-01T${time}`).toLocaleTimeString(lang, { hour: 'numeric', minute: '2-digit' });

  return (
    <div className="pb-10">
      <Header titleKey="header.calendar" />

      <div className="px-4 pt-4 space-y-6">
          {/* --- Calendar Selection Bar --- */}
          <div className="flex items-center gap-2">
              <CustomSelect options={calendarOptions} value={selectedCalendarId} onChange={setSelectedCalendarId} className="flex-grow" />
              {selectedCalendarId !== 'overview' && selectedCalendar && (
                  <button onClick={() => setIsManageModalOpen(true)} className="btn btn-secondary btn-icon flex-shrink-0"><i className="fa-solid fa-gear"></i></button>
              )}
               <button onClick={() => setIsAddCalendarModalOpen(true)} className="btn btn-secondary btn-icon flex-shrink-0"><i className="fa-solid fa-plus"></i></button>
          </div>

          {/* --- Calendar View --- */}
          <div className="bg-slate-900 rounded-2xl p-4 shadow-lg" style={{backgroundColor: 'var(--bg-secondary)'}}>
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
          
          {/* --- Add Event Button --- */}
          {selectedCalendarId !== 'overview' && (
            <div>
                <button onClick={openAddEventModal} className="w-full btn btn-secondary">{t('calendar.add')}</button>
            </div>
          )}

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
                  }) : <p className="text-center py-6 rounded-lg" style={{color: 'var(--text-tertiary)', backgroundColor: 'var(--bg-secondary)'}}>{selectedDate ? 'No events for this day.' : 'No events for this month.'}</p>}
              </div>
          </div>
      </div>
      
      <EventFormModal 
        isOpen={isEventModalOpen} 
        onClose={() => setIsEventModalOpen(false)} 
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
        initialData={editingEvent || { date: toYYYYMMDD(selectedDate || new Date()) }}
      />
      <AddCalendarModal isOpen={isAddCalendarModalOpen} onClose={() => setIsAddCalendarModalOpen(false)} onAdd={handleAddCalendar} />
      {selectedCalendar && selectedCalendar.id !== 'overview' && (
          <ManageCalendarModal isOpen={isManageModalOpen} onClose={() => setIsManageModalOpen(false)} calendar={selectedCalendar} onUpdate={handleUpdateCalendar} onDelete={handleDeleteCalendar} />
      )}
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
        <Modal isOpen={isOpen} onClose={onClose} title="Add Calendar">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="calName" className={LABEL_STYLE} style={{color: 'var(--text-secondary)'}}>Calendar Name</label>
                    <input id="calName" type="text" placeholder="e.g. Work, School" value={name} onChange={e => setName(e.target.value)} className="form-input" required />
                </div>
                <div>
                    <label className={LABEL_STYLE} style={{color: 'var(--text-secondary)'}}>Color</label>
                    <div className="grid grid-cols-7 gap-2">
                        {COLORS.map(c => (
                            // FIX: Replace `ringOffsetColor` with `--tw-ring-offset-color` and cast style object to `React.CSSProperties`.
                            <button type="button" key={c} onClick={() => setColor(c)} className={`w-7 h-7 rounded-full transition-all transform hover:scale-110 active:scale-95 ${color === c ? 'ring-2 ring-offset-2 ring-white' : ''}`} style={{ backgroundColor: c, '--tw-ring-offset-color': 'var(--bg-secondary)' } as React.CSSProperties}></button>
                        ))}
                    </div>
                </div>
                <button type="submit" className="w-full btn btn-primary">Add Calendar</button>
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
        <Modal isOpen={isOpen} onClose={onClose} title={showConfirmDelete ? "Confirm Deletion" : t('calendar.manage')}>
            {showConfirmDelete ? (
                <div className="space-y-4 text-center">
                    <p style={{color: 'var(--text-secondary)'}}>
                        Are you sure? This will permanently delete the calendar and all its events. This action cannot be undone.
                    </p>
                    <div className="flex gap-2 pt-2">
                        <button type="button" onClick={() => setShowConfirmDelete(false)} className="flex-1 btn btn-secondary">{t('common.cancel')}</button>
                        <button type="button" onClick={handleDeleteConfirm} className="flex-1 btn btn-danger">Confirm Delete</button>
                    </div>
                </div>
            ) : (
                <form onSubmit={handleUpdate} className="space-y-4">
                    <div>
                        <label htmlFor="editCalName" className={LABEL_STYLE} style={{color: 'var(--text-secondary)'}}>Calendar Name</label>
                        <input id="editCalName" type="text" value={name} onChange={e => setName(e.target.value)} className="form-input" required />
                    </div>
                    <div>
                        <label className={LABEL_STYLE} style={{color: 'var(--text-secondary)'}}>Color</label>
                        <div className="grid grid-cols-7 gap-2">
                            {COLORS.map(c => (
                                // FIX: Replace `ringOffsetColor` with `--tw-ring-offset-color` and cast style object to `React.CSSProperties`.
                                <button type="button" key={c} onClick={() => setColor(c)} className={`w-7 h-7 rounded-full transition-all transform hover:scale-110 active:scale-95 ${color === c ? 'ring-2 ring-offset-2 ring-white' : ''}`} style={{ backgroundColor: c, '--tw-ring-offset-color': 'var(--bg-secondary)' } as React.CSSProperties}></button>
                            ))}
                        </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                        <button type="button" onClick={() => setShowConfirmDelete(true)} className="flex-1 btn btn-danger">{t('common.delete')}</button>
                        <button type="submit" className="flex-1 btn btn-primary">{t('common.save')}</button>
                    </div>
                </form>
            )}
        </Modal>
    )
}

export default CalendarPage;