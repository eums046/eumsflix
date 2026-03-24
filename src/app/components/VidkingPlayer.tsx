import { useEffect, useRef, useState } from "react";

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
  const [showTitleOverlay, setShowTitleOverlay] = useState(true);

  useEffect(() => {
    // Hide title after 5 seconds to not obstruct video viewing
    const timer = setTimeout(() => setShowTitleOverlay(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Watch Progress Tracking
    const handleMessage = (event: MessageEvent) => {
      try {
        const payload = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
        if (payload?.type === "PLAYER_EVENT") {
          console.log("Player Event Received from Vidking:", payload.data);
          // E.g., Save progress to localStorage or backend
        }
      } catch (e) {
        // Ignore JSON parse errors for non-player messages
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

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

  return (
    <div className="relative w-full aspect-video bg-black">
      <iframe
        ref={iframeRef}
        src={src}
        className="w-full h-full border-0"
        allowFullScreen
        title="Vidking Player"
      />
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
