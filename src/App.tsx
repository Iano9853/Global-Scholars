/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import {
  ArrowUpDown,
  CheckCircle2,
  GitCompareArrows,
  SearchX,
  X,
} from 'lucide-react';
import { AuthExperience } from './components/AuthExperience';
import { CompareModal } from './components/CompareModal';
import { DocumentVaultView } from './components/DocumentVaultView';
import { ErrorBoundary } from './components/ErrorBoundary';
import { FilterSidebar } from './components/FilterSidebar';
import { Header } from './components/Header';
import { HeroSearchBar } from './components/HeroSearchBar';
import { HowItWorksView } from './components/HowItWorksView';
import { OnboardingWizard } from './components/OnboardingWizard';
import { ProgramCard } from './components/ProgramCard';
import { RequirementsModal } from './components/RequirementsModal';
import { StudentDashboard } from './components/StudentDashboard';
import { StudentPortalView } from './components/StudentPortalView';
import { VisaGuidesView } from './components/VisaGuidesView';
import { PROGRAMS_DATA } from './data/programs';
import { auth } from './firebase';
import {
  addVaultDocumentToFirestore,
  createEmptyOnboardingProfile,
  createOrUpdateUserProfile,
  deleteVaultDocumentFromFirestore,
  fetchUserProfile,
  removeSavedProgramFromFirestore,
  saveProgramToFirestore,
  submitApplicationToFirestore,
  subscribeApplications,
  subscribeSavedProgramIds,
  subscribeVaultDocuments,
  updateVaultDocumentStatusInFirestore,
  upsertStudentPortalAsAdmin,
} from './services/userStorage';
import {
  ActiveTab,
  ApplicationSubmission,
  AuthScreen,
  OnboardingProfile,
  PendingAuthAction,
  ProgramOpportunity,
  SearchParams,
  SidebarFilters,
  UserProfile,
  VaultDocument,
} from './types/program';

const INITIAL_SEARCH: SearchParams = {
  homeCountry: 'All Countries',
  targetCountry: 'All Countries',
  studyLevel: 'All Levels',
  fundingType: 'All Funding',
};

const COORDINATOR_EMAIL = 'mulijosephine446@gmail.com';

function isCoordinatorEmail(email?: string | null): boolean {
  return Boolean(email && email.trim().toLowerCase() === COORDINATOR_EMAIL);
}

const INITIAL_FILTERS: SidebarFilters = {
  internationalEligibleOnly: false,
  onCampusWorkAllowed: false,
  noIeltsRequired: false,
  coopEligible: false,
  tuitionWaiver: false,
  minHourlyUsd: 0,
  deadlineWindow: 'all',
};

type SortMode = 'recommended' | 'pay-high' | 'coverage-high' | 'deadline';

