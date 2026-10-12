import React from 'react';
import {
  Search,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

export interface StatWidget {
  label: string;
  value: string | number;
  subtext?: string;
  subValue?: string;
  color?: string;
  watermarkIcon?: React.ReactNode;
  variant?: 'default' | 'gold' | 'emerald' | 'blue' | 'purple' | 'amber' | 'slate' | 'rose';
  onClick?: () => void;
  isActive?: boolean;
  clickable?: boolean;
  actionHint?: string;
}

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (size: number) => void;
}

export interface StandardPageLayoutProps {
  // 1. Long Header Banner
  title: string;
  description: string;
  badge?: string;
  headerWatermark?: React.ReactNode;
  primaryAction?:
    | React.ReactNode
    | {
        label: string;
        icon?: React.ReactNode;
        onClick?: () => void;
        disabled?: boolean;
        isLoading?: boolean;
        className?: string;
      };
  secondaryActions?: React.ReactNode;

  // 2. KPI Stats Widgets
  stats?: StatWidget[];

  // 3. Search & Filter Bar
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  filterSlot?: React.ReactNode;
  customFilters?: React.ReactNode;
  viewMode?: 'table' | 'grid';
  onViewModeChange?: (mode: 'table' | 'grid') => void;
  showViewToggle?: boolean;

  // 4. Data Content
  tableContent: React.ReactNode;
  cardGridContent?: React.ReactNode;
  isLoading?: boolean;
  totalCount?: number;

  // 5. Pagination
  pagination?: PaginationProps;
  currentPage?: number;
  totalPages?: number;
  itemsPerPage?: number;
  onPageChange?: (page: number) => void;

  // 6. Page Footer
  footerInfo?: React.ReactNode;

  // 7. Extra elements like Modals
  children?: React.ReactNode;
}

