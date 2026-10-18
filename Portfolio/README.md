# Moiz Studio Portfolio & Headless CMS (moizstudio.me)

Official portfolio website for **Abdul Moiz** — Wix Studio Expert, Web Designer, and Front-End Developer.
Powered by a lightweight, secure, and fully persistent **Admin CMS** that enables adding, editing, and deleting anything across the portfolio without touching code.

---

## 🚀 Key Features

- **Dynamic Admin Panel CMS (`/admin`)**:
  - Full CRUD for Projects / Case Studies with automatic case study page generation (`/work/{slug}`).
  - Full CRUD for Client Testimonials, Services, Process Steps, Platforms Strip, and Contact Info.
  - Media Library with multi-file upload, automatic WebP conversion, and in-place replacement.
  - Colors & Theme Editor: 4 built-in theme presets (Default, Dark, Warm Light, Mono Orange) with live hex and color-picker controls.
  - Inquiries Inbox: Store contact form submissions, mark read/unread, and export to CSV.
  - Automated rolling snapshot backups (keeps last 20 snapshots) with 1-click restore.
  - JSON Content Export & Import for rapid migration and offsite backups.
- **Strict Security Architecture**:
  - Salted bcrypt password hashing (12 rounds).
  - HttpOnly, SameSite, Secure cookie-based session management with automatic expiration.
  - Rate limiting & 15-minute temporary lockout after 5 consecutive failed login attempts.
  - CSRF protection on all state-changing requests (`x-csrf-token`).
  - Strict input sanitization and XSS prevention.
  - `/admin` and `/api/admin` disallowed in `robots.txt` and marked `noindex`.
- **100% SEO Preservation & Speed**:
  - All pages are server-rendered and pre-rendered into clean HTML on save.
  - Titles, meta descriptions, canonical URLs, and Schema.org JSON-LD structured data are present in the initial HTML for search engine crawlers.
  - Dynamic `sitemap.xml` automatically regenerated on every project add/edit/delete.
  - Zero layout shift, no flash of unstyled theme, and exact preservation of existing CSS tokens and AOS / Swiper / GSAP animations.

---

## 🔑 Default Admin Credentials

When running for the first time or in testing mode, the system is seeded with:
- **URL**: `http://localhost:3000/admin`
- **Username**: `abdulmoiz`
- **Password**: `shmoiz8483`

> ⚠️ **SECURITY REMINDER**: Change these credentials in the **Admin Account** section of the dashboard before deploying the site to a public domain.

### How to Change Password via Dashboard
1. Log in to `/admin`.
2. In the left sidebar, click **Admin Account**.
3. Enter your current password (`shmoiz8483`).
4. Enter your new username (or keep it) and your new strong password (minimum 8 characters).
5. Click **Update Credentials**. All existing sessions will be securely invalidated and you will be asked to log in with your new credentials.

### How to Reset Credentials if Locked Out (CLI)
If you ever forget your password, you can reset it locally at any time using:
```bash
npm run reset-admin
```
This reads `ADMIN_USERNAME` and `ADMIN_PASSWORD` from your `.env` file, regenerates the bcrypt salt hash, and updates `data/content.json`.

---

## 🛠️ Local Development & Running the Stack

### 1. Prerequisites
- **Node.js** v18+ (tested on Node v24)
- **NPM** v9+

### 2. Installation
```bash
# Clone or navigate to the repository
cd "D:\Moiz Profiles\Portfolio"

# Install dependencies
npm install
```

### 3. Environment Setup
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Ensure your `.env` contains:
```env
# Gmail SMTP Configuration for Contact Form
SMTP_USER=contactwithabdulmoiz@gmail.com
SMTP_PASS=your-16-character-gmail-app-password

# Email Destination & Branding
OWNER_EMAIL=contactwithabdulmoiz@gmail.com
FROM_NAME="Abdul Moiz | Moiz Studio"

# Server Port
PORT=3000

# Admin Panel & CMS Configuration
ADMIN_USERNAME=abdulmoiz
ADMIN_PASSWORD=shmoiz8483
SESSION_SECRET=local_dev_session_secret_portfolio_key_778899aabbcc
COOKIE_SECURE=false
```

### 4. Start the Server
```bash
npm start
# or for development:
npm run dev
```

Open your browser:
- **Live Portfolio**: `http://localhost:3000/`
- **Work Page**: `http://localhost:3000/work`
- **Admin CMS Dashboard**: `http://localhost:3000/admin`

---

## 📦 Packaging & Release Bundle

To build a clean production release ZIP file excluding `node_modules`, `.git`, and private `.env` files:
```bash
npm run package
```
This creates: `moiz-studio-portfolio-cms-release.zip` in the root folder.

---

## 🌐 Hosting & Deployment Options

### Option A: Node.js Host / VPS / Render / Railway / cPanel Node (Recommended for 24/7 Live CMS)
1. Upload the files (or clone the repo) to your server.
2. Run `npm install --production`.
3. Set your production environment variables (`COOKIE_SECURE=true`, `SESSION_SECRET=...`).
4. Start with PM2 or systemd:
   ```bash
   pm2 start server/index.js --name "moiz-portfolio"
   ```
5. All edits made in `/admin` persist directly to `data/content.json` and `/uploads` with automatic backup snapshots.

### Option B: Static / Serverless (Vercel + GitHub)
- The site maintains pre-rendered static HTML files (`index.html`, `work.html`, `work/:slug.html`, `sitemap.xml`) in the repository.
- You can manage content on your local machine using the CMS dashboard (`http://localhost:3000/admin`), verify everything on localhost, and then deploy to Vercel.

---

## 🛡️ Backup & Restore

### Automated Snapshots
Before every single write operation in the CMS, a snapshot is automatically generated in `data/backups/snapshot-{timestamp}.json`. The system maintains the latest 20 snapshots.
To restore:
1. Open **Backups & Safety** in the Admin sidebar.
2. Select any snapshot from the history list and click **Restore This Version**.

### Manual Export & Import
- In the **Backups & Safety** section, click **Export Content JSON** to download a complete backup file.
- To migrate or restore on another device, click **Import Content JSON** and select the file.

---

## 📝 License
© 2026 Abdul Moiz. All rights reserved.
