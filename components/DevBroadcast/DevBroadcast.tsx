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
    
    // Check for easter eggs
    const isSecret = broadcast.message.startsWith("$");
    const messageContent = isSecret ? broadcast.message.slice(1).trimStart() : broadcast.message;
    const normalizedMessage = messageContent.toLowerCase();
    const shouldTrigger = !isSecret || broadcast.targetPlayerId === currentPlayerId;
    
    if (normalizedMessage === "flashbang" && shouldTrigger) {
      // Flash the screen white
      const flash = document.createElement("div");
      flash.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: white;
        z-index: 9998;
        animation: flashFade 0.6s ease-out forwards;
      `;
      
      // Add CSS animation
      const style = document.createElement("style");
      style.textContent = `
        @keyframes flashFade {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
      `;
      document.head.appendChild(style);
      document.body.appendChild(flash);
      
      // Play loud sound
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = "sine";
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
      
      // Remove flash after animation
      setTimeout(() => flash.remove(), 600);
    }
    
    if (normalizedMessage === "boo" && shouldTrigger) {
      // Spooky jumpscare effect
      const jumpscare = document.createElement("div");
      jumpscare.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 9998;
        font-size: 150px;
        animation: scarePopIn 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards, scareFade 0.6s ease-out 0.4s forwards;
      `;
      jumpscare.textContent = "👻";
      
      // Add CSS animations
      const style = document.createElement("style");
      style.textContent = `
        @keyframes scarePopIn {
          0% { 
            opacity: 0; 
            transform: translate(-50%, -50%) scale(0.3) rotate(-20deg);
          }
          100% { 
            opacity: 1; 
            transform: translate(-50%, -50%) scale(1) rotate(0deg);
          }
        }
        @keyframes scareFade {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
      `;
      document.head.appendChild(style);
      document.body.appendChild(jumpscare);
      
      // Play scary sound (high pitch screech)
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Scary sound: starts high, goes low
      oscillator.frequency.setValueAtTime(1200, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.3);
      oscillator.type = "triangle";
      
      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
      
      // Remove jumpscare after animation
      setTimeout(() => jumpscare.remove(), 1000);
    }
    
    const timeout = window.setTimeout(() => setVisible(false), 2500);
    return () => window.clearTimeout(timeout);
  }, [broadcast?.timestamp, broadcast?.message, currentPlayerId]);

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
        {broadcast.gifUrl && (
          <div className="mt-3 flex justify-center">
            <img
              src={broadcast.gifUrl}
              alt="Message GIF"
              className="max-h-64 max-w-full rounded-lg"
              loading="lazy"
            />
          </div>
        )}
        <p className="mt-2 text-3xl font-bold text-white">{displayedMessage}</p>
      </div>
    </div>
  );
}
