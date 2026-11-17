import React, { useEffect } from 'react';
import { CheckCircle2, X } from 'lucide-react';
import { ProgramOpportunity } from '../types/program';
import { UniversityCrest } from './UniversityCrest';

interface CompareModalProps {
  programs: ProgramOpportunity[];
  homeCountry: string;
  onClose: () => void;
  onRemoveProgram: (id: string) => void;
  onSelectProgram: (program: ProgramOpportunity) => void;
}

export const CompareModal: React.FC<CompareModalProps> = ({
  programs,
  homeCountry,
  onClose,
  onRemoveProgram,
  onSelectProgram,
}) => {
  useEffect(() => {
    if (programs.length === 0) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [programs.length, onClose]);

  if (programs.length === 0) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 backdrop-blur-[2px] p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="compare-modal-title"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl border border-slate-200 max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-slate-200 px-5 sm:px-6 py-4 flex items-center justify-between gap-4 z-10">
          <div>
            <h2
              id="compare-modal-title"
              className="font-display font-bold text-[18px] sm:text-[20px] text-[#0C2340]"
            >
              Side-by-Side University Comparison ({programs.length}/3)
            </h2>
            <p className="text-[12.5px] text-slate-500">
              Compare work-study pay, visa rules, tuition coverage, and GPA cutoffs before selecting.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-[#0C2340] rounded-md hover:bg-slate-100 cursor-pointer"
            aria-label="Close comparison dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left text-[13.5px]">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="py-3 pr-4 text-[12px] font-semibold text-slate-500 w-44 align-top">
                  Criterion
                </th>
                {programs.map((p) => (
                  <th key={p.id} className="py-3 px-4 align-top">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5">
                        <UniversityCrest theme={p.crestTheme} university={p.university} />
                        <div>
                          <div className="font-display font-bold text-[15px] text-[#0C2340]">
                            {p.university}
                          </div>
                          <div className="text-[12px] font-normal text-slate-500">
                            {p.city}, {p.country}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onRemoveProgram(p.id)}
                        className="text-[11px] text-slate-400 hover:text-red-600 cursor-pointer shrink-0"
                        aria-label={`Remove ${p.university} from comparison`}
                      >
                        Remove
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="py-3.5 pr-4 font-semibold text-slate-600">Funding Type</td>
                {programs.map((p) => (
                  <td key={p.id} className="py-3.5 px-4 font-medium text-[#0C2340]">
                    {p.fundingType}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-3.5 pr-4 font-semibold text-slate-600">Hourly Work Pay</td>
                {programs.map((p) => (
                  <td key={p.id} className="py-3.5 px-4 font-display font-bold text-[#0C2340] tabular-nums">
                    {p.hourlyPayRange}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-3.5 pr-4 font-semibold text-slate-600">Annual Aid Value</td>
                {programs.map((p) => (
                  <td key={p.id} className="py-3.5 px-4 text-slate-700 tabular-nums">
                    {p.annualCoverageEstimate}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-3.5 pr-4 font-semibold text-slate-600">Visa Work Hours</td>
                {programs.map((p) => (
                  <td key={p.id} className="py-3.5 px-4 text-[#1D4E89] font-medium">
                    {p.workHoursLimit}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-3.5 pr-4 font-semibold text-slate-600">Minimum GPA Cutoff</td>
                {programs.map((p) => (
                  <td key={p.id} className="py-3.5 px-4 font-mono font-semibold text-[#0C2340] tabular-nums">
                    {p.minGpa4Scale.toFixed(1)} / 4.0
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-3.5 pr-4 font-semibold text-slate-600">Tuition Waiver</td>
                {programs.map((p) => (
                  <td key={p.id} className="py-3.5 px-4">
                    {p.tuitionWaiver ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                        <CheckCircle2 className="w-4 h-4" />
                        Yes
                      </span>
                    ) : (
                      <span className="text-slate-500">Need / Work Aid</span>
                    )}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-3.5 pr-4 font-semibold text-slate-600">
                  IELTS Policy {homeCountry !== 'All Countries' ? `(${homeCountry})` : ''}
                </td>
                {programs.map((p) => {
                  const waived =
                    homeCountry !== 'All Countries'
                      ? p.noIeltsCountries.includes(homeCountry)
                      : p.noIeltsRequired;
                  return (
                    <td key={p.id} className="py-3.5 px-4">
                      {waived ? (
                        <span className="text-emerald-700 font-semibold">Waiver Eligible</span>
                      ) : (
                        <span className="text-slate-600">IELTS / TOEFL Required</span>
                      )}
                    </td>
                  );
                })}
              </tr>
              <tr>
                <td className="py-3.5 pr-4 font-semibold text-slate-600">Priority Deadline</td>
                {programs.map((p) => (
                  <td key={p.id} className="py-3.5 px-4 font-semibold text-amber-800 tabular-nums">
                    {p.deadline}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-4 pr-4 font-semibold text-slate-600">Action</td>
                {programs.map((p) => (
                  <td key={p.id} className="py-4 px-4">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onSelectProgram(p);
                      }}
                      className="px-4 py-2 rounded-md bg-[#0C2340] hover:bg-[#16365E] text-white text-[12.5px] font-semibold cursor-pointer whitespace-nowrap"
                    >
                      View &amp; Select School
                    </button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
