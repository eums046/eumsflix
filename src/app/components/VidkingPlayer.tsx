import { useEffect, useRef, useState } from "react";
import { Maximize, Minimize, Check, Loader2 } from "lucide-react";
import {
  fetchSubtitleTracks,
  fetchSubtitleCues,
  hasSubtitleKey,
  SubtitleTrack,
  SubtitleCue,
} from "../services/subtitles";

interface VidkingPlayerProps {
  tmdbId?: number;
  title?: string;
  type?: "movie" | "tv";
  season?: number;
  episode?: number;
  color?: string;
  autoPlay?: boolean;
  onNextEpisode?: () => void;
  hasNextEpisode?: boolean;
}

// Local playback clock, driven by Vidking's postMessage events and interpolated
// between them so subtitle timing stays smooth.
interface Playback {
  time: number; // last reported currentTime (seconds)
  ts: number; // performance.now() when it was reported
  playing: boolean;
}

export function VidkingPlayer({
  tmdbId = 1078605, // Fallback to provided example ID
  title,
  type = "movie",
  season,
  episode,
  color = "e50914", // Netflix Red
  autoPlay = true,
  onNextEpisode,
  hasNextEpisode,
}: VidkingPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [showTitleOverlay, setShowTitleOverlay] = useState(true);

  // ── Subtitle state ─────────────────────────────────────────────────
  const [tracks, setTracks] = useState<SubtitleTrack[] | null>(null);
  const [tracksLoading, setTracksLoading] = useState(false);
  const [tracksError, setTracksError] = useState(false);
  const [activeTrackId, setActiveTrackId] = useState<string | null>(null);
  const [cuesLoadingId, setCuesLoadingId] = useState<string | null>(null);
  const [activeCueText, setActiveCueText] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Refs read by the requestAnimationFrame loop (avoid re-subscribing per frame).
  const playbackRef = useRef<Playback>({ time: 0, ts: 0, playing: false });
  const cuesRef = useRef<SubtitleCue[]>([]);
  const activeCueRef = useRef("");

  useEffect(() => {
    // Hide title after 5 seconds to not obstruct video viewing
    const timer = setTimeout(() => setShowTitleOverlay(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Watch progress tracking + drive the local subtitle clock.
    const handleMessage = (event: MessageEvent) => {
      try {
        const payload = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
        if (payload?.type !== "PLAYER_EVENT") return;
        const data = payload.data || {};
        const pb = playbackRef.current;
        if (typeof data.currentTime === "number") {
          pb.time = data.currentTime;
          pb.ts = performance.now();
        }
        switch (data.event) {
          case "play":
          case "timeupdate":
          case "seeked":
            pb.playing = data.event === "seeked" ? pb.playing : true;
            break;
          case "pause":
          case "ended":
            pb.playing = false;
            break;
        }
      } catch {
        // Ignore non-player messages / JSON parse errors.
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // Reset subtitles whenever the media (or episode) changes.
  useEffect(() => {
    setTracks(null);
    setTracksLoading(false);
    setTracksError(false);
    setActiveTrackId(null);
    setCuesLoadingId(null);
    setActiveCueText("");
    cuesRef.current = [];
    activeCueRef.current = "";
    playbackRef.current = { time: 0, ts: 0, playing: false };
  }, [tmdbId, type, season, episode]);

  // Run the subtitle clock only while a track is active.
  useEffect(() => {
    if (!activeTrackId) {
      setActiveCueText("");
      activeCueRef.current = "";
      return;
    }
    let raf = 0;
    const tick = () => {
      const pb = playbackRef.current;
      const now = performance.now();
      const t = pb.playing && pb.ts ? pb.time + (now - pb.ts) / 1000 : pb.time;

      let text = "";
      const cues = cuesRef.current;
      for (let i = 0; i < cues.length; i++) {
        const cue = cues[i];
        if (t >= cue.start && t < cue.end) {
          text = cue.text;
          break;
        }
        if (cue.start > t) break; // cues are sorted; nothing further can match
      }

      if (text !== activeCueRef.current) {
        activeCueRef.current = text;
        setActiveCueText(text);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [activeTrackId]);

  // Close the subtitle menu on outside click.
  useEffect(() => {
    if (!showMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMenu]);

  // Track fullscreen state of our wrapper.
  useEffect(() => {
    const onChange = () => setIsFullscreen(document.fullscreenElement === wrapperRef.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const openMenu = () => {
    setShowMenu((v) => !v);
    // Lazily load the track list the first time the menu is opened.
    if (tracks === null && !tracksLoading && hasSubtitleKey()) {
      setTracksLoading(true);
      setTracksError(false);
      fetchSubtitleTracks({ tmdbId, season, episode })
        .then((list) => setTracks(list))
        .catch(() => setTracksError(true))
        .finally(() => setTracksLoading(false));
    }
  };

  const selectTrack = async (track: SubtitleTrack | null) => {
    setShowMenu(false);
    if (!track) {
      setActiveTrackId(null);
      cuesRef.current = [];
      return;
    }
    setActiveTrackId(track.id);
    setCuesLoadingId(track.id);
    cuesRef.current = [];
    activeCueRef.current = "";
    setActiveCueText("");
    try {
      const cues = await fetchSubtitleCues(track);
      cuesRef.current = cues;
    } catch {
      cuesRef.current = [];
    } finally {
      setCuesLoadingId((id) => (id === track.id ? null : id));
    }
  };

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      wrapperRef.current?.requestFullscreen?.();
    }
  };

  // Construct URL
  let src = `https://www.vidking.net/embed/${type}/${tmdbId}`;
  if (type === "tv" && season && episode) {
    src += `/${season}/${episode}`;
  }

  // Append query parameters
  const params = new URLSearchParams();
  if (color) params.append("color", color);
  if (autoPlay) params.append("autoPlay", "true");

  const queryString = params.toString();
  if (queryString) {
    src += `?${queryString}`;
  }

  const subtitlesOn = activeTrackId !== null;

  return (
    <div ref={wrapperRef} className="relative w-full aspect-video bg-black">
      <iframe
        ref={iframeRef}
        src={src}
        className="w-full h-full border-0"
        allowFullScreen
        title="Vidking Player"
      />

      {/* Subtitle cue overlay — synced to the player's reported time. */}
      {activeCueText && (
        <div className="pointer-events-none absolute inset-x-0 bottom-[12%] z-40 flex justify-center px-4">
          <span
            className="max-w-[85%] whitespace-pre-line rounded bg-black/60 px-2 py-1 text-center font-medium leading-snug text-white"
            style={{ fontSize: "clamp(0.95rem, 2.6vw, 2.1rem)", textShadow: "0 2px 4px rgba(0,0,0,0.9)" }}
          >
            {activeCueText}
          </span>
        </div>
      )}

      {/* Our player controls (subtitles + fullscreen), kept clear of Vidking's
          own bottom control bar by sitting in the top-right corner. */}
      <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
        <div className="relative" ref={menuRef}>
          <button
            onClick={openMenu}
            aria-haspopup="menu"
            aria-expanded={showMenu}
            aria-label="Subtitles"
            title="Subtitles"
            className={`flex items-center justify-center rounded border px-2.5 py-1.5 text-sm font-bold tracking-wide backdrop-blur-md transition-colors ${
              subtitlesOn
                ? "border-white bg-white text-black"
                : "border-white/20 bg-black/60 text-white hover:bg-black/80"
            }`}
          >
            CC
          </button>

          {showMenu && (
            <div
              role="menu"
              className="absolute right-0 top-full mt-2 w-60 overflow-hidden rounded-lg border border-white/10 bg-black/90 shadow-2xl backdrop-blur-md"
            >
              <div className="border-b border-white/10 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
                Subtitles
              </div>

              {!hasSubtitleKey() ? (
                <div className="px-4 py-3 text-xs leading-relaxed text-gray-400">
                  Add <code className="text-gray-200">VITE_WYZIE_API_KEY</code> to your{" "}
                  <code className="text-gray-200">.env</code> to enable subtitles. Get a free key at{" "}
                  <span className="text-gray-200">store.wyzie.io/redeem</span>.
                </div>
              ) : tracksLoading ? (
                <div className="flex items-center gap-2 px-4 py-3 text-sm text-gray-400">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading…
                </div>
              ) : tracksError ? (
                <div className="px-4 py-3 text-sm text-gray-400">Couldn't load subtitles.</div>
              ) : (
                <div className="max-h-64 overflow-y-auto py-1">
                  <SubtitleOption
                    label="Off"
                    selected={activeTrackId === null}
                    onSelect={() => selectTrack(null)}
                  />
                  {(tracks ?? []).map((track) => (
                    <SubtitleOption
                      key={track.id}
                      label={track.label}
                      selected={activeTrackId === track.id}
                      loading={cuesLoadingId === track.id}
                      onSelect={() => selectTrack(track)}
                    />
                  ))}
                  {tracks?.length === 0 && (
                    <div className="px-4 py-2 text-xs text-gray-500">No subtitles found for this title.</div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <button
          onClick={toggleFullscreen}
          aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          title={isFullscreen ? "Exit fullscreen" : "Fullscreen (keeps subtitles visible)"}
          className="flex items-center justify-center rounded border border-white/20 bg-black/60 p-1.5 text-white backdrop-blur-md transition-colors hover:bg-black/80"
        >
          {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
        </button>
      </div>

      {title && (
        <div
          className={`absolute top-0 left-0 right-0 p-6 bg-gradient-to-b from-black/80 to-transparent pointer-events-none transition-opacity duration-1000 ${
            showTitleOverlay ? "opacity-100" : "opacity-0"
          }`}
        >
          <h2 className="text-white text-3xl font-semibold drop-shadow-lg pb-10">
            {title}
          </h2>
        </div>
      )}

      {type === "tv" && hasNextEpisode && onNextEpisode && (
        <button
          onClick={onNextEpisode}
          className="absolute bottom-24 right-8 z-50 flex items-center gap-2 bg-black/60 hover:bg-black/80 backdrop-blur-md text-white px-5 py-2.5 rounded shadow-xl border border-white/20 transition-all group"
        >
          <span className="font-medium">Next Episode</span>
          <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}
    </div>
  );
}

function SubtitleOption({
  label,
  selected,
  loading,
  onSelect,
}: {
  label: string;
  selected: boolean;
  loading?: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      role="menuitemradio"
      aria-checked={selected}
      onClick={onSelect}
      className={`flex w-full items-center gap-3 px-4 py-2 text-left text-sm transition-colors ${
        selected ? "bg-white/5 text-white" : "text-gray-300 hover:bg-white/10 hover:text-white"
      }`}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 flex-shrink-0 animate-spin text-red-500" />
      ) : (
        <Check className={`h-4 w-4 flex-shrink-0 ${selected ? "text-red-500 opacity-100" : "opacity-0"}`} />
      )}
      <span className="truncate">{label}</span>
    </button>
  );
}
