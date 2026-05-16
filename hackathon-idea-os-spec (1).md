# Hackathon Idea OS — Finalized Master Spec
**Generated:** May 16, 2026 | **Build window:** 4 hours | **Status:** Build-ready

---

## Decisions Log

| Decision | Choice | Rationale |
|---|---|---|
| Timeline | 4 hours | Hackathon build — ship tonight |
| AI Provider | OpenAI GPT-4o | Structured JSON outputs via response_format |
| State/DB | localStorage only | No backend, no Supabase, no auth friction |
| Hackathon Discovery | Paste URL + full web search | Both modes, web search via GPT-4o with browsing |
| Primary audience | Other frequent hackers (public) | Ship-worthy, not just personal tool |
| Demo north star | Full flow: profile → ideas → final plan | This must work end-to-end |
| Export | Download as .md file | Single button, no copy-paste friction |
| Design | Clean minimal light (Notion-ish) | Readable, fast, credible |
| Cuttable pages | /compare (top 3 comparison table) | Cut if time runs out — keep rest |

---

## One-Line Vision

> **It turns a hackathon page and your GitHub into a winning project plan.**

---

## Product Summary

**Hackathon Idea OS** is a session-based web app for frequent hackathon builders. It combines your GitHub profile + a hackathon's tracks/sponsors + a quick life-context interview to generate 10 personalized project ideas with win scores, then produces a build-ready plan you can start executing immediately.

---

## MVP Pages (Ordered by Priority)

### Must ship (non-negotiable)
| Page | Purpose |
|---|---|
| `/` | Landing — pitch + CTA to start |
| `/onboarding` | GitHub username + short profile form |
| `/discover` | Paste Lu.ma URL or web search for hackathons |
| `/hackathon` | Extracted tracks/sponsors/prizes display |
| `/questions` | Adaptive life-context wizard (5–7 questions) |
| `/ideas` | 10 idea cards with scores |
| `/final-plan` | Full plan output + Download .md |

### Cut if time runs out
| Page | Status |
|---|---|
| `/compare` | **CUTTABLE** — replace with inline top-3 highlight on `/ideas` |

---

## Tech Stack (Locked)

```
Frontend:   Next.js 14 + TypeScript + Tailwind CSS + shadcn/ui
AI:         OpenAI GPT-4o (response_format: json_object for structured outputs)
State:      localStorage only — no Supabase, no accounts, no auth
GitHub:     Public REST API — no OAuth
Deployment: Vercel
Export:     Blob download → .md file (client-side)
```

**No backend database. No accounts. No OAuth. No background jobs.**

Session state flows through `localStorage` keyed by a random `sessionId` generated on first visit. All AI calls go through Next.js API routes (server-side, keeps OpenAI key secure).

---

## API Routes

```
POST /api/github/profile
  Input:  { githubUsername: string }
  Output: GitHubSignals

POST /api/hackathons/extract
  Input:  { lumaUrl?: string, rawText?: string }
  Output: Hackathon

POST /api/hackathons/search
  Input:  { query: string }
  Output: HackathonSearchResult[]
  Note:   Uses GPT-4o with web browsing or SerpAPI fallback

POST /api/questions/life
  Input:  { userProfile: UserProfile, hackathon: Hackathon }
  Output: AdaptiveQuestion[]

POST /api/ideas/generate
  Input:  { userProfile: UserProfile, hackathon: Hackathon, answers: Answer[] }
  Output: Idea[10]

POST /api/plan/generate
  Input:  { selectedIdea: Idea, userProfile: UserProfile, hackathon: Hackathon }
  Output: FinalPlan
```

---

## Core Data Models

