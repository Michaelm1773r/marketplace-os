"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-helpers";
import {
  websiteBriefSchema,
  createMilestoneSchema,
  updateMilestoneSchema,
  createTaskSchema,
  updateTaskSchema,
  assignFreelancerSchema,
  updateProjectStatusSchema,
} from "@/lib/validations/schemas";

// ── Helper ──────────────────────────────────────────────────────

type ActionResult<T = unknown> = { success: true; data: T } | { success: false; error: string };

async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}

async function requireAdmin() {
  const user = await requireAuth();
  if (!user.roles?.includes("ADMIN")) throw new Error("Forbidden");
  return user;
}

// ── Create Project (Buyer) ──────────────────────────────────────

export async function createProject(formData: FormData): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireAuth();

    const raw = {
      projectType: formData.get("projectType") as string,
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      referenceUrls: JSON.parse((formData.get("referenceUrls") as string) || "[]"),
      referenceNotes: formData.get("referenceNotes") as string || undefined,
      brandNotes: formData.get("brandNotes") as string || undefined,
      copyStatus: formData.get("copyStatus") as string,
      stack: formData.get("stack") as string || "webflow",
      stackNotes: formData.get("stackNotes") as string || undefined,
      integrations: JSON.parse((formData.get("integrations") as string) || "[]"),
      pages: JSON.parse((formData.get("pages") as string) || "[]"),
      budgetMin: Number(formData.get("budgetMin")),
      budgetMax: Number(formData.get("budgetMax")),
      deadline: formData.get("deadline") as string || undefined,
      additionalNotes: formData.get("additionalNotes") as string || undefined,
    };

    const validated = websiteBriefSchema.parse(raw);

    const project = await db.project.create({
      data: {
        title: validated.title,
        type: validated.projectType === "landing_page" ? "LANDING_PAGE" : "MARKETING_SITE",
        status: "PENDING_PLAN",
        brief: validated as object,
        budgetMin: validated.budgetMin,
        budgetMax: validated.budgetMax,
        deadline: validated.deadline ? new Date(validated.deadline) : null,
        buyerId: user.id,
      },
    });

    // Log activity
    await db.activityLogEntry.create({
      data: {
        projectId: project.id,
        actorId: user.id,
        type: "BRIEF_SUBMITTED",
        message: `Project brief submitted: ${validated.title}`,
      },
    });

    // Create default workstreams
    await db.workstream.createMany({
      data: [
        { projectId: project.id, type: "DESIGN" },
        { projectId: project.id, type: "DEVELOPMENT" },
      ],
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/projects");
    revalidatePath("/dashboard/admin/projects");

    return { success: true, data: { id: project.id } };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create project";
    return { success: false, error: message };
  }
}

// ── Create Milestone (Admin) ────────────────────────────────────

export async function createMilestone(input: {
  projectId: string;
  title: string;
  description?: string;
  budgetAmount?: number;
  dueDate?: string;
  sortOrder?: number;
}): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAdmin();
    const validated = createMilestoneSchema.parse(input);

    const milestone = await db.milestone.create({
      data: {
        projectId: validated.projectId,
        title: validated.title,
        description: validated.description || null,
        budgetAmount: validated.budgetAmount || 0,
        dueDate: validated.dueDate ? new Date(validated.dueDate) : null,
        sortOrder: validated.sortOrder || 0,
      },
    });

    await db.activityLogEntry.create({
      data: {
        projectId: validated.projectId,
        type: "MILESTONE_CREATED",
        message: `Milestone created: ${validated.title}`,
      },
    });

    revalidatePath(`/dashboard/admin/projects/${validated.projectId}`);
    return { success: true, data: { id: milestone.id } };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to create milestone" };
  }
}

// ── Update Milestone (Admin) ────────────────────────────────────

