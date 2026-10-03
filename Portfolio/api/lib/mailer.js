/**
 * Isolated Mailer Module
 * Handles SMTP transport configuration and sending emails via Nodemailer.
 * Can be swapped for Resend / SendGrid without modifying application logic.
 */

const nodemailer = require('nodemailer');
const { ownerEmail, visitorEmail } = require('./emailTemplates');

/**
 * Create SMTP Transporter
 * By default uses Gmail SMTP with App Password.
 */
function createTransporter() {
  const user = (process.env.SMTP_USER || 'contactwithabdulmoiz@gmail.com').trim();
  // Strip any spaces from App Password (e.g. "abcd efgh ijkl mnop" -> "abcdefghijklmnop")
  const rawPass = process.env.SMTP_PASS || '';
  const pass = rawPass.replace(/\s+/g, '').trim();

  if (!pass) {
    console.warn('[Mailer Warning] SMTP_PASS is not set in environment variables. Email sending will fail unless configured.');
  }

  return nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user,
      pass
    }
  });
}

function getTransporter() {
  return createTransporter();
}

/**
 * Verify transporter connection
 */
async function verifyTransport() {
  const transporter = getTransporter();
  return transporter.verify();
}

/**
 * Send inquiry notification to site owner
 * @param {Object} params
 * @param {string} params.firstName
 * @param {string} params.email
 * @param {string} params.message
 * @param {string} params.submittedAt
 */
async function sendOwnerNotification({ firstName, email, message, submittedAt }) {
  const transporter = getTransporter();
  const ownerEmailAddress = process.env.OWNER_EMAIL || 'contactwithabdulmoiz@gmail.com';
  const fromName = process.env.FROM_NAME || 'Abdul Moiz | Moiz Studio';
  const fromEmail = process.env.SMTP_USER || 'contactwithabdulmoiz@gmail.com';

  const template = ownerEmail({ firstName, email, message, submittedAt });

  const messageId = `<inquiry.${Date.now()}.${Math.random().toString(36).substring(2, 9)}@moizstudio.me>`;

  return transporter.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to: ownerEmailAddress,
    replyTo: email,
    subject: template.subject,
    text: template.text,
    html: template.html,
    messageId,
    headers: {
      'X-Mailer': 'Moiz Studio Notification Engine',
      'X-Entity-Ref-ID': messageId
    }
  });
}

/**
 * Send auto-reply confirmation to the visitor
 * @param {Object} params
 * @param {string} params.firstName
 * @param {string} params.email
 * @param {string} params.message
 */
async function sendVisitorAutoReply({ firstName, email, message }) {
  const transporter = getTransporter();
  const fromName = process.env.FROM_NAME || 'Abdul Moiz | Moiz Studio';
  const fromEmail = process.env.SMTP_USER || 'contactwithabdulmoiz@gmail.com';
  const ownerEmailAddress = process.env.OWNER_EMAIL || 'contactwithabdulmoiz@gmail.com';

  const template = visitorEmail({ firstName, message });
  const messageId = `<autoreply.${Date.now()}.${Math.random().toString(36).substring(2, 9)}@moizstudio.me>`;

  return transporter.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to: email,
    replyTo: ownerEmailAddress,
    subject: template.subject,
    text: template.text,
    html: template.html,
    messageId,
    headers: {
      'X-Mailer': 'Moiz Studio Notification Engine',
      'Auto-Submitted': 'auto-replied',
      'X-Auto-Response-Suppress': 'All',
      'X-Entity-Ref-ID': messageId
    }
  });
}

module.exports = {
  createTransporter,
  getTransporter,
  verifyTransport,
  sendOwnerNotification,
  sendVisitorAutoReply
};
