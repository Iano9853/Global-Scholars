import React from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { HOME_COUNTRIES, TARGET_COUNTRIES } from '../data/programs';
import { FundingType, SearchParams, StudyLevel } from '../types/program';

interface HeroSearchBarProps {
  searchParams: SearchParams;
  onChange: (next: SearchParams) => void;
  onSearchSubmit: () => void;
}

const STUDY_LEVELS: StudyLevel[] = [
  'All Levels',
  'Associate / Diploma',
  'Undergraduate',
  "Master's",
  'PhD',
];

const FUNDING_TYPES: FundingType[] = [
  'All Funding',
  'Work-Study & Aid',
  'Paid Co-op & Bursary',
  'Full Scholarship',
  'Research Assistantship',
];

export const HeroSearchBar: React.FC<HeroSearchBarProps> = ({
  searchParams,
  onChange,
  onSearchSubmit,
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchSubmit();
  };

  return (
    <section className="bg-white border-b border-slate-200/80 pt-10 pb-11 px-4 sm:px-6">
      <div className="max-w-[1040px] mx-auto text-center">
        <h1 className="font-display font-extrabold text-[28px] sm:text-[36px] md:text-[42px] leading-[1.15] tracking-tight text-[#0C2340] max-w-3xl mx-auto [text-wrap:balance]">
          Find Global Scholarships &amp; Paid Work-Study Open to International Students
        </h1>
        <p className="mt-3.5 text-[15px] sm:text-[16px] text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Verified campus jobs, paid co-ops, and institutional financial aid matched to your
          citizenship, degree level, and student visa work rules.
        </p>

        {/* Dark Navy Integrated Search Container */}
        <form
          onSubmit={handleSubmit}
          className="mt-8 bg-[#0C2340] rounded-xl p-3.5 sm:p-4 shadow-sm"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1fr_auto] gap-3 items-end text-left">
            {/* Home Country */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="home-country-select"
                className="text-[12px] font-medium text-slate-200 pl-0.5"
              >
                Home Country:
              </label>
              <div className="relative">
                <select
                  id="home-country-select"
                  value={searchParams.homeCountry}
                  onChange={(e) =>
                    onChange({ ...searchParams, homeCountry: e.target.value })
                  }
                  className="w-full h-11 pl-3.5 pr-9 bg-white text-[#0C2340] text-[14px] font-medium rounded-md appearance-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E59E16]"
                >
                  {HOME_COUNTRIES.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="w-4 h-4 text-slate-500 pointer-events-none absolute right-3 top-1/2 -translate-y-1/2"
                  aria-hidden="true"
                />
              </div>
            </div>

            {/* Target Country */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="target-country-select"
                className="text-[12px] font-medium text-slate-200 pl-0.5"
              >
                Target Country:
              </label>
              <div className="relative">
                <select
                  id="target-country-select"
                  value={searchParams.targetCountry}
                  onChange={(e) =>
                    onChange({ ...searchParams, targetCountry: e.target.value })
                  }
                  className="w-full h-11 pl-3.5 pr-9 bg-white text-[#0C2340] text-[14px] font-medium rounded-md appearance-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E59E16]"
                >
                  {TARGET_COUNTRIES.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="w-4 h-4 text-slate-500 pointer-events-none absolute right-3 top-1/2 -translate-y-1/2"
                  aria-hidden="true"
                />
              </div>
            </div>

            {/* Study Level */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="study-level-select"
                className="text-[12px] font-medium text-slate-200 pl-0.5"
              >
                Study Level:
              </label>
              <div className="relative">
                <select
                  id="study-level-select"
                  value={searchParams.studyLevel}
                  onChange={(e) =>
                    onChange({
                      ...searchParams,
                      studyLevel: e.target.value as StudyLevel,
                    })
                  }
                  className="w-full h-11 pl-3.5 pr-9 bg-white text-[#0C2340] text-[14px] font-medium rounded-md appearance-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E59E16]"
                >
                  {STUDY_LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="w-4 h-4 text-slate-500 pointer-events-none absolute right-3 top-1/2 -translate-y-1/2"
                  aria-hidden="true"
                />
              </div>
            </div>

            {/* Funding Type */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="funding-type-select"
                className="text-[12px] font-medium text-slate-200 pl-0.5"
              >
                Funding Type:
              </label>
              <div className="relative">
                <select
                  id="funding-type-select"
                  value={searchParams.fundingType}
                  onChange={(e) =>
                    onChange({
                      ...searchParams,
                      fundingType: e.target.value as FundingType,
                    })
                  }
                  className="w-full h-11 pl-3.5 pr-9 bg-white text-[#0C2340] text-[14px] font-medium rounded-md appearance-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E59E16]"
                >
                  {FUNDING_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="w-4 h-4 text-slate-500 pointer-events-none absolute right-3 top-1/2 -translate-y-1/2"
                  aria-hidden="true"
                />
              </div>
            </div>

            {/* Primary CTA */}
            <button
              type="submit"
              className="sm:col-span-2 lg:col-span-1 h-11 px-5 bg-[#E59E16] hover:bg-[#D48E0D] active:scale-[0.99] text-[#0C2340] font-display font-bold text-[14px] rounded-md transition-all duration-150 flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <Search className="w-4 h-4" aria-hidden="true" />
              <span>Search Opportunities</span>
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};
