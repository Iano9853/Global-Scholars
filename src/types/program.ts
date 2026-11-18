export type StudyLevel = 'All Levels' | 'Associate / Diploma' | 'Undergraduate' | "Master's" | 'PhD';

export type FundingType =
  | 'All Funding'
  | 'Work-Study & Aid'
  | 'Paid Co-op & Bursary'
  | 'Full Scholarship'
  | 'Research Assistantship';

export type BroadField =
  | 'Engineering & Computer Science'
  | 'Health, Medicine & Life Sciences'
  | 'Business, Economics & Finance'
  | 'Arts, Humanities & Social Sciences'
  | 'Agriculture, Environment & Sustainability';

export type GradeSystem = 'KCSE Grade' | '4.0 GPA Scale' | 'Percentage (%)' | 'UK Class Honours';

export type WorkStudyPreference =
  | 'Full Need-Based / Merit Scholarship + Part-Time On-Campus Job'
  | 'Paid Co-op / Industry Internship'
  | 'Graduate Teaching / Research Assistantship';

export interface ProgramOpportunity {
  id: string;
  university: string;
  programTitle: string;
  city: string;
  country: string;
  studyLevels: Exclude<StudyLevel, 'All Levels'>[];
  fundingType: Exclude<FundingType, 'All Funding'>;
  verifiedDomain: string;
  visaRuleSummary: string;
  workHoursLimit: string;
  hourlyPayRange: string;
  hourlyMinUsd: number;
  hourlyMaxUsd: number;
  aidSummary: string;
  annualCoverageEstimate: string;
  deadline: string;
  internationalEligibleOnly: boolean;
  onCampusWorkAllowed: boolean;
  noIeltsRequired: boolean;
  noIeltsCountries: string[];
  coopEligible: boolean;
  tuitionWaiver: boolean;
  fields: BroadField[];
  minGpa4Scale: number;
  supportsFullCoverage: boolean;
  intakes: string[];
  crestTheme:
    | 'berkeley'
    | 'waterloo'
    | 'toronto'
    | 'mit'
    | 'tum'
    | 'melbourne'
    | 'eth'
    | 'imperial'
    | 'ubc'
    | 'nus'
    | 'berea';
  overview: string;
  requirements: string[];
  requiredDocuments: string[];
  officialPolicyUrlLabel: string;
}

export interface SearchParams {
  homeCountry: string;
  targetCountry: string;
  studyLevel: StudyLevel;
  fundingType: FundingType;
}

export interface SidebarFilters {
  internationalEligibleOnly: boolean;
  onCampusWorkAllowed: boolean;
  noIeltsRequired: boolean;
  coopEligible: boolean;
  tuitionWaiver: boolean;
  minHourlyUsd: number;
  deadlineWindow: 'all' | 'next-90' | '2027';
}

export interface VisaWorkGuide {
  country: string;
  visaName: string;
  termWorkLimit: string;
  breakWorkLimit: string;
  postStudyPathway: string;
  typicalCampusWage: string;
  monthlyLivingUsd: number;
  keyRequirements: string[];
  allowedWorkExamples: string[];
  prohibitedWorkExamples: string[];
  taxAndPermitNotes: string;
}

export interface VaultDocument {
  id: string;
  title: string;
  category: 'Identity' | 'Academic' | 'Financial' | 'Language' | 'Work Authorization';
  status: 'Ready' | 'In Progress' | 'Missing';
  notes: string;
  appliesTo: string;
  fileName?: string;
  fileSizeBytes?: number;
}

export interface OnboardingProfile {
  passportCountry: string;
  residenceCountry: string;
  educationLanguage: 'English' | 'French' | 'Other' | '';
  degreeType: Exclude<StudyLevel, 'All Levels'> | '';
  broadFields: BroadField[];
  majors: string[];
  intakeWindow: string;
  completedEducation: string;
  gradeSystem: GradeSystem | '';
  rawGrade: string;
  estimatedGpa4: number;
  standardizedTests: string[];
  workStudyPreferences: WorkStudyPreference[];
  budgetTier: string;
  targetCountries: string[];
  hasDocsReady: boolean;
  onboardingCompleted: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  authProvider: 'email' | 'google';
  emailVerified: boolean;
  onboarding: OnboardingProfile;
}

export interface ApplicationSubmission {
  programId: string;
  university: string;
  programTitle: string;
  studentName: string;
  studentEmail: string;
  requirementsAcknowledged: boolean;
  status: 'Official Outreach Requested';
  emailDispatched: boolean;
}

export interface PendingAuthAction {
  type: 'save-program' | 'view-requirements' | 'apply-program';
  programId: string;
  university: string;
}

export interface AcademicTranscriptTerm {
  term: string;
  courseCode: string;
  courseTitle: string;
  credits: number;
  grade: string;
  gpaPoints: number;
  status: 'Completed' | 'In Progress' | 'Upcoming';
}

export interface FeeLedgerItem {
  id: string;
  date: string;
  description: string;
  category:
    | 'Tuition & Fees'
    | 'Government Sponsorship'
    | 'Institutional Aid'
    | 'Household Payment';
  amountUsd: number;
  status: 'Assessed' | 'Expected' | 'Credited' | 'Balance Due' | 'Paid';
}

export interface PreArrivalItem {
  id: string;
  title: string;
  category: 'Immigration' | 'Health & Housing' | 'Financial' | 'Campus Onboarding';
  dueBy: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  notes: string;
}

export interface StudentMailMessage {
  id: string;
  senderName: string;
  senderEmail: string;
  senderDepartment: string;
  subject: string;
  sentAt: string;
  category: 'Admissions' | 'Financial Aid' | 'Work-Study' | 'Campus Life';
  body: string;
  read: boolean;
}

export interface StudentPortalRecord {
  portalId: string;
  studentEmail: string;
  studentName: string;
  studentIdNumber: string;
  portalEmail: string;
  portalPasswordHash?: string;
  university: string;
  universityLocation: string;
  course: string;
  sponsorshipProgramme: string;
  grossAnnualFeeUsd: number;
  governmentCoveragePercent: number;
  governmentCoverageUsd: number;
  householdFeeUsd: number;
  expectedArrivalDate: string;
  intakeTerm: string;
  homeGuardianName: string;
  homeGuardianRelation: string;
  schoolGuardianName: string;
  schoolGuardianRole: string;
  workStudyRole: string;
  workStudyLocation: string;
  workStudyHourlyUsd: number;
  workStudyHoursPerDay: number;
  workStudyDaysPerWeek: number;
  enrollmentStatus: 'Pre-Arrival' | 'Enrolled' | 'Active';
  academicTranscript: AcademicTranscriptTerm[];
  feesLedger: FeeLedgerItem[];
  preArrivalChecklist: PreArrivalItem[];
  studentMail: StudentMailMessage[];
}

export type ActiveTab =
  | 'browse'
  | 'dashboard'
  | 'student-portal'
  | 'visa-guides'
  | 'how-it-works'
  | 'document-vault';

export type AuthScreen =
  | null
  | 'signup'
  | 'verify-email'
  | 'onboarding'
  | 'matching'
  | 'login'
  | 'forgot-password';
