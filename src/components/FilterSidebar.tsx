import React, { useState } from 'react';
import { ChevronDown, ChevronUp, RotateCcw, Search, SlidersHorizontal } from 'lucide-react';
import { SidebarFilters } from '../types/program';

interface FilterSidebarProps {
  filters: SidebarFilters;
  keyword: string;
  onKeywordChange: (val: string) => void;
  onChange: (next: SidebarFilters) => void;
  onResetAll: () => void;
  totalCount: number;
  filteredCount: number;
  hasActiveFilters: boolean;
}

type BooleanFilterKey =
  | 'internationalEligibleOnly'
  | 'onCampusWorkAllowed'
  | 'noIeltsRequired'
  | 'coopEligible'
  | 'tuitionWaiver';

interface FilterOption {
  key: BooleanFilterKey;
  label: string;
  helper: string;
}

const PRIMARY_FILTERS: FilterOption[] = [
  {
    key: 'internationalEligibleOnly',
    label: 'International Eligible Only',
    helper: 'Open to non-citizen / visa-sponsored applicants',
  },
  {
    key: 'onCampusWorkAllowed',
    label: 'On-Campus Work Allowed',
    helper: 'Verified campus or lab employment permissions',
  },
  {
    key: 'noIeltsRequired',
    label: 'No IELTS Required',
    helper: 'English-medium waiver or alternative proof accepted',
  },
];

const ADDITIONAL_FILTERS: FilterOption[] = [
  {
    key: 'coopEligible',
    label: 'Paid Co-op / CPT Track',
    helper: 'Structured paid industry or research terms',
  },
  {
    key: 'tuitionWaiver',
    label: 'Full or Partial Tuition Waiver',
    helper: 'Includes institutional fee remission or grant',
  },
];

