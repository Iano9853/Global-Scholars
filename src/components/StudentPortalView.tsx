import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Banknote,
  BookOpen,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  CloudUpload,
  Copy,
  Download,
  Eye,
  EyeOff,
  FileSpreadsheet,
  GraduationCap,
  Inbox,
  KeyRound,
  Lock,
  LogOut,
  Mail,
  Search,
  ShieldCheck,
  UserCheck,
  Users,
} from 'lucide-react';
import { auth } from '../firebase';
import {
  fetchOwnStudentPortalFromFirestore,
  sha256Hex,
  upsertStudentPortalAsAdmin,
} from '../services/userStorage';
import { StudentMailMessage, StudentPortalRecord, UserProfile } from '../types/program';
import {
  downloadOfficialAcademicTranscriptPdf,
  downloadOfficialFeeStatementPdf,
} from '../utils/officialPdfGenerator';
import { UniversityCrest } from './UniversityCrest';

const ADMIN_EMAIL = 'mulijosephine446@gmail.com';

interface AdminRosterEntry extends StudentPortalRecord {
  portalPasswordHash: string;
  generatedPortalPassword: string;
}

interface StudentPortalViewProps {
  user: UserProfile | null;
  onOpenAuth: (mode: 'login' | 'signup') => void;
  onToast: (message: string) => void;
}

