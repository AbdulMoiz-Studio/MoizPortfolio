/**
 * Email Templates Module for Moiz Studio Contact Automation
 * 
 * Provides both HTML and plain-text templates for:
 * 1. Owner notification (inquiry alert to site owner)
 * 2. Visitor auto-reply (immediate professional confirmation to client)
 */

const { escapeHtml, sanitizeHeader } = require('./validator');

/**
 * Generate Owner Notification Email
 * @param {Object} params
 * @param {string} params.firstName
 * @param {string} params.email
 * @param {string} params.message
 * @param {string} params.submittedAt
 * @returns {{ subject: string, text: string, html: string }}
 */
function ownerEmail({ firstName, email, message, submittedAt }) {
  const cleanName = sanitizeHeader(firstName);
  const cleanEmail = sanitizeHeader(email);
  const safeName = escapeHtml(cleanName);
  const safeEmail = escapeHtml(cleanEmail);
  const safeMessageHtml = escapeHtml(message).replace(/\n/g, '<br>');
  const safeSubmittedAt = escapeHtml(submittedAt);

  const subject = `New Project Inquiry from ${cleanName}`;

  const text = `New Project Inquiry Received

Name: ${cleanName}
Email: ${cleanEmail}
Submitted On: ${submittedAt} (Asia/Karachi)
Source: moizstudio.me contact form

Message:
--------------------------------------------------
${message}
--------------------------------------------------

Reply to this email to respond directly to ${cleanName}.
`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #18181b;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f5; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <!-- Top Accent Bar -->
          <tr>
            <td height="5" style="background-color: #FF5A1F; font-size: 0; line-height: 0;">&nbsp;</td>
          </tr>
          <!-- Header -->
          <tr>
            <td style="background-color: #0d0d0d; padding: 24px 30px;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td>
                    <img src="https://www.moizstudio.me/assets/images/thumbs/final%20logo-footer.png" alt="Moiz Studio" width="150" style="max-width: 150px; height: auto; display: block; border: 0;" />
                  </td>
                  <td align="right">
                    <span style="display: inline-block; padding: 4px 10px; background-color: #FF5A1F; color: #ffffff; font-size: 11px; font-weight: bold; text-transform: uppercase; border-radius: 4px; letter-spacing: 1px;">NEW INQUIRY</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Body Content -->
          <tr>
            <td style="padding: 32px 30px;">
              <h1 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 700; color: #09090b; line-height: 1.3;">
                New Inquiry from ${safeName}
              </h1>
              <p style="margin: 0 0 24px 0; font-size: 14px; color: #71717a;">
                A visitor submitted the contact form on <strong style="color: #09090b;">moizstudio.me</strong>.
              </p>

              <!-- Metadata Table -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px; border: 1px solid #e4e4e7; border-radius: 6px; border-collapse: separate; overflow: hidden;">
                <tr style="background-color: #fafafa;">
                  <td style="padding: 10px 14px; font-size: 12px; font-weight: 700; color: #71717a; text-transform: uppercase; width: 30%; border-bottom: 1px solid #e4e4e7;">Client Name</td>
                  <td style="padding: 10px 14px; font-size: 14px; font-weight: 600; color: #09090b; border-bottom: 1px solid #e4e4e7;">${safeName}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 14px; font-size: 12px; font-weight: 700; color: #71717a; text-transform: uppercase; border-bottom: 1px solid #e4e4e7;">Email Address</td>
                  <td style="padding: 10px 14px; font-size: 14px; font-weight: 600; color: #FF5A1F; border-bottom: 1px solid #e4e4e7;">
                    <a href="mailto:${safeEmail}" style="color: #FF5A1F; text-decoration: none;">${safeEmail}</a>
                  </td>
                </tr>
                <tr style="background-color: #fafafa;">
                  <td style="padding: 10px 14px; font-size: 12px; font-weight: 700; color: #71717a; text-transform: uppercase; border-bottom: 1px solid #e4e4e7;">Submitted On</td>
                  <td style="padding: 10px 14px; font-size: 13px; color: #27272a; border-bottom: 1px solid #e4e4e7;">${safeSubmittedAt} (Asia/Karachi)</td>
                </tr>
                <tr>
                  <td style="padding: 10px 14px; font-size: 12px; font-weight: 700; color: #71717a; text-transform: uppercase;">Source</td>
                  <td style="padding: 10px 14px; font-size: 13px; color: #27272a;">moizstudio.me contact form</td>
                </tr>
              </table>

              <!-- Message Block -->
              <div style="margin-bottom: 24px;">
                <span style="display: block; font-size: 12px; font-weight: 700; color: #71717a; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 1px;">Message Content</span>
                <div style="background-color: #fafafa; border-left: 4px solid #FF5A1F; padding: 18px 20px; border-radius: 0 6px 6px 0; font-size: 14px; line-height: 1.65; color: #18181b; word-break: break-word;">
                  ${safeMessageHtml}
                </div>
              </div>

              <!-- Reply Action Callout -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #09090b; border-radius: 6px; padding: 16px 20px;">
                <tr>
                  <td>
                    <p style="margin: 0; font-size: 14px; color: #f4f4f5; line-height: 1.5;">
                      Reply to this email to respond directly to ${safeName}.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #fafafa; border-top: 1px solid #e4e4e7; padding: 16px 30px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #a1a1aa;">
                Moiz Studio Automated System &bull; <a href="https://moizstudio.me" style="color: #71717a; text-decoration: none;">moizstudio.me</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, text, html };
}

