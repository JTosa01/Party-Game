"use client";

import { useEffect, useRef, useState } from "react";

const MUSIC_SRC = "/music/background.mp3";
const VOLUME_STORAGE_KEY = "backgroundMusicVolume";
const unsupportedSourceErrorNames = new Set(["NotSupportedError", "AbortError"]);

export default function BackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isUnavailable, setIsUnavailable] = useState(false);
  const [volume, setVolume] = useState(0.35);

  useEffect(() => {
    const savedVolume = Number(localStorage.getItem(VOLUME_STORAGE_KEY));

    if (Number.isFinite(savedVolume)) {
      setVolume(Math.min(1, Math.max(0, savedVolume)));
    }
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }

    localStorage.setItem(VOLUME_STORAGE_KEY, String(volume));
  }, [volume]);

  const handleToggleMusic = async () => {
    const audio = audioRef.current;
    if (!audio || isUnavailable) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      return;
    }

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

      console.error("Failed to play background music:", err);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 rounded-lg border border-slate-600 bg-slate-800/95 p-3 shadow-xl">
      <audio
        ref={audioRef}
        src={MUSIC_SRC}
        loop
        preload="none"
        onError={() => {
          setIsPlaying(false);
          setIsUnavailable(true);
        }}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
      />
      <button
        type="button"
        onClick={handleToggleMusic}
        disabled={isUnavailable}
        className="w-full rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-slate-600 disabled:cursor-not-allowed disabled:text-slate-500"
      >
        {isUnavailable ? "Music Missing" : isPlaying ? "Pause Music" : "Play Music"}
      </button>
      <label
        htmlFor="background-music-volume"
        className="mt-3 block text-xs font-medium text-slate-300"
      >
        Volume
      </label>
      <input
        id="background-music-volume"
        type="range"
        min="0"
        max="1"
        step="0.05"
        value={volume}
        onChange={(e) => setVolume(Number(e.target.value))}
        disabled={isUnavailable}
        className="mt-1 h-2 w-36 accent-cyan-400 disabled:opacity-50"
      />
    </div>
  );
}
