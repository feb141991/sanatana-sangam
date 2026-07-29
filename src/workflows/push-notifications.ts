import { sleep } from 'workflow';

import { checkPendingExpoPushReceipts } from '@/lib/push-receipts';
import { sendPushNotification } from '@/lib/push-server';

type TestNotificationInput = {
  userId: string;
  title: string;
  body: string;
  actionUrl: string;
  notificationId?: string;
  createdAt: string;
};

export async function pushReceiptCheckWorkflow() {
  'use workflow';

  return await checkReceiptsStep();
}

export async function testNotificationWorkflow(input: TestNotificationInput) {
  'use workflow';

  const sendResult = await sendTestNotificationStep(input);
  await sleep('20m');
  const receiptResult = await checkReceiptsStep();

  return { sendResult, receiptResult };
}

async function sendTestNotificationStep(input: TestNotificationInput) {
  'use step';

  return await sendPushNotification(
    {
      userIds: [input.userId],
      title: input.title,
      body: input.body,
      url: input.actionUrl,
      data: {
        type: 'test',
        created_at: input.createdAt,
      },
    },
    {
      type: 'test',
      notificationIdsByUserId: input.notificationId ? { [input.userId]: input.notificationId } : undefined,
      metadata: { workflow: 'test-notification' },
    }
  );
}

async function checkReceiptsStep() {
  'use step';

  return await checkPendingExpoPushReceipts();
}
