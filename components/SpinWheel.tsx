'use client';

import React, { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { RotateCw, Receipt, Sparkles, Clock, Crown, Users } from 'lucide-react';
import { Meal, PrimaryCategory } from '@/data/meals';

interface SpinWheelProps {
  meals: Meal[];
  recentMealIds: string[];
  maxBudgetKes: number;
  isFeastMode?: boolean;
  onSelectMeal: (meal: Meal) => void;
}

type RevealPhase = 'idle' | 'returning' | 'shaking' | 'rolling' | 'revealed';

const RETURN_MS = 440;
const SHAKE_MS = 580;
const ROLL_MS = 1380;

function pickMysteryMeal(
  meals: Meal[],
  recentMealIds: string[],
  previousId?: string
): Meal {
  const pool =
    meals.length > 1 && previousId
      ? meals.filter((m) => m.id !== previousId)
      : meals;

  const weights = pool.map((meal) =>
    recentMealIds.includes(meal.id) ? 0.15 : 1.0
  );
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  let threshold = Math.random() * totalWeight;

  for (let i = 0; i < weights.length; i++) {
    threshold -= weights[i];
    if (threshold <= 0) return pool[i];
  }
  return pool[pool.length - 1];
}

function PlatedFoodSilhouette({
  category,
  accentColor,
}: {
  category: PrimaryCategory;
  accentColor: string;
}) {
  switch (category) {
    case 'ugali':
      return (
        <g>
          <ellipse cx="236" cy="140" rx="34" ry="18" fill="#B45309" opacity="0.92" />
          <ellipse cx="238" cy="138" rx="24" ry="11" fill="#D97706" opacity="0.85" />
          <circle cx="228" cy="136" r="5" fill="#7C2D12" />
          <circle cx="244" cy="141" r="4.5" fill="#7C2D12" />
          <circle cx="250" cy="133" r="3" fill="#22C55E" />

          <ellipse cx="230" cy="160" rx="28" ry="13" fill="#15803D" />
          <ellipse cx="226" cy="157" rx="18" ry="8" fill="#22C55E" opacity="0.7" />
          <circle cx="237" cy="161" r="3" fill="#EF4444" />

          <path
            d="M 146 158 C 146 126, 204 126, 204 158 C 204 170, 146 170, 146 158 Z"
            fill="#FFFDF5"
            stroke="#E7DFC8"
            strokeWidth="2"
          />
          <path
            d="M 157 146 Q 175 139 192 146"
            fill="none"
            stroke="#EFE7D1"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </g>
      );

    case 'rice':
      return (
        <g>
          <ellipse cx="234" cy="152" rx="35" ry="19" fill={accentColor} opacity="0.88" />
          <ellipse cx="236" cy="150" rx="23" ry="11" fill="#92400E" opacity="0.45" />
          <circle cx="244" cy="148" r="4" fill="#22C55E" />
          <circle cx="229" cy="157" r="3.5" fill="#F97316" />

          <path
            d="M 146 156 C 150 124, 214 124, 218 156 C 218 168, 146 168, 146 156 Z"
            fill="#FFFBEB"
            stroke="#FDE68A"
            strokeWidth="2"
          />
          <circle cx="166" cy="144" r="2.2" fill="#22C55E" />
          <circle cx="182" cy="139" r="2.5" fill="#F97316" />
          <circle cx="195" cy="148" r="2.2" fill="#15803D" />
          <circle cx="174" cy="154" r="2.2" fill="#F59E0B" />
          <circle cx="204" cy="154" r="2" fill="#EF4444" />
        </g>
      );

    case 'tubers':
      return (
        <g>
          <ellipse cx="236" cy="146" rx="34" ry="18" fill="#9A3412" opacity="0.9" />
          <circle cx="229" cy="144" r="5" fill="#7C2D12" />
          <circle cx="245" cy="149" r="4.5" fill="#7C2D12" />
          <circle cx="242" cy="139" r="3" fill="#22C55E" />

          <path
            d="M 144 157 C 146 125, 208 125, 210 157 C 210 169, 144 169, 144 157 Z"
            fill="#FEF08A"
            stroke="#EAB308"
            strokeWidth="2"
          />
          <circle cx="165" cy="145" r="3.5" fill="#16A34A" opacity="0.75" />
          <circle cx="182" cy="151" r="3" fill="#16A34A" opacity="0.75" />
          <circle cx="192" cy="142" r="3.2" fill="#F59E0B" opacity="0.75" />

          <path
            d="M 192 164 Q 214 176 238 164 Q 215 166 192 164 Z"
            fill="#84CC16"
            stroke="#4D7C0F"
            strokeWidth="1.5"
          />
        </g>
      );

    case 'chapati':
      return (
        <g>
          <ellipse cx="238" cy="144" rx="28" ry="16" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="2" />
          <ellipse cx="238" cy="143" rx="22" ry="11" fill="#C2410C" />
          <circle cx="233" cy="142" r="2.5" fill="#22C55E" />
          <circle cx="245" cy="144" r="2.5" fill="#FACC15" />

          <ellipse cx="176" cy="154" rx="34" ry="18" fill="#F6C46B" stroke="#D99B38" strokeWidth="2" />
          <ellipse cx="188" cy="148" rx="33" ry="17" fill="#FBD38D" stroke="#D99B38" strokeWidth="2" />
          <ellipse cx="178" cy="145" rx="5" ry="2.5" fill="#B45309" opacity="0.55" />
          <ellipse cx="196" cy="151" rx="6" ry="2.5" fill="#B45309" opacity="0.5" />
          <ellipse cx="188" cy="140" rx="4" ry="2" fill="#B45309" opacity="0.45" />
        </g>
      );

    case 'light':
      return (
        <g>
          <ellipse cx="205" cy="149" rx="54" ry="24" fill="#DCFCE7" stroke="#86EFAC" strokeWidth="2" />
          <ellipse cx="186" cy="146" rx="20" ry="10" fill="#22C55E" opacity="0.8" />
          <ellipse cx="222" cy="148" rx="22" ry="10" fill="#16A34A" opacity="0.75" />
          <ellipse cx="204" cy="155" rx="20" ry="8" fill="#84CC16" />
          <circle cx="190" cy="150" r="5" fill="#EF4444" />
          <circle cx="218" cy="143" r="5" fill="#EF4444" />
          <ellipse cx="206" cy="144" rx="10" ry="5" fill="#FDE047" />
        </g>
      );

    case 'lunch':
      return (
        <g>
          <g fill="#FBBF24" stroke="#D97706" strokeWidth="1.2">
            <rect x="152" y="138" width="26" height="6" rx="3" transform="rotate(-14 165 141)" />
            <rect x="158" y="146" width="28" height="6" rx="3" transform="rotate(8 172 149)" />
            <rect x="150" y="153" width="26" height="6" rx="3" transform="rotate(-6 163 156)" />
            <rect x="166" y="156" width="26" height="6" rx="3" transform="rotate(15 179 159)" />
          </g>
          <ellipse cx="228" cy="149" rx="30" ry="17" fill="#B45309" stroke="#78350F" strokeWidth="1.5" />
          <ellipse cx="225" cy="145" rx="18" ry="8" fill="#D97706" opacity="0.7" />
          <circle cx="202" cy="161" r="4" fill="#EF4444" />
          <circle cx="211" cy="163" r="3.5" fill="#22C55E" />
        </g>
      );

    case 'breakfast':
      return (
        <g>
          <rect x="218" y="124" width="34" height="34" rx="8" fill="#FFFFFF" stroke="#00A082" strokeWidth="2.5" />
          <path d="M 252 132 C 262 132, 262 149, 252 149" fill="none" stroke="#00A082" strokeWidth="3" strokeLinecap="round" />
          <ellipse cx="235" cy="127" rx="13" ry="4" fill="#D97706" opacity="0.75" />

          <path
            d="M 152 158 L 176 130 L 204 156 Z"
            fill="#F59E0B"
            stroke="#B45309"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <ellipse cx="195" cy="160" rx="15" ry="8" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="1.5" />
          <circle cx="195" cy="160" r="4.5" fill="#FACC15" />
        </g>
      );

    case 'snacks':
    default:
      return (
        <g>
          <path
            d="M 152 156 L 174 132 L 194 156 Z"
            fill="#F59E0B"
            stroke="#B45309"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M 178 161 L 200 137 L 220 161 Z"
            fill="#FBBF24"
            stroke="#B45309"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <ellipse cx="240" cy="150" rx="20" ry="11" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="2" />
          <ellipse cx="240" cy="149" rx="14" ry="7" fill="#DC2626" />
          <circle cx="236" cy="148" r="2" fill="#22C55E" />
        </g>
      );
  }
}

export default function SpinWheel({
  meals,
  recentMealIds,
  maxBudgetKes,
  isFeastMode = false,
  onSelectMeal,
}: SpinWheelProps) {
  const [phase, setPhase] = useState<RevealPhase>('idle');
  const [winner, setWinner] = useState<Meal | null>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearAllTimers = () => {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];
  };

  useEffect(() => {
    return () => clearAllTimers();
  }, []);

  useEffect(() => {
    if (winner && !meals.some((m) => m.id === winner.id)) {
      clearAllTimers();
      setWinner(null);
      setPhase('idle');
    }
  }, [meals, winner]);

  const fireGlovoConfetti = () => {
    confetti({
      particleCount: isFeastMode ? 105 : 85,
      spread: 76,
      origin: { y: 0.52 },
      colors: isFeastMode
        ? ['#FFC244', '#F59E0B', '#00A082', '#1F2937', '#FFFFFF']
        : ['#FFC244', '#00A082', '#FF7A59', '#FFFFFF'],
    });
  };

  const runRevealSequence = (nextMeal: Meal) => {
    setWinner(nextMeal);
    setPhase('shaking');

    const rollTimer = setTimeout(() => {
      setPhase('rolling');
    }, SHAKE_MS);

    const finishTimer = setTimeout(() => {
      setPhase('revealed');
      fireGlovoConfetti();
    }, SHAKE_MS + ROLL_MS);

    timersRef.current.push(rollTimer, finishTimer);
  };

  const handleCook = () => {
    if (
      meals.length === 0 ||
      phase === 'returning' ||
      phase === 'shaking' ||
      phase === 'rolling'
    ) {
      return;
    }

    clearAllTimers();
    const chosenMeal = pickMysteryMeal(meals, recentMealIds, winner?.id);

    if (phase === 'revealed') {
      setPhase('returning');
      const restartTimer = setTimeout(() => {
        runRevealSequence(chosenMeal);
      }, RETURN_MS);
      timersRef.current.push(restartTimer);
      return;
    }

    runRevealSequence(chosenMeal);
  };

  if (meals.length === 0) {
    return (
      <div className="bg-white rounded-[24px] p-8 text-center shadow-sm border border-amber-100">
        <div className="text-4xl mb-3">{isFeastMode ? '👑' : '🥣'}</div>
        <h3 className="text-lg font-bold text-gray-900">
          No {isFeastMode ? 'payday feasts' : 'meals'} match this filter combo yet
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Try sliding your budget up from{' '}
          <strong>{maxBudgetKes.toLocaleString()} bob</strong>, clearing search,
          or switching back to <strong>All Kenya</strong>.
        </p>
      </div>
    );
  }

  const isAnimating =
    phase === 'returning' || phase === 'shaking' || phase === 'rolling';
  const isUncovered = phase === 'rolling' || phase === 'revealed';

  const bowlAnimClass =
    phase === 'shaking'
      ? 'lmc-bowl-shake'
      : phase === 'rolling'
      ? 'lmc-bowl-roll'
      : phase === 'revealed'
      ? 'lmc-bowl-settled'
      : phase === 'returning'
      ? 'lmc-bowl-return'
      : '';

  const shadowAnimClass =
    phase === 'rolling'
      ? 'lmc-shadow-roll'
      : phase === 'revealed'
      ? 'lmc-shadow-settled'
      : phase === 'returning'
      ? 'lmc-shadow-return'
      : '';

  const rimBandColor = isFeastMode ? '#D97706' : '#00A082';
  const pillFillColor = isFeastMode ? '#1A1D24' : '#00A082';
  const pillTextColor = isFeastMode ? '#FFC244' : '#FFFFFF';

  return (
    <div
      className={`bg-white rounded-[24px] p-5 sm:p-6 shadow-md border flex flex-col items-center transition-colors ${
        isFeastMode ? 'border-amber-300/90' : 'border-amber-100/80'
      }`}
    >
      {/* Top Card Header */}
      <div className="w-full flex flex-wrap items-center justify-between gap-2 mb-2">
        <div>
          <span
            className={`text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1 ${
              isFeastMode ? 'text-amber-600' : 'text-glovo-teal'
            }`}
          >
            {isFeastMode && <Crown className="w-3.5 h-3.5" />}
            {isFeastMode ? 'VIP Payday Cloche Reveal' : 'Mystery Cloche Reveal'}
          </span>
          <h2 className="text-lg font-extrabold text-gray-900 leading-tight">
            {isFeastMode
              ? 'Ready to spoil yourself?'
              : "What's under the bowl?"}
          </h2>
        </div>

        <span
          className={`px-3 py-1 rounded-full text-xs font-bold border ${
            isFeastMode
              ? 'bg-gray-900 text-glovo-yellow border-gray-800'
              : 'bg-glovo-cream text-gray-800 border-amber-200'
          }`}
        >
          {meals.length} hidden {isFeastMode ? 'feasts' : 'meals'}
        </span>
      </div>

      {/* Interactive Tabletop Stage (Plate + Minimal Ceramic Bowl) */}
      <div
        onClick={handleCook}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleCook();
          }
        }}
        aria-label="Tap to lift and roll the mystery bowl to reveal tonight's meal"
        className={`relative w-full max-w-[420px] my-2 rounded-[22px] border overflow-hidden cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-glovo-teal ${
          isFeastMode
            ? 'bg-gradient-to-b from-[#FFFDF5] via-[#FFF6DE] to-[#FDE8B3] border-amber-300/80'
            : 'bg-gradient-to-b from-[#FFFDF7] via-[#FFF9EB] to-[#FEF1D0] border-amber-200/70'
        }`}
      >
        <svg
          viewBox="0 0 420 245"
          className="w-full h-auto block"
          role="img"
          aria-label="Covered dinner plate with rolling kitchen bowl"
        >
          <defs>
            <linearGradient id="ceramicBowlGrad" x1="0%" y1="0%" x2="100%" y2="90%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="52%" stopColor="#FAF6EC" />
              <stop offset="100%" stopColor="#E6DFCE" />
            </linearGradient>

            <radialGradient id="plateWellGrad" cx="46%" cy="42%" r="58%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="78%" stopColor="#F8F5EE" />
              <stop offset="100%" stopColor="#EAE3D2" />
            </radialGradient>

            <linearGradient id="tableSurfaceGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FCE9BE" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#F8D994" stopOpacity="0.65" />
            </linearGradient>
          </defs>

          <path
            d="M 0 162 Q 210 150 420 162 L 420 245 L 0 245 Z"
            fill="url(#tableSurfaceGrad)"
          />
          <line
            x1="0"
            y1="162"
            x2="420"
            y2="162"
            stroke="#F3D695"
            strokeWidth="1.2"
            opacity="0.7"
          />

          <g
            style={{
              transform: isUncovered ? 'translateX(-48px)' : 'translateX(0px)',
              transition: 'transform 620ms cubic-bezier(0.22, 0.82, 0.28, 1)',
            }}
          >
            <ellipse cx="205" cy="176" rx="108" ry="26" fill="#92400E" opacity="0.13" />

            <ellipse
              cx="205"
              cy="158"
              rx="106"
              ry="44"
              fill="#FFFFFF"
              stroke="#E5DFD0"
              strokeWidth="2.5"
            />
            <ellipse
              cx="205"
              cy="158"
              rx="95"
              ry="38"
              fill="none"
              stroke="#FFC244"
              strokeWidth={isFeastMode ? '3' : '2.2'}
              opacity={isFeastMode ? '0.95' : '0.75'}
            />
            <ellipse
              cx="205"
              cy="156"
              rx="81"
              ry="31"
              fill="url(#plateWellGrad)"
              stroke="#EDE7D8"
              strokeWidth="1.5"
            />

            {winner && (
              <g
                style={{
                  opacity: isUncovered ? 1 : 0,
                  transform: isUncovered ? 'scale(1)' : 'scale(0.92)',
                  transformBox: 'fill-box',
                  transformOrigin: 'center',
                  transition: 'opacity 360ms ease 180ms, transform 420ms ease 180ms',
                }}
              >
                <PlatedFoodSilhouette
                  category={winner.category}
                  accentColor={winner.wheelColor}
                />

                <g
                  stroke="#9CA3AF"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  fill="none"
                >
                  <path className="lmc-steam-1" d="M 180 116 Q 174 102 182 90" />
                  <path className="lmc-steam-2" d="M 205 112 Q 212 96 204 82" />
                  <path className="lmc-steam-3" d="M 230 118 Q 224 104 232 92" />
                </g>

                <g transform="translate(205, 118)">
                  <circle
                    cx="0"
                    cy="0"
                    r="21"
                    fill="#FFFFFF"
                    stroke={rimBandColor}
                    strokeWidth="2.5"
                  />
                  <text
                    x="0"
                    y="2"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="22"
                  >
                    {winner.emoji}
                  </text>
                </g>

                <g transform="translate(205, 214)">
                  <rect
                    x="-82"
                    y="-13"
                    width="164"
                    height="26"
                    rx="13"
                    fill={pillFillColor}
                  />
                  <text
                    x="0"
                    y="1"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill={pillTextColor}
                    fontSize="11"
                    fontWeight="800"
                  >
                    {winner.shortLabel}
                  </text>
                </g>
              </g>
            )}
          </g>

          <ellipse
            cx="205"
            cy="168"
            rx="80"
            ry="20"
            fill="#1F2937"
            opacity="0.22"
            className={`lmc-shadow ${shadowAnimClass}`}
          />

          <g className={`lmc-bowl ${bowlAnimClass}`}>
            <path
              d="M 176 74 C 176 66, 234 66, 234 74 L 238 80 C 238 86, 172 86, 172 80 Z"
              fill="#EFEAE0"
              stroke="#DDD6C5"
              strokeWidth="1.8"
            />
            <ellipse
              cx="205"
              cy="73"
              rx="28"
              ry="6"
              fill="#FAF7F0"
              stroke="#DDD6C5"
              strokeWidth="1.5"
            />

            <path
              d="M 122 152 C 122 96, 156 76, 205 76 C 254 76, 288 96, 288 152 C 288 164, 122 164, 122 152 Z"
              fill="url(#ceramicBowlGrad)"
              stroke="#DCD5C4"
              strokeWidth="2"
            />

            <path
              d="M 142 138 C 145 106, 162 91, 184 86"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="5.5"
              strokeLinecap="round"
              opacity="0.85"
            />
            <path
              d="M 152 142 C 154 122, 164 108, 178 100"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="2.5"
              strokeLinecap="round"
              opacity="0.6"
            />

            <path
              d="M 122 146 C 122 159, 288 159, 288 146 L 288 154 C 288 167, 122 167, 122 154 Z"
              fill={rimBandColor}
            />
            <path
              d="M 123 154 C 123 166, 287 166, 287 154"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="1.5"
              opacity="0.7"
            />
          </g>
        </svg>

        {phase === 'idle' && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-white/90 text-[11px] font-extrabold text-gray-700 shadow-xs border border-amber-200/80 whitespace-nowrap">
            Tap bowl or press below to uncover
          </div>
        )}
      </div>

      {/* Primary Thumb-Friendly CTA Button */}
      <button
        type="button"
        onClick={handleCook}
        disabled={isAnimating}
        className={`w-full mt-3 py-3.5 px-6 rounded-full active:scale-[0.98] font-extrabold text-base shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-wait ${
          isFeastMode
            ? 'bg-gray-900 hover:bg-black text-glovo-yellow'
            : 'bg-glovo-teal hover:bg-glovo-teal-dark text-white'
        }`}
      >
        <Sparkles className={`w-5 h-5 ${isAnimating ? 'animate-spin' : ''}`} />
        <span>
          {phase === 'shaking'
            ? isFeastMode
              ? 'Plating Payday Feast...'
              : 'Sizzling Under the Bowl...'
            : phase === 'rolling'
            ? 'Rolling Open...'
            : phase === 'returning'
            ? 'Covering Plate...'
            : 'Let Me Cook?'}
        </span>
      </button>

      {/* Celebratory Winner Result Banner */}
      {winner && phase === 'revealed' && (
        <div
          className={`w-full mt-4 p-4 rounded-[20px] border-2 ${
            isFeastMode
              ? 'bg-gradient-to-br from-[#FFFBEB] to-[#FEF3C7] border-amber-400'
              : 'bg-glovo-cream border-glovo-yellow'
          }`}
        >
          <div className="flex items-start gap-2.5">
            <span className="text-3xl leading-none">{winner.emoji}</span>
            <div>
              <div className="flex flex-wrap items-center gap-1.5">
                <p
                  className={`text-[11px] font-extrabold uppercase tracking-wider ${
                    isFeastMode ? 'text-amber-700' : 'text-glovo-teal'
                  }`}
                >
                  {isFeastMode ? "Tonight's Payday Winner!" : "Tonight's Winner!"}
                </p>
                {winner.servingTier && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-900 text-glovo-yellow text-[10px] font-extrabold">
                    <Users className="w-2.5 h-2.5" />
                    {winner.servingTier}
                  </span>
                )}
              </div>
              <h3 className="text-sm sm:text-base font-extrabold text-gray-900 leading-snug mt-0.5">
                {winner.name}
              </h3>
              <p className="text-xs text-gray-600 mt-1">{winner.localLore}</p>
              <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-gray-600 font-semibold">
                <span
                  className={`px-2 py-0.5 rounded-full font-extrabold ${
                    isFeastMode
                      ? 'bg-gray-900 text-glovo-yellow'
                      : 'bg-glovo-teal/15 text-glovo-teal'
                  }`}
                >
                  {winner.totalCostKes.toLocaleString()} bob
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {winner.prepMinutes} mins
                </span>
                <span className="text-emerald-700 font-bold">
                  • Saves{' '}
                  {Math.max(0, maxBudgetKes - winner.totalCostKes).toLocaleString()}{' '}
                  bob
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 mt-3.5">
            <button
              type="button"
              onClick={handleCook}
              className="py-2.5 px-3 rounded-full bg-white hover:bg-amber-50 text-gray-800 font-bold text-xs sm:text-sm border border-amber-200 transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RotateCw className="w-4 h-4" />
              Try Another
            </button>
            <button
              type="button"
              onClick={() => onSelectMeal(winner)}
              className={`py-2.5 px-3 rounded-full font-bold text-xs sm:text-sm shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer ${
                isFeastMode
                  ? 'bg-gray-900 hover:bg-black text-glovo-yellow'
                  : 'bg-glovo-teal hover:bg-glovo-teal-dark text-white'
              }`}
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