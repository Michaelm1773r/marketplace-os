import { requireUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCents, formatDate } from "@/lib/utils";
import Link from "next/link";
import { ArrowRight, FolderKanban, Plus } from "lucide-react";

export default async function ProjectsPage() {
  const user = await requireUser();

  const projects = await db.project.findMany({
    where: { buyerId: user.id },
    include: { milestones: { select: { status: true } } },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Projects</h1>
          <p className="text-slate-500 mt-1">{projects.length} projects</p>
        </div>
        <Link href="/dashboard/projects/new">
          <Button><Plus className="h-4 w-4 mr-2" /> New Project</Button>
        </Link>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="text-center py-16">
            <FolderKanban className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 mb-4">No projects yet.</p>
            <Link href="/dashboard/projects/new">
              <Button>Create Your First Project</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {projects.map((project) => {
            const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "success" | "warning" }> = {
              DRAFT: { label: "Draft", variant: "secondary" },
              PENDING_PLAN: { label: "Pending Plan", variant: "warning" },
              PLAN_REVIEW: { label: "Plan Review", variant: "warning" },
              ACTIVE: { label: "Active", variant: "default" },
              COMPLETED: { label: "Completed", variant: "success" },
            };
            const status = statusMap[project.status] || { label: project.status, variant: "secondary" as const };

            return (
              <Link key={project.id} href={`/dashboard/projects/${project.id}`}>
                <Card className="hover:bg-slate-50 transition-colors cursor-pointer">
                  <CardContent className="flex items-center justify-between p-5">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-slate-900">{project.title}</p>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </div>
                      <p className="text-sm text-slate-500">
                        {project.type.replace("_", " ")} · {formatCents(project.budgetMin)}–{formatCents(project.budgetMax)} ·{" "}
                        {project.milestones.length} milestones · {formatDate(project.createdAt)}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-400" />
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
