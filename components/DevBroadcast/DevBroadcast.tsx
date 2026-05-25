"use client";

import { useState, useEffect } from "react";
import { useGameContext } from "@/context/GameContext";

export default function DevBroadcast() {
  const { game, currentPlayerId } = useGameContext();
  const broadcast = game?.devBroadcast;
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!broadcast?.message) {
      setVisible(true);
      return;
    }

    setVisible(true);
    const timeout = window.setTimeout(() => setVisible(false), 2500);
    return () => window.clearTimeout(timeout);
  }, [broadcast?.timestamp, broadcast?.message]);

  if (!broadcast?.message || !visible) return null;

  const isSecret = broadcast.message.startsWith("$");
  if (isSecret && broadcast.targetPlayerId !== currentPlayerId) {
    return null;
  }

  const displayedMessage = isSecret
    ? broadcast.message.slice(1).trimStart()
    : broadcast.message;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-24 z-[60] flex justify-center px-4">
      <div className="max-w-4xl rounded-lg border border-cyan-400 bg-slate-950/95 px-8 py-5 text-center shadow-2xl shadow-cyan-950">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300">
          Message for {broadcast.targetPlayerName}
        </p>
        <p className="mt-2 text-3xl font-bold text-white">{displayedMessage}</p>
      </div>
    </div>
  );
}
