'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  MapPin,
  Wallet,
  Clock,
  History,
  RotateCcw,
  Receipt,
  Sparkles,
  CheckCircle2,
  Download,
  Smartphone,
  X,
} from 'lucide-react';
import {
  BUDGET_PRESETS,
  CATEGORY_BUBBLES,
  FilterCategoryId,
  MEALS,
  Meal,
  filterMeals,
} from '@/data/meals';
import SpinWheel from '@/components/SpinWheel';
import MealReceiptModal from '@/components/MealReceiptModal';

interface SupperHistoryEntry {
  mealId: string;
  mealName: string;
  emoji: string;
  costKes: number;
  eatenAt: number;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const STORAGE_KEY = 'whatfood_wangige_history_v1';
const FOUR_DAYS_MS = 4 * 24 * 60 * 60 * 1000;

function formatRelativeDay(timestamp: number): string {
  const diffHours = Math.floor((Date.now() - timestamp) / (1000 * 60 * 60));
  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return diffDays === 1 ? 'Yesterday' : `${diffDays}d ago`;
}

export default function HomePage() {
  const [maxBudgetKes, setMaxBudgetKes] = useState<number>(400);
  const [activeCategory, setActiveCategory] = useState<FilterCategoryId>('all');
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [history, setHistory] = useState<SupperHistoryEntry[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // PWA Install Prompt state
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [showInstallHelp, setShowInstallHelp] = useState<boolean>(false);

  // Hydrate 4-day supper history safely on the client
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed: SupperHistoryEntry[] = JSON.parse(raw);
      const cutoff = Date.now() - FOUR_DAYS_MS;
      const validRecent = parsed.filter((entry) => entry.eatenAt >= cutoff);
      setHistory(validRecent);
      if (validRecent.length !== parsed.length) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(validRecent));
      }
    } catch {
      // Ignore malformed storage
    }
  }, []);

  // Listen for Chrome's native PWA install prompt & standalone display mode
  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
      setShowInstallHelp(false);
      showToast('WhatFood installed to your home screen!');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const recentMealIds = useMemo(
    () => Array.from(new Set(history.map((item) => item.mealId))),
    [history]
  );

  const filteredMeals = useMemo(
    () => filterMeals(MEALS, maxBudgetKes, activeCategory),
    [maxBudgetKes, activeCategory]
  );

  const sortedMeals = useMemo(() => {
    return [...filteredMeals].sort((a, b) => {
      const aRecent = recentMealIds.includes(a.id) ? 1 : 0;
      const bRecent = recentMealIds.includes(b.id) ? 1 : 0;
      if (aRecent !== bRecent) return aRecent - bRecent;
      return a.totalCostKes - b.totalCostKes;
    });
  }, [filteredMeals, recentMealIds]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  const handleInstallClick = async () => {
    if (installPrompt) {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setInstallPrompt(null);
        setIsInstalled(true);
      }
      return;
    }
    setShowInstallHelp(true);
  };

  const handleLogSupper = (meal: Meal) => {
    const newEntry: SupperHistoryEntry = {
      mealId: meal.id,
      mealName: meal.shortLabel,
      emoji: meal.emoji,
      costKes: meal.totalCostKes,
      eatenAt: Date.now(),
    };
    const cutoff = Date.now() - FOUR_DAYS_MS;
    const updated = [
      newEntry,
      ...history.filter((entry) => entry.eatenAt >= cutoff),
    ].slice(0, 12);

    setHistory(updated);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Ignore storage quota errors
    }
    showToast(`Logged ${meal.shortLabel} (${meal.totalCostKes} KES) for tonight!`);
  };

  const handleClearHistory = () => {
    setHistory([]);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
    showToast('4-day supper cooldown cleared.');
  };

  return (
    <div className="min-h-screen pb-16">
      {/* Floating Feedback Toast */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-glovo-yellow shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Curved Glovo Yellow Hero Header */}
      <header className="bg-glovo-yellow pt-5 pb-12 px-4 rounded-b-[38px] shadow-xs">
        <div className="max-w-4xl mx-auto">
          {/* Top Location & Install App Action Bar */}
          <div className="flex items-center justify-between gap-2">
            <div className="inline-flex items-center gap-1.5 bg-white/95 px-3.5 py-1.5 rounded-full shadow-2xs text-xs font-extrabold text-gray-900">
              <MapPin className="w-3.5 h-3.5 text-glovo-teal shrink-0" />
              <span>Wangige Market • Supper Planner</span>
            </div>

            {!isInstalled && (
              <button
                type="button"
                onClick={handleInstallClick}
                className="inline-flex items-center gap-1.5 bg-glovo-teal hover:bg-glovo-teal-dark active:scale-95 text-white px-3.5 py-1.5 rounded-full shadow-sm text-xs font-extrabold transition cursor-pointer shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Install App</span>
              </button>
            )}
          </div>

          {/* Hero Headline */}
          <div className="mt-4">
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              What&apos;s cooking tonight, Maurice?
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-gray-900/80 mt-1">
              Balanced solo suppers priced for Wangige butcheries &amp; mama
              mboga stalls.
            </p>
          </div>

          {/* Interactive Budget Controller Card */}
          <div className="mt-5 bg-white rounded-[24px] p-4 sm:p-5 shadow-md">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-glovo-teal/15 text-glovo-teal flex items-center justify-center">
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400 block">
                    Tonight&apos;s Supper Ceiling
                  </span>
                  <span className="text-lg sm:text-xl font-black text-gray-900">
                    Up to {maxBudgetKes} KES
                  </span>
                </div>
              </div>

              <span className="px-3 py-1 rounded-full bg-glovo-teal text-white text-xs font-extrabold">
                {filteredMeals.length} of {MEALS.length} meals
              </span>
            </div>

            {/* Range Slider */}
            <input
              type="range"
              min={300}
              max={500}
              step={10}
              value={maxBudgetKes}
              onChange={(e) => setMaxBudgetKes(Number(e.target.value))}
              aria-label="Maximum supper budget in Kenyan Shillings"
              className="w-full accent-[#00A082] h-2 bg-amber-100 rounded-lg cursor-pointer"
            />

            {/* Quick Budget Pills */}
            <div className="grid grid-cols-5 gap-1.5 sm:gap-2 mt-3">
              {BUDGET_PRESETS.map((preset) => {
                const isActive = maxBudgetKes === preset;
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setMaxBudgetKes(preset)}
                    className={`py-2 px-1 rounded-full text-xs font-extrabold transition cursor-pointer ${
                      isActive
                        ? 'bg-glovo-teal text-white shadow-xs scale-[1.03]'
                        : 'bg-glovo-cream hover:bg-amber-100 text-gray-800 border border-amber-200/70'
                    }`}
                  >
                    {preset} KES
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-4xl mx-auto px-4 -mt-6 space-y-6">
        {/* Glovo Floating Category Bubbles */}
        <section aria-label="Meal categories">
          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-2 px-1">
            {CATEGORY_BUBBLES.map((bubble) => {
              const isSelected = activeCategory === bubble.id;
              return (
                <button
                  key={bubble.id}
                  type="button"
                  onClick={() => setActiveCategory(bubble.id)}
                  className="group flex flex-col items-center shrink-0 cursor-pointer focus:outline-none"
                >
                  <div
                    className={`w-16 h-16 sm:w-18 sm:h-18 rounded-full flex items-center justify-center text-2xl sm:text-3xl shadow-md transition-all duration-200 ${
                      isSelected
                        ? 'bg-glovo-teal text-white scale-110 ring-4 ring-white'
                        : 'bg-white text-gray-900 group-hover:scale-105 group-active:scale-95 border border-amber-100'
                    }`}
                  >
                    {bubble.emoji}
                  </div>
                  <span
                    className={`mt-2 text-[11px] sm:text-xs font-extrabold whitespace-nowrap px-2.5 py-0.5 rounded-full transition ${
                      isSelected
                        ? 'bg-glovo-teal text-white'
                        : 'text-gray-800 bg-white/80'
                    }`}
                  >
                    {bubble.label}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Interactive Spin-to-Eat Wheel + 4-Day Anti-Repeat Log */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7">
            <SpinWheel
              meals={filteredMeals}
              recentMealIds={recentMealIds}
              maxBudgetKes={maxBudgetKes}
              onSelectMeal={(meal) => setSelectedMeal(meal)}
            />
          </div>

          {/* Right Column on Desktop / Stacked Card on Mobile */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-[24px] p-5 shadow-sm border border-amber-100">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-glovo-teal" />
                  <h2 className="text-sm font-extrabold text-gray-900">
                    4-Day Anti-Repeat Log
                  </h2>
                </div>
                {history.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearHistory}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-400 hover:text-rose-600 transition cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset
                  </button>
                )}
              </div>

              {history.length === 0 ? (
                <p className="text-xs text-gray-500 leading-relaxed">
                  No suppers logged in the last 4 days. Tap{' '}
                  <strong className="text-gray-800">
                    &ldquo;Log Tonight&apos;s Supper&rdquo;
                  </strong>{' '}
                  inside any meal receipt to dim it on the wheel so you keep
                  variety all week.
                </p>
              ) : (
                <ul className="space-y-2">
                  {history.slice(0, 5).map((entry, idx) => (
                    <li
                      key={`${entry.mealId}-${entry.eatenAt}-${idx}`}
                      className="flex items-center justify-between text-xs bg-glovo-cream px-3 py-2 rounded-xl border border-amber-100"
                    >
                      <span className="font-bold text-gray-800 truncate pr-2">
                        {entry.emoji} {entry.mealName}
                      </span>
                      <span className="text-[11px] font-semibold text-gray-500 shrink-0">
                        {formatRelativeDay(entry.eatenAt)} • {entry.costKes} KES
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Wangige Shopping Strategy Card */}
            <div className="bg-glovo-yellow/35 rounded-[24px] p-5 border border-glovo-yellow">
              <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-gray-900 mb-1.5">
                <Sparkles className="w-4 h-4 text-glovo-teal" />
                <span>Balanced Plate Formula</span>
              </div>
              <p className="text-xs text-gray-800 leading-relaxed">
                Every combo pairs an <strong>Energy Carb</strong> (Ugali,
                Pishori, Shangi Mash, or Vibanda Chapati) with a{' '}
                <strong>Protein</strong> and{' '}
                <strong>Kienyeji / Fresh Greens</strong> + mama mboga
                aromatics (nyanya, hoho, saumu &amp; dania).
              </p>
            </div>
          </div>
        </section>

        {/* Filtered Meal Cards Grid */}
        <section aria-label="Eligible Wangige meals" className="pt-2">
          <div className="flex items-center justify-between mb-3.5">
            <h2 className="text-lg font-black text-gray-900">
              Eligible Wangige Combos ({sortedMeals.length})
            </h2>
            <span className="text-xs font-bold text-gray-500">
              Tap any card for receipt
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {sortedMeals.map((meal) => {
              const isRecent = recentMealIds.includes(meal.id);
              const balance = maxBudgetKes - meal.totalCostKes;

              return (
                <article
                  key={meal.id}
                  onClick={() => setSelectedMeal(meal)}
                  className={`bg-white rounded-[24px] p-4 sm:p-5 shadow-sm hover:shadow-md border transition-all cursor-pointer flex flex-col justify-between ${
                    isRecent
                      ? 'border-gray-200 opacity-65 hover:opacity-95'
                      : 'border-amber-100 hover:-translate-y-0.5'
                  }`}
                >
                  <div>
                    {/* Top Price & Cooldown Badges */}
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-3 py-1 rounded-full bg-glovo-teal text-white text-xs font-extrabold">
                          {meal.totalCostKes} KES
                        </span>
                        {balance > 0 && (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold">
                            +{balance} KES left
                          </span>
                        )}
                        {meal.isKienyeji && (
                          <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-[11px] font-extrabold">
                            🥬 Kienyeji
                          </span>
                        )}
                      </div>

                      {isRecent && (
                        <span className="px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[10px] font-extrabold uppercase tracking-wide shrink-0">
                          Eaten Recently
                        </span>
                      )}
                    </div>

                    {/* Title & Emoji */}
                    <div className="flex items-start gap-3">
                      <span className="text-3xl leading-none mt-0.5">
                        {meal.emoji}
                      </span>
                      <div>
                        <h3 className="text-sm sm:text-base font-extrabold text-gray-900 leading-snug">
                          {meal.name}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {meal.tagline}
                        </p>
                      </div>
                    </div>

                    {/* Macro Summary Pills */}
                    <div className="flex flex-wrap gap-1.5 mt-3.5">
                      <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-glovo-cream text-gray-700 border border-amber-200/60">
                        ⚡ {meal.nutrition.carb}
                      </span>
                      <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-glovo-cream text-gray-700 border border-amber-200/60">
                        💪 {meal.nutrition.protein}
                      </span>
                      <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-glovo-cream text-gray-700 border border-amber-200/60">
                        🥗 {meal.nutrition.greens}
                      </span>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-bold">
                    <span className="text-gray-500 inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-glovo-teal" />
                      {meal.prepMinutes} mins prep
                    </span>

                    <span className="text-glovo-teal inline-flex items-center gap-1 font-extrabold">
                      <Receipt className="w-3.5 h-3.5" />
                      View Receipt →
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </main>

      {/* Install Helper Modal (Fallback when browser suppresses native prompt) */}
      {showInstallHelp && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/55 backdrop-blur-xs p-0 sm:p-4"
          onClick={() => setShowInstallHelp(false)}
        >
          <div
            className="w-full sm:max-w-md bg-white rounded-t-[28px] sm:rounded-[28px] p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-glovo-teal font-extrabold text-sm">
                <Smartphone className="w-5 h-5" />
                <span>Add WhatFood to Home Screen</span>
              </div>
              <button
                type="button"
                onClick={() => setShowInstallHelp(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs sm:text-sm text-gray-700 bg-glovo-cream p-4 rounded-2xl border border-amber-200">
              <p>
                <strong>Android Chrome:</strong> Tap the{' '}
                <strong>⋮ (3 dots)</strong> at the top-right of Chrome → tap{' '}
                <strong>Add to home screen</strong> → <strong>Install</strong>.
              </p>
              <p>
                <strong>Desktop Chrome / Edge:</strong> Click the{' '}
                <strong>Install icon</strong> in the right side of the address
                bar (or <strong>⋮ → Cast, save, and share → Install</strong>).
              </p>
              <p>
                <strong>iPhone Safari:</strong> Tap the{' '}
                <strong>Share</strong> button at the bottom →{' '}
                <strong>Add to Home Screen</strong>.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowInstallHelp(false)}
              className="w-full py-3 rounded-full bg-glovo-teal text-white font-extrabold text-sm cursor-pointer"
            >
              Got It
            </button>
          </div>
        </div>
      )}

      {/* Mama Mboga Receipt & Cooking Modal */}
      <MealReceiptModal
        meal={selectedMeal}
        maxBudgetKes={maxBudgetKes}
        isRecentlyEaten={
          selectedMeal ? recentMealIds.includes(selectedMeal.id) : false
        }
        onClose={() => setSelectedMeal(null)}
        onLogSupper={handleLogSupper}
      />
    </div>
  );
}