import { getNotificationSafetyState } from '@/lib/notification-safety';
import { recordNotificationDeliveryBatch, type AuditRecordPayload } from '@/lib/notification-delivery-audit';
import { createServiceRoleSupabaseClient } from '@/lib/admin';

// --- Push send path -----------------------------------------------------------
// Two independent channels, both keyed off Supabase user ids:
//
// 1. Expo push -- reaches the native mobile app. Replaces what used to be
//    OneSignal's native SDK integration (react-native-onesignal). Expo push
//    has no device registry of its own, so we look up each target user's
//    tokens from our own `push_tokens` table (migration
//    20260716124259_push_tokens.sql, populated via POST
//    /api/notifications/register-token from the native app).
//
// 2. OneSignal -- reaches PWA browser push subscribers. This is a *separate*
//    integration from the native app's old OneSignal usage -- see
//    src/components/providers/OneSignalIdentityProvider.tsx and
//    src/lib/onesignal.ts, which bind a browser subscription to
//    `external_id = user.id` client-side. That integration was never part
//    of the native-app migration and stays exactly as it was.
//
// The public contract (sendPushNotification's args/return shape, plus the
// dry-run/safety-state gating and per-user audit logging) is kept identical
// to the old sendOneSignalPush on purpose -- every cron and route that calls
// this only ever reads `.sent` off the result, so none of those ~29 call
// sites needed to change beyond the import name.

type PushMessage = {
  userIds: string[];
  title: string;
  body: string;
  url?: string | null;
  data?: Record<string, string>;
};

type SendPushOptions = {
  dryRun?: boolean;
  type?: string;
  notificationKey?: string | null;
  notificationKeysByUserId?: Record<string, string>;
  notificationIdsByUserId?: Record<string, string>;
  metadata?: Record<string, string | number | boolean | null>;
};

const EXPO_PUSH_API_URL = 'https://exp.host/--/api/v2/push/send';
// Expo's documented hard limit is 100 *messages* (one per token) per
// request -- not 100 users, since a user can have multiple devices/tokens.
const EXPO_MESSAGE_BATCH_SIZE = 100;

const ONESIGNAL_API_URL = 'https://api.onesignal.com/notifications';
const ONESIGNAL_BATCH_SIZE = 1000;

function getExpoAccessToken(): string | null {
  return process.env.EXPO_ACCESS_TOKEN?.trim() || null;
}

function getOneSignalServerConfig() {
  const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID?.trim();
  const apiKey = process.env.ONESIGNAL_REST_API_KEY?.trim();
  if (!appId || !apiKey) return null;
  return { appId, apiKey };
}

// Expo push has no app-level API key the way OneSignal did -- any valid
// token can be sent to, so this channel is always "available" in the sense
// that matters for a boolean status flag.
export function canSendPush() {
  return true;
}

// Whether the OneSignal (PWA browser push) channel is configured -- kept
// separate from canSendPush() since the two channels are genuinely
// independent and callers/diagnostics may care about either one.
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

function buildAuditRows({
  userIds,
  type,
  status,
  provider,
  dryRun = false,
  disabled = false,
  providerMessageId = null,
  errorCode = null,
  errorMessage = null,
  notificationKey = null,
  notificationKeysByUserId,
  notificationIdsByUserId,
  metadata = {},
}: {
  userIds: string[];
  type: string;
  status: 'sent' | 'failed' | 'dry_run' | 'disabled' | 'unconfigured' | 'skipped';
  provider: 'expo' | 'onesignal';
  dryRun?: boolean;
  disabled?: boolean;
  providerMessageId?: string | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  notificationKey?: string | null;
  notificationKeysByUserId?: Record<string, string>;
  notificationIdsByUserId?: Record<string, string>;
  metadata?: Record<string, string | number | boolean | null>;
}): AuditRecordPayload[] {
  // Field names here must match AuditRecordPayload (camelCase) exactly --
  // see the doc comment on notification-delivery-audit.ts's buildAuditRow
  // for why this bit us once already (snake_case rows silently losing
  // user_id/notification_key/etc. on every insert).
  return userIds.map((userId) => ({
    userId,
    notificationId: notificationIdsByUserId?.[userId] ?? undefined,
    notificationKey: notificationKeysByUserId?.[userId] ?? notificationKey ?? undefined,
    providerMessageId: providerMessageId ?? undefined,
    provider,
    type,
    status,
    dryRun,
    disabled,
    errorCode: errorCode ?? undefined,
    errorMessage: errorMessage ?? undefined,
    metadata: metadata as Record<string, unknown>,
  }));
}

