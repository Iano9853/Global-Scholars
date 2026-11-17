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
  ApplicationSubmission,
  OnboardingProfile,
  ProgramOpportunity,
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
