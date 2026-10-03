import { describe, expect, it } from 'vitest';
import { GET as checkout } from './checkout/route';
import { POST as lifetime } from './lifetime/route';
import { POST as activateLifetime } from './lifetime/activate/route';
import { POST as cancelSubscription } from './subscription/cancel/route';
import { GET as subscriptionHistory } from './subscription/history/route';
import { POST as paymentWebhook } from './webhook/route';
import { POST as activatePremium } from '../premium/activate/route';

describe('retired paid-plan endpoints', () => {
  it('fails closed for checkout, activation, history, and cancellation routes', async () => {
    const responses = await Promise.all([
      checkout(),
      lifetime(),
      activateLifetime(),
      cancelSubscription(),
      subscriptionHistory(),
      activatePremium(),
    ]);

    expect(responses.map((response) => response.status)).toEqual([
      410, 410, 410, 410, 410, 410,
    ]);
  });

  it('acknowledges provider webhook deliveries without applying entitlements', async () => {
    const response = await paymentWebhook();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      received: true,
      ignored: true,
      reason: 'payments_retired',
    });
  });
});
