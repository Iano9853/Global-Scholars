import crypto from 'crypto';
import dotenv from 'dotenv';
import express from 'express';
import fs from 'fs';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ADMIN_EMAIL = 'mulijosephine446@gmail.com';

function loadFirebaseWebApiKey(): string {
  if (process.env.FIREBASE_WEB_API_KEY?.trim()) {
    return process.env.FIREBASE_WEB_API_KEY.trim();
  }
  try {
    const configPath = path.resolve(__dirname, 'firebase-applet-config.json');
    const raw = fs.readFileSync(configPath, 'utf8');
    const parsed = JSON.parse(raw) as { apiKey?: string };
    return String(parsed.apiKey || '').trim();
  } catch {
    return '';
  }
}

interface VerifiedFirebaseUser {
  uid: string;
  email: string;
  emailVerified: boolean;
}

async function verifyFirebaseIdToken(idToken: string): Promise<VerifiedFirebaseUser | null> {
  const apiKey = loadFirebaseWebApiKey();
  if (!apiKey || !idToken) return null;

  try {
    const resp = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      }
    );
    if (!resp.ok) return null;
    const data = (await resp.json()) as {
      users?: Array<{
        localId?: string;
        email?: string;
        emailVerified?: boolean;
      }>;
    };
    const u = data.users?.[0];
    if (!u || !u.email || !u.localId) return null;
    return {
      uid: String(u.localId),
      email: String(u.email).trim().toLowerCase(),
      emailVerified: Boolean(u.emailVerified),
    };
  } catch {
    return null;
  }
}

function sha256Hex(value: string): string {
  return crypto.createHash('sha256').update(value, 'utf8').digest('hex');
}

interface ProvisionedStudentPortal {
  portalId: string;
  studentEmail: string;
  studentName: string;
  studentIdNumber: string;
  portalEmail: string;
  portalPassword: string;
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
  academicTranscript: Array<{
    term: string;
    courseCode: string;
    courseTitle: string;
    credits: number;
    grade: string;
    gpaPoints: number;
    status: 'Completed' | 'In Progress' | 'Upcoming';
  }>;
  feesLedger: Array<{
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
  }>;
  preArrivalChecklist: Array<{
    id: string;
    title: string;
    category: 'Immigration' | 'Health & Housing' | 'Financial' | 'Campus Onboarding';
    dueBy: string;
    status: 'Pending' | 'In Progress' | 'Completed';
    notes: string;
  }>;
  studentMail: Array<{
    id: string;
    senderName: string;
    senderEmail: string;
    senderDepartment: string;
    subject: string;
    sentAt: string;
    category: 'Admissions' | 'Financial Aid' | 'Work-Study' | 'Campus Life';
    body: string;
    read: boolean;
  }>;
}

