import { NextResponse } from 'next/server';
import { start } from 'workflow/api';

import { checkPendingExpoPushReceipts } from '@/lib/push-receipts';
import { shouldUseVercelWorkflowRuntime } from '@/lib/workflow-runtime';
import { pushReceiptCheckWorkflow } from '@/workflows/push-notifications';

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: 'CRON_SECRET is not configured' }, { status: 500 });
  }
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const direct = new URL(request.url).searchParams.get('direct') === 'true';

  try {
    if (direct || !shouldUseVercelWorkflowRuntime()) {
      const result = await checkPendingExpoPushReceipts();
      return NextResponse.json({ message: 'Receipt check complete', direct: true, ...result });
    }

    const run = await start(pushReceiptCheckWorkflow);
    return NextResponse.json({ message: 'Receipt check workflow queued', workflowRunId: run.runId });
  } catch (error) {
    console.error('Push receipt check cron crashed:', error);
    try {
      const result = await checkPendingExpoPushReceipts();
      return NextResponse.json({ message: 'Receipt check complete via fallback', fallback: true, ...result });
    } catch (fallbackError) {
      return NextResponse.json(
        { error: fallbackError instanceof Error ? fallbackError.message : 'Push receipt check cron crashed' },
        { status: 500 }
      );
    }
  }
}
