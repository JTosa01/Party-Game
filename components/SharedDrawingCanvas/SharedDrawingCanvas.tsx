"use client";

import { useRef, useEffect, useState } from "react";
import { onSnapshot, doc } from "firebase/firestore";
import { db } from "@/services/firebase";

interface SharedDrawingCanvasProps {
  gameId: string;
  round: number;
  onSubmit: (drawingData: string) => Promise<void>;
  isLoading?: boolean;
  disabled?: boolean;
  isCurrentPlayerTurn?: boolean;
  currentDrawerName?: string;
  strokeColor?: string;
}

export default function SharedDrawingCanvas({
  gameId,
  round,
  onSubmit,
  isLoading = false,
  disabled = false,
  isCurrentPlayerTurn = true,
  currentDrawerName = "Someone",
  strokeColor = "#2563eb",
}: SharedDrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [accumulatedData, setAccumulatedData] = useState<string | null>(null);
  const [history, setHistory] = useState<ImageData[]>([]);
  const drawingLocked = disabled || isLoading || !isCurrentPlayerTurn;

  // Load accumulated drawing data from previous turns
  useEffect(() => {
    const gameRef = doc(db, "games", gameId);

    const unsub = onSnapshot(gameRef, (snap) => {
      const data = snap.data();
      if (data?.accumulatedCanvasData) {
        setAccumulatedData(data.accumulatedCanvasData);
      } else {
        setAccumulatedData(null);
      }
    });

    return () => unsub();
  }, [gameId, round]);

  // Draw accumulated data onto canvas when it changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (accumulatedData) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        // Save state to history after loading accumulated data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        setHistory([imageData]);
        setHasDrawn(false);
      };
      img.src = accumulatedData;
    } else {
      // Initialize history with blank state
      const blankState = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setHistory([blankState]);
      setHasDrawn(false);
    }
  }, [accumulatedData, round]); // Reset when round changes

  const getCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const clientX = "clientX" in e ? e.clientX : e.touches[0].clientX;
    const clientY = "clientY" in e ? e.clientY : e.touches[0].clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (drawingLocked) return;
    e.preventDefault();
    const coords = getCoords(e);
    if (!coords) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(coords.x, coords.y);
      setIsDrawing(true);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || drawingLocked) return;
    e.preventDefault();
    const coords = getCoords(e);
    if (!coords) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = strokeColor;
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
      if (!hasDrawn) setHasDrawn(true);
    }
  };

  const stopDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    // Save state to history after stroke ends
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setHistory((prev) => [...prev, imageData]);
    }
    setIsDrawing(false);
  };

  const undo = () => {
    const canvas = canvasRef.current;
    if (!canvas || history.length <= 1) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Remove last state from history
    const newHistory = history.slice(0, -1);
    setHistory(newHistory);

    // Restore previous state
    const previousState = newHistory[newHistory.length - 1];
    ctx.putImageData(previousState, 0, 0);

    // Update hasDrawn state
    setHasDrawn(newHistory.length > 1);
  };

  const clearMyDrawing = () => {
    // Only clear what this player drew (reset to accumulated data state)
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear to accumulated data or white
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (accumulatedData) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        setHistory([imageData]);
      };
      img.src = accumulatedData;
    } else {
      const blankState = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setHistory([blankState]);
    }
    setHasDrawn(false);
  };

  const handleSubmit = async () => {
    if (drawingLocked || !hasDrawn) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const drawingData = canvas.toDataURL("image/png");
    try {
      await onSubmit(drawingData);
      setHasDrawn(false);
    } catch (err) {
      console.error("Failed to submit shared drawing:", err);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-blue-700 bg-blue-950/60 p-4 text-center">
        <p className="text-2xl font-bold text-blue-100">
          {currentDrawerName} is drawing
        </p>
        <p className="mt-1 text-sm text-blue-200">
          {isCurrentPlayerTurn
            ? "Add to the shared canvas, then submit your turn."
            : "You can watch the shared canvas update while you wait."}
        </p>
        <div className="mt-3 flex items-center justify-center gap-2 text-sm font-semibold text-blue-100">
          <span
            className="h-4 w-4 rounded-full border border-white/70"
            style={{ backgroundColor: strokeColor }}
          />
          <span>{currentDrawerName}&apos;s color</span>
        </div>
      </div>
      <div className="border-2 border-slate-600 rounded-lg overflow-hidden bg-white">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className={`h-[60vh] min-h-[420px] max-h-[720px] w-full ${
            drawingLocked ? "cursor-not-allowed" : "cursor-crosshair"
          }`}
          style={{ display: "block", touchAction: "none" }}
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={clearMyDrawing}
          disabled={drawingLocked || !hasDrawn}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition disabled:bg-slate-700 disabled:cursor-not-allowed font-medium"
          title="Clear your strokes"
        >
          Clear
        </button>
        <button
          onClick={undo}
          disabled={drawingLocked || history.length <= 1}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition disabled:bg-slate-700 disabled:cursor-not-allowed font-medium"
          title="Undo last stroke"
        >
          ↶ Undo
        </button>
        <button
          onClick={handleSubmit}
          disabled={drawingLocked || !hasDrawn}
          className="flex-1 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:bg-slate-600 font-semibold"
        >
          {isLoading ? "Submitting..." : "Submit Turn"}
        </button>
      </div>
    </div>
  );
}