export async function updateMilestone(input: {
  id: string;
  title?: string;
  description?: string;
  status?: string;
  budgetAmount?: number;
  dueDate?: string | null;
  sortOrder?: number;
}): Promise<ActionResult> {
  try {
    await requireAdmin();
    const validated = updateMilestoneSchema.parse(input);

    const milestone = await db.milestone.update({
      where: { id: validated.id },
      data: {
        ...(validated.title !== undefined && { title: validated.title }),
        ...(validated.description !== undefined && { description: validated.description }),
        ...(validated.status !== undefined && { status: validated.status as any }),
        ...(validated.budgetAmount !== undefined && { budgetAmount: validated.budgetAmount }),
        ...(validated.dueDate !== undefined && { dueDate: validated.dueDate ? new Date(validated.dueDate) : null }),
        ...(validated.sortOrder !== undefined && { sortOrder: validated.sortOrder }),
      },
    });

    revalidatePath(`/dashboard/admin/projects/${milestone.projectId}`);
    return { success: true, data: null };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to update milestone" };
  }
}

// ── Create Task (Admin) ─────────────────────────────────────────

export async function createTask(input: {
  milestoneId: string;
  workstreamId?: string;
  title: string;
  description?: string;
  acceptanceCriteria?: string[];
  assigneeId?: string;
  dueDate?: string;
  sortOrder?: number;
}): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAdmin();
    const validated = createTaskSchema.parse(input);

    const task = await db.task.create({
      data: {
        milestoneId: validated.milestoneId,
        workstreamId: validated.workstreamId || null,
        title: validated.title,
        description: validated.description || null,
        acceptanceCriteria: validated.acceptanceCriteria || [],
        assigneeId: validated.assigneeId || null,
        dueDate: validated.dueDate ? new Date(validated.dueDate) : null,
        sortOrder: validated.sortOrder || 0,
      },
      include: { milestone: true },
    });

    await db.activityLogEntry.create({
      data: {
        projectId: task.milestone.projectId,
        type: "TASK_CREATED",
        message: `Task created: ${validated.title}`,
      },
    });

    revalidatePath(`/dashboard/admin/projects/${task.milestone.projectId}`);
    return { success: true, data: { id: task.id } };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to create task" };
  }
}

// ── Update Task (Admin) ─────────────────────────────────────────

export async function updateTask(input: {
  id: string;
  title?: string;
  description?: string;
  status?: string;
  acceptanceCriteria?: string[];
  assigneeId?: string | null;
  dueDate?: string | null;
  sortOrder?: number;
}): Promise<ActionResult> {
  try {
    await requireAdmin();
    const validated = updateTaskSchema.parse(input);

    const task = await db.task.update({
      where: { id: validated.id },
      data: {
        ...(validated.title !== undefined && { title: validated.title }),
        ...(validated.description !== undefined && { description: validated.description }),
        ...(validated.status !== undefined && { status: validated.status as any }),
        ...(validated.acceptanceCriteria !== undefined && { acceptanceCriteria: validated.acceptanceCriteria }),
        ...(validated.assigneeId !== undefined && { assigneeId: validated.assigneeId }),
        ...(validated.dueDate !== undefined && { dueDate: validated.dueDate ? new Date(validated.dueDate) : null }),
        ...(validated.sortOrder !== undefined && { sortOrder: validated.sortOrder }),
      },
      include: { milestone: true },
    });

    revalidatePath(`/dashboard/admin/projects/${task.milestone.projectId}`);
    return { success: true, data: null };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to update task" };
  }
}

// ── Assign Freelancer (Admin) ───────────────────────────────────

export async function assignFreelancer(input: {
  taskId: string;
  freelancerUserId: string;
}): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const validated = assignFreelancerSchema.parse(input);

    // Verify freelancer exists
    const freelancer = await db.user.findUnique({
      where: { id: validated.freelancerUserId },
      include: { freelancerProfile: true },
    });
    if (!freelancer || !freelancer.roles.includes("FREELANCER")) {
      return { success: false, error: "Invalid freelancer" };
    }

    const task = await db.task.update({
      where: { id: validated.taskId },
      data: { assigneeId: validated.freelancerUserId },
      include: { milestone: true },
    });

    await db.activityLogEntry.create({
      data: {
        projectId: task.milestone.projectId,
        actorId: admin.id,
        type: "TASK_ASSIGNED",
        message: `${freelancer.name || freelancer.email} assigned to: ${task.title}`,
      },
    });

    // Create notification for freelancer
    await db.notification.create({
      data: {
        userId: validated.freelancerUserId,
        type: "TASK_ASSIGNED",
        title: "New task assigned",
        body: `You've been assigned to: ${task.title}`,
        payload: { projectId: task.milestone.projectId, taskId: task.id },
      },
    });

    revalidatePath(`/dashboard/admin/projects/${task.milestone.projectId}`);
    return { success: true, data: null };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to assign freelancer" };
  }
}