export const StudentPortalView: React.FC<StudentPortalViewProps> = ({
  user,
  onOpenAuth,
  onToast,
}) => {
  const [portalEmailInput, setPortalEmailInput] = useState('');
  const [portalPasswordInput, setPortalPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authenticating, setAuthenticating] = useState(false);

  const [unlockedPortal, setUnlockedPortal] = useState<StudentPortalRecord | null>(null);
  const [portalSubTab, setPortalSubTab] = useState<
    'overview' | 'student-mail' | 'fees-transcript' | 'academic-transcript' | 'pre-arrival'
  >('overview');
  const [completedChecklistIds, setCompletedChecklistIds] = useState<string[]>([]);

  // Student Mail state
  const [mailMessages, setMailMessages] = useState<StudentMailMessage[]>([]);
  const [selectedMailId, setSelectedMailId] = useState<string | null>(null);
  const [mailCategoryFilter, setMailCategoryFilter] = useState<
    'All' | 'Admissions' | 'Financial Aid' | 'Work-Study'
  >('All');
  const [mailSearch, setMailSearch] = useState('');

  // Admin Coordinator Roster state (visible strictly to ADMIN_EMAIL)
  const isCoordinator =
    Boolean(user?.email) && user?.email.trim().toLowerCase() === ADMIN_EMAIL;
  const [adminRoster, setAdminRoster] = useState<AdminRosterEntry[]>([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [syncingPortalId, setSyncingPortalId] = useState<string | null>(null);

  // Reset unlocked state whenever signed-in user changes
  useEffect(() => {
    setUnlockedPortal(null);
    setMailMessages([]);
    setSelectedMailId(null);
    setPortalEmailInput('');
    setPortalPasswordInput('');
    setAuthError(null);
    setAdminRoster([]);
    setAdminError(null);
  }, [user?.id, user?.email]);

  // Sync local mail list whenever a portal unlocks
  useEffect(() => {
    if (!unlockedPortal) {
      setMailMessages([]);
      setSelectedMailId(null);
      return;
    }
    const msgs = unlockedPortal.studentMail || [];
    setMailMessages(msgs);
    setSelectedMailId(msgs[0]?.id ?? null);
  }, [unlockedPortal]);

  useEffect(() => {
    if (!isCoordinator || !auth.currentUser) return;
    let active = true;

    const loadRoster = async () => {
      setAdminLoading(true);
      setAdminError(null);
      try {
        const idToken = await auth.currentUser?.getIdToken(true);
        if (!idToken) return;
        const resp = await fetch('/api/student-portal/admin-roster', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken }),
        });
        const rawText = await resp.text();
        let data: { authorized?: boolean; students?: AdminRosterEntry[]; error?: string } | null =
          null;
        try {
          data = JSON.parse(rawText);
        } catch {
          data = null;
        }
        if (!active) return;
        if (resp.ok && data?.authorized && Array.isArray(data.students)) {
          setAdminRoster(data.students);
        } else {
          setAdminError(
            data?.error ||
              'Coordinator roster endpoint is only available when running the Express backend server.'
          );
        }
      } catch {
        if (active) {
          setAdminError('Unable to reach coordinator roster service.');
        }
      } finally {
        if (active) setAdminLoading(false);
      }
    };

    loadRoster();
    return () => {
      active = false;
    };
  }, [isCoordinator, user?.id]);

  const unreadMailCount = useMemo(
    () => mailMessages.filter((m) => !m.read).length,
    [mailMessages]
  );

  const filteredMailMessages = useMemo(() => {
    const q = mailSearch.trim().toLowerCase();
    return mailMessages.filter((msg) => {
      if (mailCategoryFilter !== 'All' && msg.category !== mailCategoryFilter) {
        return false;
      }
      if (!q) return true;
      return (
        msg.subject.toLowerCase().includes(q) ||
        msg.senderName.toLowerCase().includes(q) ||
        msg.body.toLowerCase().includes(q)
      );
    });
  }, [mailMessages, mailCategoryFilter, mailSearch]);

  const selectedMail = useMemo(
    () => mailMessages.find((m) => m.id === selectedMailId) || filteredMailMessages[0] || null,
    [mailMessages, selectedMailId, filteredMailMessages]
  );

  const handleSelectMail = (msgId: string) => {
    setSelectedMailId(msgId);
    setMailMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, read: true } : m))
    );
  };

  const handleToggleMailRead = (msgId: string) => {
    setMailMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, read: !m.read } : m))
    );
  };

  const handlePortalLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !auth.currentUser) return;

    const cleanPortalEmail = portalEmailInput.trim().toLowerCase();
    const cleanPassword = portalPasswordInput;

    if (!cleanPortalEmail || !cleanPassword) {
      setAuthError('Enter both your assigned personal school email and portal password.');
      return;
    }

    setAuthenticating(true);
    setAuthError(null);

    try {
      const idToken = await auth.currentUser.getIdToken(true);
      let serverHandled = false;

      try {
        const resp = await fetch('/api/student-portal/authenticate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            idToken,
            portalEmail: cleanPortalEmail,
            portalPassword: cleanPassword,
          }),
        });

        const rawText = await resp.text();
        let data: {
          authenticated?: boolean;
          portal?: StudentPortalRecord;
          error?: string;
        } | null = null;
        try {
          data = JSON.parse(rawText);
        } catch {
          data = null;
        }

        if (data) {
          serverHandled = true;
          if (resp.ok && data.authenticated && data.portal) {
            if (
              data.portal.studentEmail.trim().toLowerCase() !==
              user.email.trim().toLowerCase()
            ) {
              setAuthError('Signed-in email does not match this Student Portal record.');
              return;
            }
            setUnlockedPortal(data.portal);
            setPortalSubTab('overview');
            onToast(`Welcome to your ${data.portal.university} Student Portal.`);
            return;
          } else {
            setAuthError(
              data.error || 'Authentication failed. Check your school email and password.'
            );
            return;
          }
        }
      } catch {
        serverHandled = false;
      }

      if (!serverHandled) {
        const firestorePortal = await fetchOwnStudentPortalFromFirestore(user.email);
        if (!firestorePortal) {
          setAuthError(
            `No Student Portal has been provisioned for ${user.email}. Only the exact student admitted with their sign-up email can unlock their portal.`
          );
          return;
        }

        if (
          firestorePortal.studentEmail.trim().toLowerCase() !==
          user.email.trim().toLowerCase()
        ) {
          setAuthError('Access denied: sign-up email mismatch.');
          return;
        }

        const enteredHash = await sha256Hex(cleanPassword);
        if (
          cleanPortalEmail !== firestorePortal.portalEmail.trim().toLowerCase() ||
          enteredHash !== firestorePortal.portalPasswordHash
        ) {
          setAuthError('Invalid school student email or Student Portal password.');
          return;
        }

        setUnlockedPortal(firestorePortal);
        setPortalSubTab('overview');
        onToast(`Welcome to your ${firestorePortal.university} Student Portal.`);
      }
    } finally {
      setAuthenticating(false);
    }
  };

  const handleSyncToFirestore = async (entry: AdminRosterEntry) => {
    setSyncingPortalId(entry.portalId);
    try {
      await upsertStudentPortalAsAdmin(entry);
      onToast(
        `${entry.studentName}'s Student Portal synced securely to Firestore for ${entry.studentEmail}.`
      );
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Failed to sync portal record to Firestore.');
    } finally {
      setSyncingPortalId(null);
    }
  };

  const handleCopyText = async (label: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      onToast(`${label} copied to clipboard.`);
    } catch {
      onToast(`Could not copy ${label}.`);
    }
  };

  const handleDownloadFeePdf = (portal: StudentPortalRecord) => {
    downloadOfficialFeeStatementPdf(portal);
    onToast('Official Fee Statement PDF downloaded.');
  };

  const handleDownloadTranscriptPdf = (portal: StudentPortalRecord) => {
    downloadOfficialAcademicTranscriptPdf(portal);
    onToast('Official Student Academic Transcript PDF downloaded.');
  };

  // STATE 1: Not Signed In to Platform
  if (!user) {
    return (
      <section className="max-w-[920px] mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="bg-white rounded-xl border border-slate-200 p-7 sm:p-10 text-center">
          <div className="w-12 h-12 rounded-xl bg-[#0C2340] text-white flex items-center justify-center mx-auto">
            <Lock className="w-5 h-5" />
          </div>
          <h1 className="mt-4 font-display font-bold text-[22px] sm:text-[26px] text-[#0C2340]">
            Isolated Student Portal Access
          </h1>
          <p className="mt-2.5 text-[14.5px] text-slate-600 max-w-xl mx-auto leading-relaxed">
            Each admitted student receives a dedicated university portal locked strictly to their
            verified sign-up email and personal school login credentials. Sign in with your
            registered student email first to access your portal.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => onOpenAuth('login')}
              className="px-5 py-2.5 rounded-md bg-[#0C2340] hover:bg-[#16365E] text-white font-semibold text-[13.5px] cursor-pointer whitespace-nowrap"
            >
              Log In with Your Sign-Up Email
            </button>
            <button
              type="button"
              onClick={() => onOpenAuth('signup')}
              className="px-5 py-2.5 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-[#0C2340] font-semibold text-[13.5px] cursor-pointer whitespace-nowrap"
            >
              Create New Student Account
            </button>
          </div>
        </div>
      </section>
    );
  }

  // STATE 3: Student Portal Unlocked
  if (unlockedPortal) {
    const isPreArrival = unlockedPortal.enrollmentStatus === 'Pre-Arrival';
    const weeklyWorkPay =
      unlockedPortal.workStudyHourlyUsd *
      unlockedPortal.workStudyHoursPerDay *
      unlockedPortal.workStudyDaysPerWeek;
    const weeklyHours =
      unlockedPortal.workStudyHoursPerDay * unlockedPortal.workStudyDaysPerWeek;
    const estimatedAcademicYearEarnings = weeklyWorkPay * 30;
    const crestTheme = unlockedPortal.university.toLowerCase().includes('berea')
      ? 'berea'
      : 'berkeley';

    return (
      <section className="max-w-[1160px] mx-auto px-4 sm:px-6 py-7 sm:py-9 space-y-6">
        {/* Identity & University Header Banner with School Crest */}
        <div className="bg-[#0C2340] text-white rounded-xl p-6 sm:p-8 border border-[#1B3A63]">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            <div className="flex items-start gap-4">
              <UniversityCrest theme={crestTheme} university={unlockedPortal.university} />
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2.5 text-[12px] font-mono text-amber-300">
                  <span>Student ID: {unlockedPortal.studentIdNumber}</span>
                  <span>·</span>
                  <span>Status: {unlockedPortal.enrollmentStatus}</span>
                  <span>·</span>
                  <span>Verified: {unlockedPortal.studentEmail}</span>
                </div>
                <h1 className="font-display font-bold text-[23px] sm:text-[27px] leading-tight">
                  {unlockedPortal.studentName}
                </h1>
                <p className="text-[14.5px] text-slate-200">
                  <strong className="font-semibold text-white">{unlockedPortal.university}</strong>{' '}
                  ({unlockedPortal.universityLocation}) — {unlockedPortal.course}
                </p>
                <div className="pt-1 flex flex-wrap items-center gap-x-6 gap-y-1.5 text-[13px] text-slate-300">
                  <span className="inline-flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                    School Mail: <strong className="text-white">{unlockedPortal.portalEmail}</strong>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                    Expected Arrival:{' '}
                    <strong className="text-white">{unlockedPortal.expectedArrivalDate}</strong>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => handleDownloadFeePdf(unlockedPortal)}
                className="px-3.5 py-2 rounded-md bg-white/10 hover:bg-white/20 border border-white/20 text-white text-[12.5px] font-semibold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <Download className="w-4 h-4" />
                Fee Statement (PDF)
              </button>
              <button
                type="button"
                onClick={() => handleDownloadTranscriptPdf(unlockedPortal)}
                className="px-3.5 py-2 rounded-md bg-white/10 hover:bg-white/20 border border-white/20 text-white text-[12.5px] font-semibold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <Download className="w-4 h-4" />
                Transcript (PDF)
              </button>
              <button
                type="button"
                onClick={() => setUnlockedPortal(null)}
                className="px-3.5 py-2 rounded-md bg-[#E59E16] hover:bg-[#D48E0D] text-[#0C2340] text-[12.5px] font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <LogOut className="w-4 h-4" />
                Lock Portal
              </button>
            </div>
          </div>
        </div>

        {/* 4 Key Financial, Arrival & Work-Study Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="text-[12px] font-semibold text-slate-500">
              Expected Household Fee (After {unlockedPortal.governmentCoveragePercent}% Aid)
            </div>
            <div className="mt-2 font-display font-bold text-[26px] text-[#0C2340] tabular-nums">
              ${unlockedPortal.householdFeeUsd.toLocaleString()} USD
            </div>
            <div className="mt-1 text-[12.5px] text-slate-600 tabular-nums">
              {isPreArrival
                ? `$${unlockedPortal.governmentCoverageUsd.toLocaleString()} USD gov. aid expected · $0 credited yet`
                : `$${unlockedPortal.governmentCoverageUsd.toLocaleString()} USD covered by government`}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="text-[12px] font-semibold text-slate-500">
              Expected Campus Arrival
            </div>
            <div className="mt-2 font-display font-bold text-[22px] text-[#0C2340]">
              {unlockedPortal.expectedArrivalDate}
            </div>
            <div className="mt-1 text-[12.5px] text-slate-600">{unlockedPortal.intakeTerm}</div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="text-[12px] font-semibold text-slate-500">
              Work-Study Upkeep Rate
            </div>
            <div className="mt-2 font-display font-bold text-[26px] text-[#0C2340] tabular-nums">
              ${unlockedPortal.workStudyHourlyUsd.toFixed(2)}{' '}
              <span className="text-[15px] font-semibold text-slate-500">/ hr</span>
            </div>
            <div className="mt-1 text-[12.5px] text-slate-600 tabular-nums">
              Weekly bank upkeep · Starts after arrival
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="text-[12px] font-semibold text-slate-500">
              Academic Credits Completed
            </div>
            <div className="mt-2 font-display font-bold text-[26px] text-[#0C2340] tabular-nums">
              {unlockedPortal.academicTranscript.length === 0
                ? '0.0 Credits'
                : `${unlockedPortal.academicTranscript.reduce((s, c) => s + c.credits, 0)} Credits`}
            </div>
            <div className="mt-1 text-[12.5px] text-slate-600">
              {unlockedPortal.academicTranscript.length === 0
                ? 'Studies begin on arrival date'
                : 'Official academic record active'}
            </div>
          </div>
        </div>

        {/* Sub-Navigation Tabs inside Student Portal */}
        <div className="border-b border-slate-200 flex flex-wrap items-center gap-3 sm:gap-6">
          {[
            { id: 'overview', label: 'Overview, Guardians & Work-Study' },
            {
              id: 'student-mail',
              label:
                unreadMailCount > 0
                  ? `Student Mail (${unreadMailCount} unread)`
                  : 'Student Mail',
            },
            { id: 'fees-transcript', label: 'Fees Statement & 80% Coverage' },
            { id: 'academic-transcript', label: 'Academic Transcript' },
            { id: 'pre-arrival', label: 'Pre-Arrival Checklist' },
          ].map((tab) => {
            const active = portalSubTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() =>
                  setPortalSubTab(
                    tab.id as
                      | 'overview'
                      | 'student-mail'
                      | 'fees-transcript'
                      | 'academic-transcript'
                      | 'pre-arrival'
                  )
                }
                className={`pb-3 px-1 text-[13.5px] sm:text-[14px] font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                  active
                    ? 'border-[#0C2340] text-[#0C2340]'
                    : 'border-transparent text-slate-500 hover:text-[#0C2340]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* TAB 1: Overview, Guardians & Work-Study */}
        {portalSubTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Academic & Sponsorship Assignment */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
              <div className="flex items-center gap-2.5">
                <Building2 className="w-5 h-5 text-[#0C2340]" />
                <h2 className="font-display font-bold text-[17px] text-[#0C2340]">
                  University, Course &amp; Sponsorship Programme
                </h2>
              </div>
              <dl className="divide-y divide-slate-100 text-[13.5px]">
                <div className="py-2.5 flex justify-between gap-4">
                  <dt className="text-slate-500">Selected University</dt>
                  <dd className="font-semibold text-[#0C2340] text-right">
                    {unlockedPortal.university}
                  </dd>
                </div>
                <div className="py-2.5 flex justify-between gap-4">
                  <dt className="text-slate-500">Campus Location</dt>
                  <dd className="font-medium text-slate-800 text-right">
                    {unlockedPortal.universityLocation}
                  </dd>
                </div>
                <div className="py-2.5 flex justify-between gap-4">
                  <dt className="text-slate-500">Selected Course</dt>
                  <dd className="font-semibold text-[#0C2340] text-right">
                    {unlockedPortal.course}
                  </dd>
                </div>
                <div className="py-2.5 flex justify-between gap-4">
                  <dt className="text-slate-500">Sponsorship Programme</dt>
                  <dd className="font-medium text-emerald-800 text-right max-w-[260px]">
                    {unlockedPortal.sponsorshipProgramme}
                  </dd>
                </div>
                <div className="py-2.5 flex justify-between gap-4">
                  <dt className="text-slate-500">Personal School Email</dt>
                  <dd className="font-mono text-[12.5px] font-semibold text-[#0C2340] text-right">
                    {unlockedPortal.portalEmail}
                  </dd>
                </div>
                <div className="py-2.5 flex justify-between gap-4">
                  <dt className="text-slate-500">Expected Day to Arrive</dt>
                  <dd className="font-semibold text-[#0C2340] text-right">
                    {unlockedPortal.expectedArrivalDate}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Home Guardian & School Peer Guardian */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
              <div className="flex items-center gap-2.5">
                <Users className="w-5 h-5 text-[#0C2340]" />
                <h2 className="font-display font-bold text-[17px] text-[#0C2340]">
                  Guardian &amp; Campus Mentorship Network
                </h2>
              </div>

              <div className="space-y-3.5">
                <div className="p-4 rounded-lg bg-[#F4F6F9] border border-slate-200/80">
                  <div className="text-[12px] font-semibold text-slate-500">
                    Home / Legal Guardian
                  </div>
                  <div className="mt-1 font-display font-bold text-[16px] text-[#0C2340]">
                    {unlockedPortal.homeGuardianName}
                  </div>
                  <div className="mt-0.5 text-[13px] text-slate-600">
                    {unlockedPortal.homeGuardianRelation} · Receives official weekly work-study
                    bank disbursement statements via email
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-[#F4F6F9] border border-slate-200/80">
                  <div className="text-[12px] font-semibold text-slate-500">
                    School Guardian (Senior Student Mentor)
                  </div>
                  <div className="mt-1 font-display font-bold text-[16px] text-[#0C2340]">
                    {unlockedPortal.schoolGuardianName}
                  </div>
                  <div className="mt-0.5 text-[13px] text-slate-600">
                    {unlockedPortal.schoolGuardianRole} — Assigned to welcome{' '}
                    {unlockedPortal.studentName.split(' ')[0]} on{' '}
                    {unlockedPortal.expectedArrivalDate} and assist with housing check-in, course
                    registration, and campus adjustment.
                  </div>
                </div>
              </div>
            </div>

            {/* Assigned Work-Study Employment Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 lg:col-span-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Briefcase className="w-5 h-5 text-[#0C2340]" />
                  <h2 className="font-display font-bold text-[17px] text-[#0C2340]">
                    Campus Work-Study Upkeep Assignment
                  </h2>
                </div>
                <span className="text-[12.5px] font-semibold text-emerald-700">
                  Visa-Compliant On-Campus Labor ({weeklyHours} hrs/week ≤ 20 hr cap)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
                <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/70">
                  <div className="text-[12px] text-slate-500">Position &amp; Department</div>
                  <div className="mt-1 font-semibold text-[14.5px] text-[#0C2340]">
                    {unlockedPortal.workStudyRole}
                  </div>
                  <div className="text-[12.5px] text-slate-600 mt-0.5">
                    {unlockedPortal.workStudyLocation}
                  </div>
                </div>

                <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/70">
                  <div className="text-[12px] text-slate-500">Hourly Wage</div>
                  <div className="mt-1 font-display font-bold text-[20px] text-[#0C2340] tabular-nums">
                    ${unlockedPortal.workStudyHourlyUsd.toFixed(2)} USD/hr
                  </div>
                  <div className="text-[12.5px] text-slate-600 mt-0.5">
                    Disbursed weekly to bank account
                  </div>
                </div>

                <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/70">
                  <div className="text-[12px] text-slate-500">Daily &amp; Weekly Schedule</div>
                  <div className="mt-1 font-display font-bold text-[20px] text-[#0C2340] tabular-nums">
                    {unlockedPortal.workStudyHoursPerDay} hrs / day
                  </div>
                  <div className="text-[12.5px] text-slate-600 mt-0.5 tabular-nums">
                    {unlockedPortal.workStudyDaysPerWeek} days/week ({weeklyHours} hrs/week total)
                  </div>
                </div>

                <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/70">
                  <div className="text-[12px] text-slate-500">Projected Weekly Upkeep</div>
                  <div className="mt-1 font-display font-bold text-[20px] text-emerald-700 tabular-nums">
                    ${weeklyWorkPay.toLocaleString()} / week
                  </div>
                  <div className="text-[12.5px] text-slate-600 mt-0.5 tabular-nums">
                    ~${estimatedAcademicYearEarnings.toLocaleString()} USD / 30 academic weeks
                  </div>
                </div>
              </div>

              {/* Explicit Work-Study Upkeep & Weekly Guardian Email Reminder */}
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
                <Banknote className="w-5 h-5 text-amber-800 shrink-0 mt-0.5" />
                <div className="text-[13.5px] text-amber-950 leading-relaxed">
                  <div className="font-semibold">
                    Student Upkeep Money &amp; Weekly Bank Disbursement Policy
                  </div>
                  <p className="mt-1 text-amber-900">
                    Your work-study pay (${unlockedPortal.workStudyHourlyUsd.toFixed(2)}/hr for{' '}
                    {unlockedPortal.workStudyHoursPerDay} hours/day = $
                    {weeklyWorkPay.toLocaleString()} USD/week) begins once you arrive and commence
                    duties at {unlockedPortal.workStudyLocation}. These earnings are{' '}
                    <strong>your personal upkeep money</strong>, will be{' '}
                    <strong>disbursed directly to your student bank account every week</strong>, and{' '}
                    <strong>
                      weekly payout statements will be emailed automatically to your guardian (
                      {unlockedPortal.homeGuardianName})
                    </strong>
                    .
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Official Student Mail Inbox */}
        {portalSubTab === 'student-mail' && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="font-display font-bold text-[18px] text-[#0C2340] flex items-center gap-2">
                  <Inbox className="w-5 h-5 text-[#0C2340]" />
                  <span>Official Student Mail — {unlockedPortal.portalEmail}</span>
                </h2>
                <p className="mt-1 text-[13px] text-slate-600">
                  Important admissions, arrival, financial aid, and work-study announcements from{' '}
                  {unlockedPortal.university}.
                </p>
              </div>
              <div className="text-[13px] font-semibold text-[#0C2340] tabular-nums">
                {mailMessages.length} total messages · {unreadMailCount} unread
              </div>
            </div>

            {/* Filter & Search Toolbar */}
            <div className="px-5 py-3.5 bg-[#F4F6F9] border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5">
                {(['All', 'Admissions', 'Financial Aid', 'Work-Study'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setMailCategoryFilter(cat)}
                    className={`px-3 py-1.5 rounded-md text-[12.5px] font-semibold cursor-pointer whitespace-nowrap transition-colors ${
                      mailCategoryFilter === cat
                        ? 'bg-[#0C2340] text-white'
                        : 'bg-white border border-slate-200 text-slate-600 hover:text-[#0C2340]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="relative w-full md:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="search"
                  value={mailSearch}
                  onChange={(e) => setMailSearch(e.target.value)}
                  placeholder="Search school emails..."
                  aria-label="Search school emails"
                  className="w-full h-9 pl-9 pr-3 rounded-md border border-slate-300 bg-white text-[13px] text-[#0C2340] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0C2340]"
                />
              </div>
            </div>

            {/* Split Master-Detail Mailbox */}
            <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[380px]">
              {/* Left Message List */}
              <div className="lg:col-span-5 border-b lg:border-b-0 lg:border-r border-slate-200 divide-y divide-slate-100">
                {filteredMailMessages.length === 0 ? (
                  <div className="p-8 text-center text-[13.5px] text-slate-500">
                    No messages match your filter.
                  </div>
                ) : (
                  filteredMailMessages.map((msg) => {
                    const isSelected = selectedMail?.id === msg.id;
                    return (
                      <button
                        key={msg.id}
                        type="button"
                        onClick={() => handleSelectMail(msg.id)}
                        className={`w-full text-left p-4 transition-colors cursor-pointer block ${
                          isSelected ? 'bg-[#EEF3F9]' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 text-[12px] text-slate-500">
                          <span className="truncate font-medium text-slate-700">
                            {msg.senderName}
                          </span>
                          <span className="shrink-0 tabular-nums">{msg.sentAt}</span>
                        </div>
                        <div
                          className={`mt-1 text-[13.5px] leading-snug ${
                            !msg.read
                              ? 'font-bold text-[#0C2340]'
                              : 'font-medium text-slate-700'
                          }`}
                        >
                          {msg.subject}
                        </div>
                        <div className="mt-1 text-[12px] text-slate-500 flex items-center gap-2">
                          <span>{msg.category}</span>
                          {!msg.read && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="font-semibold text-[#1D4E89]">Unread</span>
                            </>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              {/* Right Reading Pane */}
              <div className="lg:col-span-7 p-6 bg-white">
                {selectedMail ? (
                  <div className="space-y-4">
                    <div className="pb-4 border-b border-slate-200 flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="text-[12px] text-slate-500">
                          {selectedMail.senderDepartment} · {selectedMail.category}
                        </div>
                        <h3 className="mt-1 font-display font-bold text-[18px] text-[#0C2340] leading-snug">
                          {selectedMail.subject}
                        </h3>
                        <div className="mt-2 text-[13px] text-slate-600">
                          From:{' '}
                          <strong className="text-[#0C2340]">{selectedMail.senderName}</strong>{' '}
                          <span className="font-mono text-[12px]">
                            &lt;{selectedMail.senderEmail}&gt;
                          </span>{' '}
                          · Sent {selectedMail.sentAt}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleMailRead(selectedMail.id)}
                        className="px-3 py-1.5 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-[12px] font-semibold text-[#0C2340] cursor-pointer whitespace-nowrap"
                      >
                        {selectedMail.read ? 'Mark as Unread' : 'Mark as Read'}
                      </button>
                    </div>

                    <div className="text-[14px] text-slate-700 whitespace-pre-line leading-relaxed">
                      {selectedMail.body}
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-[14px] text-slate-500">
                    Select a message to read official details from {unlockedPortal.university}.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Fees Statement & 80% Coverage */}
        {portalSubTab === 'fees-transcript' && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-display font-bold text-[18px] text-[#0C2340] flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-[#0C2340]" />
                  <span>Fees Statement &amp; 80% Government Sponsorship Assessment</span>
                </h2>
                <p className="mt-1 text-[13.5px] text-slate-600">
                  {isPreArrival
                    ? 'Pre-arrival financial assessment only. Because classes have not commenced yet, no sponsorship or payment amounts have been credited.'
                    : 'Official itemized breakdown showing gross fee assessment, government sponsorship coverage, and household balance.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleDownloadFeePdf(unlockedPortal)}
                className="px-4 py-2 rounded-md bg-[#0C2340] hover:bg-[#16365E] text-white text-[13px] font-semibold inline-flex items-center gap-2 cursor-pointer whitespace-nowrap"
              >
                <Download className="w-4 h-4" />
                Download Official Fee Statement (PDF)
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-[#F4F6F9] border border-slate-200">
                <div className="text-[12px] text-slate-500">
                  Gross Annual Tuition &amp; Fees (Assessed)
                </div>
                <div className="mt-1 font-display font-bold text-[21px] text-[#0C2340] tabular-nums">
                  ${unlockedPortal.grossAnnualFeeUsd.toLocaleString()}.00 USD
                </div>
                <div className="mt-0.5 text-[12px] text-slate-600">100% Programme Assessment</div>
              </div>

              <div className="p-4 rounded-lg bg-sky-50 border border-sky-200">
                <div className="text-[12px] text-sky-900">
                  Expected Government Coverage ({unlockedPortal.governmentCoveragePercent}%)
                </div>
                <div className="mt-1 font-display font-bold text-[21px] text-sky-900 tabular-nums">
                  -${unlockedPortal.governmentCoverageUsd.toLocaleString()}.00 USD
                </div>
                <div className="mt-0.5 text-[12px] text-sky-800">
                  {isPreArrival ? 'Expected upon enrollment ($0 credited yet)' : 'Applied sponsorship'}
                </div>
              </div>

              <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
                <div className="text-[12px] text-amber-900">
                  Expected Household Fee Balance (20%)
                </div>
                <div className="mt-1 font-display font-bold text-[21px] text-amber-900 tabular-nums">
                  ${unlockedPortal.householdFeeUsd.toLocaleString()}.00 USD
                </div>
                <div className="mt-0.5 text-[12px] text-amber-800 tabular-nums">
                  {isPreArrival ? 'Total Credited / Paid to Date: $0.00' : 'Household responsibility'}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-[13.5px] border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-[12px] uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Period / Stage</th>
                    <th className="py-3 px-4 font-semibold">Description</th>
                    <th className="py-3 px-4 font-semibold">Category</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold text-right">Amount (USD)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {unlockedPortal.feesLedger.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/60">
                      <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">{row.date}</td>
                      <td className="py-3.5 px-4 font-medium text-[#0C2340]">{row.description}</td>
                      <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                        {row.category}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap font-semibold text-[12.5px]">
                        <span
                          className={
                            row.status === 'Expected'
                              ? 'text-amber-800'
                              : row.status === 'Credited' || row.status === 'Paid'
                              ? 'text-emerald-700'
                              : 'text-[#0C2340]'
                          }
                        >
                          {row.status}
                        </span>
                      </td>
                      <td
                        className={`py-3.5 px-4 text-right font-mono font-semibold tabular-nums whitespace-nowrap ${
                          row.amountUsd < 0 ? 'text-sky-800' : 'text-[#0C2340]'
                        }`}
                      >
                        {row.amountUsd === 0 && row.category === 'Institutional Aid'
                          ? `Upkeep ($${weeklyWorkPay}/wk)`
                          : row.amountUsd < 0
                          ? `(-$${Math.abs(row.amountUsd).toLocaleString()}.00)`
                          : `$${row.amountUsd.toLocaleString()}.00`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: Academic Transcript Over the Years */}
        {portalSubTab === 'academic-transcript' && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-display font-bold text-[18px] text-[#0C2340] flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-[#0C2340]" />
                  <span>Official Student Academic Transcript</span>
                </h2>
                <p className="mt-1 text-[13.5px] text-slate-600">
                  {unlockedPortal.university} · Programme: {unlockedPortal.course}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleDownloadTranscriptPdf(unlockedPortal)}
                className="px-4 py-2 rounded-md bg-[#0C2340] hover:bg-[#16365E] text-white text-[13px] font-semibold inline-flex items-center gap-2 cursor-pointer whitespace-nowrap"
              >
                <Download className="w-4 h-4" />
                Download Official Transcript (PDF)
              </button>
            </div>

            {unlockedPortal.academicTranscript.length === 0 ? (
              <div className="border border-slate-200 rounded-lg bg-[#F4F6F9] p-7 sm:p-9 text-center">
                <GraduationCap className="w-9 h-9 text-[#0C2340]/70 mx-auto" />
                <h3 className="mt-3 font-display font-bold text-[17px] text-[#0C2340]">
                  No Academic Transcript Recorded Yet
                </h3>
                <p className="mt-2 text-[13.5px] text-slate-600 max-w-lg mx-auto leading-relaxed">
                  {unlockedPortal.studentName} has not yet commenced coursework in{' '}
                  <strong>{unlockedPortal.course}</strong> at{' '}
                  <strong>{unlockedPortal.university}</strong>. Expected arrival on campus is{' '}
                  <strong>{unlockedPortal.expectedArrivalDate}</strong>. Term-by-term grades,
                  course codes, credits, and annual GPA records will populate here automatically once
                  her first semester begins. You may still download her official pre-arrival
                  transcript confirmation PDF above.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-left text-[13.5px] border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-[12px] uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Term / Year</th>
                      <th className="py-3 px-4 font-semibold">Course Code</th>
                      <th className="py-3 px-4 font-semibold">Course Title</th>
                      <th className="py-3 px-4 font-semibold text-right">Credits</th>
                      <th className="py-3 px-4 font-semibold text-right">Grade</th>
                      <th className="py-3 px-4 font-semibold text-right">GPA Points</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {unlockedPortal.academicTranscript.map((row, idx) => (
                      <tr key={`${row.term}-${row.courseCode}-${idx}`}>
                        <td className="py-3 px-4">{row.term}</td>
                        <td className="py-3 px-4 font-mono">{row.courseCode}</td>
                        <td className="py-3 px-4 font-medium text-[#0C2340]">{row.courseTitle}</td>
                        <td className="py-3 px-4 text-right tabular-nums">{row.credits}</td>
                        <td className="py-3 px-4 text-right font-semibold">{row.grade}</td>
                        <td className="py-3 px-4 text-right tabular-nums">
                          {row.gpaPoints.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: Pre-Arrival Onboarding Checklist */}
        {portalSubTab === 'pre-arrival' && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display font-bold text-[18px] text-[#0C2340] flex items-center gap-2">
                  <ClipboardCheck className="w-5 h-5 text-[#0C2340]" />
                  <span>
                    Pre-Arrival Milestones (Target Arrival: {unlockedPortal.expectedArrivalDate})
                  </span>
                </h2>
                <p className="mt-1 text-[13.5px] text-slate-600">
                  Track immigration, medical, financial, and library work-study steps ahead of
                  orientation with School Guardian {unlockedPortal.schoolGuardianName}.
                </p>
              </div>
              <div className="text-[13px] font-semibold text-[#0C2340] tabular-nums">
                {completedChecklistIds.length} / {unlockedPortal.preArrivalChecklist.length} marked
                complete
              </div>
            </div>

            <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg">
              {unlockedPortal.preArrivalChecklist.map((item) => {
                const isDone =
                  item.status === 'Completed' || completedChecklistIds.includes(item.id);
                return (
                  <label
                    key={item.id}
                    className="flex items-start gap-3.5 p-4 hover:bg-slate-50/70 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={isDone}
                      onChange={() =>
                        setCompletedChecklistIds((prev) =>
                          prev.includes(item.id)
                            ? prev.filter((id) => id !== item.id)
                            : [...prev, item.id]
                        )
                      }
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-[#0C2340] cursor-pointer"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span
                          className={`font-semibold text-[14px] ${
                            isDone ? 'line-through text-slate-400' : 'text-[#0C2340]'
                          }`}
                        >
                          {item.title}
                        </span>
                        <span className="text-[12px] font-mono text-slate-500">
                          Due: {item.dueBy}
                        </span>
                      </div>
                      <p className="mt-1 text-[13px] text-slate-600">{item.notes}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        )}
      </section>
    );
  }

  // STATE 2 (Default for signed-in users): Portal Sign-In Gate + Coordinator Admin Roster
  return (
    <section className="max-w-[960px] mx-auto px-4 sm:px-6 py-9 sm:py-12 space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-2 text-[12px] font-mono uppercase tracking-wider text-emerald-700 font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>Email-Isolated Portal Gate</span>
            </div>
            <h1 className="mt-1.5 font-display font-bold text-[22px] sm:text-[25px] text-[#0C2340]">
              Sign In to Your Personal Student Portal
            </h1>
            <p className="mt-1 text-[13.5px] text-slate-600">
              Currently signed in as{' '}
              <strong className="font-semibold text-[#0C2340]">{user.email}</strong>. Enter the
              personal school student email and password issued to you upon admission.
            </p>
          </div>
          <div className="w-11 h-11 rounded-lg bg-[#0C2340] text-white flex items-center justify-center shrink-0">
            <KeyRound className="w-5 h-5" />
          </div>
        </div>

        <form onSubmit={handlePortalLogin} className="mt-6 space-y-4 max-w-lg">
          {authError && (
            <div
              role="alert"
              className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-800 text-[13px] flex items-start gap-2.5"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          <div>
            <label
              htmlFor="portal-school-email"
              className="block text-[13px] font-semibold text-[#0C2340] mb-1.5"
            >
              Personal School Student Email
            </label>
            <input
              id="portal-school-email"
              type="email"
              required
              autoComplete="username"
              value={portalEmailInput}
              onChange={(e) => setPortalEmailInput(e.target.value)}
              placeholder="e.g. studentid@university.edu"
              className="w-full h-11 px-3.5 rounded-md border border-slate-300 text-[14px] text-[#0C2340] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0C2340]"
            />
          </div>

          <div>
            <label
              htmlFor="portal-password"
              className="block text-[13px] font-semibold text-[#0C2340] mb-1.5"
            >
              Student Portal Password
            </label>
            <div className="relative">
              <input
                id="portal-password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={portalPasswordInput}
                onChange={(e) => setPortalPasswordInput(e.target.value)}
                placeholder="Enter your issued student portal password"
                className="w-full h-11 pl-3.5 pr-10 rounded-md border border-slate-300 text-[14px] text-[#0C2340] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0C2340]"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#0C2340] cursor-pointer"
                aria-label={showPassword ? 'Hide portal password' : 'Show portal password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={authenticating}
              className="px-5 py-2.5 rounded-md bg-[#0C2340] hover:bg-[#16365E] disabled:opacity-60 text-white font-semibold text-[14px] cursor-pointer whitespace-nowrap"
            >
              {authenticating ? 'Verifying Student Credentials...' : 'Unlock My Student Portal'}
            </button>
          </div>
        </form>
      </div>

      {/* Platform Coordinator / Admin Provisioning Panel (strictly hidden unless signed in as ADMIN_EMAIL) */}
      {isCoordinator && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-7 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-[11.5px] font-mono uppercase tracking-wider text-[#B46900] font-semibold">
                Coordinator Admin Console
              </div>
              <h2 className="mt-0.5 font-display font-bold text-[18px] text-[#0C2340] flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-[#0C2340]" />
                <span>Provisioned Student Portals ({adminRoster.length})</span>
              </h2>
            </div>
          </div>

          {adminLoading && (
            <p className="text-[13.5px] text-slate-500">Loading provisioned student records...</p>
          )}
          {adminError && (
            <p className="text-[13px] text-amber-800 bg-amber-50 border border-amber-200 rounded-md p-3">
              {adminError}
            </p>
          )}

          {adminRoster.map((entry) => (
            <div
              key={entry.portalId}
              className="border border-slate-200 rounded-lg p-5 bg-[#F4F6F9] space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="font-display font-bold text-[16px] text-[#0C2340]">
                    {entry.studentName} — {entry.university}
                  </h3>
                  <p className="text-[13px] text-slate-600">
                    Sign-Up Email: <strong>{entry.studentEmail}</strong> · Course: {entry.course} ·
                    Expected Household Fee: ${entry.householdFeeUsd.toLocaleString()} USD
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={syncingPortalId === entry.portalId}
                    onClick={() => handleSyncToFirestore(entry)}
                    className="px-3.5 py-2 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-[#0C2340] text-[12.5px] font-semibold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <CloudUpload className="w-3.5 h-3.5" />
                    {syncingPortalId === entry.portalId ? 'Syncing...' : 'Sync to Firestore'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setUnlockedPortal(entry)}
                    className="px-3.5 py-2 rounded-md bg-[#0C2340] hover:bg-[#16365E] text-white text-[12.5px] font-semibold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Preview Portal
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[13px]">
                <div className="bg-white rounded-md border border-slate-200 p-3 flex items-center justify-between gap-2">
                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-slate-500">
                      Generated School Student Email
                    </div>
                    <div className="font-mono font-semibold text-[#0C2340]">
                      {entry.portalEmail}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyText('School Email', entry.portalEmail)}
                    className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-[#0C2340] cursor-pointer"
                    aria-label="Copy generated school email"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>

                <div className="bg-white rounded-md border border-slate-200 p-3 flex items-center justify-between gap-2">
                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-slate-500">
                      Generated Student Portal Password
                    </div>
                    <div className="font-mono font-semibold text-[#0C2340]">
                      {entry.generatedPortalPassword}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyText('Portal Password', entry.generatedPortalPassword)}
                    className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-[#0C2340] cursor-pointer"
                    aria-label="Copy generated portal password"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
