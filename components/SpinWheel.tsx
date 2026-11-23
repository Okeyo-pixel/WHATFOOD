'use client';

import React, { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { RotateCw, Receipt, Sparkles, Clock } from 'lucide-react';
import { Meal } from '@/data/meals';

interface SpinWheelProps {
  meals: Meal[];
  recentMealIds: string[];
  maxBudgetKes: number;
  onSelectMeal: (meal: Meal) => void;
}

const CENTER = 180;
const RADIUS = 158;
const SPIN_DURATION_MS = 4400;

/**
 * Converts clockwise degrees (0° = 12 o'clock) into rounded SVG (x, y) coordinates.
 * Rounding avoids floating-point hydration mismatches between server and client.
 */
function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: Number((cx + r * Math.cos(rad)).toFixed(3)),
    y: Number((cy + r * Math.sin(rad)).toFixed(3)),
  };
}

/**
 * Generates an SVG wedge path between startAngle and endAngle (clockwise from 12 o'clock).
 */
function describeWedge(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number
): string {
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);
  const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

  return [
    `M ${cx} ${cy}`,
    `L ${start.x} ${start.y}`,
    `A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`,
    'Z',
  ].join(' ');
}

/**
 * Computes relative luminance (ITU-R BT.601) to pick dark or crisp white label text automatically.
 */
function getContrastTextColor(hex: string): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.62 ? '#1F2937' : '#FFFFFF';
}

/**
 * Weighted random picker: deprioritizes meals logged in the last 4 days (0.15x weight).
 */
function pickWeightedIndex(meals: Meal[], recentMealIds: string[]): number {
  const weights = meals.map((meal) =>
    recentMealIds.includes(meal.id) ? 0.15 : 1.0
  );
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  let threshold = Math.random() * totalWeight;

  for (let i = 0; i < weights.length; i++) {
    threshold -= weights[i];
    if (threshold <= 0) return i;
  }
  return meals.length - 1;
}