```typescript
type UserProfile = {
  sessionId: string;
  githubUsername?: string;
  role: "student" | "engineer" | "founder" | "designer" | "other";
  experienceLevel: "beginner" | "intermediate" | "advanced" | "frequent_hacker";
  preferredStack: string[];
  interests: string[];
  lifeContexts: string[];
  personalProblems: string[];
  communityProblems: string[];
  githubSignals: GitHubSignals;
};

type GitHubSignals = {
  languages: string[];
  frameworks: string[];
  projectThemes: string[];
  repoEvidence: { repo: string; signals: string[] }[];
};

type Hackathon = {
  id: string;
  source: "luma" | "web_search" | "manual";
  url?: string;
  title: string;
  date?: string;
  location?: string;
  theme?: string;
  description: string;
  tracks: Track[];
  sponsors: Sponsor[];
  prizes: Prize[];
  judgingCriteria: string[];
  rules: string[];
  extractedConfidence: number; // 0–100
  fitScore: number;            // 0–100
};

type Track = {
  name: string;
  description: string;
  winningAngle: string;
};

type Sponsor = {
  name: string;
  whatTheyLikelyWant: string;
  projectHooks: string[];
};

type Idea = {
  id: string;
  title: string;
  oneLiner: string;
  problem: string;
  personalConnection: string;
  targetUser: string;
  trackFit: string;
  sponsorFit: string;
  demoMoment: string;
  mvpFeatures: string[];
  stretchFeatures: string[];
  suggestedStack: string[];
  winScore: number;        // 0–100
  feasibilityScore: number;
  noveltyScore: number;
  sponsorScore: number;
  risks: string[];
  scope: "small" | "medium" | "risky";
};

type FinalPlan = {
  projectName: string;
  oneLiner: string;
  problem: string;
  solution: string;
  whyItFitsHackathon: string;
  trackSponsorAlignment: string;
  userFlow: string[];
  mvpFeatures: string[];
  stretchFeatures: string[];
  cutIfBehind: string[];
  architecture: string;
  stack: string[];
  dataModel: string;
  apiList: string[];
  timeline: TimelineBlock[];
  tasks: Task[];
  demoScript: string;
  pitchScript: string;
  judgingStrategy: string[];
  risks: string[];
  submissionChecklist: string[];
};

type TimelineBlock = {
  hours: string;   // e.g. "0–1"
  label: string;
  tasks: string[];
};

type Task = {
  title: string;
  priority: "must" | "should" | "stretch";
  estimatedMinutes: number;
};
```

---

## Agent Architecture (6 Agents, All via GPT-4o JSON Mode)

### Agent 1 — Profile Agent
**Input:** GitHub repos + onboarding answers  
**Output:** Structured `GitHubSignals` + builder profile summary  
**Prompt focus:** Infer languages, frameworks, project patterns, winning advantages, life contexts

### Agent 2 — Hackathon Extraction Agent
**Input:** Lu.ma URL page text or raw pasted text  
**Output:** `Hackathon` object  
**Prompt focus:** Extract tracks, sponsors, prizes, judging criteria, rules, APIs — never invent missing data, use null

### Agent 3 — Hackathon Search Agent *(new — web search mode)*
**Input:** Free-text query e.g. "AI agents hackathon SF this weekend"  
**Output:** `HackathonSearchResult[]` — title, url, date, location, brief description  
**Implementation:** GPT-4o with web browsing tool or SerpAPI → parse results → display as ranked list for user to select

### Agent 4 — Question Agent
**Input:** `UserProfile` + `Hackathon`  
**Output:** 5–7 adaptive questions  
**Prompt focus:** Generate high-signal questions based on tracks, sponsors, user role, and interests. No generic questions.

### Agent 5 — Ideation Agent
**Input:** `UserProfile` + `Hackathon` + `Answer[]`  
**Output:** Exactly 10 `Idea` objects  
**Prompt focus:** Maximize win probability, sponsor/track fit, personal relevance, demo clarity, feasibility

### Agent 6 — Planning Agent
**Input:** Selected `Idea` + `UserProfile` + `Hackathon`  
**Output:** `FinalPlan`  
**Prompt focus:** Concrete, executable. Hour-by-hour timeline. Real stack. Real demo script. Real pitch.

---

## Score Formulas

### Hackathon Fit Score
```
HackathonFitScore =
  25%  track / user skill fit
+ 20%  sponsor / API opportunity
+ 20%  win potential (theme match, judging clarity)
+ 15%  logistics (date, location, format)
+ 10%  theme-personal relevance
+ 10%  organizer / prize clarity
```

