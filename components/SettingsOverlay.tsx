import React, { useState, useEffect } from 'react';
import { useAppContext, useTranslation, Language, Theme } from '../context/AppContext';
import CustomSelect from './CustomSelect';

interface SettingsOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsOverlay: React.FC<SettingsOverlayProps> = ({ isOpen, onClose }) => {
  const { language, setLanguage, theme, setTheme } = useAppContext();
  const { t } = useTranslation();
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  
  useEffect(() => {
    if (isOpen) {
      setIsAnimatingOut(false);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsAnimatingOut(true);
    setTimeout(onClose, 300); // Match animation duration
  };

  if (!isOpen) {
    return null;
  }
  
  const animationClass = isAnimatingOut ? 'animate-slide-out' : 'animate-slide-in';

  const languageOptions = [
    { value: 'en', label: 'English' },
    { value: 'id', label: 'Bahasa Indonesia' },
    { value: 'tlh', label: 'Klingon' }
  ];

  const themeOptions: { id: Theme; labelKey: string; icon: string }[] = [
      { id: 'dark', labelKey: 'settings.dark', icon: 'fa-moon' },
      { id: 'light', labelKey: 'settings.light', icon: 'fa-sun' },
      { id: 'cute', labelKey: 'settings.cute', icon: 'fa-heart' },
      { id: 'monochrome', labelKey: 'settings.monochrome', icon: 'fa-palette' },
  ];

  return (
    <div className={`fixed inset-0 bg-slate-950 z-50 ${animationClass}`} style={{ backgroundColor: 'var(--bg-primary)'}}>
      <div className="p-6 text-slate-300 leading-relaxed overflow-y-auto h-full" style={{ color: 'var(--text-primary)'}}>
        <h1 className="text-3xl font-bold text-fuchsia-400 mb-6 font-serif" style={{ color: 'var(--accent-primary)'}}>{t('header.settings')}</h1>
        
        <div className="space-y-6">
            {/* Language Settings */}
            <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)'}}>{t('settings.language')}</h2>
                <CustomSelect
                    options={languageOptions}
                    value={language}
                    onChange={(val) => setLanguage(val as Language)}
                />
            </div>

            {/* Theme Settings */}
            <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)'}}>{t('settings.theme')}</h2>
                <div className="grid grid-cols-2 gap-2">
                    {themeOptions.map(themeOption => (
                        <button 
                            key={themeOption.id}
                            onClick={() => setTheme(themeOption.id)}
                            className={`py-2 rounded-md font-semibold transition-all transform hover:scale-105 active:scale-95 ${theme === themeOption.id ? 'text-white' : ''}`}
                            style={{
                                backgroundColor: theme === themeOption.id ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                                color: theme === themeOption.id ? 'var(--accent-text)' : 'var(--text-primary)'
                            }}
                        >
                            <i className={`fa-solid ${themeOption.icon} mr-2`}></i>{t(themeOption.labelKey)}
                        </button>
                    ))}
                </div>
            </div>
        </div>

        <div className="mt-12 text-center pb-8">
          <button onClick={handleClose} className="btn btn-primary px-8 py-3 text-lg">
            <i className="fa-solid fa-arrow-left mr-2"></i>
            {t('settings.back')}
          </button>
        </div>
      </div>
      <style>{`
        @keyframes slide-in-from-right {
            0% { transform: translateX(100%); }
            100% { transform: translateX(0); }
        }
        @keyframes slide-out-to-right {
            0% { transform: translateX(0); }
            100% { transform: translateX(100%); }
        }
        .animate-slide-in {
            animation: slide-in-from-right 0.3s ease-out forwards;
        }
        .animate-slide-out {
            animation: slide-out-to-right 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

export default SettingsOverlay;