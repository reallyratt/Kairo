import React from 'react';
import { useAppContext, useTranslation } from '../context/AppContext';

interface HeaderProps {
  titleKey: string;
}

function Header({ titleKey }: HeaderProps) {
  const { setIsSettingsOpen } = useAppContext();
  const { t } = useTranslation();

  return (
    <header className="flex items-center justify-between h-16 px-4">
      <h1 className="text-xl font-bold tracking-wider" style={{ color: 'var(--accent-primary)'}}>{t(titleKey)}</h1>
      <button onClick={() => setIsSettingsOpen(true)} className="btn btn-secondary btn-icon">
          <i className="fa-solid fa-sliders"></i>
      </button>
    </header>
  );
}

export default Header;