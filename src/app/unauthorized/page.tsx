import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert } from "lucide-react";
import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <Card className="w-full max-w-sm text-center">
        <CardHeader>
          <div className="mx-auto h-16 w-16 rounded-full bg-red-50 flex items-center justify-center mb-2">
            <ShieldAlert className="h-8 w-8 text-red-500" />
          </div>
          <CardTitle>Access Denied</CardTitle>
          <CardDescription>You don&apos;t have permission to view this page.</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/dashboard">
            <Button>Go to Dashboard</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
