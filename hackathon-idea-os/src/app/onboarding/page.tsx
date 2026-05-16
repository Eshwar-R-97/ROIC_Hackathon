"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session";
import { ProgressBar } from "@/components/ProgressBar";

const ROLES = ["Student", "Professional", "Freelancer", "Researcher", "Entrepreneur", "Other"];
const EXPERIENCE = ["Beginner (< 1 year)", "Junior (1-2 years)", "Mid (3-5 years)", "Senior (5+ years)"];
const INTEREST_OPTIONS = [
  "AI / ML", "Web Dev", "Mobile", "Hardware / IoT", "DevTools",
  "FinTech", "HealthTech", "EdTech", "Gaming", "Sustainability", "Social Impact", "Open Source",
];

export default function OnboardingPage() {
  const router = useRouter();
  const { state, update } = useSession();
  const [githubUsername, setGithubUsername] = useState(state.userProfile?.githubUsername || "");
  const [role, setRole] = useState(state.userProfile?.role || "");
  const [experience, setExperience] = useState(state.userProfile?.experience || "");
  const [interests, setInterests] = useState<string[]>(state.userProfile?.interests || []);
  const [skills, setSkills] = useState(state.userProfile?.skills?.join(", ") || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function toggleInterest(interest: string) {
    setInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!githubUsername.trim()) {
      setError("GitHub username is required.");
      return;
    }
    setLoading(true);
    setError("");

    const userProfile = {
      githubUsername: githubUsername.trim(),
      role,
      experience,
      interests,
      skills: skills.split(",").map((s) => s.trim()).filter(Boolean),
    };

    try {
      const res = await fetch("/api/github/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ githubUsername: githubUsername.trim() }),
      });

      if (!res.ok) throw new Error("GitHub user not found.");
      const githubSignals = await res.json();

      update({ userProfile, githubSignals, step: 1 });
      router.push("/discover");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-2xl mx-auto">
        <ProgressBar currentStep={0} />

        <h1 className="text-2xl font-bold text-gray-900 mb-1">Your Profile</h1>
        <p className="text-gray-500 text-sm mb-8">We'll use this to personalize your ideas and plan.</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              GitHub Username <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={githubUsername}
              onChange={(e) => setGithubUsername(e.target.value)}
              placeholder="e.g. torvalds"
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
              >
                <option value="">Select role</option>
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Experience</label>
              <select
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
              >
                <option value="">Select level</option>
                {EXPERIENCE.map((e) => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Interests</label>
            <div className="flex flex-wrap gap-2">
              {INTEREST_OPTIONS.map((interest) => (
                <button
                  key={interest}
                  type="button"
                  onClick={() => toggleInterest(interest)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    interests.includes(interest)
                      ? "bg-gray-900 text-white border-gray-900"
                      : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Additional Skills <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="e.g. Solidity, Three.js, FastAPI"
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
            />
            <p className="text-xs text-gray-400 mt-1">Comma-separated</p>
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 px-4 py-2.5 rounded-lg">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-900 text-white py-3 rounded-lg font-medium text-sm hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Analyzing GitHub profile..." : "Continue →"}
          </button>
        </form>
      </div>
    </main>
  );
}
