/**
 * Moiz Studio Admin CMS Controller (admin.js)
 * Full client-side dashboard state management, real-time forms,
 * media upload, theme preview, and CRUD interactions.
 */

let CMS_DATA = null;
let CSRF_TOKEN = '';
let currentEditingProjectSlug = null;
let currentEditingTestimonialId = null;
let currentEditingServiceId = null;
let currentProjectGallery = [];

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  initAuth();
  setupNavigation();
  setupForms();
});

// ==============================================================
// 1. AUTHENTICATION & SESSION HANDLING
// ==============================================================

async function initAuth() {
  try {
    const res = await fetch('/api/admin/me');
    if (res.ok) {
      const data = await res.json();
      CSRF_TOKEN = data.csrfToken;
      showAdminShell(data);
      loadContent();
    } else {
      showLoginScreen();
    }
  } catch (err) {
    showLoginScreen();
  }
}

function showLoginScreen() {
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('adminShell').style.display = 'none';
}

function showAdminShell(userData) {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('adminShell').style.display = 'flex';

  document.getElementById('sidebarUsername').textContent = userData.username || 'abdulmoiz';
  document.getElementById('sidebarAvatar').textContent = (userData.username || 'A').charAt(0).toUpperCase();

  // Show default credentials banner if applicable
  if (userData.isDefaultCredentials) {
    document.getElementById('defaultCredentialsBanner').style.display = 'flex';
  } else {
    document.getElementById('defaultCredentialsBanner').style.display = 'none';
  }
}

// Login Form Submit
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const usernameInput = document.getElementById('loginUsername');
  const passwordInput = document.getElementById('loginPassword');
  const alertEl = document.getElementById('loginAlert');
  const btn = document.getElementById('loginBtn');

  alertEl.style.display = 'none';
  btn.disabled = true;
  btn.innerHTML = '<span>Verifying...</span>';

  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: usernameInput.value.trim(),
        password: passwordInput.value
      })
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      alertEl.style.display = 'block';
      alertEl.style.background = '#fef2f2';
      alertEl.style.color = '#ef4444';
      alertEl.style.border = '1px solid #fca5a5';
      alertEl.textContent = data.error || 'Invalid credentials.';
      btn.disabled = false;
      btn.innerHTML = '<span>Log In to CMS</span> <i class="ph-bold ph-arrow-right"></i>';
      return;
    }

    CSRF_TOKEN = data.csrfToken;
    showAdminShell(data);
    loadContent();
    showToast('Logged in successfully', 'success');
  } catch (err) {
    alertEl.style.display = 'block';
    alertEl.style.background = '#fef2f2';
    alertEl.style.color = '#ef4444';
    alertEl.style.border = '1px solid #fca5a5';
    alertEl.textContent = 'Network or server error during login.';
    btn.disabled = false;
    btn.innerHTML = '<span>Log In to CMS</span> <i class="ph-bold ph-arrow-right"></i>';
  }
});

// Logout
document.getElementById('logoutBtn').addEventListener('click', async () => {
  try {
    await fetch('/api/admin/logout', { method: 'POST' });
  } catch (e) {}
  CMS_DATA = null;
  CSRF_TOKEN = '';
  showLoginScreen();
  showToast('Logged out', 'success');
});

// Banner Dismiss and Link
document.getElementById('bannerDismissBtn').addEventListener('click', () => {
  document.getElementById('defaultCredentialsBanner').style.display = 'none';
});
document.getElementById('bannerChangeLink').addEventListener('click', () => {
  navigateToSection('account-page');
});

// ==============================================================
// 2. DATA LOADING & SYNCHRONIZATION
// ==============================================================

async function loadContent() {
  setSaveStatus('saving', 'Loading content...');
  try {
    const res = await fetch('/api/admin/content');
    if (!res.ok) throw new Error('Failed to fetch CMS content');
    CMS_DATA = await res.json();

    populateAllSections();
    setSaveStatus('saved', 'All changes saved');
  } catch (err) {
    console.error('[CMS Load Error]', err);
    setSaveStatus('error', 'Error loading content');
    showToast('Failed to load content from server', 'error');
  }
}

async function saveFullContent(updatedData, successMessage = 'Changes saved successfully') {
  setSaveStatus('saving', 'Saving changes...');
  try {
    const res = await fetch('/api/admin/content', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-csrf-token': CSRF_TOKEN
      },
      body: JSON.stringify(updatedData)
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Save failed');
    }

    CMS_DATA = updatedData;
    populateAllSections();
    setSaveStatus('saved', 'All changes saved');
    showToast(successMessage, 'success');
  } catch (err) {
    console.error('[Save Error]', err);
    setSaveStatus('error', 'Failed to save');
    showToast(err.message, 'error');
  }
}

function setSaveStatus(status, text) {
  const el = document.getElementById('saveStatus');
  el.className = `save-status ${status}`;
  el.innerHTML = status === 'saved'
    ? `<i class="ph-bold ph-check-circle"></i><span>${text}</span>`
    : `<i class="ph-bold ph-spinner ph-spin"></i><span>${text}</span>`;
}

// ==============================================================
// 3. NAVIGATION & ROUTING
// ==============================================================

function setupNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const targetSection = item.getAttribute('data-section');
      if (targetSection) {
        navigateToSection(targetSection);
      }
    });
  });

  // Mobile menu button
  const mobileBtn = document.getElementById('mobileMenuBtn');
  const sidebar = document.getElementById('adminSidebar');
  mobileBtn.addEventListener('click', () => {
    sidebar.classList.toggle('open');
  });

  // Close mobile sidebar on outside click
  document.addEventListener('click', (e) => {
    if (window.innerWidth <= 991 && sidebar.classList.contains('open')) {
      if (!sidebar.contains(e.target) && !mobileBtn.contains(e.target)) {
        sidebar.classList.remove('open');
      }
    }
  });
}

function navigateToSection(sectionId) {
  document.querySelectorAll('.admin-section').forEach(sec => sec.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));

  const targetSec = document.getElementById(`sec-${sectionId}`);
  const targetNav = document.querySelector(`.nav-item[data-section="${sectionId}"]`);

  if (targetSec) targetSec.classList.add('active');
  if (targetNav) targetNav.classList.add('active');

  // Update Topbar Title
  const titles = {
    'dashboard': 'Dashboard Overview',
    'home-page': 'Home Page Editor',
    'work-page': 'Work Page Editor',
    'projects': 'Projects & Case Studies',
    'industries': 'Industries & Filters',
    'testimonials': 'Client Testimonials',
    'services': 'Services Offered',
    'about-page': 'About Page Editor',
    'process-page': 'Process Steps',
    'platforms-page': 'Platforms & Expertise',
    'contact-page': 'Contact Info & Socials',
    'inbox-page': 'Inquiries Inbox',
    'media-page': 'Media Library',
    'themes-page': 'Colors & Themes',
    'settings-page': 'Website Settings',
    'account-page': 'Admin Account & Security',
    'backups-page': 'Backups & Snapshots'
  };
  document.getElementById('topbarTitle').textContent = titles[sectionId] || 'CMS Dashboard';

  // Close mobile sidebar
  document.getElementById('adminSidebar').classList.remove('open');
}

// ==============================================================
// 4. POPULATE ALL SECTIONS
// ==============================================================

function populateAllSections() {
  if (!CMS_DATA) return;

  populateDashboardMetrics();
  populateHomePage();
  populateWorkPage();
  populateProjectsTable();
  populateIndustries();
  populateTestimonials();
  populateServices();
  populateProcessSteps();
  populatePlatforms();
  populateContactInfo();
  populateInbox();
  populateMediaLibrary();
  populateThemes();
  populateSettings();
  populateBackups();
}

