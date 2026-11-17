import React, { useEffect, useState } from 'react';
import {
  Bookmark,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  FileText,
  Globe,
  Loader2,
  Mail,
  MapPin,
  X,
} from 'lucide-react';
import {
  ApplicationSubmission,
  ProgramOpportunity,
  UserProfile,
  VaultDocument,
} from '../types/program';
import { UniversityCrest } from './UniversityCrest';

interface RequirementsModalProps {
  program: ProgramOpportunity | null;
  user: UserProfile | null;
  homeCountry: string;
  isSaved: boolean;
  existingApplication?: ApplicationSubmission;
  vaultDocuments: VaultDocument[];
  onClose: () => void;
  onToggleSave: (id: string) => void;
  onConfirmSchoolSelection: (
    program: ProgramOpportunity
  ) => Promise<{
    delivered: boolean;
    mode: string;
    referenceId: string;
    recipient: string;
    error?: string;
  }>;
  onOpenVault: () => void;
}

export const RequirementsModal: React.FC<RequirementsModalProps> = ({
  program,
  user,
  homeCountry,
  isSaved,
  existingApplication,
  vaultDocuments,
  onClose,
  onToggleSave,
  onConfirmSchoolSelection,
  onOpenVault,
}) => {
  const [ackChecked, setAckChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [thankYouData, setThankYouData] = useState<{
    university: string;
    recipient: string;
    referenceId: string;
    delivered: boolean;
    mode: string;
    error?: string;
  } | null>(null);

  useEffect(() => {
    setAckChecked(Boolean(existingApplication?.requirementsAcknowledged));
    setThankYouData(null);
    setSubmitting(false);
  }, [program?.id, existingApplication]);

  useEffect(() => {
    if (!program) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [program, onClose]);

  if (!program) return null;

  const isWaiverEligible =
    homeCountry !== 'All Countries' && program.noIeltsCountries.includes(homeCountry);

  const handleAcknowledgeChange = async (checked: boolean) => {
    setAckChecked(checked);
    if (!checked || existingApplication || submitting) return;

    setSubmitting(true);
    try {
      const result = await onConfirmSchoolSelection(program);
      if (result.mode === 'auth_required') {
        return;
      }
      setThankYouData({
        university: program.university,
        recipient: result.recipient,
        referenceId: result.referenceId,
        delivered: result.delivered,
        mode: result.mode,
        error: result.error,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 backdrop-blur-[2px] p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="requirements-modal-title"
      onClick={onClose}
    >
      {/* Thank-You Pop-Up Window */}
      {thankYouData ? (
        <div
          className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-5"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-7 h-7" aria-hidden="true" />
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-[#0C2340] rounded-md hover:bg-slate-100 cursor-pointer"
              aria-label="Close confirmation pop-up"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-2">
            <h2
              id="requirements-modal-title"
              className="font-display font-extrabold text-[22px] text-[#0C2340] leading-snug"
            >
              Thank you, {user?.name.split(' ')[0] || 'Scholar'}!
            </h2>
            <p className="text-[14.5px] text-slate-700 leading-relaxed">
              Your selection for{' '}
              <strong className="text-[#0C2340]">{thankYouData.university}</strong> has been
              recorded. An admissions &amp; work-study official from{' '}
              <strong className="text-[#0C2340]">{thankYouData.university}</strong> will reach out
              to you shortly at{' '}
              <strong className="text-[#0C2340]">{thankYouData.recipient}</strong> so they can
              get to know more about you and guide your next steps.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#F4F6F9] border border-slate-200 space-y-2 text-[13px]">
            <div className="flex items-center gap-2 font-semibold text-[#0C2340]">
              <Mail className="w-4 h-4 text-[#1D4E89]" aria-hidden="true" />
              <span>
                {thankYouData.delivered
                  ? `Confirmation email sent directly to ${thankYouData.recipient}`
                  : thankYouData.mode === 'resend_error'
                  ? `Selection confirmed for ${thankYouData.recipient}${thankYouData.error ? ` — Resend note: ${thankYouData.error}` : ''}`
                  : `Confirmation queued for ${thankYouData.recipient} (Add RESEND_API_KEY in AI Studio Secrets to enable live inbox delivery)`}
              </span>
            </div>
            <div className="font-mono text-[12px] text-slate-600">
              Reference ID: {thankYouData.referenceId}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenVault();
              }}
              className="px-4 py-2.5 rounded-lg border border-slate-300 text-[#0C2340] text-[13px] font-semibold hover:bg-slate-50 cursor-pointer"
            >
              Open Document Vault
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg bg-[#0C2340] hover:bg-[#16365E] text-white text-[13px] font-semibold cursor-pointer"
            >
              Continue
            </button>
          </div>
        </div>
      ) : (
        <div
          className="bg-white rounded-xl border border-slate-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="sticky top-0 bg-white border-b border-slate-200 px-5 sm:px-6 py-4 flex items-start justify-between gap-4 z-10">
            <div className="flex items-start gap-3.5 min-w-0">
              <UniversityCrest theme={program.crestTheme} university={program.university} />
              <div className="min-w-0">
                <h2
                  id="requirements-modal-title"
                  className="font-display font-bold text-[17px] sm:text-[18px] text-[#0C2340] leading-snug"
                >
                  {program.programTitle}
                </h2>
                <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[13px] text-slate-600">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                    {program.city}, {program.country}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                    Verified {program.verifiedDomain}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-[#0C2340] rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Close requirements dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-5 sm:p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-lg bg-[#F4F6F9] border border-slate-200/80">
              <div>
                <p className="text-[12px] font-medium text-slate-500">Work Pay &amp; Aid</p>
                <p className="mt-1 font-display font-bold text-[15px] text-[#0C2340] tabular-nums">
                  {program.hourlyPayRange} {program.aidSummary}
                </p>
              </div>
              <div>
                <p className="text-[12px] font-medium text-slate-500">Estimated Annual Value</p>
                <p className="mt-1 font-semibold text-[14px] text-[#0C2340] tabular-nums">
                  {program.annualCoverageEstimate}
                </p>
              </div>
              <div>
                <p className="text-[12px] font-medium text-slate-500">Priority Deadline</p>
                <p className="mt-1 inline-flex items-center gap-1.5 font-semibold text-[14px] text-amber-800 tabular-nums">
                  <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                  {program.deadline}
                </p>
              </div>
            </div>

            <div>
              <h3 className="font-display font-bold text-[15px] text-[#0C2340]">
                Program &amp; Work-Study Structure
              </h3>
              <p className="mt-2 text-[14px] text-slate-600 leading-relaxed">{program.overview}</p>
            </div>

            <div className="p-4 rounded-lg border border-slate-200 bg-white space-y-2">
              <div className="flex items-center gap-2 text-[14px] font-semibold text-[#0C2340]">
                <Clock className="w-4 h-4 text-[#1D4E89]" aria-hidden="true" />
                <span>Student Visa Work-Hour Rules</span>
              </div>
              <p className="text-[13px] font-medium text-[#1D4E89]">{program.visaRuleSummary}</p>
              <p className="text-[13px] text-slate-600">{program.workHoursLimit}</p>
              {homeCountry !== 'All Countries' && (
                <p className="text-[13px] pt-1 text-slate-700">
                  <strong className="font-semibold text-[#0C2340]">{homeCountry} note:</strong>{' '}
                  {isWaiverEligible
                    ? 'Applicants educated in English-medium schools in your country typically qualify for an IELTS/TOEFL waiver.'
                    : program.noIeltsRequired
                    ? 'Alternative English proof may be accepted—confirm directly with admissions.'
                    : 'Standard IELTS/TOEFL score submission is required for visa and admission.'}
                </p>
              )}
            </div>

            <div>
              <h3 className="font-display font-bold text-[15px] text-[#0C2340]">
                Eligibility &amp; Selection Criteria
              </h3>
              <ul className="mt-2.5 space-y-2">
                {program.requirements.map((req, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2.5 text-[14px] text-slate-700 leading-snug"
                  >
                    <CheckCircle2
                      className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-display font-bold text-[15px] text-[#0C2340]">
                  Required Documents (Checked Against Your Vault)
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenVault();
                  }}
                  className="text-[13px] font-semibold text-[#1D4E89] hover:underline cursor-pointer"
                >
                  Open Document Vault
                </button>
              </div>
              <div className="mt-2.5 divide-y divide-slate-100 border border-slate-200 rounded-lg">
                {program.requiredDocuments.map((docName) => {
                  const match = vaultDocuments.find((d) =>
                    d.title.toLowerCase().includes(docName.toLowerCase().split(' ')[0])
                  );
                  const status = match?.status ?? 'Not uploaded yet';
                  return (
                    <div
                      key={docName}
                      className="px-4 py-2.5 flex items-center justify-between gap-3 text-[13px]"
                    >
                      <span className="inline-flex items-center gap-2 text-slate-800 font-medium">
                        <FileText className="w-4 h-4 text-slate-400" aria-hidden="true" />
                        {docName}
                      </span>
                      <span
                        className={`font-medium ${
                          status === 'Ready'
                            ? 'text-emerald-700'
                            : status === 'In Progress'
                            ? 'text-amber-700'
                            : 'text-slate-500'
                        }`}
                      >
                        {status}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-2 text-[13px] text-slate-500">
              <Globe className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Official institutional reference:</span>
              <span className="font-mono text-[12px] text-[#0C2340]">
                {program.officialPolicyUrlLabel}
              </span>
            </div>

            {/* Mandatory Requirements Read Confirmation Checkbox */}
            <div className="p-4 rounded-xl border border-[#0C2340]/20 bg-[#0C2340]/[0.03] space-y-2">
              {existingApplication ? (
                <div className="flex items-start gap-2.5 text-[13.5px] font-medium text-emerald-800">
                  <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                  <span>
                    Requirements confirmed. An official from{' '}
                    <strong>{program.university}</strong> has been notified and will reach out
                    to <strong>{existingApplication.studentEmail}</strong>.
                  </span>
                </div>
              ) : (
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={ackChecked}
                    disabled={submitting}
                    onChange={(e) => handleAcknowledgeChange(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-slate-400 accent-[#0C2340] cursor-pointer"
                  />
                  <div className="text-[13.5px] text-[#0C2340] leading-snug">
                    <span className="font-semibold">
                      I have read and understood all requirements needed for{' '}
                      {program.university}.
                    </span>
                    <span className="block text-[12px] text-slate-600 mt-0.5">
                      {user
                        ? `Tick this box to confirm your selection and receive an admissions outreach confirmation at ${user.email}.`
                        : 'Tick this box to sign in and request official follow-up from this institution.'}
                    </span>
                  </div>
                </label>
              )}

              {submitting && (
                <div className="flex items-center gap-2 text-[12.5px] text-[#0C2340] font-medium pt-1">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Recording selection and sending confirmation email...</span>
                </div>
              )}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="sticky bottom-0 bg-white border-t border-slate-200 px-5 sm:px-6 py-4 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => onToggleSave(program.id)}
              className={`px-4 py-2 rounded-md text-[13px] font-semibold border transition-colors inline-flex items-center gap-1.5 cursor-pointer ${
                isSaved
                  ? 'bg-amber-50 border-amber-300 text-amber-900'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {isSaved ? (
                <>
                  <Check className="w-4 h-4" aria-hidden="true" />
                  <span>Saved in Tracker</span>
                </>
              ) : (
                <>
                  <Bookmark className="w-4 h-4" aria-hidden="true" />
                  <span>Save to Tracker</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-md text-[13px] font-semibold bg-[#0C2340] hover:bg-[#16365E] text-white transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
