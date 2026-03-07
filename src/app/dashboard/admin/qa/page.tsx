import { requireRole } from "@/lib/auth-helpers";
import { Card, CardContent } from "@/components/ui/card";
import { ClipboardCheck } from "lucide-react";

export default async function AdminQAPage() {
  await requireRole("ADMIN");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">QA Queue</h1>
        <p className="text-slate-500 mt-1">Review submitted deliverables awaiting QA.</p>
      </div>

      <Card>
        <CardContent className="text-center py-16">
          <ClipboardCheck className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 mb-2">No submissions awaiting QA review.</p>
          <p className="text-sm text-slate-400">Submissions will appear here when freelancers submit deliverables.</p>
        </CardContent>
      </Card>
    </div>
  );
}
