'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { RotateCw, Receipt, Sparkles, Clock, Shuffle } from 'lucide-react';
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
const MAX_WHEEL_SLICES = 18;

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: Number((cx + r * Math.cos(rad)).toFixed(3)),
    y: Number((cy + r * Math.sin(rad)).toFixed(3)),
  };
}

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

function getContrastTextColor(hex: string): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.62 ? '#1F2937' : '#FFFFFF';
}

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

/**
 * Deterministic seeded PRNG (Mulberry32) so server & client render identically on first paint
 * while allowing instant random deck reshuffles when the user taps "Shuffle 18".
 */
function sampleWheelDeck(meals: Meal[], seed: number): Meal[] {
  if (meals.length <= MAX_WHEEL_SLICES) return meals;

  // On initial paint (seed === 0), evenly sample across categories so all cuisines appear cleanly
  if (seed === 0) {
    const step = meals.length / MAX_WHEEL_SLICES;
    return Array.from({ length: MAX_WHEEL_SLICES }, (_, i) => {
      return meals[Math.floor(i * step)];
    });
  }

  let s = seed >>> 0;
  const nextRand = () => {
    s += 0x6d2b79f5;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const copy = [...meals];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(nextRand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, MAX_WHEEL_SLICES);
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
  const [shuffleSeed, setShuffleSeed] = useState<number>(0);
  const spinTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const wheelMeals = useMemo(
    () => sampleWheelDeck(meals, shuffleSeed),
    [meals, shuffleSeed]
  );

  useEffect(() => {
    return () => {
      if (spinTimerRef.current) clearTimeout(spinTimerRef.current);
    };
  }, []);

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

  const handleShuffleDeck = () => {
    if (isSpinning) return;
    setWinner(null);
    setShuffleSeed((prev) => prev + Math.floor(Math.random() * 9999) + 1);
  };

  const handleSpin = () => {
    if (isSpinning || wheelMeals.length === 0) return;

    const chosenIndex = pickWeightedIndex(wheelMeals, recentMealIds);
    const chosenMeal = wheelMeals[chosenIndex];
    const sliceAngle = 360 / wheelMeals.length;
    const midAngle = (chosenIndex + 0.5) * sliceAngle;

    const maxJitter = Math.min(sliceAngle * 0.25, 10);
    const jitter = (Math.random() * 2 - 1) * maxJitter;

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
          No meals match this filter combo yet
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Try sliding your budget up from <strong>{maxBudgetKes} bob</strong>,
          clearing search, or switching back to <strong>All Kenya</strong>.
        </p>
      </div>
    );
  }

  const sliceAngle = 360 / wheelMeals.length;
  const labelFontSize =
    wheelMeals.length > 13 ? 8.3 : wheelMeals.length > 8 ? 9.8 : 11.5;
  const emojiFontSize = wheelMeals.length > 13 ? 13 : 16;

  const rimDots = Array.from({ length: 24 }, (_, idx) => {
    const pos = polarToCartesian(CENTER, CENTER, 169, idx * 15);
    return { idx, ...pos };
  });

  return (
    <div className="bg-white rounded-[24px] p-5 sm:p-6 shadow-md border border-amber-100/80 flex flex-col items-center">
      {/* Header strip inside the wheel card */}
      <div className="w-full flex flex-wrap items-center justify-between gap-2 mb-3">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-glovo-teal">
            Supper Roulette
          </span>
          <h2 className="text-lg font-extrabold text-gray-900 leading-tight">
            Can&apos;t decide? Spin it!
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-glovo-cream text-xs font-bold text-gray-800 border border-amber-200">
            {meals.length > MAX_WHEEL_SLICES
              ? `18 of ${meals.length} on wheel`
              : `${meals.length} ${meals.length === 1 ? 'option' : 'options'}`}
          </span>

          {meals.length > MAX_WHEEL_SLICES && (
            <button
              type="button"
              onClick={handleShuffleDeck}
              disabled={isSpinning}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 hover:bg-amber-200 text-gray-900 text-xs font-extrabold transition cursor-pointer disabled:opacity-50"
            >
              <Shuffle className="w-3.5 h-3.5 text-glovo-teal" />
              <span>Shuffle</span>
            </button>
          )}
        </div>
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
          <svg
            width="36"
            height="44"
            viewBox="0 0 36 44"
            className="drop-shadow-md"
          >
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
            aria-label="Spinning Kenyan supper decision wheel"
          >
            <circle
              cx={CENTER}
              cy={CENTER}
              r="176"
              fill="#FFC244"
              stroke="#F2AE2E"
              strokeWidth="4"
            />

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

            <circle cx={CENTER} cy={CENTER} r={RADIUS + 2} fill="#FFFFFF" />

            {wheelMeals.length === 1 ? (
              <g>
                <circle
                  cx={CENTER}
                  cy={CENTER}
                  r={RADIUS}
                  fill={wheelMeals[0].wheelColor}
                />
                <text
                  x={CENTER}
                  y={CENTER - 68}
                  textAnchor="middle"
                  fontSize="32"
                >
                  {wheelMeals[0].emoji}
                </text>
                <text
                  x={CENTER}
                  y={CENTER - 36}
                  textAnchor="middle"
                  fill={getContrastTextColor(wheelMeals[0].wheelColor)}
                  fontSize="15"
                  fontWeight="800"
                >
                  {wheelMeals[0].shortLabel}
                </text>
              </g>
            ) : (
              wheelMeals.map((meal, index) => {
                const startAngle = index * sliceAngle;
                const endAngle = (index + 1) * sliceAngle;
                const midAngle = startAngle + sliceAngle / 2;
                const isRecent = recentMealIds.includes(meal.id);
                const textColor = getContrastTextColor(meal.wheelColor);

                return (
                  <g key={meal.id} opacity={isRecent ? 0.55 : 1}>
                    <path
                      d={describeWedge(
                        CENTER,
                        CENTER,
                        RADIUS,
                        startAngle,
                        endAngle
                      )}
                      fill={meal.wheelColor}
                      stroke="#FFFFFF"
                      strokeWidth="2"
                    />
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
        <span>{isSpinning ? 'Picking Tonight’s Menu...' : 'Spin for Supper!'}</span>
      </button>

      {/* Celebratory Winner Result Banner */}
      {winner && !isSpinning && (
        <div className="w-full mt-4 p-4 rounded-[20px] bg-glovo-cream border-2 border-glovo-yellow">
          <div className="flex items-start gap-2.5">
            <span className="text-3xl leading-none">{winner.emoji}</span>
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-glovo-teal">
                Tonight&apos;s Winner!
              </p>
              <h3 className="text-sm sm:text-base font-extrabold text-gray-900 leading-snug mt-0.5">
                {winner.name}
              </h3>
              <p className="text-xs text-gray-600 mt-1">{winner.localLore}</p>
              <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-gray-600 font-semibold">
                <span className="px-2 py-0.5 rounded-full bg-glovo-teal/15 text-glovo-teal font-extrabold">
                  {winner.totalCostKes} bob
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {winner.prepMinutes} mins
                </span>
                <span className="text-emerald-700 font-bold">
                  • Saves {Math.max(0, maxBudgetKes - winner.totalCostKes)} bob
                </span>
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
              Shopping List
            </button>
          </div>
        </div>
      )}
    </div>
  );
}