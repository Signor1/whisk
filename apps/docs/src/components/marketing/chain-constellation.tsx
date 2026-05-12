"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useTheme } from "next-themes";
import { Particles } from "@/components/ui/particles";

/**
 * Hero background — three quiet layers stacked:
 *
 *   1. Topographic contour rings around two peaks (the "map").
 *   2. Magic UI canvas particles drifting across the whole hero
 *      (atmosphere). Canvas-based so a few hundred dots is cheap.
 *   3. Elevation labels next to a handful of rings (editorial).
 *
 * Everything is faint. The contours draw in on mount and then sit
 * still; the particles drift continuously.
 */

/* -------------------------------------------------------------------------- */
/*  Peaks + contour math                                                       */
/* -------------------------------------------------------------------------- */

type Peak = {
  cx: number;
  cy: number;
  rxBase: number;
  ryBase: number;
  layers: number;
  rotation: number;
};

const PEAKS: Peak[] = [
  { cx: 240, cy: 220, rxBase: 80, ryBase: 60, layers: 9, rotation: -0.35 },
  { cx: 940, cy: 540, rxBase: 90, ryBase: 70, layers: 10, rotation: 0.45 },
];

function contourPoint(
  peak: Peak,
  layerIdx: number,
  peakIdx: number,
  angle: number,
): { x: number; y: number } {
  const scale = 0.55 + layerIdx * 0.42;
  const rx = peak.rxBase * scale;
  const ry = peak.ryBase * scale;
  const rotation = peak.rotation + layerIdx * 0.04;
  const seed = peakIdx * 4.7 + layerIdx * 0.73;

  const p =
    1 +
    0.08 * Math.sin(angle * 3 + seed) +
    0.04 * Math.cos(angle * 5 + seed * 1.7);

  const localX = Math.cos(angle) * rx * p;
  const localY = Math.sin(angle) * ry * p;

  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);

  return {
    x: peak.cx + localX * cos - localY * sin,
    y: peak.cy + localX * sin + localY * cos,
  };
}

function contourPath(peak: Peak, layerIdx: number, peakIdx: number): string {
  const segments = 64;
  let path = "";
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const { x, y } = contourPoint(peak, layerIdx, peakIdx, angle);
    path +=
      i === 0
        ? `M${x.toFixed(1)},${y.toFixed(1)}`
        : ` L${x.toFixed(1)},${y.toFixed(1)}`;
  }
  return path + " Z";
}

/* -------------------------------------------------------------------------- */
/*  Elevation labels                                                            */
/* -------------------------------------------------------------------------- */

const LABELS: Array<{
  peak: number;
  layer: number;
  angle: number;
  text: string;
}> = [
  { peak: 0, layer: 2, angle: 0.2, text: "1200" },
  { peak: 0, layer: 4, angle: 0.4, text: "900" },
  { peak: 0, layer: 6, angle: 0.6, text: "600" },
  { peak: 1, layer: 3, angle: Math.PI + 0.3, text: "1100" },
  { peak: 1, layer: 5, angle: Math.PI + 0.55, text: "800" },
  { peak: 1, layer: 7, angle: Math.PI + 0.8, text: "500" },
];

/* -------------------------------------------------------------------------- */
/*  Component                                                                   */
/* -------------------------------------------------------------------------- */

export function ChainConstellation({ className }: { className?: string }) {
  const reduceMotion = useReducedMotion();
  const { resolvedTheme } = useTheme();

  // Avoid a hydration mismatch: render server-side with the light hex
  // and swap to the resolved theme's hex after mount.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Brand terracotta in light (54% L) and dark (58% L), as hex.
  const particleColor =
    mounted && resolvedTheme === "dark" ? "#d96c4c" : "#d65c3c";

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 -z-10 overflow-hidden ${className ?? ""}`}
    >
      {/* Warm wash so the contour lines have something to ride on. */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_25%,hsl(var(--primary)/0.06),transparent_55%),radial-gradient(ellipse_at_75%_75%,hsl(var(--primary)/0.04),transparent_60%)]" />

      {/* Magic UI canvas particles — 300 drifting dots, mouse-aware,
          edge-fading. Renders behind the contour SVG so the rings sit
          on top of the dust. */}
      <Particles
        className="absolute inset-0 opacity-50 h-full w-full"
        quantity={300}
        staticity={60}
        ease={70}
        size={0.5}
        color={particleColor}
      />

      <svg
        viewBox="0 0 1200 700"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
        style={{
          maskImage:
            "radial-gradient(ellipse at 50% 45%, black 60%, transparent 92%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at 50% 45%, black 60%, transparent 92%)",
        }}
      >
        {/* ── Contour rings ────────────────────────────────────── */}
        {PEAKS.flatMap((peak, peakIdx) =>
          Array.from({ length: peak.layers }).map((_, layerIdx) => {
            const targetOpacity = Math.max(0.025, 0.09 - layerIdx * 0.009);
            const delay = peakIdx * 0.6 + layerIdx * 0.14;

            return (
              <motion.path
                key={`${peakIdx}-${layerIdx}`}
                d={contourPath(peak, layerIdx, peakIdx)}
                fill="none"
                stroke="hsl(var(--foreground))"
                strokeWidth={0.7}
                initial={
                  reduceMotion
                    ? { pathLength: 1, opacity: targetOpacity }
                    : { pathLength: 0, opacity: 0 }
                }
                animate={{ pathLength: 1, opacity: targetOpacity }}
                transition={{
                  pathLength: {
                    duration: 2.6,
                    delay,
                    ease: [0.16, 1, 0.3, 1],
                  },
                  opacity: {
                    duration: 1.4,
                    delay,
                    ease: "easeOut",
                  },
                }}
              />
            );
          }),
        )}

        {/* ── Elevation labels ─────────────────────────────────── */}
        {LABELS.map((label, i) => {
          const peak = PEAKS[label.peak]!;
          const { x, y } = contourPoint(
            peak,
            label.layer,
            label.peak,
            label.angle,
          );
          return (
            <motion.text
              key={`label-${i}`}
              x={x}
              y={y}
              fontFamily="var(--font-mono)"
              fontSize={9.5}
              fontWeight={500}
              fill="hsl(var(--foreground))"
              letterSpacing="0.05em"
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 0.16 }}
              transition={{
                duration: 0.9,
                ease: "easeOut",
                delay: 0.6 + 10 * 0.14 + 0.4 + i * 0.15,
              }}
            >
              {label.text}
            </motion.text>
          );
        })}

        {/* ── Spot-height markers ──────────────────────────────── */}
        {PEAKS.map((peak, i) => (
          <motion.g
            key={`marker-${i}`}
            transform={`translate(${peak.cx}, ${peak.cy})`}
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 0.09 }}
            transition={{
              duration: 0.9,
              ease: "easeOut",
              delay: 0.6 + 10 * 0.14 + 0.3,
            }}
          >
            <line
              x1={-4}
              x2={4}
              y1={0}
              y2={0}
              stroke="hsl(var(--foreground))"
              strokeWidth={0.9}
              strokeLinecap="round"
            />
            <line
              x1={0}
              x2={0}
              y1={-4}
              y2={4}
              stroke="hsl(var(--foreground))"
              strokeWidth={0.9}
              strokeLinecap="round"
            />
          </motion.g>
        ))}
      </svg>
    </div>
  );
}
