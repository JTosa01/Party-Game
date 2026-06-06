export const SHARED_DRAWING_COLORS = [
  "#2563eb",
  "#dc2626",
  "#16a34a",
  "#ca8a04",
  "#9333ea",
  "#0891b2",
  "#ea580c",
  "#db2777",
  "#65a30d",
  "#4f46e5",
];

export function getSharedDrawingColor(index: number): string {
  return SHARED_DRAWING_COLORS[index % SHARED_DRAWING_COLORS.length];
}
