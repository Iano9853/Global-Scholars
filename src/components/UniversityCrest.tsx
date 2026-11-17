import React from 'react';
import { ProgramOpportunity } from '../types/program';

interface UniversityCrestProps {
  theme: ProgramOpportunity['crestTheme'];
  university: string;
}

export const UniversityCrest: React.FC<UniversityCrestProps> = ({ theme, university }) => {
  switch (theme) {
    case 'berkeley':
      return (
        <div
          className="w-14 h-14 rounded-lg border border-slate-200 bg-[#F8FAFC] flex items-center justify-center shrink-0"
          aria-label={`${university} emblem`}
        >
          <svg viewBox="0 0 48 48" className="w-10 h-10" fill="none">
            <circle cx="24" cy="24" r="21" fill="#003262" stroke="#FDB515" strokeWidth="2.5" />
            <circle cx="24" cy="24" r="15.5" stroke="#FDB515" strokeWidth="1" strokeDasharray="2 2" />
            <path d="M24 12L28 20H20L24 12Z" fill="#FDB515" />
            <rect x="17" y="22" width="14" height="9" rx="1.5" fill="#FDB515" />
            <path d="M20 26.5H28" stroke="#003262" strokeWidth="1.8" strokeLinecap="round" />
            <circle cx="24" cy="34.5" r="2" fill="#FDB515" />
          </svg>
        </div>
      );

    case 'waterloo':
      return (
        <div
          className="w-14 h-14 rounded-lg border border-slate-200 bg-[#F8FAFC] flex items-center justify-center shrink-0"
          aria-label={`${university} emblem`}
        >
          <svg viewBox="0 0 48 48" className="w-10 h-10" fill="none">
            <path
              d="M10 8H38V24C38 33.5 24 41 24 41C24 41 10 33.5 10 24V8Z"
              fill="#FFD54F"
              stroke="#111827"
              strokeWidth="2.2"
            />
            <path d="M10 15H38" stroke="#111827" strokeWidth="2.5" />
            <path d="M16 20L24 27L32 20" stroke="#111827" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M18 28L24 33.5L30 28" stroke="#111827" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      );

    case 'toronto':
      return (
        <div
          className="w-14 h-14 rounded-lg border border-slate-200 bg-[#F8FAFC] flex items-center justify-center shrink-0"
          aria-label={`${university} emblem`}
        >
          <svg viewBox="0 0 48 48" className="w-10 h-10" fill="none">
            <path
              d="M10 8H38V24C38 33.5 24 41 24 41C24 41 10 33.5 10 24V8Z"
              fill="#002A5C"
              stroke="#002A5C"
              strokeWidth="2"
            />
            <path d="M24 12V34" stroke="#FFFFFF" strokeWidth="2" />
            <path d="M16 18H32" stroke="#FFFFFF" strokeWidth="2" />
            <circle cx="24" cy="23" r="4.5" fill="#FDB515" />
          </svg>
        </div>
      );

    case 'mit':
      return (
        <div
          className="w-14 h-14 rounded-lg border border-slate-200 bg-[#F8FAFC] flex items-center justify-center shrink-0"
          aria-label={`${university} emblem`}
        >
          <svg viewBox="0 0 48 48" className="w-10 h-10" fill="none">
            <rect x="7" y="10" width="34" height="28" rx="4" fill="#750014" />
            <rect x="12" y="16" width="4" height="16" fill="#FFFFFF" />
            <rect x="18" y="16" width="4" height="11" fill="#FFFFFF" />
            <rect x="24" y="16" width="4" height="16" fill="#9CA3AF" />
            <rect x="30" y="16" width="6" height="4" fill="#FFFFFF" />
            <rect x="30" y="22" width="4" height="10" fill="#FFFFFF" />
          </svg>
        </div>
      );

    case 'tum':
      return (
        <div
          className="w-14 h-14 rounded-lg border border-slate-200 bg-[#F8FAFC] flex items-center justify-center shrink-0"
          aria-label={`${university} emblem`}
        >
          <svg viewBox="0 0 48 48" className="w-10 h-10" fill="none">
            <rect x="7" y="10" width="34" height="28" rx="4" fill="#0065BD" />
            <path
              d="M12 17H21V20H18V31H15V20H12V17ZM23 17H26V28H29V17H32V31H23V17ZM34 17H37V31H34V17Z"
              fill="#FFFFFF"
            />
          </svg>
        </div>
      );

    case 'melbourne':
      return (
        <div
          className="w-14 h-14 rounded-lg border border-slate-200 bg-[#F8FAFC] flex items-center justify-center shrink-0"
          aria-label={`${university} emblem`}
        >
          <svg viewBox="0 0 48 48" className="w-10 h-10" fill="none">
            <path
              d="M10 8H38V24C38 33.5 24 41 24 41C24 41 10 33.5 10 24V8Z"
              fill="#094183"
            />
            <path d="M24 13L29 24L24 34L19 24L24 13Z" fill="#FFFFFF" />
            <circle cx="24" cy="24" r="3" fill="#094183" />
          </svg>
        </div>
      );

    case 'eth':
      return (
        <div
          className="w-14 h-14 rounded-lg border border-slate-200 bg-[#F8FAFC] flex items-center justify-center shrink-0"
          aria-label={`${university} emblem`}
        >
          <svg viewBox="0 0 48 48" className="w-10 h-10" fill="none">
            <rect x="7" y="11" width="34" height="26" rx="3" fill="#1F407A" />
            <path d="M12 19H21M12 24H19M12 29H21" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" />
            <path d="M25 19H35M30 19V29" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" />
          </svg>
        </div>
      );

    case 'imperial':
      return (
        <div
          className="w-14 h-14 rounded-lg border border-slate-200 bg-[#F8FAFC] flex items-center justify-center shrink-0"
          aria-label={`${university} emblem`}
        >
          <svg viewBox="0 0 48 48" className="w-10 h-10" fill="none">
            <path
              d="M10 8H38V24C38 33.5 24 41 24 41C24 41 10 33.5 10 24V8Z"
              fill="#003E74"
            />
            <path d="M13 15H35" stroke="#D4AF37" strokeWidth="2.5" />
            <path d="M17 22H31L24 33L17 22Z" fill="#FFFFFF" />
          </svg>
        </div>
      );

    case 'ubc':
      return (
        <div
          className="w-14 h-14 rounded-lg border border-slate-200 bg-[#F8FAFC] flex items-center justify-center shrink-0"
          aria-label={`${university} emblem`}
        >
          <svg viewBox="0 0 48 48" className="w-10 h-10" fill="none">
            <path
              d="M10 8H38V24C38 33.5 24 41 24 41C24 41 10 33.5 10 24V8Z"
              fill="#002145"
            />
            <path d="M14 14H34" stroke="#E5A93B" strokeWidth="2.5" />
            <path d="M16 20V26C16 29.5 19.5 32.5 24 32.5C28.5 32.5 32 29.5 32 26V20" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>
      );

    case 'berea':
      return (
        <div
          className="w-14 h-14 rounded-lg border border-slate-200 bg-[#F8FAFC] flex items-center justify-center shrink-0"
          aria-label={`${university} emblem`}
        >
          <svg viewBox="0 0 48 48" className="w-10 h-10" fill="none">
            <path
              d="M10 8H38V24C38 33.5 24 41 24 41C24 41 10 33.5 10 24V8Z"
              fill="#004C97"
            />
            <path d="M14 16H34" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" />
            <path d="M24 19L29 29H19L24 19Z" fill="#FFD100" />
          </svg>
        </div>
      );

    case 'nus':
    default:
      return (
        <div
          className="w-14 h-14 rounded-lg border border-slate-200 bg-[#F8FAFC] flex items-center justify-center shrink-0"
          aria-label={`${university} emblem`}
        >
          <svg viewBox="0 0 48 48" className="w-10 h-10" fill="none">
            <path
              d="M10 8H38V24C38 33.5 24 41 24 41C24 41 10 33.5 10 24V8Z"
              fill="#003D7C"
            />
            <path d="M15 16H33V22H15V16Z" fill="#EF7C00" />
            <circle cx="24" cy="29" r="4.5" fill="#FFFFFF" />
          </svg>
        </div>
      );
  }
};