/**
 * Generate Visitor Auto-Reply Email
 * @param {Object} params
 * @param {string} params.firstName
 * @param {string} params.message
 * @returns {{ subject: string, text: string, html: string }}
 */
function visitorEmail({ firstName, message }) {
  const cleanName = sanitizeHeader(firstName);
  const safeName = escapeHtml(cleanName);
  const safeMessageHtml = escapeHtml(message).replace(/\n/g, '<br>');

  const subject = `Thanks for reaching out, ${cleanName}!`;

  const text = `Hi ${cleanName},

Thank you for contacting Moiz Studio. I've received your message and will review it personally.

What happens next:
1. I'll go through your requirements.
2. I'll get back to you within 24 hours with my thoughts and next steps.

Your message:
"${message}"

To help me understand your project faster, feel free to reply to this email with:
- Your current website link (if you have one)
- What you'd like to achieve with the new website
- Your preferred timeline

If it's urgent, Chat on WhatsApp: https://api.whatsapp.com/send?phone=923098828483

In the meantime, you can explore my recent work here: https://www.moizstudio.me/#work

Looking forward to working with you.

Best regards,
Abdul Moiz
Wix Studio Expert & Web Designer
moizstudio.me | contactwithabdulmoiz@gmail.com
`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>${escapeHtml(subject)}</title>
  <style>
    :root {
      color-scheme: light dark;
      supported-color-schemes: light dark;
    }
    /* Universal Button Text Protection for Dark Mode (Gmail iOS/Android, Apple Mail, Outlook) */
    .btn-white-text,
    .btn-white-text a,
    .btn-white-text span {
      color: #ffffff !important;
      -webkit-text-fill-color: #ffffff !important;
      text-decoration: none !important;
    }
    u + .body .btn-white-text,
    u + .body a.btn-white-text,
    u + .body span.btn-white-text,
    [data-ogsb] .btn-white-text,
    [data-ogsc] .btn-white-text {
      color: #ffffff !important;
      -webkit-text-fill-color: #ffffff !important;
    }
    @media (prefers-color-scheme: dark) {
      .btn-white-text {
        color: #ffffff !important;
        -webkit-text-fill-color: #ffffff !important;
      }
    }
  </style>
</head>
<body class="body" style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #18181b; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f5; padding: 30px 15px;">
    <tr>
      <td align="center">
        <!-- Main Email Container (600px max) -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <!-- Top Orange Accent Bar -->
          <tr>
            <td height="5" style="background-color: #FF5A1F; font-size: 0; line-height: 0;">&nbsp;</td>
          </tr>
          <!-- Header (Always Dark with White Logo) -->
          <tr>
            <td style="background-color: #0d0d0d; padding: 28px 30px; text-align: center;">
              <a href="https://www.moizstudio.me" target="_blank" rel="noopener noreferrer" style="text-decoration: none; display: inline-block;">
                <img src="https://www.moizstudio.me/assets/images/thumbs/final%20logo-footer.png" alt="Moiz Studio Logo" width="190" style="max-width: 190px; width: 100%; height: auto; display: block; margin: 0 auto; border: 0;" />
              </a>
              <p style="margin: 8px 0 0 0; font-size: 11px; color: #a1a1aa !important; -webkit-text-fill-color: #a1a1aa !important; letter-spacing: 1.5px; text-transform: uppercase; font-weight: 600;">
                Wix Studio Expert &bull; Web Designer &bull; Wix Velo
              </p>
            </td>
          </tr>
          <!-- Body Content -->
          <tr>
            <td style="padding: 32px 30px;">
              <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6; color: #18181b;">
                Hi <strong>${safeName}</strong>,
              </p>
              <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #27272a;">
                Thank you for contacting Moiz Studio. I've received your message and will review it personally.
              </p>

              <!-- What happens next box -->
              <div style="background-color: #fafafa; border: 1px solid #e4e4e7; border-radius: 6px; padding: 18px 20px; margin-bottom: 24px;">
                <h3 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 700; color: #09090b; text-transform: uppercase; letter-spacing: 0.5px;">
                  What happens next:
                </h3>
                <ol style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.6; color: #27272a;">
                  <li style="margin-bottom: 6px;">I'll go through your requirements.</li>
                  <li>I'll get back to you within 24 hours with my thoughts and next steps.</li>
                </ol>
              </div>

              <!-- Your message recap -->
              <div style="margin-bottom: 24px;">
                <span style="display: block; font-size: 12px; font-weight: 700; color: #71717a; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 0.5px;">Your message:</span>
                <div style="background-color: #fafafa; border-left: 3px solid #FF5A1F; padding: 14px 18px; border-radius: 0 6px 6px 0; font-style: italic; font-size: 14px; line-height: 1.6; color: #52525b; word-break: break-word;">
                  &ldquo;${safeMessageHtml}&rdquo;
                </div>
              </div>

              <!-- Faster understanding points -->
              <p style="margin: 0 0 10px 0; font-size: 14px; line-height: 1.6; color: #27272a;">
                To help me understand your project faster, feel free to reply to this email with:
              </p>
              <ul style="margin: 0 0 24px 0; padding-left: 20px; font-size: 14px; line-height: 1.6; color: #52525b;">
                <li style="margin-bottom: 4px;">Your current website link (if you have one)</li>
                <li style="margin-bottom: 4px;">What you'd like to achieve with the new website</li>
                <li>Your preferred timeline</li>
              </ul>

              <!-- WhatsApp Action Box (Adaptive Light/Dark Container) -->
              <div style="background-color: #fafafa; border: 1px solid #e4e4e7; border-radius: 8px; padding: 20px 24px; margin-bottom: 28px; text-align: center;">
                <p style="margin: 0 0 14px 0; font-size: 14px; line-height: 1.5; color: #18181b; font-weight: 600;">
                  Need an urgent answer? Let's talk directly:
                </p>
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                  <tr>
                    <td align="center" style="background-color: #25D366; background-image: linear-gradient(#25D366, #25D366); border-radius: 6px; padding: 12px 28px; border: 1px solid #25D366;">
                      <a href="https://api.whatsapp.com/send?phone=923098828483" target="_blank" rel="noopener noreferrer" class="btn-white-text" style="color: #ffffff !important; -webkit-text-fill-color: #ffffff !important; text-decoration: none; font-weight: 700; font-size: 14px; display: inline-flex; align-items: center; letter-spacing: 0.3px;">
                        <img src="https://www.moizstudio.me/assets/images/icons/whatsapp.png" width="18" height="18" alt="WhatsApp" style="vertical-align: middle; margin-right: 8px; display: inline-block; border: 0;" />
                        <span class="btn-white-text" style="color: #ffffff !important; -webkit-text-fill-color: #ffffff !important; font-weight: 700; font-size: 14px; text-decoration: none;">Chat on WhatsApp</span>
                      </a>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Orange CTA Button: View My Work (Immune to Dark Mode Inversion) -->
              <div style="text-align: center; margin-bottom: 32px;">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                  <tr>
                    <td align="center" style="background-color: #FF5A1F; background-image: linear-gradient(#FF5A1F, #FF5A1F); border-radius: 6px; padding: 14px 36px; border: 1px solid #FF5A1F;">
                      <a href="https://www.moizstudio.me/#work" target="_blank" rel="noopener noreferrer" class="btn-white-text" style="color: #ffffff !important; -webkit-text-fill-color: #ffffff !important; font-weight: 800; text-decoration: none; text-transform: uppercase; font-size: 14px; letter-spacing: 0.5px; display: inline-block;">
                        <span class="btn-white-text" style="color: #ffffff !important; -webkit-text-fill-color: #ffffff !important; font-weight: 800; font-size: 14px; text-decoration: none;">VIEW MY WORK &rarr;</span>
                      </a>
                    </td>
                  </tr>
                </table>
              </div>

              <p style="margin: 0 0 20px 0; font-size: 15px; color: #27272a;">
                Looking forward to working with you.
              </p>

              <!-- Signature -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="border-top: 1px solid #e4e4e7; padding-top: 18px; width: 100%;">
                <tr>
                  <td>
                    <p style="margin: 0 0 4px 0; font-size: 15px; font-weight: 700; color: #09090b;">Abdul Moiz</p>
                    <p style="margin: 0 0 6px 0; font-size: 13px; color: #FF5A1F; font-weight: 600;">Wix Studio Expert &amp; Web Designer</p>
                    <p style="margin: 0; font-size: 12px; color: #71717a;">
                      <a href="https://www.moizstudio.me" style="color: #71717a; text-decoration: none;">moizstudio.me</a> &bull;
                      <a href="mailto:contactwithabdulmoiz@gmail.com" style="color: #71717a; text-decoration: none;">contactwithabdulmoiz@gmail.com</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #0d0d0d; padding: 20px 30px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #71717a;">
                &copy; 2026 Moiz Studio. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, text, html };
}

module.exports = {
  ownerEmail,
  visitorEmail
};
