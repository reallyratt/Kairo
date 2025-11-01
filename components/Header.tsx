import React, { useState, useRef, useEffect } from 'react';
import { useAppContext, useTranslation } from '../context/AppContext';

interface HeaderProps {
  titleKey: string;
}

function Header({ titleKey }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { setIsAboutOpen, setIsDataOpen, setIsSettingsOpen } = useAppContext();
  const { t } = useTranslation();
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuRef]);
  
  const handleAboutClick = () => {
    setIsAboutOpen(true);
    setMenuOpen(false);
  }

  const handleDataClick = () => {
    setIsDataOpen(true);
    setMenuOpen(false);
  }

  const handleSettingsClick = () => {
    setIsSettingsOpen(true);
    setMenuOpen(false);
  }

  return (
    <header className="flex items-center justify-between h-16 px-4">
      <h1 className="text-2xl font-bold tracking-wider" style={{ color: 'var(--accent-primary)'}}>{t(titleKey)}</h1>
      <div className="relative" ref={menuRef}>
        <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 rounded-full hover:bg-[var(--bg-quaternary)] transition-all transform hover:scale-110 active:scale-95" style={{ color: 'var(--text-secondary)',
    backgroundColor: 'var(--bg-tertiary)'}}>
          <i className="fa-solid fa-sliders text-lg"></i>
        </button>
        {menuOpen && (
          <div className="absolute right-0 mt-2 w-48 rounded-lg shadow-xl py-1 z-50 transform origin-top-right animate-fade-in-down" style={{ backgroundColor: 'var(--bg-quaternary)' }}>
            <button onClick={handleSettingsClick} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm header-menu-item transition-colors" style={{ color: 'var(--text-primary)'}}>
              <i className="fa-solid fa-gear w-5 text-center"></i>
              <span>{t('header.settings')}</span>
            </button>
            <button onClick={handleDataClick} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm header-menu-item transition-colors" style={{ color: 'var(--text-primary)'}}>
              <i className="fa-solid fa-database w-5 text-center"></i>
              <span>Data</span>
            </button>
            <button onClick={handleAboutClick} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm header-menu-item transition-colors" style={{ color: 'var(--text-primary)'}}>
              <i className="fa-solid fa-circle-info w-5 text-center"></i>
              <span>About</span>
            </button>
          </div>
        )}
      </div>
      <style>{`
        @keyframes fade-in-down {
            0% { opacity: 0; transform: translateY(-5px) scale(0.95); }
            100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-fade-in-down {
            animation: fade-in-down 0.1s ease-out forwards;
        }
        .header-menu-item:hover {
            background-color: rgba(var(--accent-primary-rgb), 0.2);
        }
      `}</style>
    </header>
  );
}

export default Header;