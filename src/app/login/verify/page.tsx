import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail } from "lucide-react";

export default function VerifyPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <Card className="w-full max-w-sm text-center">
        <CardHeader>
          <div className="mx-auto h-16 w-16 rounded-full bg-blue-50 flex items-center justify-center mb-2">
            <Mail className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle>Check your email</CardTitle>
          <CardDescription>
            A sign-in link has been sent to your email address. Click the link to continue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500">You can close this tab.</p>
        </CardContent>
      </Card>
    </div>
  );
}
