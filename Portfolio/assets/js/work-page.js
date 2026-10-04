/**
 * Work Page Interactive Controller
 * Drives the Hero Slideshow, Filter Accordion, Dynamic Live Counts,
 * AND-logic Filter Grid, and URL Query Synchronization.
 */

(function () {
  "use strict";

  // Ensure WORKS_DATA is available
  if (typeof window.WORKS_DATA === "undefined") {
    console.error("WORKS_DATA is not loaded.");
    return;
  }

  const { projects, industryPartners } = window.WORKS_DATA;

  // State
  let currentSlide = 0;
  let slideTimer = null;
  let slideStartTime = 0;
  let slideElapsed = 0;
  let isPaused = false;
  const SLIDE_DURATION = 5000; // 5 seconds per slide

  let activeIndustry = null; // null or slug
  let activeService = null;  // null or exact service string

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // DOM Elements
  const heroCountEl = document.getElementById("heroProjectCount");
  const slideTrackEl = document.getElementById("slideshowTrack");
  const progressSegsEl = document.getElementById("progressSegments");
  const slideshowContainer = document.getElementById("slideshowContainer");
  const projectsGridEl = document.getElementById("projectsGrid");
  const viewAllBtn = document.getElementById("viewAllProjectsBtn");
  const industryChipsContainer = document.getElementById("industryChips");
  const serviceChipsContainer = document.getElementById("serviceChips");

  // -------------------------------------------------------------------------
  // 1. Initial Hero Setup
  // -------------------------------------------------------------------------
  if (heroCountEl) {
    heroCountEl.textContent = `(${projects.length})`;
  }

  if (viewAllBtn) {
    viewAllBtn.addEventListener("click", function (e) {
      e.preventDefault();
      const target = document.getElementById("projects");
      if (target) {
        const header = document.querySelector(".header");
        const headerHeight = header ? header.offsetHeight : 80;
        const targetPos = target.getBoundingClientRect().top + window.pageYOffset - (headerHeight + 20);
        window.scrollTo({
          top: targetPos,
          behavior: prefersReducedMotion ? "auto" : "smooth"
        });
      }
    });
  }

  // -------------------------------------------------------------------------
  // 2. Hero Project Slideshow (Exactly 3 featured projects)
  // -------------------------------------------------------------------------
  const featuredProjects = projects.filter((p) => p.featured);

  function renderSlideshow() {
    if (!slideTrackEl || !progressSegsEl || featuredProjects.length === 0) return;

    slideTrackEl.innerHTML = "";
    progressSegsEl.innerHTML = "";

    featuredProjects.forEach((proj, idx) => {
      // Slide markup
      const slide = document.createElement("a");
      slide.href = proj.url;
      slide.className = `work-slide ${idx === 0 ? "is-active" : ""}`;
      slide.setAttribute("role", "group");
      slide.setAttribute("aria-roledescription", "slide");
      slide.setAttribute("aria-label", `${idx + 1} of ${featuredProjects.length}: ${proj.title}`);

      const industryPill = `<span class="work-pill work-pill-accent">${proj.industry}</span>`;
      const servicePills = proj.services.map(s => `<span class="work-pill">${s}</span>`).join("");

      slide.innerHTML = `
        <div class="work-slide-img-wrap">
          <img src="${proj.image}" alt="${proj.imageAlt}" width="720" height="450" ${idx === 0 ? 'loading="eager" fetchpriority="high"' : 'loading="lazy"'} />
        </div>
        <div class="work-slide-caption">
          <div class="work-slide-pills">
            ${industryPill}
            ${servicePills}
          </div>
          <div class="work-slide-desc">${proj.shortDesc || proj.description}</div>
        </div>
      `;

      slideTrackEl.appendChild(slide);

      // Progress segment button
      const segBtn = document.createElement("button");
      segBtn.type = "button";
      segBtn.className = `work-progress-seg ${idx === 0 ? "is-current" : ""}`;
      segBtn.setAttribute("aria-label", `Go to slide ${idx + 1}: ${proj.title}`);
      segBtn.innerHTML = `<span class="work-progress-seg-fill"></span>`;

      segBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        goToSlide(idx);
      });

      progressSegsEl.appendChild(segBtn);
    });

    initSlideTimer();
    initSwipe();
  }

  function goToSlide(index) {
    if (index < 0) index = featuredProjects.length - 1;
    if (index >= featuredProjects.length) index = 0;

    currentSlide = index;

    // Update active slide class
    const slides = slideTrackEl.querySelectorAll(".work-slide");
    slides.forEach((sl, idx) => {
      sl.classList.toggle("is-active", idx === currentSlide);
    });

    // Update progress segments
    updateSegmentStates();
    resetSlideTimer();
  }

  function nextSlide() {
    goToSlide((currentSlide + 1) % featuredProjects.length);
  }

  function updateSegmentStates() {
    const segs = progressSegsEl.querySelectorAll(".work-progress-seg");
    segs.forEach((seg, idx) => {
      const fill = seg.querySelector(".work-progress-seg-fill");
      if (idx < currentSlide) {
        seg.className = "work-progress-seg is-past";
        if (fill) fill.style.width = "100%";
      } else if (idx === currentSlide) {
        seg.className = "work-progress-seg is-current";
        if (fill) fill.style.width = "0%";
      } else {
        seg.className = "work-progress-seg";
        if (fill) fill.style.width = "0%";
      }
    });
  }

  let animFrameId = null;

  function runSlideTimer() {
    if (prefersReducedMotion) return;

    slideStartTime = performance.now() - slideElapsed;

    function tick(now) {
      if (isPaused) return;

      slideElapsed = now - slideStartTime;
      const progress = Math.min(slideElapsed / SLIDE_DURATION, 1);

      const activeSeg = progressSegsEl.querySelector(".work-progress-seg.is-current .work-progress-seg-fill");
      if (activeSeg) {
        activeSeg.style.width = `${progress * 100}%`;
      }

      if (slideElapsed >= SLIDE_DURATION) {
        slideElapsed = 0;
        nextSlide();
      } else {
        animFrameId = requestAnimationFrame(tick);
      }
    }

    cancelAnimationFrame(animFrameId);
    animFrameId = requestAnimationFrame(tick);
  }

  function initSlideTimer() {
    if (prefersReducedMotion) return;
    slideElapsed = 0;
    runSlideTimer();

    if (slideshowContainer) {
      slideshowContainer.addEventListener("mouseenter", () => {
        isPaused = true;
        cancelAnimationFrame(animFrameId);
      });
      slideshowContainer.addEventListener("mouseleave", () => {
        if (isPaused) {
          isPaused = false;
          runSlideTimer();
        }
      });
      slideshowContainer.addEventListener("focusin", () => {
        isPaused = true;
        cancelAnimationFrame(animFrameId);
      });
      slideshowContainer.addEventListener("focusout", () => {
        isPaused = false;
        runSlideTimer();
      });
    }
  }

  function resetSlideTimer() {
    slideElapsed = 0;
    if (!isPaused && !prefersReducedMotion) {
      runSlideTimer();
    }
  }

  function initSwipe() {
    if (!slideshowContainer) return;

    let touchStartX = 0;
    let touchEndX = 0;

    slideshowContainer.addEventListener("touchstart", (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    slideshowContainer.addEventListener("touchend", (e) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    }, { passive: true });

    function handleSwipe() {
      const diff = touchEndX - touchStartX;
      if (Math.abs(diff) > 40) {
        if (diff < 0) {
          nextSlide();
        } else {
          goToSlide(currentSlide - 1);
        }
      }
    }
  }

  // -------------------------------------------------------------------------
  // 3. Trusted Partners Strip Rendering
  // -------------------------------------------------------------------------
  function renderPartnersStrip() {
    const rowEl = document.getElementById("trustedPartnersRow");
    if (!rowEl || !industryPartners) return;

    rowEl.innerHTML = industryPartners.map(p => `
      <div class="work-trusted-item" title="${p.name}">
        <img src="${p.src}" alt="${p.alt}" width="140" height="36" loading="lazy" />
      </div>
    `).join("");
  }

  // -------------------------------------------------------------------------
  // 4. Accordion Toggle Logic
  // -------------------------------------------------------------------------
  function initAccordions() {
    const triggers = document.querySelectorAll(".work-accordion-trigger");
    triggers.forEach(trigger => {
      trigger.addEventListener("click", function () {
        const targetId = this.getAttribute("aria-controls");
        const content = document.getElementById(targetId);
        const isExpanded = this.getAttribute("aria-expanded") === "true";

        if (content) {
          if (isExpanded) {
            this.setAttribute("aria-expanded", "false");
            content.classList.remove("is-open");
          } else {
            this.setAttribute("aria-expanded", "true");
            content.classList.add("is-open");
          }
        }
      });
    });
  }

  // -------------------------------------------------------------------------
  // 5. Dynamic Filter Chips & Live Counts
  // -------------------------------------------------------------------------
  function computeCounts() {
    // Unique industries
    const industriesMap = {};
    // Unique services
    const servicesMap = {};

    projects.forEach(p => {
      industriesMap[p.industrySlug] = (industriesMap[p.industrySlug] || 0) + 1;
      p.services.forEach(s => {
        servicesMap[s] = (servicesMap[s] || 0) + 1;
      });
    });

    return { industriesMap, servicesMap };
  }

  function renderFilterChips() {
    const { industriesMap, servicesMap } = computeCounts();

    // 1. Industry Chips
    if (industryChipsContainer) {
      // "All Industries"
      let html = `
        <button type="button" class="work-filter-chip ${activeIndustry === null ? "is-active" : ""}" data-industry="all" aria-pressed="${activeIndustry === null}">
          <span>All Industries</span>
          <span class="chip-count">${projects.length}</span>
        </button>
      `;

      // Distinct industries list
      const industryList = [
        { name: "Political Strategy", slug: "political-strategy" },
        { name: "IT & Data Science", slug: "it-data-science" },
        { name: "Pet Care", slug: "pet-care" },
        { name: "Wireless Dealer Platform", slug: "wireless-dealer-platform" }
      ];

      industryList.forEach(ind => {
        const count = industriesMap[ind.slug] || 0;
        const isActive = activeIndustry === ind.slug;
        html += `
          <button type="button" class="work-filter-chip ${isActive ? "is-active" : ""}" data-industry="${ind.slug}" aria-pressed="${isActive}">
            <span>${ind.name}</span>
            <span class="chip-count">${count}</span>
          </button>
        `;
      });

      industryChipsContainer.innerHTML = html;

      // Bind industry clicks
      industryChipsContainer.querySelectorAll(".work-filter-chip").forEach(chip => {
        chip.addEventListener("click", function () {
          const slug = this.getAttribute("data-industry");
          if (slug === "all" || activeIndustry === slug) {
            activeIndustry = null;
          } else {
            activeIndustry = slug;
          }
          onFilterChange();
        });
      });
    }

    // 2. Service Chips
    if (serviceChipsContainer) {
      const distinctServices = [
        "Wix Studio Design",
        "Velo Development",
        "SEO",
        "Custom Dashboard"
      ];

      let html = "";
      distinctServices.forEach(srv => {
        const count = servicesMap[srv] || 0;
        const isActive = activeService === srv;
        html += `
          <button type="button" class="work-filter-chip ${isActive ? "is-active" : ""}" data-service="${srv}" aria-pressed="${isActive}">
            <span>${srv}</span>
            <span class="chip-count">${count}</span>
          </button>
        `;
      });

      serviceChipsContainer.innerHTML = html;

      // Bind service clicks
      serviceChipsContainer.querySelectorAll(".work-filter-chip").forEach(chip => {
        chip.addEventListener("click", function () {
          const srv = this.getAttribute("data-service");
          if (activeService === srv) {
            activeService = null;
          } else {
            activeService = srv;
          }
          onFilterChange();
        });
      });
    }
  }

  // -------------------------------------------------------------------------
  // 6. Projects Grid Rendering with AND Logic
  // -------------------------------------------------------------------------
  function filterProjects() {
    return projects.filter(p => {
      // Industry filter
      const matchIndustry = !activeIndustry || p.industrySlug === activeIndustry;
      // Service filter
      const matchService = !activeService || p.services.includes(activeService);
      return matchIndustry && matchService;
    });
  }

  function renderProjectsGrid() {
    if (!projectsGridEl) return;

    const filtered = filterProjects();

    if (filtered.length === 0) {
      projectsGridEl.innerHTML = `
        <div class="work-empty-state">
          <div class="work-empty-icon"><i class="ph ph-folder-notch-open"></i></div>
          <h3 class="work-empty-title">No projects found for this filter combination</h3>
          <p class="work-empty-desc">Try clearing the industry or service filter to view all case studies.</p>
          <button type="button" id="clearFiltersBtn" class="work-empty-reset-btn">
            <i class="ph ph-arrow-counter-clockwise"></i> Clear filters
          </button>
        </div>
      `;

      const clearBtn = document.getElementById("clearFiltersBtn");
      if (clearBtn) {
        clearBtn.addEventListener("click", () => {
          activeIndustry = null;
          activeService = null;
          onFilterChange();
        });
      }
      return;
    }

    projectsGridEl.innerHTML = filtered.map(p => {
      const industryPill = `<span class="work-card-pill pill-industry">${p.industry}</span>`;
      const servicePills = p.services.map(s => `<span class="work-card-pill">${s}</span>`).join("");

      return `
        <article class="work-card-wrap" data-aos="fade-up" data-aos-duration="600">
          <a href="${p.url}" class="work-card" aria-label="Read case study: ${p.title}">
            <div class="work-card-media">
              <img src="${p.image}" alt="${p.imageAlt}" width="600" height="412" loading="lazy" />
            </div>
            <div class="work-card-body">
              <div class="work-card-title-wrap">
                <h3 class="work-card-title">${p.title}</h3>
                <span class="work-card-arrow" aria-hidden="true"><i class="ph ph-arrow-up-right"></i></span>
              </div>
              <p class="work-card-desc">${p.description}</p>
              <div class="work-card-pills">
                ${industryPill}
                ${servicePills}
              </div>
            </div>
          </a>
        </article>
      `;
    }).join("");
  }

  // -------------------------------------------------------------------------
  // 7. URL Query Sync (Bookmarkable & Shareable Filter State)
  // -------------------------------------------------------------------------
  function readUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const indParam = params.get("industry");
    const srvParam = params.get("service");

    if (indParam && ["political-strategy", "it-data-science", "pet-care", "wireless-dealer-platform"].includes(indParam)) {
      activeIndustry = indParam;
    }

    if (srvParam) {
      // Decode and check match
      const decodedSrv = decodeURIComponent(srvParam);
      if (["Wix Studio Design", "Velo Development", "SEO", "Custom Dashboard"].includes(decodedSrv)) {
        activeService = decodedSrv;
        // Expand services accordion if active
        const srvTrigger = document.querySelector('[aria-controls="servicesAccordion"]');
        const srvContent = document.getElementById("servicesAccordion");
        if (srvTrigger && srvContent) {
          srvTrigger.setAttribute("aria-expanded", "true");
          srvContent.classList.add("is-open");
        }
      }
    }
  }

  function updateUrlParams() {
    const params = new URLSearchParams();
    if (activeIndustry) {
      params.set("industry", activeIndustry);
    }
    if (activeService) {
      params.set("service", activeService);
    }

    const newQuery = params.toString() ? `?${params.toString()}` : window.location.pathname;
    const finalUrl = newQuery.startsWith("?") ? `${window.location.pathname}${newQuery}` : newQuery;

    if (window.history && window.history.replaceState) {
      window.history.replaceState({ industry: activeIndustry, service: activeService }, "", finalUrl);
    }
  }

  function onFilterChange() {
    renderFilterChips();
    renderProjectsGrid();
    updateUrlParams();
  }

  // -------------------------------------------------------------------------
  // 8. Initialization
  // -------------------------------------------------------------------------
  function init() {
    readUrlParams();
    renderSlideshow();
    renderPartnersStrip();
    initAccordions();
    renderFilterChips();
    renderProjectsGrid();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
