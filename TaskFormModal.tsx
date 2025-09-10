import React, { useState, useEffect, useMemo } from 'react';
import Modal from './Modal';
import { TTask, Urgency, TCalendar, TCalendarCategory } from '../types';
import { useAppContext } from '../context/AppContext';
import { COLORS } from '../constants';
import CustomSelect from './CustomSelect';
import { toYYYYMMDD } from '../utils';

const LABEL_STYLE = "block text-sm font-medium text-slate-400 mb-1";

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Partial<TTask>) => void;
  onDelete: (taskId: string) => void;
  initialData?: Partial<TTask>;
}

const TaskFormModal: React.FC<TaskFormModalProps> = ({ isOpen, onClose, onSave, onDelete, initialData }) => {
  const { events, calendars, calendarCategories, calendarOrder, calendarCategoryOrder } = useAppContext();
  const [formData, setFormData] = useState<Partial<TTask>>({});
  const [syncCalendarId, setSyncCalendarId] = useState<string | null>(null);

  const isEditing = !!initialData?.id;

  useEffect(() => {
    if (isOpen) {
      const calendarColor = calendars.find(c => c.id === initialData?.calendarId)?.color;
      const data = {
        name: '',
        description: '',
        dueDate: toYYYYMMDD(new Date()),
        urgency: undefined,
        color: calendarColor || COLORS[0],
        eventId: undefined,
        ...initialData
      };
      setFormData(data);

      const eventForTask = data.eventId ? events.find(e => e.id === data.eventId) : null;
      setSyncCalendarId(eventForTask ? eventForTask.calendarId : null);
    }
  }, [isOpen, initialData, calendars, events]);

  const handleChange = (field: keyof Omit<TTask, 'id' | 'calendarId' | 'completed'>, value: string | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) return;
    onSave(formData);
  };
  
  const handleDelete = () => {
    if (formData.id) {
        onDelete(formData.id);
    }
  }

  const syncCalendarOptions = useMemo(() => {
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


  const calendarEvents = syncCalendarId && formData.dueDate
    ? events.filter(e => e.calendarId === syncCalendarId && e.date === formData.dueDate)
    : [];
    
  const eventOptions = !syncCalendarId
    ? [{ value: 'none', label: 'Select a calendar first' }]
    : [
        { value: 'none', label: 'No Event' },
        ...calendarEvents.map(e => ({ value: e.id, label: e.name }))
    ];


  const urgencyOptions = [
    { value: 'none', label: 'No Urgency' },
    { value: Urgency.Low, label: 'Low' },
    { value: Urgency.Medium, label: 'Medium' },
    { value: Urgency.High, label: 'High' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Edit Task' : 'Add Task'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="taskName" className={LABEL_STYLE}>Task Name</label>
          <input id="taskName" type="text" placeholder="Task Name" value={formData.name || ''} onChange={e => handleChange('name', e.target.value)} className="form-input" required />
        </div>
        <div>
          <label htmlFor="description" className={LABEL_STYLE}>Description</label>
          <textarea id="description" placeholder="(Optional)" value={formData.description || ''} onChange={e => handleChange('description', e.target.value)} className="form-input h-24 resize-none"></textarea>
        </div>
        <div className="grid grid-cols-2 gap-4">
            <div>
                <label htmlFor="dueDate" className={LABEL_STYLE}>Due Date</label>
                <input id="dueDate" type="date" value={formData.dueDate || ''} onChange={e => handleChange('dueDate', e.target.value)} className="form-input" />
            </div>
            <div>
                <label className={LABEL_STYLE}>Urgency</label>
                <CustomSelect 
                    options={urgencyOptions} 
                    value={formData.urgency || 'none'} 
                    onChange={(v) => handleChange('urgency', v === 'none' ? undefined : v)} 
                />
            </div>
        </div>
        <div>
          <label className={LABEL_STYLE}>Choose a Calendar to Sync</label>
          <CustomSelect 
            options={[{value: 'none', label: 'No Calendar Sync'}, ...syncCalendarOptions]} 
            value={syncCalendarId || 'none'} 
            onChange={(v) => {
                const newSyncId = v === 'none' ? null : v;
                setSyncCalendarId(newSyncId);
                if (!newSyncId) {
                    handleChange('eventId', undefined);
                }
            }}
          />
        </div>
        {syncCalendarId && (
            <div>
              <label className={LABEL_STYLE}>Link to Event</label>
              <CustomSelect 
                options={eventOptions} 
                value={formData.eventId || 'none'} 
                onChange={(v) => handleChange('eventId', v === 'none' ? undefined : v)} 
              />
              <p className="text-xs mt-1" style={{color: 'var(--text-tertiary)'}}>
                Only events on the task's due date will appear.
              </p>
            </div>
        )}
        <div>
          <label className={LABEL_STYLE}>Color</label>
          <div className="grid grid-cols-7 gap-2">
            {COLORS.map(c => (
              <button type="button" key={c} onClick={() => handleChange('color', c)} className={`w-7 h-7 rounded-full transition-all transform hover:scale-110 active:scale-95 ${formData.color === c ? 'ring-2 ring-offset-2 ring-offset-slate-900 ring-white' : ''}`} style={{ backgroundColor: c }}></button>
            ))}
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          {isEditing && (
            <button type="button" onClick={handleDelete} className="btn btn-danger">Delete</button>
          )}
          <button type="submit" disabled={!formData.name?.trim()} className="flex-grow btn btn-primary">{isEditing ? 'Save Changes' : 'Save Task'}</button>
        </div>
      </form>
    </Modal>
  );
};

export default TaskFormModal;
