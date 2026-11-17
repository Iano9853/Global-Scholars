import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  Bookmark,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  DollarSign,
  FileText,
  GitCompareArrows,
  MailCheck,
  MapPin,
  SlidersHorizontal,
} from 'lucide-react';
import {
  ApplicationSubmission,
  ProgramOpportunity,
  UserProfile,
  VaultDocument,
} from '../types/program';
import {
  calculateTuitionSplitEstimate,
  computePersonalizedMatches,
  getDeadlineCountdownText,
  getDemonym,
} from '../utils/matching';
import { UniversityCrest } from './UniversityCrest';

interface StudentDashboardProps {
  user: UserProfile;
  programs: ProgramOpportunity[];
  savedProgramIds: string[];
  applications: ApplicationSubmission[];
  vaultDocuments: VaultDocument[];
  compareIds: string[];
  onToggleSave: (id: string) => void;
  onToggleCompare: (id: string) => void;
  onViewRequirements: (program: ProgramOpportunity) => void;
  onEditPreferences: () => void;
  onOpenVault: () => void;
  onBrowseAll: () => void;
}

type MatchFilterPill = 'all' | 'full' | 'coop' | 'no-ielts';

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  user,
  programs,
  savedProgramIds,
  applications,
  vaultDocuments,
  compareIds,
  onToggleSave,
  onToggleCompare,
  onViewRequirements,
  onEditPreferences,
  onOpenVault,
  onBrowseAll,
}) => {
  const { onboarding } = user;
  const [matchFilter, setMatchFilter] = useState<MatchFilterPill>('all');

  const allScoredMatches = useMemo(
    () => computePersonalizedMatches(programs, onboarding),
    [programs, onboarding]
  );

  const filteredMatches = useMemo(() => {
    return allScoredMatches
      .filter(({ program }) => {
        if (matchFilter === 'full') return program.supportsFullCoverage;
        if (matchFilter === 'coop') return program.coopEligible;
        if (matchFilter === 'no-ielts') {
          return onboarding.passportCountry
            ? program.noIeltsCountries.includes(onboarding.passportCountry)
            : program.noIeltsRequired;
        }
        return true;
      })
      .slice(0, 6);
  }, [allScoredMatches, matchFilter, onboarding.passportCountry]);

  const savedPrograms = useMemo(
    () => programs.filter((p) => savedProgramIds.includes(p.id)),
    [programs, savedProgramIds]
  );

  const appliedIds = useMemo(
    () => new Set(applications.map((a) => a.programId)),
    [applications]
  );

  const tuitionSplit = useMemo(
    () =>
      calculateTuitionSplitEstimate(
        onboarding.degreeType,
        onboarding.broadFields,
        onboarding.majors,
        onboarding.targetCountries
      ),
    [
      onboarding.degreeType,
      onboarding.broadFields,
      onboarding.majors,
      onboarding.targetCountries,
    ]
  );

  const readyDocsCount = vaultDocuments.filter((d) => d.status === 'Ready').length;

  const profileCompletionPct = useMemo(() => {
    let score = 20;
    if (onboarding.passportCountry) score += 20;
    if (
      onboarding.degreeType &&
      (onboarding.broadFields.length > 0 || onboarding.majors.length > 0)
    ) {
      score += 20;
    }
    if (onboarding.rawGrade && onboarding.gradeSystem) score += 20;
    if (onboarding.workStudyPreferences.length > 0 && onboarding.targetCountries.length > 0) {
      score += 20;
    }
    return Math.min(100, score);
  }, [onboarding]);

  const citizenLabel = onboarding.passportCountry
    ? `${getDemonym(onboarding.passportCountry)}`
    : 'International Applicant';
  const degreeLabel = onboarding.degreeType || 'Degree Pending';
  const primaryMajorOrField =
    onboarding.majors[0] ?? onboarding.broadFields[0] ?? 'Field Pending';
  const primaryFunding =
    onboarding.workStudyPreferences[0] ?? 'Funding Preference Pending';

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8">
      {/* 1 & 2: Personalized Summary Hero Banner + Profile Completion */}
      <section className="bg-[#0C2340] text-white rounded-2xl p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2.5">
          <div className="text-[12px] font-semibold text-[#E59E16]">
            Personalized Student Dashboard
          </div>
          <h1 className="font-display font-extrabold text-[20px] sm:text-[26px] leading-snug tracking-tight">
            Showing programs for: {citizenLabel} · {degreeLabel} · {primaryMajorOrField} ·{' '}
            {primaryFunding}
          </h1>
          <p className="text-[13.5px] sm:text-[14px] text-slate-300">
            {onboarding.estimatedGpa4 > 0 ? (
              <>
                Estimated US GPA Equivalent:{' '}
                <strong className="text-white font-mono tabular-nums">
                  {onboarding.estimatedGpa4.toFixed(2)} / 4.0
                </strong>
              </>
            ) : (
              <span>GPA not entered yet</span>
            )}
            {onboarding.budgetTier ? (
              <>
                {' '}
                · Out-of-Pocket Target:{' '}
                <strong className="text-white">{onboarding.budgetTier}</strong>
              </>
            ) : null}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-3 shrink-0">
          <div className="w-full sm:w-56 bg-white/10 rounded-lg p-3 border border-white/15">
            <div className="flex items-center justify-between text-[12px] mb-1.5">
              <span className="text-slate-200">Profile Completion</span>
              <span className="font-mono font-bold text-[#E59E16] tabular-nums">
                {profileCompletionPct}%
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-white/15 overflow-hidden">
              <div
                className="h-full bg-[#E59E16] rounded-full transition-all duration-300"
                style={{ width: `${profileCompletionPct}%` }}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={onEditPreferences}
            className="px-4 py-2.5 rounded-lg bg-white text-[#0C2340] hover:bg-slate-100 font-semibold text-[13px] inline-flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
          >
            <SlidersHorizontal className="w-4 h-4" aria-hidden="true" />
            <span>
              {onboarding.onboardingCompleted ? 'Edit Preferences' : 'Complete Profile Setup'}
            </span>
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-[1.65fr_1fr] gap-8 items-start">
        {/* Left Column: Ranked Personalized Matches + Quick Filter Bar */}
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display font-bold text-[19px] sm:text-[20px] text-[#0C2340]">
                Personalized University Matches
              </h2>
              <p className="text-[13px] text-slate-600">
                Select any matched school below, review its requirements, and tick the confirmation
                box to request official admissions outreach.
              </p>
            </div>
            <button
              type="button"
              onClick={onBrowseAll}
              className="text-[13px] font-semibold text-[#1D4E89] hover:underline whitespace-nowrap cursor-pointer"
            >
              Browse All →
            </button>
          </div>

          {/* 3: Quick Match Filter Bar */}
          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                { id: 'all', label: 'All Top Matches' },
                { id: 'full', label: 'Full Aid / 80%+ Tuition' },
                { id: 'coop', label: 'Paid Co-op / CPT' },
                { id: 'no-ielts', label: 'IELTS Waived' },
              ] as { id: MatchFilterPill; label: string }[]
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setMatchFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-md text-[12.5px] font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
                  matchFilter === tab.id
                    ? 'bg-[#0C2340] border-[#0C2340] text-white'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {filteredMatches.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
                <p className="text-[14px] text-slate-600">
                  No top matches fit that filter right now. Switch back to &ldquo;All Top
                  Matches&rdquo; or broaden your target countries.
                </p>
              </div>
            ) : (
              filteredMatches.map(({ program, matchPercent, highlights }) => {
                const isSaved = savedProgramIds.includes(program.id);
                const isApplied = appliedIds.has(program.id);
                const isCompared = compareIds.includes(program.id);
                return (
                  <article
                    key={program.id}
                    className="bg-white rounded-xl border border-slate-200/90 p-5 sm:p-6 hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <UniversityCrest
                        theme={program.crestTheme}
                        university={program.university}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <h3 className="font-display font-bold text-[16px] sm:text-[17px] text-[#0C2340] leading-snug">
                            {program.programTitle}
                          </h3>
                          <span className="px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 font-mono font-bold text-[12px] text-emerald-800 tabular-nums shrink-0">
                            {matchPercent}% Match
                          </span>
                        </div>

                        <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[13px] text-slate-600">
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                            {program.city}, {program.country}
                          </span>
                          <span aria-hidden="true" className="text-slate-300">
                            ·
                          </span>
                          <span className="text-[#1D4E89] font-medium">
                            {program.visaRuleSummary}
                          </span>
                          {isApplied && (
                            <>
                              <span aria-hidden="true" className="text-slate-300">
                                ·
                              </span>
                              <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                                <MailCheck className="w-3.5 h-3.5" aria-hidden="true" />
                                Outreach Requested
                              </span>
                            </>
                          )}
                        </div>

                        {highlights.length > 0 && (
                          <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-emerald-700 font-medium">
                            {highlights.map((h) => (
                              <span key={h} className="inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                {h}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px]">
                        <span className="font-display font-bold text-[15px] text-[#0C2340] tabular-nums">
                          {program.hourlyPayRange}
                        </span>
                        <span className="text-slate-600 font-medium">{program.aidSummary}</span>
                        <span aria-hidden="true" className="text-slate-300">
                          ·
                        </span>
                        <span className="text-amber-800 font-medium tabular-nums">
                          Deadline: {program.deadline}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => onToggleCompare(program.id)}
                          className={`px-3 py-2 rounded-md text-[12.5px] font-semibold border inline-flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap ${
                            isCompared
                              ? 'bg-[#0C2340]/8 border-[#0C2340] text-[#0C2340]'
                              : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <GitCompareArrows className="w-3.5 h-3.5" />
                          <span>{isCompared ? 'Comparing' : 'Compare'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onToggleSave(program.id)}
                          className={`px-3.5 py-2 rounded-md text-[13px] font-semibold border inline-flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap ${
                            isSaved
                              ? 'bg-amber-50 border-amber-300 text-amber-900'
                              : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {isSaved ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Saved</span>
                            </>
                          ) : (
                            <>
                              <Bookmark className="w-3.5 h-3.5" />
                              <span>Save</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => onViewRequirements(program)}
                          className="px-4 py-2 rounded-md text-[13px] font-semibold bg-[#0C2340] hover:bg-[#16365E] text-white cursor-pointer whitespace-nowrap"
                        >
                          {isApplied ? 'View Selection' : 'Select & Review Requirements'}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>

        {/* Right Column: Applied Outreach, 80/20 Cost Split, Saved Deadlines, Checklist & Vault */}
        <aside className="space-y-6">
          {/* 6: Selected Schools & Official Outreach */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold text-[16px] text-[#0C2340]">
                Selected Schools ({applications.length})
              </h2>
              <MailCheck className="w-4 h-4 text-emerald-700" aria-hidden="true" />
            </div>

            {applications.length === 0 ? (
              <p className="text-[13px] text-slate-600 leading-relaxed">
                Open any matched university above and tick the &ldquo;I have read all requirements
                needed&rdquo; checkbox to confirm your selection and trigger official admissions
                outreach to <strong className="text-[#0C2340]">{user.email}</strong>.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {applications.map((app) => (
                  <div key={app.programId} className="py-3 first:pt-0 last:pb-0 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-semibold text-[13.5px] text-[#0C2340]">
                        {app.university}
                      </span>
                      <span className="text-[11.5px] font-semibold text-emerald-700 shrink-0">
                        {app.status}
                      </span>
                    </div>
                    <p className="text-[12px] text-slate-500">
                      Official follow-up sent to {app.studentEmail}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 7: 80% / 20% Household Aid & Work-Study Estimate */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3.5">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold text-[16px] text-[#0C2340]">
                80% Aid / 20% Household Split
              </h2>
              <DollarSign className="w-4 h-4 text-[#B46900]" aria-hidden="true" />
            </div>
            <p className="text-[12px] text-slate-500">{tuitionSplit.basisLabel}</p>
            <div className="space-y-2 text-[13px] tabular-nums">
              <div className="flex justify-between text-slate-600">
                <span>Estimated Annual Tuition</span>
                <span className="font-mono font-semibold text-[#0C2340]">
                  ${tuitionSplit.grossAnnualUsd.toLocaleString()}/yr
                </span>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span>University Pays (80%)</span>
                <span className="font-mono font-semibold">
                  -${tuitionSplit.institutionCovers80Usd.toLocaleString()}/yr
                </span>
              </div>
              <div className="flex justify-between text-slate-700 pt-2 border-t border-slate-100 font-semibold">
                <span>Household 20% Share</span>
                <span className="font-mono text-[#0C2340]">
                  ${tuitionSplit.householdShare20Usd.toLocaleString()}/yr
                </span>
              </div>
              <div className="flex justify-between text-[#1D4E89] text-[12.5px]">
                <span>Est. Campus Work-Study Offset</span>
                <span className="font-mono">
                  -${tuitionSplit.estimatedWorkStudyOffsetUsd.toLocaleString()}/yr
                </span>
              </div>
              <div className="p-3 rounded-lg bg-[#F4F6F9] flex justify-between items-baseline font-bold text-[#0C2340]">
                <span className="text-[12.5px]">Net Remaining Out-of-Pocket</span>
                <span className="font-mono text-[15px]">
                  ${tuitionSplit.netHouseholdAfterWorkUsd.toLocaleString()}/yr
                </span>
              </div>
            </div>
          </div>

          {/* 8: Saved Deadlines */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold text-[16px] text-[#0C2340]">
                Saved Deadlines ({savedPrograms.length})
              </h2>
              <Clock className="w-4 h-4 text-slate-400" aria-hidden="true" />
            </div>

            {savedPrograms.length === 0 ? (
              <p className="text-[13px] text-slate-500">
                You haven&apos;t saved any universities yet. Click &ldquo;Save&rdquo; on any
                match to monitor its deadline countdown.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {savedPrograms.map((prog) => (
                  <div key={prog.id} className="py-3 first:pt-0 last:pb-0 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => onViewRequirements(prog)}
                        className="text-left font-semibold text-[13.5px] text-[#0C2340] hover:underline cursor-pointer"
                      >
                        {prog.university}
                      </button>
                      <span className="font-mono text-[12px] font-semibold text-amber-800 tabular-nums shrink-0">
                        {getDeadlineCountdownText(prog.deadline)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[12px] text-slate-500 tabular-nums">
                      <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Priority cutoff: {prog.deadline}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 9: Next-Steps Readiness Checklist */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
            <h2 className="font-display font-bold text-[16px] text-[#0C2340]">
              Application Readiness Steps
            </h2>
            <ul className="space-y-2.5 text-[13px]">
              {[
                {
                  label: 'Verified student account active',
                  done: user.emailVerified,
                },
                {
                  label: 'Academic & financial profile completed',
                  done: onboarding.onboardingCompleted,
                },
                {
                  label: 'At least 1 preferred school confirmed',
                  done: applications.length > 0,
                },
                {
                  label: 'Transcripts / ID added to Document Vault',
                  done: vaultDocuments.length > 0,
                },
              ].map((step) => (
                <li key={step.label} className="flex items-center gap-2.5">
                  <CheckCircle2
                    className={`w-4 h-4 shrink-0 ${
                      step.done ? 'text-emerald-600' : 'text-slate-300'
                    }`}
                  />
                  <span className={step.done ? 'text-[#0C2340] font-medium' : 'text-slate-500'}>
                    {step.label}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* 10: Document Vault Quick Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold text-[16px] text-[#0C2340]">
                Document Vault
              </h2>
              <FileText className="w-4 h-4 text-slate-400" aria-hidden="true" />
            </div>

            <div className="p-3.5 rounded-lg bg-[#F4F6F9] flex items-baseline justify-between">
              <span className="text-[13px] text-slate-600">
                {vaultDocuments.length === 0 ? 'No documents uploaded yet' : 'Documents Ready'}
              </span>
              <span className="font-mono font-bold text-[18px] text-[#0C2340] tabular-nums">
                {readyDocsCount} / {vaultDocuments.length}
              </span>
            </div>

            <button
              type="button"
              onClick={onOpenVault}
              className="w-full h-10 rounded-lg bg-[#0C2340] hover:bg-[#16365E] text-white text-[13px] font-semibold inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Open Document Vault</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};
