/**
 * Moiz Studio Portfolio - Main Express Application & Admin CMS Server
 * Serves website, handles API endpoints, secure Admin Panel, media uploads,
 * automated backups, and live template synchronization.
 */

require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const cookieParser = require('cookie-parser');

const db = require('../data/db');
const auth = require('./auth');
const media = require('./media');
const renderer = require('./renderer');
const contactHandler = require('../api/contact');

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const STATIC_DIR = path.resolve(__dirname, '..');

// Trust reverse proxies (Vercel, Cloudflare, etc.) for HTTPS detection & client IP
app.set('trust proxy', 1);

// Middleware
app.use(cookieParser());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// URL normalization for Vercel Serverless Function rewrites & query params
app.use((req, res, next) => {
  if (req.url.startsWith('/api/server') || req.url.startsWith('/server')) {
    try {
      const parsed = new URL(req.url, 'http://localhost');
      const match = parsed.searchParams.get('match') || parsed.searchParams.get('slug');
      if (match) {
        req.url = '/api/admin/' + match;
      } else if (req.headers['x-matched-path']) {
        req.url = req.headers['x-matched-path'];
      }
    } catch (e) {}
  }
  next();
});

// Ensure database and static assets are initialized and rendered safely
try {
  const content = db.readContent();
  renderer.renderAll(content);
} catch (e) {
  console.warn('[Startup Sync Warning]', e.message);
}

// Disable x-powered-by header
app.disable('x-powered-by');

// Serve /uploads statically (both persistent uploads and /tmp/uploads)
app.use('/uploads', express.static(media.UPLOADS_DIR, {
  maxAge: '7d',
  immutable: true
}));
try {
  const tmpUploads = path.join('/tmp', 'uploads');
  if (fs.existsSync(tmpUploads)) {
    app.use('/uploads', express.static(tmpUploads, { maxAge: '7d' }));
  }
} catch (e) {}

// Serve /admin static assets
app.use('/admin', express.static(path.join(STATIC_DIR, 'admin')));

// ==============================================================
// PUBLIC API ENDPOINTS
// ==============================================================

// Public Content API
app.get(['/api/content', '/content'], (req, res) => {
  try {
    const content = db.readContent();
    const safeContent = JSON.parse(JSON.stringify(content));
    if (safeContent.admin) {
      delete safeContent.admin.passwordHash;
      delete safeContent.admin.failedAttempts;
      delete safeContent.admin.lockoutUntil;
    }
    res.json(safeContent);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve site content.' });
  }
});

// Contact Form Endpoint (wraps api/contact.js)
app.all(['/api/contact', '/api/contact/'], async (req, res) => {
  try {
    await contactHandler(req, res);
  } catch (err) {
    console.error('[Contact Error]', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal contact submission error.' });
    }
  }
});

// ==============================================================
// ADMIN AUTHENTICATION API
// ==============================================================

// Login
app.post(['/api/admin/login', '/admin/login'], async (req, res) => {
  const { username, password } = req.body || {};
  const clientIp = auth.getClientIdentifier(req);

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  const result = await auth.login(username, password, clientIp);
  if (!result.success) {
    return res.status(result.status || 401).json({ error: result.message });
  }

  // Set secure httpOnly cookie (supports reverse proxies & Vercel HTTPS)
  const isSecure = process.env.NODE_ENV === 'production' || process.env.COOKIE_SECURE === 'true' || req.secure || req.headers['x-forwarded-proto'] === 'https';
  res.cookie('admin_session', result.sessionId, {
    httpOnly: true,
    secure: isSecure,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  });

  res.json({
    success: true,
    csrfToken: result.csrfToken,
    username: result.username,
    isDefaultCredentials: result.isDefaultCredentials,
    expiresAt: result.expiresAt
  });
});

// Logout
app.post(['/api/admin/logout', '/admin/logout'], (req, res) => {
  const sessionId = req.cookies && req.cookies.admin_session;
  auth.logout(sessionId);
  res.clearCookie('admin_session');
  res.json({ success: true, message: 'Logged out successfully.' });
});

