"use client";

import { useRef, useEffect, useState } from "react";

interface DrawingCanvasProps {
  onSubmit: (drawingData: string) => Promise<void>;
  isLoading?: boolean;
  disabled?: boolean;
}

export default function DrawingCanvas({
  onSubmit,
  isLoading = false,
  disabled = false,
}: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Set initial background to white
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  const getCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const clientX = "clientX" in e ? e.clientX : e.touches[0].clientX;
    const clientY = "clientY" in e ? e.clientY : e.touches[0].clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (disabled || isLoading) return;
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
    if (!isDrawing || disabled || isLoading) return;
    e.preventDefault();
    const coords = getCoords(e);
    if (!coords) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#000000";
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
      if (!hasDrawn) setHasDrawn(true);
    }
  };

  const stopDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      setHasDrawn(false);
    }
  };

  const handleSubmit = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const drawingData = canvas.toDataURL("image/png");
    try {
      await onSubmit(drawingData);
      clearCanvas();
    } catch (err) {
      console.error("Failed to submit drawing:", err);
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
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-64 cursor-crosshair"
          style={{ display: "block", touchAction: "none" }}
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={clearCanvas}
          disabled={disabled || isLoading || !hasDrawn}
          className="flex-1 px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition disabled:bg-slate-700 disabled:cursor-not-allowed"
        >
          Clear
        </button>
        <button
          onClick={handleSubmit}
          disabled={disabled || isLoading || !hasDrawn}
          className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:bg-slate-600 disabled:cursor-not-allowed"
        >
          {isLoading ? "Submitting..." : "Submit Drawing"}
        </button>
      </div>
    </div>
  );
}
