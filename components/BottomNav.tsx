import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from '../context/AppContext';

const NavItem: React.FC<{ to: string; icon: string; label: string }> = ({ to, icon, label }) => {
  const baseClasses = "flex flex-col items-center justify-center w-full h-full transition-all duration-200 transform active:scale-90";
  const activeClasses = "text-fuchsia-400"; // This will be overridden by style prop
  const inactiveClasses = "text-slate-400 hover:text-fuchsia-300"; // This will be overridden by style prop

  return (
    <NavLink
      to={to}
      className={({ isActive }) => `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
      style={({ isActive }) => ({
          color: isActive ? 'var(--accent-secondary)' : 'var(--text-secondary)'
      })}
    >
      <i className={`fa-solid ${icon} text-xl`}></i>
      <span className="text-xs mt-1">{label}</span>
    </NavLink>
  );
};

const CenterNavItem: React.FC<{ to: string; icon: string; label: string }> = ({ to, icon, label }) => {
    const baseClasses = "flex flex-col items-center justify-center transition-all duration-300 ease-in-out";
    const activeClasses = "text-slate-950 bg-fuchsia-400 scale-110 shadow-lg shadow-fuchsia-500/40 active:scale-105";
    const inactiveClasses = "text-fuchsia-400 bg-slate-900 hover:bg-slate-800 active:scale-95";
  
    return (
        <div className="relative w-16 h-16 -mt-8 rounded-full">
             <NavLink
                to={to}
                className={({ isActive }) => `absolute inset-0 rounded-full ${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
                style={({ isActive }) => ({
                    color: isActive ? 'var(--bg-secondary)' : 'var(--accent-primary)',
                    backgroundColor: isActive ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                    boxShadow: isActive ? `0 0 15px 2px var(--accent-primary)` : 'none'
                })}
            >
                <i className={`fa-solid ${icon} text-4xl`}></i>
            </NavLink>
        </div>
    );
};

function BottomNav() {
  const { t } = useTranslation();
  return (
    <footer className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-slate-900/80 backdrop-blur-sm border-t border-slate-800 shadow-lg" style={{ backgroundColor: 'var(--bg-secondary)', borderTopColor: 'var(--border-color)' }}>
      <nav className="flex items-center justify-around h-16">
        <div className="w-1/5"><NavItem to="/notes" icon="fa-note-sticky" label={t('nav.notes')} /></div>
        <div className="w-1/5"><NavItem to="/todo" icon="fa-list-check" label={t('nav.todo')} /></div>
        <div className="w-1/5 flex justify-center"><CenterNavItem to="/calendar" icon="fa-calendar-days" label="Calendar" /></div>
        <div className="w-1/5"><NavItem to="/habit" icon="fa-repeat" label={t('nav.habit')} /></div>
        <div className="w-1/5"><NavItem to="/finance" icon="fa-wallet" label={t('nav.finance')} /></div>
      </nav>
    </footer>
  );
}

export default BottomNav;