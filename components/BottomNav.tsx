

import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from '../context/AppContext';

const navItems = [
  { path: "/todo", icon: "fa-list-check", labelKey: "nav.todo" },
  { path: "/calendar", icon: "fa-calendar-days", labelKey: "nav.calendar" },
  { path: "/notes", icon: "fa-note-sticky", labelKey: "nav.notes" },
];

const NavItem: React.FC<{ to: string; icon: string; label: string }> = ({ to, icon, label }) => {
  const baseClasses = "flex items-center justify-center w-full h-full transition-colors duration-200";
  
  return (
    <NavLink
      to={to}
      className="w-full h-full"
      style={({ isActive }) => ({
        color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
      })}
    >
      {({ isActive }) => (
        <div className={`${baseClasses} ${isActive ? '' : 'hover:text-[var(--accent-primary)]'}`}>
          <i className={`fa-solid ${icon} text-2xl`}></i>
        </div>
      )}
    </NavLink>
  );
};

function BottomNav() {
  const { t } = useTranslation();
  return (
    <footer 
      className="fixed bottom-0 left-0 right-0 max-w-md mx-auto border-t z-20" 
      style={{ 
        backgroundColor: 'var(--bg-secondary)', 
        borderTopColor: 'var(--border-color)',
        boxShadow: '0 -2px 10px var(--shadow-color)'
      }}
    >
      <nav className="flex items-center justify-around h-16">
        {navItems.map((item) => (
          <NavItem key={item.path} to={item.path} icon={item.icon} label={t(item.labelKey)} />
        ))}
      </nav>
    </footer>
  );
}

export default BottomNav;