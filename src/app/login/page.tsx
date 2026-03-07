"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await signIn("email", { email, redirect: false, callbackUrl: "/dashboard" });
      setSent(true);
    } catch {
      // Handle error silently — user sees the form again
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <Link href="/" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700 mb-8">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to home
        </Link>

        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto h-12 w-12 rounded-xl bg-blue-900 flex items-center justify-center mb-4">
              <span className="text-white font-bold text-lg">M</span>
            </div>
            <CardTitle>{sent ? "Check your email" : "Sign in"}</CardTitle>
            <CardDescription>
              {sent
                ? `We sent a magic link to ${email}. Click it to sign in.`
                : "Enter your email and we'll send you a magic link."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="text-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-blue-50 mx-auto flex items-center justify-center">
                  <Mail className="h-8 w-8 text-blue-600" />
                </div>
                <p className="text-sm text-slate-500">
                  Didn&apos;t receive it?{" "}
                  <button onClick={() => setSent(false)} className="text-blue-600 hover:underline">
                    Try again
                  </button>
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Sending..." : "Send magic link"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-slate-400 mt-6">
          New here? Enter your email and an account will be created automatically.
        </p>
      </div>
    </div>
  );
}