// 4.1 Dashboard Overview
function populateDashboardMetrics() {
  const publishedProjects = (CMS_DATA.projects || []).filter(p => p.status === 'published').length;
  const totalTestimonials = (CMS_DATA.testimonials || []).length;
  const totalServices = (CMS_DATA.services || []).length;
  const unreadMessages = (CMS_DATA.messages || []).filter(m => !m.read).length;

  document.getElementById('dashTotalProjects').textContent = publishedProjects;
  document.getElementById('dashTotalTestimonials').textContent = totalTestimonials;
  document.getElementById('dashTotalServices').textContent = totalServices;
  document.getElementById('dashUnreadMessages').textContent = unreadMessages;

  document.getElementById('navProjectCount').textContent = CMS_DATA.projects.length;

  const inboxNav = document.getElementById('navInboxCount');
  if (unreadMessages > 0) {
    inboxNav.style.display = 'inline-block';
    inboxNav.textContent = unreadMessages;
  } else {
    inboxNav.style.display = 'none';
  }

  // Recent Inquiries Table
  const tableContainer = document.getElementById('dashRecentInquiriesTable');
  const messages = (CMS_DATA.messages || []).slice(0, 5);

  if (messages.length === 0) {
    tableContainer.innerHTML = '<p style="color: #94a3b8; font-size: 14px;">No inquiries received yet.</p>';
  } else {
    let html = `
      <table class="admin-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Name</th>
            <th>Email</th>
            <th>Message</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
    `;
    for (const m of messages) {
      const dateStr = m.submittedAt ? new Date(m.submittedAt).toLocaleDateString() : 'Recent';
      html += `
        <tr>
          <td><span style="font-size: 12px; color: #64748b;">${dateStr}</span></td>
          <td><strong>${escapeHtml(m.name)}</strong></td>
          <td><a href="mailto:${escapeHtml(m.email)}" style="color: #FF5A1F;">${escapeHtml(m.email)}</a></td>
          <td><span style="font-size: 13px; color: #475569;">${escapeHtml((m.message || '').substring(0, 60))}...</span></td>
          <td>${m.read ? '<span class="badge badge-draft">Read</span>' : '<span class="badge badge-published">New</span>'}</td>
        </tr>
      `;
    }
    html += '</tbody></table>';
    tableContainer.innerHTML = html;
  }
}

// 4.2 Home Page
function populateHomePage() {
  const home = CMS_DATA.home;
  if (!home) return;

  // Hero
  document.getElementById('homeHeroBadgeTitle').value = home.hero.badgeTitle || '';
  document.getElementById('homeHeroHeading').value = home.hero.heading || '';
  document.getElementById('homeHeroDescription').value = home.hero.description || '';
  document.getElementById('homeHeroBtn1Text').value = home.hero.btn1Text || '';
  document.getElementById('homeHeroBtn1Link').value = home.hero.btn1Link || '';
  document.getElementById('homeHeroBtn2Text').value = home.hero.btn2Text || '';
  document.getElementById('homeHeroBtn2Link').value = home.hero.btn2Link || '';

  // Stats Repeater
  const statsContainer = document.getElementById('homeStatsRepeater');
  let statsHtml = '';
  (home.stats || []).forEach((stat, idx) => {
    statsHtml += `
      <div class="repeater-item">
        <div class="form-row">
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label">Number / Text Value</label>
            <input type="text" class="form-control" id="statVal_${idx}" value="${escapeHtml(stat.count)}" />
          </div>
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label">Suffix (e.g. +)</label>
            <input type="text" class="form-control" id="statSuffix_${idx}" value="${escapeHtml(stat.suffix || '')}" />
          </div>
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label">Label</label>
            <input type="text" class="form-control" id="statLabel_${idx}" value="${escapeHtml(stat.label)}" />
          </div>
          <div class="form-group" style="margin-bottom: 0; display: flex; align-items: center; gap: 8px; margin-top: 28px;">
            <input type="checkbox" id="statDark_${idx}" ${stat.isDark ? 'checked' : ''} style="width: 18px; height: 18px;" />
            <label for="statDark_${idx}" style="font-size: 13px; cursor: pointer;">Dark Card Style</label>
          </div>
        </div>
      </div>
    `;
  });
  statsContainer.innerHTML = statsHtml;

  // About Teaser
  document.getElementById('homeAboutHeading').value = home.aboutTeaser.heading || '';
  document.getElementById('homeAboutBadgeYears').value = home.aboutTeaser.circleBadgeYears || '';
  document.getElementById('homeAboutBadgeText').value = home.aboutTeaser.circleBadgeText || '';

  const p = home.aboutTeaser.paragraphs || [];
  document.getElementById('homeAboutP1').value = p[0] || '';
  document.getElementById('homeAboutP2').value = p[1] || '';
  document.getElementById('homeAboutP3').value = p[2] || '';
  document.getElementById('homeAboutP4').value = p[3] || '';

  // CTA Section
  document.getElementById('homeCtaTagline').value = home.ctaSection.tagline || '';
  document.getElementById('homeCtaHeading').value = home.ctaSection.heading || '';
  document.getElementById('homeCtaDesc').value = home.ctaSection.description || '';
}

// 4.3 Work Page
function populateWorkPage() {
  const wp = CMS_DATA.workPage;
  if (!wp) return;

  document.getElementById('workBreadcrumb').value = wp.breadcrumb || '';
  document.getElementById('workTitle').value = wp.title || '';
  document.getElementById('workTitleAccent').value = wp.titleAccent || '';
  document.getElementById('workIntro').value = wp.intro || '';
  document.getElementById('workStatsPillCount').value = wp.statsPillCount || '';
  document.getElementById('workStatsPillLabel').value = wp.statsPillLabel || '';
  document.getElementById('workTrustedIntro').value = wp.trustedIntro || '';

  // Trusted Partners
  const container = document.getElementById('trustedPartnersRepeater');
  let html = '';
  (wp.trustedPartners || []).forEach((partner, idx) => {
    html += `
      <div class="repeater-item">
        <button type="button" class="repeater-remove-btn" onclick="removeTrustedPartner(${idx})" title="Remove"><i class="ph-bold ph-trash"></i></button>
        <div class="form-row">
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label">Client / Partner Name</label>
            <input type="text" class="form-control" id="tpName_${idx}" value="${escapeHtml(partner.name)}" />
          </div>
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label">Logo Image URL</label>
            <input type="text" class="form-control" id="tpSrc_${idx}" value="${escapeHtml(partner.src)}" />
          </div>
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label">Alt Text</label>
            <input type="text" class="form-control" id="tpAlt_${idx}" value="${escapeHtml(partner.alt)}" />
          </div>
        </div>
      </div>
    `;
  });
  container.innerHTML = html;
}

function addTrustedPartnerRow() {
  if (!CMS_DATA.workPage.trustedPartners) CMS_DATA.workPage.trustedPartners = [];
  CMS_DATA.workPage.trustedPartners.push({
    id: 'partner-' + Date.now(),
    name: 'New Client Partner',
    src: '/assets/images/industries/placeholder-1.svg',
    alt: 'Client Logo'
  });
  populateWorkPage();
}

function removeTrustedPartner(idx) {
  CMS_DATA.workPage.trustedPartners.splice(idx, 1);
  populateWorkPage();
}

// 4.4 Projects Table
function populateProjectsTable() {
  const tbody = document.getElementById('projectsTableBody');
  const projects = CMS_DATA.projects || [];

  if (projects.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #94a3b8; padding: 24px;">No projects created yet.</td></tr>';
    return;
  }

  let html = '';
  projects.forEach((p, idx) => {
    html += `
      <tr>
        <td>
          <img src="${p.image || '/assets/images/thumbs/about-three-thumb.jpg'}" alt="${escapeHtml(p.title)}" class="thumb-preview" />
        </td>
        <td>
          <strong>${escapeHtml(p.title)}</strong>
          <div style="font-size: 12px; color: #94a3b8;">/work/${escapeHtml(p.slug)}</div>
        </td>
        <td>
          <span class="badge" style="background: #f1f5f9; color: #475569;">${escapeHtml(p.industry || 'General')}</span>
        </td>
        <td>
          <input type="checkbox" ${p.featured ? 'checked' : ''} onchange="toggleProjectFeatured('${p.slug}', this.checked)" title="Show in slideshow and featured work" />
        </td>
        <td>
          <span class="badge ${p.status === 'published' ? 'badge-published' : 'badge-draft'}">
            ${p.status === 'published' ? 'Published' : 'Draft'}
          </span>
        </td>
        <td style="text-align: right;">
          <div style="display: inline-flex; gap: 6px;">
            <a href="/work/${p.slug}" target="_blank" class="btn btn-secondary btn-sm" title="Preview Case Study"><i class="ph-bold ph-eye"></i></a>
            <button class="btn btn-secondary btn-sm" onclick="editProject('${p.slug}')" title="Edit"><i class="ph-bold ph-pencil-simple"></i></button>
            <button class="btn btn-secondary btn-sm" onclick="duplicateProject('${p.slug}')" title="Duplicate"><i class="ph-bold ph-copy"></i></button>
            <button class="btn btn-secondary btn-sm" style="color: #ef4444;" onclick="deleteProjectPrompt('${p.slug}')" title="Delete"><i class="ph-bold ph-trash"></i></button>
          </div>
        </td>
      </tr>
    `;
  });
  tbody.innerHTML = html;
}