// ── Update Project Status (Admin) ───────────────────────────────

export async function updateProjectStatus(input: {
  projectId: string;
  status: string;
}): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const validated = updateProjectStatusSchema.parse(input);

    await db.project.update({
      where: { id: validated.projectId },
      data: { status: validated.status as any },
    });

    await db.activityLogEntry.create({
      data: {
        projectId: validated.projectId,
        actorId: admin.id,
        type: "STATUS_CHANGED",
        message: `Project status changed to ${validated.status}`,
      },
    });

    revalidatePath(`/dashboard/admin/projects/${validated.projectId}`);
    revalidatePath("/dashboard/admin/projects");
    return { success: true, data: null };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to update status" };
  }
}

// ── Apply Default Milestone Template (Admin) ────────────────────

export async function applyMilestoneTemplate(input: {
  projectId: string;
  template: "landing_page" | "marketing_site";
}): Promise<ActionResult> {
  try {
    await requireAdmin();

    const templates = {
      landing_page: [
        { title: "M1: Discovery & Wireframe", description: "Sitemap, wireframes, and content plan.", budgetPct: 15, days: 5 },
        { title: "M2: Visual Design", description: "Figma mockups for desktop and mobile.", budgetPct: 30, days: 7 },
        { title: "M3: Build & QA", description: "Webflow/WordPress build, responsive testing, tracking setup.", budgetPct: 40, days: 10 },
        { title: "M4: Launch & Handover", description: "Production deploy, documentation, training.", budgetPct: 15, days: 3 },
      ],
      marketing_site: [
        { title: "M1: Discovery & Site Map", description: "Information architecture, wireframes for all pages, content plan.", budgetPct: 12, days: 5 },
        { title: "M2: Visual Design", description: "Figma mockups for all pages, desktop and mobile, design system.", budgetPct: 28, days: 10 },
        { title: "M3: Build", description: "Build all pages, CMS setup, responsive implementation.", budgetPct: 35, days: 12 },
        { title: "M4: Integrations & QA", description: "Tracking, forms, email tool, performance testing.", budgetPct: 15, days: 5 },
        { title: "M5: Launch & Handover", description: "Production deploy, domain setup, documentation, CMS training.", budgetPct: 10, days: 3 },
      ],
    };

    const project = await db.project.findUnique({ where: { id: input.projectId } });
    if (!project) return { success: false, error: "Project not found" };

    const avgBudget = Math.round((project.budgetMin + project.budgetMax) / 2);
    const milestones = templates[input.template];
    const now = new Date();

    let cumulativeDays = 0;
    for (let i = 0; i < milestones.length; i++) {
      const m = milestones[i];
      cumulativeDays += m.days;
      await db.milestone.create({
        data: {
          projectId: input.projectId,
          title: m.title,
          description: m.description,
          budgetAmount: Math.round(avgBudget * (m.budgetPct / 100)),
          sortOrder: i + 1,
          dueDate: new Date(now.getTime() + cumulativeDays * 24 * 60 * 60 * 1000),
        },
      });
    }

    await db.activityLogEntry.create({
      data: {
        projectId: input.projectId,
        type: "TEMPLATE_APPLIED",
        message: `Applied ${input.template} milestone template (${milestones.length} milestones)`,
      },
    });

    revalidatePath(`/dashboard/admin/projects/${input.projectId}`);
    return { success: true, data: null };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to apply template" };
  }
}

// ── Delete Milestone (Admin) ────────────────────────────────────

export async function deleteMilestone(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const milestone = await db.milestone.delete({ where: { id } });
    revalidatePath(`/dashboard/admin/projects/${milestone.projectId}`);
    return { success: true, data: null };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to delete milestone" };
  }
}

// ── Delete Task (Admin) ─────────────────────────────────────────

export async function deleteTask(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const task = await db.task.findUnique({ where: { id }, include: { milestone: true } });
    if (!task) return { success: false, error: "Task not found" };
    await db.task.delete({ where: { id } });
    revalidatePath(`/dashboard/admin/projects/${task.milestone.projectId}`);
    return { success: true, data: null };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to delete task" };
  }
}
