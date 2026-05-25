"use client";

import { useEffect, useMemo, useRef, useState, type SVGProps } from "react";

type SvgIconProps = SVGProps<SVGSVGElement>;

const Pause = (props: SvgIconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    <rect x="6" y="5" width="4" height="14" rx="1" />
    <rect x="14" y="5" width="4" height="14" rx="1" />
  </svg>
);

const Play = (props: SvgIconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);

const SkipBack = (props: SvgIconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    <polygon points="19 20 9 12 19 4 19 20" />
    <line x1="5" y1="19" x2="5" y2="5" />
  </svg>
);

const SkipForward = (props: SvgIconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    <polygon points="5 4 15 12 5 20 5 4" />
    <line x1="19" y1="5" x2="19" y2="19" />
  </svg>
);

const Volume2 = (props: SvgIconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    <path d="M19.07 4.93a9 9 0 0 1 0 14.14" />
  </svg>
);

const VolumeX = (props: SvgIconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <line x1="17" y1="7" x2="23" y2="13" />
    <line x1="23" y1="7" x2="17" y2="13" />
  </svg>
);

const Music2 = (props: SvgIconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    <path d="M9 18V5l12-2v13" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="18" cy="16" r="3" />
  </svg>
);

const ChevronDown = (props: SvgIconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const TRACKS = [
  {
    title: "Track 1",
    src: "/music/track1.mp3",
  },
  {
    title: "Track 2",
    src: "/music/track2.mp3",
  },
  {
    title: "Track 3",
    src: "/music/track3.mp3",
  },
];

const VOLUME_STORAGE_KEY = "backgroundMusicVolume";
const TRACK_STORAGE_KEY = "backgroundMusicTrack";

const unsupportedSourceErrorNames = new Set([
  "NotSupportedError",
  "AbortError",
]);

export default function BackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isUnavailable, setIsUnavailable] = useState(false);

  const [volume, setVolume] = useState(0.35);

  const [isExpanded, setIsExpanded] = useState(false);

  const [trackIndex, setTrackIndex] = useState(0);

  const currentTrack = useMemo(
    () => TRACKS[trackIndex],
    [trackIndex]
  );

  // Load saved settings
  useEffect(() => {
    const savedVolume = Number(
      localStorage.getItem(VOLUME_STORAGE_KEY)
    );

    const savedTrack = Number(
      localStorage.getItem(TRACK_STORAGE_KEY)
    );

    if (Number.isFinite(savedVolume)) {
      setVolume(Math.min(1, Math.max(0, savedVolume)));
    }

    if (
      Number.isFinite(savedTrack) &&
      savedTrack >= 0 &&
      savedTrack < TRACKS.length
    ) {
      setTrackIndex(savedTrack);
    }
  }, []);

  // Persist volume
  useEffect(() => {
    localStorage.setItem(
      VOLUME_STORAGE_KEY,
      String(volume)
    );

    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Persist track
  useEffect(() => {
    localStorage.setItem(
      TRACK_STORAGE_KEY,
      String(trackIndex)
    );
  }, [trackIndex]);

  const playAudio = async () => {
    const audio = audioRef.current;

    if (!audio || isUnavailable) return;

    try {
      await audio.play();
      setIsPlaying(true);
    } catch (err) {
      setIsPlaying(false);

      if (
        err instanceof DOMException &&
        unsupportedSourceErrorNames.has(err.name)
      ) {
        setIsUnavailable(true);
        return;
      }

      console.error("Failed to play music:", err);
    }
  };

  const handleToggleMusic = async () => {
    const audio = audioRef.current;

    if (!audio || isUnavailable) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      return;
    }

    await playAudio();
  };

  const changeTrack = async (direction: "next" | "prev") => {
    const wasPlaying = isPlaying;

    let nextIndex = trackIndex;

    if (direction === "next") {
      nextIndex = (trackIndex + 1) % TRACKS.length;
    } else {
      nextIndex =
        (trackIndex - 1 + TRACKS.length) % TRACKS.length;
    }

    setTrackIndex(nextIndex);

    if (wasPlaying) {
      setTimeout(async () => {
        await playAudio();
      }, 100);
    }
  };

  return (
    <>
      <audio
        ref={audioRef}
        src={currentTrack.src}
        preload="none"
        onEnded={() => changeTrack("next")}
        onError={() => {
          setIsPlaying(false);
          setIsUnavailable(true);
        }}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
      />

      {/* Minimized floating button */}
      {!isExpanded && (
        <button
          type="button"
          onClick={() => setIsExpanded(true)}
          className="
            fixed bottom-4 right-4 z-50
            flex h-14 w-14 items-center justify-center
            rounded-full
            bg-slate-800/95
            text-white
            shadow-2xl
            border border-slate-700
            backdrop-blur
            transition
            hover:scale-105
            active:scale-95
          "
        >
          {isPlaying ? (
            <Volume2 className="h-6 w-6" />
          ) : (
            <Music2 className="h-6 w-6" />
          )}
        </button>
      )}

      {/* Expanded player */}
      {isExpanded && (
        <div
          className="
            fixed bottom-4 right-4 z-50
            w-[calc(100vw-2rem)]
            max-w-sm
            rounded-2xl
            border border-slate-700
            bg-slate-900/95
            p-4
            shadow-2xl
            backdrop-blur-xl
          "
        >
          {/* Header */}
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-white">
                Music Player
              </p>

              <p className="text-xs text-slate-400 truncate">
                {currentTrack.title}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="
                rounded-lg p-2
                text-slate-300
                hover:bg-slate-800
              "
            >
              <ChevronDown className="h-5 w-5" />
            </button>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => changeTrack("prev")}
              className="
                rounded-full bg-slate-800 p-3
                text-white transition
                hover:bg-slate-700
                active:scale-95
              "
            >
              <SkipBack className="h-5 w-5" />
            </button>

            <button
              onClick={handleToggleMusic}
              disabled={isUnavailable}
              className="
                rounded-full bg-cyan-500 p-4
                text-black transition
                hover:bg-cyan-400
                active:scale-95
                disabled:opacity-50
              "
            >
              {isPlaying ? (
                <Pause className="h-6 w-6" />
              ) : (
                <Play className="h-6 w-6 ml-0.5" />
              )}
            </button>

            <button
              onClick={() => changeTrack("next")}
              className="
                rounded-full bg-slate-800 p-3
                text-white transition
                hover:bg-slate-700
                active:scale-95
              "
            >
              <SkipForward className="h-5 w-5" />
            </button>
          </div>

          {/* Volume */}
          <div className="mt-4">
            <div className="mb-2 flex items-center gap-2 text-slate-300">
              {volume === 0 ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}

              <span className="text-xs">Volume</span>
            </div>

            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) =>
                setVolume(Number(e.target.value))
              }
              className="
                h-2 w-full
                cursor-pointer
                accent-cyan-400
              "
            />
          </div>

          {isUnavailable && (
            <p className="mt-3 text-xs text-red-400">
              Audio source unavailable
            </p>
          )}
        </div>
      )}
    </>
  );
}