// 4.5 Industries List
function populateIndustries() {
  const container = document.getElementById('industriesListContainer');
  const industries = CMS_DATA.industries || [];

  let html = '<div style="display: flex; flex-direction: column; gap: 8px;">';
  industries.forEach((ind, idx) => {
    const projectCount = (CMS_DATA.projects || []).filter(p => p.industrySlug === ind.slug && p.status === 'published').length;
    html += `
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px;">
        <div>
          <strong style="font-size: 15px;">${escapeHtml(ind.name)}</strong>
          <span style="font-size: 12px; color: #94a3b8; margin-left: 8px;">Slug: <code>${escapeHtml(ind.slug)}</code></span>
          <span class="badge badge-published" style="margin-left: 12px;">${projectCount} Published Projects</span>
        </div>
        <div style="display: flex; gap: 6px;">
          <button class="btn btn-secondary btn-sm" onclick="renameIndustry('${ind.id}')"><i class="ph-bold ph-pencil-simple"></i> Rename</button>
          <button class="btn btn-secondary btn-sm" style="color: #ef4444;" onclick="deleteIndustry('${ind.id}')"><i class="ph-bold ph-trash"></i> Delete</button>
        </div>
      </div>
    `;
  });
  html += '</div>';
  container.innerHTML = html;
}

// 4.6 Testimonials
function populateTestimonials() {
  const container = document.getElementById('testimonialsListContainer');
  const testimonials = CMS_DATA.testimonials || [];

  if (testimonials.length === 0) {
    container.innerHTML = '<p style="color: #94a3b8;">No testimonials added yet.</p>';
    return;
  }

  let html = '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 16px;">';
  testimonials.forEach(t => {
    html += `
      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; display: flex; flex-direction: column; justify-content: space-between;">
        <div>
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
            <strong style="font-size: 16px;">${escapeHtml(t.author)}</strong>
            <span class="badge ${t.visible ? 'badge-published' : 'badge-draft'}">${t.visible ? 'Visible' : 'Hidden'}</span>
          </div>
          <div style="font-size: 13px; color: #64748b; margin-bottom: 12px;">${escapeHtml(t.role)}</div>
          <p style="font-size: 14px; color: #334155; font-style: italic;">"${escapeHtml(t.quote)}"</p>
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px; padding-top: 12px; border-top: 1px solid #f1f5f9;">
          <button class="btn btn-secondary btn-sm" onclick="editTestimonial('${t.id}')"><i class="ph-bold ph-pencil-simple"></i> Edit</button>
          <button class="btn btn-secondary btn-sm" style="color: #ef4444;" onclick="deleteTestimonial('${t.id}')"><i class="ph-bold ph-trash"></i> Delete</button>
        </div>
      </div>
    `;
  });
  html += '</div>';
  container.innerHTML = html;
}

// 4.7 Services
function populateServices() {
  const container = document.getElementById('servicesListContainer');
  const services = CMS_DATA.services || [];

  let html = '<div style="display: flex; flex-direction: column; gap: 12px;">';
  services.forEach(s => {
    html += `
      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; display: flex; align-items: center; justify-content: space-between;">
        <div style="display: flex; align-items: center; gap: 16px;">
          <span style="font-size: 18px; font-weight: 700; color: #FF5A1F; font-family: var(--admin-font-heading);">${escapeHtml(s.number || '01')}</span>
          <div>
            <strong style="font-size: 16px;">${escapeHtml(s.title)}</strong>
            <p style="font-size: 13px; color: #64748b; margin-top: 2px;">${escapeHtml(s.description || '')}</p>
            <div style="display: flex; gap: 6px; margin-top: 6px; flex-wrap: wrap;">
              ${(s.bullets || []).map(b => `<span class="badge" style="background: #f1f5f9; color: #475569;">${escapeHtml(b)}</span>`).join('')}
            </div>
          </div>
        </div>
        <div style="display: flex; gap: 8px;">
          <button class="btn btn-secondary btn-sm" onclick="editService('${s.id}')"><i class="ph-bold ph-pencil-simple"></i> Edit</button>
          <button class="btn btn-secondary btn-sm" style="color: #ef4444;" onclick="deleteService('${s.id}')"><i class="ph-bold ph-trash"></i> Delete</button>
        </div>
      </div>
    `;
  });
  html += '</div>';
  container.innerHTML = html;
}

// 4.8 Process Steps
function populateProcessSteps() {
  const container = document.getElementById('processStepsListContainer');
  const steps = CMS_DATA.processSteps || [];

  let html = '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px;">';
  steps.forEach((step, idx) => {
    html += `
      <div class="repeater-item" style="margin-bottom: 0;">
        <div style="font-family: var(--admin-font-heading); font-size: 18px; font-weight: 700; color: #FF5A1F; margin-bottom: 8px;">Step ${escapeHtml(step.num || '0' + (idx + 1))}</div>
        <div class="form-group">
          <label class="form-label">Step Title</label>
          <input type="text" class="form-control" id="stepTitle_${idx}" value="${escapeHtml(step.title)}" />
        </div>
        <div class="form-group" style="margin-bottom: 0;">
          <label class="form-label">Description</label>
          <textarea class="form-control" id="stepDesc_${idx}" rows="2">${escapeHtml(step.desc)}</textarea>
        </div>
      </div>
    `;
  });
  html += '</div>';
  container.innerHTML = html;
}

function saveProcessSteps() {
  const steps = CMS_DATA.processSteps || [];
  steps.forEach((step, idx) => {
    step.title = document.getElementById(`stepTitle_${idx}`).value.trim();
    step.desc = document.getElementById(`stepDesc_${idx}`).value.trim();
  });
  saveFullContent(CMS_DATA, 'Process steps saved successfully');
}

// 4.9 Platforms & Expertise
function populatePlatforms() {
  const container = document.getElementById('platformsListContainer');
  const platforms = CMS_DATA.platforms || [];

  let html = '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px;">';
  platforms.forEach((p, idx) => {
    html += `
      <div class="repeater-item" style="margin-bottom: 0; text-align: center;">
        <div style="height: 60px; display: flex; align-items: center; justify-content: center; margin-bottom: 12px;">
          <img src="${p.src}" alt="${escapeHtml(p.alt)}" style="max-height: 48px; max-width: 120px;" />
        </div>
        <div class="form-group">
          <label class="form-label">Platform Name</label>
          <input type="text" class="form-control" id="platName_${idx}" value="${escapeHtml(p.name)}" />
        </div>
        <div class="form-group" style="margin-bottom: 0;">
          <label class="form-label">Logo Path</label>
          <input type="text" class="form-control" id="platSrc_${idx}" value="${escapeHtml(p.src)}" />
        </div>
      </div>
    `;
  });
  html += '</div>';
  container.innerHTML = html;
}

function savePlatforms() {
  const platforms = CMS_DATA.platforms || [];
  platforms.forEach((p, idx) => {
    p.name = document.getElementById(`platName_${idx}`).value.trim();
    p.src = document.getElementById(`platSrc_${idx}`).value.trim();
    p.alt = p.name + ' Logo';
  });
  saveFullContent(CMS_DATA, 'Platform logos updated successfully');
}

