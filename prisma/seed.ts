import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ── Admin/Operator ────────────────────────────────
  const admin = await prisma.user.upsert({
    where: { email: "admin@marketplace-os.com" },
    update: {},
    create: {
      email: "admin@marketplace-os.com",
      name: "Platform Operator",
      roles: ["ADMIN"],
      emailVerified: new Date(),
    },
  });
  console.log("  ✓ Admin user created:", admin.email);

  // ── Buyer ─────────────────────────────────────────
  const buyer = await prisma.user.upsert({
    where: { email: "buyer@example.com" },
    update: {},
    create: {
      email: "buyer@example.com",
      name: "Alex Chen",
      roles: ["BUYER"],
      emailVerified: new Date(),
    },
  });
  console.log("  ✓ Buyer user created:", buyer.email);

  // ── Freelancers ───────────────────────────────────
  const freelancerData = [
    {
      email: "designer@example.com",
      name: "Maya Johnson",
      skills: ["UI Design", "Figma", "Brand Identity", "Webflow"],
      rateBandMin: 7500, // $75/hr
      rateBandMax: 12500,
      bio: "Senior UI/UX designer with 8 years of experience in SaaS and e-commerce.",
    },
    {
      email: "developer@example.com",
      name: "James Park",
      skills: ["Webflow", "WordPress", "HTML/CSS", "JavaScript"],
      rateBandMin: 8000,
      rateBandMax: 15000,
      bio: "Full-stack web developer specializing in Webflow and WordPress builds.",
    },
    {
      email: "content@example.com",
      name: "Sarah Miller",
      skills: ["Copywriting", "SEO", "Content Strategy", "Brand Voice"],
      rateBandMin: 5000,
      rateBandMax: 10000,
      bio: "Content strategist and copywriter. Former agency lead.",
    },
  ];

  for (const fd of freelancerData) {
    const user = await prisma.user.upsert({
      where: { email: fd.email },
      update: {},
      create: {
        email: fd.email,
        name: fd.name,
        roles: ["FREELANCER"],
        emailVerified: new Date(),
      },
    });

    await prisma.freelancerProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        skills: fd.skills,
        rateBandMin: fd.rateBandMin,
        rateBandMax: fd.rateBandMax,
        bio: fd.bio,
        availability: "available",
        readinessScore: 85 + Math.random() * 15,
        onTimeRate: 90 + Math.random() * 10,
        qaPassRate: 80 + Math.random() * 20,
        responseTime: 1 + Math.random() * 3,
      },
    });

    console.log("  ✓ Freelancer created:", fd.email);
  }

  // ── Sample Project ────────────────────────────────
  const project = await prisma.project.create({
    data: {
      title: "Acme Corp Landing Page",
      type: "LANDING_PAGE",
      status: "ACTIVE",
      budgetMin: 250000, // $2,500
      budgetMax: 350000, // $3,500
      deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 3 weeks
      buyerId: buyer.id,
      brief: {
        projectType: "landing_page",
        description: "Modern landing page for our new SaaS product. Clean, minimal design with strong CTAs.",
        referenceUrls: ["https://linear.app", "https://vercel.com"],
        brandNotes: "Blue and white color scheme, modern sans-serif typography.",
        copyStatus: "ready",
        stack: "webflow",
        integrations: ["GA4", "Meta Pixel", "Mailchimp"],
        pages: ["Hero", "Features", "Pricing", "Testimonials", "FAQ", "Footer"],
      },
    },
  });

  // Workstreams
  const designWs = await prisma.workstream.create({
    data: { projectId: project.id, type: "DESIGN" },
  });
  const devWs = await prisma.workstream.create({
    data: { projectId: project.id, type: "DEVELOPMENT" },
  });

  // Milestones
  const m1 = await prisma.milestone.create({
    data: {
      projectId: project.id,
      title: "M1: Discovery & Wireframe",
      description: "Sitemap, wireframes, and content plan.",
      status: "COMPLETED",
      budgetAmount: 50000,
      sortOrder: 1,
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    },
  });

  const m2 = await prisma.milestone.create({
    data: {
      projectId: project.id,
      title: "M2: Visual Design",
      description: "Figma mockups for desktop and mobile.",
      status: "IN_PROGRESS",
      budgetAmount: 100000,
      sortOrder: 2,
      dueDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
    },
  });

  const m3 = await prisma.milestone.create({
    data: {
      projectId: project.id,
      title: "M3: Build & QA",
      description: "Webflow build, responsive testing, tracking setup.",
      status: "UPCOMING",
      budgetAmount: 150000,
      sortOrder: 3,
      dueDate: new Date(Date.now() + 19 * 24 * 60 * 60 * 1000),
    },
  });

  const m4 = await prisma.milestone.create({
    data: {
      projectId: project.id,
      title: "M4: Launch & Handover",
      description: "Production deploy, documentation, training.",
      status: "UPCOMING",
      budgetAmount: 50000,
      sortOrder: 4,
      dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
    },
  });

  // Tasks for M2
  const designerUser = await prisma.user.findUnique({ where: { email: "designer@example.com" } });

  await prisma.task.createMany({
    data: [
      {
        milestoneId: m2.id,
        workstreamId: designWs.id,
        assigneeId: designerUser?.id,
        title: "Desktop homepage design",
        description: "Full desktop mockup in Figma based on approved wireframe.",
        acceptanceCriteria: [
          "All 6 sections designed (Hero, Features, Pricing, Testimonials, FAQ, Footer)",
          "Uses brand colors and typography",
          "Includes hover states for interactive elements",
          "Component library started in Figma",
        ],
        status: "IN_PROGRESS",
        sortOrder: 1,
      },
      {
        milestoneId: m2.id,
        workstreamId: designWs.id,
        assigneeId: designerUser?.id,
        title: "Mobile responsive design",
        description: "Mobile-optimized version of all sections.",
        acceptanceCriteria: [
          "All sections adapted for mobile viewport",
          "Navigation collapses to hamburger menu",
          "Touch-friendly tap targets (min 44px)",
        ],
        status: "NOT_STARTED",
        sortOrder: 2,
      },
    ],
  });

  console.log("  ✓ Sample project created with milestones and tasks");

  // Activity log
  await prisma.activityLogEntry.createMany({
    data: [
      { projectId: project.id, actorId: buyer.id, type: "BRIEF_SUBMITTED", message: "Project brief submitted" },
      { projectId: project.id, actorId: admin.id, type: "PLAN_CREATED", message: "Project plan created with 4 milestones" },
      { projectId: project.id, actorId: buyer.id, type: "PLAN_APPROVED", message: "Buyer approved the project plan" },
      { projectId: project.id, actorId: admin.id, type: "MILESTONE_COMPLETED", message: "M1: Discovery & Wireframe completed" },
    ],
  });

  console.log("  ✓ Activity log entries created");
  console.log("\n✅ Seed complete!");
  console.log("\n📧 Test accounts (sign in with magic link using these emails):");
  console.log("   Admin:      admin@marketplace-os.com");
  console.log("   Buyer:      buyer@example.com");
  console.log("   Designer:   designer@example.com");
  console.log("   Developer:  developer@example.com");
  console.log("   Content:    content@example.com");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
