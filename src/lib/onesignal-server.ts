import { getNotificationSafetyState } from '@/lib/notification-safety';
import { recordNotificationDeliveryBatch } from '@/lib/notification-delivery-audit';
import type { Json } from '@/types/database';

type PushMessage = {
  userIds: string[];
  title: string;
  body: string;
  url?: string | null;
  data?: Record<string, string>;
};

type SendOneSignalOptions = {
  dryRun?: boolean;
  type?: string;
  notificationKey?: string | null;
  notificationKeysByUserId?: Record<string, string>;
  notificationIdsByUserId?: Record<string, string>;
  metadata?: Record<string, string | number | boolean | null>;
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

function buildAuditRows({
  userIds,
  type,
  status,
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
  dryRun?: boolean;
  disabled?: boolean;
  providerMessageId?: string | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  notificationKey?: string | null;
  notificationKeysByUserId?: Record<string, string>;
  notificationIdsByUserId?: Record<string, string>;
  metadata?: Record<string, string | number | boolean | null>;
}) {
  return userIds.map((userId) => ({
    user_id: userId,
    notification_id: notificationIdsByUserId?.[userId] ?? null,
    notification_key: notificationKeysByUserId?.[userId] ?? notificationKey,
    provider_message_id: providerMessageId,
    type,
    status,
    dry_run: dryRun,
    disabled,
    error_code: errorCode,
    error_message: errorMessage,
    metadata: metadata as Record<string, unknown>,
  }));
}

function asProviderMessageId(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object' || !('id' in payload)) return null;
  const id = payload.id;
  return typeof id === 'string' ? id : null;
}

export async function sendOneSignalPush(message: PushMessage, options?: SendOneSignalOptions) {
  const config = getOneSignalServerConfig();
  const targetUserIds = Array.from(new Set(message.userIds.filter(Boolean)));
  const messageType = options?.type ?? message.data?.type ?? 'general';
  const safetyState = getNotificationSafetyState(messageType);
  const dryRun = Boolean(options?.dryRun || safetyState.isDryRun);

  if (!config || targetUserIds.length === 0) {
    if (!config && targetUserIds.length > 0) {
      await recordNotificationDeliveryBatch(buildAuditRows({
        userIds: targetUserIds,
        type: messageType,
        status: 'unconfigured',
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
    }

    return { attempted: 0, sent: 0, skipped: 0, dryRun, disabled: false, configured: Boolean(config) };
  }

  if (dryRun || safetyState.skipDelivery) {
    await recordNotificationDeliveryBatch(buildAuditRows({
      userIds: targetUserIds,
      type: messageType,
      status: dryRun ? 'dry_run' : 'disabled',
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

  let sent = 0;
  const providerMessageIds: string[] = [];

  for (const batch of chunk(targetUserIds, BATCH_SIZE)) {
    try {
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
        await recordNotificationDeliveryBatch(buildAuditRows({
          userIds: batch,
          type: messageType,
          status: 'failed',
          errorCode: String(response.status),
          errorMessage: errorText.slice(0, 500),
          notificationKey: options?.notificationKey ?? null,
          notificationKeysByUserId: options?.notificationKeysByUserId,
          notificationIdsByUserId: options?.notificationIdsByUserId,
          metadata: {
            url: message.url ?? null,
            batch_size: batch.length,
            ...options?.metadata,
          },
        }));
        continue;
      }

      const responsePayload: unknown = await response.json().catch(() => null);
      const providerMessageId = asProviderMessageId(responsePayload);
      if (providerMessageId) providerMessageIds.push(providerMessageId);

      await recordNotificationDeliveryBatch(buildAuditRows({
        userIds: batch,
        type: messageType,
        status: 'sent',
        providerMessageId,
        notificationKey: options?.notificationKey ?? null,
        notificationKeysByUserId: options?.notificationKeysByUserId,
        notificationIdsByUserId: options?.notificationIdsByUserId,
        metadata: {
          url: message.url ?? null,
          batch_size: batch.length,
          ...options?.metadata,
        },
      }));
      sent += batch.length;
    } catch (error) {
      console.error('OneSignal push request crashed:', error);
      await recordNotificationDeliveryBatch(buildAuditRows({
        userIds: batch,
        type: messageType,
        status: 'failed',
        errorCode: 'request_crashed',
        errorMessage: error instanceof Error ? error.message : String(error),
        notificationKey: options?.notificationKey ?? null,
        notificationKeysByUserId: options?.notificationKeysByUserId,
        notificationIdsByUserId: options?.notificationIdsByUserId,
        metadata: {
          url: message.url ?? null,
          batch_size: batch.length,
          ...options?.metadata,
        },
      }));
      continue;
    }
  }

  return {
    attempted: targetUserIds.length,
    sent,
    skipped: targetUserIds.length - sent,
    dryRun: false,
    disabled: false,
    configured: true,
    providerMessageIds,
  };
}