const PROVISIONED_STUDENT_PORTALS: ProvisionedStudentPortal[] = [
  {
    portalId: 'alphonsanthenya806_gmail_com',
    studentEmail: 'alphonsanthenya806@gmail.com',
    studentName: 'Alphonsa Nthenya',
    studentIdNumber: 'BC-2026-0806',
    portalEmail: 'anthenya26@berea.edu',
    portalPassword: process.env.ALPHONSA_PORTAL_PASSWORD?.trim() || 'Berea#AN806!26',
    university: 'Berea College',
    universityLocation: 'Berea, Kentucky, USA',
    course: 'Medical Billing and Coding',
    sponsorshipProgramme: '80% Government Sponsorship & Berea Labor Work-Study Programme',
    grossAnnualFeeUsd: 10100,
    governmentCoveragePercent: 80,
    governmentCoverageUsd: 8080,
    householdFeeUsd: 2020,
    expectedArrivalDate: 'January 31, 2027',
    intakeTerm: 'Spring 2027 Arrival & Orientation',
    homeGuardianName: 'Ian Mwangangi Mutindi',
    homeGuardianRelation: 'Legal Guardian',
    schoolGuardianName: 'Emma Turner',
    schoolGuardianRole: 'Senior Peer Mentor & Campus Adjustment Guardian',
    workStudyRole: 'Student Librarian',
    workStudyLocation: 'Hutchins Library, Berea College',
    workStudyHourlyUsd: 15,
    workStudyHoursPerDay: 4,
    workStudyDaysPerWeek: 5,
    enrollmentStatus: 'Pre-Arrival',
    academicTranscript: [],
    feesLedger: [
      {
        id: 'fee-gross-2027',
        date: 'Spring 2027 Assessment',
        description:
          'Annual Programme Tuition, Medical Billing & Coding Lab & Campus Fees (100% Gross)',
        category: 'Tuition & Fees',
        amountUsd: 10100,
        status: 'Assessed',
      },
      {
        id: 'fee-gov-80',
        date: 'Expected Upon Enrollment',
        description:
          'Government Sponsorship Fee Coverage (80% — Expected once studies commence)',
        category: 'Government Sponsorship',
        amountUsd: -8080,
        status: 'Expected',
      },
      {
        id: 'fee-work-study',
        date: 'Expected Weekly Upkeep',
        description:
          'Hutchins Library Student Librarian Work-Study ($15.00/hr · 4 hrs/day — Weekly Bank Upkeep)',
        category: 'Institutional Aid',
        amountUsd: 0,
        status: 'Expected',
      },
      {
        id: 'fee-household-net',
        date: 'Expected Balance (20%)',
        description: 'Expected Household Fee Contribution After 80% Government Coverage',
        category: 'Household Payment',
        amountUsd: 2020,
        status: 'Expected',
      },
    ],
    preArrivalChecklist: [
      {
        id: 'prep-visa',
        title: 'Confirm Passport Validity & F-1 Student Visa Clearance',
        category: 'Immigration',
        dueBy: 'January 10, 2027',
        status: 'Pending',
        notes: 'Keep I-20 certificate and Berea College admission letter in carry-on luggage.',
      },
      {
        id: 'prep-health',
        title: 'Upload Immunization & Medical Clearance Records',
        category: 'Health & Housing',
        dueBy: 'January 15, 2027',
        status: 'Pending',
        notes: 'Required by Berea Health Services prior to residence hall key release.',
      },
      {
        id: 'prep-fee',
        title: 'Prepare $2,020 USD Expected Household Fee Plan',
        category: 'Financial',
        dueBy: 'January 20, 2027',
        status: 'Pending',
        notes: 'Remaining 20% household responsibility after 80% government fee coverage.',
      },
      {
        id: 'prep-library',
        title: 'Complete Hutchins Library Student Librarian Onboarding Packet',
        category: 'Campus Onboarding',
        dueBy: 'January 28, 2027',
        status: 'Pending',
        notes: 'Upkeep earnings ($15.00/hr, 4 hrs/day = $300/week) begin after arrival and are disbursed weekly to your bank account.',
      },
      {
        id: 'prep-arrival',
        title: 'Arrive on Campus & Meet School Guardian Emma Turner',
        category: 'Campus Onboarding',
        dueBy: 'January 31, 2027',
        status: 'Pending',
        notes: 'Emma Turner will assist with residence check-in, campus tour, and ID card pickup.',
      },
    ],
    studentMail: [
      {
        id: 'mail-welcome-2027',
        senderName: 'Berea International Student Services',
        senderEmail: 'international@berea.edu',
        senderDepartment: 'Office of International Admissions & Arrival',
        subject: 'Official Welcome, Expected Arrival (Jan 31) & Your Campus Mentor Emma Turner',
        sentAt: 'Nov 18, 2026',
        category: 'Admissions',
        read: false,
        body: [
          'Dear Alphonsa Nthenya,',
          '',
          'Congratulations on your admission to Berea College for the Medical Billing and Coding programme (Student ID: BC-2026-0806).',
          '',
          'Your personal school email address (anthenya26@berea.edu) is now active inside your Student Portal for all official university notices.',
          '',
          'Expected Arrival & Peer Support:',
          '• Expected Campus Arrival Date: January 31, 2027 (Spring 2027 Arrival & Orientation)',
          '• Assigned School Guardian (Senior Student Mentor): Emma Turner will welcome you upon arrival, guide your residence hall check-in, and help you adjust smoothly to campus life at Berea College.',
          '• Legal Guardian on Record: Ian Mwangangi Mutindi',
          '',
          'Please monitor this Student Mail inbox regularly for housing room assignments, airport shuttle confirmation, and orientation schedules.',
          '',
          'Warm regards,',
          'Office of International Student Services',
          'Berea College · Berea, Kentucky, USA',
        ].join('\n'),
      },
      {
        id: 'mail-workstudy-upkeep',
        senderName: 'Berea College Labor Program Office',
        senderEmail: 'labor-program@berea.edu',
        senderDepartment: 'Campus Work-Study & Payroll Office',
        subject: 'Hutchins Library Work-Study Placement & Weekly Bank Upkeep Disbursement',
        sentAt: 'Nov 18, 2026',
        category: 'Work-Study',
        read: false,
        body: [
          'Dear Alphonsa Nthenya,',
          '',
          'We are pleased to confirm your pre-arrival work-study placement at Berea College:',
          '• Position: Student Librarian',
          '• Workplace: Hutchins Library, Berea College',
          '• Hourly Rate: $15.00 USD per hour',
          '• Schedule: 4 hours per day, 5 days per week (20 hours/week = $300.00 USD/week)',
          '',
          'Important Upkeep & Guardian Notification Policy:',
          '1. Your work-study earnings are strictly your personal student upkeep money and begin once you arrive on campus and start active library shifts.',
          '2. Your weekly upkeep pay will be disbursed directly to your nominated student bank account on a weekly basis.',
          '3. For transparency and family support, official weekly disbursement & hours records will also be sent directly via email to your legal guardian, Ian Mwangangi Mutindi.',
          '',
          'Bank direct-deposit enrollment will be completed during Orientation Week after your arrival on January 31, 2027.',
          '',
          'Sincerely,',
          'Berea College Labor Program Office',
        ].join('\n'),
      },
      {
        id: 'mail-financial-assessment',
        senderName: 'Berea Office of Student Financial Services',
        senderEmail: 'bursar@berea.edu',
        senderDepartment: 'Student Accounts & Sponsorship Billing',
        subject: 'Pre-Arrival Fee Assessment: 80% Government Coverage & $2,020 USD Household Fee',
        sentAt: 'Nov 18, 2026',
        category: 'Financial Aid',
        read: false,
        body: [
          'Dear Alphonsa Nthenya,',
          '',
          'Your pre-arrival fee assessment for the upcoming academic year is now available in the Fees Transcript tab and as an official downloadable PDF Fee Statement:',
          '• Gross Annual Tuition & Programme Fees: $10,100.00 USD (Assessed)',
          '• Expected 80% Government Sponsorship Coverage: $8,080.00 USD (Expected upon enrollment)',
          '• Expected Net Household Fee Responsibility (20%): $2,020.00 USD (Expected)',
          '',
          'Please note that because you have not yet started learning, no sponsorship or payment amounts have been credited to your ledger yet. Credits will post officially once you check in and commence classes.',
          '',
          'Sincerely,',
          'Office of Student Financial Services',
          'Berea College',
        ].join('\n'),
      },
    ],
  },
];

