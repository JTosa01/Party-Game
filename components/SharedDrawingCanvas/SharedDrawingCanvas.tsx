"use client";

import { useRef, useEffect, useState } from "react";
import { onSnapshot, doc } from "firebase/firestore";
import { db } from "@/services/firebase";

interface SharedDrawingCanvasProps {
  gameId: string;
  round: number;
  onSubmit: (drawingData: string, accumulatedCanvasData?: string) => Promise<void>;
  isLoading?: boolean;
  disabled?: boolean;
}

export default function SharedDrawingCanvas({
  gameId,
  round,
  onSubmit,
  isLoading = false,
  disabled = false,
}: SharedDrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [accumulatedData, setAccumulatedData] = useState<string | null>(null);

  // Load accumulated drawing data from previous turns
  useEffect(() => {
    setHasDrawn(false);
    const gameRef = doc(db, "games", gameId);

    const unsub = onSnapshot(gameRef, (snap) => {
      const data = snap.data();
      if (data?.sharedCanvasData) {
        setAccumulatedData(data.sharedCanvasData);
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
        ctx.drawImage(img, 0, 0);
      };
      img.src = accumulatedData;
    }
  }, [accumulatedData]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (disabled || isLoading) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      setIsDrawing(true);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || disabled || isLoading) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#1a1aff";
      ctx.lineTo(x, y);
      ctx.stroke();
      if (!hasDrawn) setHasDrawn(true);
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleSubmit = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const drawingData = canvas.toDataURL("image/png");
    try {
      await onSubmit(drawingData, accumulatedData || undefined);
      setHasDrawn(false);
    } catch (err) {
      console.error("Failed to submit shared drawing:", err);
    }
  };

  return (
    <div className="space-y-4">
      <div className="border-2 border-slate-600 rounded-lg overflow-hidden bg-white">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          className="w-full h-80 cursor-crosshair"
          style={{ display: "block", touchAction: "none" }}
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={disabled || isLoading || !hasDrawn}
        className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:bg-slate-600 font-semibold"
      >
        {isLoading ? "Submitting..." : "Submit Turn"}
      </button>
    </div>
  );
}
