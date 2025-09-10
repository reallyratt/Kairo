import React, { useMemo, useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAppContext, ActivePage } from '../context/AppContext';

const NavItem: React.FC<{ to: string; icon: string; }> = ({ to, icon }) => {
  const baseClasses = "flex items-center justify-center w-full h-full transition-all duration-200 transform active:scale-90";
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
      <i className={`fa-solid ${icon} text-2xl`}></i>
    </NavLink>
  );
};

const CenterActionButton: React.FC<{ isVisible: boolean; onAnimationEnd: () => void; }> = ({ isVisible, onAnimationEnd }) => {
    const { pathname } = useLocation();
    const { setActiveAction } = useAppContext();
    
    const pageToActionMap: Record<string, ActivePage> = {
        '/notes': 'notes',
        '/todo': 'todo',
        '/calendar': 'calendar',
        '/habit': 'habit',
        '/finance': 'finance',
    };
    
    const activePageKey = Object.keys(pageToActionMap).find(key => pathname.startsWith(key));
    const action = activePageKey ? pageToActionMap[activePageKey] : null;

    const handleClick = (e: React.MouseEvent) => {
        if (action) {
            e.preventDefault();
            setActiveAction(action);
        }
    };
    
    const baseClasses = "flex flex-col items-center justify-center";
    const activeClasses = "text-slate-950 bg-fuchsia-400 shadow-lg shadow-fuchsia-500/40 active:scale-105";

    return (
        <div className="relative w-16 h-16 -mt-8 rounded-full">
            <style>{`
              @keyframes fade-in-scale-up {
                from { transform: scale(0.5); opacity: 0; }
                to { transform: scale(1.1); opacity: 1; }
              }
              @keyframes fade-out-scale-down {
                from { transform: scale(1.1); opacity: 1; }
                to { transform: scale(0.5); opacity: 0; }
              }
              .animate-in { animation: fade-in-scale-up 0.1s ease-out forwards; }
              .animate-out { animation: fade-out-scale-down 0.1s ease-out forwards; }
            `}</style>
             <button
                onAnimationEnd={onAnimationEnd}
                onClick={handleClick}
                className={`absolute inset-0 rounded-full ${baseClasses} ${activeClasses} ${isVisible ? 'animate-in' : 'animate-out'}`}
                style={{
                    color: 'var(--bg-secondary)',
                    backgroundColor: 'var(--accent-primary)',
                    boxShadow: `0 0 15px 2px var(--accent-primary)`
                }}
                aria-label="Add new item"
            >
                <i className={`fa-solid fa-plus text-4xl`}></i>
            </button>
        </div>
    );
};


function BottomNav() {
  const { pathname } = useLocation();

  const navItems = useMemo(() => [
      { path: "/notes", icon: "fa-note-sticky" },
      { path: "/todo", icon: "fa-list-check" },
      { path: "/calendar", icon: "fa-calendar-days" },
      { path: "/habit", icon: "fa-repeat" },
      { path: "/finance", icon: "fa-wallet" },
  ], []);
  
  const calculateIndexFromPath = (path: string) => {
      let index = navItems.findIndex(item => path.startsWith(item.path) && item.path !== "/");
      if (path === '/') index = 2; // Default calendar for root
      return index === -1 ? 2 : index;
  };
  
  const activeIndex = calculateIndexFromPath(pathname);
  const [visualIndex, setVisualIndex] = useState(activeIndex);
  const [isButtonVisible, setIsButtonVisible] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    // If the route changes and we are not already in a transition
    if (activeIndex !== visualIndex && !isTransitioning) {
        setIsTransitioning(true);
        setIsButtonVisible(false); // Start fade out
    }
  }, [activeIndex, visualIndex, isTransitioning]);

  const handleAnimationEnd = () => {
    if (!isButtonVisible) {
        // Fade-out animation has finished.
        setVisualIndex(activeIndex); // Move the button to its new position.
        setIsButtonVisible(true);   // Start the fade-in animation.
    } else {
        // Fade-in animation has finished.
        setIsTransitioning(false); // Mark the transition as complete.
    }
  };


  return (
    <footer className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-slate-900/80 backdrop-blur-sm border-t border-slate-800 shadow-lg" style={{ backgroundColor: 'var(--bg-secondary)', borderTopColor: 'var(--border-color)' }}>
      <nav className="relative flex items-center justify-around h-16">
        {navItems.map((item, index) => {
            const isHiddenByButton = index === visualIndex && isButtonVisible;
            return (
                <div key={item.path} className={`w-1/5 flex justify-center transition-opacity duration-100 ${isHiddenByButton ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                    <NavItem to={item.path} icon={item.icon} />
                </div>
            );
        })}
        
        <div 
            className="absolute top-0 left-0 h-full w-1/5 flex justify-center"
            style={{ transform: `translateX(${visualIndex * 100}%)` }}
        >
            <CenterActionButton isVisible={isButtonVisible} onAnimationEnd={handleAnimationEnd} />
        </div>
      </nav>
    </footer>
  );
}

export default BottomNav;