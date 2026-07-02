export type NotificationSafetyState = {
  isDryRun: boolean;
  isDisabled: boolean;
  skipDelivery: boolean;
  disabledReason?: string;
};

function parseDisabledTypes() {
  return (process.env.NOTIFICATIONS_DISABLE_TYPES ?? '')
    .split(',')
    .map((type) => type.trim().toLowerCase())
    .filter(Boolean);
}

export function isNotificationDryRun(request?: Request): boolean {
  if (process.env.NOTIFICATIONS_DRY_RUN === 'true') {
    return true;
  }

  if (request) {
    try {
      const url = new URL(request.url);
      if (url.searchParams.get('dryRun') === 'true') {
        return true;
      }
    } catch {
      // invalid url
    }
  }

  return false;
}

export function shouldSkipNotificationDelivery(type?: string): { skip: boolean; reason?: string } {
  if (process.env.NOTIFICATIONS_DISABLED === 'true') {
    return { skip: true, reason: 'NOTIFICATIONS_DISABLED is true' };
  }

  if (type) {
    const disabledTypes = parseDisabledTypes();
    if (disabledTypes.includes(type.toLowerCase())) {
      return { skip: true, reason: `Type '${type}' is listed in NOTIFICATIONS_DISABLE_TYPES` };
    }
  }

  return { skip: false };
}

export function getDisabledNotificationTypes() {
  return parseDisabledTypes();
}

export function getNotificationSafetyState(type?: string, request?: Request): NotificationSafetyState {
  const isDryRun = isNotificationDryRun(request);
  const { skip, reason } = shouldSkipNotificationDelivery(type);

  return {
    isDryRun,
    isDisabled: skip,
    skipDelivery: skip,
    disabledReason: reason,
  };
}

export function buildNotificationSafetyResponse(
  type: string,
  state: NotificationSafetyState,
  counts: {
    eligibleCount?: number;
    skippedCount?: number;
    wouldInsertCount?: number;
    wouldSendCount?: number;
  } = {},
) {
  return {
    type,
    eligibleCount: counts.eligibleCount ?? 0,
    skippedCount: counts.skippedCount ?? 0,
    wouldInsertCount: counts.wouldInsertCount ?? 0,
    wouldSendCount: counts.wouldSendCount ?? 0,
    dryRun: state.isDryRun,
    disabled: state.isDisabled,
    disabledReason: state.disabledReason,
  };
}
