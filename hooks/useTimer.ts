"use client";

import { useState, useEffect } from "react";

export function useTimer(initialSeconds: number, onComplete?: () => void) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(true);

  useEffect(() => {
    if (!isRunning || seconds <= 0) return;

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
  }, [isRunning, seconds, onComplete]);

  const reset = () => {
    setSeconds(initialSeconds);
    setIsRunning(true);
  };

  const pause = () => setIsRunning(false);
  const resume = () => setIsRunning(true);

  return { seconds, isRunning, reset, pause, resume };
}
