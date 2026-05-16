import { Hackathon, HackathonSearchResult } from "./types";

export const PINNED_HACKATHON_SEARCH_RESULTS: HackathonSearchResult[] = [
  {
    title: "USAII Global AI Hackathon 2026",
    date: "June 14–21, 2026",
    location: "Virtual",
    url: "https://aihackathon.usaii.org/",
    description:
      "A global virtual student competition to build real-world AI solutions. Open to high school, undergraduate, and graduate students. $15,000+ in prizes and scholarships across three tracks. Teams of 2–5; no prior hackathon experience required. No-code and low-code projects are welcome.",
    fitSummary:
      "Great for AI builders at any level — dedicated tracks for high school, undergrad, and grad students, with real certification prizes on top of cash.",
  },
  {
    title: "MLH Global Hack Week: Hacking for Good",
    date: "June 12–18, 2026",
    location: "Virtual",
    url: "https://ghw.mlh.io/",
    description:
      "A free, week-long MLH-hosted hackathon open to anyone, anywhere. Focused on building projects that make a positive impact on the world. Daily challenges, workshops, and mentorship from the Major League Hacking community.",
    fitSummary:
      "Free and beginner-friendly — ideal for first-timers or anyone wanting to build something meaningful with daily structure and MLH mentorship.",
  },
];