function asProviderMessageId(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object' || !('id' in payload)) return null;
  const id = (payload as { id: unknown }).id;
  return typeof id === 'string' ? id : null;
}

type ExpoTicket =
  | { status: 'ok'; id: string }
  | { status: 'error'; message: string; details?: { error?: string } };

type TokenRow = { user_id: string; token: string };

// --- Channel 1: Expo push (native app) ---------------------------------------

async function sendViaExpo(
  targetUserIds: string[],
  message: PushMessage,
  messageType: string,
  options: SendPushOptions | undefined
): Promise<Set<string>> {
  const sentUserIds = new Set<string>();
  const supabase = createServiceRoleSupabaseClient();

  const { data: tokenRows, error: tokenError } = await supabase
    .from('push_tokens')
    .select('user_id, token')
    .in('user_id', targetUserIds);

  if (tokenError) {
    console.error('push_tokens lookup failed:', tokenError);
    await recordNotificationDeliveryBatch(buildAuditRows({
      userIds: targetUserIds,
      type: messageType,
      status: 'failed',
      provider: 'expo',
      errorCode: 'token_lookup_failed',
      errorMessage: tokenError.message.slice(0, 500),
      notificationKey: options?.notificationKey ?? null,
      notificationKeysByUserId: options?.notificationKeysByUserId,
      notificationIdsByUserId: options?.notificationIdsByUserId,
      metadata: { url: message.url ?? null, ...options?.metadata },
    }));
    return sentUserIds;
  }

  const tokensByUser = new Map<string, string[]>();
  for (const row of (tokenRows ?? []) as TokenRow[]) {
    const list = tokensByUser.get(row.user_id) ?? [];
    list.push(row.token);
    tokensByUser.set(row.user_id, list);
  }

  const usersWithNoToken = targetUserIds.filter((id) => !tokensByUser.has(id));
  if (usersWithNoToken.length > 0) {
    await recordNotificationDeliveryBatch(buildAuditRows({
      userIds: usersWithNoToken,
      type: messageType,
      status: 'skipped',
      provider: 'expo',
      notificationKey: options?.notificationKey ?? null,
      notificationKeysByUserId: options?.notificationKeysByUserId,
      notificationIdsByUserId: options?.notificationIdsByUserId,
      metadata: { reason: 'no_push_token', url: message.url ?? null, ...options?.metadata },
    }));
  }

  const usersWithTokens = targetUserIds.filter((id) => tokensByUser.has(id));
  if (usersWithTokens.length === 0) return sentUserIds;

  const outbox: Array<{ userId: string; token: string; message: Record<string, unknown> }> = [];
  for (const userId of usersWithTokens) {
    for (const token of tokensByUser.get(userId)!) {
      outbox.push({
        userId,
        token,
        message: {
          to: token,
          title: message.title,
          body: message.body,
          sound: 'default',
          data: { ...message.data, url: message.url ?? undefined },
        },
      });
    }
  }

  const accessToken = getExpoAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'Accept-Encoding': 'gzip, deflate',
  };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  const userOutcome = new Map<string, { sent: boolean; errorCode?: string; errorMessage?: string }>();
  const receiptRows: { ticket_id: string; token: string; user_id: string }[] = [];
  const staleTokens: string[] = [];

  for (const batch of chunk(outbox, EXPO_MESSAGE_BATCH_SIZE)) {
    try {
      const response = await fetch(EXPO_PUSH_API_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify(batch.map((item) => item.message)),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Expo push batch failed:', response.status, errorText);
        for (const item of batch) {
          userOutcome.set(item.userId, { sent: false, errorCode: String(response.status), errorMessage: errorText.slice(0, 500) });
        }
        continue;
      }

      const payload = (await response.json().catch(() => null)) as { data?: ExpoTicket[] } | null;
      const tickets = payload?.data ?? [];

      tickets.forEach((ticket, index) => {
        const item = batch[index];
        if (!item) return;

        if (ticket.status === 'ok') {
          receiptRows.push({ ticket_id: ticket.id, token: item.token, user_id: item.userId });
          const existing = userOutcome.get(item.userId);
          if (!existing || !existing.sent) userOutcome.set(item.userId, { sent: true });
        } else {
          const errorCode = ticket.details?.error ?? 'unknown';
          if (errorCode === 'DeviceNotRegistered') staleTokens.push(item.token);
          const existing = userOutcome.get(item.userId);
          if (!existing || !existing.sent) {
            userOutcome.set(item.userId, { sent: false, errorCode, errorMessage: ticket.message?.slice(0, 500) });
          }
        }
      });
    } catch (error) {
      console.error('Expo push request crashed:', error);
      for (const item of batch) {
        const existing = userOutcome.get(item.userId);
        if (!existing || !existing.sent) {
          userOutcome.set(item.userId, {
            sent: false,
            errorCode: 'request_crashed',
            errorMessage: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }
  }

  if (receiptRows.length > 0) {
    const { error: receiptInsertError } = await supabase.from('push_receipts_pending').insert(receiptRows);
    if (receiptInsertError) console.warn('push_receipts_pending insert failed:', receiptInsertError.message);
  }

  if (staleTokens.length > 0) {
    const { error: pruneError } = await supabase.from('push_tokens').delete().in('token', staleTokens);
    if (pruneError) console.warn('stale push_tokens prune failed:', pruneError.message);
  }

  const sentUserIdsList: string[] = [];
  const failedByError = new Map<string, string[]>();
  for (const [userId, outcome] of userOutcome) {
    if (outcome.sent) {
      sentUserIdsList.push(userId);
      sentUserIds.add(userId);
    } else {
      const key = `${outcome.errorCode ?? 'unknown'}::${outcome.errorMessage ?? ''}`;
      const list = failedByError.get(key) ?? [];
      list.push(userId);
      failedByError.set(key, list);
    }
  }

  if (sentUserIdsList.length > 0) {
    await recordNotificationDeliveryBatch(buildAuditRows({
      userIds: sentUserIdsList,
      type: messageType,
      status: 'sent',
      provider: 'expo',
      notificationKey: options?.notificationKey ?? null,
      notificationKeysByUserId: options?.notificationKeysByUserId,
      notificationIdsByUserId: options?.notificationIdsByUserId,
      metadata: { url: message.url ?? null, ...options?.metadata },
    }));
  }

  for (const [key, userIds] of failedByError) {
    const [errorCode, errorMessage] = key.split('::');
    await recordNotificationDeliveryBatch(buildAuditRows({
      userIds,
      type: messageType,
      status: 'failed',
      provider: 'expo',
      errorCode: errorCode || null,
      errorMessage: errorMessage || null,
      notificationKey: options?.notificationKey ?? null,
      notificationKeysByUserId: options?.notificationKeysByUserId,
      notificationIdsByUserId: options?.notificationIdsByUserId,
      metadata: { url: message.url ?? null, ...options?.metadata },
    }));
  }

  return sentUserIds;
}

// --- Channel 2: OneSignal (PWA browser push) ---------------------------------

async function sendViaOneSignal(
  targetUserIds: string[],
  message: PushMessage,
  messageType: string,
  options: SendPushOptions | undefined
): Promise<Set<string>> {
  const sentUserIds = new Set<string>();
  const config = getOneSignalServerConfig();

  if (!config) {
    await recordNotificationDeliveryBatch(buildAuditRows({
      userIds: targetUserIds,
      type: messageType,
      status: 'unconfigured',
      provider: 'onesignal',
      notificationKey: options?.notificationKey ?? null,
      notificationKeysByUserId: options?.notificationKeysByUserId,
      notificationIdsByUserId: options?.notificationIdsByUserId,
      metadata: {
        reason: 'onesignal_unconfigured',
        url: message.url ?? null,
        target_count: targetUserIds.length,
        ...options?.metadata,
      },
    }));
    return sentUserIds;
  }

  for (const batch of chunk(targetUserIds, ONESIGNAL_BATCH_SIZE)) {
    try {
      const response = await fetch(ONESIGNAL_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Key ${config.apiKey}`,
        },
        body: JSON.stringify({
          app_id: config.appId,
          include_aliases: { external_id: batch },
          target_channel: 'push',
          headings: { en: message.title },
          contents: { en: message.body },
          url: message.url ?? undefined,
          data: message.data ?? undefined,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OneSignal push failed:', response.status, errorText);
        await recordNotificationDeliveryBatch(buildAuditRows({
          userIds: batch,
          type: messageType,
          status: 'failed',
          provider: 'onesignal',
          errorCode: String(response.status),
          errorMessage: errorText.slice(0, 500),
          notificationKey: options?.notificationKey ?? null,
          notificationKeysByUserId: options?.notificationKeysByUserId,
          notificationIdsByUserId: options?.notificationIdsByUserId,
          metadata: { url: message.url ?? null, batch_size: batch.length, ...options?.metadata },
        }));
        continue;
      }

      const responsePayload: unknown = await response.json().catch(() => null);
      const providerMessageId = asProviderMessageId(responsePayload);

      await recordNotificationDeliveryBatch(buildAuditRows({
        userIds: batch,
        type: messageType,
        status: 'sent',
        provider: 'onesignal',
        providerMessageId,
        notificationKey: options?.notificationKey ?? null,
        notificationKeysByUserId: options?.notificationKeysByUserId,
        notificationIdsByUserId: options?.notificationIdsByUserId,
        metadata: { url: message.url ?? null, batch_size: batch.length, ...options?.metadata },
      }));
      for (const userId of batch) sentUserIds.add(userId);
    } catch (error) {
      console.error('OneSignal push request crashed:', error);
      await recordNotificationDeliveryBatch(buildAuditRows({
        userIds: batch,
        type: messageType,
        status: 'failed',
        provider: 'onesignal',
        errorCode: 'request_crashed',
        errorMessage: error instanceof Error ? error.message : String(error),
        notificationKey: options?.notificationKey ?? null,
        notificationKeysByUserId: options?.notificationKeysByUserId,
        notificationIdsByUserId: options?.notificationIdsByUserId,
        metadata: { url: message.url ?? null, batch_size: batch.length, ...options?.metadata },
      }));
    }
  }

  return sentUserIds;
}

// --- Public entry point --------------------------------------------------------

export async function sendPushNotification(message: PushMessage, options?: SendPushOptions) {
  const targetUserIds = Array.from(new Set(message.userIds.filter(Boolean)));
  const messageType = options?.type ?? message.data?.type ?? 'general';
  const safetyState = getNotificationSafetyState(messageType);
  const dryRun = Boolean(options?.dryRun || safetyState.isDryRun);

  if (targetUserIds.length === 0) {
    return { attempted: 0, sent: 0, skipped: 0, dryRun, disabled: false, configured: true };
  }

  if (dryRun || safetyState.skipDelivery) {
    await recordNotificationDeliveryBatch(buildAuditRows({
      userIds: targetUserIds,
      type: messageType,
      status: dryRun ? 'dry_run' : 'disabled',
      provider: 'expo',
      dryRun,
      disabled: safetyState.isDisabled,
      notificationKey: options?.notificationKey ?? null,
      notificationKeysByUserId: options?.notificationKeysByUserId,
      notificationIdsByUserId: options?.notificationIdsByUserId,
      metadata: {
        reason: dryRun ? 'dry_run' : safetyState.disabledReason ?? 'disabled',
        url: message.url ?? null,
        target_count: targetUserIds.length,
        ...options?.metadata,
      },
    }));

    return {
      attempted: targetUserIds.length,
      sent: 0,
      skipped: targetUserIds.length,
      dryRun,
      disabled: safetyState.isDisabled,
      configured: true,
      reason: dryRun ? 'dry run' : safetyState.disabledReason,
    };
  }

  // Fan out to both channels independently -- a user reachable on either
  // (or both) counts as reached. Neither channel blocks the other.
  const [expoSent, oneSignalSent] = await Promise.all([
    sendViaExpo(targetUserIds, message, messageType, options),
    sendViaOneSignal(targetUserIds, message, messageType, options),
  ]);

  const sentUnion = new Set<string>([...expoSent, ...oneSignalSent]);

  return {
    attempted: targetUserIds.length,
    sent: sentUnion.size,
    skipped: targetUserIds.length - sentUnion.size,
    dryRun: false,
    disabled: false,
    configured: true,
  };
}
