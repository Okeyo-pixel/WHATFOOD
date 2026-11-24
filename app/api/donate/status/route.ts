import { NextRequest, NextResponse } from 'next/server';
import { getIntaSendConfig, mapMpesaFailureMessage } from '@/lib/intasend';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const invoiceId = String(body?.invoiceId ?? '').trim();

    if (!invoiceId) {
      return NextResponse.json(
        { error: 'Missing invoiceId.' },
        { status: 400 }
      );
    }

    const { secretKey, baseUrl } = getIntaSendConfig();

    const response = await fetch(`${baseUrl}/api/v1/payment/status/`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ invoice_id: invoiceId }),
      cache: 'no-store',
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Unable to check payment status right now.' },
        { status: response.status }
      );
    }

    const invoice = data?.invoice ?? data;
    const state = String(invoice?.state ?? 'PENDING').toUpperCase();
    const receipt =
      invoice?.mpesa_reference || invoice?.provider_ref || null;

    if (state === 'FAILED' || state === 'CANCELED') {
      return NextResponse.json({
        state,
        receipt,
        message: mapMpesaFailureMessage(
          invoice?.failed_code,
          invoice?.failed_reason
        ),
      });
    }

    return NextResponse.json({
      state,
      receipt,
      message:
        state === 'COMPLETE'
          ? 'Payment confirmed! Asante sana!'
          : 'Waiting for M-Pesa PIN confirmation...',
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Status check failed.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}