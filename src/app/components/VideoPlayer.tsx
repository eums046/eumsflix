import { useRef, useState, useEffect } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  SkipBack,
  SkipForward,
  Settings,
  Check
} from "lucide-react";

export interface SubtitleTrack {
  /** Human-readable name shown in the menu, e.g. "English" */
  label: string;
  /** BCP-47 language code, e.g. "en" */
  srcLang: string;
  /** URL to a WebVTT (.vtt) file */
  src: string;
  /** Selected by default when the player loads */
  default?: boolean;
}

interface VideoPlayerProps {
  videoUrl: string;
  poster: string;
  title: string;
  subtitles?: SubtitleTrack[];
}

// Sentinel for "Subtitles Off" (no track showing)
const SUBTITLE_OFF = -1;

export function VideoPlayer({ videoUrl, poster, title, subtitles = [] }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  // Index into `subtitles`, or SUBTITLE_OFF for no captions.
  const [activeSubtitle, setActiveSubtitle] = useState<number>(() => {
    const idx = subtitles.findIndex((s) => s.default);
    return idx === -1 ? SUBTITLE_OFF : idx;
  });
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => setCurrentTime(video.currentTime);
    const updateDuration = () => setDuration(video.duration);

    video.addEventListener("timeupdate", updateTime);
    video.addEventListener("loadedmetadata", updateDuration);

    return () => {
      video.removeEventListener("timeupdate", updateTime);
      video.removeEventListener("loadedmetadata", updateDuration);
    };
  }, []);

  // Drive the underlying <video> text tracks from `activeSubtitle`. The i-th
  // TextTrack maps to the i-th <track> element rendered below (document order).
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const tracks = video.textTracks;
    for (let i = 0; i < tracks.length; i++) {
      tracks[i].mode = i === activeSubtitle ? "showing" : "disabled";
    }
  }, [activeSubtitle, subtitles]);

  // Close the settings menu when clicking anywhere outside it.
  useEffect(() => {
    if (!showSettings) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setShowSettings(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showSettings]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.requestFullscreen();
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const skip = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime += seconds;
    }
  };

  const selectSubtitle = (index: number) => {
    setActiveSubtitle(index);
    setShowSettings(false);
  };

  const formatTime = (time: number) => {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      // Keep controls visible while the settings menu is open.
      if (isPlaying && !showSettings) {
        setShowControls(false);
      }
    }, 3000);
  };

  return (
    <div
      className="relative bg-black aspect-video group"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && !showSettings && setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={videoUrl}
        poster={poster}
        className="w-full h-full"
        onClick={togglePlay}
      >
        {subtitles.map((track) => (
          <track
            key={`${track.srcLang}-${track.src}`}
            kind="subtitles"
            label={track.label}
            srcLang={track.srcLang}
            src={track.src}
          />
        ))}
      </video>

      <div
        className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 p-6">
          <h2 className="text-white text-2xl font-semibold">{title}</h2>
        </div>

        {/* Center play button */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center">
            <button
              onClick={togglePlay}
              className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/40 flex items-center justify-center hover:bg-white/30 transition-all hover:scale-110"
            >
              <Play className="w-10 h-10 text-white ml-1" fill="white" />
            </button>
          </div>
        )}

        {/* Bottom controls */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          {/* Progress bar */}
          <div className="mb-4">
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-red-600"
              style={{
                background: `linear-gradient(to right, #dc2626 0%, #dc2626 ${(currentTime / duration) * 100}%, #4b5563 ${(currentTime / duration) * 100}%, #4b5563 100%)`
              }}
            />
            <div className="flex justify-between text-xs text-gray-300 mt-1">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Control buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={togglePlay}
                className="text-white hover:text-gray-300 transition-colors"
              >
                {isPlaying ? (
                  <Pause className="w-8 h-8" fill="white" />
                ) : (
                  <Play className="w-8 h-8" fill="white" />
                )}
              </button>
              <button
                onClick={() => skip(-10)}
                className="text-white hover:text-gray-300 transition-colors"
              >
                <SkipBack className="w-6 h-6" />
              </button>
              <button
                onClick={() => skip(10)}
                className="text-white hover:text-gray-300 transition-colors"
              >
                <SkipForward className="w-6 h-6" />
              </button>
              <button
                onClick={toggleMute}
                className="text-white hover:text-gray-300 transition-colors"
              >
                {isMuted ? (
                  <VolumeX className="w-6 h-6" />
                ) : (
                  <Volume2 className="w-6 h-6" />
                )}
              </button>
            </div>
            <div className="flex items-center gap-4">
              {/* Subtitles / settings */}
              <div className="relative" ref={settingsRef}>
                <button
                  onClick={() => setShowSettings((v) => !v)}
                  className={`transition-colors ${
                    showSettings ? "text-white" : "text-white hover:text-gray-300"
                  }`}
                  aria-haspopup="menu"
                  aria-expanded={showSettings}
                  aria-label="Subtitle settings"
                  title="Subtitles"
                >
                  <Settings className="w-6 h-6" />
                </button>

                {showSettings && (
                  <div
                    role="menu"
                    className="absolute bottom-full right-0 mb-3 w-56 rounded-lg bg-black/90 backdrop-blur-md border border-white/10 shadow-2xl overflow-hidden"
                  >
                    <div className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-gray-400 border-b border-white/10">
                      Subtitles / CC
                    </div>
                    <div className="py-1 max-h-64 overflow-y-auto">
                      <SubtitleOption
                        label="Off"
                        selected={activeSubtitle === SUBTITLE_OFF}
                        onSelect={() => selectSubtitle(SUBTITLE_OFF)}
                      />
                      {subtitles.map((track, index) => (
                        <SubtitleOption
                          key={`${track.srcLang}-${track.src}`}
                          label={track.label}
                          selected={activeSubtitle === index}
                          onSelect={() => selectSubtitle(index)}
                        />
                      ))}
                    </div>
                    {subtitles.length === 0 && (
                      <div className="px-4 py-2 text-xs text-gray-500 border-t border-white/10">
                        No subtitle tracks available
                      </div>
                    )}
                  </div>
                )}
              </div>
              <button
                onClick={toggleFullscreen}
                className="text-white hover:text-gray-300 transition-colors"
              >
                <Maximize className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SubtitleOption({
  label,
  selected,
  onSelect
}: {
  label: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      role="menuitemradio"
      aria-checked={selected}
      onClick={onSelect}
      className={`flex items-center gap-3 w-full px-4 py-2 text-left text-sm transition-colors ${
        selected ? "text-white bg-white/5" : "text-gray-300 hover:bg-white/10 hover:text-white"
      }`}
    >
      <Check
        className={`w-4 h-4 flex-shrink-0 ${selected ? "opacity-100 text-red-500" : "opacity-0"}`}
      />
      <span className="truncate">{label}</span>
    </button>
  );
}
