import { requireRole } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { initials } from "@/lib/utils";

export default async function AdminFreelancersPage() {
  await requireRole("ADMIN");

  const freelancers = await db.freelancerProfile.findMany({
    include: { user: { select: { name: true, email: true, image: true } } },
    orderBy: { readinessScore: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Freelancer Bench</h1>
        <p className="text-slate-500 mt-1">{freelancers.length} freelancers registered</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {freelancers.map((fp) => (
          <Card key={fp.id}>
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-blue-100 text-blue-700 font-medium">
                    {initials(fp.user.name || fp.user.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900">{fp.user.name || fp.user.email}</p>
                  <p className="text-sm text-slate-500 truncate">{fp.user.email}</p>

                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {fp.skills.map((skill) => (
                      <Badge key={skill} variant="secondary" className="text-xs">{skill}</Badge>
                    ))}
                  </div>

                  <div className="grid grid-cols-3 gap-3 mt-4 pt-3 border-t">
                    <div>
                      <p className="text-xs text-slate-500">Readiness</p>
                      <p className="text-sm font-semibold text-slate-900">{fp.readinessScore.toFixed(0)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">On-Time</p>
                      <p className="text-sm font-semibold text-slate-900">{fp.onTimeRate.toFixed(0)}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">QA Pass</p>
                      <p className="text-sm font-semibold text-slate-900">{fp.qaPassRate.toFixed(0)}%</p>
                    </div>
                  </div>
                </div>
                <Badge variant={fp.availability === "available" ? "success" : "secondary"} className="shrink-0">
                  {fp.availability}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
        {freelancers.length === 0 && (
          <Card className="md:col-span-2">
            <CardContent className="text-center py-12 text-slate-500">
              No freelancers have joined yet.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
