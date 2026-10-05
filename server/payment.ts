import { db } from './db';

// Simulated payments approve ANY authority, so they must be impossible in production:
// an unconfigured gateway must fail closed, never "succeed" without real money moving.
const isProduction = () => process.env.NODE_ENV === 'production';
// Every outbound gateway call is bounded: a hung bank API must never hang a customer's checkout.
const GATEWAY_TIMEOUT_MS = 6000;
const GATEWAY_NOT_CONFIGURED = 'درگاه پرداخت پیکربندی نشده است. لطفاً با پشتیبانی تماس بگیرید.';

interface PaymentRequestOptions {
  orderId: string;
  amountToman: number;
  description: string;
  mobile?: string;
  callbackUrl: string;
}

/**
 * ZarinPal Payment Gateway Integration Service
 */
export async function requestPaymentGateway(opts: PaymentRequestOptions): Promise<{ success: boolean; url: string; authority?: string; isSimulated?: boolean; message?: string }> {
  const settings = db.settings?.payment || { provider: 'zarinpal', merchantId: '', sandbox: true };
  const rawMerchantId = (settings.merchantId || process.env.ZARINPAL_MERCHANT_ID || '').trim();
  const merchantId = rawMerchantId.startsWith('your-') ? '' : rawMerchantId;

  // Amount in Rials for Zarinpal
  const amountRial = opts.amountToman * 10;

  // If no merchant ID is supplied or provider is mock, fallback to simulated gateway
  if (!merchantId || merchantId.trim() === '' || settings.provider === 'mock') {
    if (isProduction()) {
      console.error('[Payment] Refusing to start a payment: no real gateway configured (ZARINPAL_MERCHANT_ID / admin settings).');
      return { success: false, url: '', message: GATEWAY_NOT_CONFIGURED };
    }
    const authority = `SIM-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const simulatedUrl = `/payment/simulated-gateway?authority=${authority}&orderId=${opts.orderId}&amount=${opts.amountToman}`;
    
    return {
      success: true,
      url: simulatedUrl,
      authority,
      isSimulated: true,
      message: 'درگاه پرداخت آزمایشی فعال شد.'
    };
  }

  try {
    const isSandbox = settings.sandbox;
    const requestEndpoint = isSandbox
      ? 'https://sandbox.zarinpal.com/pg/v4/payment/request.json'
      : 'https://api.zarinpal.com/pg/v4/payment/request.json';

    const payload = {
      merchant_id: merchantId,
      // Amount is sent in RIAL and `currency` is deliberately omitted (Zarinpal's default unit is
      // Rial). Sending currency:'IRT' together with a x10 amount made the gateway charge 10x.
      amount: amountRial,
      description: opts.description,
      callback_url: opts.callbackUrl,
      metadata: {
        mobile: opts.mobile || '',
        order_id: opts.orderId
      }
    };

    const res = await fetch(requestEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(GATEWAY_TIMEOUT_MS)
    });

    const data: any = await res.json();

    if (data?.data?.code === 100 && data?.data?.authority) {
      const authority = data.data.authority;
      const gatewayUrl = isSandbox
        ? `https://sandbox.zarinpal.com/pg/StartPay/${authority}`
        : `https://www.zarinpal.com/pg/StartPay/${authority}`;

      return {
        success: true,
        url: gatewayUrl,
        authority,
        isSimulated: false
      };
    } else {
      console.warn('[Zarinpal Request Error]:', data?.errors);
      return {
        success: false,
        url: '',
        message: data?.errors?.message || 'خطا در برقراری ارتباط با درگاه زرین‌پال'
      };
    }
  } catch (err: any) {
    console.error('[Payment Gateway Exception]:', err.message);
    return {
      success: false,
      url: '',
      message: err?.name === 'TimeoutError' ? 'پاسخ درگاه پرداخت دیر رسید. لطفاً دوباره تلاش کنید.' : 'خطای فنی در اتصال به درگاه پرداخت. لطفاً دوباره تلاش کنید.'
    };
  }
}

/**
 * Verify payment authority with ZarinPal API
 */
export async function verifyPaymentGateway(authority: string, amountToman: number): Promise<{ success: boolean; refId?: string; message?: string; retryable?: boolean }> {
  const settings = db.settings?.payment || { provider: 'zarinpal', merchantId: '', sandbox: true };
  const rawMerchantId = (settings.merchantId || process.env.ZARINPAL_MERCHANT_ID || '').trim();
  const merchantId = rawMerchantId.startsWith('your-') ? '' : rawMerchantId;

  // If simulated authority
  if (authority.startsWith('SIM-') || !merchantId) {
    if (isProduction()) {
      return { success: false, message: 'تایید پرداخت آزمایشی در محیط عملیاتی مجاز نیست.' };
    }
    return {
      success: true,
      refId: `REF-${Math.floor(Math.random() * 899999 + 100000)}`,
      message: 'پرداخت آزمایشی با موفقیت تایید شد.'
    };
  }

  try {
    const isSandbox = settings.sandbox;
    const verifyEndpoint = isSandbox
      ? 'https://sandbox.zarinpal.com/pg/v4/payment/verify.json'
      : 'https://api.zarinpal.com/pg/v4/payment/verify.json';

    const payload = {
      merchant_id: merchantId,
      amount: amountToman * 10, // Rial, same unit as the payment request
      authority
    };

    const res = await fetch(verifyEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(GATEWAY_TIMEOUT_MS)
    });

    // A 5xx / unreadable reply says nothing about whether the customer paid: let the caller retry.
    if (res.status >= 500) {
      return { success: false, retryable: true, message: 'سرویس تأیید پرداخت موقتاً در دسترس نیست.' };
    }
    const data: any = await res.json();

    if (data?.data?.code === 100 || data?.data?.code === 101) {
      return {
        success: true,
        refId: String(data.data.ref_id),
        message: 'پرداخت آنلاین با موفقیت تایید و ثبت شد.'
      };
    } else {
      return {
        success: false,
        message: data?.errors?.message || 'تایید پرداخت از سمت بانک ناموفق بود.'
      };
    }
  } catch (err: any) {
    // Timeout / network failure: the payment may have succeeded at the bank — never treat as declined.
    return {
      success: false,
      retryable: true,
      message: 'ارتباط با درگاه برای تأیید پرداخت برقرار نشد.'
    };
  }
}
