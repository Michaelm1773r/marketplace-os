"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { updateProjectStatus, applyMilestoneTemplate } from "@/lib/actions";
import { Play, Pause, CheckCircle, XCircle, LayoutTemplate, Loader2 } from "lucide-react";

interface ProjectToolbarProps {
  projectId: string;
  status: string;
  projectType: string;
  hasMilestones: boolean;
}

export function ProjectToolbar({ projectId, status, projectType, hasMilestones }: ProjectToolbarProps) {
  const [loading, setLoading] = useState("");

  const handleStatus = async (newStatus: string) => {
    setLoading(newStatus);
    await updateProjectStatus({ projectId, status: newStatus });
    setLoading("");
  };

  const handleTemplate = async () => {
    const template = projectType === "MARKETING_SITE" ? "marketing_site" : "landing_page";
    setLoading("template");
    await applyMilestoneTemplate({ projectId, template });
    setLoading("");
  };

  return (
    <div className="flex flex-wrap gap-2">
      {!hasMilestones && (
        <Button variant="outline" size="sm" onClick={handleTemplate} disabled={!!loading}>
          {loading === "template" ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <LayoutTemplate className="h-4 w-4 mr-1" />}
          Apply Template
        </Button>
      )}

      {status === "PENDING_PLAN" && hasMilestones && (
        <Button size="sm" onClick={() => handleStatus("PLAN_REVIEW")} disabled={!!loading}>
          {loading === "PLAN_REVIEW" ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Play className="h-4 w-4 mr-1" />}
          Send Plan to Buyer
        </Button>
      )}

      {status === "PLAN_REVIEW" && (
        <Button size="sm" onClick={() => handleStatus("ACTIVE")} disabled={!!loading}>
          {loading === "ACTIVE" ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Play className="h-4 w-4 mr-1" />}
          Activate Project
        </Button>
      )}

      {status === "ACTIVE" && (
        <>
          <Button variant="outline" size="sm" onClick={() => handleStatus("ON_HOLD")} disabled={!!loading}>
            <Pause className="h-4 w-4 mr-1" /> Pause
          </Button>
          <Button size="sm" onClick={() => handleStatus("COMPLETED")} disabled={!!loading}>
            <CheckCircle className="h-4 w-4 mr-1" /> Complete
          </Button>
        </>
      )}

      {status === "ON_HOLD" && (
        <Button size="sm" onClick={() => handleStatus("ACTIVE")} disabled={!!loading}>
          <Play className="h-4 w-4 mr-1" /> Resume
        </Button>
      )}

      {!["COMPLETED", "CANCELLED"].includes(status) && (
        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleStatus("CANCELLED")} disabled={!!loading}>
          <XCircle className="h-4 w-4 mr-1" /> Cancel
        </Button>
      )}
    </div>
  );
}
