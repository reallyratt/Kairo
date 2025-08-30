import React, { useState, useMemo } from 'react';
import { useAppContext, useTranslation } from '../context/AppContext';
import { TTask, TEvent, Urgency } from '../types';
import Header from '../components/Header';
import { dateFromYYYYMMDD } from '../utils';
import TaskFormModal from '../components/TaskFormModal';
import CustomSelect from '../components/CustomSelect';

// --- Sub-components for TodoPage ---

// Urgency Tag Component
const UrgencyTag: React.FC<{ urgency: Urgency }> = ({ urgency }) => {
  const styles = {
    [Urgency.Low]: 'bg-cyan-500/20 text-cyan-400',
    [Urgency.Medium]: 'bg-yellow-500/20 text-yellow-400',
    [Urgency.High]: 'bg-red-500/20 text-red-400',
  };
  return (
    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${styles[urgency]}`}>
      {urgency.charAt(0).toUpperCase() + urgency.slice(1)}
    </span>
  );
};

// Task Item Component
const TaskItem: React.FC<{ task: TTask; onToggle: (id: string) => void; onEdit: (task: TTask) => void }> = ({ task, onToggle, onEdit }) => {
  return (
    // FIX: Cast style object to React.CSSProperties to allow custom CSS properties.
    <div className={`flex items-start gap-3 p-2 rounded-lg transition-all duration-300 ease-in-out hover:bg-slate-800/50 ${task.completed ? 'opacity-50 scale-[0.98]' : 'opacity-100 scale-100'}`} style={{'--tw-hover-bg-opacity': 0.5, '--tw-hover-bg': 'var(--bg-tertiary)'} as React.CSSProperties}>
        <div className="w-1.5 self-stretch shrink-0 rounded-full" style={{backgroundColor: task.color}}></div>
        
        <div className="flex-grow cursor-pointer" onClick={() => onEdit(task)}>
            <div className="flex items-center justify-between gap-2">
                <span className={`transition-all duration-300 ${task.completed ? 'line-through text-slate-500' : 'text-slate-100 font-medium'}`} style={{color: task.completed ? 'var(--text-tertiary)' : 'var(--text-primary)'}}>
                    {task.name}
                </span>
                {task.urgency && <UrgencyTag urgency={task.urgency} />}
            </div>
            {task.description && <p className="text-sm mt-1" style={{color: 'var(--text-secondary)'}}>{task.description}</p>}
            {task.dueDate && 
                <p className="text-xs font-mono mt-1" style={{color: 'var(--text-tertiary)'}}>
                    Due: {dateFromYYYYMMDD(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </p>
            }
        </div>
        
        <div className="flex-shrink-0 pt-1">
            <button onClick={(e) => { e.stopPropagation(); onToggle(task.id); }} className={`w-5 h-5 rounded-md flex items-center justify-center border-2 transition-all duration-200 transform hover:scale-110`} style={{
                backgroundColor: task.completed ? 'var(--accent-primary)' : 'transparent',
                borderColor: task.completed ? 'var(--accent-primary)' : 'var(--text-tertiary)'
            }}>
                {task.completed && <i className="fa-solid fa-check text-xs" style={{color: 'var(--accent-text)'}}></i>}
            </button>
        </div>
    </div>
  );
};


// --- Main TodoPage Component ---

function TodoPage() {
  const { tasks, calendars, events, setTasks } = useAppContext();
  const { t } = useTranslation();
  const [selectedCalendarId, setSelectedCalendarId] = useState('overview');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TTask | null>(null);

  const openAddTaskModal = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };
  
  const openEditTaskModal = (task: TTask) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleSaveTask = (taskData: Partial<TTask>) => {
    if (taskData.id) { // Editing
      setTasks(prev => prev.map(t => t.id === taskData.id ? { ...t, ...taskData } as TTask : t));
    } else { // Adding
      if (selectedCalendarId === 'overview') return;
      const newTask: TTask = {
          name: 'Untitled Task',
          completed: false,
          color: calendars.find(c => c.id === selectedCalendarId)?.color || '#f472b6',
          ...taskData,
          id: Date.now().toString(),
          calendarId: selectedCalendarId,
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
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const visibleTasks = useMemo(() => {
    if (selectedCalendarId === 'overview') return tasks;
    return tasks.filter(t => t.calendarId === selectedCalendarId);
  }, [tasks, selectedCalendarId]);

  const allSortedGroups = useMemo(() => {
    type TaskGroup = {
      id: string;
      event: TEvent | null;
      tasks: TTask[];
    };
    
    const groups: { [key: string]: TaskGroup } = {}; // key is eventId or 'general'

    visibleTasks.forEach(task => {
      const groupId = task.eventId || 'general';
      if (!groups[groupId]) {
        const event = task.eventId ? events.find(e => e.id === task.eventId) || null : null;
        groups[groupId] = { id: groupId, event, tasks: [] };
      }
      groups[groupId].tasks.push(task);
    });

    const allGroupsAsArray = Object.values(groups);

    // Sort tasks within each group (completed to bottom)
    allGroupsAsArray.forEach(group => {
      group.tasks.sort((a, b) => (a.completed ? 1 : 0) - (b.completed ? 1 : 0));
    });

    // Sort groups themselves (all-completed groups to bottom)
    allGroupsAsArray.sort((a, b) => {
      const allACompleted = a.tasks.length > 0 && a.tasks.every(t => t.completed);
      const allBCompleted = b.tasks.length > 0 && b.tasks.every(t => t.completed);
      return (allACompleted ? 1 : 0) - (allBCompleted ? 1 : 0);
    });

    return allGroupsAsArray;
  }, [visibleTasks, events]);
  
  const calendarOptions = calendars.map(cal => ({ value: cal.id, label: cal.name }));

  return (
    <div>
      <Header titleKey="header.todo" />
      <div className="p-4 space-y-6">
        {/* Calendar Selector */}
        <CustomSelect 
            options={calendarOptions}
            value={selectedCalendarId}
            onChange={setSelectedCalendarId}
        />

        {/* Add Task Button */}
        {selectedCalendarId !== 'overview' && (
            <div className="text-center">
                <button onClick={openAddTaskModal} className="btn btn-primary w-full max-w-xs">
                    <i className="fa-solid fa-plus mr-2"></i>
                    {t('todo.add')}
                </button>
            </div>
        )}

        {/* Task Groups */}
        {allSortedGroups.length === 0 && (
          <div className="text-center py-10 bg-slate-900 rounded-lg" style={{backgroundColor: 'var(--bg-secondary)'}}>
            <i className="fa-solid fa-check-double text-4xl mb-3" style={{color: 'var(--text-tertiary)'}}></i>
            <p style={{color: 'var(--text-secondary)'}}>No tasks here. Great job!</p>
          </div>
        )}

        {allSortedGroups.map(({ id, event, tasks: groupTasks }) => {
            if (groupTasks.length === 0) return null;

            const isGeneralGroup = id === 'general';
            
            let headerColor = 'var(--text-primary)';
            let headerText = 'General Tasks';

            if (!isGeneralGroup) {
                headerText = event?.name || 'Linked Tasks';
                if (event) {
                    if (selectedCalendarId === 'overview') {
                        const cal = calendars.find(c => c.id === event.calendarId);
                        headerColor = cal?.color || event.color;
                    } else {
                        headerColor = event.color;
                    }
                } else {
                    headerColor = 'var(--text-tertiary)';
                }
            }

            return (
                <div key={id} className="bg-slate-900 rounded-xl p-4" style={{backgroundColor: 'var(--bg-secondary)'}}>
                    <h3 className="text-lg font-bold mb-2" style={{ color: headerColor }}>{headerText}</h3>
                    <div className="space-y-1">
                        {groupTasks.map(task => <TaskItem key={task.id} task={task} onToggle={toggleTask} onEdit={openEditTaskModal} />)}
                    </div>
                </div>
            );
        })}
      </div>

      <TaskFormModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
        initialData={editingTask || { calendarId: selectedCalendarId }}
      />
    </div>
  );
}

export default TodoPage;