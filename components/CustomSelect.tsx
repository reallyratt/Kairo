import React, { useState, useRef, useEffect, ReactNode } from 'react';

interface CustomSelectOption {
  value: string;
  label: string;
  className?: string;
}

interface CustomSelectHeader {
  isHeader: true;
  label: string;
}

type CustomSelectOptionType = CustomSelectOption | CustomSelectHeader;


interface CustomSelectProps {
  options: CustomSelectOptionType[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const CustomSelect: React.FC<CustomSelectProps> = ({ options, value, onChange, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);
  // FIX: Initialize useRef with null to satisfy TypeScript environments that require an initial value for useRef.
  const timerRef = useRef<number | null>(null);

  const selectedOption = options.find(opt => !('isHeader' in opt) && opt.value === value) as CustomSelectOption | undefined;
  
  const closeMenu = () => {
    if (isAnimatingOut || !isOpen) return;
    setIsAnimatingOut(true);
    timerRef.current = window.setTimeout(() => {
      setIsOpen(false);
      setIsAnimatingOut(false);
    }, 100); // Animation duration
  };

  const openMenu = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsAnimatingOut(false);
    setIsOpen(true);
  };

  const toggleMenu = () => {
    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  };
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        closeMenu();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isOpen]);

  const handleOptionClick = (newValue: string) => {
    onChange(newValue);
    closeMenu();
  };

  const animationClass = isAnimatingOut ? 'animate-dropdown-out' : 'animate-dropdown-in';

  return (
    <div className={`relative ${className}`} ref={selectRef}>
      <button
        type="button"
        className="form-select flex items-center justify-between text-left"
        onClick={toggleMenu}
      >
        <span>{selectedOption?.label || 'Select...'}</span>
        <i className={`fa-solid fa-chevron-down text-xs text-slate-400 transition-transform duration-200 ${isOpen && !isAnimatingOut ? 'transform rotate-180' : ''}`} style={{color: 'var(--text-tertiary)'}}></i>
      </button>
      {isOpen && (
        <div className={`absolute z-50 mt-1 w-full bg-slate-700 rounded-lg shadow-lg max-h-60 overflow-auto ${animationClass}`} style={{backgroundColor: 'var(--bg-quaternary)'}}>
          <ul>
            {/* FIX: Use a type guard to correctly narrow the union type for 'option'. This resolves errors where '.value' was accessed on a type that might be a header. */}
            {options.map((option, index) => {
              if ('isHeader' in option && option.isHeader) {
                return (
                  <li key={`header-${index}`} className="px-4 pt-3 pb-1 text-xs font-bold uppercase tracking-wider" style={{color: 'var(--text-tertiary)'}}>
                    {option.label}
                  </li>
                );
              } else if ('value' in option) {
                return (
                  <li
                    key={option.value}
                    className={`px-4 py-2 cursor-pointer dropdown-item ${option.value === value ? 'font-bold' : ''} ${option.className || ''}`}
                    style={{
                        color: option.value === value ? 'var(--accent-primary)' : 'var(--text-primary)',
                    }}
                    onClick={() => handleOptionClick(option.value)}
                  >
                    {option.label}
                  </li>
                );
              }
              return null;
            })}
          </ul>
        </div>
      )}
       <style>{`
        .dropdown-item:hover {
          background-color: rgba(var(--accent-primary-rgb), 0.2);
        }
      `}</style>
    </div>
  );
};

export default CustomSelect;