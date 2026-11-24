export function getIntaSendConfig() {
  const secretKey = process.env.INTASEND_SECRET_KEY?.trim();

  if (!secretKey) {
    throw new Error(
      'Missing INTASEND_SECRET_KEY environment variable in Vercel settings.'
    );
  }

  // Automatically switches between Sandbox and Live based on key prefix or INTASEND_ENV
  const isSandbox =
    process.env.INTASEND_ENV === 'sandbox' ||
    secretKey.startsWith('ISSecretKey_test_');

  const baseUrl = isSandbox
    ? 'https://sandbox.intasend.com'
    : 'https://api.intasend.com';

  return { secretKey, baseUrl, isSandbox };
}

/**
 * Normalizes Kenyan phone numbers (07XX, 01XX, +2547XX, 2541XX) into 12-digit 254XXXXXXXXX format.
 */
export function normalizeKenyanPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');

  if (/^0[17]\d{8}$/.test(digits)) {
    return `254${digits.slice(1)}`;
  }
  if (/^254[17]\d{8}$/.test(digits)) {
    return digits;
  }
  if (/^[17]\d{8}$/.test(digits)) {
    return `254${digits}`;
  }
  return null;
}

/**
 * Maps IntaSend / Safaricom M-Pesa failure codes into clear donor-friendly messages.
 */
export function mapMpesaFailureMessage(
  failedCode?: string | number | null,
  failedReason?: string | null
): string {
  const code = String(failedCode ?? '').trim();

  switch (code) {
    case '1032':
      return 'You cancelled the M-Pesa prompt. Tap below anytime to try again.';
    case '1037':
      return 'Your phone could not be reached. Ensure your screen is unlocked and you have network signal.';
    case '1':
      return 'Insufficient M-Pesa balance for this amount.';
    case '2001':
      return 'Wrong M-Pesa PIN entered. Please try again.';
    default:
      return (
        failedReason ||
        'The M-Pesa transaction did not complete. Please try again.'
      );
  }
}