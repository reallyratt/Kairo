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
  const [isAboutExpanded, setIsAboutExpanded] = useState(false);
  
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
  ];

  return (
    <div className={`fixed inset-0 bg-slate-950 z-50 ${animationClass}`} style={{ backgroundColor: 'var(--bg-primary)'}}>
      <div className="p-6 text-slate-300 leading-relaxed overflow-y-auto h-full" style={{ color: 'var(--text-primary)'}}>
        <div className="flex items-center mb-6">
            <button onClick={handleClose} className="btn btn-secondary btn-icon mr-4" aria-label={t('settings.back')}>
                <i className="fa-solid fa-arrow-left"></i>
            </button>
            <h1 className="text-3xl font-bold text-fuchsia-400 font-serif" style={{ color: 'var(--accent-primary)'}}>{t('header.settings')}</h1>
        </div>
        
        <div className="space-y-4">
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

            {/* Sync to Cloud */}
            <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)', opacity: 0.7 }}>
                <h2 className="text-lg font-semibold text-slate-100 mb-2" style={{ color: 'var(--text-primary)' }}>{t('settings.sync')}</h2>
                <p className="text-sm text-slate-400 mb-4" style={{ color: 'var(--text-secondary)' }}>{t('settings.syncDesc')}</p>
                <button disabled className="w-full btn btn-secondary cursor-not-allowed">
                    <i className="fa-solid fa-cloud mr-2"></i>
                    {t('settings.syncBtn')}
                </button>
            </div>
            
            {/* About Section */}
            <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <button
                    onClick={() => setIsAboutExpanded(!isAboutExpanded)}
                    className="w-full text-left flex justify-between items-center"
                    aria-expanded={isAboutExpanded}
                >
                    <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{t('settings.aboutTitle')}</h2>
                    <i className={`fa-solid fa-chevron-down transition-transform duration-300 ${isAboutExpanded ? 'rotate-180' : ''}`} style={{ color: 'var(--text-secondary)' }}></i>
                </button>
                <div
                    className="transition-all duration-500 ease-in-out overflow-hidden"
                    style={{ maxHeight: isAboutExpanded ? '1000px' : '0px' }}
                >
                    <div className="pt-4 space-y-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        <p>Kairo is an all-in-one management app designed to help you live better. It brings together everything you need in one place: Multi Calendar, Synced Tasks, and Organized Notes.</p>
                        <p>The name Kairo comes from the ancient Greek word “Kairos”, which means the right moment. Every moment becomes the right one, because you’vemanaged it well with Kairo.</p>
                        <p>If you find any bugs, errors, or have suggestions for improvements, please contact me on Instagram: <a href="https://www.instagram.com/reallyratt" target="_blank" rel="noopener noreferrer" className="hover:underline" style={{color: 'var(--accent-primary)'}}>@reallyratt</a>.</p>
                        <p>Thank you!</p>
                    </div>
                </div>
            </div>
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
            will-change: transform;
        }
        .animate-slide-out {
            animation: slide-out-to-right 0.3s ease-out forwards;
            will-change: transform;
        }
      `}</style>
    </div>
  );
}

export default SettingsOverlay;
