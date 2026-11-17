import React, { useState } from 'react';
import {
  ArrowRight,
  Ban,
  Calculator,
  CheckCircle2,
  Clock,
  Globe,
  ShieldCheck,
} from 'lucide-react';
import { VISA_WORK_GUIDES } from '../data/programs';

interface VisaGuidesViewProps {
  onBrowseCountry?: (country: string) => void;
}

export const VisaGuidesView: React.FC<VisaGuidesViewProps> = ({ onBrowseCountry }) => {
  const [selectedCountry, setSelectedCountry] = useState<string>(VISA_WORK_GUIDES[0].country);
  const [termHoursPerWeek, setTermHoursPerWeek] = useState<number>(20);
  const [breakHoursPerWeek, setBreakHoursPerWeek] = useState<number>(40);
  const [hourlyRateUsd, setHourlyRateUsd] = useState<number>(20);

  // Interactive 3-step visa readiness self-check
  const [hasOfferCheck, setHasOfferCheck] = useState(false);
  const [hasPassportCheck, setHasPassportCheck] = useState(false);
  const [hasFundsOrAwardCheck, setHasFundsOrAwardCheck] = useState(false);

  const activeGuide =
    VISA_WORK_GUIDES.find((g) => g.country === selectedCountry) ?? VISA_WORK_GUIDES[0];

  const termEarnings = termHoursPerWeek * 32 * hourlyRateUsd;
  const breakEarnings = breakHoursPerWeek * 14 * hourlyRateUsd;
  const annualTotal = termEarnings + breakEarnings;
  const annualLivingEst = activeGuide.monthlyLivingUsd * 12;
  const livingCoveragePct = Math.min(100, Math.round((annualTotal / annualLivingEst) * 100));

  const readyChecksCount = [hasOfferCheck, hasPassportCheck, hasFundsOrAwardCheck].filter(
    Boolean
  ).length;

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10 space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="max-w-2xl">
          <h1 className="font-display font-extrabold text-[28px] sm:text-[32px] text-[#0C2340] tracking-tight">
            International Student Visa &amp; Work-Study Guides
          </h1>
          <p className="mt-2 text-[15px] text-slate-600 leading-relaxed">
            Compare statutory term-time work hour caps, co-op permits, allowed vs. restricted
            jobs, living benchmarks, and post-study work visas across 8 major study destinations.
          </p>
        </div>

        {onBrowseCountry && (
          <button
            type="button"
            onClick={() => onBrowseCountry(activeGuide.country)}
            className="px-4 py-2.5 rounded-lg bg-[#0C2340] hover:bg-[#16365E] text-white text-[13px] font-semibold inline-flex items-center gap-2 self-start md:self-auto cursor-pointer whitespace-nowrap"
          >
            <span>Browse {activeGuide.country} Programs</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Country Selector Tabs (8 Destinations) */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-4">
        {VISA_WORK_GUIDES.map((guide) => {
          const isSelected = guide.country === selectedCountry;
          return (
            <button
              key={guide.country}
              type="button"
              onClick={() => setSelectedCountry(guide.country)}
              className={`px-4 py-2 rounded-md text-[13px] font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                isSelected
                  ? 'bg-[#0C2340] text-white'
                  : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300 hover:text-[#0C2340]'
              }`}
            >
              {guide.country}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-6 items-start">
        {/* Selected Country Detailed Policy */}
        <section className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-slate-100">
            <div>
              <p className="text-[12px] font-semibold text-slate-500">Official Visa Framework</p>
              <h2 className="font-display font-bold text-[22px] text-[#0C2340] mt-0.5">
                {activeGuide.country} — {activeGuide.visaName}
              </h2>
            </div>
            <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-emerald-700">
              <ShieldCheck className="w-4 h-4" aria-hidden="true" />
              <span>2026–2027 Verified Rules</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-[#F4F6F9]">
              <div className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-500">
                <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Term-Time Work Cap</span>
              </div>
              <p className="mt-1.5 text-[14px] font-semibold text-[#0C2340]">
                {activeGuide.termWorkLimit}
              </p>
            </div>

            <div className="p-4 rounded-lg bg-[#F4F6F9]">
              <div className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-500">
                <Globe className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Scheduled Break Work Cap</span>
              </div>
              <p className="mt-1.5 text-[14px] font-semibold text-[#0C2340]">
                {activeGuide.breakWorkLimit}
              </p>
            </div>

            <div className="p-4 rounded-lg bg-[#F4F6F9]">
              <p className="text-[12px] font-semibold text-slate-500">Typical Campus / Co-op Pay</p>
              <p className="mt-1.5 text-[14px] font-semibold text-[#0C2340] tabular-nums">
                {activeGuide.typicalCampusWage}
              </p>
            </div>

            <div className="p-4 rounded-lg bg-[#F4F6F9]">
              <p className="text-[12px] font-semibold text-slate-500">Post-Study Work Pathway</p>
              <p className="mt-1.5 text-[14px] font-semibold text-[#0C2340]">
                {activeGuide.postStudyPathway}
              </p>
            </div>
          </div>

          {/* Allowed vs Prohibited Work Rules */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg border border-emerald-200 bg-emerald-50/40 space-y-2.5">
              <h3 className="font-display font-bold text-[14px] text-emerald-900">
                Permitted Work Activities
              </h3>
              <ul className="space-y-2">
                {activeGuide.allowedWorkExamples.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-[13px] text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-lg border border-red-200 bg-red-50/40 space-y-2.5">
              <h3 className="font-display font-bold text-[14px] text-red-900">
                Restricted / Prohibited Work
              </h3>
              <ul className="space-y-2">
                {activeGuide.prohibitedWorkExamples.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-[13px] text-slate-700">
                    <Ban className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div>
            <h3 className="font-display font-bold text-[15px] text-[#0C2340]">
              Compliance &amp; Authorization Checklist
            </h3>
            <ul className="mt-3 space-y-2.5">
              {activeGuide.keyRequirements.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-[14px] text-slate-700">
                  <CheckCircle2
                    className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <h3 className="font-display font-bold text-[14px] text-[#0C2340]">
              Tax &amp; Permit Notes
            </h3>
            <p className="mt-1.5 text-[14px] text-slate-600 leading-relaxed">
              {activeGuide.taxAndPermitNotes}
            </p>
          </div>
        </section>

        {/* Right Column: Interactive Calculator + Self-Check */}
        <aside className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
            <div className="flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-lg bg-[#0C2340] text-white flex items-center justify-center shrink-0">
                <Calculator className="w-4 h-4" aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-display font-bold text-[16px] text-[#0C2340]">
                  Annual Work-Study Estimator
                </h2>
                <p className="text-[12px] text-slate-500">
                  Gross earnings (32 term wks + 14 break wks) vs. {activeGuide.country} living cost
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-[13px] mb-1.5">
                  <label htmlFor="term-hours" className="font-medium text-slate-700">
                    Term Hours / Week
                  </label>
                  <span className="font-mono font-semibold text-[#0C2340] tabular-nums">
                    {termHoursPerWeek} hrs
                  </span>
                </div>
                <input
                  id="term-hours"
                  type="range"
                  min={5}
                  max={24}
                  step={1}
                  value={termHoursPerWeek}
                  onChange={(e) => setTermHoursPerWeek(Number(e.target.value))}
                  className="w-full accent-[#0C2340] cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-[13px] mb-1.5">
                  <label htmlFor="break-hours" className="font-medium text-slate-700">
                    Break / Co-op Hours / Week
                  </label>
                  <span className="font-mono font-semibold text-[#0C2340] tabular-nums">
                    {breakHoursPerWeek} hrs
                  </span>
                </div>
                <input
                  id="break-hours"
                  type="range"
                  min={0}
                  max={40}
                  step={5}
                  value={breakHoursPerWeek}
                  onChange={(e) => setBreakHoursPerWeek(Number(e.target.value))}
                  className="w-full accent-[#0C2340] cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-[13px] mb-1.5">
                  <label htmlFor="hourly-rate" className="font-medium text-slate-700">
                    Average Hourly Wage (USD eq.)
                  </label>
                  <span className="font-mono font-semibold text-[#0C2340] tabular-nums">
                    ${hourlyRateUsd}/hr
                  </span>
                </div>
                <input
                  id="hourly-rate"
                  type="range"
                  min={12}
                  max={38}
                  step={1}
                  value={hourlyRateUsd}
                  onChange={(e) => setHourlyRateUsd(Number(e.target.value))}
                  className="w-full accent-[#0C2340] cursor-pointer"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-2">
              <div className="flex justify-between text-[13px] text-slate-600 tabular-nums">
                <span>Academic Term Earnings (32 wks)</span>
                <span className="font-mono font-medium text-[#0C2340]">
                  ${termEarnings.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-[13px] text-slate-600 tabular-nums">
                <span>Break / Co-op Earnings (14 wks)</span>
                <span className="font-mono font-medium text-[#0C2340]">
                  ${breakEarnings.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-[13px] text-slate-600 tabular-nums">
                <span>Est. Living Cost ({activeGuide.country}, 12 mos)</span>
                <span className="font-mono font-medium text-slate-700">
                  ${annualLivingEst.toLocaleString()}
                </span>
              </div>
              <div className="pt-3 mt-2 border-t border-slate-200 flex items-baseline justify-between">
                <span className="text-[14px] font-semibold text-[#0C2340]">
                  Estimated Annual Offset
                </span>
                <span className="font-display font-extrabold text-[24px] text-[#0C2340] tabular-nums">
                  ${annualTotal.toLocaleString()}
                </span>
              </div>
              <p className="text-[12px] text-emerald-700 font-medium">
                Covers ~{livingCoveragePct}% of estimated annual rent &amp; meals in{' '}
                {activeGuide.country}.
              </p>
            </div>
          </div>

          {/* 3-Check Visa Eligibility Pre-Flight */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold text-[15px] text-[#0C2340]">
                Quick Visa Readiness Check
              </h2>
              <span className="font-mono text-[12px] font-bold text-[#0C2340]">
                {readyChecksCount} / 3
              </span>
            </div>
            <div className="space-y-3 text-[13px]">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasOfferCheck}
                  onChange={(e) => setHasOfferCheck(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-[#0C2340]"
                />
                <span className="text-slate-700">
                  Full-time admission target at an accredited university
                </span>
              </label>
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasPassportCheck}
                  onChange={(e) => setHasPassportCheck(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-[#0C2340]"
                />
                <span className="text-slate-700">
                  Passport valid at least 6 months beyond intended arrival
                </span>
              </label>
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasFundsOrAwardCheck}
                  onChange={(e) => setHasFundsOrAwardCheck(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-[#0C2340]"
                />
                <span className="text-slate-700">
                  Scholarship / family affidavit ready for 20% household share
                </span>
              </label>
            </div>
            {readyChecksCount === 3 && (
              <p className="text-[12.5px] font-semibold text-emerald-700">
                You meet the baseline document readiness for {activeGuide.visaName}.
              </p>
            )}
          </div>
        </aside>
      </div>

      {/* 8-Country Side-by-Side Comparison Matrix */}
      <section className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        <div>
          <h2 className="font-display font-bold text-[18px] text-[#0C2340]">
            8-Country Work-Study &amp; Post-Study Comparison Matrix
          </h2>
          <p className="text-[13px] text-slate-600">
            Click any destination row to inspect its detailed rules above.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2.5 pr-4 font-semibold">Country</th>
                <th className="py-2.5 px-3 font-semibold">Term Work Limit</th>
                <th className="py-2.5 px-3 font-semibold">Campus Wage</th>
                <th className="py-2.5 px-3 font-semibold">Living Est. / Mo</th>
                <th className="py-2.5 pl-3 font-semibold">Post-Study Stay</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {VISA_WORK_GUIDES.map((g) => (
                <tr
                  key={g.country}
                  onClick={() => setSelectedCountry(g.country)}
                  className={`cursor-pointer transition-colors ${
                    g.country === selectedCountry ? 'bg-[#0C2340]/[0.04]' : 'hover:bg-slate-50'
                  }`}
                >
                  <td className="py-3 pr-4 font-bold text-[#0C2340]">{g.country}</td>
                  <td className="py-3 px-3 text-slate-700">{g.termWorkLimit}</td>
                  <td className="py-3 px-3 font-mono font-semibold text-[#0C2340] tabular-nums">
                    {g.typicalCampusWage}
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-600 tabular-nums">
                    ~${g.monthlyLivingUsd.toLocaleString()}/mo
                  </td>
                  <td className="py-3 pl-3 text-[#1D4E89] font-medium">{g.postStudyPathway}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
