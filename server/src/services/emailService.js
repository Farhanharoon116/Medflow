import nodemailer from 'nodemailer';

function getTransporter() {
  const { EMAIL_HOST, EMAIL_USER, EMAIL_PASS } = process.env;
  const port = parseInt(process.env.EMAIL_PORT || '587', 10);

  if (!EMAIL_HOST || !EMAIL_USER || !EMAIL_PASS) return null;

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

function escapeHtml(s) {
  if (s === null || s === undefined) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getAppUrl() {
  return process.env.APP_URL || '';
}

function getWhatsAppLink() {
  const raw = process.env.WHATSAPP_SUPPORT_NUMBER || '+923001234567';
  const digits = String(raw).replace(/[^\d]/g, '');
  return `https://wa.me/${digits}`;
}

function getWhatsAppText() {
  return process.env.WHATSAPP_SUPPORT_NUMBER || '+92 300 123 4567';
}

function buildWelcomeEmailHtml({ user, clinic }) {
  const appUrl = getAppUrl();
  const loginHref = appUrl ? `${appUrl}/login` : '/login';
  const clinicName = clinic?.name || 'your clinic';
  const loginEmail = user?.email || '';

  // Gmail/Outlook/Apple Mail friendly: use tables + inline styles only.
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <meta name="x-apple-disable-message-reformatting" />
  </head>
  <body style="margin:0;background:#ffffff;padding:0;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#ffffff;">
      <tr>
        <td align="center" style="padding:24px 12px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;">
            <tr>
              <td style="background:#0A1628;padding:22px 22px;">
                <span style="font-family:Outfit,Segoe UI,sans-serif;font-size:22px;font-weight:800;letter-spacing:-0.02em;color:#ffffff;">MedFlow</span>
              </td>
            </tr>

            <tr>
              <td style="padding:26px 22px 10px;font-family:DM Sans,Segoe UI,sans-serif;">
                <h2 style="margin:0 0 12px;font-size:20px;line-height:1.35;color:#0f172a;font-family:Outfit,Segoe UI,sans-serif;">
                  Your clinic ${escapeHtml(clinicName)} is live!
                </h2>

                <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#334155;">
                  You can now log in to manage doctors, reception staff, patients, and appointments.
                </p>

                <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#334155;">
                  <strong style="color:#0f172a;">Login email:</strong> ${escapeHtml(loginEmail)}
                </p>

                <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 18px;">
                  <tr>
                    <td bgcolor="#00C896" style="border-radius:10px;">
                      <a href="${escapeHtml(loginHref)}"
                        style="display:inline-block;padding:12px 18px;font-family:DM Sans,Segoe UI,sans-serif;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:10px;background:#00C896;">
                        Login to MedFlow
                      </a>
                    </td>
                  </tr>
                </table>

                <p style="margin:0 0 10px;font-size:13px;line-height:1.5;color:#334155;font-weight:700;">
                  Getting started checklist:
                </p>

                <ol style="margin:0;padding-left:18px;font-size:14px;line-height:1.7;color:#0f172a;">
                  <li style="margin:0 0 6px;">✅ Add your first doctor</li>
                  <li style="margin:0 0 6px;">✅ Add your first receptionist</li>
                  <li style="margin:0 0 6px;">✅ Register your first patient</li>
                  <li style="margin:0 0 6px;">✅ Book your first appointment</li>
                  <li style="margin:0 0 6px;">✅ Complete your clinic profile (address, phone, logo)</li>
                </ol>
              </td>
            </tr>

            <tr>
              <td style="padding:16px 22px 22px;background:#f8fafc;border-top:1px solid #e2e8f0;font-family:DM Sans,Segoe UI,sans-serif;">
                <p style="margin:0 0 8px;font-size:12px;line-height:1.5;color:#64748b;">
                  Built in Pakistan for Pakistan.
                </p>
                <p style="margin:0 0 8px;font-size:12px;line-height:1.5;color:#64748b;">
                  Need help? WhatsApp us:
                  <a href="${getWhatsAppLink()}" style="color:#00C896;text-decoration:none;font-weight:700;">${escapeHtml(getWhatsAppText())}</a>
                </p>
                <p style="margin:0;font-size:12px;line-height:1.5;color:#94a3b8;">
                  Unsubscribe note: If you no longer want onboarding emails, you can reply with <strong style="color:#94a3b8;">STOP</strong>.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function buildStaffWelcomeEmailHtml({ staffUser, clinic, temporaryPassword }) {
  const appUrl = getAppUrl();
  const loginHref = appUrl ? `${appUrl}/login` : '/login';

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <meta name="x-apple-disable-message-reformatting" />
  </head>
  <body style="margin:0;background:#ffffff;padding:0;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#ffffff;">
      <tr>
        <td align="center" style="padding:24px 12px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;">
            <tr>
              <td style="background:#0A1628;padding:22px 22px;">
                <span style="font-family:Outfit,Segoe UI,sans-serif;font-size:22px;font-weight:800;letter-spacing:-0.02em;color:#ffffff;">MedFlow</span>
              </td>
            </tr>

            <tr>
              <td style="padding:26px 22px;font-family:DM Sans,Segoe UI,sans-serif;">
                <h2 style="margin:0 0 12px;font-size:20px;line-height:1.35;color:#0f172a;font-family:Outfit,Segoe UI,sans-serif;">
                  Welcome to ${escapeHtml(clinic?.name || 'your clinic')}
                </h2>
                <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#334155;">
                  Hi ${escapeHtml(staffUser?.name || 'there')}, you’ve been added to MedFlow.
                </p>

                <p style="margin:0 0 10px;font-size:14px;line-height:1.6;color:#334155;">
                  <strong style="color:#0f172a;">Login email:</strong> ${escapeHtml(staffUser?.email || '')}
                </p>
                <p style="margin:0 0 18px;font-size:14px;line-height:1.6;color:#334155;">
                  <strong style="color:#0f172a;">Temporary password:</strong> ${escapeHtml(temporaryPassword || '')}
                </p>

                <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 18px;">
                  <tr>
                    <td bgcolor="#00C896" style="border-radius:10px;">
                      <a href="${escapeHtml(loginHref)}"
                        style="display:inline-block;padding:12px 18px;font-family:DM Sans,Segoe UI,sans-serif;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:10px;background:#00C896;">
                        Login to MedFlow
                      </a>
                    </td>
                  </tr>
                </table>

                <p style="margin:0;font-size:12px;line-height:1.5;color:#64748b;">
                  Please update your password after logging in.
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding:16px 22px 22px;background:#f8fafc;border-top:1px solid #e2e8f0;font-family:DM Sans,Segoe UI,sans-serif;">
                <p style="margin:0 0 8px;font-size:12px;line-height:1.5;color:#64748b;">
                  Built in Pakistan for Pakistan.
                </p>
                <p style="margin:0;font-size:12px;line-height:1.5;color:#94a3b8;">
                  Need help? WhatsApp us:
                  <a href="${getWhatsAppLink()}" style="color:#00C896;text-decoration:none;font-weight:700;">${escapeHtml(getWhatsAppText())}</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export async function sendWelcomeEmail(user, clinic) {
  try {
    const transporter = getTransporter();
    if (!transporter) return false;

    const subject = 'Welcome to MedFlow — Your clinic is ready 🎉';
    const toEmail = user?.email;
    if (!toEmail) return false;

    const html = buildWelcomeEmailHtml({ user, clinic });

    await transporter.sendMail({
      from: `"MedFlow" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject,
      html,
    });

    return true;
  } catch (err) {
    console.error('sendWelcomeEmail failed:', err?.message || err);
    return false;
  }
}

export async function sendStaffWelcomeEmail(staffUser, clinic, temporaryPassword) {
  try {
    const transporter = getTransporter();
    if (!transporter) return false;

    const toEmail = staffUser?.email;
    if (!toEmail) return false;

    const subject = `Welcome to MedFlow — ${clinic?.name || 'your clinic'}`;
    const html = buildStaffWelcomeEmailHtml({ staffUser, clinic, temporaryPassword });

    await transporter.sendMail({
      from: `"MedFlow" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject,
      html,
    });

    return true;
  } catch (err) {
    console.error('sendStaffWelcomeEmail failed:', err?.message || err);
    return false;
  }
}

