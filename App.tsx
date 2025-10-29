import React, { useRef, useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppProvider, useAppContext, ActivePage } from './context/AppContext';
import BottomNav from './components/BottomNav';
import CalendarPage from './pages/CalendarPage';
import TodoPage from './pages/TodoPage';
import NotesPage from './pages/NotesPage';
import AboutOverlay from './components/AboutOverlay';
import DataOverlay from './components/DataOverlay';
import SettingsOverlay from './components/SettingsOverlay';

// --- Floating Action Button Component ---
const FloatingActionButton: React.FC<{ isVisible: boolean; onClick: () => void }> = ({ isVisible, onClick }) => {
    const fabBaseClass = "absolute bottom-20 right-4 z-30 transition-opacity duration-300 ease-in-out";
    const fabVisibleClass = "opacity-100";
    const fabHiddenClass = "opacity-0 pointer-events-none";

    return (
        <div className={`${fabBaseClass} ${isVisible ? fabVisibleClass : fabHiddenClass}`}>
            <button
                onClick={onClick}
                className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-transform duration-200 ease-in-out transform hover:scale-110"
                style={{
                    backgroundColor: 'var(--accent-primary)',
                    color: 'var(--accent-text)',
                    boxShadow: `0 0 15px 2px var(--accent-primary)`
                }}
                aria-label="Add new item"
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
  const location = useLocation();

  const handleFabClick = () => {
    const page = location.pathname.slice(1);
    if (page === 'notes' || page === 'todo' || page === 'calendar') {
        setActiveAction(page as ActivePage);
    }
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
      <FloatingActionButton isVisible={isFabVisible} onClick={handleFabClick} />
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