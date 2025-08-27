"use client";

import React, { useState, useRef, useEffect } from "react";

export type TooltipProps = {
  content: React.ReactNode;
  children: React.ReactElement;
  side?: "top" | "bottom" | "left" | "right";
  delayMs?: number;
  className?: string;
};

export function Tooltip({ content, children, side = "top", delayMs = 150, className = "" }: TooltipProps) {
  const [open, setOpen] = useState(false);
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [timer]);

  const show = () => {
    if (timer) clearTimeout(timer);
    setTimer(setTimeout(() => setOpen(true), delayMs));
  };
  const hide = () => {
    if (timer) clearTimeout(timer);
    setOpen(false);
  };

  const positionClasses =
    side === "top"
      ? "bottom-full left-1/2 -translate-x-1/2 mb-2"
      : side === "bottom"
      ? "top-full left-1/2 -translate-x-1/2 mt-2"
      : side === "left"
      ? "right-full top-1/2 -translate-y-1/2 mr-2"
      : "left-full top-1/2 -translate-y-1/2 ml-2"; // right

  return (
    <div
      ref={ref}
      className="relative inline-flex"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {open && (
        <div
          role="tooltip"
          className={`pointer-events-none absolute z-50 max-w-xs rounded-md border bg-white px-2 py-1 text-xs text-gray-700 shadow-md ${positionClasses} ${className}`}
        >
          {content}
          <span
            className={`absolute h-0 w-0 border-transparent ${
              side === "top"
                ? "left-1/2 -translate-x-1/2 top-full border-t-white border-x-8 border-t-8"
                : side === "bottom"
                ? "left-1/2 -translate-x-1/2 bottom-full border-b-white border-x-8 border-b-8"
                : side === "left"
                ? "top-1/2 -translate-y-1/2 left-full border-l-white border-y-8 border-l-8"
                : "top-1/2 -translate-y-1/2 right-full border-r-white border-y-8 border-r-8"
            }`}
          />
        </div>
      )}
    </div>
  );
}
