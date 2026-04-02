type PushMessage = {
  userIds: string[];
  title: string;
  body: string;
  url?: string | null;
  data?: Record<string, string>;
};

const ONESIGNAL_API_URL = 'https://api.onesignal.com/notifications';
const BATCH_SIZE = 1000;

function getOneSignalServerConfig() {
  const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID?.trim();
  const apiKey = process.env.ONESIGNAL_REST_API_KEY?.trim();

  if (!appId || !apiKey) return null;

  return { appId, apiKey };
}

export function canSendOneSignalPush() {
  return Boolean(getOneSignalServerConfig());
}

function chunk<T>(items: T[], size: number) {
  const batches: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    batches.push(items.slice(index, index + size));
  }
  return batches;
}

export async function sendOneSignalPush(message: PushMessage) {
  const config = getOneSignalServerConfig();
  const targetUserIds = Array.from(new Set(message.userIds.filter(Boolean)));

  if (!config || targetUserIds.length === 0) {
    return { attempted: 0, sent: 0, configured: Boolean(config) };
  }

  let sent = 0;

  for (const batch of chunk(targetUserIds, BATCH_SIZE)) {
    const response = await fetch(ONESIGNAL_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Key ${config.apiKey}`,
      },
      body: JSON.stringify({
        app_id: config.appId,
        include_aliases: {
          external_id: batch,
        },
        target_channel: 'push',
        headings: {
          en: message.title,
        },
        contents: {
          en: message.body,
        },
        url: message.url ?? undefined,
        data: message.data ?? undefined,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OneSignal push failed:', response.status, errorText);
      continue;
    }

    sent += batch.length;
  }

  return {
    attempted: targetUserIds.length,
    sent,
    configured: true,
  };
}
