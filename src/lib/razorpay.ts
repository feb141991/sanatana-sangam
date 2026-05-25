import Razorpay from 'razorpay';

export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export const PLAN_IDS = {
  zenith_monthly: process.env.RAZORPAY_PLAN_ZENITH_MONTHLY ?? '',
  zenith_annual: process.env.RAZORPAY_PLAN_ZENITH_ANNUAL ?? '',
  kul_monthly: process.env.RAZORPAY_PLAN_KUL_MONTHLY ?? '',
  kul_annual: process.env.RAZORPAY_PLAN_KUL_ANNUAL ?? '',
};