function AppContent() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authScreen, setAuthScreen] = useState<AuthScreen>(null);
  const [pendingVerifyEmail, setPendingVerifyEmail] = useState<string>('');
  const [pendingAction, setPendingAction] = useState<PendingAuthAction | null>(null);

  const [activeTab, setActiveTab] = useState<ActiveTab>('browse');
  const [searchParams, setSearchParams] = useState<SearchParams>(INITIAL_SEARCH);
  const [sidebarFilters, setSidebarFilters] = useState<SidebarFilters>(INITIAL_FILTERS);
  const [keyword, setKeyword] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('recommended');

  const [savedProgramIds, setSavedProgramIds] = useState<string[]>([]);
  const [applications, setApplications] = useState<ApplicationSubmission[]>([]);
  const [vaultDocuments, setVaultDocuments] = useState<VaultDocument[]>([]);

  const [selectedProgram, setSelectedProgram] = useState<ProgramOpportunity | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const resultsRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  // Listen to Firebase Auth state changes cleanly without auto-creating profiles on login
  useEffect(() => {
    let active = true;
    const safetyTimer = window.setTimeout(() => {
      if (active) setAuthReady(true);
    }, 4000);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!active) return;
      window.clearTimeout(safetyTimer);

      if (!firebaseUser) {
        setUser(null);
        setSavedProgramIds([]);
        setApplications([]);
        setVaultDocuments([]);
        setAuthReady(true);
        return;
      }

      if (!firebaseUser.emailVerified) {
        setPendingVerifyEmail(firebaseUser.email ?? '');
        setUser(null);
        setAuthReady(true);
        return;
      }

      try {
        await firebaseUser.getIdToken();
        const existingProfile = await fetchUserProfile(firebaseUser.uid);
        if (!active) return;

        if (existingProfile) {
          setUser(existingProfile);
          if (existingProfile.onboarding.passportCountry) {
            setSearchParams((prev) => ({
              ...prev,
              homeCountry: existingProfile.onboarding.passportCountry,
            }));
          }
        } else if (isCoordinatorEmail(firebaseUser.email)) {
          const isGoogle = firebaseUser.providerData.some((p) => p.providerId === 'google.com');
          const coordOnboarding = createEmptyOnboardingProfile();
          coordOnboarding.onboardingCompleted = true;
          const coordProfile: UserProfile = {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || 'Coordinator',
            email: firebaseUser.email ?? COORDINATOR_EMAIL,
            authProvider: isGoogle ? 'google' : 'email',
            emailVerified: true,
            onboarding: coordOnboarding,
          };
          await createOrUpdateUserProfile(coordProfile);
          if (!active) return;
          setUser(coordProfile);
        } else {
          // Do not auto-create student profile here — signup flows explicitly create profiles.
          // If an un-registered auth session appears transiently during login check, keep user null.
          setUser(null);
        }
      } catch (err) {
        console.error('Failed to restore student profile:', err);
      } finally {
        if (active) setAuthReady(true);
      }
    });

    return () => {
      active = false;
      window.clearTimeout(safetyTimer);
      unsubscribe();
    };
  }, []);

  // Prevent white screen if activeTab is 'dashboard' while user is null
  useEffect(() => {
    if (authReady && activeTab === 'dashboard' && !user) {
      setActiveTab('browse');
    }
  }, [authReady, activeTab, user]);

  // Subscribe to Firestore Saved Programs, Vault Documents, and School Applications
  useEffect(() => {
    if (!user || !user.emailVerified) {
      setSavedProgramIds([]);
      setApplications([]);
      setVaultDocuments([]);
      return;
    }

    const onSubError = (err: Error) => {
      console.error('Firestore sync warning:', err);
    };

    const unsubSaved = subscribeSavedProgramIds(user.id, setSavedProgramIds, onSubError);
    const unsubDocs = subscribeVaultDocuments(user.id, setVaultDocuments, onSubError);
    const unsubApps = subscribeApplications(user.id, setApplications, onSubError);

    return () => {
      unsubSaved();
      unsubDocs();
      unsubApps();
    };
  }, [user]);

  // Automatically sync server-provisioned Student Portals to Firestore whenever coordinator logs in
  useEffect(() => {
    if (
      !user ||
      !user.emailVerified ||
      user.email.trim().toLowerCase() !== 'mulijosephine446@gmail.com' ||
      !auth.currentUser
    ) {
      return;
    }

    let active = true;
    const syncPortals = async () => {
      try {
        const idToken = await auth.currentUser?.getIdToken(true);
        if (!idToken || !active) return;

        const resp = await fetch('/api/student-portal/admin-roster', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken }),
        });
        const raw = await resp.text();
        let data: {
          authorized?: boolean;
          students?: Array<
            import('./types/program').StudentPortalRecord & { portalPasswordHash: string }
          >;
        } | null = null;
        try {
          data = JSON.parse(raw);
        } catch {
          data = null;
        }
        if (!active || !resp.ok || !data?.authorized || !Array.isArray(data.students)) return;

        for (const studentRecord of data.students) {
          if (!active) break;
          await upsertStudentPortalAsAdmin(studentRecord);
        }
      } catch {
        // Silent background sync — Coordinator Console handles manual sync status too
      }
    };

    syncPortals();
    return () => {
      active = false;
    };
  }, [user]);

  useEffect(() => {
    if (!toastMessage) return;
    const t = window.setTimeout(() => setToastMessage(null), 5000);
    return () => window.clearTimeout(t);
  }, [toastMessage]);

  const appliedProgramIds = useMemo(
    () => new Set(applications.map((a) => a.programId)),
    [applications]
  );

  const filteredPrograms = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    const now = Date.now();

    const matches = PROGRAMS_DATA.filter((program) => {
      if (q) {
        const hay =
          `${program.university} ${program.programTitle} ${program.city} ${program.country} ${program.fields.join(' ')} ${program.overview}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }

      if (
        searchParams.targetCountry !== 'All Countries' &&
        program.country !== searchParams.targetCountry
      ) {
        return false;
      }

      if (
        searchParams.studyLevel !== 'All Levels' &&
        !program.studyLevels.includes(searchParams.studyLevel)
      ) {
        return false;
      }

      if (
        searchParams.fundingType !== 'All Funding' &&
        program.fundingType !== searchParams.fundingType
      ) {
        return false;
      }

      if (sidebarFilters.internationalEligibleOnly && !program.internationalEligibleOnly) {
        return false;
      }

      if (sidebarFilters.onCampusWorkAllowed && !program.onCampusWorkAllowed) {
        return false;
      }

      if (sidebarFilters.noIeltsRequired) {
        if (searchParams.homeCountry !== 'All Countries') {
          if (!program.noIeltsCountries.includes(searchParams.homeCountry)) {
            return false;
          }
        } else if (!program.noIeltsRequired) {
          return false;
        }
      }

      if (sidebarFilters.coopEligible && !program.coopEligible) {
        return false;
      }

      if (sidebarFilters.tuitionWaiver && !program.tuitionWaiver) {
        return false;
      }

      if (sidebarFilters.minHourlyUsd > 0 && program.hourlyMaxUsd < sidebarFilters.minHourlyUsd) {
        return false;
      }

      if (sidebarFilters.deadlineWindow !== 'all') {
        const deadlineMs = new Date(program.deadline).getTime();
        const diffDays = (deadlineMs - now) / (1000 * 60 * 60 * 24);
        if (sidebarFilters.deadlineWindow === 'next-90' && (diffDays > 90 || deadlineMs > new Date('2026-12-31').getTime())) {
          return false;
        }
        if (sidebarFilters.deadlineWindow === '2027' && !program.deadline.includes('2027')) {
          return false;
        }
      }

      return true;
    });

    if (sortMode === 'pay-high') {
      return [...matches].sort((a, b) => b.hourlyMaxUsd - a.hourlyMaxUsd);
    }

    if (sortMode === 'coverage-high') {
      return [...matches].sort((a, b) => {
        if (a.supportsFullCoverage !== b.supportsFullCoverage) {
          return a.supportsFullCoverage ? -1 : 1;
        }
        if (a.tuitionWaiver !== b.tuitionWaiver) {
          return a.tuitionWaiver ? -1 : 1;
        }
        return b.hourlyMaxUsd - a.hourlyMaxUsd;
      });
    }

    if (sortMode === 'deadline') {
      return [...matches].sort(
        (a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
      );
    }

    return matches;
  }, [searchParams, sidebarFilters, sortMode, keyword]);

  const savedPrograms = useMemo(
    () => PROGRAMS_DATA.filter((p) => savedProgramIds.includes(p.id)),
    [savedProgramIds]
  );

  const comparedPrograms = useMemo(
    () => PROGRAMS_DATA.filter((p) => compareIds.includes(p.id)),
    [compareIds]
  );

  const hasActiveFilters =
    searchParams.homeCountry !== 'All Countries' ||
    searchParams.targetCountry !== 'All Countries' ||
    searchParams.studyLevel !== 'All Levels' ||
    searchParams.fundingType !== 'All Funding' ||
    sidebarFilters.internationalEligibleOnly ||
    sidebarFilters.onCampusWorkAllowed ||
    sidebarFilters.noIeltsRequired ||
    sidebarFilters.coopEligible ||
    sidebarFilters.tuitionWaiver ||
    sidebarFilters.minHourlyUsd > 0 ||
    sidebarFilters.deadlineWindow !== 'all' ||
    keyword.trim().length > 0;

  const executePostAuthRedirect = async (loggedInUser: UserProfile) => {
    if (loggedInUser.onboarding.passportCountry) {
      setSearchParams((prev) => ({
        ...prev,
        homeCountry: loggedInUser.onboarding.passportCountry,
      }));
    }

    if (pendingAction) {
      const targetProgram = PROGRAMS_DATA.find((p) => p.id === pendingAction.programId);
      if (pendingAction.type === 'save-program' && targetProgram) {
        await saveProgramToFirestore(loggedInUser.id, targetProgram);
        setAuthScreen(null);
        setActiveTab('browse');
        showToast(`${pendingAction.university} saved to your Application Tracker.`);
        setTimeout(() => {
          resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 80);
      } else if (
        (pendingAction.type === 'view-requirements' || pendingAction.type === 'apply-program') &&
        targetProgram
      ) {
        setAuthScreen(null);
        setActiveTab('dashboard');
        setSelectedProgram(targetProgram);
      }
      setPendingAction(null);
      return;
    }

    setAuthScreen(null);
    setActiveTab('dashboard');
  };

  const handleToggleSave = async (programId: string) => {
    const program = PROGRAMS_DATA.find((p) => p.id === programId);
    if (!program) return;

    if (!user) {
      setSelectedProgram(null);
      setPendingAction({
        type: 'save-program',
        programId: program.id,
        university: program.university,
      });
      setAuthScreen('login');
      return;
    }

    const alreadySaved = savedProgramIds.includes(programId);
    if (alreadySaved) {
      await removeSavedProgramFromFirestore(user.id, programId);
      showToast(`Removed ${program.university} from Application Tracker.`);
    } else {
      await saveProgramToFirestore(user.id, program);
      showToast(`${program.university} saved to your Application Tracker.`);
    }
  };

  const handleToggleCompare = (programId: string) => {
    setCompareIds((prev) => {
      if (prev.includes(programId)) {
        return prev.filter((id) => id !== programId);
      }
      if (prev.length >= 3) {
        showToast('You can compare up to 3 universities at once. Remove one to add another.');
        return prev;
      }
      return [...prev, programId];
    });
  };

  const handleConfirmSchoolSelection = async (
    program: ProgramOpportunity
  ): Promise<{
    delivered: boolean;
    mode: string;
    referenceId: string;
    recipient: string;
    error?: string;
  }> => {
    if (!user) {
      setSelectedProgram(null);
      setPendingAction({
        type: 'apply-program',
        programId: program.id,
        university: program.university,
      });
      setAuthScreen('login');
      return {
        delivered: false,
        mode: 'auth_required',
        referenceId: '',
        recipient: '',
      };
    }

    let emailResult: {
      delivered: boolean;
      mode: string;
      referenceId: string;
      recipient: string;
      error?: string;
    } = {
      delivered: false,
      mode: 'resend_not_configured',
      referenceId: `SW-${Date.now().toString(36).toUpperCase()}`,
      recipient: user.email,
    };

    try {
      const resp = await fetch('/api/send-application-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: user.name,
          studentEmail: user.email,
          university: program.university,
          programTitle: program.programTitle,
          country: program.country,
          deadline: program.deadline,
          passportCountry: user.onboarding.passportCountry,
          degreeType: user.onboarding.degreeType,
          major: user.onboarding.majors[0] ?? user.onboarding.broadFields[0],
        }),
      });
      const rawText = await resp.text();
      let data: {
        delivered?: boolean;
        mode?: string;
        referenceId?: string;
        recipient?: string;
        error?: string;
      } | null = null;

      try {
        data = JSON.parse(rawText);
      } catch {
        data = null;
      }

      if (data) {
        emailResult = {
          delivered: Boolean(data.delivered),
          mode: String(data.mode || 'recorded'),
          referenceId: String(data.referenceId || emailResult.referenceId),
          recipient: String(data.recipient || user.email),
          error: data.error ? String(data.error) : undefined,
        };
      } else if (!resp.ok) {
        showToast('Selection saved in your profile. Email confirmation queued.');
      }
    } catch (err) {
      console.error('Failed to call confirmation email endpoint:', err);
    }

    await submitApplicationToFirestore(user.id, {
      program,
      studentName: user.name,
      studentEmail: user.email,
      emailDispatched: emailResult.delivered,
    });

    if (!savedProgramIds.includes(program.id)) {
      await saveProgramToFirestore(user.id, program);
    }

    return emailResult;
  };

  const handleResetAll = () => {
    setSearchParams(INITIAL_SEARCH);
    setSidebarFilters(INITIAL_FILTERS);
    setKeyword('');
  };

  const handleSearchSubmit = () => {
    setActiveTab('browse');
    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleCycleDocStatus = async (docItem: VaultDocument) => {
    if (!user) return;
    const order: VaultDocument['status'][] = ['Missing', 'In Progress', 'Ready'];
    const nextStatus = order[(order.indexOf(docItem.status) + 1) % order.length];
    await updateVaultDocumentStatusInFirestore(user.id, docItem, nextStatus);
  };

  const handleAddDocument = async (payload: {
    title: string;
    category: VaultDocument['category'];
    status: VaultDocument['status'];
    notes: string;
    fileName?: string;
    fileSizeBytes?: number;
  }) => {
    if (!user) return;
    await addVaultDocumentToFirestore(user.id, payload);
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!user) return;
    await deleteVaultDocumentFromFirestore(user.id, docId);
  };

  const createFreshUserProfile = async (
    firebaseUser: User,
    provider: 'google' | 'email'
  ): Promise<UserProfile> => {
    const isCoord = isCoordinatorEmail(firebaseUser.email);
    const onboarding = createEmptyOnboardingProfile();
    if (isCoord) {
      onboarding.onboardingCompleted = true;
    }
    const fresh: UserProfile = {
      id: firebaseUser.uid,
      name:
        firebaseUser.displayName ||
        firebaseUser.email?.split('@')[0] ||
        (isCoord ? 'Coordinator' : 'Student'),
      email: firebaseUser.email ?? '',
      authProvider: provider,
      emailVerified: true,
      onboarding,
    };
    await createOrUpdateUserProfile(fresh);
    return fresh;
  };

  const handleGoogleAuthenticated = async (
    firebaseUser: User,
    mode: 'login' | 'signup'
  ): Promise<{ ok: boolean; error?: string }> => {
    await firebaseUser.getIdToken(true);
    let profile = await fetchUserProfile(firebaseUser.uid);
    const isCoord = isCoordinatorEmail(firebaseUser.email);

    if (mode === 'login') {
      if (!profile) {
        if (isCoord) {
          profile = await createFreshUserProfile(firebaseUser, 'google');
        } else {
          await signOut(auth);
          setUser(null);
          return {
            ok: false,
            error:
              'No registered account found for this Google email. Please sign up first.',
          };
        }
      }
      setUser(profile);
      if (isCoord) {
        setAuthScreen(null);
        setActiveTab('student-portal');
      } else if (!profile.onboarding.onboardingCompleted) {
        setAuthScreen('onboarding');
      } else {
        await executePostAuthRedirect(profile);
      }
      return { ok: true };
    }

    // Sign-up mode
    let isBrandNew = false;
    if (!profile) {
      isBrandNew = true;
      profile = await createFreshUserProfile(firebaseUser, 'google');
    }

    setUser(profile);
    if (isCoord) {
      setAuthScreen(null);
      setActiveTab('student-portal');
    } else if (isBrandNew || !profile.onboarding.onboardingCompleted) {
      setAuthScreen('onboarding');
    } else {
      await executePostAuthRedirect(profile);
    }
    return { ok: true };
  };

  const handleEmailVerificationSent = (email: string) => {
    setPendingVerifyEmail(email);
    setAuthScreen('verify-email');
  };

  const handleEmailVerifiedAndReady = async (firebaseUser: User) => {
    await firebaseUser.getIdToken(true);
    let profile = await fetchUserProfile(firebaseUser.uid);
    let isBrandNew = false;
    const isCoord = isCoordinatorEmail(firebaseUser.email);

    if (!profile) {
      isBrandNew = true;
      profile = await createFreshUserProfile(firebaseUser, 'email');
    }

    setUser(profile);
    if (isCoord) {
      setAuthScreen(null);
      setActiveTab('student-portal');
      return;
    }
    if (isBrandNew || !profile.onboarding.onboardingCompleted) {
      setAuthScreen('onboarding');
      return;
    }
    await executePostAuthRedirect(profile);
  };

  const handleEmailPasswordLoggedIn = async (
    firebaseUser: User
  ): Promise<{ ok: boolean; error?: string }> => {
    await firebaseUser.getIdToken(true);
    let profile = await fetchUserProfile(firebaseUser.uid);
    const isCoord = isCoordinatorEmail(firebaseUser.email);

    if (!profile) {
      if (isCoord) {
        profile = await createFreshUserProfile(firebaseUser, 'email');
      } else {
        await signOut(auth);
        setUser(null);
        return {
          ok: false,
          error: 'No registered student account found for these credentials. Please sign up first.',
        };
      }
    }

    setUser(profile);
    if (isCoord) {
      setAuthScreen(null);
      setActiveTab('student-portal');
      return { ok: true };
    }
    if (!profile.onboarding.onboardingCompleted) {
      setAuthScreen('onboarding');
      return { ok: true };
    }
    await executePostAuthRedirect(profile);
    return { ok: true };
  };

  const handleSaveOnboardingLater = async (draft: OnboardingProfile) => {
    if (!user) {
      setAuthScreen(null);
      return;
    }
    const updatedUser: UserProfile = {
      ...user,
      onboarding: { ...draft, onboardingCompleted: false },
    };
    await createOrUpdateUserProfile(updatedUser);
    setUser(updatedUser);
    if (draft.passportCountry) {
      setSearchParams((prev) => ({ ...prev, homeCountry: draft.passportCountry }));
    }
    setAuthScreen(null);
    setActiveTab('dashboard');
  };

  const handleFinishWizard = async (
    completed: OnboardingProfile,
    destination: 'dashboard' | 'vault'
  ) => {
    if (!user) return;
    const updatedUser: UserProfile = {
      ...user,
      onboarding: { ...completed, onboardingCompleted: true },
    };
    setAuthScreen('matching');
    await createOrUpdateUserProfile(updatedUser);
    setUser(updatedUser);
    if (completed.passportCountry) {
      setSearchParams((prev) => ({
        ...prev,
        homeCountry: completed.passportCountry,
      }));
    }

    window.setTimeout(async () => {
      if (pendingAction) {
        await executePostAuthRedirect(updatedUser);
      } else {
        setAuthScreen(null);
        setActiveTab(destination === 'vault' ? 'document-vault' : 'dashboard');
      }
    }, 1800);
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    setPendingAction(null);
    setSavedProgramIds([]);
    setApplications([]);
    setVaultDocuments([]);
    setSearchParams(INITIAL_SEARCH);
    setActiveTab('browse');
  };

  if (!authReady) {
    return (
      <div className="min-h-screen bg-[#F4F6F9] flex items-center justify-center p-6 text-slate-600 text-sm">
        Loading ScholarWork Global...
      </div>
    );
  }

  if (
    authScreen === 'signup' ||
    authScreen === 'verify-email' ||
    authScreen === 'login' ||
    authScreen === 'forgot-password'
  ) {
    return (
      <AuthExperience
        screen={authScreen}
        pendingVerifyEmail={pendingVerifyEmail}
        contextMessage={
          pendingAction
            ? `Log in or create a free account to continue with ${pendingAction.university}.`
            : null
        }
        onSwitchScreen={(next) => setAuthScreen(next)}
        onBackToBrowse={() => {
          setPendingAction(null);
          setAuthScreen(null);
        }}
        onGoogleAuthenticated={handleGoogleAuthenticated}
        onEmailVerificationSent={handleEmailVerificationSent}
        onEmailVerifiedAndReady={handleEmailVerifiedAndReady}
        onEmailPasswordLoggedIn={handleEmailPasswordLoggedIn}
      />
    );
  }

  if ((authScreen === 'onboarding' || authScreen === 'matching') && user) {
    return (
      <OnboardingWizard
        initialProfile={user.onboarding}
        userName={user.name}
        isMatchingPhase={authScreen === 'matching'}
        onSaveLater={handleSaveOnboardingLater}
        onFinishWizard={handleFinishWizard}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F6F9] text-[#0F243E]">
      {/* Top-Right Contextual Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-20 right-3 sm:right-6 z-50 bg-emerald-700 text-white px-4 py-3 rounded-lg shadow-lg border border-emerald-600 flex items-center gap-3 text-[13.5px] font-semibold max-w-[calc(100vw-24px)]"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-emerald-100 hover:text-white cursor-pointer"
            aria-label="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        savedCount={savedProgramIds.length}
        user={user}
        onOpenAuth={(mode) => {
          setPendingAction(null);
          setAuthScreen(mode);
        }}
        onLogout={handleLogout}
      />

      <main className="flex-1">
        {activeTab === 'dashboard' && user && (
          <StudentDashboard
            user={user}
            programs={PROGRAMS_DATA}
            savedProgramIds={savedProgramIds}
            applications={applications}
            vaultDocuments={vaultDocuments}
            compareIds={compareIds}
            onToggleSave={handleToggleSave}
            onToggleCompare={handleToggleCompare}
            onViewRequirements={(prog) => setSelectedProgram(prog)}
            onEditPreferences={() => setAuthScreen('onboarding')}
            onOpenVault={() => setActiveTab('document-vault')}
            onBrowseAll={() => setActiveTab('browse')}
          />
        )}

        {activeTab === 'student-portal' && (
          <StudentPortalView
            user={user}
            onOpenAuth={(mode) => {
              setPendingAction(null);
              setAuthScreen(mode);
            }}
            onToast={showToast}
          />
        )}

        {(activeTab === 'browse' || (activeTab === 'dashboard' && !user)) && (
          <>
            <HeroSearchBar
              searchParams={searchParams}
              onChange={setSearchParams}
              onSearchSubmit={handleSearchSubmit}
            />

            <section
              ref={resultsRef}
              className="max-w-[1160px] mx-auto px-4 sm:px-6 py-6 sm:py-10"
            >
              <div className="flex flex-col lg:flex-row items-start gap-6 lg:gap-10">
                <FilterSidebar
                  filters={sidebarFilters}
                  keyword={keyword}
                  onKeywordChange={setKeyword}
                  onChange={setSidebarFilters}
                  onResetAll={handleResetAll}
                  totalCount={PROGRAMS_DATA.length}
                  filteredCount={filteredPrograms.length}
                  hasActiveFilters={hasActiveFilters}
                />

                {/* Right Column: Program Opportunity Cards */}
                <div className="flex-1 min-w-0 w-full space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-1">
                    <p className="text-[14px] text-slate-600 tabular-nums">
                      <span className="font-semibold text-[#0C2340]">
                        {filteredPrograms.length}
                      </span>{' '}
                      verified{' '}
                      {filteredPrograms.length === 1 ? 'opportunity' : 'opportunities'}
                      {searchParams.homeCountry !== 'All Countries' && (
                        <span>
                          {' '}
                          for applicants from{' '}
                          <strong className="font-semibold text-[#0C2340]">
                            {searchParams.homeCountry}
                          </strong>
                        </span>
                      )}
                    </p>

                    <div className="flex items-center gap-2">
                      <ArrowUpDown
                        className="w-3.5 h-3.5 text-slate-400"
                        aria-hidden="true"
                      />
                      <label htmlFor="sort-programs" className="sr-only">
                        Sort opportunities
                      </label>
                      <select
                        id="sort-programs"
                        value={sortMode}
                        onChange={(e) => setSortMode(e.target.value as SortMode)}
                        className="h-9 px-3 rounded-md border border-slate-200 bg-white text-[13px] font-medium text-[#0C2340] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0C2340]"
                      >
                        <option value="recommended">Sort: Recommended</option>
                        <option value="coverage-high">Sort: Full Aid &amp; Tuition Waiver</option>
                        <option value="pay-high">Sort: Highest Hourly Pay</option>
                        <option value="deadline">Sort: Earliest Deadline</option>
                      </select>
                    </div>
                  </div>

                  {/* Active Filter Chips */}
                  {hasActiveFilters && (
                    <div className="flex flex-wrap items-center gap-2 text-[12px]">
                      {keyword.trim() && (
                        <button
                          type="button"
                          onClick={() => setKeyword('')}
                          className="px-2.5 py-1 rounded-md bg-white border border-slate-300 text-[#0C2340] font-medium inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <span>Search: &ldquo;{keyword.trim()}&rdquo;</span>
                          <X className="w-3 h-3" />
                        </button>
                      )}
                      {searchParams.targetCountry !== 'All Countries' && (
                        <button
                          type="button"
                          onClick={() =>
                            setSearchParams((p) => ({ ...p, targetCountry: 'All Countries' }))
                          }
                          className="px-2.5 py-1 rounded-md bg-white border border-slate-300 text-[#0C2340] font-medium inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <span>Country: {searchParams.targetCountry}</span>
                          <X className="w-3 h-3" />
                        </button>
                      )}
                      {sidebarFilters.minHourlyUsd > 0 && (
                        <button
                          type="button"
                          onClick={() =>
                            setSidebarFilters((f) => ({ ...f, minHourlyUsd: 0 }))
                          }
                          className="px-2.5 py-1 rounded-md bg-white border border-slate-300 text-[#0C2340] font-medium inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <span>Pay: ${sidebarFilters.minHourlyUsd}+/hr</span>
                          <X className="w-3 h-3" />
                        </button>
                      )}
                      {sidebarFilters.deadlineWindow !== 'all' && (
                        <button
                          type="button"
                          onClick={() =>
                            setSidebarFilters((f) => ({ ...f, deadlineWindow: 'all' }))
                          }
                          className="px-2.5 py-1 rounded-md bg-white border border-slate-300 text-[#0C2340] font-medium inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <span>
                            Deadline:{' '}
                            {sidebarFilters.deadlineWindow === 'next-90'
                              ? 'Next 90 Days / 2026'
                              : '2027 Intakes'}
                          </span>
                          <X className="w-3 h-3" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleResetAll}
                        className="text-[#1D4E89] font-semibold hover:underline cursor-pointer ml-1"
                      >
                        Clear all
                      </button>
                    </div>
                  )}

                  {filteredPrograms.length === 0 ? (
                    <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
                      <SearchX
                        className="w-9 h-9 text-slate-300 mx-auto"
                        aria-hidden="true"
                      />
                      <h3 className="mt-3 font-display font-bold text-[17px] text-[#0C2340]">
                        No exact matches for those criteria
                      </h3>
                      <p className="mt-1.5 text-[14px] text-slate-600 max-w-md mx-auto">
                        Try clearing one or more sidebar filters or broadening your Target
                        Country and Funding Type selections.
                      </p>
                      <button
                        type="button"
                        onClick={handleResetAll}
                        className="mt-5 px-4 py-2 rounded-md bg-[#0C2340] hover:bg-[#16365E] text-white text-[13px] font-semibold cursor-pointer"
                      >
                        Reset All Filters
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredPrograms.map((program) => (
                        <ProgramCard
                          key={program.id}
                          program={program}
                          homeCountry={searchParams.homeCountry}
                          isSaved={savedProgramIds.includes(program.id)}
                          isCompared={compareIds.includes(program.id)}
                          isApplied={appliedProgramIds.has(program.id)}
                          onToggleSave={handleToggleSave}
                          onToggleCompare={handleToggleCompare}
                          onViewRequirements={(prog) => setSelectedProgram(prog)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>
          </>
        )}

        {activeTab === 'visa-guides' && (
          <VisaGuidesView
            onBrowseCountry={(country) => {
              setSearchParams((prev) => ({ ...prev, targetCountry: country }));
              setActiveTab('browse');
            }}
          />
        )}

        {activeTab === 'how-it-works' && (
          <HowItWorksView
            onNavigate={setActiveTab}
            userCountry={user?.onboarding.passportCountry || undefined}
          />
        )}

        {activeTab === 'document-vault' && (
          <DocumentVaultView
            isAuthenticated={Boolean(user)}
            userName={user?.name}
            userEmail={user?.email}
            savedPrograms={savedPrograms}
            applications={applications}
            documents={vaultDocuments}
            onCycleDocStatus={handleCycleDocStatus}
            onAddDocument={handleAddDocument}
            onDeleteDocument={handleDeleteDocument}
            onRemoveSaved={handleToggleSave}
            onViewRequirements={(prog) => setSelectedProgram(prog)}
            onBrowsePrograms={() => setActiveTab('browse')}
            onPromptSignUp={() => setAuthScreen('signup')}
          />
        )}
      </main>

      {/* Sticky Bottom Comparison Tray */}
      {compareIds.length > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[calc(100vw-24px)] max-w-2xl bg-[#0C2340] text-white rounded-xl shadow-2xl border border-white/15 px-4 sm:px-5 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-[13px]">
            <GitCompareArrows className="w-4 h-4 text-[#E59E16] shrink-0" />
            <span>
              <strong>{compareIds.length}</strong> / 3 universities selected to compare
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCompareIds([])}
              className="px-3 py-1.5 rounded-md text-[12px] text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => setCompareModalOpen(true)}
              className="px-4 py-1.5 rounded-md bg-[#E59E16] hover:bg-[#D48E0D] text-[#0C2340] font-display font-bold text-[12.5px] cursor-pointer whitespace-nowrap"
            >
              Compare Side-by-Side
            </button>
          </div>
        </div>
      )}

      <footer className="bg-white border-t border-slate-200/90 mt-12">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-7 flex flex-col sm:flex-row items-center justify-between gap-4 text-[13px] text-slate-500">
          <div className="font-display font-semibold text-[#0C2340]">
            ScholarWork Global
          </div>
          <div className="flex flex-wrap items-center justify-center gap-5 sm:gap-6">
            {user && (
              <button
                type="button"
                onClick={() => setActiveTab('dashboard')}
                className="hover:text-[#0C2340] cursor-pointer"
              >
                My Dashboard
              </button>
            )}
            <button
              type="button"
              onClick={() => setActiveTab('browse')}
              className="hover:text-[#0C2340] cursor-pointer"
            >
              Browse Programs
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('student-portal')}
              className="hover:text-[#0C2340] cursor-pointer"
            >
              Student Portal
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('visa-guides')}
              className="hover:text-[#0C2340] cursor-pointer"
            >
              Visa &amp; Work Guides
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('how-it-works')}
              className="hover:text-[#0C2340] cursor-pointer"
            >
              How It Works
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('document-vault')}
              className="hover:text-[#0C2340] cursor-pointer"
            >
              Document Vault
            </button>
          </div>
          <div>© 2026 ScholarWork Global</div>
        </div>
      </footer>

      <RequirementsModal
        program={selectedProgram}
        user={user}
        homeCountry={searchParams.homeCountry}
        isSaved={selectedProgram ? savedProgramIds.includes(selectedProgram.id) : false}
        existingApplication={
          selectedProgram
            ? applications.find((a) => a.programId === selectedProgram.id)
            : undefined
        }
        vaultDocuments={vaultDocuments}
        onClose={() => setSelectedProgram(null)}
        onToggleSave={handleToggleSave}
        onConfirmSchoolSelection={handleConfirmSchoolSelection}
        onOpenVault={() => setActiveTab('document-vault')}
      />

      {compareModalOpen && (
        <CompareModal
          programs={comparedPrograms}
          homeCountry={searchParams.homeCountry}
          onClose={() => setCompareModalOpen(false)}
          onRemoveProgram={(id) => setCompareIds((prev) => prev.filter((x) => x !== id))}
          onSelectProgram={(prog) => setSelectedProgram(prog)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}
