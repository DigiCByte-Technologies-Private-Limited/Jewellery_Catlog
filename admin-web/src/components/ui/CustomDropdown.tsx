import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from './Button';

export interface DropdownOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string;
  count?: number;
}

export interface CustomDropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  icon?: React.ReactNode;
  className?: string;
  menuClassName?: string;
  disabled?: boolean;
  error?: string;
}

export const CustomDropdown: React.FC<CustomDropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select option',
  label,
  icon,
  className,
  menuClassName,
  disabled = false,
  error,
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

  return (
    <div className={cn('relative flex flex-col gap-1 w-full', className)} ref={containerRef}>
      {label && <label className="text-xs font-semibold text-slate-700">{label}</label>}

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={cn(
          'flex h-9 w-full items-center justify-between rounded-lg border bg-white px-3 py-1.5 text-xs transition-all select-none',
          'cursor-pointer shadow-2xs font-medium text-left',
          isOpen
            ? 'border-amber-500 ring-2 ring-amber-500/15 shadow-xs'
            : value !== ''
            ? 'border-amber-300/80 bg-amber-50/20 text-slate-900 font-semibold'
            : 'border-slate-300 text-slate-700 hover:border-slate-400',
          disabled && 'cursor-not-allowed opacity-50 bg-slate-50',
          error && 'border-rose-500 focus:ring-rose-500/20'
        )}
      >
        <div className="flex items-center gap-2 truncate pr-1">
          {icon && <span className="shrink-0 text-slate-400">{icon}</span>}
          {selectedOption?.icon && <span className="shrink-0">{selectedOption.icon}</span>}
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 ml-1.5">
          {value !== '' && (
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
          )}
          <ChevronDown
            className={cn(
              'w-3.5 h-3.5 text-slate-400 transition-transform duration-200',
              isOpen && 'rotate-180 text-amber-600'
            )}
          />
        </div>
      </button>

      {/* Floating Menu Popover */}
      {isOpen && (
        <div
          className={cn(
            'absolute top-full left-0 mt-1 w-full min-w-[190px] rounded-xl border border-slate-200 bg-white p-1 shadow-lg shadow-slate-200/50 z-50',
            'max-h-64 overflow-y-auto divide-y divide-slate-50',
            menuClassName
          )}
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
                className={cn(
                  'w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-colors text-left cursor-pointer select-none my-0.5',
                  isSelected
                    ? 'bg-amber-100/70 text-amber-950 font-bold'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                )}
              >
                <div className="flex items-center gap-2 truncate">
                  {option.icon && <span className="shrink-0">{option.icon}</span>}
                  <span className="truncate">{option.label}</span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  {option.badge && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                      {option.badge}
                    </span>
                  )}
                  {option.count !== undefined && (
                    <span className="text-[10px] text-slate-400 font-mono">
                      ({option.count})
                    </span>
                  )}
                  {isSelected && <Check className="w-3.5 h-3.5 text-amber-700" />}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {error && <span className="text-[10px] text-rose-500">{error}</span>}
    </div>
  );
};
