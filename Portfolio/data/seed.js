/**
 * Database Seed & Default Content
 * Contains 100% of the live website content extracted from moizstudio.me
 */

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DATA_FILE = path.resolve(__dirname, 'content.json');

const DEFAULT_CONTENT = {
  admin: {
    username: process.env.ADMIN_USERNAME || "abdulmoiz",
    // Default password hash will be generated during seed
    passwordHash: "",
    isDefaultCredentials: true,
    lastLogin: null,
    failedAttempts: 0,
    lockoutUntil: null
  },
  settings: {
    siteTitle: "Wix Studio Expert & Web Designer | Abdul Moiz",
    tagline: "Custom Wix Website Development for Startups & Businesses",
    canonicalDomain: "https://moizstudio.me",
    defaultMetaTitle: "Wix Studio Expert & Web Designer | Abdul Moiz",
    defaultMetaDescription: "Abdul Moiz is a Wix Studio Expert and Web Designer specializing in premium Wix website design, responsive UI/UX, Wix Velo development, website redesigns and SEO-ready websites.",
    defaultKeywords: "Wix Studio Expert, Wix Web Designer, Wix Studio Web Designer, Wix Website Design, Wix Studio Development, Wix Velo Developer, Wix Velo Development, Wix Website Redesign, Responsive Wix Websites, UI/UX Web Design, Wix SEO, Custom Wix Website, Wix CMS, Wix Ecommerce, Wix Bookings, Figma to Wix, Custom Wix Functionality",
    ogImage: "/assets/images/thumbs/about-three-thumb.jpg",
    favicon: "/assets/images/thumbs/final favicon.png",
    headerLogo: "/assets/images/thumbs/final logo-header.png",
    footerLogo: "/assets/images/thumbs/final logo-footer.png",
    googleSearchConsole: "",
    analyticsHead: "",
    analyticsBody: "",
    maintenanceMode: false,
    copyrightYear: "2026",
    notificationEmail: "contactwithabdulmoiz@gmail.com",
    autoReplySubject: "Thank you for reaching out to Moiz Studio",
    autoReplyText: "Hi there,\n\nThank you for reaching out! I have received your message and will review your project requirements shortly.\n\nBest regards,\nAbdul Moiz | Wix Studio Expert"
  },
  theme: {
    activeTheme: "default",
    tokens: {
      brandOrange: "#FF5A1F",
      brandLime: "#ccff00",
      bgDark: "#09090b",
      bgLight: "#ffffff",
      textDark: "#09090b",
      textLight: "#ffffff",
      textMuted: "#71717a",
      cardBgLight: "#f5f5f5",
      cardBgDark: "#18181b",
      borderDark: "rgba(255, 255, 255, 0.12)",
      borderLight: "#e4e4e7"
    }
  },
  contactInfo: {
    email: "contactwithabdulmoiz@gmail.com",
    phone: "+92 309 8828483",
    whatsappNumber: "923098828483",
    whatsappDefaultMessage: "Hi Abdul Moiz, I came across your profile and would love to discuss my project. Let's connect",
    location: "Lahore, Pakistan (Available Worldwide)",
    socialLinks: [
      {
        id: "linkedin",
        name: "LinkedIn",
        url: "https://www.linkedin.com/in/wixdesignerabdulmoiz",
        icon: "ph ph-linkedin-logo",
        visible: true
      },
      {
        id: "behance",
        name: "Behance",
        url: "https://www.behance.net/moizstudio",
        icon: "ph ph-behance-logo",
        visible: true
      },
      {
        id: "github",
        name: "GitHub",
        url: "https://github.com/AbdulMoiz-Studio",
        icon: "ph ph-github-logo",
        visible: true
      },
      {
        id: "whatsapp",
        name: "WhatsApp",
        url: "https://api.whatsapp.com/send?phone=923098828483&text=Hi%20Abdul%20Moiz%2C%20I%20came%20across%20your%20profile%20and%20would%20love%20to%20discuss%20my%20project.%20Let%E2%80%99s%20connect",
        icon: "ph ph-whatsapp-logo",
        visible: true
      }
    ]
  },
  home: {
    hero: {
      badgeTitle: "WIX STUDIO EXPERT",
      heading: "Custom Wix Website Development for Startups & Businesses",
      description: "I design and build premium, responsive Wix websites for startups and businesses combining strategic UI/UX design, Wix Studio development, custom functionality and SEO-ready foundations.",
      badgeDesktop: "WEB DESIGN, DEVELOPMENT, UI/UX",
      badgeMobile: "Custom Wix Website Development for Startups & Businesses",
      btn1Text: "VIEW MY WORK",
      btn1Link: "/work",
      btn2Text: "LET'S WORK TOGETHER",
      btn2Link: "https://api.whatsapp.com/send?phone=923098828483&text=Hi%20Abdul%20Moiz%2C%20I%20came%20across%20your%20profile%20and%20would%20love%20to%20discuss%20my%20project.%20Let%E2%80%99s%20connect",
      image: "assets/images/shapes/banner-three-man.png"
    },
    stats: [
      { id: "stat-1", count: "80", suffix: "+", label: "Projects Completed", isDark: false, order: 1 },
      { id: "stat-2", count: "2", suffix: "+", label: "Years of Experience", isDark: true, order: 2 },
      { id: "stat-3", count: "WIX STUDIO", suffix: "", label: "Primary Expertise", isDark: false, order: 3 },
      { id: "stat-4", count: "UI/UX + VELO", suffix: "", label: "Design & Development", isDark: true, order: 4 }
    ],
    aboutTeaser: {
      heading: "I DESIGN WEBSITES THAT LOOK PREMIUM & WORK FOR YOUR BUSINESS.",
      image: "assets/images/thumbs/about-three-thumb.jpg",
      paragraphs: [
        "I'm Abdul Moiz, a Wix Studio Expert and Web Designer focused on creating premium, responsive and functional websites for startups, businesses and growing brands.",
        "With 2+ years of experience and 80+ real projects, I work across Wix Studio, Wix Editor, Wix Velo, Figma and UI/UX design to turn business requirements into polished digital experiences.",
        "From website redesigns and responsive layouts to CMS, custom functionality, integrations and SEO-ready setup, I focus on building websites that are not only visually strong but also easy to use and built around real business goals.",
        "My approach combines design thinking, responsive development and business-focused problem solving from the first idea to the final published website."
      ],
      circleBadgeYears: "2+",
      circleBadgeText: "Years Of<br />Wix Studio / Editor<br />Experience"
    },
    featuredWork: {
      title: "WORK",
      subtitle: "FEATURED CASE STUDIES",
      description: "Selected Wix Studio and web design projects built for clients worldwide.",
      projectSlugs: ["mike-nellis", "inpro-analytics", "denver-pet-sitting-company", "vanityxo"]
    },
    processTeaser: {
      tagline: "HOW WE WORK",
      heading: "OUR WEB DEVELOPMENT PROCESS"
    },
    ctaSection: {
      tagline: "HAVE A WEBSITE PROJECT IN MIND?",
      heading: "LET'S BUILD SOMETHING THAT WORKS.",
      description: "Whether you need a new Wix Studio website, a complete Wix redesign, custom functionality or a more professional online presence, let's discuss your requirements and find the right solution.",
      btn1Text: "START A PROJECT",
      btn1Link: "https://api.whatsapp.com/send?phone=923098828483&text=Hi%20Abdul%20Moiz%2C%20I%20came%20across%20your%20profile%20and%20would%20love%20to%20discuss%20my%20project.%20Let%E2%80%99s%20connect",
      btn2Text: "VIEW MY WORK",
      btn2Link: "/work",
      profileThumb: "assets/images/thumbs/footer-three-thumb.jpg",
      profileName: "Abdul Moiz",
      profileTitle: "Wix Studio Expert Web Designer Wix Velo",
      profileBio: "I design premium, responsive and functional websites for startups and businesses using Wix Studio, Wix Editor, Figma and Wix Velo."
    }
  },
  workPage: {
    breadcrumb: "WORK / SELECTED PROJECTS",
    title: "Works that",
    titleAccent: "Power Growth",
    intro: "Explore premium Wix Studio websites and case studies by Abdul Moiz. High-converting, responsive websites built with custom Velo, bold UI/UX, and on-page SEO.",
    statsPillCount: "80+",
    statsPillLabel: "Projects Done",
    trustedIntro: "Over 80+ businesses globally have relied on us to craft their digital products",
    trustedPartners: [
      { id: "partner-1", name: "Aura Tech", src: "/assets/images/industries/placeholder-1.svg", alt: "Aura Tech - Trusted Client Logo", order: 1 },
      { id: "partner-2", name: "Nexus Data", src: "/assets/images/industries/placeholder-2.svg", alt: "Nexus Data - Trusted Client Logo", order: 2 },
      { id: "partner-3", name: "Pulse Labs", src: "/assets/images/industries/placeholder-3.svg", alt: "Pulse Labs - Trusted Client Logo", order: 3 },
      { id: "partner-4", name: "Venture Co", src: "/assets/images/industries/placeholder-4.svg", alt: "Venture Co - Trusted Client Logo", order: 4 },
      { id: "partner-5", name: "Horizon AI", src: "/assets/images/industries/placeholder-5.svg", alt: "Horizon AI - Trusted Client Logo", order: 5 },
      { id: "partner-6", name: "Synapse", src: "/assets/images/industries/placeholder-6.svg", alt: "Synapse - Trusted Client Logo", order: 6 }
    ]
  },
  industries: [
    { id: "ind-1", name: "Personal Brand", slug: "personal-brand", order: 1 },
    { id: "ind-2", name: "Technology", slug: "technology", order: 2 },
    { id: "ind-3", name: "Pet Care", slug: "pet-care", order: 3 },
    { id: "ind-4", name: "Business Platform", slug: "business-platform", order: 4 }
  ],
  servicesList: [
    "Wix Studio Design",
    "Wix Studio Development",
    "Velo Development",
    "UI/UX Design",
    "Custom Dashboard",
    "SEO",
    "Responsive Design"
  ],
  services: [
    {
      id: "srv-1",
      number: "01",
      title: "Wix Studio Design",
      description: "Premium, responsive Wix Studio website design focused on user experience, visual quality and your business goals.",
      bullets: ["Wix Studio", "Responsive Web Design", "UI/UX Design"],
      link: "#contact",
      price: "",
      priceStartingFrom: "",
      showPrice: false,
      order: 1
    },
    {
      id: "srv-2",
      number: "02",
      title: "Wix Website Development",
      description: "Complete Wix website development with responsive layouts, CMS, dynamic content, interactions and business-focused functionality.",
      bullets: ["Wix Studio Development", "CMS & Dynamic Content", "Responsive Breakpoints"],
      link: "#contact",
      price: "",
      priceStartingFrom: "",
      showPrice: false,
      order: 2
    },
    {
      id: "srv-3",
      number: "03",
      title: "Wix Velo & Custom Functionality",
      description: "Build advanced Wix Velo functionality, custom features, dynamic experiences and API integrations when standard Wix features aren't enough.",
      bullets: ["Wix Velo", "Custom Functionality", "API Integrations"],
      link: "#contact",
      price: "",
      priceStartingFrom: "",
      showPrice: false,
      order: 3
    },
    {
      id: "srv-4",
      number: "04",
      title: "UI/UX & Figma Design",
      description: "User-focused UI/UX web design and high-fidelity Figma prototypes designed to improve usability, visual hierarchy and user experience.",
      bullets: ["Figma to Wix", "UI/UX Web Design", "Figma Prototyping"],
      link: "#contact",
      price: "",
      priceStartingFrom: "",
      showPrice: false,
      order: 4
    },
    {
      id: "srv-5",
      number: "05",
      title: "Wix Website Redesign",
      description: "Transform outdated Wix websites with a modern Wix website redesign focused on responsive design, improved UI/UX, performance and usability.",
      bullets: ["Website Redesign", "Mobile Optimization", "Website Performance"],
      link: "#contact",
      price: "",
      priceStartingFrom: "",
      showPrice: false,
      order: 5
    },
    {
      id: "srv-6",
      number: "06",
      title: "SEO & Website Optimization",
      description: "Improve your website's visibility, technical health and search performance with a complete SEO approach covering on-page, off-page and technical SEO.",
      bullets: ["On-Page SEO", "Off-Page SEO", "Technical SEO"],
      link: "#contact",
      price: "",
      priceStartingFrom: "",
      showPrice: false,
      order: 6
    }
  ],
  projects: [
    {
      id: "mike-nellis",
      slug: "mike-nellis",
      title: "Mike Nellis",
      status: "published",
      featured: true,
      order: 1,
      subtitle: "Personal Brand & Consultant",
      categorySubtitle: "WIX STUDIO WEBSITE DESIGN & DEVELOPMENT",
      description: "A premium, fully responsive Wix Studio website built for a personal brand, with a bold visual identity and on-page SEO.",
      shortDesc: "Premium Wix Studio website for a personal brand.",
      industry: "Personal Brand",
      industrySlug: "personal-brand",
      services: ["Wix Studio Design", "SEO"],
      tags: ["Wix Studio", "UI/UX", "Responsive Design"],
      liveUrl: "https://www.mikenellis.com/",
      image: "/assets/images/work/mikenellis-main.png",
      imageAlt: "Mike Nellis Personal Brand Wix Studio Website Case Study Preview",
      breadcrumb: "WIX STUDIO CASE STUDY",
      heroIntro: "A premium Wix Studio website designed and developed to build a strong digital presence, deliver a responsive experience and support on-page SEO.",
      metaBoxes: {
        client: "SOPHIA",
        industry: "PERSONAL BRAND",
        platform: "WIX STUDIO",
        services: "WIX STUDIO DEVELOPMENT"
      },
      challenge: {
        num: "01 / REQUIREMENT",
        title: "THE CHALLENGE",
        desc: "The client needed an experienced Wix Studio designer who could turn their website into a premium, professional platform. It also had to work smoothly on every screen size."
      },
      solution: {
        num: "02 / APPROACH",
        title: "THE SOLUTION",
        desc: "I designed the website around the client's requirements, with a clean visual hierarchy and a confident, polished look. It was built in Wix Studio with fully responsive layouts. On-page SEO was included so the site is ready to be found on search engines."
      },
      outcome: {
        num: "03 / DELIVERABLE",
        title: "THE OUTCOME",
        desc: "The client was happy with the final website. It looked premium, worked well across devices and achieved its purpose."
      },
      gallery: [
        { src: "/assets/images/work/mikenellis-main.png", alt: "MIKE NELLIS - Visual Mockup 1" },
        { src: "/assets/images/work/mike-nellis-1.png", alt: "MIKE NELLIS - Visual Mockup 2" },
        { src: "/assets/images/work/mikenellis-2.png", alt: "MIKE NELLIS - Visual Mockup 3" }
      ],
      testimonial: {
        quote: "Moiz understood exactly what I wanted and delivered a website that looks premium on every device. Really happy with the result.",
        author: "SOPHIA",
        role: "Personal Brand"
      },
      seo: {
        metaTitle: "Mike Nellis | Wix Studio Website Design & Development | Abdul Moiz Portfolio",
        metaDescription: "Explore the Mike Nellis Wix Studio case study by Abdul Moiz. High-impact personal brand website built with a bold visual identity, responsive design, and on-page SEO.",
        ogImage: "/assets/images/work/mikenellis-main.png"
      },
      overrideRelated: []
    },
    {
      id: "inpro-analytics",
      slug: "inpro-analytics",
      title: "Inpro Analytics",
      status: "published",
      featured: true,
      order: 2,
      subtitle: "Technology Company",
      categorySubtitle: "WIX STUDIO & VELO DEVELOPMENT",
      description: "An agency-level Wix Studio website for a technology company, with a custom-built careers page powered by Velo.",
      shortDesc: "Agency-level Wix Studio website with custom Velo features.",
      industry: "Technology",
      industrySlug: "technology",
      services: ["Wix Studio Design", "Velo Development", "SEO"],
      tags: ["Wix Studio", "Velo Development", "SEO"],
      liveUrl: "https://www.inpro-analytics.at/",
      image: "/assets/images/work/inpro-main.png",
      imageAlt: "Inpro Analytics Technology & Velo Website Case Study Preview",
      breadcrumb: "WIX STUDIO CASE STUDY",
      heroIntro: "An agency-level Wix Studio website for a data science and analytics company, with a custom-built careers page powered by Velo.",
      metaBoxes: {
        client: "MANUEL WOLFSGRUBER",
        industry: "TECHNOLOGY",
        platform: "WIX STUDIO & VELO",
        services: "WIX STUDIO & VELO DEVELOPMENT"
      },
      challenge: {
        num: "01 / REQUIREMENT",
        title: "THE CHALLENGE",
        desc: "Inpro Analytics required a modern corporate web presence that reflected their advanced data capabilities and featured a dynamic career portal."
      },
      solution: {
        num: "02 / APPROACH",
        title: "THE SOLUTION",
        desc: "Developed a high-performance Wix Studio architecture integrating Velo datasets for dynamic job postings and tailored responsive layouts."
      },
      outcome: {
        num: "03 / DELIVERABLE",
        title: "THE OUTCOME",
        desc: "Delivered an agency-grade corporate platform that elevated client trust and streamlined candidate applications."
      },
      gallery: [
        { src: "/assets/images/work/inpro-main.png", alt: "INPRO ANALYTICS - Visual Mockup 1" },
        { src: "/assets/images/work/inpro-analytics-1.png", alt: "INPRO ANALYTICS - Visual Mockup 2" },
        { src: "/assets/images/work/inpro-analytics-2.png", alt: "INPRO ANALYTICS - Visual Mockup 3" }
      ],
      testimonial: {
        quote: "Moiz delivered more than a website. The design feels like a real agency site, and the careers page works exactly the way we needed. Highly recommended.",
        author: "MANUEL WOLFSGRUBER",
        role: "Inpro Analytics"
      },
      seo: {
        metaTitle: "Inpro Analytics | Wix Studio Website Case Study | Abdul Moiz Portfolio",
        metaDescription: "Explore Inpro Analytics Wix Studio case study by Abdul Moiz with custom Velo development and sleek modern tech UI.",
        ogImage: "/assets/images/work/inpro-main.png"
      },
      overrideRelated: []
    },
    {
      id: "denver-pet-sitting-company",
      slug: "denver-pet-sitting-company",
      title: "Denver Pet Sitting Company",
      status: "published",
      featured: true,
      order: 3,
      subtitle: "Professional Pet Care Service",
      categorySubtitle: "WIX STUDIO WEBSITE DESIGN",
      description: "A playful, friendly Wix Studio website designed for a pet sitting company, built to connect with pet owners.",
      shortDesc: "Friendly, high-converting Wix Studio website for pet care.",
      industry: "Pet Care",
      industrySlug: "pet-care",
      services: ["Wix Studio Design"],
      tags: ["Wix Studio", "UI/UX", "Responsive Design"],
      liveUrl: "https://www.denverpetsittingcompany.com/",
      image: "/assets/images/work/DPS-main.png",
      imageAlt: "Denver Pet Sitting Company Pet Care Wix Studio Website Case Study Preview",
      breadcrumb: "WIX STUDIO CASE STUDY",
      heroIntro: "A playful, friendly Wix Studio website designed for a pet sitting company, built to connect with pet owners.",
      metaBoxes: {
        client: "OWNER",
        industry: "PET CARE",
        platform: "WIX STUDIO",
        services: "WIX STUDIO DESIGN"
      },
      challenge: {
        num: "01 / REQUIREMENT",
        title: "THE CHALLENGE",
        desc: "Create an approachable, joyful, and trustworthy web presence that encourages pet owners to book pet care services easily."
      },
      solution: {
        num: "02 / APPROACH",
        title: "THE SOLUTION",
        desc: "Crafted warm brand accents, high-contrast CTAs, mobile-optimized booking inquiry pathways, and friendly micro-interactions."
      },
      outcome: {
        num: "03 / DELIVERABLE",
        title: "THE OUTCOME",
        desc: "Significantly increased booking requests and positive client feedback on navigation clarity."
      },
      gallery: [
        { src: "/assets/images/work/DPS-main.png", alt: "Denver Pet Sitting Company - Visual Mockup 1" },
        { src: "/assets/images/work/denver-pet-sitting-company-1.png", alt: "Denver Pet Sitting Company - Visual Mockup 2" },
        { src: "/assets/images/work/denver-pet-sitting-company-2.png", alt: "Denver Pet Sitting Company - Visual Mockup 3" }
      ],
      testimonial: {
        quote: "Loved it! Exactly the playful look we wanted for our business.",
        author: "OWNER",
        role: "Denver Pet Sitting Company"
      },
      seo: {
        metaTitle: "Denver Pet Sitting Company | Wix Studio Design Case Study | Abdul Moiz",
        metaDescription: "Explore Denver Pet Sitting Company case study by Abdul Moiz. High-converting Wix Studio website built with playful UI/UX.",
        ogImage: "/assets/images/work/DPS-main.png"
      },
      overrideRelated: []
    },
    {
      id: "vanityxo",
      slug: "vanityxo",
      title: "VanityXo",
      status: "published",
      featured: false,
      order: 4,
      subtitle: "Business Platform",
      categorySubtitle: "WIX STUDIO & CUSTOM DASHBOARD",
      description: "A complete Wix Studio website with custom user dashboards, a login and sign-up system, and SEO for a growing business platform.",
      shortDesc: "Complete Wix Studio platform with custom user dashboards.",
      industry: "Business Platform",
      industrySlug: "business-platform",
      services: ["Wix Studio Design", "Custom Dashboard", "SEO"],
      tags: ["Wix Studio", "Custom Dashboard", "SEO"],
      liveUrl: "https://vanityxo.com/",
      image: "/assets/images/work/vanity-main.png",
      imageAlt: "VanityXo Business Platform Wix Studio Website Case Study Preview",
      breadcrumb: "WIX STUDIO CASE STUDY",
      heroIntro: "A complete Wix Studio website with custom user dashboards, a login and sign-up system, and SEO for a growing business platform.",
      metaBoxes: {
        client: "FOUNDER",
        industry: "BUSINESS PLATFORM",
        platform: "WIX STUDIO & VELO",
        services: "CUSTOM DASHBOARD & SEO"
      },
      challenge: {
        num: "01 / REQUIREMENT",
        title: "THE CHALLENGE",
        desc: "The client needed user dashboards, authenticated access flows, and SEO-ready public pages for an expanding platform."
      },
      solution: {
        num: "02 / APPROACH",
        title: "THE SOLUTION",
        desc: "Architected role-based dashboards, customized onboarding and registration screens, and integrated performance-focused SEO tags."
      },
      outcome: {
        num: "03 / DELIVERABLE",
        title: "THE OUTCOME",
        desc: "Launched a smooth end-to-end platform enabling rapid user registrations and seamless client interaction."
      },
      gallery: [
        { src: "/assets/images/work/vanity-main.png", alt: "VanityXo - Visual Mockup 1" },
        { src: "/assets/images/work/vanityxo-1.png", alt: "VanityXo - Visual Mockup 2" },
        { src: "/assets/images/work/vanityxo-2.png", alt: "VanityXo - Visual Mockup 3" }
      ],
      testimonial: {
        quote: "We needed a lot more than a regular website: dashboards, login, sign-up, SEO, everything. Moiz handled it all professionally and delivered on time. Great experience working with him.",
        author: "FOUNDER",
        role: "VanityXo"
      },
      seo: {
        metaTitle: "VanityXo | Wix Studio Website Case Study | Abdul Moiz Portfolio",
        metaDescription: "Explore the VanityXo case study by Abdul Moiz with custom dashboards, sign-up flows, and on-page SEO.",
        ogImage: "/assets/images/work/vanity-main.png"
      },
      overrideRelated: []
    }
  ],
  processSteps: [
    { id: "step-1", num: "01", title: "DISCOVER", desc: "Understand your business, goals & requirements.", order: 1 },
    { id: "step-2", num: "02", title: "PLAN", desc: "Define the structure, content & user flow.", order: 2 },
    { id: "step-3", num: "03", title: "DESIGN", desc: "Create a clean, responsive UI in Figma or Wix Studio.", order: 3 },
    { id: "step-4", num: "04", title: "DEVELOP", desc: "Build with Wix Studio, CMS & Velo where required.", order: 4 },
    { id: "step-5", num: "05", title: "OPTIMIZE", desc: "Test responsiveness, performance, usability & SEO.", order: 5 },
    { id: "step-6", num: "06", title: "LAUNCH", desc: "Final review, fixes & website launch.", order: 6 }
  ],
  testimonials: [
    {
      id: "t-1",
      quote: "Moiz understood exactly what I wanted and delivered a website that looks premium on every device. Really happy with the result.",
      author: "SOPHIA",
      role: "Personal Brand",
      photo: "",
      projectSlug: "mike-nellis",
      rating: 5,
      visible: true,
      order: 1
    },
    {
      id: "t-2",
      quote: "Moiz delivered more than a website. The design feels like a real agency site, and the careers page works exactly the way we needed. Highly recommended.",
      author: "MANUEL WOLFSGRUBER",
      role: "Inpro Analytics",
      photo: "",
      projectSlug: "inpro-analytics",
      rating: 5,
      visible: true,
      order: 2
    },
    {
      id: "t-3",
      quote: "Loved it! Exactly the playful look we wanted for our business.",
      author: "OWNER",
      role: "Denver Pet Sitting Company",
      photo: "",
      projectSlug: "denver-pet-sitting-company",
      rating: 5,
      visible: true,
      order: 3
    },
    {
      id: "t-4",
      quote: "We needed a lot more than a regular website: dashboards, login, sign-up, SEO, everything. Moiz handled it all professionally and delivered on time. Great experience working with him.",
      author: "FOUNDER",
      role: "VanityXo",
      photo: "",
      projectSlug: "vanityxo",
      rating: 5,
      visible: true,
      order: 4
    }
  ],
  platforms: [
    { id: "plat-1", name: "Wix Studio", src: "assets/images/thumbs/wix studio-updated.png", alt: "Wix Studio Logo", link: "", order: 1 },
    { id: "plat-2", name: "Wix Editor", src: "assets/images/thumbs/wix editor-updated.png", alt: "Wix Editor Logo", link: "", order: 2 },
    { id: "plat-3", name: "Wix Velo", src: "assets/images/thumbs/wix velo.png", alt: "Wix Velo Logo", link: "", order: 3 },
    { id: "plat-4", name: "Figma", src: "assets/images/thumbs/figma-updated.png", alt: "Figma Logo", link: "", order: 4 },
    { id: "plat-5", name: "Wix CMS", src: "assets/images/thumbs/wix cms-updated.png", alt: "Wix CMS Logo", link: "", order: 5 },
    { id: "plat-6", name: "Wix e-commerce", src: "assets/images/thumbs/wix ecomm updated.png", alt: "Wix e-commerce Logo", link: "", order: 6 },
    { id: "plat-7", name: "Wix Apps", src: "assets/images/thumbs/wix apps logo.png", alt: "Wix Apps Logo", link: "", order: 7 },
    { id: "plat-8", name: "SEO", src: "assets/images/thumbs/seo updated.png", alt: "SEO Logo", link: "", order: 8 }
  ],
  messages: [],
  media: [],
  backups: []
};

