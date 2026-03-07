import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCents, formatDate } from "@/lib/utils";
import { ArrowLeft, CheckCircle2, Circle, Clock, AlertCircle } from "lucide-react";
import Link from "next/link";

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  const user = await requireUser();

  // Admins redirect to admin view
  if (user.roles?.includes("ADMIN")) {
    redirect(`/dashboard/admin/projects/${params.id}`);
  }

  const project = await db.project.findUnique({
    where: { id: params.id, buyerId: user.id },
    include: {
      milestones: {
        orderBy: { sortOrder: "asc" },
        include: {
          tasks: {
            orderBy: { sortOrder: "asc" },
            include: { assignee: { select: { name: true } } },
          },
        },
      },
      activityLog: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });

  if (!project) notFound();

  const brief = project.brief as Record<string, unknown>;
  const statusColors: Record<string, string> = {
    DRAFT: "secondary",
    PENDING_PLAN: "warning",
    PLAN_REVIEW: "warning",
    ACTIVE: "default",
    COMPLETED: "success",
    CANCELLED: "destructive",
  };

  const totalBudget = project.milestones.reduce((sum, m) => sum + m.budgetAmount, 0);
  const completedMs = project.milestones.filter((m) => ["APPROVED", "COMPLETED"].includes(m.status)).length;

  return (
    <div className="space-y-6">
      <Link href="/dashboard/projects" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4 mr-1" /> My projects
      </Link>

      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-900">{project.title}</h1>
          <Badge variant={(statusColors[project.status] || "secondary") as any}>
            {project.status.replace("_", " ")}
          </Badge>
        </div>
        <p className="text-slate-500 mt-1">
          {project.type.replace("_", " ")} &middot; {formatCents(project.budgetMin)}&ndash;{formatCents(project.budgetMax)}
          {project.deadline && <> &middot; Due {formatDate(project.deadline)}</>}
        </p>
      </div>

      {/* Status banner */}
      {project.status === "PENDING_PLAN" && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
          <Clock className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-900">Plan in progress</p>
            <p className="text-sm text-amber-700 mt-0.5">Our team is reviewing your brief and creating a project plan. You&#39;ll be notified when it&#39;s ready for review.</p>
          </div>
        </div>
      )}

      {project.status === "PLAN_REVIEW" && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-blue-900">Plan ready for your review</p>
            <p className="text-sm text-blue-700 mt-0.5">Review the milestones below. Once you&#39;re happy with the plan, our team will activate the project and work begins.</p>
          </div>
        </div>
      )}

      {/* Summary stats */}
      {project.milestones.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-slate-900">{project.milestones.length}</p>
              <p className="text-sm text-slate-500">Milestones</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-slate-900">{completedMs}/{project.milestones.length}</p>
              <p className="text-sm text-slate-500">Completed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-slate-900">{totalBudget > 0 ? formatCents(totalBudget) : "\u2014"}</p>
              <p className="text-sm text-slate-500">Total Budget</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Milestones */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Project Plan</h2>

          {project.milestones.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12 text-slate-500">
                No milestones created yet. Our team is working on your plan.
              </CardContent>
            </Card>
          ) : (
            project.milestones.map((ms, idx) => {
              const isComplete = ["APPROVED", "COMPLETED"].includes(ms.status);
              const isActive = ms.status === "IN_PROGRESS" || ms.status === "IN_REVIEW";

              return (
                <Card key={ms.id} className={isActive ? "border-blue-200 bg-blue-50/30" : ""}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {isComplete ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                        ) : isActive ? (
                          <Clock className="h-5 w-5 text-blue-500" />
                        ) : (
                          <Circle className="h-5 w-5 text-slate-300" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <CardTitle className="text-base">{ms.title}</CardTitle>
                          {ms.budgetAmount > 0 && (
                            <span className="text-sm text-slate-500">{formatCents(ms.budgetAmount)}</span>
                          )}
                        </div>
                        {ms.description && <p className="text-sm text-slate-500 mt-1">{ms.description}</p>}
                        {ms.dueDate && (
                          <p className="text-xs text-slate-400 mt-1">
                            Due {formatDate(ms.dueDate)}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  {ms.tasks.length > 0 && (
                    <CardContent className="pt-0">
                      <div className="ml-8 space-y-2">
                        {ms.tasks.map((task) => (
                          <div key={task.id} className="flex items-center gap-2 text-sm">
                            {["APPROVED", "QA_PASSED", "DELIVERED"].includes(task.status) ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                            ) : task.status === "IN_PROGRESS" ? (
                              <Clock className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                            ) : (
                              <Circle className="h-3.5 w-3.5 text-slate-300 shrink-0" />
                            )}
                            <span className={`${["APPROVED", "QA_PASSED", "DELIVERED"].includes(task.status) ? "text-slate-400 line-through" : "text-slate-700"}`}>
                              {task.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })
          )}
        </div>

        {/* Activity */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Recent Activity</CardTitle>
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
