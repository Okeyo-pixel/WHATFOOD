import { NextRequest, NextResponse } from 'next/server';
import { getIntaSendConfig, normalizeKenyanPhone } from '@/lib/intasend';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rawPhone = String(body?.phoneNumber ?? '');
    const rawAmount = Number(body?.amount);

    const phoneNumber = normalizeKenyanPhone(rawPhone);
    if (!phoneNumber) {
      return NextResponse.json(
        {
          error:
            'Enter a valid Safaricom number (e.g. 0712345678 or 0112345678).',
        },
        { status: 400 }
      );
    }

    if (!Number.isFinite(rawAmount) || rawAmount < 10 || rawAmount > 70000) {
      return NextResponse.json(
        { error: 'Please enter an amount between 10 bob and 70,000 bob.' },
        { status: 400 }
      );
    }

    const amount = Math.ceil(rawAmount);
    const { secretKey, baseUrl, isSandbox } = getIntaSendConfig();
    const apiRef = `lmc-donate-${Date.now()}`;

    const response = await fetch(`${baseUrl}/api/v1/payment/mpesa-stk-push/`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        phone_number: phoneNumber,
        api_ref: apiRef,
      }),
      cache: 'no-store',
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const apiError =
        data?.errors?.[0]?.detail ||
        data?.detail ||
        'Could not send the M-Pesa prompt right now. Please try again.';
      return NextResponse.json({ error: apiError }, { status: response.status });
    }

    const invoiceId = data?.invoice?.invoice_id || data?.id;
    if (!invoiceId) {
      return NextResponse.json(
        { error: 'M-Pesa prompt sent, but no tracking invoice ID was returned.' },
        { status: 502 }
      );
    }

    return NextResponse.json({
      invoiceId,
      state: data?.invoice?.state ?? 'PENDING',
      amount,
      phoneNumber,
      isSandbox,
    });
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : 'Unexpected server error while sending M-Pesa prompt.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}