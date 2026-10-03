# Moiz Studio Portfolio (moizstudio.me)

Official portfolio website for **Abdul Moiz** — Wix Studio Expert, Web Designer, and Front-End Developer.

---

## Features
- **Modern Responsive Design**: Custom HTML5, Vanilla CSS, and JavaScript.
- **Interactive Work Case Studies**:
  1. [Mike Nellis](https://www.mikenellis.com/) — Political Strategy Website
  2. [Inpro Analytics](https://www.inpro-analytics.at/) — Data & Analytics Platform
  3. [Denver Pet Sitting Company](https://www.denverpetsittingcompany.com/) — Pet Care & Services Platform
  4. [VanityXo](https://vanityxo.com/) — Wireless Dealer Platform
- **Testimonials Slider**: Authentic client reviews for all 4 featured projects on the main page and dedicated case study detail pages.
- **Dual Email Contact Form Automation**:
  - Immediate inquiry delivery to the site owner (`contactwithabdulmoiz@gmail.com`) with visitor `Reply-To`.
  - Instant branded auto-reply to the visitor with project recap and call-to-action buttons.
  - Vercel Serverless Function (`/api/contact`) + standalone Node.js server (`server/index.js`).
  - Strict security: honeypot spam protection, server-side validation, HTML escaping against XSS, header injection filtering, and in-memory IP rate limiting.

---

## Contact Form Setup

### 1. Generate a Gmail App Password
To allow the server to send emails reliably through Gmail SMTP without exposing your primary Google account password:
1. Go to your **Google Account**: [myaccount.google.com](https://myaccount.google.com/)
2. Navigate to **Security** in the left sidebar.
3. Under **"How you sign in to Google"**, verify that **2-Step Verification** is turned **ON**.
4. In the search bar at the top of your Google Account page, search for **"App passwords"** (or go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)).
5. Under **App name**, enter: `Moiz Studio Portfolio` (or any custom label).
6. Click **Create**.
7. Google will display a 16-character password (e.g. `abcd efgh ijkl mnop`).
8. Copy this 16-character code (without spaces) — this is your `SMTP_PASS`.

---

### 2. Environment Variables
Create a `.env` file in the root directory (based on `.env.example`):

```env
# Gmail SMTP Configuration
SMTP_USER=contactwithabdulmoiz@gmail.com
SMTP_PASS=your_16_character_app_password_without_spaces

# Email Routing
OWNER_EMAIL=contactwithabdulmoiz@gmail.com
FROM_NAME="Abdul Moiz | Moiz Studio"

# Security & CORS
ALLOWED_ORIGIN=https://moizstudio.me

# Server Port (for standalone Node server)
PORT=3000
```

> **IMPORTANT**: Never commit your `.env` file to Git. It is already added to `.gitignore`.

---

### 3. Local Development & Running Locally

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Run Automated Test Suite**:
   ```bash
   npm test
   ```
   *Runs 15 automated unit and integration tests covering XSS sanitization, header injection prevention, honeypot detection, IP rate limiting, template compilation, and mock API handling.*

3. **Start the Local Development Server**:
   ```bash
   npm start
   # or
   npm run dev
   ```
   The site will be available at `http://localhost:3000` with the live contact endpoint at `http://localhost:3000/api/contact`.

---

### 4. Deployment Instructions

#### Option A: Vercel (Recommended — Zero Server Maintenance)
The repository is fully pre-configured for Vercel:
- The serverless handler is located at `api/contact.js`.
- `vercel.json` ensures static files and client routes are served smoothly while keeping `/api/contact` intact.
1. Connect your repository to **Vercel** ([vercel.com](https://vercel.com/)).
2. In your Vercel Project Settings under **Environment Variables**, add:
   - `SMTP_USER`: `contactwithabdulmoiz@gmail.com`
   - `SMTP_PASS`: *(Your 16-character Gmail App Password)*
   - `OWNER_EMAIL`: `contactwithabdulmoiz@gmail.com`
   - `FROM_NAME`: `Abdul Moiz | Moiz Studio`
   - `ALLOWED_ORIGIN`: `https://moizstudio.me`
3. Click **Deploy**. Vercel will automatically route `POST /api/contact` to the serverless function.

#### Option B: Standalone Node.js Server (VPS / cPanel / Docker)
If hosting on a standard VPS (DigitalOcean, AWS EC2, Linode, Hostinger) or cPanel Node.js Selector:
1. Clone the repo to the server.
2. Run `npm install --production`.
3. Create `.env` on the server with the values above.
4. Run using PM2 or Node:
   ```bash
   pm2 start server/index.js --name "moiz-portfolio"
   ```
5. Configure Nginx or Apache reverse proxy to pass traffic to `http://127.0.0.1:3000`.

---

## Manual Test Checklist

Use this checklist to verify production readiness after adding your `SMTP_PASS`:

| # | Test Scenario | Steps to Perform | Expected Result |
|---|---------------|------------------|-----------------|
| 1 | **Valid Submission** | Fill in First Name, a valid Email, and a detailed message (>10 chars). Submit the form. | Submit button shows "Sending...", button is disabled, inline green success alert appears, form fields clear, owner receives notification, and visitor receives auto-reply. |
| 2 | **Invalid Email Format** | Enter `invalid-email@` and click Submit. | Client-side validation stops request immediately; red alert prompts for valid email without sending network request. |
| 3 | **Empty / Short Message** | Enter a message shorter than 10 characters (e.g. `Hello`). | Client-side validation blocks submission; warns that message must be at least 10 characters long. |
| 4 | **Honeypot Triggered** | Fill the hidden `#website` field (e.g., via inspect element or a bot). | Server returns HTTP 200 silent success; NO emails are sent, preventing spam delivery and saving SMTP quotas. |
| 5 | **Rate Limit Enforcement** | Submit 3 messages within 10 minutes from the same IP, then try a 4th submission. | 4th submission is rejected with HTTP 429: "Too many submissions. Please wait...". |
| 6 | **SMTP Failure Fallback** | Disconnect internet or set invalid `SMTP_PASS` in `.env`. Submit the form. | Server returns HTTP 500. UI displays friendly error message suggesting immediate contact via WhatsApp (+92 309 8828483) or direct email. |
| 7 | **Email Deliverability & Spam Check** | Check both Gmail inbox and visitor inbox. | Emails arrive promptly; check spam/junk folders. If auto-reply is in spam on first test, click "Not Spam" to train client filters. |
| 8 | **Direct Reply-To Verification** | In the owner notification email, click the "Reply" button. | The reply recipient automatically populates the visitor's email address (not `contactwithabdulmoiz@gmail.com`). |

---

## Security & Architecture Highlights
- **No Credentials in Frontend**: All credentials remain strictly on the backend via environment variables.
- **XSS & HTML Injection Protection**: All inputs are sanitized through `escapeHtml()` before rendering into HTML templates.
- **Email Header Injection Defense**: Carriage returns (`\r`), line breaks (`\n`), and null bytes (`\0`) are stripped from single-line headers like Name and Email.
- **Isolated Mailer**: Transporter logic is decoupled in `api/lib/mailer.js`, allowing single-line swaps to Resend, SendGrid, or Postmark if ever needed.
- **Fault-Tolerant Delivery**: If the owner email succeeds but the auto-reply fails, the API still returns success to the client while logging the internal warning, preventing visitor confusion.