async function seed(force = false) {
  if (fs.existsSync(DATA_FILE) && !force) {
    console.log('[Seed] Database content.json already exists. Skipping seed.');
    return;
  }

  const username = process.env.ADMIN_USERNAME || "abdulmoiz";
  const password = process.env.ADMIN_PASSWORD || "shmoiz8483";
  const saltRounds = 12;
  const hash = await bcrypt.hash(password, saltRounds);

  const content = JSON.parse(JSON.stringify(DEFAULT_CONTENT));
  content.admin.username = username;
  content.admin.passwordHash = hash;
  content.admin.isDefaultCredentials = (username === "abdulmoiz" && password === "shmoiz8483");

  // Populate media registry from static images
  const mediaList = [];
  const projectImages = [
    { url: "/assets/images/work/mikenellis-main.png", title: "Mike Nellis Main Mockup", slot: "Project: mike-nellis" },
    { url: "/assets/images/work/mike-nellis-1.png", title: "Mike Nellis Slide 2", slot: "Project: mike-nellis gallery" },
    { url: "/assets/images/work/mikenellis-2.png", title: "Mike Nellis Slide 3", slot: "Project: mike-nellis gallery" },
    { url: "/assets/images/work/inpro-main.png", title: "Inpro Analytics Main", slot: "Project: inpro-analytics" },
    { url: "/assets/images/work/inpro-analytics-1.png", title: "Inpro Slide 2", slot: "Project: inpro-analytics gallery" },
    { url: "/assets/images/work/inpro-analytics-2.png", title: "Inpro Slide 3", slot: "Project: inpro-analytics gallery" },
    { url: "/assets/images/work/DPS-main.png", title: "Denver Pet Sitting Main", slot: "Project: denver-pet-sitting-company" },
    { url: "/assets/images/work/denver-pet-sitting-company-1.png", title: "DPS Slide 2", slot: "Project: denver-pet-sitting-company gallery" },
    { url: "/assets/images/work/denver-pet-sitting-company-2.png", title: "DPS Slide 3", slot: "Project: denver-pet-sitting-company gallery" },
    { url: "/assets/images/work/vanity-main.png", title: "VanityXo Main", slot: "Project: vanityxo" },
    { url: "/assets/images/work/vanityxo-1.png", title: "VanityXo Slide 2", slot: "Project: vanityxo gallery" },
    { url: "/assets/images/work/vanityxo-2.png", title: "VanityXo Slide 3", slot: "Project: vanityxo gallery" },
    { url: "/assets/images/shapes/banner-three-man.png", title: "Hero Banner Cutout", slot: "Home Hero" },
    { url: "/assets/images/thumbs/about-three-thumb.jpg", title: "About Photo", slot: "Home About" },
    { url: "/assets/images/thumbs/footer-three-thumb.jpg", title: "Profile Avatar", slot: "Contact & Footer" },
    { url: "/assets/images/thumbs/final logo-header.png", title: "Header Logo", slot: "Global Header" },
    { url: "/assets/images/thumbs/final logo-footer.png", title: "Footer Logo", slot: "Global Footer" },
    { url: "/assets/images/thumbs/final favicon.png", title: "Favicon", slot: "Global Favicon" }
  ];

  for (const item of projectImages) {
    mediaList.push({
      id: "media-" + Math.random().toString(36).substring(2, 9),
      url: item.url,
      title: item.title,
      alt: item.title,
      slot: item.slot,
      uploadedAt: new Date().toISOString()
    });
  }
  content.media = mediaList;

  fs.writeFileSync(DATA_FILE, JSON.stringify(content, null, 2), 'utf8');
  console.log(`[Seed] Successfully initialized content.json with admin account: ${username}`);
}

if (require.main === module) {
  // Check if force reset requested via CLI argument --reset
  const isReset = process.argv.includes('--reset');
  seed(isReset).then(() => {
    console.log('[Seed] Seeding process complete.');
    process.exit(0);
  }).catch((err) => {
    console.error('[Seed Error]', err);
    process.exit(1);
  });
}

module.exports = { seed, DEFAULT_CONTENT };
