"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface BriefViewProps {
  brief: Record<string, unknown>;
}

export function BriefView({ brief }: BriefViewProps) {
  const pages = (brief.pages as string[]) || [];
  const integrations = (brief.integrations as string[]) || [];
  const referenceUrls = (brief.referenceUrls as string[]) || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold text-slate-900">Project Brief</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {brief.description && (
          <div>
            <p className="font-medium text-slate-500 text-xs uppercase tracking-wider mb-1">Description</p>
            <p className="text-slate-700">{brief.description as string}</p>
          </div>
        )}

        {pages.length > 0 && (
          <div>
            <p className="font-medium text-slate-500 text-xs uppercase tracking-wider mb-1">Pages</p>
            <div className="flex flex-wrap gap-1">{pages.map((p) => <Badge key={p} variant="secondary" className="text-xs">{p}</Badge>)}</div>
          </div>
        )}

        {brief.copyStatus && (
          <div>
            <p className="font-medium text-slate-500 text-xs uppercase tracking-wider mb-1">Copy Status</p>
            <p className="text-slate-700">{{ ready: "Ready", needs_writing: "Needs writing", will_provide: "Will provide" }[(brief.copyStatus as string)] || brief.copyStatus as string}</p>
          </div>
        )}

        {brief.stack && (
          <div>
            <p className="font-medium text-slate-500 text-xs uppercase tracking-wider mb-1">Stack</p>
            <p className="text-slate-700">{(brief.stack as string).charAt(0).toUpperCase() + (brief.stack as string).slice(1)}</p>
          </div>
        )}

        {integrations.length > 0 && (
          <div>
            <p className="font-medium text-slate-500 text-xs uppercase tracking-wider mb-1">Integrations</p>
            <div className="flex flex-wrap gap-1">{integrations.map((i) => <Badge key={i} variant="outline" className="text-xs">{i}</Badge>)}</div>
          </div>
        )}

        {referenceUrls.length > 0 && (
          <div>
            <p className="font-medium text-slate-500 text-xs uppercase tracking-wider mb-1">References</p>
            {referenceUrls.map((url) => (
              <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline block truncate">{url}</a>
            ))}
          </div>
        )}

        {brief.brandNotes && (
          <div>
            <p className="font-medium text-slate-500 text-xs uppercase tracking-wider mb-1">Brand Notes</p>
            <p className="text-slate-700">{brief.brandNotes as string}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
