import { checkPendingExpoPushReceipts } from '@/lib/push-receipts';

export async function pushReceiptCheckWorkflow() {
  'use workflow';

  return await checkReceiptsStep();
}

async function checkReceiptsStep() {
  'use step';

  return await checkPendingExpoPushReceipts();
}
