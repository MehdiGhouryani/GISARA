import { db } from './db';

// Without a real provider we must NOT pretend to send: the simulated path echoes the
// message (including the OTP) back to the caller, which in production would hand the
// login code to whoever asked for it.
const isProduction = () => process.env.NODE_ENV === 'production';
const SMS_TIMEOUT_MS = 6000;

/**
 * Service to handle OTP & Order SMS delivery via Kavenegar / FarazSMS / Ghasedak
 */
export async function sendSMS(mobile: string, textOrToken: string, templateCode?: string): Promise<{ success: boolean; provider: string; message: string }> {
  const settings = db.settings?.sms || { provider: 'kavenegar', apiKey: '', patternCode: 'otp_verify' };
  const rawApiKey = (settings.apiKey || process.env.KAVENEGAR_API_KEY || '').trim();
  const apiKey = rawApiKey.startsWith('your-') ? '' : rawApiKey;

  // If no API Key is provided, fallback to simulated dev mode cleanly
  if (!apiKey || apiKey.trim() === '' || settings.provider === 'mock') {
    if (isProduction()) {
      console.error('[SMS] No SMS provider configured; refusing to simulate delivery in production.');
      return { success: false, provider: 'unconfigured', message: 'سرویس پیامک پیکربندی نشده است.' };
    }
    console.info(`[SMS DEV SIMULATOR] To: ${mobile} | Code/Msg: ${textOrToken} | Provider: Simulated`);
    return {
      success: true,
      provider: 'simulated_dev',
      message: `[کد پیامک شبیه‌سازی‌شده]: ${textOrToken}`
    };
  }

  try {
    if (settings.provider === 'kavenegar') {
      const template = templateCode || settings.patternCode || 'otp_verify';
      const url = `https://api.kavenegar.com/v1/${apiKey}/verify/lookup.json?receptor=${mobile}&token=${encodeURIComponent(textOrToken)}&template=${template}`;
      
      const res = await fetch(url, { method: 'GET', signal: AbortSignal.timeout(SMS_TIMEOUT_MS) });
      const data: any = await res.json();

      if (data?.return?.status === 200) {
        return { success: true, provider: 'kavenegar', message: 'پیامک با موفقیت ارسال شد.' };
      } else {
        console.warn('[Kavenegar Error]:', data?.return?.message);
        return { success: false, provider: 'kavenegar', message: data?.return?.message || 'خطا در وب‌سرویس کاوه‌نگار' };
      }
    }

    if (settings.provider === 'farazsms') {
      const url = 'https://ippanel.com/realm/api/subusers/sms/p2p/send';
      const body = {
        api_key: apiKey,
        pattern_code: templateCode || settings.patternCode,
        receptor: mobile,
        input_data: { token: textOrToken }
      };

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(SMS_TIMEOUT_MS)
      });
      const data: any = await res.json();

      if (res.ok && data?.status === 'OK') {
        return { success: true, provider: 'farazsms', message: 'پیامک فراز اس‌ام‌اس ارسال گردید.' };
      } else {
        return { success: false, provider: 'farazsms', message: 'خطا در وب‌سرویس فراز اس‌ام‌اس' };
      }
    }

    if (isProduction()) {
      return { success: false, provider: settings.provider, message: 'ارائه‌دهندهٔ پیامک پشتیبانی نمی‌شود.' };
    }
    return { success: true, provider: 'simulated_dev', message: 'پیامک در حالت پیش‌فرض ارسال شد.' };
  } catch (err: any) {
    console.error('[SMS Delivery Exception]:', err.message);
    return {
      success: false,
      provider: settings.provider,
      message: `خطای ارتباط با سامانه پیامک: ${err.message}`
    };
  }
}

/**
 * Order-confirmation SMS. Kavenegar's verify/lookup API takes short tokens (no spaces) bound to a
 * pre-approved template, so free text cannot be sent through it. The template/pattern is configured
 * per provider; when none is configured the message is skipped (logged), never sent malformed.
 */
export async function sendOrderConfirmationSMS(mobile: string, orderNumber: string, refId: string): Promise<{ success: boolean; provider: string }> {
  const settings: any = db.settings?.sms || { provider: 'kavenegar', apiKey: '', patternCode: '' };
  const rawApiKey = (settings.apiKey || process.env.KAVENEGAR_API_KEY || '').trim();
  const apiKey = rawApiKey.startsWith('your-') ? '' : rawApiKey;

  if (!apiKey || settings.provider === 'mock') {
    if (!isProduction()) console.info(`[SMS DEV SIMULATOR] Order confirmation to ${mobile}: ${orderNumber} / ${refId}`);
    return { success: !isProduction(), provider: 'simulated_dev' };
  }

  try {
    if (settings.provider === 'kavenegar') {
      const template = process.env.KAVENEGAR_ORDER_TEMPLATE || '';
      if (!template) {
        console.warn('[SMS] KAVENEGAR_ORDER_TEMPLATE is not set; skipping order confirmation SMS.');
        return { success: false, provider: 'kavenegar' };
      }
      const token = encodeURIComponent(orderNumber.replace(/\s+/g, '-'));
      const token2 = encodeURIComponent(String(refId).replace(/\s+/g, '-'));
      const url = `https://api.kavenegar.com/v1/${apiKey}/verify/lookup.json?receptor=${mobile}&token=${token}&token2=${token2}&template=${template}`;
      const res = await fetch(url, { method: 'GET', signal: AbortSignal.timeout(SMS_TIMEOUT_MS) });
      const data: any = await res.json();
      return { success: data?.return?.status === 200, provider: 'kavenegar' };
    }
    if (settings.provider === 'farazsms') {
      const pattern = process.env.FARAZSMS_ORDER_PATTERN || '';
      if (!pattern) {
        console.warn('[SMS] FARAZSMS_ORDER_PATTERN is not set; skipping order confirmation SMS.');
        return { success: false, provider: 'farazsms' };
      }
      const res = await fetch('https://ippanel.com/realm/api/subusers/sms/p2p/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: apiKey, pattern_code: pattern, receptor: mobile, input_data: { order: orderNumber, ref: String(refId) } }),
        signal: AbortSignal.timeout(SMS_TIMEOUT_MS)
      });
      const data: any = await res.json();
      return { success: res.ok && data?.status === 'OK', provider: 'farazsms' };
    }
  } catch (err: any) {
    console.error('[SMS] Order confirmation failed:', err?.message);
  }
  return { success: false, provider: settings.provider };
}
