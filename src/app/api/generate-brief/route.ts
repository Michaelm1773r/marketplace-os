import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Anthropic from "@anthropic-ai/sdk";
import { websiteBriefSchema } from "@/lib/validations/schemas";

const client = new Anthropic();

const SYSTEM_PROMPT = `You are a senior web project manager and strategist at a premium managed marketplace. Your job is to take a buyer's onboarding quiz answers and produce a precise, professional project brief that scopes the work completely.

You have deep expertise in:
- Web project scoping for landing pages and marketing sites
- Webflow, WordPress, and custom-code builds
- Copywriting, UX, and conversion optimization
- Common SaaS, e-commerce, agency, and startup website patterns
- Realistic project timelines and budgets

When generating a brief from quiz answers:
1. Infer the correct projectType: use "landing_page" only for a single-page site focused on one conversion goal; use "marketing_site" for anything with 3+ distinct pages or sections.
2. Write a rich, specific description (60-120 words) that covers: the business context, the website's primary goal, target audience, key user journey, and success criteria. Be concrete, not generic.
3. Generate a tailored pages list. Each entry should be a short page/section name (e.g. "Hero & CTA", "Features", "Pricing", "About Us", "Contact"). Infer sensible pages from the business type and goals — don't just list generic pages.
4. Choose the right stack: default to "webflow" for most sites; choose "wordpress" if a blog, CMS, or heavy content management is needed; choose "other" only if explicitly mentioned.
5. Recommend integrations based on features mentioned (e.g. Calendly for booking, HubSpot/Mailchimp for lead capture, Stripe for payments, Intercom for chat, Google Analytics always, etc.)
6. Set copyStatus correctly from the buyer's answer.
7. Write brandNotes that summarise the aesthetic direction the buyer described.
8. Budget: output as integers in cents. Min=$2,000=200000, Max=$5,000=500000. Use the buyer's stated range; if a single range like "$3k-$4k" is given, set budgetMin=300000 budgetMax=400000. Never go below 200000 or above 500000.
9. Set a professional, specific title: "[Company/Product Name] [Site Type]" or similar — not just "New Website".
10. If a deadline is given, convert it to ISO date string (YYYY-MM-DD format).

When REFINING an existing brief based on a note:
- Only change the fields that are relevant to the refinement note.
- Keep everything else identical.
- Apply the refinement intelligently — if the buyer says "more B2B focused", update the description and possibly the pages/integrations.

IMPORTANT: Respond with ONLY a valid JSON object. No markdown, no explanation, no code fences. The JSON must match this exact shape:
{
  "projectType": "landing_page" | "marketing_site",
  "title": string,
  "description": string,
  "referenceUrls": string[],
  "referenceNotes": string,
  "brandNotes": string,
  "copyStatus": "ready" | "needs_writing" | "will_provide",
  "stack": "webflow" | "wordpress" | "other",
  "stackNotes": string,
  "integrations": string[],
  "pages": string[],
  "budgetMin": number (cents),
  "budgetMax": number (cents),
  "deadline": string | undefined,
  "additionalNotes": string
}`;

function buildGeneratePrompt(answers: QuizAnswers): string {
  return `Generate a complete project brief from the following buyer quiz answers:

Business: ${answers.businessDescription}
Industry: ${answers.industry || "Not specified"}
Goals: ${answers.goals.join(", ")}
Target Audience: ${answers.audience}
Site Size: ${answers.scope}
Requested Pages/Sections: ${answers.pages.join(", ")}
Brand Situation: ${answers.brandSituation}
Look & Feel: ${answers.lookAndFeel || "Not specified"}
Reference Sites: ${answers.referenceUrls.join(", ") || "None"}
Copy Status: ${answers.copyStatus}
Must-Have Features: ${answers.features.join(", ") || "None"}
Budget Range: ${answers.budgetRange}
Launch Deadline: ${answers.deadline || "Not specified"}`;
}

function buildRefinePrompt(existingBrief: object, refinementNote: string): string {
  return `Here is the current project brief:
${JSON.stringify(existingBrief, null, 2)}

The buyer wants to adjust it with this note:
"${refinementNote}"

Return the updated brief as JSON with only the relevant fields changed.`;
}

interface QuizAnswers {
  businessDescription: string;
  industry?: string;
  goals: string[];
  audience: string;
  scope: string;
  pages: string[];
  brandSituation: string;
  lookAndFeel?: string;
  referenceUrls: string[];
  copyStatus: string;
  features: string[];
  budgetRange: string;
  deadline?: string;
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { answers?: QuizAnswers; existingBrief?: object; refinementNote?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { answers, existingBrief, refinementNote } = body;

  if (!answers && (!existingBrief || !refinementNote)) {
    return Response.json({ error: "Provide either answers or existingBrief + refinementNote" }, { status: 400 });
  }

  const userPrompt = answers
    ? buildGeneratePrompt(answers)
    : buildRefinePrompt(existingBrief!, refinementNote!);

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    const rawText = message.content[0].type === "text" ? message.content[0].text : "";

    // Strip any accidental markdown fences
    const jsonText = rawText.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();

    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      return Response.json({ error: "AI returned invalid JSON", raw: rawText }, { status: 502 });
    }

    // Validate against schema (partial — allow optional fields to be missing)
    const result = websiteBriefSchema.safeParse(parsed);
    if (!result.success) {
      return Response.json({ error: "AI output failed validation", issues: result.error.issues }, { status: 502 });
    }

    return Response.json({ brief: result.data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI generation failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
