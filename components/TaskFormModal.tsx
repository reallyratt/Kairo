import React, { useState, useEffect, useMemo, useRef } from 'react';
import Modal from './Modal';
import { TTask, Urgency, TCalendar, TCalendarCategory, TTaskGroup } from '../types';
import { useAppContext } from '../context/AppContext';
import { COLORS } from '../constants';
import CustomSelect from './CustomSelect';
import { toYYYYMMDD } from '../utils';

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Partial<TTask>) => void;
  onDelete: (taskId: string) => void;
  initialData?: Partial<TTask>;
}

const TaskFormModal: React.FC<TaskFormModalProps> = ({ isOpen, onClose, onSave, onDelete, initialData }) => {
  const { events, calendars, calendarCategories, calendarOrder, calendarCategoryOrder, taskGroups, setTaskGroups } = useAppContext();
  const [formData, setFormData] = useState<Partial<TTask>>({});
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  
  const [linkType, setLinkType] = useState<'none' | 'group' | 'event'>('none');
  const [syncCalendarId, setSyncCalendarId] = useState<string | null>(null);
  const [eventPickerDate, setEventPickerDate] = useState<string>(toYYYYMMDD(new Date()));

  // New state for group combobox
  const [groupNameInput, setGroupNameInput] = useState('');
  const [isGroupDropdownOpen, setIsGroupDropdownOpen] = useState(false);
  const groupInputRef = useRef<HTMLDivElement>(null);

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
        taskGroupId: undefined,
        ...initialData
      };
      setFormData(data);

      const eventForTask = data.eventId ? events.find(e => e.id === data.eventId) : null;
      setSyncCalendarId(eventForTask ? eventForTask.calendarId : null);
      setEventPickerDate(eventForTask ? eventForTask.date : data.dueDate || toYYYYMMDD(new Date()));
      
      const groupForTask = data.taskGroupId ? taskGroups.find(tg => tg.id === data.taskGroupId) : null;
      setGroupNameInput(groupForTask?.name || '');

      setLinkType(data.eventId ? 'event' : data.taskGroupId ? 'group' : 'none');
      setShowConfirmDelete(false);
    }
  }, [isOpen, initialData, calendars, events, taskGroups]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (groupInputRef.current && !groupInputRef.current.contains(event.target as Node)) {
        setIsGroupDropdownOpen(false);
      }
    };
    if (isGroupDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isGroupDropdownOpen]);

  const handleChange = (field: keyof Omit<TTask, 'id' | 'calendarId' | 'completed'>, value: string | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) return;

    let finalData = { ...formData };
    
    if (linkType === 'group') {
      finalData.eventId = undefined;
      const groupName = groupNameInput.trim();
      if (groupName) {
        let group = taskGroups.find(g => g.name.toLowerCase() === groupName.toLowerCase());
        if (!group) {
          const newGroup: TTaskGroup = { id: Date.now().toString(), name: groupName };
          setTaskGroups(prev => [...prev, newGroup]);
          group = newGroup;
        }
        finalData.taskGroupId = group.id;
      } else {
        finalData.taskGroupId = undefined;
      }
    } else if (linkType === 'event') {
      finalData.taskGroupId = undefined;
    } else {
      finalData.taskGroupId = undefined;
      finalData.eventId = undefined;
    }
    onSave(finalData);
  };
  
  const handleConfirmDelete = () => {
    if (formData.id) {
        onDelete(formData.id);
        setShowConfirmDelete(false);
    }
  }
  
  const handleGroupSelect = (groupName: string) => {
    setGroupNameInput(groupName);
    setIsGroupDropdownOpen(false);
  };

  const suggestedTaskGroups = useMemo(() => {
    if (!groupNameInput) return taskGroups;
    return taskGroups.filter(g => g.name.toLowerCase().includes(groupNameInput.toLowerCase()));
  }, [groupNameInput, taskGroups]);

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


  const calendarEvents = syncCalendarId
    ? events.filter(e => e.calendarId === syncCalendarId && e.date === eventPickerDate)
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

  const linkTypeOptions = [
    { value: 'none', label: 'No Grouping' },
    { value: 'group', label: 'Group by Task' },
    { value: 'event', label: 'Link to Event' }
  ];

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Edit Task' : 'New Task'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-3">
              <i className="fa-solid fa-pen-nib w-6 text-center text-lg" style={{color: 'var(--text-secondary)'}}></i>
              <div className="flex-grow">
                  <input id="taskName" type="text" placeholder="Task Name (Required)" value={formData.name || ''} onChange={e => handleChange('name', e.target.value)} className="form-input" required />
              </div>
          </div>

          <div className="flex items-start gap-3">
              <i className="fa-solid fa-paragraph w-6 text-center text-lg pt-2" style={{color: 'var(--text-secondary)'}}></i>
              <div className="flex-grow">
                  <textarea id="description" placeholder="Description (Optional)" value={formData.description || ''} onChange={e => handleChange('description', e.target.value)} className="form-input h-24 resize-none"></textarea>
              </div>
          </div>

          <div className="flex items-center gap-3">
              <i className="fa-solid fa-calendar-day w-6 text-center text-lg" style={{color: 'var(--text-secondary)'}}></i>
              <div className="flex-grow grid grid-cols-2 gap-4">
                  <input id="dueDate" type="date" title="Due Date" value={formData.dueDate || ''} onChange={e => handleChange('dueDate', e.target.value)} className="form-input" />
                  <CustomSelect 
                      options={urgencyOptions} 
                      value={formData.urgency || 'none'} 
                      onChange={(v) => handleChange('urgency', v === 'none' ? undefined : v)} 
                  />
              </div>
          </div>

          <div className="flex items-center gap-3">
            <i className="fa-solid fa-link w-6 text-center text-lg" style={{color: 'var(--text-secondary)'}}></i>
            <div className="flex-grow">
              <CustomSelect
                options={linkTypeOptions}
                value={linkType}
                onChange={v => setLinkType(v as 'none' | 'group' | 'event')}
              />
            </div>
          </div>
          
          {linkType === 'group' && (
             <div className="pl-9 space-y-2 animate-view-in">
                <div ref={groupInputRef} className="relative">
                    <input
                        type="text"
                        placeholder="Select or create a group..."
                        value={groupNameInput}
                        onChange={e => { setGroupNameInput(e.target.value); setIsGroupDropdownOpen(true); }}
                        onFocus={() => setIsGroupDropdownOpen(true)}
                        className="form-input"
                        autoComplete="off"
                    />
                    {isGroupDropdownOpen && suggestedTaskGroups.length > 0 && (
                        <div className="absolute z-20 mt-1 w-full rounded-lg shadow-lg max-h-40 overflow-auto animate-dropdown-in" style={{backgroundColor: 'var(--bg-quaternary)'}}>
                            <ul>
                                {suggestedTaskGroups.map(group => (
                                    <li key={group.id} onMouseDown={e => { e.preventDefault(); handleGroupSelect(group.name); }} className="px-4 py-2 cursor-pointer hover:bg-[rgba(var(--accent-primary-rgb),0.2)]">
                                        {group.name}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
             </div>
          )}

          {linkType === 'event' && (
            <div className="pl-9 space-y-2 animate-view-in">
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
              {syncCalendarId && (
                 <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <label htmlFor="eventPickerDate" className="flex-shrink-0"><i className="fa-solid fa-calendar-day" style={{color: 'var(--text-tertiary)'}}></i></label>
                    <input
                      id="eventPickerDate"
                      type="date"
                      title="Event Date"
                      value={eventPickerDate}
                      onChange={e => setEventPickerDate(e.target.value)}
                      className="form-input w-full"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="flex-shrink-0"><i className="fa-solid fa-calendar-check" style={{color: 'var(--text-tertiary)'}}></i></label>
                    <CustomSelect
                      options={eventOptions}
                      value={formData.eventId || 'none'}
                      onChange={(v) => handleChange('eventId', v === 'none' ? undefined : v)}
                      className="w-full"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex items-start gap-3">
            <i className="fa-solid fa-palette w-6 text-center text-lg pt-1" style={{color: 'var(--text-secondary)'}}></i>
            <div className="flex-grow">
              <div className="grid grid-cols-7 gap-2">
                {COLORS.map(c => (
                  <button type="button" key={c} onClick={() => handleChange('color', c)} className={`w-7 h-7 rounded-full transition-all transform hover:scale-110 active:scale-95 ${formData.color === c ? 'ring-2 ring-offset-2 ring-[var(--accent-secondary)]' : ''}`} style={{ backgroundColor: c, '--tw-ring-offset-color': 'var(--bg-secondary)' } as React.CSSProperties}></button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            {isEditing && (
                <button type="button" onClick={() => setShowConfirmDelete(true)} className="btn btn-danger btn-icon" aria-label="Delete"><i className="fa-solid fa-trash"></i></button>
            )}
            <button type="submit" className="flex-grow btn btn-primary"><i className="fa-solid fa-check text-lg"></i></button>
          </div>
        </form>
      </Modal>
      <Modal isOpen={showConfirmDelete} onClose={() => setShowConfirmDelete(false)} title="Are you sure?">
          <div className="text-center">
              <p className="mb-4" style={{color: 'var(--text-secondary)'}}>This action will permanently delete this task and cannot be undone.</p>
              <div className="pt-2">
                  <button onClick={handleConfirmDelete} className="w-full btn btn-danger">Yes</button>
              </div>
          </div>
      </Modal>
    </>
  );
};

export default TaskFormModal;