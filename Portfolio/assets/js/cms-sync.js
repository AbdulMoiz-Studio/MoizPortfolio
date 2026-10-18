/**
 * Client-side Dynamic Synchronization (cms-sync.js)
 * Synchronizes client-side elements with central CMS API or content data.
 * Enhances live preview, theme token injection, and stat counters.
 */

(function () {
  async function syncSite() {
    try {
      const res = await fetch('/api/content');
      if (!res.ok) return;
      const data = await res.json();
      if (!data) return;

      // Apply dynamic theme tokens if provided
      if (data.theme && data.theme.tokens) {
        const root = document.documentElement;
        const t = data.theme.tokens;
        if (t.brandOrange) {
          root.style.setProperty('--main-two-600', t.brandOrange);
        }
        if (t.brandLime) {
          root.style.setProperty('--main-600', t.brandLime);
        }
      }

      // Propagate WhatsApp link updates
      if (data.contactInfo && data.contactInfo.whatsappNumber) {
        const num = data.contactInfo.whatsappNumber;
        const msg = encodeURIComponent(data.contactInfo.whatsappDefaultMessage || "Hi Abdul Moiz, I'd like to discuss my project.");
        const targetUrl = `https://api.whatsapp.com/send?phone=${num}&text=${msg}`;

        document.querySelectorAll('a[href*="whatsapp.com/send"]').forEach(el => {
          el.href = targetUrl;
        });
      }

      // Propagate contact email
      if (data.contactInfo && data.contactInfo.email) {
        document.querySelectorAll('a[href^="mailto:"]').forEach(el => {
          el.href = `mailto:${data.contactInfo.email}`;
          if (el.textContent.includes('@')) {
            el.textContent = data.contactInfo.email;
          }
        });
      }

      // Propagate phone
      if (data.contactInfo && data.contactInfo.phone) {
        document.querySelectorAll('a[href^="tel:"]').forEach(el => {
          el.href = `tel:${data.contactInfo.phone}`;
          el.textContent = data.contactInfo.phone;
        });
      }

    } catch (e) {
      // Offline or static preview fallback - do nothing
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', syncSite);
  } else {
    syncSite();
  }
})();
