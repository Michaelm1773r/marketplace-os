import { requireUser } from "@/lib/auth-helpers";
import { Card, CardContent } from "@/components/ui/card";
import { ClipboardCheck } from "lucide-react";

export default async function TasksPage() {
  await requireUser();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Tasks</h1>
        <p className="text-slate-500 mt-1">Tasks assigned to you across all projects.</p>
      </div>

      <Card>
        <CardContent className="text-center py-16">
          <ClipboardCheck className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">No tasks assigned to you yet.</p>
          <p className="text-sm text-slate-400 mt-1">Tasks will appear here when an operator assigns work to you.</p>
        </CardContent>
      </Card>
    </div>
  );
}
