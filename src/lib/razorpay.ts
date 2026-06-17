import Razorpay from 'razorpay';

export const PLAN_IDS = {
  zenith_monthly: process.env.RAZORPAY_PLAN_ZENITH_MONTHLY ?? '',
  zenith_annual:  process.env.RAZORPAY_PLAN_ZENITH_ANNUAL  ?? '',
  kul_monthly:    process.env.RAZORPAY_PLAN_KUL_MONTHLY    ?? '',
  kul_annual:     process.env.RAZORPAY_PLAN_KUL_ANNUAL     ?? '',
};

// ─── Founding Member Lifetime Pass ─────────────────────────────────────────
// One-time Razorpay order (not a subscription) — ₹4,999 / $60
// Grants lifetime Zenith to founding members #1–#1000.
// Set RAZORPAY_LIFETIME_AMOUNT_PAISE in Vercel (499900 = ₹4999).
export const LIFETIME_PASS = {
  amount_paise: parseInt(process.env.RAZORPAY_LIFETIME_AMOUNT_PAISE ?? '499900', 10),
  currency:     'INR',
  name:         'Founding Member Lifetime Pass',
  description:  'Lifetime Zenith access for founding members of Shoonaya — forever.',
};

// Lazy singleton — only instantiated at request time, not at module load / build time.
// Avoids "key_id is mandatory" crash when env vars are absent during Next.js build.
let _client: Razorpay | null = null;

export function getRazorpay(): Razorpay {
  if (!_client) {
    const key_id     = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    if (!key_id || !key_secret) {
      throw new Error('RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET env vars are required');
    }
    _client = new Razorpay({ key_id, key_secret });
  }
  return _client;
}
