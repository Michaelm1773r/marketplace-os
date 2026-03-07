import { requireUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FolderKanban, Clock, CheckCircle2, AlertCircle, ArrowRight, Plus } from "lucide-react";
import Link from "next/link";
import { formatCents, formatDate } from "@/lib/utils";

export default async function DashboardPage() {
  const user = await requireUser();
  const isAdmin = user.roles?.includes("ADMIN");
  const isFreelancer = user.roles?.includes("FREELANCER");

  if (isAdmin) return <AdminDashboard />;
  if (isFreelancer) return <FreelancerDashboard userId={user.id} />;
  return <BuyerDashboard userId={user.id} />;
}

async function BuyerDashboard({ userId }: { userId: string }) {
  const projects = await db.project.findMany({
    where: { buyerId: userId },
    include: { milestones: true },
    orderBy: { updatedAt: "desc" },
    take: 5,
  });

  const stats = {
    total: projects.length,
    active: projects.filter((p) => p.status === "ACTIVE").length,
    completed: projects.filter((p) => p.status === "COMPLETED").length,
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">Welcome back. Here&apos;s your project overview.</p>
        </div>
        <Link href="/dashboard/projects/new">
          <Button><Plus className="h-4 w-4 mr-2" /> New Project</Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        <StatCard icon={FolderKanban} label="Total Projects" value={stats.total} />
        <StatCard icon={Clock} label="Active" value={stats.active} accent />
        <StatCard icon={CheckCircle2} label="Completed" value={stats.completed} />
      </div>

      {/* Recent projects */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Projects</CardTitle>
          <CardDescription>Your latest projects and their status.</CardDescription>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <div className="text-center py-12">
              <FolderKanban className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 mb-4">No projects yet. Start your first one.</p>
              <Link href="/dashboard/projects/new">
                <Button>Create Project</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/dashboard/projects/${project.id}`}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-slate-50 transition-colors"
                >
                  <div>
                    <p className="font-medium text-slate-900">{project.title}</p>
                    <p className="text-sm text-slate-500 mt-0.5">
                      {formatCents(project.budgetMin)}–{formatCents(project.budgetMax)} · Created {formatDate(project.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={project.status} />
                    <ArrowRight className="h-4 w-4 text-slate-400" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

async function FreelancerDashboard({ userId }: { userId: string }) {
  const tasks = await db.task.findMany({
    where: { assigneeId: userId },
    include: { milestone: { include: { project: true } } },
    orderBy: { updatedAt: "desc" },
    take: 10,
  });

  const activeTasks = tasks.filter((t) => !["APPROVED", "DELIVERED"].includes(t.status));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">Your assigned tasks and upcoming deadlines.</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <StatCard icon={FolderKanban} label="Active Tasks" value={activeTasks.length} accent />
        <StatCard icon={AlertCircle} label="Needs Action" value={activeTasks.filter((t) => t.status === "FIX_REQUESTED").length} />
        <StatCard icon={CheckCircle2} label="Completed" value={tasks.filter((t) => t.status === "APPROVED").length} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Active Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          {activeTasks.length === 0 ? (
            <p className="text-center py-8 text-slate-500">No active tasks. You&apos;re all caught up.</p>
          ) : (
            <div className="space-y-3">
              {activeTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-4 rounded-lg border">
                  <div>
                    <p className="font-medium text-slate-900">{task.title}</p>
                    <p className="text-sm text-slate-500">{task.milestone.project.title} · {task.milestone.title}</p>
                  </div>
                  <TaskStatusBadge status={task.status} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

async function AdminDashboard() {
  const [projects, freelancers] = await Promise.all([
    db.project.findMany({
      include: { milestones: true, buyer: true },
      orderBy: { updatedAt: "desc" },
      take: 10,
    }),
    db.freelancerProfile.findMany({
      include: { user: true },
      orderBy: { readinessScore: "desc" },
      take: 10,
    }),
  ]);

  const activeProjects = projects.filter((p) => p.status === "ACTIVE");
  const pendingReview = projects.filter((p) => ["PENDING_PLAN", "PLAN_REVIEW"].includes(p.status));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Operator Console</h1>
        <p className="text-slate-500 mt-1">Manage all projects, freelancers, and QA reviews.</p>
      </div>

      <div className="grid sm:grid-cols-4 gap-4">
        <StatCard icon={FolderKanban} label="Total Projects" value={projects.length} />
        <StatCard icon={Clock} label="Active" value={activeProjects.length} accent />
        <StatCard icon={AlertCircle} label="Needs Attention" value={pendingReview.length} />
        <StatCard icon={CheckCircle2} label="Freelancers" value={freelancers.length} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Projects</CardTitle>
            <Link href="/dashboard/admin/projects">
              <Button variant="ghost" size="sm">View all <ArrowRight className="h-4 w-4 ml-1" /></Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {projects.slice(0, 5).map((project) => (
                <Link
                  key={project.id}
                  href={`/dashboard/admin/projects/${project.id}`}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-slate-50 transition-colors"
                >
                  <div>
                    <p className="font-medium text-sm text-slate-900">{project.title}</p>
                    <p className="text-xs text-slate-500">{project.buyer.name || project.buyer.email}</p>
                  </div>
                  <StatusBadge status={project.status} />
                </Link>
              ))}
              {projects.length === 0 && (
                <p className="text-center py-6 text-slate-500 text-sm">No projects yet.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Freelancer Bench</CardTitle>
            <Link href="/dashboard/admin/freelancers">
              <Button variant="ghost" size="sm">Manage <ArrowRight className="h-4 w-4 ml-1" /></Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {freelancers.slice(0, 5).map((fp) => (
                <div key={fp.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium text-sm text-slate-900">{fp.user.name || fp.user.email}</p>
                    <p className="text-xs text-slate-500">{fp.skills.slice(0, 3).join(", ")}</p>
                  </div>
                  <Badge variant={fp.availability === "available" ? "success" : "secondary"}>
                    {fp.availability}
                  </Badge>
                </div>
              ))}
              {freelancers.length === 0 && (
                <p className="text-center py-6 text-slate-500 text-sm">No freelancers registered yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ── Shared components ────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, accent }: { icon: React.ElementType; label: string; value: number; accent?: boolean }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", accent ? "bg-blue-100" : "bg-slate-100")}>
          <Icon className={cn("h-5 w-5", accent ? "text-blue-700" : "text-slate-500")} />
        </div>
        <div>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
          <p className="text-sm text-slate-500">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: "default" | "secondary" | "success" | "warning" | "destructive" }> = {
    DRAFT: { label: "Draft", variant: "secondary" },
    PENDING_PLAN: { label: "Pending Plan", variant: "warning" },
    PLAN_REVIEW: { label: "Plan Review", variant: "warning" },
    ACTIVE: { label: "Active", variant: "default" },
    ON_HOLD: { label: "On Hold", variant: "secondary" },
    COMPLETED: { label: "Completed", variant: "success" },
    CANCELLED: { label: "Cancelled", variant: "destructive" },
  };
  const info = map[status] || { label: status, variant: "secondary" as const };
  return <Badge variant={info.variant}>{info.label}</Badge>;
}

function TaskStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: "default" | "secondary" | "success" | "warning" | "destructive" }> = {
    NOT_STARTED: { label: "Not Started", variant: "secondary" },
    IN_PROGRESS: { label: "In Progress", variant: "default" },
    SUBMITTED: { label: "Submitted", variant: "warning" },
    QA_REVIEW: { label: "QA Review", variant: "warning" },
    FIX_REQUESTED: { label: "Fixes Needed", variant: "destructive" },
    QA_PASSED: { label: "QA Passed", variant: "success" },
    DELIVERED: { label: "Delivered", variant: "success" },
    APPROVED: { label: "Approved", variant: "success" },
  };
  const info = map[status] || { label: status, variant: "secondary" as const };
  return <Badge variant={info.variant}>{info.label}</Badge>;
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
