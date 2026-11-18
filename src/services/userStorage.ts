import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  AcademicTranscriptTerm,
  ApplicationSubmission,
  FeeLedgerItem,
  OnboardingProfile,
  PreArrivalItem,
  ProgramOpportunity,
  StudentMailMessage,
  StudentPortalRecord,
  UserProfile,
  VaultDocument,
} from '../types/program';

export function createEmptyOnboardingProfile(): OnboardingProfile {
  return {
    passportCountry: '',
    residenceCountry: '',
    educationLanguage: '',
    degreeType: '',
    broadFields: [],
    majors: [],
    intakeWindow: '',
    completedEducation: '',
    gradeSystem: '',
    rawGrade: '',
    estimatedGpa4: 0,
    standardizedTests: [],
    workStudyPreferences: [],
    budgetTier: '',
    targetCountries: [],
    hasDocsReady: false,
    onboardingCompleted: false,
  };
}

function sanitizeOnboardingPayload(ob: OnboardingProfile): OnboardingProfile {
  return {
    passportCountry: String(ob.passportCountry || '').slice(0, 80),
    residenceCountry: String(ob.residenceCountry || '').slice(0, 80),
    educationLanguage: ob.educationLanguage,
    degreeType: ob.degreeType,
    broadFields: ob.broadFields.slice(0, 5),
    majors: ob.majors.slice(0, 3).map((m) => m.slice(0, 80)),
    intakeWindow: String(ob.intakeWindow || '').slice(0, 60),
    completedEducation: String(ob.completedEducation || '').slice(0, 100),
    gradeSystem: ob.gradeSystem,
    rawGrade: String(ob.rawGrade || '').slice(0, 40),
    estimatedGpa4: Math.max(0, Math.min(4, Number(ob.estimatedGpa4) || 0)),
    standardizedTests: ob.standardizedTests.slice(0, 6),
    workStudyPreferences: ob.workStudyPreferences.slice(0, 5),
    budgetTier: String(ob.budgetTier || '').slice(0, 80),
    targetCountries: ob.targetCountries.slice(0, 12),
    hasDocsReady: Boolean(ob.hasDocsReady),
    onboardingCompleted: Boolean(ob.onboardingCompleted),
  };
}