export const FilterSidebar: React.FC<FilterSidebarProps> = ({
  filters,
  keyword,
  onKeywordChange,
  onChange,
  onResetAll,
  totalCount,
  filteredCount,
  hasActiveFilters,
}) => {
  const [mobileExpanded, setMobileExpanded] = useState(false);

  const toggleFilter = (key: BooleanFilterKey) => {
    onChange({ ...filters, [key]: !filters[key] });
  };

  const activeCount =
    [
      filters.internationalEligibleOnly,
      filters.onCampusWorkAllowed,
      filters.noIeltsRequired,
      filters.coopEligible,
      filters.tuitionWaiver,
    ].filter(Boolean).length +
    (filters.minHourlyUsd > 0 ? 1 : 0) +
    (filters.deadlineWindow !== 'all' ? 1 : 0) +
    (keyword.trim() ? 1 : 0);

  return (
    <aside className="w-full lg:w-[255px] shrink-0" aria-label="Program Filters">
      {/* Mobile / Tablet Collapsible Header */}
      <div className="lg:hidden mb-3">
        <button
          type="button"
          onClick={() => setMobileExpanded((prev) => !prev)}
          className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between text-[14px] font-semibold text-[#0C2340] cursor-pointer"
        >
          <span className="inline-flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4" aria-hidden="true" />
            <span>
              Filters {activeCount > 0 ? `(${activeCount} active)` : ''}
            </span>
          </span>
          {mobileExpanded ? (
            <ChevronUp className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-500" />
          )}
        </button>
      </div>

      {/* Filter Panel Content */}
      <div
        className={`${
          mobileExpanded ? 'block bg-white p-4 rounded-xl border border-slate-200 mb-4' : 'hidden'
        } lg:block`}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-[15px] text-[#0C2340]">Filters</h2>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onResetAll}
              className="inline-flex items-center gap-1 text-[12px] font-medium text-slate-600 hover:text-[#0C2340] transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Keyword Search */}
        <div className="mb-4">
          <label htmlFor="keyword-filter" className="sr-only">
            Search universities, cities, or majors
          </label>
          <div className="relative">
            <Search
              className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
              aria-hidden="true"
            />
            <input
              id="keyword-filter"
              type="text"
              value={keyword}
              onChange={(e) => onKeywordChange(e.target.value)}
              placeholder="Search university, city, field..."
              className="w-full h-9 pl-8 pr-3 rounded-md border border-slate-200 bg-white text-[13px] text-[#0C2340] placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0C2340]"
            />
          </div>
        </div>

        {/* Primary Checkboxes */}
        <div className="space-y-3.5">
          {PRIMARY_FILTERS.map((item) => (
            <label
              key={item.key}
              className="flex items-start gap-3 cursor-pointer group select-none"
            >
              <input
                type="checkbox"
                checked={filters[item.key]}
                onChange={() => toggleFilter(item.key)}
                className="mt-0.5 w-4 h-4 rounded border-slate-300 text-[#0C2340] accent-[#0C2340] cursor-pointer focus-visible:ring-2 focus-visible:ring-[#0C2340]"
              />
              <div className="min-w-0">
                <span className="block text-[14px] font-medium text-slate-800 group-hover:text-[#0C2340] leading-snug">
                  {item.label}
                </span>
                <span className="block text-[12px] text-slate-500 mt-0.5 leading-snug">
                  {item.helper}
                </span>
              </div>
            </label>
          ))}
        </div>

        <div className="my-5 border-t border-slate-200/90" />

        <div className="space-y-3.5">
          <p className="text-[12px] font-semibold text-slate-500">Program Features</p>
          {ADDITIONAL_FILTERS.map((item) => (
            <label
              key={item.key}
              className="flex items-start gap-3 cursor-pointer group select-none"
            >
              <input
                type="checkbox"
                checked={filters[item.key]}
                onChange={() => toggleFilter(item.key)}
                className="mt-0.5 w-4 h-4 rounded border-slate-300 text-[#0C2340] accent-[#0C2340] cursor-pointer focus-visible:ring-2 focus-visible:ring-[#0C2340]"
              />
              <div className="min-w-0">
                <span className="block text-[14px] font-medium text-slate-800 group-hover:text-[#0C2340] leading-snug">
                  {item.label}
                </span>
                <span className="block text-[12px] text-slate-500 mt-0.5 leading-snug">
                  {item.helper}
                </span>
              </div>
            </label>
          ))}
        </div>

        <div className="my-5 border-t border-slate-200/90" />

        {/* Min Hourly Pay & Deadline Window */}
        <div className="space-y-4">
          <div>
            <label
              htmlFor="min-hourly-select"
              className="block text-[12px] font-semibold text-slate-500 mb-1.5"
            >
              Minimum Hourly Work Pay
            </label>
            <select
              id="min-hourly-select"
              value={filters.minHourlyUsd}
              onChange={(e) =>
                onChange({ ...filters, minHourlyUsd: Number(e.target.value) })
              }
              className="w-full h-9 px-2.5 rounded-md border border-slate-200 bg-white text-[13px] text-[#0C2340] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0C2340]"
            >
              <option value={0}>Any hourly wage</option>
              <option value={15}>$15+ USD / hr equivalent</option>
              <option value={18}>$18+ USD / hr equivalent</option>
              <option value={22}>$22+ USD / hr equivalent</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="deadline-window-select"
              className="block text-[12px] font-semibold text-slate-500 mb-1.5"
            >
              Deadline Window
            </label>
            <select
              id="deadline-window-select"
              value={filters.deadlineWindow}
              onChange={(e) =>
                onChange({
                  ...filters,
                  deadlineWindow: e.target.value as SidebarFilters['deadlineWindow'],
                })
              }
              className="w-full h-9 px-2.5 rounded-md border border-slate-200 bg-white text-[13px] text-[#0C2340] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0C2340]"
            >
              <option value="all">All Deadlines</option>
              <option value="next-90">Next 90 Days / 2026 Cutoffs</option>
              <option value="2027">2027 Intakes &amp; Later</option>
            </select>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-200/90 text-[12px] text-slate-500 tabular-nums">
          Showing <strong className="text-[#0C2340] font-semibold">{filteredCount}</strong> of{' '}
          {totalCount} verified programs
        </div>
      </div>
    </aside>
  );
};