export const PINNED_HACKATHON_DETAILS: Record<string, Hackathon> = {
  "https://aihackathon.usaii.org/": {
    title: "USAII Global AI Hackathon 2026",
    date: "June 14–21, 2026",
    location: "Virtual",
    theme: "Building real-world AI solutions to address global challenges",
    summary:
      "The USAII Global AI Hackathon 2026 is a competitive virtual event where students build original AI-powered projects within one week. Participants complete a short AI Readiness Qualifier, then sprint through the build phase June 14–21. Winners receive cash prizes and full USAII AI certification scholarships (CAIP, CAIPa, or CAIE).",
    fitSummary:
      "Great for AI builders at any level — dedicated tracks for high school, undergrad, and grad students, with real certification prizes on top of cash.",
    sourceUrl: "https://aihackathon.usaii.org/",
    tracks: [
      {
        name: "High School Track",
        description:
          "Open to current high school students worldwide. Teams of 2–5 students (from different schools or countries is allowed). $5,000 prize pool. Focus on accessible AI applications that solve real problems teens care about. No prior hackathon experience needed — no-code and low-code solutions are fully accepted.",
      },
      {
        name: "Undergraduate Track",
        description:
          "Open to full-time undergraduate students at any college or university globally. Teams of 2–5. $5,000 prize pool. Projects should demonstrate a clear understanding of AI/ML concepts and practical implementation. Working professionals enrolled in a degree program are NOT eligible.",
      },
      {
        name: "Graduate / Doctoral Track",
        description:
          "Open to graduate and doctoral students (excluding working professionals enrolled in programs). Teams of 2–5. $5,000 prize pool. Expected to produce research-grade or production-quality AI systems with rigorous problem framing, ethical analysis, and technical depth.",
      },
    ],
    sponsors: [
      {
        name: "USAII – US Artificial Intelligence Institute",
        apis: [],
        prizes: [
          "100% discount on CAIP, CAIPa, or CAIE certification for category winners",
          "25% discount on CAIP, CAIPa, or CAIE certification for all participants who complete the hackathon",
          "Official USAII recognition and digital badge",
        ],
      },
    ],
    prizes: [
      "$15,000+ total in cash prizes and scholarships across all three tracks",
      "$5,000 prize pool for the High School Track",
      "$5,000 prize pool for the Undergraduate Track",
      "$5,000 prize pool for the Graduate / Doctoral Track",
      "Full USAII AI certification scholarship (CAIP/CAIPa/CAIE) for track winners",
      "25% certification discount for all completers",
    ],
    judgingCriteria: [
      "Problem clarity — Is the problem well-defined, real, and significant?",
      "AI approach & innovation — Is the AI technique appropriate and creative?",
      "Ethical considerations — Does the solution address bias, privacy, and fairness?",
      "Technical execution — Is the implementation functional and well-built?",
      "Demo quality — Is the solution clearly presented and easy to understand?",
      "Impact potential — Could this solution scale or make a measurable difference?",
    ],
    rules: [
      "Teams must have 2–5 members; solo participants can request teammate matching from organizers",
      "Team members may come from different schools, universities, or countries",
      "All teams must complete the AI Readiness Qualifier (approx. 30 min) before the build phase — describe the problem, target users, AI approach, and ethical considerations",
      "No-code and low-code projects are explicitly welcome",
      "Working professionals currently enrolled in degree or doctoral programs are NOT eligible",
      "Projects must be original work created during the hackathon window (June 14–21, 2026)",
      "Use of publicly available AI APIs, frameworks, and open-source libraries is permitted",
      "Final submissions must include a project demo and written summary",
    ],
  },

  "https://ghw.mlh.io/": {
    title: "MLH Global Hack Week: Hacking for Good",
    date: "June 12–18, 2026",
    location: "Virtual (global)",
    theme: "Build technology that creates a positive impact on the world",
    summary:
      "MLH Global Hack Week: Hacking for Good is a free, week-long hackathon hosted by Major League Hacking, open to anyone anywhere in the world. The event runs daily with structured challenges, workshops, and mentorship sessions. Participants build projects aimed at social good — from accessibility tools to environmental apps to community platforms. No experience required; beginners are actively encouraged.",
    fitSummary:
      "Free and beginner-friendly — ideal for first-timers or anyone wanting to build something meaningful with daily structure and MLH mentorship.",
    sourceUrl: "https://ghw.mlh.io/",
    tracks: [
      {
        name: "Social Impact Track",
        description:
          "Build tools that address social challenges: mental health, education equity, accessibility, food insecurity, homelessness, or civic engagement. Projects should have a clear intended beneficiary and a realistic path to helping real people.",
      },
      {
        name: "Environment & Climate Track",
        description:
          "Build technology focused on environmental sustainability, climate action, carbon tracking, renewable energy optimization, waste reduction, or ecological awareness. Bonus points for projects that involve real data or partner with local organizations.",
      },
      {
        name: "Community & Connection Track",
        description:
          "Build platforms, tools, or bots that strengthen communities — local neighborhoods, online groups, underserved populations, or global networks. Projects can be web apps, Discord bots, SMS tools, or anything that lowers barriers to connection.",
      },
      {
        name: "Open / Wildcard Track",
        description:
          "Have an idea for doing good that doesn't fit the above tracks? Submit here. Judged on the same criteria — impact, innovation, execution, and presentation. MLH encourages creative interpretations of 'hacking for good.'",
      },
    ],
    sponsors: [
      {
        name: "Major League Hacking (MLH)",
        apis: [
          "GitHub Student Developer Pack (free access for participants)",
          "MLH Fellowship API credits and cloud resources",
          "Partner API credits distributed during the event via MLH Discord",
        ],
        prizes: [
          "MLH winner certificates and digital badges",
          "Feature on MLH social media and newsletter",
          "MLH swag pack for top projects",
          "Potential fast-track consideration for MLH Fellowship programs",
        ],
      },
    ],
    prizes: [
      "MLH winner certificates and official recognition",
      "MLH swag packs for top-scoring projects in each track",
      "Feature on MLH's social media channels and weekly newsletter",
      "Potential fast-track consideration for the MLH Fellowship",
      "Access to exclusive post-event networking with MLH partners and sponsors",
    ],
    judgingCriteria: [
      "Impact & social value — Does the project meaningfully address a real-world problem?",
      "Innovation & creativity — Is the approach original or does it tackle the problem in a fresh way?",
      "Technical execution — Is the project functional, stable, and well-implemented?",
      "Presentation quality — Is the demo clear, compelling, and understandable to a general audience?",
      "Completeness — Does the submission include a working demo, readme, and source code?",
    ],
    rules: [
      "Free to participate — no registration fee, open to anyone worldwide",
      "Participants can be individuals or teams (team size is flexible)",
      "All skill levels welcome; beginners are explicitly encouraged to join",
      "Projects must be started during the hack week (June 12–18, 2026) — no pre-built projects",
      "Open-source libraries, APIs, and frameworks are permitted",
      "Projects must align with the 'Hacking for Good' theme — social, environmental, or community impact",
      "Submissions must include a public GitHub repo, a short demo video, and a project description on Devpost",
      "MLH Code of Conduct applies — respectful, inclusive participation is required",
      "Daily mini-challenges and workshops are optional but encouraged for bonus recognition",
    ],
  },
};
