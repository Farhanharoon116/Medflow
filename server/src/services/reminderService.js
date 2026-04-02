import nodemailer from 'nodemailer';
import cron from 'node-cron';
import Patient from '../models/Patient.js';
import Prescription from '../models/Prescription.js';
import { buildActiveMedicineList } from '../utils/medicineDuration.js';

function getTransporter() {
  const { EMAIL_HOST, EMAIL_USER, EMAIL_PASS, EMAIL_PORT } = process.env;
  if (!EMAIL_HOST || !EMAIL_USER || !EMAIL_PASS) {
    return null;
  }
  const port = parseInt(EMAIL_PORT || '587', 10);
  return nodemailer.createTransport({
    host: EMAIL_HOST,
    port,
    secure: port === 465,
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  });
}

function formatReminderDate(d) {
  return d.toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Karachi',
  });
}

function buildReminderHtml({ patientName, medicines, dateLabel }) {
  const rows = medicines
    .map(
      (m) => `
    <tr>
      <td style="padding:12px 16px;border-bottom:1px solid #e2e8f0;font-family:DM Sans,Segoe UI,sans-serif;font-size:14px;color:#0f172a;">
        <strong style="font-family:Outfit,sans-serif;">${escapeHtml(m.name)}</strong>
        <div style="margin-top:4px;font-size:13px;color:#475569;">${escapeHtml(m.dosage)} · ${escapeHtml(m.frequency)}</div>
      </td>
    </tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#f8fafc;padding:24px;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 4px 16px rgba(0,0,0,0.06);">
    <tr>
      <td style="background:#0A1628;padding:24px 28px;">
        <table role="presentation" width="100%"><tr>
          <td>
            <span style="font-family:Outfit,sans-serif;font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.02em;">MedFlow</span>
            <span style="display:inline-block;margin-left:10px;padding:4px 8px;border-radius:6px;background:rgba(0,200,150,0.2);color:#00C896;font-size:10px;font-weight:700;letter-spacing:0.06em;">HEALTH</span>
          </td>
        </tr></table>
        <p style="margin:16px 0 0;font-family:DM Sans,sans-serif;font-size:15px;color:rgba(255,255,255,0.85);line-height:1.5;">
          Hi ${escapeHtml(patientName || 'there')}, here are your medicines for <strong style="color:#fff;">${escapeHtml(dateLabel)}</strong>.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:8px 0 0;">
        <p style="margin:16px 24px 8px;font-family:Outfit,sans-serif;font-size:12px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em;">Today's medicines</p>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">${rows}</table>
      </td>
    </tr>
    <tr>
      <td style="padding:20px 24px 24px;border-top:1px solid #e2e8f0;background:#f8fafc;">
        <p style="margin:0;font-family:DM Sans,sans-serif;font-size:12px;color:#94a3b8;text-align:center;">
          Powered by <span style="color:#00C896;font-weight:600;">MedFlow</span>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function loadActiveMedicinesForPatient(patientId) {
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

  const prescriptions = await Prescription.find({
    patient: patientId,
    createdAt: { $gte: sixtyDaysAgo },
  })
    .sort({ createdAt: -1 })
    .populate('doctor', 'name');

  const list = buildActiveMedicineList(
    prescriptions.map((p) => p.toObject({ virtuals: true }))
  );
  return list;
}

/**
 * Send one reminder email listing active medicines for today.
 * @returns {{ sent: boolean, message: string }}
 */
export async function sendMedicineReminderForPatient(patientId) {
  const patient = await Patient.findById(patientId).populate('userAccount', 'email name');

  if (!patient) {
    return { sent: false, message: 'Patient not found.' };
  }

  const medicines = await loadActiveMedicinesForPatient(patientId);

  if (medicines.length === 0) {
    return { sent: false, message: 'No active medicines for this patient.' };
  }

  const toEmail = patient.userAccount?.email || patient.email;
  if (!toEmail) {
    return { sent: false, message: 'No email address on file for this patient.' };
  }

  const transporter = getTransporter();
  if (!transporter) {
    return {
      sent: false,
      message: 'Email is not configured (missing EMAIL_* env vars).',
    };
  }

  const now = new Date();
  const dateLabel = formatReminderDate(now);
  const subject = `MedFlow - Your Medicine Reminder for ${dateLabel}`;

  const patientName = patient.userAccount?.name || patient.name;

  const html = buildReminderHtml({
    patientName,
    medicines,
    dateLabel,
  });

  await transporter.sendMail({
    from: `"MedFlow" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject,
    html,
  });

  return { sent: true, message: 'Reminder email sent successfully.' };
}

export async function runDailyMedicineReminders() {
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

  const patientIds = await Prescription.distinct('patient', {
    createdAt: { $gte: sixtyDaysAgo },
  });

  let sent = 0;
  let skipped = 0;

  for (const pid of patientIds) {
    try {
      const result = await sendMedicineReminderForPatient(pid);
      if (result.sent) sent += 1;
      else skipped += 1;
    } catch (err) {
      console.error(`Daily reminder failed for patient ${pid}:`, err.message);
    }
  }

  console.log(
    `📧 Daily medicine reminders: ${sent} sent, ${skipped} skipped (${patientIds.length} patients with recent prescriptions).`
  );
}

export function startReminderCron() {
  // Every day at 8:00 AM Pakistan time (PKT, UTC+5) — same as 03:00 UTC when no DST
  cron.schedule(
    '0 8 * * *',
    () => {
      runDailyMedicineReminders().catch((err) =>
        console.error('Medicine reminder cron failed:', err)
      );
    },
    { timezone: 'Asia/Karachi' }
  );

  console.log('📧 Medicine reminder cron scheduled (daily 8:00 Asia/Karachi).');
}