// Check Session Status & Get Current Admin Data
// Check Session Status & Get Current Admin Data
app.get(['/api/admin/me', '/admin/me'], auth.requireAdmin, (req, res) => {
  const content = db.readContent();
  res.json({
    authenticated: true,
    username: req.adminSession.username,
    csrfToken: req.adminSession.csrfToken,
    isDefaultCredentials: Boolean(content.admin.isDefaultCredentials),
    lastLogin: content.admin.lastLogin
  });
});

// Change Password / Username
app.post(['/api/admin/change-password', '/admin/change-password'], auth.requireAdmin, async (req, res) => {
  const { currentPassword, newUsername, newPassword, confirmPassword } = req.body || {};

  if (!currentPassword) {
    return res.status(400).json({ error: 'Current password is required.' });
  }
  if (newPassword && newPassword !== confirmPassword) {
    return res.status(400).json({ error: 'New password and confirmation do not match.' });
  }

  try {
    const updated = await auth.changeCredentials(currentPassword, newUsername, newPassword);
    res.clearCookie('admin_session');
    res.json({
      success: true,
      message: 'Credentials updated successfully. Please log in with your new credentials.',
      username: updated.username
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ==============================================================
// ADMIN CONTENT CRUD ENDPOINTS (Protected by auth.requireAdmin)
// ==============================================================

// Get Full Content for CMS
app.get(['/api/admin/content', '/admin/content'], auth.requireAdmin, (req, res) => {
  try {
    const content = db.readContent();
    const safeContent = JSON.parse(JSON.stringify(content));
    delete safeContent.admin.passwordHash;
    res.json(safeContent);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read content: ' + err.message });
  }
});

// Update Full Content / Any Section
app.put(['/api/admin/content', '/admin/content'], auth.requireAdmin, async (req, res) => {
  try {
    const current = db.readContent();
    const update = req.body;

    if (!update || typeof update !== 'object') {
      return res.status(400).json({ error: 'Invalid content payload.' });
    }

    // Preserve admin password hash & security fields
    if (update.admin) {
      update.admin.passwordHash = current.admin.passwordHash;
      update.admin.failedAttempts = current.admin.failedAttempts;
      update.admin.lockoutUntil = current.admin.lockoutUntil;
    } else {
      update.admin = current.admin;
    }

    // Preserve messages inbox if not provided
    if (!update.messages) {
      update.messages = current.messages || [];
    }

    await db.saveContent(update);
    try { renderer.renderAll(update); } catch (e) { console.warn('[Renderer Warning]', e.message); }

    res.json({ success: true, message: 'Content saved and site synchronized.' });
  } catch (err) {
    console.error('[Admin Save Error]', err);
    res.status(500).json({ error: 'Failed to save content: ' + err.message });
  }
});

// Project CRUD: Create
app.post(['/api/admin/projects', '/admin/projects'], auth.requireAdmin, async (req, res) => {
  try {
    const content = db.readContent();
    const project = req.body;

    if (!project.title || !project.title.trim()) {
      return res.status(400).json({ error: 'Project title is required.' });
    }

    // Auto-generate slug if missing
    let slug = (project.slug || project.title)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Ensure unique slug
    let baseSlug = slug;
    let count = 1;
    while (content.projects.some(p => p.slug === slug)) {
      slug = `${baseSlug}-${count++}`;
    }

    project.id = project.id || slug;
    project.slug = slug;
    project.status = project.status || 'published';
    project.order = content.projects.length + 1;

    content.projects.push(project);
    await db.saveContent(content);
    try { renderer.renderAll(content); } catch (e) { console.warn('[Renderer Warning]', e.message); }

    res.json({ success: true, project });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Project CRUD: Update
app.put(['/api/admin/projects/:slug', '/admin/projects/:slug'], auth.requireAdmin, async (req, res) => {
  try {
    const { slug } = req.params;
    const content = db.readContent();
    const idx = content.projects.findIndex(p => p.slug === slug);

    if (idx === -1) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    const updated = Object.assign({}, content.projects[idx], req.body);
    // If slug changed, delete old page
    if (updated.slug !== slug) {
      try { renderer.deleteCaseStudyPage(slug); } catch (e) {}
    }

    content.projects[idx] = updated;
    await db.saveContent(content);
    try { renderer.renderAll(content); } catch (e) { console.warn('[Renderer Warning]', e.message); }

    res.json({ success: true, project: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Project CRUD: Delete
app.delete(['/api/admin/projects/:slug', '/admin/projects/:slug'], auth.requireAdmin, async (req, res) => {
  try {
    const { slug } = req.params;
    const content = db.readContent();
    const idx = content.projects.findIndex(p => p.slug === slug);

    if (idx === -1) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    content.projects.splice(idx, 1);
    try { renderer.deleteCaseStudyPage(slug); } catch (e) {}
    await db.saveContent(content);
    try { renderer.renderAll(content); } catch (e) { console.warn('[Renderer Warning]', e.message); }

    res.json({ success: true, message: `Project ${slug} deleted successfully.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==============================================================
// MEDIA LIBRARY APIS
// ==============================================================

// Upload Single / Multiple Images
app.post(['/api/admin/media/upload', '/admin/media/upload'], auth.requireAdmin, media.uploadMiddleware.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded.' });
    }

    const results = [];
    const customSlot = req.body.slot || '';

    for (const file of req.files) {
      const item = await media.processAndSaveImage(file.buffer, file.originalname, file.mimetype, customSlot);
      results.push(item);
    }

    res.json({ success: true, media: results });
  } catch (err) {
    console.error('[Upload Error]', err);
    res.status(500).json({ error: err.message });
  }
});

// Replace Image In Place (keeps URL slot intact)
app.post(['/api/admin/media/replace', '/admin/media/replace'], auth.requireAdmin, media.uploadMiddleware.single('file'), async (req, res) => {
  try {
    const { targetUrl } = req.body;
    if (!targetUrl || !req.file) {
      return res.status(400).json({ error: 'Target URL and replacement file are required.' });
    }

    const result = await media.replaceExistingImage(targetUrl, req.file.buffer, req.file.mimetype);
    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Image From Media Library
app.delete(['/api/admin/media/:id', '/admin/media/:id'], auth.requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const content = db.readContent();
    const idx = content.media.findIndex(m => m.id === id);

    if (idx === -1) {
      return res.status(404).json({ error: 'Media item not found.' });
    }

    const item = content.media[idx];
    if (item.url && item.url.startsWith('/uploads/')) {
      const filePath = path.join(media.UPLOADS_DIR, path.basename(item.url));
      if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch (e) {}
      }
    }

    content.media.splice(idx, 1);
    await db.saveContent(content);
    res.json({ success: true, message: 'Media item removed.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==============================================================
// BACKUPS, SNAPSHOTS, EXPORT & IMPORT
// ==============================================================

// List Snapshots
app.get(['/api/admin/backups', '/admin/backups'], auth.requireAdmin, (req, res) => {
  try {
    const backups = db.listBackups();
    res.json({ backups });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Restore Snapshot
app.post(['/api/admin/backups/restore', '/admin/backups/restore'], auth.requireAdmin, async (req, res) => {
  try {
    const { filename } = req.body;
    if (!filename) {
      return res.status(400).json({ error: 'Snapshot filename is required.' });
    }

    const restored = await db.restoreBackup(filename);
    try { renderer.renderAll(restored); } catch (e) { console.warn('[Renderer Warning]', e.message); }

    res.json({ success: true, message: `Successfully restored backup from ${filename}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Export Content JSON
app.get(['/api/admin/export', '/admin/export'], auth.requireAdmin, (req, res) => {
  try {
    const content = db.readContent();
    const safe = JSON.parse(JSON.stringify(content));
    delete safe.admin.passwordHash;
    const dateStr = new Date().toISOString().split('T')[0];
    res.setHeader('Content-Disposition', `attachment; filename="moizstudio-content-backup-${dateStr}.json"`);
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(safe, null, 2));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Import Content JSON
app.post(['/api/admin/import', '/admin/import'], auth.requireAdmin, async (req, res) => {
  try {
    const importedData = req.body;
    if (!importedData || !importedData.settings || !importedData.projects) {
      return res.status(400).json({ error: 'Invalid content format.' });
    }

    const current = db.readContent();
    importedData.admin = current.admin; // Preserve current credentials

    await db.saveContent(importedData);
    try { renderer.renderAll(importedData); } catch (e) { console.warn('[Renderer Warning]', e.message); }

    res.json({ success: true, message: 'Content imported and site synchronized successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==============================================================
// INBOX MANAGEMENT
// ==============================================================

// List Messages
app.get(['/api/admin/inbox', '/admin/inbox'], auth.requireAdmin, (req, res) => {
  const content = db.readContent();
  res.json({ messages: content.messages || [] });
});

// Mark Read / Unread
app.patch(['/api/admin/inbox/:id', '/admin/inbox/:id'], auth.requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { read } = req.body;
    const content = db.readContent();
    const msg = (content.messages || []).find(m => m.id === id);

    if (!msg) {
      return res.status(404).json({ error: 'Message not found.' });
    }

    msg.read = Boolean(read);
    await db.saveContent(content);
    res.json({ success: true, message: msg });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Message
app.delete(['/api/admin/inbox/:id', '/admin/inbox/:id'], auth.requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const content = db.readContent();
    const idx = (content.messages || []).findIndex(m => m.id === id);

    if (idx === -1) {
      return res.status(404).json({ error: 'Message not found.' });
    }

    content.messages.splice(idx, 1);
    await db.saveContent(content);
    res.json({ success: true, message: 'Message deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Export Inbox as CSV
app.get(['/api/admin/inbox/export-csv', '/admin/inbox/export-csv'], auth.requireAdmin, (req, res) => {
  try {
    const content = db.readContent();
    const messages = content.messages || [];

    let csv = 'ID,Date,Name,Email,Message,Status\n';
    for (const m of messages) {
      const cleanMsg = (m.message || '').replace(/"/g, '""').replace(/\r?\n/g, ' ');
      const cleanName = (m.name || '').replace(/"/g, '""');
      const cleanEmail = (m.email || '').replace(/"/g, '""');
      csv += `"${m.id}","${m.submittedAt || ''}","${cleanName}","${cleanEmail}","${cleanMsg}","${m.read ? 'Read' : 'Unread'}"\n`;
    }

    res.setHeader('Content-Disposition', 'attachment; filename="inbox-messages.csv"');
    res.setHeader('Content-Type', 'text/csv');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==============================================================
// FRONTEND STATIC FILES & CLEAN URL ROUTING
// ==============================================================

// Direct Admin Route
app.get(['/admin', '/admin/'], (req, res) => {
  res.sendFile(path.join(STATIC_DIR, 'admin', 'index.html'));
});

// Helper to inject active theme CSS vars before </head>
function sendThemedHtml(filePath, res) {
  try {
    let html = fs.readFileSync(filePath, 'utf8');
    const content = db.readContent();
    const themeTag = renderer.getThemeCss(content.theme);

    if (html.includes('<style id="dynamic-theme-vars">')) {
      html = html.replace(/<style id="dynamic-theme-vars">[\s\S]*?<\/style>/, themeTag);
    } else {
      html = html.replace('</head>', `${themeTag}\n</head>`);
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (err) {
    res.sendFile(filePath);
  }
}

// Work Page Routing
app.get(['/work', '/work/'], (req, res) => {
  sendThemedHtml(path.join(STATIC_DIR, 'work.html'), res);
});

// Work Case Study Routing: /work/:slug
app.get('/work/:slug', (req, res, next) => {
  const { slug } = req.params;
  const projectFile = path.join(STATIC_DIR, 'work', `${slug}.html`);
  if (fs.existsSync(projectFile)) {
    return sendThemedHtml(projectFile, res);
  }
  next();
});

// Specific page rewrites matching vercel.json
app.get(['/about', '/services', '/process', '/testimonials', '/contact'], (req, res) => {
  sendThemedHtml(path.join(STATIC_DIR, 'index.html'), res);
});

// Static assets (CSS, JS, Images, etc.)
app.use(express.static(STATIC_DIR, {
  extensions: ['html', 'htm']
}));

// Fallback to index.html with active theme
app.use((req, res) => {
  sendThemedHtml(path.join(STATIC_DIR, 'index.html'), res);
});

// Start Server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(` Moiz Studio Full Stack Server running at: http://localhost:${PORT}`);
    console.log(` Admin Panel CMS:                         http://localhost:${PORT}/admin`);
    console.log(` Contact API Endpoint:                    http://localhost:${PORT}/api/contact`);
    console.log(` Default Admin Username:                  abdulmoiz`);
    console.log(` Default Admin Password:                  shmoiz8483`);
    console.log(`======================================================\n`);
  });
}

module.exports = app;
