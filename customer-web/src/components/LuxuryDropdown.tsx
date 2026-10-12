import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, X } from 'lucide-react';

export interface LuxuryDropdownOption {
  value: string;
  label: string;
  sublabel?: string;
  badge?: string;
  icon?: React.ReactNode;
}

export interface LuxuryDropdownProps {
  label?: string;
  options: LuxuryDropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: React.ReactNode;
  className?: string;
  menuClassName?: string;
  disabled?: boolean;
}

export const LuxuryDropdown: React.FC<LuxuryDropdownProps> = ({
  label,
  options,
  value,
  onChange,
  placeholder = 'Select option',
  icon,
  className = '',
  menuClassName = '',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Close when clicked outside
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setIsOpen(false);
  };

  const isCustomValueSelected = value !== '' && value !== options[0]?.value;

  return (
    <div className={`relative flex flex-col gap-1.5 w-full ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-stone-500 pl-0.5">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={`flex h-11 w-full items-center justify-between rounded-xl border bg-white/95 px-3.5 py-2 text-xs sm:text-[13px] transition-all select-none cursor-pointer shadow-xs font-medium text-left ${
          isOpen
            ? 'border-[#8C6A28] ring-2 ring-[#8C6A28]/20 shadow-sm bg-white'
            : isCustomValueSelected
            ? 'border-[#8C6A28]/60 bg-amber-50/30 text-stone-900 font-semibold'
            : 'border-stone-200/90 hover:border-stone-300 text-stone-800'
        } ${disabled ? 'cursor-not-allowed opacity-50 bg-stone-50' : ''}`}
      >
        <div className="flex items-center gap-2 truncate pr-1">
          {icon && <span className="shrink-0 text-stone-400">{icon}</span>}
          {selectedOption?.icon && <span className="shrink-0">{selectedOption.icon}</span>}
          <div className="truncate">
            <span className="truncate block">
              {selectedOption ? selectedOption.label : placeholder}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 ml-1.5">
          {isCustomValueSelected && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors"
              title="Clear selection"
            >
              <X className="w-3 h-3" />
            </button>
          )}

          {isCustomValueSelected && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#8C6A28] shrink-0" />
          )}

          <ChevronDown
            className={`w-4 h-4 text-stone-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-[#8C6A28]' : ''
            }`}
          />
        </div>
      </button>

      {/* Floating Popover Menu */}
      {isOpen && (
        <div
          className={`absolute top-full left-0 mt-1.5 w-full min-w-[210px] rounded-2xl border border-stone-200/90 bg-white/98 backdrop-blur-xl p-1.5 shadow-xl shadow-stone-900/10 z-50 max-h-64 overflow-y-auto luxury-scrollbar overscroll-contain divide-y divide-stone-100 ${menuClassName}`}
          data-lenis-prevent="true"
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors text-left cursor-pointer select-none my-0.5 ${
                  isSelected
                    ? 'bg-[#1C1917] text-amber-200 font-semibold shadow-xs'
                    : 'text-stone-700 hover:bg-stone-100/80 hover:text-stone-900'
                }`}
              >
                <div className="flex flex-col truncate pr-2">
                  <div className="flex items-center gap-2 truncate">
                    {option.icon && <span className="shrink-0">{option.icon}</span>}
                    <span className="truncate">{option.label}</span>
                  </div>
                  {option.sublabel && (
                    <span
                      className={`text-[10px] truncate mt-0.5 ${
                        isSelected ? 'text-amber-300/80' : 'text-stone-400'
                      }`}
                    >
                      {option.sublabel}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  {option.badge && (
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-mono tracking-wider ${
                        isSelected
                          ? 'bg-amber-900/50 text-amber-200'
                          : 'bg-stone-100 text-stone-600'
                      }`}
                    >
                      {option.badge}
                    </span>
                  )}
                  {isSelected && <Check className="w-3.5 h-3.5 text-amber-400" />}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
