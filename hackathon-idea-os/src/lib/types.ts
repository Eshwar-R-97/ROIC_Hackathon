export interface UserProfile {
  githubUsername: string;
  role: string;
  experience: string;
  interests: string[];
  skills: string[];
}

export interface GitHubSignals {
  languages: string[];
  frameworks: string[];
  projectThemes: string[];
  repoEvidence: { name: string; description: string }[];
  winningPatterns: string[];
}

export interface HackathonTrack {
  name: string;
  description: string | null;
}

export interface HackathonSponsor {
  name: string;
  apis: string[];
  prizes: string[];
}

export interface Hackathon {
  title: string;
  date: string | null;
  location: string | null;
  tracks: HackathonTrack[];
  sponsors: HackathonSponsor[];
  prizes: string[];
  judgingCriteria: string[];
  rules: string[];
  theme: string | null;
  summary?: string | null;
  fitSummary?: string | null;
  sourceUrl?: string | null;
}

export interface HackathonSearchResult {
  title: string;
  date: string | null;
  location: string | null;
  url: string | null;
  description: string | null;
  fitSummary: string | null;
}

export interface AdaptiveQuestion {
  id: string;
  text: string;
  type: "text" | "choice";
  options?: string[];
}

export interface Idea {
  id: string;
  title: string;
  problem: string;
  personalConnection: string;
  trackFit: string;
  sponsorFit: string;
  demoMoment: string;
  mvpFeatures: string[];
  stretchFeatures: string[];
  stack: string[];
  winScore: number;
  feasibilityScore: number;
  noveltyScore: number;
  sponsorScore: number;
}

export interface TimelineEntry {
  hour: string;
  task: string;
}

export interface Task {
  label: string;
  priority: "must" | "should" | "stretch";
  done: boolean;
}

export interface FinalPlan {
  projectName: string;
  oneLiner: string;
  problem: string;
  hackathonFit: string;
  trackAlignment: string;
  sponsorAlignment: string;
  userFlow: string[];
  mvpFeatures: string[];
  stretchFeatures: string[];
  cutFeatures: string[];
  architecture: string;
  techStack: string[];
  timeline: TimelineEntry[];
  tasks: Task[];
  demoScript: string;
  pitchScript: string;
  judgingStrategy: string;
  risks: string[];
  submissionChecklist: string[];
}

export interface SessionState {
  sessionId: string;
  step: number;
  userProfile: UserProfile | null;
  githubSignals: GitHubSignals | null;
  selectedHackathon: Hackathon | null;
  lifeAnswers: Record<string, string>;
  adaptiveQuestions: AdaptiveQuestion[];
  generatedIdeas: Idea[];
  selectedIdeaId: string | null;
  finalPlan: FinalPlan | null;
}
