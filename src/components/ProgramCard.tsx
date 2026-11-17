import React, { useState } from 'react';
import {
  Bookmark,
  Calendar,
  Check,
  CheckCircle2,
  Copy,
  GitCompareArrows,
  MailCheck,
  MapPin,
  MoreHorizontal,
} from 'lucide-react';
import { ProgramOpportunity } from '../types/program';
import { UniversityCrest } from './UniversityCrest';

interface ProgramCardProps {
  program: ProgramOpportunity;
  homeCountry: string;
  isSaved: boolean;
  isCompared: boolean;
  isApplied?: boolean;
  onToggleSave: (id: string) => void;
  onToggleCompare: (id: string) => void;
  onViewRequirements: (program: ProgramOpportunity) => void;
}

export const ProgramCard: React.FC<ProgramCardProps> = ({
  program,
  homeCountry,
  isSaved,
  isCompared,
  isApplied = false,
  onToggleSave,
  onToggleCompare,
  onViewRequirements,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [copiedPolicy, setCopiedPolicy] = useState(false);

  const hasCountryIeltsWaiver =
    homeCountry !== 'All Countries' && program.noIeltsCountries.includes(homeCountry);

  const handleCopyPolicyLink = () => {
    navigator.clipboard?.writeText(`https://${program.officialPolicyUrlLabel}`).catch(() => {});
    setCopiedPolicy(true);
    setTimeout(() => {
      setCopiedPolicy(false);
      setMenuOpen(false);
    }, 1200);
  };

  return (
    <article className="bg-white rounded-xl border border-slate-200/90 p-5 sm:p-6 transition-colors duration-150 hover:border-slate-300">
      {/* Top Row: Emblem + Title + Context Menu */}
      <div className="flex items-start gap-4">
        <UniversityCrest theme={program.crestTheme} university={program.university} />

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-display font-bold text-[17px] sm:text-[18px] text-[#0C2340] leading-snug">
              {program.programTitle}
            </h3>

            {/* Working Options Menu */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                className="p-1.5 text-slate-400 hover:text-[#0C2340] rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label={`More actions for ${program.university}`}
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-1 w-56 bg-white border border-slate-200 rounded-lg shadow-lg py-1.5 z-20">
                  <button
                    type="button"
                    onClick={() => {
                      onViewRequirements(program);
                      setMenuOpen(false);
                    }}
                    className="w-full px-3.5 py-2 text-left text-[13px] text-slate-700 hover:bg-slate-50 font-medium cursor-pointer"
                  >
                    Inspect &amp; Select School
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onToggleCompare(program.id);
                      setMenuOpen(false);
                    }}
                    className="w-full px-3.5 py-2 text-left text-[13px] text-slate-700 hover:bg-slate-50 font-medium cursor-pointer"
                  >
                    {isCompared ? 'Remove from Comparison' : 'Add to Side-by-Side Compare'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyPolicyLink}
                    className="w-full px-3.5 py-2 text-left text-[13px] text-slate-700 hover:bg-slate-50 font-medium flex items-center justify-between cursor-pointer"
                  >
                    <span>{copiedPolicy ? 'Copied .edu URL' : 'Copy Official Policy URL'}</span>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Location + Verified Policy Line */}
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-slate-600">
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
              <span>
                {program.city}, {program.country}
              </span>
            </span>
            <span aria-hidden="true" className="text-slate-300">
              ·
            </span>
            <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>Verified {program.verifiedDomain} Policy</span>
            </span>
            {isApplied && (
              <>
                <span aria-hidden="true" className="text-slate-300">
                  ·
                </span>
                <span className="inline-flex items-center gap-1 text-[#0C2340] font-semibold">
                  <MailCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" aria-hidden="true" />
                  <span>Outreach Confirmed</span>
                </span>
              </>
            )}
          </div>

          {/* Visa Work Allowance & Citizenship Waiver Info */}
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-slate-700">
            <span className="font-medium text-[#1D4E89]">{program.visaRuleSummary}</span>
            <span aria-hidden="true" className="text-slate-300">
              ·
            </span>
            <span>{program.studyLevels.join(' / ')}</span>
            {hasCountryIeltsWaiver && (
              <>
                <span aria-hidden="true" className="text-slate-300">
                  ·
                </span>
                <span className="font-medium text-amber-800">
                  IELTS Waiver Eligible ({homeCountry})
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <span className="font-display font-bold text-[16px] text-[#0C2340] tabular-nums">
            {program.hourlyPayRange}
          </span>
          <span className="text-[14px] font-medium text-slate-600">{program.aidSummary}</span>
          <span aria-hidden="true" className="text-slate-300">
            ·
          </span>
          <span className="inline-flex items-center gap-1.5 text-[13px] text-slate-600 tabular-nums">
            <Calendar className="w-3.5 h-3.5 text-amber-700 shrink-0" aria-hidden="true" />
            <span>Deadline: {program.deadline}</span>
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onToggleCompare(program.id)}
            className={`px-3 py-2 rounded-md text-[12.5px] font-semibold border transition-colors duration-150 inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0C2340] ${
              isCompared
                ? 'bg-[#0C2340]/8 border-[#0C2340] text-[#0C2340]'
                : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50 hover:text-[#0C2340]'
            }`}
          >
            <GitCompareArrows className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{isCompared ? 'Comparing' : 'Compare'}</span>
          </button>

          <button
            type="button"
            onClick={() => onToggleSave(program.id)}
            className={`px-3.5 py-2 rounded-md text-[13px] font-semibold border transition-colors duration-150 inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0C2340] ${
              isSaved
                ? 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-[#0C2340]'
            }`}
          >
            {isSaved ? (
              <>
                <Check className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Saved</span>
              </>
            ) : (
              <>
                <Bookmark className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Save to Tracker</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => onViewRequirements(program)}
            className="px-4 py-2 rounded-md text-[13px] font-semibold bg-[#0C2340] hover:bg-[#16365E] text-white transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0C2340]"
          >
            {isApplied ? 'Selection Confirmed' : 'View & Select School'}
          </button>
        </div>
      </div>
    </article>
  );
};
