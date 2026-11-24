'use client';

import React, { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  X,
  Heart,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
} from 'lucide-react';

interface DonateModalProps {
  isOpen: boolean;
  isFeastMode?: boolean;
  onClose: () => void;
}

type DonateStatus = 'form' | 'sending' | 'waiting' | 'success' | 'error';

const PRESET_AMOUNTS = [50, 100, 250, 500] as const;
const POLL_INTERVAL_MS = 3000;
const MAX_POLL_ATTEMPTS = 30; // ~90 seconds

export default function DonateModal({
  isOpen,
  isFeastMode = false,
  onClose,
}: DonateModalProps) {
  const [amount, setAmount] = useState<string>('100');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [status, setStatus] = useState<DonateStatus>('form');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [mpesaReceipt, setMpesaReceipt] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number>(90);

  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = () => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  };

  useEffect(() => {
    if (!isOpen) {
      stopPolling();
      setStatus('form');
      setStatusMessage('');
      setMpesaReceipt(null);
      setSecondsLeft(90);
    }
    return () => stopPolling();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const startStatusPolling = (invoiceId: string) => {
    stopPolling();
    let attempts = 0;
    setSecondsLeft(90);

    countdownRef.current = setInterval(() => {
      setSecondsLeft((prev) => (prev > 1 ? prev - 1 : 0));
    }, 1000);

    pollTimerRef.current = setInterval(async () => {
      attempts += 1;

      try {
        const res = await fetch('/api/donate/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ invoiceId }),
        });

        const data = await res.json();

        if (data?.state === 'COMPLETE') {
          stopPolling();
          setMpesaReceipt(data.receipt || null);
          setStatusMessage(
            data.message || 'Payment confirmed! Asante sana for the support!'
          );
          setStatus('success');
          confetti({
            particleCount: 95,
            spread: 75,
            origin: { y: 0.55 },
            colors: ['#00A082', '#FFC244', '#22C55E', '#FFFFFF'],
          });
          return;
        }

        if (data?.state === 'FAILED' || data?.state === 'CANCELED') {
          stopPolling();
          setStatusMessage(
            data.message || 'The M-Pesa prompt was not completed.'
          );
          setStatus('error');
          return;
        }
      } catch {
        // Keep polling briefly on transient network blips
      }

      if (attempts >= MAX_POLL_ATTEMPTS) {
        stopPolling();
        setStatusMessage(
          'Timed out waiting for M-Pesa confirmation. If you already paid, check your M-Pesa SMS—otherwise tap below to retry.'
        );
        setStatus('error');
      }
    }, POLL_INTERVAL_MS);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = Math.ceil(Number(amount));

    if (!numericAmount || numericAmount < 10) {
      setStatusMessage('Minimum support amount is 10 bob.');
      setStatus('error');
      return;
    }

    setStatus('sending');
    setStatusMessage('Sending M-Pesa STK Push to your phone...');
    setMpesaReceipt(null);

    try {
      const res = await fetch('/api/donate/stk-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber,
          amount: numericAmount,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatusMessage(
          data?.error || 'Could not trigger M-Pesa prompt. Please check your number.'
        );
        setStatus('error');
        return;
      }

      setStatus('waiting');
      setStatusMessage(
        `Check ${phoneNumber} and enter your M-Pesa PIN to send ${numericAmount.toLocaleString()} bob.`
      );
      startStatusPolling(data.invoiceId);
    } catch {
      setStatusMessage(
        'Network error reaching the server. Check your connection and try again.'
      );
      setStatus('error');
    }
  };

  const handleReset = () => {
    stopPolling();
    setStatus('form');
    setStatusMessage('');
    setMpesaReceipt(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="donate-modal-title"
    >
      <div
        className="w-full sm:max-w-md bg-white rounded-t-[28px] sm:rounded-[28px] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={`px-5 pt-5 pb-5 relative ${
            isFeastMode
              ? 'bg-gradient-to-br from-[#1A1D24] to-[#111318] text-white'
              : 'bg-glovo-yellow text-gray-900'
          }`}
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Close donate modal"
            className={`absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition ${
              isFeastMode
                ? 'bg-white/15 hover:bg-white/25 text-white'
                : 'bg-white/90 hover:bg-white text-gray-900'
            }`}
          >
            <X className="w-4 h-4" />
          </button>

          <div className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider mb-1">
            <Heart
              className={`w-3.5 h-3.5 ${
                isFeastMode ? 'text-glovo-yellow' : 'text-glovo-teal'
              }`}
            />
            <span className={isFeastMode ? 'text-glovo-yellow' : 'text-gray-900/80'}>
              Support Let Me Cook?
            </span>
          </div>

          <h2
            id="donate-modal-title"
            className="text-xl font-black leading-tight"
          >
            Buy the Dev a Chapo! 🫓
          </h2>
          <p
            className={`text-xs font-semibold mt-1 ${
              isFeastMode ? 'text-gray-300' : 'text-gray-900/80'
            }`}
          >
            Enter your Safaricom number &amp; amount to get an instant M-Pesa
            prompt right on your phone.
          </p>
        </div>

        {/* Body */}
        <div className="p-5">
          {status === 'form' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Quick Amount Pills */}
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-500 mb-2">
                  Pick or Type Amount (KES)
                </label>
                <div className="grid grid-cols-4 gap-2 mb-2.5">
                  {PRESET_AMOUNTS.map((preset) => {
                    const selected = Number(amount) === preset;
                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setAmount(String(preset))}
                        className={`py-2 rounded-full text-xs font-extrabold transition cursor-pointer ${
                          selected
                            ? 'bg-glovo-teal text-white shadow-xs'
                            : 'bg-glovo-cream hover:bg-amber-100 text-gray-800 border border-amber-200'
                        }`}
                      >
                        {preset}/-
                      </button>
                    );
                  })}
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-extrabold text-gray-400">
                    KES
                  </span>
                  <input
                    type="number"
                    min={10}
                    max={70000}
                    step={1}
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="100"
                    className="w-full pl-12 pr-4 py-3 rounded-2xl bg-glovo-cream border border-amber-200 text-sm font-extrabold text-gray-900 focus:outline-none focus:ring-2 focus:ring-glovo-teal"
                  />
                </div>
              </div>

              {/* Safaricom Phone Number */}
              <div>
                <label
                  htmlFor="mpesa-phone-input"
                  className="block text-xs font-extrabold uppercase tracking-wider text-gray-500 mb-1.5"
                >
                  M-Pesa Phone Number
                </label>
                <div className="relative">
                  <Smartphone className="w-4 h-4 text-glovo-teal absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    id="mpesa-phone-input"
                    type="tel"
                    inputMode="tel"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="0712 345 678 or 0112 345 678"
                    className="w-full pl-11 pr-4 py-3 rounded-2xl bg-glovo-cream border border-amber-200 text-sm font-bold text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-glovo-teal"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-5 rounded-full bg-glovo-teal hover:bg-glovo-teal-dark active:scale-[0.98] text-white font-extrabold text-sm sm:text-base shadow-md transition cursor-pointer"
              >
                Send M-Pesa Prompt ({Number(amount || 0).toLocaleString()}/-)
              </button>

              <p className="text-[11px] text-gray-400 font-semibold flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-glovo-teal" />
                <span>Secured by IntaSend M-Pesa STK Push</span>
              </p>
            </form>
          )}

          {(status === 'sending' || status === 'waiting') && (
            <div className="py-6 text-center space-y-3">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-50 text-glovo-teal flex items-center justify-center">
                <Loader2 className="w-7 h-7 animate-spin" />
              </div>
              <h3 className="text-base font-extrabold text-gray-900">
                {status === 'sending'
                  ? 'Sending M-Pesa Prompt...'
                  : 'Check Your Phone!'}
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                {statusMessage}
              </p>
              {status === 'waiting' && (
                <span className="inline-block px-3 py-1 rounded-full bg-glovo-cream border border-amber-200 text-xs font-extrabold text-gray-700">
                  Waiting for PIN • {secondsLeft}s
                </span>
              )}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs font-bold text-gray-400 hover:text-gray-700 underline cursor-pointer"
                >
                  Cancel &amp; edit details
                </button>
              </div>
            </div>
          )}

          {status === 'success' && (
            <div className="py-5 text-center space-y-3">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 text-glovo-teal flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black text-gray-900">
                Asante Sana! 🎉
              </h3>
              <p className="text-xs sm:text-sm text-gray-600">
                {statusMessage}
              </p>
              {mpesaReceipt && (
                <div className="inline-block px-3.5 py-1.5 rounded-full bg-glovo-cream border border-amber-200 text-xs font-extrabold text-gray-800">
                  M-Pesa Ref: {mpesaReceipt}
                </div>
              )}
              <button
                type="button"
                onClick={onClose}
                className="w-full mt-2 py-3 rounded-full bg-glovo-teal text-white font-extrabold text-sm cursor-pointer"
              >
                Back to Cooking
              </button>
            </div>
          )}

          {status === 'error' && (
            <div className="py-5 text-center space-y-3">
              <div className="w-14 h-14 mx-auto rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-base font-extrabold text-gray-900">
                Prompt Not Completed
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                {statusMessage}
              </p>
              <div className="grid grid-cols-2 gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="py-2.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs sm:text-sm cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="py-2.5 rounded-full bg-glovo-teal hover:bg-glovo-teal-dark text-white font-bold text-xs sm:text-sm cursor-pointer"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}