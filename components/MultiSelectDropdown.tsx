import React, { useState, useRef, useEffect } from 'react';

interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectDropdownProps {
  options: MultiSelectOption[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  className?: string;
}

const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({ options, selectedValues, onChange, placeholder = 'Select...', className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);

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

  const handleOptionClick = (value: string) => {
    const newSelectedValues = selectedValues.includes(value)
      ? selectedValues.filter(v => v !== value)
      : [...selectedValues, value];
    onChange(newSelectedValues);
  };

  const getButtonLabel = () => {
    if (selectedValues.length === 0) {
      return placeholder;
    }
    if (selectedValues.length === 1) {
      return options.find(opt => opt.value === selectedValues[0])?.label || placeholder;
    }
    return `${selectedValues.length} tags selected`;
  };

  const animationClass = isAnimatingOut ? 'animate-dropdown-out' : 'animate-dropdown-in';

  return (
    <div className={`relative ${className}`} ref={selectRef}>
      <button
        type="button"
        className="form-select flex items-center justify-between text-left"
        onClick={toggleMenu}
      >
        <span>{getButtonLabel()}</span>
        <i className={`fa-solid fa-chevron-down text-xs text-slate-400 transition-transform duration-200 ${isOpen && !isAnimatingOut ? 'transform rotate-180' : ''}`}></i>
      </button>
      {isOpen && (
        <div className={`absolute z-10 mt-1 w-full rounded-lg shadow-lg max-h-60 overflow-auto ${animationClass}`} style={{backgroundColor: 'var(--bg-quaternary)'}}>
          <ul>
            {options.map(option => (
              <li
                key={option.value}
                className="px-4 py-2 cursor-pointer hover:bg-[var(--accent-primary)]/20 flex items-center gap-3"
                onClick={() => handleOptionClick(option.value)}
              >
                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${selectedValues.includes(option.value) ? 'bg-[var(--accent-primary)] border-[var(--accent-primary)]' : 'border-[var(--text-tertiary)]'}`}>
                    {selectedValues.includes(option.value) && <i className="fa-solid fa-check text-xs text-[var(--accent-text)]"></i>}
                </div>
                <span>{option.label}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default MultiSelectDropdown;