import {
  Hackathon,
  HackathonExtractionStatus,
  HackathonSearchResult,
  HackathonSponsor,
  HackathonTrack,
} from "./types";

function sanitizeString(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function sanitizeStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return Array.from(
    new Set(
      value
        .map((item) => sanitizeString(item))
        .filter((item): item is string => Boolean(item)),
    ),
  );
}

function normalizeTrack(value: unknown): HackathonTrack | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const name = sanitizeString(record.name);
  if (!name) return null;

  return {
    name,
    description: sanitizeString(record.description),
  };
}

function normalizeSponsor(value: unknown): HackathonSponsor | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const name = sanitizeString(record.name);
  if (!name) return null;

  return {
    name,
    apis: sanitizeStringArray(record.apis),
    prizes: sanitizeStringArray(record.prizes),
  };
}

function normalizeStatus(value: unknown, fallback: HackathonExtractionStatus) {
  return value === "fallback" || value === "full" ? value : fallback;
}

export function normalizeHackathon(
  value: Partial<Hackathon> | Record<string, unknown>,
  fallbackStatus: HackathonExtractionStatus = "full",
): Hackathon {
  const record = value as Record<string, unknown>;

  return {
    title: sanitizeString(record.title) ?? "Untitled Hackathon",
    date: sanitizeString(record.date),
    location: sanitizeString(record.location),
    tracks: Array.isArray(record.tracks)
      ? record.tracks
          .map((track) => normalizeTrack(track))
          .filter((track): track is HackathonTrack => Boolean(track))
      : [],
    sponsors: Array.isArray(record.sponsors)
      ? record.sponsors
          .map((sponsor) => normalizeSponsor(sponsor))
          .filter((sponsor): sponsor is HackathonSponsor => Boolean(sponsor))
      : [],
    prizes: sanitizeStringArray(record.prizes),
    judgingCriteria: sanitizeStringArray(record.judgingCriteria),
    rules: sanitizeStringArray(record.rules),
    theme: sanitizeString(record.theme),
    summary: sanitizeString(record.summary),
    fitSummary: sanitizeString(record.fitSummary),
    sourceUrl: sanitizeString(record.sourceUrl),
    extractionStatus: normalizeStatus(record.extractionStatus, fallbackStatus),
  };
}

export function buildHackathonFromSearchResult(result: HackathonSearchResult): Hackathon {
  return normalizeHackathon(
    {
      title: result.title,
      date: result.date,
      location: result.location,
      tracks: [],
      sponsors: [],
      prizes: [],
      judgingCriteria: [],
      rules: [],
      theme: result.description,
      summary: result.description,
      fitSummary: result.fitSummary,
      sourceUrl: result.url,
      extractionStatus: "fallback",
    },
    "fallback",
  );
}

function hasUsableFallbackMetadata(value: Partial<Hackathon> | null | undefined) {
  if (!value) return false;

  return Boolean(
    value.title ||
      value.summary ||
      value.theme ||
      value.date ||
      value.location ||
      value.tracks?.length ||
      value.sponsors?.length ||
      value.prizes?.length ||
      value.judgingCriteria?.length,
  );
}

export function buildHackathonFallback(
  metadata: Partial<Hackathon> | null | undefined,
  sourceUrl?: string | null,
) {
  if (!hasUsableFallbackMetadata(metadata)) return null;

  return normalizeHackathon(
    {
      ...metadata,
      sourceUrl: sourceUrl ?? metadata?.sourceUrl ?? null,
      extractionStatus: "fallback",
    },
    "fallback",
  );
}

export function mergeHackathonDetails(current: Hackathon, next: Partial<Hackathon>) {
  return normalizeHackathon(
    {
      ...current,
      ...next,
      summary: current.summary ?? next.summary ?? current.theme ?? next.theme ?? null,
      fitSummary: current.fitSummary ?? next.fitSummary ?? null,
      sourceUrl: next.sourceUrl ?? current.sourceUrl ?? null,
      extractionStatus: next.extractionStatus ?? current.extractionStatus ?? "full",
    },
    next.extractionStatus ?? current.extractionStatus ?? "full",
  );
}
