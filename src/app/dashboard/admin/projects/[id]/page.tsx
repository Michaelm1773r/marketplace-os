import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCents, formatDate } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ProjectToolbar } from "./toolbar";
import { MilestoneManager } from "./milestones";
import { BriefView } from "./brief-view";

export default async function AdminProjectDetailPage({ params }: { params: { id: string } }) {
  await requireRole("ADMIN");

  const project = await db.project.findUnique({
    where: { id: params.id },
    include: {
      buyer: { select: { name: true, email: true } },
      milestones: {
        orderBy: { sortOrder: "asc" },
        include: {
          tasks: {
            orderBy: { sortOrder: "asc" },
            include: { assignee: { select: { id: true, name: true, email: true } } },
          },
        },
      },
      workstreams: true,
      activityLog: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });

  if (!project) notFound();

  const freelancers = await db.freelancerProfile.findMany({
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { readinessScore: "desc" },
  });

  const brief = project.brief as Record<string, unknown>;
  const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "success" | "warning" | "destructive" }> = {
    DRAFT: { label: "Draft", variant: "secondary" },
    PENDING_PLAN: { label: "Pending Plan", variant: "warning" },
    PLAN_REVIEW: { label: "Plan Review", variant: "warning" },
    ACTIVE: { label: "Active", variant: "default" },
    ON_HOLD: { label: "On Hold", variant: "secondary" },
    COMPLETED: { label: "Completed", variant: "success" },
    CANCELLED: { label: "Cancelled", variant: "destructive" },
  };
  const status = statusMap[project.status] || { label: project.status, variant: "secondary" as const };

  return (
    <div className="space-y-6">
      <Link href="/dashboard/admin/projects" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4 mr-1" /> All projects
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">{project.title}</h1>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>
          <p className="text-slate-500 mt-1">
            {project.buyer.name || project.buyer.email} &middot;{" "}
            {project.type.replace("_", " ")} &middot;{" "}
            {formatCents(project.budgetMin)}&ndash;{formatCents(project.budgetMax)}
            {project.deadline && <> &middot; Due {formatDate(project.deadline)}</>}
          </p>
        </div>
        <ProjectToolbar projectId={project.id} status={project.status} projectType={project.type} hasMilestones={project.milestones.length > 0} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main content: milestones + tasks */}
        <div className="lg:col-span-2 space-y-6">
          <MilestoneManager
            projectId={project.id}
            milestones={project.milestones.map((m) => ({
              ...m,
              budgetAmount: m.budgetAmount,
              dueDate: m.dueDate?.toISOString() || null,
              tasks: m.tasks.map((t) => ({
                ...t,
                dueDate: t.dueDate?.toISOString() || null,
                assignee: t.assignee,
              })),
            }))}
            workstreams={project.workstreams}
            freelancers={freelancers.map((fp) => ({
              userId: fp.user.id,
              name: fp.user.name || fp.user.email || "Unknown",
              skills: fp.skills,
              availability: fp.availability,
              readinessScore: fp.readinessScore,
            }))}
          />
        </div>

        {/* Sidebar: brief + activity */}
        <div className="space-y-6">
          <BriefView brief={brief} />

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-slate-900">Activity Log</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {project.activityLog.map((entry) => (
                <div key={entry.id} className="text-sm">
                  <p className="text-slate-700">{entry.message}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{formatDate(entry.createdAt)}</p>
                </div>
              ))}
              {project.activityLog.length === 0 && (
                <p className="text-sm text-slate-400">No activity yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