// 4.10 Contact & Social Links
function populateContactInfo() {
  const ci = CMS_DATA.contactInfo;
  if (!ci) return;

  document.getElementById('contactEmail').value = ci.email || '';
  document.getElementById('contactPhone').value = ci.phone || '';
  document.getElementById('contactWhatsAppNumber').value = ci.whatsappNumber || '';
  document.getElementById('contactWhatsAppMsg').value = ci.whatsappDefaultMessage || '';
  document.getElementById('contactLocation').value = ci.location || '';

  // Social Links Repeater
  const container = document.getElementById('socialLinksRepeater');
  let html = '';
  (ci.socialLinks || []).forEach((soc, idx) => {
    html += `
      <div class="repeater-item">
        <button type="button" class="repeater-remove-btn" onclick="removeSocialLink(${idx})" title="Remove"><i class="ph-bold ph-trash"></i></button>
        <div class="form-row">
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label">Platform Name</label>
            <input type="text" class="form-control" id="socName_${idx}" value="${escapeHtml(soc.name)}" />
          </div>
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label">Profile URL</label>
            <input type="url" class="form-control" id="socUrl_${idx}" value="${escapeHtml(soc.url)}" />
          </div>
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label">Icon Class (Phosphor)</label>
            <input type="text" class="form-control" id="socIcon_${idx}" value="${escapeHtml(soc.icon || '')}" />
          </div>
          <div class="form-group" style="margin-bottom: 0; display: flex; align-items: center; gap: 8px; margin-top: 28px;">
            <input type="checkbox" id="socVisible_${idx}" ${soc.visible !== false ? 'checked' : ''} style="width: 18px; height: 18px;" />
            <label for="socVisible_${idx}" style="font-size: 13px; cursor: pointer;">Visible</label>
          </div>
        </div>
      </div>
    `;
  });
  container.innerHTML = html;
}

function addSocialLinkRow() {
  if (!CMS_DATA.contactInfo.socialLinks) CMS_DATA.contactInfo.socialLinks = [];
  CMS_DATA.contactInfo.socialLinks.push({
    id: 'soc-' + Date.now(),
    name: 'Instagram',
    url: 'https://instagram.com/',
    icon: 'ph ph-instagram-logo',
    visible: true
  });
  populateContactInfo();
}

function removeSocialLink(idx) {
  CMS_DATA.contactInfo.socialLinks.splice(idx, 1);
  populateContactInfo();
}

// 4.11 Inbox Table
function populateInbox() {
  const container = document.getElementById('inboxTableContainer');
  const messages = CMS_DATA.messages || [];

  if (messages.length === 0) {
    container.innerHTML = '<p style="color: #94a3b8; padding: 20px 0;">No inquiries received yet.</p>';
    return;
  }

  let html = `
    <table class="admin-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Name</th>
          <th>Contact Email</th>
          <th>Inquiry Message</th>
          <th>Status</th>
          <th style="text-align: right;">Action</th>
        </tr>
      </thead>
      <tbody>
  `;
  messages.forEach(m => {
    const dateStr = m.submittedAt ? new Date(m.submittedAt).toLocaleString() : 'Recent';
    html += `
      <tr>
        <td style="font-size: 12px; color: #64748b; white-space: nowrap;">${dateStr}</td>
        <td><strong>${escapeHtml(m.name)}</strong></td>
        <td><a href="mailto:${escapeHtml(m.email)}" style="color: #FF5A1F;">${escapeHtml(m.email)}</a></td>
        <td><div style="max-width: 380px; font-size: 13px; line-height: 1.4;">${escapeHtml(m.message)}</div></td>
        <td>
          <button class="btn btn-secondary btn-sm" onclick="toggleMessageRead('${m.id}', ${!m.read})">
            ${m.read ? '<span style="color: #64748b;">Mark Unread</span>' : '<span style="color: #10b981; font-weight: 700;">Mark Read</span>'}
          </button>
        </td>
        <td style="text-align: right;">
          <button class="btn btn-secondary btn-sm" style="color: #ef4444;" onclick="deleteMessage('${m.id}')" title="Delete"><i class="ph-bold ph-trash"></i></button>
        </td>
      </tr>
    `;
  });
  html += '</tbody></table>';
  container.innerHTML = html;
}

