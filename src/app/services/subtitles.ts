// Subtitle sourcing via the Wyzie Subs API (https://sub.wyzie.io).
// Vidking's embedded player has its own (uncontrollable) caption button, so we
// fetch subtitle tracks ourselves by TMDB id and render them as an overlay that
// is synced to the player's postMessage time updates. See VidkingPlayer.

const WYZIE_KEY = (import.meta as any).env.VITE_WYZIE_API_KEY || "";
const WYZIE_BASE = "https://sub.wyzie.io";

export interface SubtitleTrack {
  id: string;
  url: string;
  /** Human-readable label, e.g. "English" */
  label: string;
  /** ISO-639 language code, e.g. "en" */
  language: string;
  isHearingImpaired: boolean;
}

export interface SubtitleCue {
  start: number; // seconds
  end: number; // seconds
  text: string; // may contain newlines
}

/** Whether a Wyzie API key is configured. Used to show a helpful hint if not. */
export const hasSubtitleKey = (): boolean => Boolean(WYZIE_KEY);

interface FetchTracksParams {
  tmdbId: number;
  season?: number;
  episode?: number;
}

/**
 * Fetch the list of available subtitle tracks for a title. Returns one entry
 * per language (+ a separate entry for hearing-impaired variants), deduped.
 */
export const fetchSubtitleTracks = async ({
  tmdbId,
  season,
  episode,
}: FetchTracksParams): Promise<SubtitleTrack[]> => {
  if (!WYZIE_KEY) return [];

  const url = new URL(`${WYZIE_BASE}/search`);
  url.searchParams.set("id", String(tmdbId));
  if (season) url.searchParams.set("season", String(season));
  if (episode) url.searchParams.set("episode", String(episode));
  url.searchParams.set("format", "srt");
  url.searchParams.set("key", WYZIE_KEY);

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`Subtitle search failed (${res.status})`);
  }
  const data = await res.json();
  if (!Array.isArray(data)) return [];

  const seen = new Set<string>();
  const tracks: SubtitleTrack[] = [];
  for (const item of data) {
    if (!item?.url) continue;
    const language = String(item.language || "");
    const isHearingImpaired = Boolean(item.isHearingImpaired);
    // Keep only the first (most relevant) track per language + HI variant.
    const dedupeKey = `${language}|${isHearingImpaired}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    const baseLabel = String(item.display || language || "Unknown");
    tracks.push({
      id: String(item.id ?? item.url),
      url: String(item.url),
      label: isHearingImpaired ? `${baseLabel} (HI)` : baseLabel,
      language,
      isHearingImpaired,
    });
  }

  // Sort alphabetically by label for a stable, scannable menu.
  tracks.sort((a, b) => a.label.localeCompare(b.label));
  return tracks;
};

/** Fetch a subtitle file and parse it into timed cues. */
export const fetchSubtitleCues = async (track: SubtitleTrack): Promise<SubtitleCue[]> => {
  let res = await fetch(track.url);
  // Some file URLs are gated behind the same key; retry once with it appended.
  if (!res.ok && WYZIE_KEY && track.url.includes("wyzie.io") && !track.url.includes("key=")) {
    const sep = track.url.includes("?") ? "&" : "?";
    res = await fetch(`${track.url}${sep}key=${encodeURIComponent(WYZIE_KEY)}`);
  }
  if (!res.ok) {
    throw new Error(`Subtitle download failed (${res.status})`);
  }
  return parseSubtitles(await res.text());
};

const TIME_RE =
  /(\d{1,2}:\d{2}:\d{2}[.,]\d{1,3}|\d{1,2}:\d{2}[.,]\d{1,3})\s*-->\s*(\d{1,2}:\d{2}:\d{2}[.,]\d{1,3}|\d{1,2}:\d{2}[.,]\d{1,3})/;

/**
 * Parse SubRip (.srt) or WebVTT (.vtt) content into cues. Both formats share a
 * cue-block structure; the main differences (comma vs. dot in timestamps, an
 * optional WEBVTT header, and numeric index / cue-id lines) are all handled.
 */
export const parseSubtitles = (raw: string): SubtitleCue[] => {
  const normalized = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();

  const cues: SubtitleCue[] = [];
  for (const block of normalized.split(/\n{2,}/)) {
    const lines = block.split("\n");
    // Find the timing line within the block. Everything before it is a numeric
    // index (SRT) and/or cue identifier (VTT); non-cue blocks (the WEBVTT
    // header, NOTE / STYLE sections) have no timing line and are skipped.
    const timeIdx = lines.findIndex((line) => TIME_RE.test(line));
    if (timeIdx === -1) continue;

    const match = lines[timeIdx].match(TIME_RE);
    if (!match) continue;
    const start = toSeconds(match[1]);
    const end = toSeconds(match[2]);
    if (end <= start) continue;

    const text = lines
      .slice(timeIdx + 1)
      .join("\n")
      .replace(/<[^>]+>/g, "") // strip inline tags (e.g. <i>, <b>, styling)
      .replace(/\{[^}]+\}/g, "") // strip SSA/ASS-style overrides if any
      .trim();
    if (text) cues.push({ start, end, text });
  }

  cues.sort((a, b) => a.start - b.start);
  return cues;
};

const toSeconds = (timestamp: string): number => {
  const [hms, ms = "0"] = timestamp.replace(",", ".").split(".");
  const parts = hms.split(":").map(Number);
  let seconds = 0;
  if (parts.length === 3) {
    seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    seconds = parts[0] * 60 + parts[1];
  }
  return seconds + Number(`0.${ms.padEnd(3, "0").slice(0, 3)}`);
};
