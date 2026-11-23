'use client';

import React, { useEffect, useState } from 'react';
import {
  X,
  Clock,
  CheckCircle2,
  Circle,
  Copy,
  Check,
  Utensils,
  Sparkles,
  ShoppingBag,
  Flame,
  Leaf,
  Beef,
  Wheat,
} from 'lucide-react';
import { Meal, VendorType } from '@/data/meals';

interface MealReceiptModalProps {
  meal: Meal | null;
  maxBudgetKes: number;
  isRecentlyEaten: boolean;
  onClose: () => void;
  onLogSupper: (meal: Meal) => void;
}

const VENDOR_BADGE_STYLES: Record<VendorType, string> = {
  Butchery: 'bg-rose-100 text-rose-800 border-rose-200',
  'Mama Mboga': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'Kiosk / Duka': 'bg-amber-100 text-amber-800 border-amber-200',
  'Pantry Buffer': 'bg-slate-100 text-slate-700 border-slate-200',
};

export default function MealReceiptModal({
  meal,
  maxBudgetKes,
  isRecentlyEaten,
  onClose,
  onLogSupper,
}: MealReceiptModalProps) {
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});
  const [copied, setCopied] = useState(false);
  const [justLogged, setJustLogged] = useState(false);

  // Reset checklist and confirmation state whenever a different meal opens
  useEffect(() => {
    setCheckedItems({});
    setCopied(false);
    setJustLogged(false);
  }, [meal?.id]);

  // Close modal on Escape key
  useEffect(() => {
    if (!meal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [meal, onClose]);

  if (!meal) return null;

  const balanceKes = maxBudgetKes - meal.totalCostKes;
  const isWithinBudget = balanceKes >= 0;

  const toggleItem = (idx: number) => {
    setCheckedItems((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleCopyList = async () => {
    const lines = [
      `🛒 Wangige Supper List: ${meal.name} (${meal.totalCostKes} KES)`,
      ...meal.shoppingList.map(
        (item) => `• [${item.vendor}] ${item.name} (${item.quantity}) — ${item.costKes} KES`
      ),
    ];
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback ignored if clipboard permissions are blocked
    }
  };

  const handleLogClick = () => {
    onLogSupper(meal);
    setJustLogged(true);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/55 backdrop-blur-xs p-0 sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="receipt-modal-title"
    >
      <div
        className="w-full sm:max-w-lg max-h-[92vh] bg-white rounded-t-[28px] sm:rounded-[28px] shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glovo Yellow Top Header */}
        <div className="bg-glovo-yellow px-5 pt-5 pb-6 relative shrink-0">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close meal receipt"
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-gray-900 flex items-center justify-center shadow-sm transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-gray-900/80 mb-1.5">
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Wangige Market Receipt</span>
          </div>

          <div className="flex items-start gap-3 pr-8">
            <span className="text-4xl leading-none">{meal.emoji}</span>
            <div>
              <h2
                id="receipt-modal-title"
                className="text-lg sm:text-xl font-extrabold text-gray-900 leading-snug"
              >
                {meal.name}
              </h2>
              <p className="text-xs sm:text-sm text-gray-800/85 mt-1">
                {meal.tagline}
              </p>
            </div>
          </div>

          {/* Cost vs Budget Summary Bar */}
          <div className="mt-4 bg-white rounded-2xl p-3 shadow-xs flex items-center justify-between gap-2">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wide text-gray-400 block">
                Estimated Total
              </span>
              <span className="text-xl font-black text-gray-900">
                {meal.totalCostKes} KES
              </span>
            </div>

            <div className="h-8 w-px bg-gray-100" />

            <div>
              <span className="text-[11px] font-bold uppercase tracking-wide text-gray-400 block">
                Budget ({maxBudgetKes} KES)
              </span>
              <span
                className={`text-sm font-extrabold ${
                  isWithinBudget ? 'text-glovo-teal' : 'text-rose-600'
                }`}
              >
                {isWithinBudget
                  ? `+${balanceKes} KES change`
                  : `${Math.abs(balanceKes)} KES over`}
              </span>
            </div>

            <div className="h-8 w-px bg-gray-100" />

            <div className="text-right">
              <span className="text-[11px] font-bold uppercase tracking-wide text-gray-400 block">
                Prep Time
              </span>
              <span className="text-sm font-extrabold text-gray-800 inline-flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-glovo-teal" />
                {meal.prepMinutes}m
              </span>
            </div>
          </div>
        </div>

        {/* Scrollable Receipt Body */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Balanced Diet Badges */}
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-400 mb-2">
              Balanced Plate Check
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="p-2.5 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center gap-2">
                <Wheat className="w-4 h-4 text-amber-600 shrink-0" />
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase text-amber-700 block">
                    Energy Carb
                  </span>
                  <span className="text-xs font-bold text-gray-900 truncate block">
                    {meal.nutrition.carb}
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded-2xl bg-rose-50 border border-rose-200/80 flex items-center gap-2">
                <Beef className="w-4 h-4 text-rose-600 shrink-0" />
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase text-rose-700 block">
                    Protein
                  </span>
                  <span className="text-xs font-bold text-gray-900 truncate block">
                    {meal.nutrition.protein}
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center gap-2">
                <Leaf className="w-4 h-4 text-glovo-teal shrink-0" />
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase text-emerald-700 block">
                    Greens / Veg
                  </span>
                  <span className="text-xs font-bold text-gray-900 truncate block">
                    {meal.nutrition.greens}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Itemized Mama Mboga & Butchery Receipt */}
          <div className="bg-glovo-cream rounded-[20px] p-4 border border-dashed border-amber-300">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-700">
                Tap Items As You Shop
              </h3>
              <button
                type="button"
                onClick={handleCopyList}
                className="inline-flex items-center gap-1 text-xs font-bold text-glovo-teal hover:text-glovo-teal-dark cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy List
                  </>
                )}
              </button>
            </div>

            <ul className="space-y-2">
              {meal.shoppingList.map((item, idx) => {
                const isChecked = !!checkedItems[idx];
                return (
                  <li key={idx}>
                    <button
                      type="button"
                      onClick={() => toggleItem(idx)}
                      className={`w-full text-left p-2.5 rounded-xl bg-white border transition flex items-center justify-between gap-2.5 cursor-pointer ${
                        isChecked
                          ? 'border-emerald-200 opacity-60'
                          : 'border-amber-100 hover:border-amber-300'
                      }`}
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        {isChecked ? (
                          <CheckCircle2 className="w-4 h-4 text-glovo-teal shrink-0 mt-0.5" />
                        ) : (
                          <Circle className="w-4 h-4 text-gray-300 shrink-0 mt-0.5" />
                        )}
                        <div className="min-w-0">
                          <p
                            className={`text-xs sm:text-sm font-bold text-gray-900 leading-snug ${
                              isChecked ? 'line-through' : ''
                            }`}
                          >
                            {item.name}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span
                              className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                                VENDOR_BADGE_STYLES[item.vendor]
                              }`}
                            >
                              {item.vendor}
                            </span>
                            <span className="text-[11px] font-semibold text-gray-500">
                              • {item.quantity}
                            </span>
                          </div>
                        </div>
                      </div>

                      <span className="text-xs sm:text-sm font-extrabold text-gray-900 shrink-0">
                        {item.costKes} KES
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>

            <div className="mt-3 pt-2.5 border-t border-dashed border-amber-300 flex items-center justify-between text-sm font-black text-gray-900">
              <span>TOTAL MARKET SPEND</span>
              <span>{meal.totalCostKes} KES</span>
            </div>
          </div>

          {/* 15–25 Min Solo Cooking Guide */}
          <div>
            <div className="flex items-center gap-1.5 mb-2.5">
              <Flame className="w-4 h-4 text-orange-500" />
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-500">
                Solo Prep Steps ({meal.prepMinutes} Mins)
              </h3>
            </div>
            <ol className="space-y-2.5">
              {meal.cookingSteps.map((step, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2.5 text-xs sm:text-sm text-gray-700 leading-relaxed"
                >
                  <span className="w-5 h-5 rounded-full bg-glovo-yellow text-gray-900 font-extrabold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Wangige Insider Tip */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/90 border border-emerald-200 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-glovo-teal shrink-0 mt-0.5" />
            <p className="text-xs text-emerald-950 leading-relaxed">
              <strong className="font-extrabold">Wangige Market Tip: </strong>
              {meal.wangigeTip}
            </p>
          </div>
        </div>

        {/* Sticky Bottom Action Footer */}
        <div className="p-4 bg-white border-t border-gray-100 shrink-0">
          <button
            type="button"
            onClick={handleLogClick}
            className={`w-full py-3.5 px-5 rounded-full font-extrabold text-sm sm:text-base shadow-md transition flex items-center justify-center gap-2 cursor-pointer ${
              justLogged
                ? 'bg-emerald-700 text-white'
                : 'bg-glovo-teal hover:bg-glovo-teal-dark active:scale-[0.98] text-white'
            }`}
          >
            {justLogged ? (
              <>
                <Check className="w-5 h-5" />
                <span>Logged! Deprioritized for Next 4 Days</span>
              </>
            ) : (
              <>
                <Utensils className="w-5 h-5" />
                <span>
                  {isRecentlyEaten
                    ? "Log Tonight's Supper Again"
                    : "Log Tonight's Supper"}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}