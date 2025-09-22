



import React, { useRef, useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AppProvider, useAppContext, ActivePage } from './context/AppContext';
import BottomNav from './components/BottomNav';
import CalendarPage from './pages/CalendarPage';
import TodoPage from './pages/TodoPage';
import NotesPage from './pages/NotesPage';
import AboutOverlay from './components/AboutOverlay';
import DataOverlay from './components/DataOverlay';
import SettingsOverlay from './components/SettingsOverlay';

// --- Floating Action Button Component ---
const speedDialActions: { action: ActivePage, icon: string, label: string }[] = [
    { action: 'notes', icon: 'fa-note-sticky', label: 'Note' },
    { action: 'todo', icon: 'fa-list-check', label: 'Task' },
    { action: 'calendar', icon: 'fa-calendar-days', label: 'Event' },
];

const FloatingActionButton: React.FC<{ isVisible: boolean; onActionClick: (action: ActivePage) => void }> = ({ isVisible, onActionClick }) => {
    const [isOpen, setIsOpen] = useState(false);
    const fabRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (fabRef.current && !fabRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleActionClick = (action: ActivePage) => {
        onActionClick(action);
        setIsOpen(false);
    };

    const fabBaseClass = "absolute bottom-20 right-4 z-30 transition-all duration-300 ease-in-out flex flex-col items-end";
    const fabVisibleClass = "transform scale-100 opacity-100";
    const fabHiddenClass = "transform scale-50 opacity-0 pointer-events-none";

    return (
        <div ref={fabRef} className={`${fabBaseClass} ${isVisible ? fabVisibleClass : fabHiddenClass}`}>
             {/* Speed Dial Menu Items */}
             <div 
                className={`flex flex-col items-end space-y-3 mb-4 transition-opacity duration-500 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            >
                {speedDialActions.map((item, index) => (
                    <div 
                        key={item.action} 
                        className="flex items-center transition-all duration-200 ease-out group mr-2"
                        style={{ 
                            transform: isOpen ? 'translateY(0)' : 'translateY(20px)',
                            opacity: isOpen ? 1 : 0,
                            transitionDelay: `${isOpen ? (speedDialActions.length - 1 - index) * 40 : index * 40}ms`,
                         }}
                    >
                         <span className="mr-4 px-3 py-1 rounded-md text-sm font-semibold shadow-lg whitespace-nowrap transition-colors duration-200 group-hover:text-fuchsia-300" style={{backgroundColor: 'var(--bg-tertiary)'}}>
                            Add {item.label}
                        </span>
                        <button
                            onClick={() => handleActionClick(item.action)}
                            className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg transform transition-transform hover:scale-110 transition-colors group-hover:text-fuchsia-300"
                            style={{ 
                                backgroundColor: 'var(--bg-tertiary)',
                            }}
                            aria-label={`Add ${item.label}`}
                        >
                            <i className={`fa-solid ${item.icon} text-lg`}></i>
                        </button>
                    </div>
                ))}
            </div>

            {/* Main FAB */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ease-in-out transform hover:scale-110"
                style={{
                    backgroundColor: 'var(--accent-primary)',
                    color: 'var(--accent-text)',
                    transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
                    boxShadow: `0 0 15px 2px var(--accent-primary)`
                }}
                aria-label="Open add menu"
                aria-expanded={isOpen}
            >
                <i className="fa-solid fa-plus text-3xl"></i>
            </button>
        </div>
    );
};


const AppContent = () => {
  const { isAboutOpen, setIsAboutOpen, isDataOpen, setIsDataOpen, isSettingsOpen, setIsSettingsOpen, setActiveAction } = useAppContext();
  const mainRef = useRef<HTMLElement>(null);
  const lastScrollY = useRef(0);
  const [isFabVisible, setIsFabVisible] = useState(true);
  const navigate = useNavigate();

  const handleFabActionClick = (action: ActivePage) => {
    navigate(`/${action}`);
    setActiveAction(action);
  };

  // Scroll handler to show/hide FAB
  const handleScroll = () => {
    if (mainRef.current) {
      const currentScrollY = mainRef.current.scrollTop;
      // Hide if scrolling down past a threshold to avoid hiding on small scrolls
      if (currentScrollY > lastScrollY.current && currentScrollY > 50) {
        setIsFabVisible(false);
      } else {
        setIsFabVisible(true);
      }
      lastScrollY.current = currentScrollY <= 0 ? 0 : currentScrollY; // For Mobile or negative scrolling
    }
  };

  useEffect(() => {
    const mainEl = mainRef.current;
    if (mainEl) {
      mainEl.addEventListener('scroll', handleScroll, { passive: true });
      return () => {
        mainEl.removeEventListener('scroll', handleScroll);
      };
    }
  }, []);

  return (
    <div className="flex flex-col h-screen font-sans max-w-md mx-auto shadow-2xl" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', boxShadow: `0 0 30px 5px var(--shadow-color)`}}>
      <main ref={mainRef} className="flex-grow overflow-y-auto pb-24">
        <Routes>
          <Route path="/" element={<Navigate to="/calendar" replace />} />
          <Route path="/notes" element={<NotesPage />} />
          <Route path="/todo" element={<TodoPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
        </Routes>
      </main>
      <FloatingActionButton isVisible={isFabVisible} onActionClick={handleFabActionClick} />
      <BottomNav />
      <AboutOverlay isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
      <DataOverlay isOpen={isDataOpen} onClose={() => setIsDataOpen(false)} />
      <SettingsOverlay isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}


function App() {
  return (
    <AppProvider>
      <HashRouter>
        <AppContent />
      </HashRouter>
    </AppProvider>
  );
}

export default App;