export async function fetchUserProfile(uid: string): Promise<UserProfile | null> {
  const path = `users/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return null;
    const data = snap.data();
    return {
      id: uid,
      name: String(data.name ?? ''),
      email: String(data.email ?? ''),
      authProvider: data.authProvider === 'google' ? 'google' : 'email',
      emailVerified: true,
      onboarding: data.onboarding as OnboardingProfile,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function createOrUpdateUserProfile(profile: UserProfile): Promise<void> {
  const path = `users/${profile.id}`;
  const ref = doc(db, 'users', profile.id);
  const cleanOnboarding = sanitizeOnboardingPayload(profile.onboarding);

  try {
    const existing = await getDoc(ref);
    if (!existing.exists()) {
      await setDoc(ref, {
        uid: profile.id,
        name: profile.name.slice(0, 120) || 'Student',
        email: profile.email.slice(0, 200),
        authProvider: profile.authProvider,
        onboarding: cleanOnboarding,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(ref, {
        name: profile.name.slice(0, 120) || 'Student',
        email: profile.email.slice(0, 200),
        onboarding: cleanOnboarding,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeSavedProgramIds(
  uid: string,
  onUpdate: (programIds: string[]) => void,
  onError?: (err: Error) => void
): () => void {
  const path = `users/${uid}/savedPrograms`;
  const q = query(collection(db, 'users', uid, 'savedPrograms'), where('userId', '==', uid));

  return onSnapshot(
    q,
    (snapshot) => {
      onUpdate(snapshot.docs.map((d) => d.id));
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        onError?.(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

export async function saveProgramToFirestore(
  uid: string,
  program: ProgramOpportunity
): Promise<void> {
  const path = `users/${uid}/savedPrograms/${program.id}`;
  try {
    await setDoc(doc(db, 'users', uid, 'savedPrograms', program.id), {
      userId: uid,
      programId: program.id,
      university: program.university.slice(0, 160),
      programTitle: program.programTitle.slice(0, 220),
      deadline: program.deadline.slice(0, 60),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function removeSavedProgramFromFirestore(
  uid: string,
  programId: string
): Promise<void> {
  const path = `users/${uid}/savedPrograms/${programId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'savedPrograms', programId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeVaultDocuments(
  uid: string,
  onUpdate: (docs: VaultDocument[]) => void,
  onError?: (err: Error) => void
): () => void {
  const path = `users/${uid}/vaultDocuments`;
  const q = query(collection(db, 'users', uid, 'vaultDocuments'), where('userId', '==', uid));

  return onSnapshot(
    q,
    (snapshot) => {
      const list: VaultDocument[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          title: String(data.title ?? ''),
          category: data.category as VaultDocument['category'],
          status: data.status as VaultDocument['status'],
          notes: String(data.notes ?? ''),
          appliesTo: 'Your Saved Programs',
          fileName: typeof data.fileName === 'string' ? data.fileName : undefined,
          fileSizeBytes: typeof data.fileSizeBytes === 'number' ? data.fileSizeBytes : undefined,
        };
      });
      onUpdate(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        onError?.(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

export async function addVaultDocumentToFirestore(
  uid: string,
  payload: {
    title: string;
    category: VaultDocument['category'];
    status: VaultDocument['status'];
    notes: string;
    fileName?: string;
    fileSizeBytes?: number;
  }
): Promise<void> {
  const docId = `doc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const path = `users/${uid}/vaultDocuments/${docId}`;

  const docData: Record<string, unknown> = {
    userId: uid,
    title: payload.title.slice(0, 160),
    category: payload.category,
    status: payload.status,
    notes: payload.notes.slice(0, 500),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  if (payload.fileName) {
    docData.fileName = payload.fileName.slice(0, 200);
  }
  if (typeof payload.fileSizeBytes === 'number' && payload.fileSizeBytes >= 0) {
    docData.fileSizeBytes = payload.fileSizeBytes;
  }

  try {
    await setDoc(doc(db, 'users', uid, 'vaultDocuments', docId), docData);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateVaultDocumentStatusInFirestore(
  uid: string,
  docItem: VaultDocument,
  nextStatus: VaultDocument['status']
): Promise<void> {
  const path = `users/${uid}/vaultDocuments/${docItem.id}`;
  try {
    await updateDoc(doc(db, 'users', uid, 'vaultDocuments', docItem.id), {
      status: nextStatus,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteVaultDocumentFromFirestore(
  uid: string,
  docId: string
): Promise<void> {
  const path = `users/${uid}/vaultDocuments/${docId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'vaultDocuments', docId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeApplications(
  uid: string,
  onUpdate: (apps: ApplicationSubmission[]) => void,
  onError?: (err: Error) => void
): () => void {
  const path = `users/${uid}/applications`;
  const q = query(collection(db, 'users', uid, 'applications'), where('userId', '==', uid));

  return onSnapshot(
    q,
    (snapshot) => {
      const list: ApplicationSubmission[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          programId: String(data.programId ?? d.id),
          university: String(data.university ?? ''),
          programTitle: String(data.programTitle ?? ''),
          studentName: String(data.studentName ?? ''),
          studentEmail: String(data.studentEmail ?? ''),
          requirementsAcknowledged: Boolean(data.requirementsAcknowledged),
          status: 'Official Outreach Requested',
          emailDispatched: Boolean(data.emailDispatched),
        };
      });
      onUpdate(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        onError?.(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

export async function submitApplicationToFirestore(
  uid: string,
  payload: {
    program: ProgramOpportunity;
    studentName: string;
    studentEmail: string;
    emailDispatched: boolean;
  }
): Promise<void> {
  const path = `users/${uid}/applications/${payload.program.id}`;
  try {
    await setDoc(doc(db, 'users', uid, 'applications', payload.program.id), {
      userId: uid,
      programId: payload.program.id,
      university: payload.program.university.slice(0, 160),
      programTitle: payload.program.programTitle.slice(0, 220),
      studentName: (payload.studentName || 'Applicant').slice(0, 120),
      studentEmail: payload.studentEmail.slice(0, 200),
      requirementsAcknowledged: true,
      status: 'Official Outreach Requested',
      emailDispatched: Boolean(payload.emailDispatched),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export function emailToPortalId(email: string): string {
  return email
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_')
    .slice(0, 128);
}

export async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', bytes);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function fetchOwnStudentPortalFromFirestore(
  studentEmail: string
): Promise<StudentPortalRecord | null> {
  const portalId = emailToPortalId(studentEmail);
  if (!portalId) return null;

  try {
    const snap = await getDoc(doc(db, 'studentPortals', portalId));
    if (!snap.exists()) return null;
    const data = snap.data();
    return {
      portalId: String(data.portalId ?? portalId),
      studentEmail: String(data.studentEmail ?? ''),
      studentName: String(data.studentName ?? ''),
      studentIdNumber: String(data.studentIdNumber ?? ''),
      portalEmail: String(data.portalEmail ?? ''),
      portalPasswordHash: String(data.portalPasswordHash ?? ''),
      university: String(data.university ?? ''),
      universityLocation: String(data.universityLocation ?? ''),
      course: String(data.course ?? ''),
      sponsorshipProgramme: String(data.sponsorshipProgramme ?? ''),
      grossAnnualFeeUsd: Number(data.grossAnnualFeeUsd ?? 0),
      governmentCoveragePercent: Number(data.governmentCoveragePercent ?? 0),
      governmentCoverageUsd: Number(data.governmentCoverageUsd ?? 0),
      householdFeeUsd: Number(data.householdFeeUsd ?? 0),
      expectedArrivalDate: String(data.expectedArrivalDate ?? ''),
      intakeTerm: String(data.intakeTerm ?? ''),
      homeGuardianName: String(data.homeGuardianName ?? ''),
      homeGuardianRelation: String(data.homeGuardianRelation ?? ''),
      schoolGuardianName: String(data.schoolGuardianName ?? ''),
      schoolGuardianRole: String(data.schoolGuardianRole ?? ''),
      workStudyRole: String(data.workStudyRole ?? ''),
      workStudyLocation: String(data.workStudyLocation ?? ''),
      workStudyHourlyUsd: Number(data.workStudyHourlyUsd ?? 0),
      workStudyHoursPerDay: Number(data.workStudyHoursPerDay ?? 0),
      workStudyDaysPerWeek: Number(data.workStudyDaysPerWeek ?? 0),
      enrollmentStatus:
        data.enrollmentStatus === 'Enrolled' || data.enrollmentStatus === 'Active'
          ? data.enrollmentStatus
          : 'Pre-Arrival',
      academicTranscript: Array.isArray(data.academicTranscript)
        ? (data.academicTranscript as AcademicTranscriptTerm[])
        : [],
      feesLedger: Array.isArray(data.feesLedger)
        ? (data.feesLedger as FeeLedgerItem[])
        : [],
      preArrivalChecklist: Array.isArray(data.preArrivalChecklist)
        ? (data.preArrivalChecklist as PreArrivalItem[])
        : [],
      studentMail: Array.isArray(data.studentMail)
        ? (data.studentMail as StudentMailMessage[])
        : [],
    };
  } catch {
    return null;
  }
}

export async function upsertStudentPortalAsAdmin(
  record: StudentPortalRecord & { portalPasswordHash: string }
): Promise<void> {
  const path = `studentPortals/${record.portalId}`;
  const ref = doc(db, 'studentPortals', record.portalId);

  const payloadBase = {
    portalId: record.portalId,
    studentEmail: record.studentEmail.trim().toLowerCase().slice(0, 200),
    studentName: record.studentName.slice(0, 120),
    studentIdNumber: record.studentIdNumber.slice(0, 60),
    portalEmail: record.portalEmail.trim().toLowerCase().slice(0, 200),
    portalPasswordHash: record.portalPasswordHash.slice(0, 128),
    university: record.university.slice(0, 160),
    universityLocation: record.universityLocation.slice(0, 160),
    course: record.course.slice(0, 160),
    sponsorshipProgramme: record.sponsorshipProgramme.slice(0, 220),
    grossAnnualFeeUsd: Number(record.grossAnnualFeeUsd) || 0,
    governmentCoveragePercent: Number(record.governmentCoveragePercent) || 0,
    governmentCoverageUsd: Number(record.governmentCoverageUsd) || 0,
    householdFeeUsd: Number(record.householdFeeUsd) || 0,
    expectedArrivalDate: record.expectedArrivalDate.slice(0, 80),
    intakeTerm: record.intakeTerm.slice(0, 80),
    homeGuardianName: record.homeGuardianName.slice(0, 120),
    homeGuardianRelation: record.homeGuardianRelation.slice(0, 80),
    schoolGuardianName: record.schoolGuardianName.slice(0, 120),
    schoolGuardianRole: record.schoolGuardianRole.slice(0, 120),
    workStudyRole: record.workStudyRole.slice(0, 120),
    workStudyLocation: record.workStudyLocation.slice(0, 160),
    workStudyHourlyUsd: Number(record.workStudyHourlyUsd) || 0,
    workStudyHoursPerDay: Number(record.workStudyHoursPerDay) || 0,
    workStudyDaysPerWeek: Number(record.workStudyDaysPerWeek) || 0,
    enrollmentStatus: record.enrollmentStatus,
    academicTranscript: record.academicTranscript.slice(0, 20),
    feesLedger: record.feesLedger.slice(0, 20),
    preArrivalChecklist: record.preArrivalChecklist.slice(0, 15),
    studentMail: (record.studentMail || []).slice(0, 50),
  };

  try {
    const existing = await getDoc(ref);
    if (!existing.exists()) {
      await setDoc(ref, {
        ...payloadBase,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(ref, {
        ...payloadBase,
        createdAt: existing.data().createdAt,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
