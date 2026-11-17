import dotenv from 'dotenv';
import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
