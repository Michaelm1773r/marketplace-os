import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Shield, Zap } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Nav */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-900 flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <span className="font-semibold text-lg text-slate-900">Marketplace OS</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Log in</Button>
            </Link>
            <Link href="/login">
              <Button size="sm">Get Started <ArrowRight className="ml-1 h-4 w-4" /></Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-24 pb-16">
        <div className="max-w-3xl">
          <div className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-700 mb-6">
            <Zap className="h-3.5 w-3.5 mr-1.5" />
            Now accepting website projects
          </div>
          <h1 className="text-5xl font-bold text-slate-900 leading-tight mb-6">
            We deliver your digital project.
            <br />
            <span className="text-blue-800">Not just freelancers.</span>
          </h1>
          <p className="text-xl text-slate-600 mb-8 leading-relaxed">
            Submit a brief. Get a managed execution plan with milestones, QA-verified deliverables,
            and guaranteed outcomes. Every project is orchestrated, quality-checked, and delivered
            on time — for $2k–$5k.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button size="lg">Start a Project <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg">Join as Freelancer</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Value props */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: CheckCircle2,
              title: "QA on every deliverable",
              desc: "Nothing reaches you until it passes our quality checklist. Design accuracy, responsive testing, performance, tracking — all verified.",
            },
            {
              icon: Shield,
              title: "Milestone escrow",
              desc: "Your money is held safely until you approve each milestone. Freelancers get paid on completion. No risk for either side.",
            },
            {
              icon: Zap,
              title: "Managed, not DIY",
              desc: "We handle the project plan, freelancer assignment, dependency tracking, and revision management. You review and approve.",
            },
          ].map((item) => (
            <div key={item.title} className="p-6 rounded-xl border bg-white">
              <item.icon className="h-8 w-8 text-blue-700 mb-4" />
              <h3 className="font-semibold text-lg text-slate-900 mb-2">{item.title}</h3>
              <p className="text-slate-600 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t mt-16">
        <div className="max-w-6xl mx-auto px-6 py-8 text-sm text-slate-500">
          Marketplace OS · Managed delivery for digital projects
        </div>
      </footer>
    </div>
  );
}
