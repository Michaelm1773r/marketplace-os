import { requireRole } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCents, formatDate } from "@/lib/utils";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default async function AdminProjectsPage() {
  await requireRole("ADMIN");

  const projects = await db.project.findMany({
    include: {
      buyer: { select: { name: true, email: true } },
      milestones: { select: { status: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">All Projects</h1>
        <p className="text-slate-500 mt-1">{projects.length} projects total</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/dashboard/admin/projects/${project.id}`}
                className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-slate-900">{project.title}</p>
                    <StatusBadge status={project.status} />
                  </div>
                  <p className="text-sm text-slate-500">
                    {project.buyer.name || project.buyer.email} ·{" "}
                    {formatCents(project.budgetMin)}–{formatCents(project.budgetMax)} ·{" "}
                    {project.milestones.length} milestones · Created {formatDate(project.createdAt)}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 shrink-0" />
              </Link>
            ))}
            {projects.length === 0 && (
              <p className="text-center py-12 text-slate-500">No projects have been created yet.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: "default" | "secondary" | "success" | "warning" | "destructive" }> = {
    DRAFT: { label: "Draft", variant: "secondary" },
    PENDING_PLAN: { label: "Pending Plan", variant: "warning" },
    PLAN_REVIEW: { label: "Plan Review", variant: "warning" },
    ACTIVE: { label: "Active", variant: "default" },
    COMPLETED: { label: "Completed", variant: "success" },
    CANCELLED: { label: "Cancelled", variant: "destructive" },
  };
  const info = map[status] || { label: status, variant: "secondary" as const };
  return <Badge variant={info.variant}>{info.label}</Badge>;
}
