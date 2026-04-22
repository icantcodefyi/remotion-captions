"use client";

import { type FC, type PointerEvent, useCallback, useRef, useState } from "react";
import { Move } from "lucide-react";
import type { CaptionPosition } from "@/lib/types";
import { POSITION_CLAMP } from "@/lib/types";

type Props = {
  position: CaptionPosition;
  onChange: (next: CaptionPosition) => void;
};

/** Offset of the handle from the caption's centre, as a fraction of preview height. */
const HANDLE_OFFSET = 0.14;

const clamp = (v: number, min: number, max: number) =>
  Math.min(Math.max(v, min), max);

/** Handle sits below the caption normally; flips above when the caption is near the bottom. */
const handleOffsetFor = (y: number) =>
  y > 1 - HANDLE_OFFSET - 0.05 ? -HANDLE_OFFSET : HANDLE_OFFSET;

export const CaptionPositionOverlay: FC<Props> = ({ position, onChange }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{
    clientX: number;
    clientY: number;
    posX: number;
    posY: number;
  } | null>(null);
  const [dragging, setDragging] = useState(false);

  const handleOffset = handleOffsetFor(position.y);
  const handleY = position.y + handleOffset;

  const applyDelta = useCallback(
    (clientX: number, clientY: number) => {
      const start = dragStartRef.current;
      const el = containerRef.current;
      if (!start || !el) return;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const dx = (clientX - start.clientX) / rect.width;
      const dy = (clientY - start.clientY) / rect.height;
      onChange({
        x: clamp(start.posX + dx, POSITION_CLAMP.minX, POSITION_CLAMP.maxX),
        y: clamp(start.posY + dy, POSITION_CLAMP.minY, POSITION_CLAMP.maxY),
      });
    },
    [onChange],
  );

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      posX: position.x,
      posY: position.y,
    };
    setDragging(true);
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!dragStartRef.current) return;
    e.preventDefault();
    applyDelta(e.clientX, e.clientY);
  };

  const endDrag = (e: PointerEvent<HTMLDivElement>) => {
    if (!dragStartRef.current) return;
    dragStartRef.current = null;
    setDragging(false);
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  return (
    <div
      ref={containerRef}
      aria-hidden
      className="absolute inset-0"
      style={{ pointerEvents: "none" }}
    >
      {dragging ? (
        <>
          <div
            className="absolute left-0 right-0 h-px"
            style={{
              top: `${position.y * 100}%`,
              background:
                "linear-gradient(to right, transparent, rgba(255,255,255,0.6) 20%, rgba(255,255,255,0.6) 80%, transparent)",
              pointerEvents: "none",
            }}
          />
          <div
            className="absolute top-0 bottom-0 w-px"
            style={{
              left: `${position.x * 100}%`,
              background:
                "linear-gradient(to bottom, transparent, rgba(255,255,255,0.6) 20%, rgba(255,255,255,0.6) 80%, transparent)",
              pointerEvents: "none",
            }}
          />
        </>
      ) : null}

      <div
        role="slider"
        tabIndex={0}
        aria-label="Caption position, drag to reposition"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(position.y * 100)}
        aria-valuetext={`x ${Math.round(position.x * 100)}%, y ${Math.round(
          position.y * 100,
        )}%`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={(e) => {
          const step = e.shiftKey ? 0.05 : 0.01;
          let nx = position.x;
          let ny = position.y;
          if (e.key === "ArrowLeft") nx -= step;
          else if (e.key === "ArrowRight") nx += step;
          else if (e.key === "ArrowUp") ny -= step;
          else if (e.key === "ArrowDown") ny += step;
          else return;
          e.preventDefault();
          onChange({
            x: clamp(nx, POSITION_CLAMP.minX, POSITION_CLAMP.maxX),
            y: clamp(ny, POSITION_CLAMP.minY, POSITION_CLAMP.maxY),
          });
        }}
        className="absolute flex items-center gap-1 select-none"
        style={{
          left: `${position.x * 100}%`,
          top: `${clamp(handleY, 0.02, 0.98) * 100}%`,
          transform: "translate(-50%, -50%)",
          pointerEvents: "auto",
          touchAction: "none",
          cursor: dragging ? "grabbing" : "grab",
          padding: "6px 10px",
          borderRadius: 999,
          background: dragging
            ? "rgba(255,255,255,0.96)"
            : "rgba(0,0,0,0.55)",
          color: dragging ? "#0a0a0a" : "#fff",
          border: dragging
            ? "1px solid rgba(0,0,0,0.15)"
            : "1px solid rgba(255,255,255,0.2)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          boxShadow: dragging
            ? "0 8px 22px rgba(0,0,0,0.35), 0 0 0 4px rgba(255,255,255,0.15)"
            : "0 4px 14px rgba(0,0,0,0.35)",
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: 0.2,
          transition: dragging
            ? "none"
            : "top 220ms cubic-bezier(0.22,1,0.36,1), background 160ms, color 160ms, box-shadow 160ms",
          outline: "none",
        }}
      >
        <Move className="h-3 w-3" />
        <span style={{ lineHeight: 1 }}>
          {dragging
            ? `${Math.round(position.x * 100)}% · ${Math.round(position.y * 100)}%`
            : "position"}
        </span>
      </div>
    </div>
  );
};
