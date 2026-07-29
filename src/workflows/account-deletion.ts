import { sleep } from 'workflow';

import { purgeDeletedAccountById } from '@/lib/account-deletion';

type AccountDeletionInput = {
  userId: string;
  deletionRequestedAt: string;
};

export async function accountDeletionCooloffWorkflow(input: AccountDeletionInput) {
  'use workflow';

  await sleep('30d');
  return await purgeDeletedAccountStep(input.userId, input.deletionRequestedAt);
}

async function purgeDeletedAccountStep(userId: string, deletionRequestedAt: string) {
  'use step';

  return await purgeDeletedAccountById(userId, deletionRequestedAt);
}
