"use client";

import { useState, useEffect } from "react";

export function useTimer(
  initialSeconds: number,
  onComplete?: () => void,
  enabled: boolean = true
) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(enabled);

  useEffect(() => {
    setSeconds(initialSeconds);
    setIsRunning(enabled);
  }, [initialSeconds, enabled]);

  useEffect(() => {
    if (!enabled || !isRunning || seconds <= 0) return;

    const interval = setInterval(() => {
      setSeconds((prev) => {
        const newSeconds = prev - 1;
        if (newSeconds <= 0) {
          setIsRunning(false);
          onComplete?.();
        }
        return newSeconds;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [enabled, isRunning, seconds, onComplete]);

  const reset = () => {
    setSeconds(initialSeconds);
    setIsRunning(enabled);
  };

  const pause = () => setIsRunning(false);
  const resume = () => setIsRunning(enabled);

  return { seconds, isRunning, reset, pause, resume };
}