export default function SpinWheel({
  meals,
  recentMealIds,
  maxBudgetKes,
  onSelectMeal,
}: SpinWheelProps) {
  const [rotation, setRotation] = useState<number>(0);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [winner, setWinner] = useState<Meal | null>(null);
  const spinTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear pending timer on unmount
  useEffect(() => {
    return () => {
      if (spinTimerRef.current) clearTimeout(spinTimerRef.current);
    };
  }, []);

  // Reset winner banner if filters exclude the previously landed meal
  useEffect(() => {
    if (winner && !meals.some((m) => m.id === winner.id)) {
      setWinner(null);
    }
  }, [meals, winner]);

  const fireGlovoConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 72,
      origin: { y: 0.55 },
      colors: ['#FFC244', '#00A082', '#FF7A59', '#FFFFFF'],
    });
  };

  const handleSpin = () => {
    if (isSpinning || meals.length === 0) return;

    const chosenIndex = pickWeightedIndex(meals, recentMealIds);
    const chosenMeal = meals[chosenIndex];
    const sliceAngle = 360 / meals.length;
    const midAngle = (chosenIndex + 0.5) * sliceAngle;

    // Add slight natural variance inside the slice (±25% of slice width) so stops feel organic
    const maxJitter = Math.min(sliceAngle * 0.25, 12);
    const jitter = (Math.random() * 2 - 1) * maxJitter;

    // Target final modulo angle that brings chosenMeal's midpoint under the 12 o'clock pointer
    const targetMod = (((360 - midAngle + jitter) % 360) + 360) % 360;
    const currentMod = ((rotation % 360) + 360) % 360;
    const delta = ((targetMod - currentMod) + 360) % 360;
    const fullSpins = (5 + Math.floor(Math.random() * 3)) * 360;

    setIsSpinning(true);
    setWinner(null);
    setRotation((prev) => prev + fullSpins + delta);

    if (spinTimerRef.current) clearTimeout(spinTimerRef.current);

    spinTimerRef.current = setTimeout(() => {
      setIsSpinning(false);
      setWinner(chosenMeal);
      fireGlovoConfetti();
    }, SPIN_DURATION_MS);
  };

  if (meals.length === 0) {
    return (
      <div className="bg-white rounded-[24px] p-8 text-center shadow-sm border border-amber-100">
        <div className="text-4xl mb-3">🥣</div>
        <h3 className="text-lg font-bold text-gray-900">
          No meals match this combo yet
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Try sliding your budget up from <strong>{maxBudgetKes} KES</strong> or
          switching back to <strong>All Meals</strong>.
        </p>
      </div>
    );
  }

  const sliceAngle = 360 / meals.length;
  const labelFontSize =
    meals.length > 24 ? 6.8 : meals.length > 13 ? 8.5 : meals.length > 8 ? 10 : 11.5;
  const emojiFontSize = meals.length > 24 ? 10 : meals.length > 13 ? 13 : 16;
  // Decorative perimeter bulbs around the yellow outer bezel
  const rimDots = Array.from({ length: 24 }, (_, idx) => {
    const pos = polarToCartesian(CENTER, CENTER, 169, idx * 15);
    return { idx, ...pos };
  });

  return (
    <div className="bg-white rounded-[24px] p-5 sm:p-6 shadow-md border border-amber-100/80 flex flex-col items-center">
      {/* Header strip inside the wheel card */}
      <div className="w-full flex items-center justify-between mb-3">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-glovo-teal">
            Supper Roulette
          </span>
          <h2 className="text-lg font-extrabold text-gray-900 leading-tight">
            Can&apos;t decide? Spin it!
          </h2>
        </div>
        <span className="px-3 py-1 rounded-full bg-glovo-cream text-xs font-bold text-gray-800 border border-amber-200">
          {meals.length} {meals.length === 1 ? 'option' : 'options'}
        </span>
      </div>

      {/* Wheel Container */}
      <div className="relative w-full max-w-[330px] aspect-square my-2 select-none">
        {/* Top Glovo Pointer Pin */}
        <div
          className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-20 transition-transform duration-150 ${
            isSpinning ? 'scale-110' : 'scale-100'
          }`}
          aria-hidden="true"
        >
          <svg width="36" height="44" viewBox="0 0 36 44" className="drop-shadow-md">
            <path
              d="M18 42 L5 18 A14 14 0 1 1 31 18 Z"
              fill="#00A082"
              stroke="#FFFFFF"
              strokeWidth="3"
            />
            <circle cx="18" cy="15" r="5" fill="#FFC244" />
          </svg>
        </div>

        {/* Rotating SVG Wheel */}
        <div
          className="w-full h-full will-change-transform"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: isSpinning
              ? `transform ${SPIN_DURATION_MS}ms cubic-bezier(0.12, 0.85, 0.18, 1)`
              : 'none',
          }}
        >
          <svg
            viewBox="0 0 360 360"
            className="w-full h-full drop-shadow-lg"
            role="img"
            aria-label="Spinning supper decision wheel"
          >
            {/* Outer Glovo Yellow Bezel */}
            <circle
              cx={CENTER}
              cy={CENTER}
              r="176"
              fill="#FFC244"
              stroke="#F2AE2E"
              strokeWidth="4"
            />

            {/* Decorative Rim Dots */}
            {rimDots.map((dot) => (
              <circle
                key={dot.idx}
                cx={dot.x}
                cy={dot.y}
                r="2.6"
                fill={dot.idx % 2 === 0 ? '#FFFFFF' : '#00A082'}
                opacity="0.9"
              />
            ))}

            {/* Inner White Border Ring */}
            <circle cx={CENTER} cy={CENTER} r={RADIUS + 2} fill="#FFFFFF" />

            {/* Meal Slices */}
            {meals.length === 1 ? (
              <g>
                <circle
                  cx={CENTER}
                  cy={CENTER}
                  r={RADIUS}
                  fill={meals[0].wheelColor}
                />
                <text
                  x={CENTER}
                  y={CENTER - 68}
                  textAnchor="middle"
                  fontSize="32"
                >
                  {meals[0].emoji}
                </text>
                <text
                  x={CENTER}
                  y={CENTER - 36}
                  textAnchor="middle"
                  fill={getContrastTextColor(meals[0].wheelColor)}
                  fontSize="15"
                  fontWeight="800"
                >
                  {meals[0].shortLabel}
                </text>
              </g>
            ) : (
              meals.map((meal, index) => {
                const startAngle = index * sliceAngle;
                const endAngle = (index + 1) * sliceAngle;
                const midAngle = startAngle + sliceAngle / 2;
                const isRecent = recentMealIds.includes(meal.id);
                const textColor = getContrastTextColor(meal.wheelColor);

                return (
                  <g key={meal.id} opacity={isRecent ? 0.55 : 1}>
                    <path
                      d={describeWedge(CENTER, CENTER, RADIUS, startAngle, endAngle)}
                      fill={meal.wheelColor}
                      stroke="#FFFFFF"
                      strokeWidth="2"
                    />
                    {/* Radial label aligned outward from center hub */}
                    <g transform={`rotate(${midAngle - 90} ${CENTER} ${CENTER})`}>
                      <text
                        x={CENTER + RADIUS - 18}
                        y={CENTER + 1}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize={emojiFontSize}
                      >
                        {meal.emoji}
                      </text>
                      <text
                        x={CENTER + RADIUS - 34}
                        y={CENTER + 1}
                        textAnchor="end"
                        dominantBaseline="middle"
                        fill={textColor}
                        fontSize={labelFontSize}
                        fontWeight="800"
                        style={{ letterSpacing: '-0.01em' }}
                      >
                        {meal.shortLabel}
                      </text>
                    </g>
                  </g>
                );
              })
            )}
          </svg>
        </div>

        {/* Center Tactile Spin Hub */}
        <button
          type="button"
          onClick={handleSpin}
          disabled={isSpinning}
          aria-label="Spin the supper wheel"
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-16 h-16 rounded-full bg-glovo-teal hover:bg-glovo-teal-dark active:scale-95 text-white font-extrabold text-xs tracking-wide shadow-lg border-4 border-white flex flex-col items-center justify-center transition cursor-pointer disabled:opacity-80 disabled:cursor-wait"
        >
          <RotateCw
            className={`w-4 h-4 mb-0.5 ${isSpinning ? 'animate-spin' : ''}`}
          />
          <span>{isSpinning ? '...' : 'SPIN'}</span>
        </button>
      </div>

      {/* Primary Thumb-Friendly CTA Button */}
      <button
        type="button"
        onClick={handleSpin}
        disabled={isSpinning}
        className="w-full mt-3 py-3.5 px-6 rounded-full bg-glovo-teal hover:bg-glovo-teal-dark active:scale-[0.98] text-white font-extrabold text-base shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-wait"
      >
        <Sparkles className="w-5 h-5" />
        <span>{isSpinning ? 'Picking Wangige Supper...' : 'Spin for Supper!'}</span>
      </button>

      {/* Celebratory Winner Result Banner */}
      {winner && !isSpinning && (
        <div className="w-full mt-4 p-4 rounded-[20px] bg-glovo-cream border-2 border-glovo-yellow animate-fade-in">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <span className="text-3xl leading-none">{winner.emoji}</span>
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-glovo-teal">
                  Tonight&apos;s Winner!
                </p>
                <h3 className="text-sm sm:text-base font-extrabold text-gray-900 leading-snug mt-0.5">
                  {winner.name}
                </h3>
                <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-600 font-semibold">
                  <span className="px-2 py-0.5 rounded-full bg-glovo-teal/15 text-glovo-teal font-extrabold">
                    {winner.totalCostKes} KES
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {winner.prepMinutes} mins
                  </span>
                  <span className="text-emerald-700 font-bold">
                    • Saves {Math.max(0, maxBudgetKes - winner.totalCostKes)} KES
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 mt-3.5">
            <button
              type="button"
              onClick={handleSpin}
              className="py-2.5 px-3 rounded-full bg-white hover:bg-amber-50 text-gray-800 font-bold text-xs sm:text-sm border border-amber-200 transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RotateCw className="w-4 h-4" />
              Spin Again
            </button>
            <button
              type="button"
              onClick={() => onSelectMeal(winner)}
              className="py-2.5 px-3 rounded-full bg-glovo-teal hover:bg-glovo-teal-dark text-white font-bold text-xs sm:text-sm shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Receipt className="w-4 h-4" />
              Mama Mboga List
            </button>
          </div>
        </div>
      )}
    </div>
  );
}