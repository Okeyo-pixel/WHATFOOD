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
  Search,
  Globe2,
  Crown,
  Users,
  Heart,
} from 'lucide-react';
import {
  BUDGET_PRESETS,
  CATEGORY_BUBBLES,
  FEAST_BUDGET_PRESETS,
  FEAST_MAX_BUDGET_KES,
  FEAST_MEALS,
  FEAST_MIN_BUDGET_KES,
  FEAST_VIBE_PILLS,
  FeastVibeFilterId,
  FilterCategoryId,
  MAX_BUDGET_KES,
  MEALS,
  MIN_BUDGET_KES,
  Meal,
  REGION_LABELS,
  REGION_PILLS,
  RegionFilterId,
  filterFeastMeals,
  filterMeals,
} from '@/data/meals';
import SpinWheel from '@/components/SpinWheel';
import MealReceiptModal from '@/components/MealReceiptModal';
import DonateModal from '@/components/DonateModal';

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

const STORAGE_KEY = 'whatfood_kenya_history_v2';
const FOUR_DAYS_MS = 4 * 24 * 60 * 60 * 1000;
const INITIAL_VISIBLE_CARDS = 24;

function formatRelativeDay(timestamp: number): string {
  const diffHours = Math.floor((Date.now() - timestamp) / (1000 * 60 * 60));
  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return diffDays === 1 ? 'Yesterday' : `${diffDays}d ago`;
}

