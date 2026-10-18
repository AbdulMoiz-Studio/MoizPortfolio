/**
 * Complete CMS & Full-Stack Test Suite (test/test-cms.js)
 * Automatically verifies all security, CRUD, file generation, and API requirements.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const http = require('http');

const app = require('../server/index');
const PORT = 3001; // Test server port
let server;

function makeRequest(method, urlPath, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: PORT,
      path: urlPath,
      method: method,
      headers: headers
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = JSON.parse(data);
        } catch (e) {
          parsed = data;
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: parsed
        });
      });
    });

    req.on('error', reject);
    if (body) {
      const payload = typeof body === 'string' ? body : JSON.stringify(body);
      req.setHeader('Content-Type', 'application/json');
      req.setHeader('Content-Length', Buffer.byteLength(payload));
      req.write(payload);
    }
    req.end();
  });
}

async function runTestSuite() {
  console.log('\n======================================================');
  console.log(' Starting Moiz Studio Portfolio CMS Full Test Suite');
  console.log('======================================================\n');

  // Start temporary test server
  server = app.listen(PORT);
  let sessionCookie = '';
  let csrfToken = '';

  try {
    // -----------------------------------------------------------
    // TEST 1: Route Protection (Reject Unauthenticated Requests)
    // -----------------------------------------------------------
    console.log('[Test 1] Route Protection: Unauthenticated request to /api/admin/content');
    const unauthRes = await makeRequest('GET', '/api/admin/content');
    assert.strictEqual(unauthRes.statusCode, 401, 'Should reject unauthenticated access with 401');
    console.log('  ✓ Pass: Rejected unauthenticated request with 401\n');

    // -----------------------------------------------------------
    // TEST 2: Wrong Password Rejection
    // -----------------------------------------------------------
    console.log('[Test 2] Security: Login with wrong password');
    const wrongRes = await makeRequest('POST', '/api/admin/login', {}, {
      username: 'abdulmoiz',
      password: 'incorrectPassword123'
    });
    assert.strictEqual(wrongRes.statusCode, 401, 'Should return 401 for bad password');
    assert.ok(wrongRes.data.error.includes('Invalid username or password'), 'Should return helpful error');
    console.log('  ✓ Pass: Bad credentials rejected with 401\n');

    // -----------------------------------------------------------
    // TEST 3: Successful Login & Cookie Verification
    // -----------------------------------------------------------
    console.log('[Test 3] Authentication: Login with valid credentials');
    const loginRes = await makeRequest('POST', '/api/admin/login', {}, {
      username: 'abdulmoiz',
      password: 'shmoiz8483'
    });
    assert.strictEqual(loginRes.statusCode, 200, 'Should return 200 for valid credentials');
    assert.ok(loginRes.data.success, 'Login response must indicate success');
    assert.ok(loginRes.data.csrfToken, 'Must provide CSRF token');
    csrfToken = loginRes.data.csrfToken;

    const setCookie = loginRes.headers['set-cookie'];
    assert.ok(setCookie && setCookie.length > 0, 'Must set session cookie');
    sessionCookie = setCookie[0].split(';')[0];
    console.log(`  ✓ Pass: Login successful, received session cookie & CSRF token\n`);

    // -----------------------------------------------------------
    // TEST 4: CSRF Header Protection
    // -----------------------------------------------------------
    console.log('[Test 4] Security: Mutating request without CSRF token');
    const noCsrfRes = await makeRequest('PUT', '/api/admin/content', {
      'Cookie': sessionCookie
    }, { test: 123 });
    assert.strictEqual(noCsrfRes.statusCode, 403, 'Should reject state-changing request without CSRF');
    console.log('  ✓ Pass: Rejected missing CSRF token with 403\n');

    // -----------------------------------------------------------
    // TEST 5: Public Content API
    // -----------------------------------------------------------
    console.log('[Test 5] Content Delivery: Public GET /api/content');
    const contentRes = await makeRequest('GET', '/api/content');
    assert.strictEqual(contentRes.statusCode, 200, 'Public API should return 200');
    assert.ok(contentRes.data.projects.length >= 4, 'Should contain all projects');
    assert.strictEqual(contentRes.data.admin.passwordHash, undefined, 'Must NEVER expose password hash');
    console.log(`  ✓ Pass: Content API delivered ${contentRes.data.projects.length} projects without password hash\n`);

    // -----------------------------------------------------------
    // TEST 6: Project Creation & Automatic Case Study Generation
    // -----------------------------------------------------------
    console.log('[Test 6] Full CRUD: Create new project & verify case study generation');
    const testSlug = 'automated-test-project';
    const createProjectRes = await makeRequest('POST', '/api/admin/projects', {
      'Cookie': sessionCookie,
      'x-csrf-token': csrfToken
    }, {
      title: 'Automated Test Project',
      slug: testSlug,
      categorySubtitle: 'WIX STUDIO TEST SUITE',
      subtitle: 'Automation Testing',
      industry: 'Technology',
      industrySlug: 'technology',
      status: 'published',
      featured: true,
      shortDesc: 'A temporary project generated by the automated test suite.',
      description: 'Full description of the automated test project.',
      liveUrl: 'https://example.com/test',
      image: '/assets/images/thumbs/about-three-thumb.jpg',
      metaBoxes: {
        client: 'TEST CLIENT',
        industry: 'TECHNOLOGY',
        platform: 'WIX STUDIO',
        services: 'DEVELOPMENT'
      },
      challenge: { num: '01', title: 'CHALLENGE', desc: 'Testing automated creation.' },
      solution: { num: '02', title: 'SOLUTION', desc: 'Created by test script.' },
      outcome: { num: '03', title: 'OUTCOME', desc: 'Verified 100% working.' },
      testimonial: { quote: 'Great work!', author: 'Tester', role: 'QA' }
    });

    assert.strictEqual(createProjectRes.statusCode, 200, 'Project creation should succeed');

    // Verify generated file on disk
    const generatedHtmlPath = path.resolve(__dirname, '..', 'work', `${testSlug}.html`);
    assert.ok(fs.existsSync(generatedHtmlPath), `Generated case study file must exist at ${generatedHtmlPath}`);
    const generatedHtmlContent = fs.readFileSync(generatedHtmlPath, 'utf8');
    assert.ok(generatedHtmlContent.includes('Automated Test Project'), 'Generated HTML must contain project title');
    assert.ok(generatedHtmlContent.includes('WIX STUDIO TEST SUITE'), 'Generated HTML must contain subtitle');
    console.log(`  ✓ Pass: Project created and case study page verified at work/${testSlug}.html\n`);

    // Verify sitemap.xml updated
    const sitemapContent = fs.readFileSync(path.resolve(__dirname, '..', 'sitemap.xml'), 'utf8');
    assert.ok(sitemapContent.includes(`/work/${testSlug}`), 'Sitemap must contain new project URL');
    console.log('  ✓ Pass: sitemap.xml automatically updated with new case study URL\n');

    // -----------------------------------------------------------
    // TEST 7: Project Deletion & Case Study Cleanup
    // -----------------------------------------------------------
    console.log('[Test 7] Full CRUD: Delete test project & verify file removal');
    const deleteProjRes = await makeRequest('DELETE', `/api/admin/projects/${testSlug}`, {
      'Cookie': sessionCookie,
      'x-csrf-token': csrfToken
    });
    assert.strictEqual(deleteProjRes.statusCode, 200, 'Project deletion should succeed');
    assert.ok(!fs.existsSync(generatedHtmlPath), 'Case study HTML file must be deleted from disk');
    console.log('  ✓ Pass: Project and case study file cleanly removed from disk\n');

    // -----------------------------------------------------------
    // TEST 8: Testimonial CRUD
    // -----------------------------------------------------------
    console.log('[Test 8] Testimonial CRUD: Add, verify, and remove testimonial');
    const db = require('../data/db');
    const contentBefore = db.readContent();
    const testId = 't-test-' + Date.now();
    contentBefore.testimonials.push({
      id: testId,
      quote: 'Exceptional responsiveness and clean code.',
      author: 'Testimonial Tester',
      role: 'QA Engineer',
      visible: true
    });
    await db.saveContent(contentBefore);

    const contentAfter = db.readContent();
    const foundT = contentAfter.testimonials.find(t => t.id === testId);
    assert.ok(foundT, 'Testimonial must persist in database');

    // Clean up
    contentAfter.testimonials = contentAfter.testimonials.filter(t => t.id !== testId);
    await db.saveContent(contentAfter);
    console.log('  ✓ Pass: Testimonial persistence verified\n');

    // -----------------------------------------------------------
    // TEST 9: Backups & Snapshots
    // -----------------------------------------------------------
    console.log('[Test 9] Backups & Safety: Verify rolling snapshots');
    const backupsRes = await makeRequest('GET', '/api/admin/backups', {
      'Cookie': sessionCookie
    });
    assert.strictEqual(backupsRes.statusCode, 200, 'Backups endpoint should return 200');
    assert.ok(Array.isArray(backupsRes.data.backups), 'Should return array of backups');
    assert.ok(backupsRes.data.backups.length > 0, 'At least one backup snapshot must exist');
    console.log(`  ✓ Pass: Found ${backupsRes.data.backups.length} automated snapshot backups\n`);

    // -----------------------------------------------------------
    // TEST 10: Theme Customization Persistence
    // -----------------------------------------------------------
    console.log('[Test 10] Themes & Colors: Switch to Dark theme and verify persistence');
    const contentForTheme = db.readContent();
    contentForTheme.theme.activeTheme = 'dark';
    await db.saveContent(contentForTheme);

    const reReadContent = db.readContent();
    assert.strictEqual(reReadContent.theme.activeTheme, 'dark', 'Dark theme must persist');

    // Switch back to default
    contentForTheme.theme.activeTheme = 'default';
    await db.saveContent(contentForTheme);
    console.log('  ✓ Pass: Theme switching and persistence verified\n');

    // -----------------------------------------------------------
    // TEST 11: Contact Form & Inbox Integration
    // -----------------------------------------------------------
    console.log('[Test 11] Inbox & Contact Form: Submit test message and verify inbox');
    const inboxTestEmail = 'automated-qa@example.com';
    const contactPostRes = await makeRequest('POST', '/api/contact', {}, {
      name: 'QA Automated User',
      email: inboxTestEmail,
      message: 'This is a test submission from the automated test suite.'
    });

    // Verify inbox in DB
    const freshContent = db.readContent();
    const foundMsg = (freshContent.messages || []).find(m => m.email === inboxTestEmail);
    assert.ok(foundMsg, 'Submission must be saved in database inbox');

    // Clean up test message
    freshContent.messages = freshContent.messages.filter(m => m.email !== inboxTestEmail);
    await db.saveContent(freshContent);
    console.log('  ✓ Pass: Contact submission stored in CMS inbox and verified\n');

    // -----------------------------------------------------------
    // TEST 12: Logout
    // -----------------------------------------------------------
    console.log('[Test 12] Authentication: Logout');
    const logoutRes = await makeRequest('POST', '/api/admin/logout', {
      'Cookie': sessionCookie
    });
    assert.strictEqual(logoutRes.statusCode, 200, 'Logout should succeed');

    const afterLogoutRes = await makeRequest('GET', '/api/admin/content', {
      'Cookie': sessionCookie
    });
    assert.strictEqual(afterLogoutRes.statusCode, 401, 'Session should be invalidated after logout');
    console.log('  ✓ Pass: Logout invalidated session successfully\n');

    console.log('======================================================');
    console.log(' ALL 12 TESTS PASSED PERFECTLY (100% SUCCESS)');
    console.log('======================================================\n');

  } catch (err) {
    console.error('\n❌ Test Suite Failed:', err);
    process.exitCode = 1;
  } finally {
    if (server) {
      server.close();
    }
  }
}

if (require.main === module) {
  runTestSuite();
}

module.exports = { runTestSuite };
