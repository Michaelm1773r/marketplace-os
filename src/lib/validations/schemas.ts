import { z } from "zod";

// ── Brief Intake ────────────────────────────────────────────────

export const websiteBriefSchema = z.object({
  projectType: z.enum(["landing_page", "marketing_site"]),
  title: z.string().min(3, "Project title must be at least 3 characters"),
  description: z.string().min(20, "Please provide a more detailed description (at least 20 characters)"),
  referenceUrls: z.array(z.string().url("Must be a valid URL")).default([]),
  referenceNotes: z.string().optional(),
  brandNotes: z.string().optional(),
  copyStatus: z.enum(["ready", "needs_writing", "will_provide"]),
  stack: z.enum(["webflow", "wordpress", "other"]).default("webflow"),
  stackNotes: z.string().optional(),
  integrations: z.array(z.string()).default([]),
  pages: z.array(z.string()).min(1, "At least one page/section is required"),
  budgetMin: z.number().min(200000, "Minimum budget is $2,000").max(500000),
  budgetMax: z.number().min(200000).max(500000, "Maximum budget is $5,000"),
  deadline: z.string().optional(),
  additionalNotes: z.string().optional(),
});

export type WebsiteBriefInput = z.infer<typeof websiteBriefSchema>;

// ── Milestone ───────────────────────────────────────────────────

export const createMilestoneSchema = z.object({
  projectId: z.string().cuid(),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  budgetAmount: z.number().min(0).default(0),
  dueDate: z.string().optional(),
  sortOrder: z.number().int().default(0),
});

export const updateMilestoneSchema = z.object({
  id: z.string().cuid(),
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(["UPCOMING", "IN_PROGRESS", "IN_REVIEW", "APPROVED", "COMPLETED"]).optional(),
  budgetAmount: z.number().min(0).optional(),
  dueDate: z.string().nullable().optional(),
  sortOrder: z.number().int().optional(),
});

// ── Task ────────────────────────────────────────────────────────

export const createTaskSchema = z.object({
  milestoneId: z.string().cuid(),
  workstreamId: z.string().cuid().optional(),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  acceptanceCriteria: z.array(z.string()).default([]),
  assigneeId: z.string().cuid().optional(),
  dueDate: z.string().optional(),
  sortOrder: z.number().int().default(0),
});

export const updateTaskSchema = z.object({
  id: z.string().cuid(),
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum([
    "NOT_STARTED", "IN_PROGRESS", "SUBMITTED", "QA_REVIEW",
    "FIX_REQUESTED", "QA_PASSED", "DELIVERED", "APPROVED",
  ]).optional(),
  acceptanceCriteria: z.array(z.string()).optional(),
  assigneeId: z.string().cuid().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  sortOrder: z.number().int().optional(),
});

// ── Assignment ──────────────────────────────────────────────────

export const assignFreelancerSchema = z.object({
  taskId: z.string().cuid(),
  freelancerUserId: z.string().cuid(),
});

// ── Project Status ──────────────────────────────────────────────

export const updateProjectStatusSchema = z.object({
  projectId: z.string().cuid(),
  status: z.enum(["DRAFT", "PENDING_PLAN", "PLAN_REVIEW", "ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"]),
});