### Idea Win Score
```
IdeaWinScore =
  20%  sponsor / track fit
+ 20%  personal authenticity
+ 20%  feasibility within hackathon time
+ 15%  demo wow factor
+ 15%  originality
+ 10%  pitch clarity
```

---

## Adaptive Question Logic

| Condition | Extra Questions |
|---|---|
| `role === "student"` | Ask about classes, clubs, campus workflows, study groups |
| `interests.includes("AI agents")` | Ask what repetitive workflow could become an agent |
| `hackathon.sponsors.length > 0` | Ask which sponsor API they're most willing to use |
| `experienceLevel === "frequent_hacker"` | Ask what they've tried before that almost won |
| `lifeContexts.includes("event planning")` | Ask about event coordination pain points |

Questions are presented as a **guided wizard** (not freeform chat). One question per screen. Progress bar shown.

---

## Hackathon Discovery — Both Modes

### Mode A: Paste URL (primary)
1. User pastes `https://lu.ma/...` or any event URL
2. Server fetches page HTML → strips to readable text
3. Extraction Agent parses structured `Hackathon` object
4. If fetch fails (CORS/bot block): show text paste fallback immediately

### Mode B: Web Search
1. User types query: "AI hackathon SF this weekend"
2. Search Agent uses GPT-4o web browsing (or SerpAPI) to find results
3. Returns ranked list of hackathons with title, date, URL
4. User selects one → flows into Mode A extraction

---

## Design Spec — Clean Minimal Light

**Vibe:** Notion meets Linear. Fast, dense information, readable at a glance. No gradients. No decorative noise. Every element earns its place.

**Typography:**
- Display: `Instrument Serif` or `Lora` — editorial warmth
- Body/UI: `Geist` or `DM Sans` — clean, readable
- Monospace (for code/stack): `Geist Mono`

**Color palette:**
```
Background:   #FAFAF9  (off-white, not pure white)
Surface:      #FFFFFF
Border:       #E5E4E2
Text primary: #1A1A1A
Text muted:   #6B7280
Accent:       #18181B  (near-black for CTAs)
Score green:  #16A34A
Score yellow: #D97706
Score red:    #DC2626
Badge bg:     #F4F4F5
```

**Component patterns:**
- Idea cards: white card, left border accent colored by score, score badge top-right
- Score badges: pill-shaped, color-coded (green 80+, yellow 60–79, red <60)
- Progress: top horizontal step bar, 6 steps
- Final plan: collapsible sections, monospace timeline block
- Export button: bottom-right sticky, "Download Plan (.md)"

**No dark mode for MVP.** Keep it simple.

---

## Prompt Templates (Locked)

### Hackathon Extraction
```
You are extracting structured hackathon information from event page content.
Return ONLY valid JSON. No preamble, no markdown.

Extract exactly these fields:
title, date, location, theme, description,
tracks (name, description, winningAngle),
sponsors (name, whatTheyLikelyWant, projectHooks),
prizes (name, amount, track),
judgingCriteria, rules, apisOrTools,
extractedConfidence (0-100 based on how complete the data is)

Rules:
- Never invent sponsors, tracks, prizes, or rules
- Use null for missing scalar fields
- Use [] for missing array fields
- extractedConfidence should be low if critical fields are missing
```

### Idea Generation
```
You are helping a frequent hackathon builder choose what to build.
Return ONLY valid JSON: an array of exactly 10 idea objects.

Each idea must maximize:
1. Chance of winning this specific hackathon
2. Personal relevance to this specific builder
3. Sponsor/track alignment
4. Feasibility within the hackathon time window
5. Demo clarity — does it show well in 2 minutes?

Use the full user profile, hackathon context, sponsor list, tracks, and life answers.
Bias toward: AI agents, student tools, event automation, memory systems, useful productivity.
Avoid: ideas that require weeks of data, ideas with no demo moment, generic CRUD apps.

Each idea must include all fields from the Idea schema.
Score honestly — not everything should be 90+.
```

