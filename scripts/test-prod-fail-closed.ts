// Production must FAIL CLOSED when payment / SMS are not configured.
// Run: NODE_ENV=production npx tsx scripts/test-prod-fail-closed.ts
import { requestPaymentGateway, verifyPaymentGateway } from '../server/payment';
import { sendSMS } from '../server/sms';

delete process.env.ZARINPAL_MERCHANT_ID;
delete process.env.KAVENEGAR_API_KEY;
let failures = 0;
const check = (n: string, ok: boolean) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}`); if (!ok) failures++; };

(async () => {
  check('running with NODE_ENV=production', process.env.NODE_ENV === 'production');

  const req = await requestPaymentGateway({ orderId: 'o1', amountToman: 1000, description: 'd', callbackUrl: 'http://x/cb' });
  check('payment request refused without a real gateway', req.success === false && !req.url && !req.authority);

  const v1 = await verifyPaymentGateway('SIM-123-456', 1000);
  check('SIM- authority is NOT accepted in production', v1.success === false);
  const v2 = await verifyPaymentGateway('A00000000000000000000000000012345', 1000);
  check('any authority is NOT auto-approved when no merchant is configured', v2.success === false);

  const sms = await sendSMS('09120000000', '123456');
  check('SMS is not "sent" without a provider', sms.success === false && sms.provider === 'unconfigured');
  check('SMS failure message never contains the code', !JSON.stringify(sms).includes('123456'));

  process.exit(failures ? 1 : 0);
})();