export function StandardPageLayout({
  title,
  description,
  badge,
  headerWatermark,
  primaryAction,
  secondaryActions,
  stats,
  searchPlaceholder = 'Search records...',
  searchValue,
  onSearchChange,
  filterSlot,
  customFilters,
  viewMode = 'table',
  onViewModeChange,
  showViewToggle = true,
  tableContent,
  cardGridContent,
  isLoading = false,
  totalCount: _totalCount,
  totalCount,
  pagination,
  currentPage,
  totalPages,
  itemsPerPage,
  onPageChange,
  footerInfo,
  children,
}: StandardPageLayoutProps) {
  const effectiveFilterSlot = customFilters || filterSlot;
  const effectivePagination = pagination || (
    currentPage !== undefined && onPageChange
      ? {
          currentPage,
          totalPages: totalPages ?? 1,
          totalItems: totalCount ?? _totalCount ?? 0,
          itemsPerPage: itemsPerPage ?? 10,
          onPageChange,
        }
      : undefined
  );

  let renderedPrimaryAction: React.ReactNode = null;
  if (React.isValidElement(primaryAction)) {
    renderedPrimaryAction = primaryAction;
  } else if (primaryAction && typeof primaryAction === 'object' && 'label' in (primaryAction as any)) {
    const act = primaryAction as {
      label: string;
      icon?: React.ReactNode;
      onClick?: () => void;
      disabled?: boolean;
      isLoading?: boolean;
      className?: string;
    };
    renderedPrimaryAction = (
      <Button
        variant="primary"
        onClick={act.onClick}
        disabled={act.disabled}
        isLoading={act.isLoading}
        className={act.className}
      >
        {act.icon}
        {act.label}
      </Button>
    );
  } else if (primaryAction) {
    renderedPrimaryAction = primaryAction as React.ReactNode;
  }
  const getWidgetStyle = (variant: StatWidget['variant'] = 'default', isActive = false) => {
    if (isActive) {
      return {
        cardBg: 'bg-gradient-to-br from-amber-50 to-amber-100/70 border-amber-400 ring-2 ring-amber-500 shadow-md',
        titleColor: 'text-amber-800 font-bold',
        valColor: 'text-amber-950 font-black',
        iconColor: 'text-amber-500/30',
      };
    }
    switch (variant) {
      case 'gold':
      case 'amber':
        return {
          cardBg: 'bg-white border-amber-200 hover:border-amber-300',
          titleColor: 'text-amber-700',
          valColor: 'text-amber-950',
          iconColor: 'text-amber-500/15',
        };
      case 'emerald':
        return {
          cardBg: 'bg-white border-emerald-200 hover:border-emerald-300',
          titleColor: 'text-emerald-700',
          valColor: 'text-emerald-950',
          iconColor: 'text-emerald-500/15',
        };
      case 'blue':
        return {
          cardBg: 'bg-white border-blue-200 hover:border-blue-300',
          titleColor: 'text-blue-700',
          valColor: 'text-blue-950',
          iconColor: 'text-blue-500/15',
        };
      case 'purple':
        return {
          cardBg: 'bg-white border-purple-200 hover:border-purple-300',
          titleColor: 'text-purple-700',
          valColor: 'text-purple-950',
          iconColor: 'text-purple-500/15',
        };
      case 'rose':
        return {
          cardBg: 'bg-white border-rose-200 hover:border-rose-300',
          titleColor: 'text-rose-700',
          valColor: 'text-rose-950',
          iconColor: 'text-rose-500/15',
        };
      default:
        return {
          cardBg: 'bg-white border-slate-200 hover:border-slate-300',
          titleColor: 'text-slate-500',
          valColor: 'text-slate-900',
          iconColor: 'text-slate-400/15',
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* ── 1. Long Header Banner Card with Watermark ── */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-850 to-amber-950 text-white rounded-xl p-6 sm:p-7 shadow-md border border-slate-800">
        {/* Subtle Luxury Jewellery Background Watermark */}
        <div className="absolute right-0 bottom-0 translate-x-8 translate-y-6 pointer-events-none opacity-10 select-none">
          {headerWatermark || <Sparkles className="w-56 h-56 text-amber-300" />}
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="max-w-2xl">
            {badge && (
              <span className="inline-block px-2.5 py-0.5 mb-2 rounded text-[10px] font-bold font-mono tracking-wider uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {badge}
              </span>
            )}
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
              <span>{title}</span>
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1.5 leading-relaxed font-sans">
              {description}
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap shrink-0">
            {secondaryActions}
            {renderedPrimaryAction}
          </div>
        </div>
      </div>

      {/* ── 2. KPI Stats Widgets Row (Responsive 2-col on Mobile, 4-col on Desktop) ── */}
      {stats && stats.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {stats.map((s, idx) => {
            const isClickable = Boolean(s.onClick || s.clickable);
            const style = getWidgetStyle(s.variant, s.isActive);
            return (
              <Card
                key={idx}
                onClick={s.onClick}
                role={isClickable ? 'button' : undefined}
                tabIndex={isClickable ? 0 : undefined}
                onKeyDown={
                  isClickable
                    ? (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          s.onClick?.();
                        }
                      }
                    : undefined
                }
                className={`relative overflow-hidden shadow-xs border transition-all duration-200 select-none ${
                  isClickable
                    ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] group'
                    : ''
                } ${style.cardBg}`}
              >
                {/* Individual Widget Watermark */}
                {s.watermarkIcon && (
                  <div
                    className={`absolute right-2 bottom-1 pointer-events-none select-none transition-transform duration-300 ${
                      isClickable ? 'group-hover:scale-135' : ''
                    } ${style.iconColor}`}
                  >
                    <div className="w-20 h-20 flex items-center justify-center scale-125">
                      {s.watermarkIcon}
                    </div>
                  </div>
                )}

                <CardContent className="pt-3.5 pb-3 px-3 sm:pt-5 sm:pb-4 sm:px-6 relative z-10">
                  <div className="flex items-center justify-between gap-1">
                    <div
                      className={`text-[10px] sm:text-xs uppercase tracking-wider font-semibold truncate ${style.titleColor}`}
                    >
                      {s.label}
                    </div>
                    {s.isActive ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8px] sm:text-[9px] font-bold bg-amber-600 text-white tracking-wide uppercase shadow-2xs shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        Active
                      </span>
                    ) : isClickable && s.actionHint ? (
                      <span className="text-[9px] sm:text-[10px] text-slate-400 font-mono opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        {s.actionHint}
                      </span>
                    ) : null}
                  </div>

                  <div
                    className={`text-lg sm:text-2xl font-black font-mono mt-0.5 sm:mt-1 ${style.valColor}`}
                  >
                    {s.value}
                  </div>
                  {(s.subtext || s.subValue) && (
                    <div className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 sm:mt-1 truncate">
                      {s.subtext || s.subValue}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── 3. Unified Search & Filter Control Bar (Fully Responsive) ── */}
      <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        {/* Top Controls Row: Search Input + Responsive View Mode Toggle */}
        <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
          {onSearchChange && (
            <div className="flex-1 min-w-[200px]">
              <Input
                type="text"
                placeholder={searchPlaceholder}
                value={searchValue || ''}
                onChange={(e) => onSearchChange(e.target.value)}
                leftIcon={<Search className="w-4 h-4 text-slate-400" />}
                className="h-9 text-xs bg-slate-50/50 focus:bg-white"
              />
            </div>
          )}

          {/* View Toggle on ALL devices (Mobile, Tablet, Laptop, Desktop) */}
          {showViewToggle && onViewModeChange && (
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 shrink-0">
              <button
                type="button"
                onClick={() => onViewModeChange('table')}
                className={`px-2.5 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white shadow text-amber-950 font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Table View"
              >
                <List className="w-3.5 h-3.5" />
                <span>Table</span>
              </button>
              <button
                type="button"
                onClick={() => onViewModeChange('grid')}
                className={`px-2.5 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white shadow text-amber-950 font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Cards Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Cards</span>
              </button>
            </div>
          )}
        </div>

        {/* Filter Dropdowns Row */}
        {effectiveFilterSlot && (
          <div className="pt-2.5 border-t border-slate-100">
            {effectiveFilterSlot}
          </div>
        )}
      </div>

      {/* ── 4. Adaptive Content Layer (Table vs Cards on all devices) ── */}
      <div className="relative min-h-[160px]">
        {isLoading && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-xs flex items-center justify-center z-20 rounded-xl">
            <div className="flex items-center gap-2.5 px-4 py-2 bg-white rounded-lg shadow-sm border border-slate-200 text-xs font-medium text-amber-800">
              <div className="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
              <span>Loading records...</span>
            </div>
          </div>
        )}

        {viewMode === 'table' ? (
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-x-auto">
            {tableContent}
          </div>
        ) : (
          <div>{cardGridContent || tableContent}</div>
        )}
      </div>

      {/* ── 5. Advanced Pagination Bar ── */}
      {effectivePagination && (
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="text-slate-500 font-mono">
            Showing{' '}
            <span className="font-semibold text-slate-800">
              {effectivePagination.totalItems === 0
                ? 0
                : (effectivePagination.currentPage - 1) * effectivePagination.itemsPerPage + 1}
            </span>{' '}
            to{' '}
            <span className="font-semibold text-slate-800">
              {Math.min(
                effectivePagination.currentPage * effectivePagination.itemsPerPage,
                effectivePagination.totalItems
              )}
            </span>{' '}
            of{' '}
            <span className="font-semibold text-slate-800">
              {effectivePagination.totalItems.toLocaleString('en-IN')}
            </span>{' '}
            records
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={effectivePagination.currentPage <= 1}
              onClick={() => effectivePagination.onPageChange(1)}
              className="p-1 h-7 w-7"
              title="First Page"
            >
              <ChevronsLeft className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={effectivePagination.currentPage <= 1}
              onClick={() => effectivePagination.onPageChange(effectivePagination.currentPage - 1)}
              className="p-1 h-7 w-7"
              title="Previous Page"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>

            <span className="font-mono text-slate-600 px-2 font-medium">
              Page {effectivePagination.currentPage} of {Math.max(1, effectivePagination.totalPages)}
            </span>

            <Button
              variant="outline"
              size="sm"
              disabled={effectivePagination.currentPage >= effectivePagination.totalPages}
              onClick={() => effectivePagination.onPageChange(effectivePagination.currentPage + 1)}
              className="p-1 h-7 w-7"
              title="Next Page"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={effectivePagination.currentPage >= effectivePagination.totalPages}
              onClick={() => effectivePagination.onPageChange(effectivePagination.totalPages)}
              className="p-1 h-7 w-7"
              title="Last Page"
            >
              <ChevronsRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* ── 6. Page Footer ── */}
      {footerInfo && (
        <div className="p-3 bg-slate-100/70 border border-slate-200/80 rounded-lg text-xs text-slate-500 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          {footerInfo}
        </div>
      )}

      {/* ── 7. Modals / Overlay Slots ── */}
      {children}
    </div>
  );
}
