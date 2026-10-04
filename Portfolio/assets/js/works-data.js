/**
 * Works Data Model - Single Source of Truth
 * Used by the Slideshow, Sticky Filter Sidebar, and Projects Grid.
 * Adding a new project requires adding only one object to the `projects` array below.
 */

const WORKS_DATA = {
  // Industry partner placeholder logos for the "Trusted by 80+ businesses worldwide" strip
  // To replace with real brand logos, simply update the `src` and `alt` fields below.
  industryPartners: [
    {
      id: "partner-1",
      name: "Aura Tech",
      src: "/assets/images/industries/placeholder-1.svg",
      alt: "Aura Tech - Trusted Client Logo"
    },
    {
      id: "partner-2",
      name: "Nexus Data",
      src: "/assets/images/industries/placeholder-2.svg",
      alt: "Nexus Data - Trusted Client Logo"
    },
    {
      id: "partner-3",
      name: "Pulse Labs",
      src: "/assets/images/industries/placeholder-3.svg",
      alt: "Pulse Labs - Trusted Client Logo"
    },
    {
      id: "partner-4",
      name: "Venture Co",
      src: "/assets/images/industries/placeholder-4.svg",
      alt: "Venture Co - Trusted Client Logo"
    },
    {
      id: "partner-5",
      name: "Horizon AI",
      src: "/assets/images/industries/placeholder-5.svg",
      alt: "Horizon AI - Trusted Client Logo"
    },
    {
      id: "partner-6",
      name: "Synapse",
      src: "/assets/images/industries/placeholder-6.svg",
      alt: "Synapse - Trusted Client Logo"
    }
  ],

  // Projects collection
  projects: [
    {
      id: "mike-nellis",
      slug: "mike-nellis",
      title: "Mike Nellis",
      subtitle: "Personal Brand & Consultant",
      description: "A premium, fully responsive Wix Studio website built for a personal brand, with a bold visual identity and on-page SEO.",
      shortDesc: "Premium Wix Studio website for a personal brand.",
      image: "/assets/images/work/mikenellis-main.png",
      imageAlt: "Mike Nellis Personal Brand Wix Studio Website Case Study Preview",
      industry: "Personal Brand",
      industrySlug: "personal-brand",
      services: ["Wix Studio Design", "SEO"],
      tags: ["Wix Studio", "UI/UX", "Responsive Design"],
      url: "/work/mike-nellis",
      liveUrl: "https://www.mikenellis.com/",
      featured: true // Slide 1 in Hero Slideshow
    },
    {
      id: "inpro-analytics",
      slug: "inpro-analytics",
      title: "Inpro Analytics",
      subtitle: "Technology Company",
      description: "An agency-level Wix Studio website for a technology company, with a custom-built careers page powered by Velo.",
      shortDesc: "Agency-level Wix Studio website with custom Velo features.",
      image: "/assets/images/work/inpro-main.png",
      imageAlt: "Inpro Analytics Technology & Velo Website Case Study Preview",
      industry: "Technology",
      industrySlug: "technology",
      services: ["Wix Studio Design", "Velo Development", "SEO"],
      tags: ["Wix Studio", "Velo Development", "SEO"],
      url: "/work/inpro-analytics",
      liveUrl: "https://www.inpro-analytics.at/",
      featured: true // Slide 2 in Hero Slideshow
    },
    {
      id: "denver-pet-sitting-company",
      slug: "denver-pet-sitting-company",
      title: "Denver Pet Sitting Company",
      subtitle: "Professional Pet Care Service",
      description: "A playful, friendly Wix Studio website designed for a pet sitting company, built to connect with pet owners.",
      shortDesc: "Friendly, high-converting Wix Studio website for pet care.",
      image: "/assets/images/work/DPS-main.png",
      imageAlt: "Denver Pet Sitting Company Pet Care Wix Studio Website Case Study Preview",
      industry: "Pet Care",
      industrySlug: "pet-care",
      services: ["Wix Studio Design"],
      tags: ["Wix Studio", "UI/UX", "Responsive Design"],
      url: "/work/denver-pet-sitting-company",
      liveUrl: "https://www.denverpetsittingcompany.com/",
      featured: true // Slide 3 in Hero Slideshow
    },
    {
      id: "vanityxo",
      slug: "vanityxo",
      title: "VanityXo",
      subtitle: "Business Platform",
      description: "A complete Wix Studio website with custom user dashboards, a login and sign-up system, and SEO for a growing business platform.",
      shortDesc: "Complete Wix Studio platform with custom user dashboards.",
      image: "/assets/images/work/vanity-main.png",
      imageAlt: "VanityXo Business Platform Wix Studio Website Case Study Preview",
      industry: "Business Platform",
      industrySlug: "business-platform",
      services: ["Wix Studio Design", "Custom Dashboard", "SEO"],
      tags: ["Wix Studio", "Custom Dashboard", "SEO"],
      url: "/work/vanityxo",
      liveUrl: "https://vanityxo.com/",
      featured: false // Displayed in the Grid
    }
  ]
};

// Export for browser global and CommonJS environments
if (typeof window !== "undefined") {
  window.WORKS_DATA = WORKS_DATA;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = WORKS_DATA;
}
