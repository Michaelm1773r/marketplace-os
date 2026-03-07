"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createProject } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ArrowRight, Loader2, Sparkles, CheckCircle2, Plus, X } from "lucide-react";
import Link from "next/link";
import type { WebsiteBriefInput } from "@/lib/validations/schemas";

// ── Types ──────────────────────────────────────────────────────────────────────

interface QuizAnswers {
  businessDescription: string;
  industry: string;
  goals: string[];
  audience: string;
  scope: string;
  pages: string[];
  brandSituation: string;
  lookAndFeel: string;
  referenceUrls: string[];
  copyStatus: string;
  features: string[];
  budgetRange: string;
  deadline: string;
}

type Stage = "quiz" | "generating" | "review" | "submitting";

// ── Constants ──────────────────────────────────────────────────────────────────

const TOTAL_STEPS = 8;

const GOAL_OPTIONS = [
  { value: "generate_leads", label: "Generate leads & demo requests" },
  { value: "explain_product", label: "Explain a product or service" },
  { value: "sell_products", label: "Sell products online" },
  { value: "showcase_work", label: "Showcase portfolio or work" },
  { value: "build_brand", label: "Build brand awareness" },
  { value: "recruit_talent", label: "Attract talent / careers" },
];

const SCOPE_OPTIONS = [
  { value: "landing_page", label: "Single landing page", hint: "One focused page, one goal" },
  { value: "small_site", label: "Small site (3–5 pages)", hint: "Home, about, services, contact" },
  { value: "full_site", label: "Full marketing site (6+ pages)", hint: "Multi-section, blog, resources" },
];

const SUGGESTED_PAGES: Record<string, string[]> = {
  landing_page: ["Hero & CTA", "Features / Benefits", "Social Proof", "Pricing", "FAQ", "Final CTA"],
  small_site: ["Home", "About", "Services", "Case Studies", "Contact"],
  full_site: ["Home", "About", "Services", "Pricing", "Blog", "Resources", "Case Studies", "Careers", "Contact"],
};

const BRAND_OPTIONS = [
  { value: "full_brand", label: "Full brand guidelines", hint: "Logo, colors, fonts, voice" },
  { value: "logo_only", label: "Logo only", hint: "Basic brand assets exist" },
  { value: "no_brand", label: "No brand yet", hint: "Starting from scratch" },
];

const COPY_OPTIONS = [
  { value: "ready", label: "Written and ready", hint: "Copy is approved and ready to use" },
  { value: "will_provide", label: "I'll write it", hint: "I'll provide copy during the project" },
  { value: "needs_writing", label: "Include copywriting", hint: "Needs a professional copywriter" },
];

const FEATURE_OPTIONS = [
  "Contact form",
  "Booking / calendar",
  "Live chat",
  "Blog / CMS",
  "Animations & interactions",
  "Video / media",
  "Lead capture / email opt-in",
  "Multilingual",
  "E-commerce",
  "Member login",
];

const BUDGET_OPTIONS = [
  { value: "$2,000–$3,000", label: "$2,000 – $3,000" },
  { value: "$3,000–$4,000", label: "$3,000 – $4,000" },
  { value: "$4,000–$5,000", label: "$4,000 – $5,000" },
];

const INDUSTRY_OPTIONS = [
  "SaaS / Tech", "E-commerce", "Agency / Creative", "Consulting / Professional Services",
  "Healthcare", "Education", "Finance", "Real Estate", "Startup", "Non-profit", "Other",
];

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatCentsDisplay(cents: number) {
  return `$${(cents / 100).toLocaleString()}`;
}