export default function HomePage() {
  const [everydayBudgetKes, setEverydayBudgetKes] =
    useState<number>(MAX_BUDGET_KES);
  const [feastBudgetKes, setFeastBudgetKes] =
    useState<number>(FEAST_MAX_BUDGET_KES);

  const [activeCategory, setActiveCategory] = useState<FilterCategoryId>('all');
  const [activeFeastVibe, setActiveFeastVibe] =
    useState<FeastVibeFilterId>('all');
  const [activeRegion, setActiveRegion] = useState<RegionFilterId>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [visibleCount, setVisibleCount] = useState<number>(
    INITIAL_VISIBLE_CARDS
  );

  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [history, setHistory] = useState<SupperHistoryEntry[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [showInstallHelp, setShowInstallHelp] = useState<boolean>(false);
  const [showDonateModal, setShowDonateModal] = useState<boolean>(false);

  const isFeastMode = activeCategory === 'feast';
  const activeMaxBudget = isFeastMode ? feastBudgetKes : everydayBudgetKes;
  const activeCatalogTotal = isFeastMode ? FEAST_MEALS.length : MEALS.length;

  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE_CARDS);
  }, [
    everydayBudgetKes,
    feastBudgetKes,
    activeCategory,
    activeFeastVibe,
    activeRegion,
    searchQuery,
  ]);

  useEffect(() => {
    try {
      const raw =
        window.localStorage.getItem(STORAGE_KEY) ||
        window.localStorage.getItem('whatfood_wangige_history_v1');
      if (!raw) return;
      const parsed: SupperHistoryEntry[] = JSON.parse(raw);
      const cutoff = Date.now() - FOUR_DAYS_MS;
      const validRecent = parsed.filter((entry) => entry.eatenAt >= cutoff);
      setHistory(validRecent);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(validRecent));
    } catch {
      // Ignore malformed storage
    }
  }, []);

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone ===
        true;

    if (standalone) {
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
      showToast('Let Me Cook? saved to your home screen!');
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

  const filteredMeals = useMemo(() => {
    if (isFeastMode) {
      return filterFeastMeals(
        FEAST_MEALS,
        feastBudgetKes,
        activeFeastVibe,
        activeRegion,
        searchQuery
      );
    }
    return filterMeals(
      MEALS,
      everydayBudgetKes,
      activeCategory,
      activeRegion,
      searchQuery
    );
  }, [
    isFeastMode,
    feastBudgetKes,
    activeFeastVibe,
    everydayBudgetKes,
    activeCategory,
    activeRegion,
    searchQuery,
  ]);

  const sortedMeals = useMemo(() => {
    return [...filteredMeals].sort((a, b) => {
      const aRecent = recentMealIds.includes(a.id) ? 1 : 0;
      const bRecent = recentMealIds.includes(b.id) ? 1 : 0;
      if (aRecent !== bRecent) return aRecent - bRecent;
      return a.totalCostKes - b.totalCostKes;
    });
  }, [filteredMeals, recentMealIds]);

  const visibleMeals = sortedMeals.slice(0, visibleCount);

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

  const handleBudgetChange = (value: number) => {
    if (isFeastMode) {
      setFeastBudgetKes(value);
    } else {
      setEverydayBudgetKes(value);
    }
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
    ].slice(0, 15);

    setHistory(updated);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Ignore storage quota errors
    }
    showToast(
      `Logged ${meal.shortLabel} (${meal.totalCostKes.toLocaleString()} bob) for tonight!`
    );
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

  const handleResetFilters = () => {
    if (isFeastMode) {
      setFeastBudgetKes(FEAST_MAX_BUDGET_KES);
      setActiveFeastVibe('all');
    } else {
      setEverydayBudgetKes(MAX_BUDGET_KES);
      setActiveCategory('all');
    }
    setActiveRegion('all');
    setSearchQuery('');
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

      {/* Curved Hero Header: Sleek Charcoal & Gold in "Feeling Rich?" Mode, Signature Glovo Yellow Otherwise */}
      <header
        className={`pt-5 pb-12 px-4 rounded-b-[38px] shadow-xs transition-colors duration-300 ${
          isFeastMode
            ? 'bg-gradient-to-br from-[#181B22] via-[#232730] to-[#12151B] text-white'
            : 'bg-glovo-yellow text-gray-900'
        }`}
      >
        <div className="max-w-4xl mx-auto">
          {/* Top Location, Donate & Install App Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full shadow-2xs text-xs font-extrabold ${
                isFeastMode
                  ? 'bg-white/10 text-glovo-yellow border border-amber-400/30'
                  : 'bg-white/95 text-gray-900'
              }`}
            >
              {isFeastMode ? (
                <Crown className="w-3.5 h-3.5 text-glovo-yellow shrink-0" />
              ) : (
                <MapPin className="w-3.5 h-3.5 text-glovo-teal shrink-0" />
              )}
              <span>
                {isFeastMode
                  ? '👑 Payday Edition • 500/- to 5,000/- Feasts'
                  : '🇰🇪 Kenya • Supper & Craving Planner'}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowDonateModal(true)}
                className={`inline-flex items-center gap-1.5 active:scale-95 px-3.5 py-2 rounded-full shadow-sm text-xs font-extrabold transition cursor-pointer touch-manipulation ${
                  isFeastMode
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                    : 'bg-white/95 hover:bg-white text-glovo-teal'
                }`}
              >
                <Heart className="w-3.5 h-3.5 fill-current" />
                <span>Donate</span>
              </button>

              {!isInstalled && (
                <button
                  type="button"
                  onClick={handleInstallClick}
                  className={`inline-flex items-center gap-1.5 active:scale-95 px-3.5 py-2 rounded-full shadow-sm text-xs font-extrabold transition cursor-pointer touch-manipulation ${
                    isFeastMode
                      ? 'bg-glovo-yellow hover:bg-glovo-yellow-dark text-gray-900'
                      : 'bg-glovo-teal hover:bg-glovo-teal-dark text-white'
                  }`}
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Save to Home Screen</span>
                </button>
              )}
            </div>
          </div>

          {/* Hero Headline */}
          <div className="mt-4">
            <h1
              className={`text-2xl sm:text-3xl font-black tracking-tight ${
                isFeastMode ? 'text-white' : 'text-gray-900'
              }`}
            >
              {isFeastMode
                ? 'Salary just hit? Treat yourself tonight.'
                : "What's on the menu tonight?"}
            </h1>
            <p
              className={`text-xs sm:text-sm font-semibold mt-1 ${
                isFeastMode ? 'text-amber-100/85' : 'text-gray-900/80'
              }`}
            >
              {isFeastMode
                ? `${FEAST_MEALS.length} middle-class payday feasts, steakhouse cuts, coastal seafood & hosting platters — from 500 to 5,000 bob.`
                : `${MEALS.length} Kenyan bachelor & middle-class suppers, hotel hits, and street bites — from ${MIN_BUDGET_KES} to ${MAX_BUDGET_KES} bob.`}
            </p>
          </div>

          {/* Interactive Budget Controller Card */}
          <div className="mt-5 bg-white rounded-[24px] p-4 sm:p-5 shadow-md text-gray-900">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    isFeastMode
                      ? 'bg-gray-900 text-glovo-yellow'
                      : 'bg-glovo-teal/15 text-glovo-teal'
                  }`}
                >
                  {isFeastMode ? (
                    <Crown className="w-4 h-4" />
                  ) : (
                    <Wallet className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400 block">
                    {isFeastMode
                      ? 'Payday Feast Ceiling (500/+)'
                      : "Tonight's Pocket Ceiling"}
                  </span>
                  <span className="text-lg sm:text-xl font-black text-gray-900">
                    Up to {activeMaxBudget.toLocaleString()} bob
                  </span>
                </div>
              </div>

              <span
                className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                  isFeastMode
                    ? 'bg-gray-900 text-glovo-yellow'
                    : 'bg-glovo-teal text-white'
                }`}
              >
                {filteredMeals.length} of {activeCatalogTotal}{' '}
                {isFeastMode ? 'feasts' : 'meals'}
              </span>
            </div>

            {/* Dynamic Range Slider (80–500 bob OR 500–5,000 bob) */}
            <input
              type="range"
              min={isFeastMode ? FEAST_MIN_BUDGET_KES : MIN_BUDGET_KES}
              max={isFeastMode ? FEAST_MAX_BUDGET_KES : MAX_BUDGET_KES}
              step={isFeastMode ? 100 : 10}
              value={activeMaxBudget}
              onChange={(e) => handleBudgetChange(Number(e.target.value))}
              aria-label="Maximum supper budget in Kenyan Shillings"
              className={`w-full h-2 bg-amber-100 rounded-lg cursor-pointer ${
                isFeastMode ? 'accent-[#1A1D24]' : 'accent-[#00A082]'
              }`}
            />

            {/* Quick Budget Pills */}
            <div className="grid grid-cols-5 gap-1.5 sm:gap-2 mt-3">
              {(isFeastMode ? FEAST_BUDGET_PRESETS : BUDGET_PRESETS).map(
                (preset) => {
                  const isActive = activeMaxBudget === preset;
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleBudgetChange(preset)}
                      className={`py-2 px-1 rounded-full text-xs font-extrabold transition cursor-pointer ${
                        isActive
                          ? isFeastMode
                            ? 'bg-gray-900 text-glovo-yellow shadow-xs scale-[1.03]'
                            : 'bg-glovo-teal text-white shadow-xs scale-[1.03]'
                          : 'bg-glovo-cream hover:bg-amber-100 text-gray-800 border border-amber-200/70'
                      }`}
                    >
                      {preset.toLocaleString()}/-
                    </button>
                  );
                }
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-4xl mx-auto px-4 -mt-6 space-y-5">
        {/* Glovo Floating Category Bubbles (10 Everyday + "Feeling Rich?" 👑) */}
        <section aria-label="Meal categories">
          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-2 px-1">
            {CATEGORY_BUBBLES.map((bubble) => {
              const isSelected = activeCategory === bubble.id;
              const isRichBubble = bubble.id === 'feast';

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
                        ? isRichBubble
                          ? 'bg-gray-900 text-glovo-yellow scale-110 ring-4 ring-glovo-yellow'
                          : 'bg-glovo-teal text-white scale-110 ring-4 ring-white'
                        : isRichBubble
                        ? 'bg-gradient-to-br from-[#232730] to-[#111318] text-glovo-yellow group-hover:scale-105 border-2 border-glovo-yellow'
                        : 'bg-white text-gray-900 group-hover:scale-105 group-active:scale-95 border border-amber-100'
                    }`}
                  >
                    {bubble.emoji}
                  </div>
                  <span
                    className={`mt-2 text-[11px] sm:text-xs font-extrabold whitespace-nowrap px-2.5 py-0.5 rounded-full transition ${
                      isSelected
                        ? isRichBubble
                          ? 'bg-gray-900 text-glovo-yellow'
                          : 'bg-glovo-teal text-white'
                        : isRichBubble
                        ? 'bg-gray-900/90 text-glovo-yellow'
                        : 'text-gray-800 bg-white/85'
                    }`}
                  >
                    {bubble.label}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Dedicated Payday Vibe Sub-Filter Pills (Only shown in "Feeling Rich?" Mode) */}
        {isFeastMode && (
          <section aria-label="Payday feast vibes">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              <span className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider text-amber-700 shrink-0 pr-1">
                <Crown className="w-3.5 h-3.5" />
                Vibe:
              </span>
              {FEAST_VIBE_PILLS.map((vibe) => {
                const isSelected = activeFeastVibe === vibe.id;
                return (
                  <button
                    key={vibe.id}
                    type="button"
                    onClick={() => setActiveFeastVibe(vibe.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold whitespace-nowrap transition cursor-pointer shrink-0 ${
                      isSelected
                        ? 'bg-glovo-yellow text-gray-900 shadow-xs ring-2 ring-gray-900/15'
                        : 'bg-white hover:bg-amber-50 text-gray-800 border border-amber-300/80'
                    }`}
                  >
                    <span>{vibe.emoji}</span>
                    <span>{vibe.label}</span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* Kenyan Regional Cuisine Filter Strip */}
        <section aria-label="Kenyan regional cuisines">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            <span className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider text-gray-500 shrink-0 pr-1">
              <Globe2 className="w-3.5 h-3.5 text-glovo-teal" />
              Region:
            </span>
            {REGION_PILLS.map((region) => {
              const isSelected = activeRegion === region.id;
              return (
                <button
                  key={region.id}
                  type="button"
                  onClick={() => setActiveRegion(region.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold whitespace-nowrap transition cursor-pointer shrink-0 ${
                    isSelected
                      ? 'bg-gray-900 text-glovo-yellow shadow-xs'
                      : 'bg-white hover:bg-amber-50 text-gray-700 border border-amber-200/80'
                  }`}
                >
                  <span>{region.emoji}</span>
                  <span>{region.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Interactive Mystery Plate & Rolling Bowl + 4-Day Anti-Repeat Log */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7">
            <SpinWheel
              meals={filteredMeals}
              recentMealIds={recentMealIds}
              maxBudgetKes={activeMaxBudget}
              isFeastMode={isFeastMode}
              onSelectMeal={(meal) => setSelectedMeal(meal)}
            />
          </div>

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
                  No meals logged in the last 4 days. Tap{' '}
                  <strong className="text-gray-800">
                    &ldquo;Log Tonight&apos;s Supper&rdquo;
                  </strong>{' '}
                  inside any meal receipt so the mystery bowl skips repeats all
                  week.
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
                        {formatRelativeDay(entry.eatenAt)} •{' '}
                        {entry.costKes.toLocaleString()}/-
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div
              className={`rounded-[24px] p-5 border ${
                isFeastMode
                  ? 'bg-gray-900 text-white border-amber-400/50'
                  : 'bg-glovo-yellow/35 text-gray-900 border-glovo-yellow'
              }`}
            >
              <div
                className={`flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider mb-1.5 ${
                  isFeastMode ? 'text-glovo-yellow' : 'text-gray-900'
                }`}
              >
                {isFeastMode ? (
                  <Crown className="w-4 h-4 text-glovo-yellow" />
                ) : (
                  <Sparkles className="w-4 h-4 text-glovo-teal" />
                )}
                <span>
                  {isFeastMode
                    ? 'Supermarket, Prime Butcher & Deli Mode'
                    : 'From 80/- Survival to 500/- Treat'}
                </span>
              </div>
              <p
                className={`text-xs leading-relaxed ${
                  isFeastMode ? 'text-gray-300' : 'text-gray-800'
                }`}
              >
                {isFeastMode
                  ? 'Independent from the 112 everyday meals. Features solo payday treats, Date Night (2) mains, and Hosting (3–4) platters sourced across Naivas, Carrefour, Prime Butcheries, Fishmongers, and Artisan Delis.'
                  : 'Explore Swahili coastal curries, Western omena & ingokho, Central mukimo & njahi, Kisii obokima & ebitoke—or tap Feeling Rich? 👑 when salary hits!'}
              </p>
            </div>
          </div>
        </section>

        {/* Search & Filtered Meal Cards Grid */}
        <section aria-label="Eligible Kenyan meals" className="pt-2 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-gray-900">
                {isFeastMode
                  ? `Payday Feasts (${sortedMeals.length})`
                  : `Eligible Combos (${sortedMeals.length})`}
              </h2>
              <span className="text-xs font-bold text-gray-500">
                Tap any card for local lore, shopping receipt &amp; prep steps
              </span>
            </div>

            {/* Instant Search Bar */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  isFeastMode
                    ? 'Search ribeye, prawns, biryani, lasagna...'
                    : 'Search pilau, mutura, rolex, uji...'
                }
                className="w-full pl-9 pr-8 py-2 rounded-full bg-white border border-amber-200 text-xs sm:text-sm font-semibold text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-glovo-teal"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {sortedMeals.length === 0 ? (
            <div className="bg-white rounded-[24px] p-8 text-center border border-amber-100">
              <p className="text-sm font-bold text-gray-800">
                No {isFeastMode ? 'feasts' : 'combos'} match your current
                budget, region, or search.
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className={`mt-3 px-4 py-2 rounded-full text-xs font-extrabold cursor-pointer ${
                  isFeastMode
                    ? 'bg-gray-900 text-glovo-yellow'
                    : 'bg-glovo-teal text-white'
                }`}
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {visibleMeals.map((meal) => {
                  const isRecent = recentMealIds.includes(meal.id);
                  const balance = activeMaxBudget - meal.totalCostKes;

                  return (
                    <article
                      key={meal.id}
                      onClick={() => setSelectedMeal(meal)}
                      className={`bg-white rounded-[24px] p-4 sm:p-5 shadow-sm hover:shadow-md border transition-all cursor-pointer flex flex-col justify-between ${
                        isRecent
                          ? 'border-gray-200 opacity-65 hover:opacity-95'
                          : isFeastMode
                          ? 'border-amber-200/90 hover:-translate-y-0.5'
                          : 'border-amber-100 hover:-translate-y-0.5'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                                isFeastMode
                                  ? 'bg-gray-900 text-glovo-yellow'
                                  : 'bg-glovo-teal text-white'
                              }`}
                            >
                              {meal.totalCostKes.toLocaleString()} bob
                            </span>
                            {meal.servingTier && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-950 text-[11px] font-extrabold">
                                <Users className="w-3 h-3" />
                                {meal.servingTier}
                              </span>
                            )}
                            <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 text-[11px] font-bold">
                              {REGION_LABELS[meal.region]}
                            </span>
                            {meal.isKienyeji && (
                              <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-[11px] font-extrabold">
                                🥬 Kienyeji
                              </span>
                            )}
                          </div>

                          {isRecent ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[10px] font-extrabold uppercase tracking-wide shrink-0">
                              Recent
                            </span>
                          ) : (
                            balance > 0 && (
                              <span className="text-[11px] font-extrabold text-emerald-700 shrink-0">
                                +{balance.toLocaleString()}/- left
                              </span>
                            )
                          )}
                        </div>

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

                      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-bold">
                        <span className="text-gray-500 inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-glovo-teal" />
                          {meal.prepMinutes} mins prep
                        </span>

                        <span
                          className={`inline-flex items-center gap-1 font-extrabold ${
                            isFeastMode ? 'text-gray-900' : 'text-glovo-teal'
                          }`}
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          View Receipt →
                        </span>
                      </div>
                    </article>
                  );
                })}
              </div>

              {visibleCount < sortedMeals.length && (
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setVisibleCount((prev) => prev + 24)}
                    className="px-6 py-3 rounded-full bg-white hover:bg-amber-50 text-gray-900 font-extrabold text-xs sm:text-sm border-2 border-glovo-yellow shadow-xs transition cursor-pointer"
                  >
                    Load More {isFeastMode ? 'Feasts' : 'Meals'} (
                    {sortedMeals.length - visibleCount} more)
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </main>

      {/* Install Helper Modal */}
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
                <span>Save Let Me Cook? to Home Screen</span>
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
                <strong>Add to home screen</strong> →{' '}
                <strong>Install</strong> (or <strong>Create shortcut</strong>).
              </p>
              <p>
                <strong>Desktop Chrome / Edge:</strong> Click the{' '}
                <strong>Install icon</strong> in the right side of the address
                bar (or <strong>⋮ → Cast, save, and share → Install</strong>).
              </p>
              <p>
                <strong>iPhone Safari:</strong> Tap <strong>Share</strong> at
                the bottom → <strong>Add to Home Screen</strong>.
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

      {/* Market & Payday Feast Receipt Modal */}
      <MealReceiptModal
        meal={selectedMeal}
        maxBudgetKes={activeMaxBudget}
        isRecentlyEaten={
          selectedMeal ? recentMealIds.includes(selectedMeal.id) : false
        }
        onClose={() => setSelectedMeal(null)}
        onLogSupper={handleLogSupper}
      />

      {/* M-Pesa STK Push Donate Modal */}
      <DonateModal
        isOpen={showDonateModal}
        isFeastMode={isFeastMode}
        onClose={() => setShowDonateModal(false)}
      />
    </div>
  );
}