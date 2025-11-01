import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { TTask, TEvent, Urgency, TCalendar, TCalendarCategory } from '../types';
import { dateFromYYYYMMDD } from '../utils';
import TaskFormModal from '../components/TaskFormModal';
import CustomSelect from '../components/CustomSelect';
import Modal from '../components/Modal';

// --- Sub-components for TodoPage ---

// Urgency Tag Component
const UrgencyTag: React.FC<{ urgency: Urgency }> = ({ urgency }) => {
    const styles = {
        [Urgency.Low]: { backgroundColor: 'rgba(85, 105, 192, 0.2)', color: '#5569C0' }, // Slate Blue
        [Urgency.Medium]: { backgroundColor: 'rgba(245, 166, 35, 0.2)', color: '#F5A623' }, // Amber Glow
        [Urgency.High]: { backgroundColor: 'rgba(231, 76, 60, 0.2)', color: '#E74C3C' }, // Crimson Pulse
    };
    return (
        <span 
        className="px-2 py-0.5 text-xs font-semibold rounded-full"
        style={styles[urgency]}
        >
        {urgency.charAt(0).toUpperCase() + urgency.slice(1)}
        </span>
    );
};

// Task Item Component
const TaskItem: React.FC<{ task: TTask; calendars: TCalendar[]; onToggle: (id: string) => void; onEdit: (task: TTask) => void }> = ({ task, calendars, onToggle, onEdit }) => {
  const calendar = calendars.find(c => c.id === task.calendarId);

  return (
    <div className={`flex items-start gap-3 p-2 rounded-lg transition-all duration-300 ease-in-out hover:bg-[var(--bg-tertiary)] ${task.completed ? 'opacity-50' : 'opacity-100'}`}>
        <div className="w-1.5 self-stretch shrink-0 rounded-full" style={{backgroundColor: task.color}}></div>
        
        <div className="flex-grow cursor-pointer" onClick={() => onEdit(task)}>
            <div className="flex items-center justify-between gap-2">
                <span className={`transition-all duration-300 font-medium ${task.completed ? 'line-through' : ''}`} style={{color: task.completed ? 'var(--text-tertiary)' : 'var(--text-primary)'}}>
                    {task.name}
                </span>
                <div className="flex items-center gap-2 flex-shrink-0">
                    {task.urgency && <UrgencyTag urgency={task.urgency} />}
                    <button onClick={(e) => { e.stopPropagation(); onToggle(task.id); }} className={`w-5 h-5 rounded-md flex items-center justify-center border-2 transition-all duration-200 transform hover:scale-110`} style={{
                        backgroundColor: task.completed ? 'var(--accent-primary)' : 'transparent',
                        borderColor: task.completed ? 'var(--accent-primary)' : 'var(--text-tertiary)'
                    }}>
                        {task.completed && <i className="fa-solid fa-check text-xs" style={{color: 'var(--accent-text)'}}></i>}
                    </button>
                </div>
            </div>

            {calendar && (
                <p className="text-xs mt-1 flex items-center gap-1.5" style={{color: calendar.color, opacity: 0.8}}>
                    <i className="fa-solid fa-calendar-days text-xs"></i>
                    <span>{calendar.name}</span>
                </p>
            )}

            {task.description && <p className="text-sm mt-1" style={{color: 'var(--text-secondary)'}}>{task.description}</p>}
            
            {task.dueDate && 
                <p className="text-xs font-mono mt-1" style={{color: 'var(--text-tertiary)'}}>
                    Due: {dateFromYYYYMMDD(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </p>
            }
        </div>
    </div>
  );
};


// --- Main TodoPage Component ---

function TodoPage() {
  const { tasks, calendars, events, setTasks, activeAction, setActiveAction, calendarCategories, calendarOrder, calendarCategoryOrder } = useAppContext();
  const [selectedCalendarId, setSelectedCalendarId] = useState('overview');
  type SortType = 'default' | 'date' | 'alpha' | 'urgency' | 'modified' | 'created';
  const [sortBy, setSortBy] = useState<SortType>('default');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TTask | null>(null);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);

  useEffect(() => {
    if (activeAction === 'todo') {
      openAddTaskModal();
      setActiveAction(null);
    }
  }, [activeAction, setActiveAction]);

  const openAddTaskModal = () => {
    if (selectedCalendarId === 'overview') {
        const firstUserCalendar = calendars.find(c => c.id !== 'overview');
        if (firstUserCalendar) {
            setSelectedCalendarId(firstUserCalendar.id);
        } else {
            // No calendar to add to, so do nothing. Maybe add an alert later.
            return;
        }
    }
    setEditingTask(null);
    setIsModalOpen(true);
  };
  
  const openEditTaskModal = (task: TTask) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleSaveTask = (taskData: Partial<TTask>) => {
    const now = new Date().toISOString();
    if (taskData.id) { // Editing
      setTasks(prev => prev.map(t => t.id === taskData.id ? { ...t, ...taskData, updatedAt: now } as TTask : t));
    } else { // Adding
      const activeCalendarId = selectedCalendarId === 'overview' ? (calendars.find(c => c.id !== 'overview')?.id) : selectedCalendarId;
      if (!activeCalendarId) return; // Cannot add task if no user calendar exists

      const newTask: TTask = {
          name: 'Untitled Task',
          completed: false,
          color: calendars.find(c => c.id === activeCalendarId)?.color || '#f472b6',
          ...taskData,
          id: Date.now().toString(),
          calendarId: activeCalendarId,
          createdAt: now,
          updatedAt: now,
      } as TTask;
      setTasks(prev => [...prev, newTask]);
    }
    setIsModalOpen(false);
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    setIsModalOpen(false);
  }

  const toggleTask = (taskId: string) => {
    const now = new Date().toISOString();
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId ? { ...task, completed: !task.completed, updatedAt: now } : task
      )
    );
  };
  
  const handleClearCompleted = () => {
    setTasks(prev => prev.filter(t => !t.completed));
    setIsClearConfirmOpen(false);
  };

  const visibleTasks = useMemo(() => {
    if (selectedCalendarId === 'overview') return tasks;
    return tasks.filter(t => t.calendarId === selectedCalendarId);
  }, [tasks, selectedCalendarId]);
  
  const { uncheckedTasks, checkedTasks } = useMemo(() => ({
    uncheckedTasks: visibleTasks.filter(t => !t.completed),
    checkedTasks: visibleTasks.filter(t => t.completed),
  }), [visibleTasks]);

  const sortedUncheckedTasks = useMemo(() => {
    if (sortBy === 'default') return [];

    const urgencyRank = { [Urgency.High]: 3, [Urgency.Medium]: 2, [Urgency.Low]: 1 };
    const sorted = [...uncheckedTasks];

    switch (sortBy) {
        case 'date':
            sorted.sort((a, b) => {
                if (!a.dueDate && !b.dueDate) return 0;
                if (!a.dueDate) return 1;
                if (!b.dueDate) return -1;
                return a.dueDate.localeCompare(b.dueDate);
            });
            break;
        case 'alpha':
            sorted.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'urgency':
            sorted.sort((a, b) => (urgencyRank[b.urgency!] || 0) - (urgencyRank[a.urgency!] || 0));
            break;
        case 'modified':
            sorted.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
            break;
        case 'created':
            sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            break;
    }
    return sorted;
  }, [sortBy, uncheckedTasks]);

  const sortedCheckedTasks = useMemo(() => {
    return [...checkedTasks].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [checkedTasks]);

  const groupAndSortTasks = (tasksToProcess: TTask[]): { id: string; event: TEvent | null; tasks: TTask[] }[] => {
    type TaskGroup = { id: string; event: TEvent | null; tasks: TTask[] };
    const groups: { [key: string]: TaskGroup } = {};

    tasksToProcess.forEach(task => {
        const groupId = task.eventId || 'general';
        if (!groups[groupId]) {
            const event = task.eventId ? events.find(e => e.id === task.eventId) || null : null;
            groups[groupId] = { id: groupId, event, tasks: [] };
        }
        groups[groupId].tasks.push(task);
    });
    
    const allGroupsAsArray = Object.values(groups);

    const urgencyRank = { [Urgency.High]: 3, [Urgency.Medium]: 2, [Urgency.Low]: 1 };
    allGroupsAsArray.forEach(group => {
        group.tasks.sort((a, b) => (urgencyRank[b.urgency!] || 0) - (urgencyRank[a.urgency!] || 0));
    });

    return allGroupsAsArray;
  };

  const groupedUncheckedTasks = useMemo(() => groupAndSortTasks(uncheckedTasks), [uncheckedTasks, events]);
  
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
  
  const sortOptions = [
    { value: 'default', label: 'Default Grouping' },
    { value: 'date', label: 'Sort by Due Date' },
    { value: 'alpha', label: 'Sort by Name (A-Z)' },
    { value: 'urgency', label: 'Sort by Urgency' },
    { value: 'modified', label: 'Sort by Last Modified' },
    { value: 'created', label: 'Sort by Date Created' },
  ];

  const renderTaskGroups = (groups: { id: string; event: TEvent | null; tasks: TTask[] }[]) => (
    groups.map(({ id, event, tasks: groupTasks }) => {
        if (groupTasks.length === 0) return null;
        const isGeneralGroup = id === 'general';
        let headerColor = 'var(--text-primary)';
        let headerText = 'General Tasks';

        if (!isGeneralGroup) {
            headerText = event?.name || 'Linked Tasks';
            if (event) {
                headerColor = selectedCalendarId === 'overview' ? (calendars.find(c => c.id === event.calendarId)?.color || event.color) : event.color;
            } else {
                headerColor = 'var(--text-tertiary)';
            }
        }
        return (
            <div key={id} className="rounded-xl p-4" style={{backgroundColor: 'var(--bg-secondary)'}}>
                <h3 className="text-lg font-bold mb-2" style={{ color: headerColor }}>{headerText}</h3>
                <div className="space-y-1">
                    {groupTasks.map(task => <TaskItem key={task.id} task={task} calendars={calendars} onToggle={toggleTask} onEdit={openEditTaskModal} />)}
                </div>
            </div>
        );
    })
  );


  return (
    <div className="pb-20">
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-2">
            <CustomSelect 
                options={calendarOptions}
                value={selectedCalendarId}
                onChange={setSelectedCalendarId}
            />
             <CustomSelect
                options={sortOptions}
                value={sortBy}
                onChange={(v) => setSortBy(v as SortType)}
            />
        </div>
        
        <div className="space-y-4">
            {uncheckedTasks.length > 0 && <h2 className="text-xl font-bold" style={{color: 'var(--accent-primary)'}}>Pending</h2>}
            {uncheckedTasks.length === 0 ? (
                <div className="text-center py-10 rounded-lg" style={{backgroundColor: 'var(--bg-secondary)'}}>
                    <i className="fa-solid fa-check-double text-4xl mb-3" style={{color: 'var(--text-tertiary)'}}></i>
                </div>
            ) : sortBy === 'default' ? (
                 renderTaskGroups(groupedUncheckedTasks)
            ) : (
                <div className="rounded-xl p-4 space-y-1" style={{backgroundColor: 'var(--bg-secondary)'}}>
                    {sortedUncheckedTasks.map(task => <TaskItem key={task.id} task={task} calendars={calendars} onToggle={toggleTask} onEdit={openEditTaskModal} />)}
                </div>
            )}
        </div>

        {sortedCheckedTasks.length > 0 && (
            <div className="space-y-4">
                 <div className="w-full h-px my-4" style={{backgroundColor: 'var(--border-color)'}}></div>
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold" style={{color: 'var(--accent-primary)'}}>Completed ({checkedTasks.length})</h2>
                    <button onClick={() => setIsClearConfirmOpen(true)} className="btn btn-danger btn-icon" aria-label="Clear completed tasks">
                        <i className="fa-solid fa-broom"></i>
                    </button>
                </div>
                <div className="rounded-xl p-4 space-y-1" style={{backgroundColor: 'var(--bg-secondary)'}}>
                    {sortedCheckedTasks.map(task => <TaskItem key={task.id} task={task} calendars={calendars} onToggle={toggleTask} onEdit={openEditTaskModal} />)}
                </div>
            </div>
        )}
      </div>

      <TaskFormModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
        initialData={editingTask || { calendarId: selectedCalendarId }}
      />
      
      <Modal isOpen={isClearConfirmOpen} onClose={() => setIsClearConfirmOpen(false)} title="Are you sure">
            <div className="text-center">
                <p className="mb-4" style={{color: 'var(--text-secondary)'}}>Do you want to permanently delete all completed tasks?</p>
                <div className="pt-2">
                    <button onClick={handleClearCompleted} className="w-full btn btn-danger">Yes</button>
                </div>
            </div>
        </Modal>
    </div>
  );
}

export default TodoPage;