async function toggleMessageRead(id, newReadStatus) {
  try {
    const res = await fetch(`/api/admin/inbox/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-csrf-token': CSRF_TOKEN
      },
      body: JSON.stringify({ read: newReadStatus })
    });
    if (res.ok) {
      loadContent();
    }
  } catch (e) {}
}

async function deleteMessage(id) {
  if (!confirm('Are you sure you want to delete this inquiry?')) return;
  try {
    const res = await fetch(`/api/admin/inbox/${id}`, {
      method: 'DELETE',
      headers: { 'x-csrf-token': CSRF_TOKEN }
    });
    if (res.ok) {
      loadContent();
      showToast('Message deleted', 'success');
    }
  } catch (e) {}
}

function exportInboxCsv() {
  window.open('/api/admin/inbox/export-csv', '_blank');
}

// 4.12 Media Library
function populateMediaLibrary() {
  const grid = document.getElementById('mediaLibraryGrid');
  const mediaList = CMS_DATA.media || [];
  const search = (document.getElementById('mediaSearchInput').value || '').toLowerCase().trim();

  const filtered = mediaList.filter(item => {
    return (item.title || '').toLowerCase().includes(search) || (item.slot || '').toLowerCase().includes(search);
  });

  if (filtered.length === 0) {
    grid.innerHTML = '<p style="color: #94a3b8; grid-column: 1 / -1; padding: 24px 0;">No media files match your query.</p>';
    return;
  }

  let html = '';
  filtered.forEach(m => {
    html += `
      <div class="media-item-card">
        <div class="media-thumbnail-wrap">
          <img src="${m.url}" alt="${escapeHtml(m.alt || m.title)}" class="media-thumbnail-img" loading="lazy" />
        </div>
        <div class="media-card-body">
          <div class="media-title" title="${escapeHtml(m.title)}">${escapeHtml(m.title)}</div>
          <div class="media-meta">${escapeHtml(m.slot || 'Media')}</div>
          <div class="media-actions">
            <button class="btn btn-secondary btn-sm" onclick="copyToClipboard('${m.url}')" title="Copy URL"><i class="ph-bold ph-link"></i></button>
            <button class="btn btn-secondary btn-sm" onclick="triggerReplaceImage('${m.url}')" title="Replace file in-place"><i class="ph-bold ph-arrows-clockwise"></i></button>
            <button class="btn btn-secondary btn-sm" style="color: #ef4444;" onclick="deleteMediaItem('${m.id}')" title="Delete"><i class="ph-bold ph-trash"></i></button>
          </div>
        </div>
      </div>
    `;
  });
  grid.innerHTML = html;
}

document.getElementById('mediaSearchInput').addEventListener('input', populateMediaLibrary);

// 4.13 Colors & Themes
function populateThemes() {
  const theme = CMS_DATA.theme || { activeTheme: 'default', tokens: {} };
  const active = theme.activeTheme || 'default';

  document.querySelectorAll('.theme-preset-card').forEach(c => c.classList.remove('active'));
  const activeCard = document.getElementById(`themeCard-${active}`);
  if (activeCard) activeCard.classList.add('active');

  // Token inputs
  const tokens = theme.tokens || {};
  setPickerAndHex('tokenBrandOrange', 'tokenBrandOrangeHex', tokens.brandOrange || '#FF5A1F');
  setPickerAndHex('tokenBrandLime', 'tokenBrandLimeHex', tokens.brandLime || '#ccff00');
  setPickerAndHex('tokenBgLight', 'tokenBgLightHex', tokens.bgLight || '#ffffff');
  setPickerAndHex('tokenBgDark', 'tokenBgDarkHex', tokens.bgDark || '#09090b');
  setPickerAndHex('tokenCardBgLight', 'tokenCardBgLightHex', tokens.cardBgLight || '#f5f5f5');
}

function setPickerAndHex(pickerId, hexId, value) {
  const p = document.getElementById(pickerId);
  const h = document.getElementById(hexId);
  if (p && h) {
    p.value = value;
    h.value = value.toUpperCase();
  }
}

function syncColorInput(picker, hexId) {
  document.getElementById(hexId).value = picker.value.toUpperCase();
}

function syncHexInput(hexInput, pickerId) {
  let val = hexInput.value.trim();
  if (!val.startsWith('#')) val = '#' + val;
  if (/^#[0-9A-F]{6}$/i.test(val)) {
    document.getElementById(pickerId).value = val;
  }
}

function selectThemePreset(presetKey) {
  CMS_DATA.theme.activeTheme = presetKey;
  populateThemes();
  showToast(`Switched to "${presetKey}" theme preset. Click "Apply & Save" to make it permanent.`, 'success');
}

function resetThemeDefaults() {
  CMS_DATA.theme = {
    activeTheme: 'default',
    tokens: {
      brandOrange: '#FF5A1F',
      brandLime: '#ccff00',
      bgDark: '#09090b',
      bgLight: '#ffffff',
      cardBgLight: '#f5f5f5'
    }
  };
  populateThemes();
  showToast('Reset theme tokens to default values', 'success');
}

function saveThemeTokens() {
  CMS_DATA.theme.tokens = {
    brandOrange: document.getElementById('tokenBrandOrange').value,
    brandLime: document.getElementById('tokenBrandLime').value,
    bgLight: document.getElementById('tokenBgLight').value,
    bgDark: document.getElementById('tokenBgDark').value,
    cardBgLight: document.getElementById('tokenCardBgLight').value
  };
  saveFullContent(CMS_DATA, 'Theme & colors updated successfully. Changes applied to website.');
}

// 4.14 Settings
function populateSettings() {
  const s = CMS_DATA.settings;
  if (!s) return;

  document.getElementById('settingsSiteTitle').value = s.siteTitle || '';
  document.getElementById('settingsTagline').value = s.tagline || '';
  document.getElementById('settingsCanonicalDomain').value = s.canonicalDomain || '';
  document.getElementById('settingsMetaDesc').value = s.defaultMetaDescription || '';
  document.getElementById('settingsKeywords').value = s.defaultKeywords || '';
  document.getElementById('settingsCopyrightYear').value = s.copyrightYear || '';
  document.getElementById('settingsNotificationEmail').value = s.notificationEmail || '';
}

// 4.15 Backups
async function populateBackups() {
  const container = document.getElementById('backupsListContainer');
  try {
    const res = await fetch('/api/admin/backups');
    const data = await res.json();
    const backups = data.backups || [];

    if (backups.length === 0) {
      container.innerHTML = '<p style="color: #94a3b8; padding: 20px 0;">No backup snapshots recorded yet.</p>';
      return;
    }

    let html = `
      <table class="admin-table">
        <thead>
          <tr>
            <th>Snapshot Date &amp; Time</th>
            <th>File Name</th>
            <th>Size</th>
            <th style="text-align: right;">Action</th>
          </tr>
        </thead>
        <tbody>
    `;
    backups.forEach(b => {
      const dateStr = new Date(b.createdAt).toLocaleString();
      const sizeKb = (b.size / 1024).toFixed(1) + ' KB';
      html += `
        <tr>
          <td><strong>${dateStr}</strong></td>
          <td><code>${escapeHtml(b.filename)}</code></td>
          <td>${sizeKb}</td>
          <td style="text-align: right;">
            <button class="btn btn-secondary btn-sm" onclick="restoreSnapshotPrompt('${b.filename}')"><i class="ph-bold ph-clock-counter-clockwise"></i> Restore This Version</button>
          </td>
        </tr>
      `;
    });
    html += '</tbody></table>';
    container.innerHTML = html;
  } catch (err) {
    container.innerHTML = '<p style="color: #ef4444;">Failed to load backup list.</p>';
  }
}

async function restoreSnapshotPrompt(filename) {
  if (!confirm(`Are you sure you want to restore the snapshot "${filename}"? All content will be rolled back to this point.`)) {
    return;
  }

  setSaveStatus('saving', 'Restoring snapshot...');
  try {
    const res = await fetch('/api/admin/backups/restore', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-csrf-token': CSRF_TOKEN
      },
      body: JSON.stringify({ filename })
    });

    if (!res.ok) throw new Error('Restore failed');

    await loadContent();
    showToast(`Snapshot ${filename} restored successfully`, 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function exportContentJson() {
  window.open('/api/admin/export', '_blank');
}

async function handleImportJson(input) {
  if (!input.files || input.files.length === 0) return;
  const file = input.files[0];
  const reader = new FileReader();

  reader.onload = async (e) => {
    try {
      const parsed = JSON.parse(e.target.result);
      if (!parsed.projects || !parsed.settings) {
        throw new Error('Invalid JSON structure for Moiz Studio CMS content.');
      }

      if (!confirm('Importing this JSON will overwrite current content with the uploaded file. Proceed?')) {
        return;
      }

      const res = await fetch('/api/admin/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': CSRF_TOKEN
        },
        body: JSON.stringify(parsed)
      });

      if (!res.ok) throw new Error('Failed to import JSON content');

      await loadContent();
      showToast('Content successfully imported from file', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      input.value = '';
    }
  };

  reader.readAsText(file);
}

// ==============================================================
// 5. FORM SUBMISSION HANDLERS
// ==============================================================

function setupForms() {
  // Home Page Form
  document.getElementById('homePageForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const home = CMS_DATA.home;

    home.hero.badgeTitle = document.getElementById('homeHeroBadgeTitle').value.trim();
    home.hero.heading = document.getElementById('homeHeroHeading').value.trim();
    home.hero.description = document.getElementById('homeHeroDescription').value.trim();
    home.hero.btn1Text = document.getElementById('homeHeroBtn1Text').value.trim();
    home.hero.btn1Link = document.getElementById('homeHeroBtn1Link').value.trim();
    home.hero.btn2Text = document.getElementById('homeHeroBtn2Text').value.trim();
    home.hero.btn2Link = document.getElementById('homeHeroBtn2Link').value.trim();

    // Stats
    (home.stats || []).forEach((stat, idx) => {
      stat.count = document.getElementById(`statVal_${idx}`).value.trim();
      stat.suffix = document.getElementById(`statSuffix_${idx}`).value.trim();
      stat.label = document.getElementById(`statLabel_${idx}`).value.trim();
      stat.isDark = document.getElementById(`statDark_${idx}`).checked;
    });

    // About
    home.aboutTeaser.heading = document.getElementById('homeAboutHeading').value.trim();
    home.aboutTeaser.circleBadgeYears = document.getElementById('homeAboutBadgeYears').value.trim();
    home.aboutTeaser.circleBadgeText = document.getElementById('homeAboutBadgeText').value.trim();
    home.aboutTeaser.paragraphs = [
      document.getElementById('homeAboutP1').value.trim(),
      document.getElementById('homeAboutP2').value.trim(),
      document.getElementById('homeAboutP3').value.trim(),
      document.getElementById('homeAboutP4').value.trim()
    ];

    // CTA
    home.ctaSection.tagline = document.getElementById('homeCtaTagline').value.trim();
    home.ctaSection.heading = document.getElementById('homeCtaHeading').value.trim();
    home.ctaSection.description = document.getElementById('homeCtaDesc').value.trim();

    saveFullContent(CMS_DATA, 'Home page updated successfully');
  });

  // Work Page Form
  document.getElementById('workPageForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const wp = CMS_DATA.workPage;

    wp.breadcrumb = document.getElementById('workBreadcrumb').value.trim();
    wp.title = document.getElementById('workTitle').value.trim();
    wp.titleAccent = document.getElementById('workTitleAccent').value.trim();
    wp.intro = document.getElementById('workIntro').value.trim();
    wp.statsPillCount = document.getElementById('workStatsPillCount').value.trim();
    wp.statsPillLabel = document.getElementById('workStatsPillLabel').value.trim();
    wp.trustedIntro = document.getElementById('workTrustedIntro').value.trim();

    // Trusted partners
    (wp.trustedPartners || []).forEach((p, idx) => {
      p.name = document.getElementById(`tpName_${idx}`).value.trim();
      p.src = document.getElementById(`tpSrc_${idx}`).value.trim();
      p.alt = document.getElementById(`tpAlt_${idx}`).value.trim();
    });

    saveFullContent(CMS_DATA, 'Work page updated successfully');
  });

  // Contact Info Form
  document.getElementById('contactInfoForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const ci = CMS_DATA.contactInfo;

    ci.email = document.getElementById('contactEmail').value.trim();
    ci.phone = document.getElementById('contactPhone').value.trim();
    ci.whatsappNumber = document.getElementById('contactWhatsAppNumber').value.trim();
    ci.whatsappDefaultMessage = document.getElementById('contactWhatsAppMsg').value.trim();
    ci.location = document.getElementById('contactLocation').value.trim();

    // Socials
    (ci.socialLinks || []).forEach((s, idx) => {
      s.name = document.getElementById(`socName_${idx}`).value.trim();
      s.url = document.getElementById(`socUrl_${idx}`).value.trim();
      s.icon = document.getElementById(`socIcon_${idx}`).value.trim();
      s.visible = document.getElementById(`socVisible_${idx}`).checked;
    });

    saveFullContent(CMS_DATA, 'Contact information updated successfully');
  });

  // Website Settings Form
  document.getElementById('settingsForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const s = CMS_DATA.settings;

    s.siteTitle = document.getElementById('settingsSiteTitle').value.trim();
    s.tagline = document.getElementById('settingsTagline').value.trim();
    s.canonicalDomain = document.getElementById('settingsCanonicalDomain').value.trim();
    s.defaultMetaDescription = document.getElementById('settingsMetaDesc').value.trim();
    s.defaultKeywords = document.getElementById('settingsKeywords').value.trim();
    s.copyrightYear = document.getElementById('settingsCopyrightYear').value.trim();
    s.notificationEmail = document.getElementById('settingsNotificationEmail').value.trim();

    saveFullContent(CMS_DATA, 'Website settings saved');
  });

  // Change Password Form
  document.getElementById('changePasswordForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const currentPassword = document.getElementById('accCurrentPassword').value;
    const newUsername = document.getElementById('accNewUsername').value.trim();
    const newPassword = document.getElementById('accNewPassword').value;
    const confirmPassword = document.getElementById('accConfirmPassword').value;

    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': CSRF_TOKEN
        },
        body: JSON.stringify({ currentPassword, newUsername, newPassword, confirmPassword })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update credentials');

      showToast('Credentials updated! Please log in again with your new credentials.', 'success');
      setTimeout(() => {
        showLoginScreen();
      }, 1500);
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  // Project Modal Form
  document.getElementById('projectForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const slug = document.getElementById('projSlug').value.trim().toLowerCase();
    const isEdit = Boolean(currentEditingProjectSlug);

    const projectData = {
      title: document.getElementById('projTitle').value.trim(),
      slug: slug,
      categorySubtitle: document.getElementById('projCategorySubtitle').value.trim(),
      subtitle: document.getElementById('projSubtitle').value.trim(),
      industry: document.getElementById('projIndustry').value,
      industrySlug: document.getElementById('projIndustry').selectedOptions[0]?.getAttribute('data-slug') || 'general',
      status: document.getElementById('projStatus').value,
      featured: document.getElementById('projFeatured').checked,
      shortDesc: document.getElementById('projShortDesc').value.trim(),
      description: document.getElementById('projShortDesc').value.trim(),
      liveUrl: document.getElementById('projLiveUrl').value.trim(),
      image: document.getElementById('projImage').value.trim(),
      gallery: currentProjectGallery,
      metaBoxes: {
        client: document.getElementById('projClient').value.trim() || 'CLIENT',
        industry: (document.getElementById('projIndustry').value || 'GENERAL').toUpperCase(),
        platform: document.getElementById('projPlatform').value.trim() || 'WIX STUDIO',
        services: document.getElementById('projServicesBox').value.trim() || 'WIX STUDIO DEVELOPMENT'
      },
      challenge: {
        num: '01 / REQUIREMENT',
        title: 'THE CHALLENGE',
        desc: document.getElementById('projChallengeDesc').value.trim()
      },
      solution: {
        num: '02 / APPROACH',
        title: 'THE SOLUTION',
        desc: document.getElementById('projSolutionDesc').value.trim()
      },
      outcome: {
        num: '03 / DELIVERABLE',
        title: 'THE OUTCOME',
        desc: document.getElementById('projOutcomeDesc').value.trim()
      },
      testimonial: {
        quote: document.getElementById('projTestimonialQuote').value.trim(),
        author: document.getElementById('projTestimonialAuthor').value.trim(),
        role: document.getElementById('projTestimonialRole').value.trim()
      }
    };

    try {
      const url = isEdit ? `/api/admin/projects/${currentEditingProjectSlug}` : '/api/admin/projects';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': CSRF_TOKEN
        },
        body: JSON.stringify(projectData)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save project');
      }

      closeProjectModal();
      await loadContent();
      showToast(`Project "${projectData.title}" saved and case study generated!`, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  // Testimonial Modal Form
  document.getElementById('testimonialForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const tData = {
      id: currentEditingTestimonialId || ('t-' + Date.now()),
      quote: document.getElementById('testQuote').value.trim(),
      author: document.getElementById('testAuthor').value.trim(),
      role: document.getElementById('testRole').value.trim(),
      visible: document.getElementById('testVisible').checked
    };

    if (!CMS_DATA.testimonials) CMS_DATA.testimonials = [];

    if (currentEditingTestimonialId) {
      const idx = CMS_DATA.testimonials.findIndex(t => t.id === currentEditingTestimonialId);
      if (idx !== -1) CMS_DATA.testimonials[idx] = tData;
    } else {
      CMS_DATA.testimonials.push(tData);
    }

    closeTestimonialModal();
    saveFullContent(CMS_DATA, 'Testimonial saved');
  });

  // Service Modal Form
  document.getElementById('serviceForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const bullets = document.getElementById('srvBullets').value.split('\n').map(b => b.trim()).filter(Boolean);
    const sData = {
      id: currentEditingServiceId || ('srv-' + Date.now()),
      title: document.getElementById('srvTitle').value.trim(),
      number: document.getElementById('srvNumber').value.trim(),
      description: document.getElementById('srvDesc').value.trim(),
      bullets: bullets,
      price: document.getElementById('srvPrice').value.trim(),
      showPrice: document.getElementById('srvShowPrice').checked,
      link: '#contact'
    };

    if (!CMS_DATA.services) CMS_DATA.services = [];

    if (currentEditingServiceId) {
      const idx = CMS_DATA.services.findIndex(s => s.id === currentEditingServiceId);
      if (idx !== -1) CMS_DATA.services[idx] = sData;
    } else {
      CMS_DATA.services.push(sData);
    }

    closeServiceModal();
    saveFullContent(CMS_DATA, 'Service saved');
  });

  // Media Upload Form
  document.getElementById('mediaUploadForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fileInput = document.getElementById('mediaFileInput');
    const slotInput = document.getElementById('mediaSlotInput');

    if (!fileInput.files || fileInput.files.length === 0) return;

    const formData = new FormData();
    for (const f of fileInput.files) {
      formData.append('files', f);
    }
    if (slotInput.value.trim()) {
      formData.append('slot', slotInput.value.trim());
    }

    setSaveStatus('saving', 'Optimizing & uploading image...');
    try {
      const res = await fetch('/api/admin/media/upload', {
        method: 'POST',
        headers: { 'x-csrf-token': CSRF_TOKEN },
        body: formData
      });

      if (!res.ok) throw new Error('Upload failed');

      closeMediaUploadModal();
      await loadContent();
      showToast('Image(s) converted to WebP and added to Media Library!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
}

// ==============================================================
// 6. MODAL UTILITIES & CRUD TRIGGERS
// ==============================================================

// --- Project Gallery & Media Selector Helpers ---
function updateProjThumbnailPreview(url) {
  const img = document.getElementById('projImagePreview');
  const icon = document.getElementById('projImagePlaceholder');
  if (!img || !icon) return;
  if (url && url.trim()) {
    img.src = url.trim();
    img.style.display = 'block';
    icon.style.display = 'none';
  } else {
    img.src = '';
    img.style.display = 'none';
    icon.style.display = 'block';
  }
}

function onProjectThumbnailSelect(val) {
  if (val) {
    document.getElementById('projImage').value = val;
    updateProjThumbnailPreview(val);
  }
}

function populateProjectMediaDropdowns() {
  const mediaList = (CMS_DATA && CMS_DATA.media) || [];

  // Thumbnail select
  const thumbSelect = document.getElementById('projImageSelect');
  if (thumbSelect) {
    let opts = '<option value="">-- Choose from uploaded library by name --</option>';
    mediaList.forEach(m => {
      const name = m.title || m.alt || m.url.split('/').pop();
      opts += `<option value="${m.url}">${escapeHtml(name)} (${escapeHtml(m.url)})</option>`;
    });
    thumbSelect.innerHTML = opts;
  }

  // Gallery select
  const gallerySelect = document.getElementById('galleryMediaSelect');
  if (gallerySelect) {
    let opts = '<option value="">-- Choose from uploaded library by name --</option>';
    mediaList.forEach(m => {
      const name = m.title || m.alt || m.url.split('/').pop();
      opts += `<option value="${m.url}" data-alt="${escapeHtml(name)}">${escapeHtml(name)} (${escapeHtml(m.url)})</option>`;
    });
    gallerySelect.innerHTML = opts;
  }
}

function onGalleryMediaSelect(val) {
  if (val) {
    document.getElementById('newGallerySrc').value = val;
    const select = document.getElementById('galleryMediaSelect');
    const selectedOpt = select.selectedOptions[0];
    const alt = selectedOpt ? selectedOpt.getAttribute('data-alt') : '';
    if (alt && !document.getElementById('newGalleryAlt').value) {
      document.getElementById('newGalleryAlt').value = alt;
    }
  }
}

function renderProjectGalleryList() {
  const container = document.getElementById('projectGalleryList');
  if (!container) return;

  if (currentProjectGallery.length === 0) {
    container.innerHTML = '<p style="color: #94a3b8; font-size: 13px; margin: 0; padding: 12px; background: #fff; border: 1px dashed #cbd5e1; border-radius: 6px; text-align: center;">No visuals added yet. Select an uploaded image above and click "+ Add Slide".</p>';
    return;
  }

  let html = '';
  currentProjectGallery.forEach((item, idx) => {
    html += `
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 14px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px;">
        <div style="display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0;">
          <img src="${item.src}" alt="${escapeHtml(item.alt || '')}" style="width: 52px; height: 36px; object-fit: cover; border-radius: 4px; border: 1px solid #e2e8f0; flex-shrink: 0;" onerror="this.src='/assets/images/thumbs/about-three-thumb.jpg'" />
          <div style="flex: 1; min-width: 0;">
            <div style="font-size: 13px; font-weight: 600; color: #1e293b; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(item.src)}</div>
            <input type="text" class="form-control" style="font-size: 12px; padding: 4px 8px; height: 28px; margin-top: 4px;" value="${escapeHtml(item.alt || '')}" placeholder="Caption / Alt text" onchange="updateGalleryAlt(${idx}, this.value)" />
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 4px; flex-shrink: 0;">
          <button type="button" class="btn btn-secondary btn-sm" onclick="moveProjectGallerySlide(${idx}, -1)" ${idx === 0 ? 'disabled' : ''} title="Move Up"><i class="ph-bold ph-arrow-up"></i></button>
          <button type="button" class="btn btn-secondary btn-sm" onclick="moveProjectGallerySlide(${idx}, 1)" ${idx === currentProjectGallery.length - 1 ? 'disabled' : ''} title="Move Down"><i class="ph-bold ph-arrow-down"></i></button>
          <button type="button" class="btn btn-secondary btn-sm" style="color: #ef4444;" onclick="removeProjectGallerySlide(${idx})" title="Remove"><i class="ph-bold ph-trash"></i></button>
        </div>
      </div>
    `;
  });
  container.innerHTML = html;
}

function updateGalleryAlt(idx, val) {
  if (currentProjectGallery[idx]) {
    currentProjectGallery[idx].alt = val.trim();
  }
}

function addProjectGallerySlide() {
  const src = document.getElementById('newGallerySrc').value.trim();
  const alt = document.getElementById('newGalleryAlt').value.trim() || ('Visual Mockup ' + (currentProjectGallery.length + 1));

  if (!src) {
    showToast('Please select or enter an image URL first.', 'error');
    return;
  }

  currentProjectGallery.push({ src, alt });
  document.getElementById('newGallerySrc').value = '';
  document.getElementById('newGalleryAlt').value = '';
  const sel = document.getElementById('galleryMediaSelect');
  if (sel) sel.value = '';
  renderProjectGalleryList();
}

function removeProjectGallerySlide(idx) {
  currentProjectGallery.splice(idx, 1);
  renderProjectGalleryList();
}

function moveProjectGallerySlide(idx, delta) {
  const newIdx = idx + delta;
  if (newIdx < 0 || newIdx >= currentProjectGallery.length) return;
  const item = currentProjectGallery.splice(idx, 1)[0];
  currentProjectGallery.splice(newIdx, 0, item);
  renderProjectGalleryList();
}

function openProjectModal(project = null) {
  currentEditingProjectSlug = project ? project.slug : null;
  document.getElementById('projectModalTitle').textContent = project ? 'Edit Project' : 'Add New Project';

  // Populate industries dropdown
  const indSelect = document.getElementById('projIndustry');
  indSelect.innerHTML = (CMS_DATA.industries || []).map(ind => `
    <option value="${escapeHtml(ind.name)}" data-slug="${escapeHtml(ind.slug)}">${escapeHtml(ind.name)}</option>
  `).join('');

  // Populate media dropdowns
  populateProjectMediaDropdowns();

  // Setup thumbnail input & dropdown handlers
  const projImgInput = document.getElementById('projImage');
  projImgInput.oninput = () => updateProjThumbnailPreview(projImgInput.value);

  const thumbSelect = document.getElementById('projImageSelect');
  if (thumbSelect) {
    thumbSelect.onchange = (e) => onProjectThumbnailSelect(e.target.value);
  }

  const galSelect = document.getElementById('galleryMediaSelect');
  if (galSelect) {
    galSelect.onchange = (e) => onGalleryMediaSelect(e.target.value);
  }

  // Clear new slide inputs
  document.getElementById('newGallerySrc').value = '';
  document.getElementById('newGalleryAlt').value = '';

  if (project) {
    document.getElementById('projTitle').value = project.title || '';
    document.getElementById('projSlug').value = project.slug || '';
    document.getElementById('projCategorySubtitle').value = project.categorySubtitle || '';
    document.getElementById('projSubtitle').value = project.subtitle || '';
    document.getElementById('projIndustry').value = project.industry || '';
    document.getElementById('projStatus').value = project.status || 'published';
    document.getElementById('projFeatured').checked = Boolean(project.featured);
    document.getElementById('projShortDesc').value = project.shortDesc || project.description || '';
    document.getElementById('projLiveUrl').value = project.liveUrl || '';
    document.getElementById('projImage').value = project.image || '';
    updateProjThumbnailPreview(project.image || '');

    // Match image select dropdown if matching value exists
    if (thumbSelect) thumbSelect.value = project.image || '';

    // Gallery slides
    if (Array.isArray(project.gallery) && project.gallery.length > 0) {
      currentProjectGallery = JSON.parse(JSON.stringify(project.gallery));
    } else if (project.image) {
      currentProjectGallery = [{ src: project.image, alt: project.title || 'Visual Mockup 1' }];
    } else {
      currentProjectGallery = [];
    }

    // Case study breakdown fields
    document.getElementById('projClient').value = (project.metaBoxes && project.metaBoxes.client) || '';
    document.getElementById('projPlatform').value = (project.metaBoxes && project.metaBoxes.platform) || '';
    document.getElementById('projServicesBox').value = (project.metaBoxes && project.metaBoxes.services) || '';

    document.getElementById('projChallengeDesc').value = (project.challenge && project.challenge.desc) || '';
    document.getElementById('projSolutionDesc').value = (project.solution && project.solution.desc) || '';
    document.getElementById('projOutcomeDesc').value = (project.outcome && project.outcome.desc) || '';

    document.getElementById('projTestimonialQuote').value = (project.testimonial && project.testimonial.quote) || '';
    document.getElementById('projTestimonialAuthor').value = (project.testimonial && project.testimonial.author) || '';
    document.getElementById('projTestimonialRole').value = (project.testimonial && project.testimonial.role) || '';
  } else {
    document.getElementById('projectForm').reset();
    document.getElementById('projStatus').value = 'published';
    document.getElementById('projPlatform').value = 'WIX STUDIO';
    document.getElementById('projCategorySubtitle').value = 'WIX STUDIO WEBSITE DESIGN & DEVELOPMENT';
    updateProjThumbnailPreview('');
    currentProjectGallery = [];
  }

  renderProjectGalleryList();
  document.getElementById('projectModal').classList.add('active');
}

function closeProjectModal() {
  document.getElementById('projectModal').classList.remove('active');
  currentEditingProjectSlug = null;
}

function editProject(slug) {
  const p = (CMS_DATA.projects || []).find(proj => proj.slug === slug);
  if (p) openProjectModal(p);
}

function duplicateProject(slug) {
  const p = (CMS_DATA.projects || []).find(proj => proj.slug === slug);
  if (!p) return;
  const clone = JSON.parse(JSON.stringify(p));
  clone.title = clone.title + ' (Copy)';
  clone.slug = clone.slug + '-copy';
  clone.featured = false;
  openProjectModal(clone);
}

async function deleteProjectPrompt(slug) {
  if (!confirm(`Are you sure you want to delete project "${slug}"? Its case study page and references will be removed permanently.`)) {
    return;
  }

  setSaveStatus('saving', 'Deleting project...');
  try {
    const res = await fetch(`/api/admin/projects/${slug}`, {
      method: 'DELETE',
      headers: { 'x-csrf-token': CSRF_TOKEN }
    });
    if (!res.ok) throw new Error('Failed to delete project');
    await loadContent();
    showToast(`Project ${slug} deleted successfully`, 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function toggleProjectFeatured(slug, isFeatured) {
  const p = (CMS_DATA.projects || []).find(proj => proj.slug === slug);
  if (!p) return;
  p.featured = isFeatured;
  saveFullContent(CMS_DATA, `Project "${p.title}" ${isFeatured ? 'added to' : 'removed from'} featured slideshow`);
}

// Industry Actions
function addIndustryPrompt() {
  const name = prompt('Enter new Industry Name (e.g. Real Estate):');
  if (!name || !name.trim()) return;
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  if (!CMS_DATA.industries) CMS_DATA.industries = [];
  CMS_DATA.industries.push({
    id: 'ind-' + Date.now(),
    name: name.trim(),
    slug: slug,
    order: CMS_DATA.industries.length + 1
  });

  saveFullContent(CMS_DATA, `Industry "${name}" added`);
}

function renameIndustry(id) {
  const ind = (CMS_DATA.industries || []).find(i => i.id === id);
  if (!ind) return;
  const newName = prompt('Enter new name for industry:', ind.name);
  if (!newName || !newName.trim()) return;
  ind.name = newName.trim();
  ind.slug = newName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  saveFullContent(CMS_DATA, 'Industry updated');
}

function deleteIndustry(id) {
  if (!confirm('Are you sure you want to remove this industry category?')) return;
  const idx = (CMS_DATA.industries || []).findIndex(i => i.id === id);
  if (idx !== -1) {
    CMS_DATA.industries.splice(idx, 1);
    saveFullContent(CMS_DATA, 'Industry removed');
  }
}

// Testimonials Actions
function openTestimonialModal(t = null) {
  currentEditingTestimonialId = t ? t.id : null;
  document.getElementById('testimonialModalTitle').textContent = t ? 'Edit Testimonial' : 'Add Testimonial';
  if (t) {
    document.getElementById('testQuote').value = t.quote || '';
    document.getElementById('testAuthor').value = t.author || '';
    document.getElementById('testRole').value = t.role || '';
    document.getElementById('testVisible').checked = t.visible !== false;
  } else {
    document.getElementById('testimonialForm').reset();
    document.getElementById('testVisible').checked = true;
  }
  document.getElementById('testimonialModal').classList.add('active');
}

function closeTestimonialModal() {
  document.getElementById('testimonialModal').classList.remove('active');
  currentEditingTestimonialId = null;
}

function editTestimonial(id) {
  const t = (CMS_DATA.testimonials || []).find(item => item.id === id);
  if (t) openTestimonialModal(t);
}

function deleteTestimonial(id) {
  if (!confirm('Delete this testimonial?')) return;
  const idx = (CMS_DATA.testimonials || []).findIndex(item => item.id === id);
  if (idx !== -1) {
    CMS_DATA.testimonials.splice(idx, 1);
    saveFullContent(CMS_DATA, 'Testimonial deleted');
  }
}

// Service Actions
function openServiceModal(s = null) {
  currentEditingServiceId = s ? s.id : null;
  document.getElementById('serviceModalTitle').textContent = s ? 'Edit Service' : 'Add Service';
  if (s) {
    document.getElementById('srvTitle').value = s.title || '';
    document.getElementById('srvNumber').value = s.number || '';
    document.getElementById('srvDesc').value = s.description || '';
    document.getElementById('srvBullets').value = (s.bullets || []).join('\n');
    document.getElementById('srvPrice').value = s.price || '';
    document.getElementById('srvShowPrice').checked = Boolean(s.showPrice);
  } else {
    document.getElementById('serviceForm').reset();
  }
  document.getElementById('serviceModal').classList.add('active');
}

function closeServiceModal() {
  document.getElementById('serviceModal').classList.remove('active');
  currentEditingServiceId = null;
}

function editService(id) {
  const s = (CMS_DATA.services || []).find(item => item.id === id);
  if (s) openServiceModal(s);
}

function deleteService(id) {
  if (!confirm('Delete this service?')) return;
  const idx = (CMS_DATA.services || []).findIndex(item => item.id === id);
  if (idx !== -1) {
    CMS_DATA.services.splice(idx, 1);
    saveFullContent(CMS_DATA, 'Service removed');
  }
}

// Media Upload Modal
function openMediaUploadModal() {
  document.getElementById('mediaUploadForm').reset();
  document.getElementById('mediaUploadModal').classList.add('active');
}

function closeMediaUploadModal() {
  document.getElementById('mediaUploadModal').classList.remove('active');
}

async function deleteMediaItem(id) {
  if (!confirm('Delete this image from the Media Library?')) return;
  try {
    const res = await fetch(`/api/admin/media/${id}`, {
      method: 'DELETE',
      headers: { 'x-csrf-token': CSRF_TOKEN }
    });
    if (res.ok) {
      await loadContent();
      showToast('Media removed', 'success');
    }
  } catch (e) {}
}

function triggerReplaceImage(targetUrl) {
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/*';
  fileInput.onchange = async () => {
    if (!fileInput.files || fileInput.files.length === 0) return;
    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('targetUrl', targetUrl);

    setSaveStatus('saving', 'Replacing file in-place...');
    try {
      const res = await fetch('/api/admin/media/replace', {
        method: 'POST',
        headers: { 'x-csrf-token': CSRF_TOKEN },
        body: formData
      });
      if (!res.ok) throw new Error('Replace failed');
      await loadContent();
      showToast(`Image replaced in place for slot "${targetUrl}"!`, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };
  fileInput.click();
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    showToast(`Copied URL: ${text}`, 'success');
  }).catch(() => {
    prompt('Copy URL:', text);
  });
}

// Toast Helper
function showToast(message, type = 'success') {
  const container = document.getElementById('adminToastContainer');
  const toast = document.createElement('div');
  toast.className = `admin-toast ${type}`;
  toast.innerHTML = `
    <i class="ph-bold ${type === 'success' ? 'ph-check-circle' : 'ph-warning-circle'}"></i>
    <span>${escapeHtml(message)}</span>
  `;
  container.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 4000);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