function stripPortalSecret(record: ProvisionedStudentPortal) {
  const { portalPassword, ...safeRecord } = record;
  return {
    ...safeRecord,
    portalPasswordHash: sha256Hex(portalPassword),
  };
}

interface ApplicationEmailPayload {
  studentName: string;
  studentEmail: string;
  university: string;
  programTitle: string;
  deadline: string;
  passportCountry?: string;
  degreeType?: string;
  major?: string;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function createApp() {
  const app = express();
  app.use(express.json({ limit: '256kb' }));

  app.post('/api/student-portal/authenticate', async (req, res) => {
    const body = req.body as {
      idToken?: string;
      portalEmail?: string;
      portalPassword?: string;
    };

    const idToken = String(body.idToken || '').trim();
    const portalEmail = String(body.portalEmail || '')
      .trim()
      .toLowerCase();
    const portalPassword = String(body.portalPassword || '');

    if (!idToken || !portalEmail || !portalPassword) {
      res.status(400).json({
        authenticated: false,
        error: 'Please enter your personal school email and portal password.',
      });
      return;
    }

    const verifiedUser = await verifyFirebaseIdToken(idToken);
    if (!verifiedUser || !verifiedUser.emailVerified) {
      res.status(401).json({
        authenticated: false,
        error: 'Please sign in with your verified platform account first.',
      });
      return;
    }

    const matchBySignUpEmail = PROVISIONED_STUDENT_PORTALS.find(
      (entry) => entry.studentEmail.toLowerCase() === verifiedUser.email
    );

    if (!matchBySignUpEmail) {
      res.status(403).json({
        authenticated: false,
        error: `No Student Portal has been provisioned for ${verifiedUser.email}. Only the exact student admitted with their sign-up email can access their portal.`,
      });
      return;
    }

    if (
      portalEmail !== matchBySignUpEmail.portalEmail.toLowerCase() ||
      portalPassword !== matchBySignUpEmail.portalPassword
    ) {
      res.status(401).json({
        authenticated: false,
        error: 'Invalid school student email or Student Portal password.',
      });
      return;
    }

    res.json({
      authenticated: true,
      portal: stripPortalSecret(matchBySignUpEmail),
    });
  });

  app.post('/api/student-portal/admin-roster', async (req, res) => {
    const body = req.body as { idToken?: string };
    const idToken = String(body.idToken || '').trim();
    const verifiedUser = await verifyFirebaseIdToken(idToken);

    if (!verifiedUser || !verifiedUser.emailVerified || verifiedUser.email !== ADMIN_EMAIL) {
      res.status(403).json({
        authorized: false,
        error: 'Access restricted to authorized platform coordinator.',
      });
      return;
    }

    res.json({
      authorized: true,
      students: PROVISIONED_STUDENT_PORTALS.map((entry) => ({
        ...stripPortalSecret(entry),
        generatedPortalPassword: entry.portalPassword,
      })),
    });
  });

  app.post('/api/send-application-email', async (req, res) => {
    const body = req.body as Partial<ApplicationEmailPayload>;
    const studentName = String(body.studentName || '').trim();
    const studentEmail = String(body.studentEmail || '').trim();
    const university = String(body.university || '').trim();
    const programTitle = String(body.programTitle || '').trim();
    const deadline = String(body.deadline || '').trim();

    if (!studentEmail || !studentEmail.includes('@') || !university || !programTitle) {
      res.status(400).json({
        delivered: false,
        error: 'Missing required student email or university details.',
      });
      return;
    }

    const referenceId = `SW-${Date.now().toString(36).toUpperCase()}`;
    const subject = `Confirmation: ${university} Official Admissions Outreach (${referenceId})`;
    const textBody = [
      `Hello ${studentName || 'Applicant'},`,
      '',
      `Thank you for confirming the eligibility requirements and selecting:`,
      `${programTitle}`,
      '',
      `An official from ${university} will reach out to you shortly at ${studentEmail} to get to know more about your academic background, work-study goals, and next steps ahead of the ${deadline} deadline.`,
      '',
      `Reference ID: ${referenceId}`,
      `Profile Summary: ${body.passportCountry || 'International Applicant'} · ${body.degreeType || 'Degree Applicant'}${body.major ? ` · ${body.major}` : ''}`,
      '',
      `Best regards,`,
      `ScholarWork Global Admissions Coordination`,
    ].join('\n');

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; color: #0F243E; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #E2E8F0; border-radius: 12px;">
        <h2 style="color: #0C2340; margin-top: 0;">Thank you for selecting ${escapeHtml(university)}</h2>
        <p>Hello ${escapeHtml(studentName || 'Applicant')},</p>
        <p>Thank you for reviewing and confirming the requirements for <strong>${escapeHtml(programTitle)}</strong>.</p>
        <p>An official from <strong>${escapeHtml(university)}</strong> will reach out to you shortly at <strong>${escapeHtml(studentEmail)}</strong> to get to know more about you, discuss your eligibility, and guide your next steps before the <strong>${escapeHtml(deadline)}</strong> deadline.</p>
        <div style="background: #F4F6F9; padding: 14px; border-radius: 8px; margin: 20px 0; font-size: 13px;">
          <div><strong>Reference ID:</strong> ${escapeHtml(referenceId)}</div>
          <div><strong>Applicant Profile:</strong> ${escapeHtml(body.passportCountry || 'International')} · ${escapeHtml(body.degreeType || 'Degree')}${body.major ? ` · ${escapeHtml(body.major)}` : ''}</div>
        </div>
        <p style="font-size: 13px; color: #475569;">ScholarWork Global Admissions Coordination</p>
      </div>
    `;

    const resendApiKey = process.env.RESEND_API_KEY?.trim();
    const resendFromEmail =
      process.env.RESEND_FROM_EMAIL?.trim() || 'ScholarWork Global <onboarding@resend.dev>';

    if (resendApiKey && resendApiKey !== 'MY_RESEND_API_KEY') {
      try {
        const resendResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: resendFromEmail,
            to: [studentEmail],
            subject,
            text: textBody,
            html: htmlBody,
          }),
        });

        const resendData = (await resendResponse.json().catch(() => ({}))) as {
          id?: string;
          message?: string;
        };

        if (!resendResponse.ok) {
          res.status(200).json({
            delivered: false,
            mode: 'resend_error',
            referenceId,
            recipient: studentEmail,
            error: resendData.message || `Resend returned status ${resendResponse.status}`,
          });
          return;
        }

        res.json({
          delivered: true,
          mode: 'resend',
          resendId: resendData.id,
          referenceId,
          recipient: studentEmail,
          subject,
        });
        return;
      } catch (err) {
        const errMessage = err instanceof Error ? err.message : 'Resend delivery failed';
        res.status(200).json({
          delivered: false,
          mode: 'resend_error',
          referenceId,
          recipient: studentEmail,
          error: errMessage,
        });
        return;
      }
    }

    // No Resend API key configured in AI Studio Secrets: honestly report status
    res.json({
      delivered: false,
      mode: 'resend_not_configured',
      referenceId,
      recipient: studentEmail,
      subject,
      previewText: textBody,
    });
  });

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  // Never let unmatched /api/* routes fall through to Vite HTML SPA fallback
  app.use('/api', (_req, res) => {
    res.status(404).json({ delivered: false, error: 'API endpoint not found' });
  });

  const httpServer = http.createServer(app);
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const hmrDisabled = process.env.DISABLE_HMR === 'true';
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: hmrDisabled ? false : { server: httpServer },
        watch: hmrDisabled ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const port = Number(process.env.PORT || '3000');
  httpServer.listen(port, '0.0.0.0', () => {
    console.log(`ScholarWork Global server running on http://0.0.0.0:${port}`);
  });
}

createApp();
