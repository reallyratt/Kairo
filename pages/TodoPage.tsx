
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useAppContext, useTranslation } from '../context/AppContext';
import { TTask, TEvent, Urgency, TCalendar, TCalendarCategory, TTaskGroup } from '../types';
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

            {task.description && <p className="text-sm mt-1" style={{color: 'var(--text-secondary)'}}>{task.description}</p>}
            
            <div className="flex items-center gap-2 mt-2 text-xs">
                 <div className="w-3 h-3 rounded-full" style={{ backgroundColor: task.color }}></div>
            </div>

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
  const { tasks, calendars, events, setTasks, activeAction, setActiveAction, calendarCategories, calendarOrder, calendarCategoryOrder, taskGroups } = useAppContext();
  const [selectedCalendarId, setSelectedCalendarId] = useState('overview');
  type SortType = 'default' | 'date' | 'alpha' | 'urgency' | 'modified' | 'created';
  const [sortBy, setSortBy] = useState<SortType>('default');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TTask | null>(null);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const sortMenuRef = useRef<HTMLDivElement>(null);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  const { t } = useTranslation();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target as Node)) {
        setIsSortMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [sortMenuRef]);

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

  const toggleCollapse = (id: string) => {
    setCollapsedSections(prev => {
        const newSet = new Set(prev);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        return newSet;
    });
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

  const groupAndSortTasks = (tasksToProcess: TTask[]): { id: string; event: TEvent | null; taskGroup: TTaskGroup | null; tasks: TTask[] }[] => {
    type TaskGroupContainer = { id: string; event: TEvent | null; taskGroup: TTaskGroup | null; tasks: TTask[] };
    const groups: { [key: string]: TaskGroupContainer } = {};

    tasksToProcess.forEach(task => {
        const groupId = task.eventId || (task.taskGroupId ? `group-${task.taskGroupId}` : 'general');
        if (!groups[groupId]) {
            const event = task.eventId ? events.find(e => e.id === task.eventId) || null : null;
            const taskGroup = task.taskGroupId ? taskGroups.find(tg => tg.id === task.taskGroupId) || null : null;
            groups[groupId] = { id: groupId, event, tasks: [], taskGroup };
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

  const groupedUncheckedTasks = useMemo(() => groupAndSortTasks(uncheckedTasks), [uncheckedTasks, events, taskGroups]);
  const groupedCheckedTasks = useMemo(() => groupAndSortTasks(checkedTasks), [checkedTasks, events, taskGroups]);
  
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
    { value: 'default', label: t('todo.default') },
    { value: 'date', label: t('todo.sortByDate') },
    { value: 'alpha', label: t('todo.sortByName') },
    { value: 'urgency', label: t('todo.sortByUrgency') },
    { value: 'modified', label: t('todo.sortByModified') },
    { value: 'created', label: t('todo.sortByCreated') },
  ];

  const renderTaskGroups = (groups: { id: string; event: TEvent | null; taskGroup: TTaskGroup | null; tasks: TTask[] }[]) => (
    groups.map(({ id, event, taskGroup, tasks: groupTasks }) => {
        if (groupTasks.length === 0) return null;
        
        const isCollapsed = collapsedSections.has(id);

        let headerColor = 'var(--text-primary)';
        let headerText = t('todo.generalTasks');

        if (event) {
            headerText = event.name || t('todo.linkedTasks');
            headerColor = selectedCalendarId === 'overview' ? (calendars.find(c => c.id === event.calendarId)?.color || event.color) : event.color;
        } else if (taskGroup) {
            headerText = taskGroup.name;
            headerColor = taskGroup.color || 'var(--text-primary)';
        }

        return (
            <div key={id} className="rounded-xl p-4" style={{backgroundColor: 'var(--bg-secondary)'}}>
                <button onClick={() => toggleCollapse(id)} className="w-full flex justify-between items-center text-left">
                  <h3 className="text-lg font-bold" style={{ color: headerColor }}>{headerText}</h3>
                  <i className={`fa-solid fa-chevron-down transition-transform duration-200 ${isCollapsed ? 'rotate-180' : ''}`} style={{color: 'var(--text-tertiary)'}}></i>
                </button>
                <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isCollapsed ? 'max-h-0 opacity-0 pt-0' : 'max-h-screen opacity-100 pt-2'}`}>
                  <div className="space-y-1">
                      {groupTasks.map(task => <TaskItem key={task.id} task={task} calendars={calendars} onToggle={toggleTask} onEdit={openEditTaskModal} />)}
                  </div>
                </div>
            </div>
        );
    })
  );


  return (
    <div className="pb-20">
      <div className="px-4 pt-2 flex items-center gap-2">
          <CustomSelect 
              options={calendarOptions}
              value={selectedCalendarId}
              onChange={setSelectedCalendarId}
              className="flex-grow"
          />
          <div className="relative" ref={sortMenuRef}>
            <button onClick={() => setIsSortMenuOpen(prev => !prev)} className="btn btn-secondary btn-icon">
              <i className="fa-solid fa-sort"></i>
            </button>
            {isSortMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-lg shadow-xl py-1 z-30 animate-dropdown-in" style={{ backgroundColor: 'var(--bg-quaternary)' }}>
                {sortOptions.map(opt => (
                  <button 
                    key={opt.value} 
                    onClick={() => { setSortBy(opt.value as SortType); setIsSortMenuOpen(false); }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-[rgba(var(--accent-primary-rgb),0.2)]"
                    style={{color: sortBy === opt.value ? 'var(--accent-primary)' : 'var(--text-primary)'}}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="space-y-4">
            {uncheckedTasks.length > 0 && (
              <button onClick={() => toggleCollapse('pending')} className="w-full flex justify-between items-center text-left">
                <h2 className="text-xl font-bold" style={{color: 'var(--accent-primary)'}}>{t('todo.pending')}</h2>
                <i className={`fa-solid fa-chevron-down transition-transform duration-200 ${collapsedSections.has('pending') ? 'rotate-180' : ''}`} style={{color: 'var(--text-tertiary)'}}></i>
              </button>
            )}

            <div className={`transition-all duration-500 ease-in-out overflow-hidden ${collapsedSections.has('pending') ? 'max-h-0 opacity-0' : 'max-h-[5000px] opacity-100'}`}>
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
        </div>

        {checkedTasks.length > 0 && (
            <div className="space-y-4">
                 <div className="w-full h-px my-4" style={{backgroundColor: 'var(--border-color)'}}></div>
                <div className="flex justify-between items-center">
                    <button onClick={() => toggleCollapse('completed')} className="w-full flex justify-between items-center text-left">
                      <h2 className="text-xl font-bold" style={{color: 'var(--accent-primary)'}}>{t('todo.completed', { count: checkedTasks.length })}</h2>
                      <div className="flex items-center gap-2">
                          <button onClick={(e) => { e.stopPropagation(); setIsClearConfirmOpen(true); }} className="btn btn-danger btn-icon" aria-label={t('todo.clearCompleted')}>
                              <i className="fa-solid fa-broom"></i>
                          </button>
                          <i className={`fa-solid fa-chevron-down transition-transform duration-200 ${collapsedSections.has('completed') ? 'rotate-180' : ''}`} style={{color: 'var(--text-tertiary)'}}></i>
                      </div>
                    </button>
                </div>
                 <div className={`transition-all duration-500 ease-in-out overflow-hidden ${collapsedSections.has('completed') ? 'max-h-0 opacity-0' : 'max-h-[5000px] opacity-100'}`}>
                    <div className="space-y-4">
                      {renderTaskGroups(groupedCheckedTasks)}
                    </div>
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