### Final Planning
```
Create a build-ready hackathon execution plan.
Return ONLY valid JSON matching the FinalPlan schema.

The plan must be immediately executable. Optimize for: finishing the MVP, winning the specific hackathon, and delivering a clear demo.

Timeline must be hour-by-hour from Hour 0.
Tasks must be prioritized: must / should / stretch.
Demo script must be under 2 minutes when read aloud.
Pitch script must answer: what, why, who, how, and why us.
cutIfBehind must be real features to drop if running late.
submissionChecklist must include every step needed to actually submit.
```

---

## localStorage Schema

All state lives under `hackathon-idea-os-{sessionId}`:

```typescript
{
  sessionId: string,
  step: number,            // current step 1–6
  userProfile: UserProfile,
  selectedHackathon: Hackathon,
  lifeAnswers: Answer[],
  generatedIdeas: Idea[],
  selectedIdeaId: string,
  finalPlan: FinalPlan
}
```

Helper: `useSession()` hook — reads/writes to localStorage, triggers re-render on change.

---

## Build Timeline (4 Hours)

```
Hour 0–0:30   Scaffold: Next.js, Tailwind, shadcn/ui, folder structure, localStorage hook
Hour 0:30–1   Landing page + /onboarding form (GitHub username + profile fields)
Hour 1–1:30   /api/github/profile + /discover page (URL paste + search input)
Hour 1:30–2   /api/hackathons/extract + /hackathon display page (tracks/sponsors cards)
Hour 2–2:30   /questions wizard (5 questions, progress bar, adaptive logic)
Hour 2:30–3   /api/ideas/generate + /ideas page (10 cards with scores, select flow)
Hour 3–3:30   /api/plan/generate + /final-plan page (full plan sections, Download .md)
Hour 3:30–4   Polish: loading states, error states, seed demo data, Vercel deploy
```

**Cut order if behind:**
1. Web search mode (keep URL paste only)
2. /questions wizard (use 3 hardcoded questions instead)
3. GitHub extraction (use manual skills input instead)

---

## Final Plan Export Format (.md)

```markdown
# [Project Name]
> [One-liner]

## Problem
...

## Why This Fits [Hackathon Name]
...

## Track & Sponsor Alignment
...

## Core User Flow
1. ...

## MVP Features
- ...

## Architecture
...

## Tech Stack
- ...

## Hour-by-Hour Timeline
| Hours | Focus | Tasks |
|-------|-------|-------|
| 0–1   | ...   | ...   |

## Task Breakdown
### Must Ship
- [ ] ...

### Should Ship
- [ ] ...

### Stretch
- [ ] ...

## Demo Script (< 2 min)
...

## Pitch Script
...

## Judging Strategy
...

## Cut If Behind Schedule
- ...

## Submission Checklist
- [ ] ...
```

---

## MVP Acceptance Criteria

A successful MVP lets a user:

1. Enter GitHub username → see inferred skills
2. Paste Lu.ma URL or search for a hackathon → see extracted tracks/sponsors
3. Answer 5 life-context questions
4. Receive 10 personalized ideas with win scores
5. Select one idea
6. Receive a complete build + pitch plan
7. Download the plan as a `.md` file

**Total demo time: under 2 minutes.**

---

## What to Cut (Strict Order)

| Feature | Cut priority |
|---|---|
| /compare page (top 3 table) | **First cut** — replace with inline rank on /ideas |
| Web search discovery | Second cut — keep URL paste only |
| GitHub API extraction | Third cut — replace with manual skills form |
| Adaptive question logic | Fourth cut — use 5 hardcoded questions |
| Devpost integration | Never started |
| Supabase | Never started |
| GitHub OAuth | Never started |
| Team collaboration | Never started |
| Idea merging | Never started |

**Never cut:** Profile → Hackathon → Questions → 10 Ideas → Final Plan → .md Export

---

## Positioning

**Don't say:** "AI idea generator"  
**Say:** *"The pre-hackathon OS for knowing exactly what to build before the event starts."*

Or sharper: *"It turns a hackathon page and your GitHub into a winning project plan."*

---

*Spec finalized: May 16, 2026. Build window: 4 hours. Ship it.*