function parseBriefToFormData(brief: WebsiteBriefInput): FormData {
  const fd = new FormData();
  fd.set("projectType", brief.projectType);
  fd.set("title", brief.title);
  fd.set("description", brief.description);
  fd.set("referenceUrls", JSON.stringify(brief.referenceUrls ?? []));
  fd.set("referenceNotes", brief.referenceNotes ?? "");
  fd.set("brandNotes", brief.brandNotes ?? "");
  fd.set("copyStatus", brief.copyStatus);
  fd.set("stack", brief.stack ?? "webflow");
  fd.set("stackNotes", brief.stackNotes ?? "");
  fd.set("integrations", JSON.stringify(brief.integrations ?? []));
  fd.set("pages", JSON.stringify(brief.pages));
  fd.set("budgetMin", String(brief.budgetMin));
  fd.set("budgetMax", String(brief.budgetMax));
  if (brief.deadline) fd.set("deadline", brief.deadline);
  fd.set("additionalNotes", brief.additionalNotes ?? "");
  return fd;
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function ProgressBar({ step }: { step: number }) {
  return (
    <div className="mb-8">
      <div className="flex justify-between text-xs text-slate-400 mb-2">
        <span>Step {step} of {TOTAL_STEPS}</span>
        <span>{Math.round((step / TOTAL_STEPS) * 100)}% complete</span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-slate-900 rounded-full transition-all duration-500"
          style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
        />
      </div>
    </div>
  );
}

function ChipToggle({
  options,
  selected,
  onChange,
  multi = false,
}: {
  options: { value: string; label: string; hint?: string }[];
  selected: string | string[];
  onChange: (value: string | string[]) => void;
  multi?: boolean;
}) {
  function toggle(val: string) {
    if (multi) {
      const arr = selected as string[];
      onChange(arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val]);
    } else {
      onChange(val);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = multi
          ? (selected as string[]).includes(opt.value)
          : selected === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => toggle(opt.value)}
            className={`rounded-lg border px-4 py-2.5 text-left transition-all ${
              active
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"
            }`}
          >
            <div className="text-sm font-medium">{opt.label}</div>
            {opt.hint && (
              <div className={`text-xs mt-0.5 ${active ? "text-slate-300" : "text-slate-400"}`}>
                {opt.hint}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

function StepNav({
  onBack,
  onNext,
  isFirst = false,
  isLast = false,
  nextLabel = "Next",
  disabled = false,
}: {
  onBack: () => void;
  onNext: () => void;
  isFirst?: boolean;
  isLast?: boolean;
  nextLabel?: string;
  disabled?: boolean;
}) {
  return (
    <div className="flex justify-between pt-6 mt-6 border-t border-slate-100">
      {isFirst ? (
        <Link href="/dashboard/projects">
          <Button variant="ghost" size="sm" className="text-slate-500">
            <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Cancel
          </Button>
        </Link>
      ) : (
        <Button variant="ghost" size="sm" onClick={onBack} className="text-slate-500">
          <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back
        </Button>
      )}
      <Button onClick={onNext} disabled={disabled}>
        {isLast ? (
          <>
            <Sparkles className="h-4 w-4 mr-2" /> {nextLabel}
          </>
        ) : (
          <>
            {nextLabel} <ArrowRight className="h-4 w-4 ml-2" />
          </>
        )}
      </Button>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function NewProjectPage() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("quiz");
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quiz state
  const [answers, setAnswers] = useState<QuizAnswers>({
    businessDescription: "",
    industry: "",
    goals: [],
    audience: "",
    scope: "",
    pages: [],
    brandSituation: "",
    lookAndFeel: "",
    referenceUrls: [],
    copyStatus: "",
    features: [],
    budgetRange: "",
    deadline: "",
  });

  // Generated brief + refinement
  const [generatedBrief, setGeneratedBrief] = useState<WebsiteBriefInput | null>(null);
  const [refinementNote, setRefinementNote] = useState("");
  const [isRefining, setIsRefining] = useState(false);

  // ── Step validation ──────────────────────────────────────────────────────────

  function canAdvance(): boolean {
    switch (step) {
      case 1: return answers.businessDescription.trim().length >= 10;
      case 2: return answers.goals.length > 0;
      case 3: return answers.audience.trim().length >= 5;
      case 4: return answers.scope !== "";
      case 5: return answers.pages.length >= 1;
      case 6: return answers.brandSituation !== "";
      case 7: return answers.copyStatus !== "";
      case 8: return answers.budgetRange !== "";
      default: return true;
    }
  }

  function advance() {
    if (step < TOTAL_STEPS) {
      setStep((s) => s + 1);
    } else {
      generateBrief();
    }
  }

  function goBack() {
    setStep((s) => s - 1);
  }

  // When scope changes, pre-populate pages with suggestions
  function handleScopeChange(val: string) {
    setAnswers((a) => ({
      ...a,
      scope: val,
      pages: SUGGESTED_PAGES[val] ?? [],
    }));
  }

  // ── AI generation ────────────────────────────────────────────────────────────

  async function generateBrief() {
    setStage("generating");
    setError(null);

    try {
      const res = await fetch("/api/generate-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generation failed");

      setGeneratedBrief(data.brief);
      setStage("review");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStage("quiz");
    }
  }

  async function refineBrief() {
    if (!refinementNote.trim() || !generatedBrief) return;
    setIsRefining(true);
    setError(null);

    try {
      const res = await fetch("/api/generate-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ existingBrief: generatedBrief, refinementNote }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Refinement failed");

      setGeneratedBrief(data.brief);
      setRefinementNote("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Refinement failed");
    } finally {
      setIsRefining(false);
    }
  }

  // ── Submit ───────────────────────────────────────────────────────────────────

  async function submitBrief() {
    if (!generatedBrief) return;
    setIsSubmitting(true);
    setError(null);

    const formData = parseBriefToFormData(generatedBrief);
    const result = await createProject(formData);

    if (result.success) {
      router.push(`/dashboard/projects/${result.data.id}`);
    } else {
      setError(result.error);
      setIsSubmitting(false);
    }
  }

  // ── Render helpers ────────────────────────────────────────────────────────────

  const set = (field: keyof QuizAnswers) => (val: string | string[]) =>
    setAnswers((a) => ({ ...a, [field]: val }));

  // ── Render: Generating ───────────────────────────────────────────────────────

  if (stage === "generating") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-2">
            <Loader2 className="h-8 w-8 text-slate-600 animate-spin" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900">Building your project brief…</h2>
          <p className="text-slate-500 text-sm max-w-xs">
            Claude is analysing your answers and writing a detailed, professional spec.
          </p>
        </div>
      </div>
    );
  }

  // ── Render: Review ───────────────────────────────────────────────────────────

  if (stage === "review" && generatedBrief) {
    const b = generatedBrief;
    return (
      <div className="max-w-2xl space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <h1 className="text-2xl font-bold text-slate-900">Your brief is ready</h1>
          </div>
          <p className="text-slate-500 text-sm">Review what Claude generated. Adjust anything with a quick note below.</p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Brief summary */}
        <Card>
          <CardContent className="p-6 space-y-5">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">Project</p>
              <p className="text-lg font-semibold text-slate-900">{b.title}</p>
              <p className="text-xs text-slate-500 mt-0.5 capitalize">{b.projectType.replace("_", " ")} · {b.stack}</p>
            </div>

            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">Description</p>
              <p className="text-sm text-slate-700 leading-relaxed">{b.description}</p>
            </div>

            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Pages & Sections</p>
              <div className="flex flex-wrap gap-1.5">
                {b.pages.map((page) => (
                  <span key={page} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">{page}</span>
                ))}
              </div>
            </div>

            {b.integrations && b.integrations.length > 0 && (
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Integrations</p>
                <div className="flex flex-wrap gap-1.5">
                  {b.integrations.map((i) => (
                    <span key={i} className="rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-700">{i}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-4 pt-2 border-t border-slate-100">
              <div>
                <p className="text-xs text-slate-400">Copy Status</p>
                <p className="text-sm font-medium text-slate-700 capitalize mt-0.5">{b.copyStatus.replace("_", " ")}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Budget</p>
                <p className="text-sm font-medium text-slate-700 mt-0.5">
                  {formatCentsDisplay(b.budgetMin)}–{formatCentsDisplay(b.budgetMax)}
                </p>
              </div>
              {b.deadline && (
                <div>
                  <p className="text-xs text-slate-400">Deadline</p>
                  <p className="text-sm font-medium text-slate-700 mt-0.5">{b.deadline}</p>
                </div>
              )}
            </div>

            {b.brandNotes && (
              <div className="pt-2 border-t border-slate-100">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">Brand Notes</p>
                <p className="text-sm text-slate-600">{b.brandNotes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Refinement chat */}
        <div>
          <p className="text-sm font-medium text-slate-700 mb-2">Want to adjust anything?</p>
          <div className="flex gap-2">
            <Input
              value={refinementNote}
              onChange={(e) => setRefinementNote(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); refineBrief(); } }}
              placeholder='e.g. "Make it more B2B focused" or "Add a pricing page"'
              disabled={isRefining}
              className="flex-1"
            />
            <Button
              variant="outline"
              onClick={refineBrief}
              disabled={isRefining || !refinementNote.trim()}
            >
              {isRefining ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-xs text-slate-400 mt-1.5">Press Enter or click the button to refine with Claude.</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pb-8">
          <Button onClick={submitBrief} disabled={isSubmitting}>
            {isSubmitting ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting…</>
            ) : (
              "Submit Project Brief →"
            )}
          </Button>
          <Button variant="outline" onClick={() => { setStage("quiz"); setStep(1); }}>
            Start Over
          </Button>
        </div>
      </div>
    );
  }

  // ── Render: Quiz steps ───────────────────────────────────────────────────────

  return (
    <div className="max-w-xl">
      <Link
        href="/dashboard/projects"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-6"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Projects
      </Link>

      <ProgressBar step={step} />

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 mb-4">
          {error}
        </div>
      )}

      <Card>
        <CardContent className="p-6">

          {/* Step 1: Business */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Tell us about your business</h2>
                <p className="text-slate-500 text-sm mt-1">The more detail you give, the better Claude can scope your project.</p>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1.5">
                    What does your business do? *
                  </label>
                  <textarea
                    value={answers.businessDescription}
                    onChange={(e) => set("businessDescription")(e.target.value)}
                    rows={3}
                    placeholder="e.g. We make analytics software for e-commerce brands, helping them understand their customer lifetime value…"
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 resize-none"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1.5">Industry (optional)</label>
                  <select
                    value={answers.industry}
                    onChange={(e) => set("industry")(e.target.value)}
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                  >
                    <option value="">Select industry…</option>
                    {INDUSTRY_OPTIONS.map((i) => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Goals */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">What should this website achieve?</h2>
                <p className="text-slate-500 text-sm mt-1">Select all that apply.</p>
              </div>
              <ChipToggle
                options={GOAL_OPTIONS}
                selected={answers.goals}
                onChange={set("goals")}
                multi
              />
            </div>
          )}

          {/* Step 3: Audience */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Who is your ideal visitor?</h2>
                <p className="text-slate-500 text-sm mt-1">Describe your target customer or audience.</p>
              </div>
              <textarea
                value={answers.audience}
                onChange={(e) => set("audience")(e.target.value)}
                rows={3}
                placeholder="e.g. SaaS founders and heads of growth at B2B companies with 10–200 employees, who struggle with churn…"
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 resize-none"
              />
            </div>
          )}

          {/* Step 4: Scope */}
          {step === 4 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">How big should the site be?</h2>
                <p className="text-slate-500 text-sm mt-1">This helps Claude recommend the right scope and pages.</p>
              </div>
              <ChipToggle
                options={SCOPE_OPTIONS}
                selected={answers.scope}
                onChange={(val) => handleScopeChange(val as string)}
              />
            </div>
          )}

          {/* Step 5: Pages */}
          {step === 5 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Which pages do you need?</h2>
                <p className="text-slate-500 text-sm mt-1">We've suggested some based on your scope. Edit freely.</p>
              </div>
              <div className="space-y-2">
                {answers.pages.map((page, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      value={page}
                      onChange={(e) => {
                        const updated = [...answers.pages];
                        updated[i] = e.target.value;
                        set("pages")(updated);
                      }}
                      placeholder={`Page ${i + 1}`}
                    />
                    {answers.pages.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => set("pages")(answers.pages.filter((_, idx) => idx !== i))}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => set("pages")([...answers.pages, ""])}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add Page
                </Button>
              </div>
            </div>
          )}

          {/* Step 6: Brand */}
          {step === 6 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Brand & look and feel</h2>
                <p className="text-slate-500 text-sm mt-1">Help us understand your design direction.</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-2">Brand situation *</label>
                  <ChipToggle
                    options={BRAND_OPTIONS}
                    selected={answers.brandSituation}
                    onChange={set("brandSituation")}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1.5">
                    Describe the look & feel you want
                  </label>
                  <textarea
                    value={answers.lookAndFeel}
                    onChange={(e) => set("lookAndFeel")(e.target.value)}
                    rows={2}
                    placeholder='e.g. "Clean and minimal like Linear.app, dark mode, strong typography, no stock photos"'
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 resize-none"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-2">Reference sites (optional)</label>
                  <div className="space-y-2">
                    {answers.referenceUrls.map((url, i) => (
                      <div key={i} className="flex gap-2">
                        <Input
                          type="url"
                          value={url}
                          onChange={(e) => {
                            const updated = [...answers.referenceUrls];
                            updated[i] = e.target.value;
                            set("referenceUrls")(updated);
                          }}
                          placeholder="https://example.com"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => set("referenceUrls")(answers.referenceUrls.filter((_, idx) => idx !== i))}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => set("referenceUrls")([...answers.referenceUrls, ""])}
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" /> Add URL
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 7: Copy & Features */}
          {step === 7 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Content & features</h2>
                <p className="text-slate-500 text-sm mt-1">Tell us about copy and any must-have functionality.</p>
              </div>
              <div className="space-y-5">
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-2">What about your copy/text? *</label>
                  <ChipToggle
                    options={COPY_OPTIONS}
                    selected={answers.copyStatus}
                    onChange={set("copyStatus")}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-2">Must-have features</label>
                  <div className="flex flex-wrap gap-2">
                    {FEATURE_OPTIONS.map((feature) => {
                      const active = answers.features.includes(feature);
                      return (
                        <button
                          key={feature}
                          type="button"
                          onClick={() =>
                            set("features")(
                              active
                                ? answers.features.filter((f) => f !== feature)
                                : [...answers.features, feature]
                            )
                          }
                          className={`rounded-full border px-3 py-1 text-sm transition-all ${
                            active
                              ? "border-slate-900 bg-slate-900 text-white"
                              : "border-slate-200 bg-white text-slate-600 hover:border-slate-400"
                          }`}
                        >
                          {feature}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 8: Budget & Timeline */}
          {step === 8 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Budget & timeline</h2>
                <p className="text-slate-500 text-sm mt-1">Almost done — just the commercial details.</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-2">Budget range *</label>
                  <ChipToggle
                    options={BUDGET_OPTIONS}
                    selected={answers.budgetRange}
                    onChange={set("budgetRange")}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1.5">
                    Target launch date (optional)
                  </label>
                  <Input
                    type="date"
                    value={answers.deadline}
                    onChange={(e) => set("deadline")(e.target.value)}
                    className="max-w-xs"
                  />
                </div>
              </div>
            </div>
          )}

          <StepNav
            onBack={goBack}
            onNext={advance}
            isFirst={step === 1}
            isLast={step === TOTAL_STEPS}
            nextLabel={step === TOTAL_STEPS ? "Build my brief with Claude" : "Next"}
            disabled={!canAdvance()}
          />
        </CardContent>
      </Card>
    </div>
  );
}
