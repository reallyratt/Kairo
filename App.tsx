import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useAppContext } from './context/AppContext';
import BottomNav from './components/BottomNav';
import CalendarPage from './pages/CalendarPage';
import TodoPage from './pages/TodoPage';
import HabitPage from './pages/HabitPage';
import FinancePage from './pages/FinancePage';
import NotesPage from './pages/NotesPage';
import AboutOverlay from './components/AboutOverlay';
import DataOverlay from './components/DataOverlay';
import SettingsOverlay from './components/SettingsOverlay';

const AppContent = () => {
  const { isAboutOpen, setIsAboutOpen, isDataOpen, setIsDataOpen, isSettingsOpen, setIsSettingsOpen } = useAppContext();

  return (
    <div className="flex flex-col h-screen font-sans max-w-md mx-auto shadow-2xl" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', boxShadow: `0 0 30px 5px var(--shadow-color)`}}>
      <main className="flex-grow overflow-y-auto pb-24">
        <Routes>
          <Route path="/" element={<Navigate to="/calendar" replace />} />
          <Route path="/notes" element={<NotesPage />} />
          <Route path="/todo" element={<TodoPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/habit" element={<HabitPage />} />
          <Route path="/finance" element={<FinancePage />} />
        </Routes>
      </main>
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