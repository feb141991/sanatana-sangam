import twilio from 'twilio';

export type WhatsAppProviderName = 'meta' | 'twilio' | 'mock';

export type WhatsAppSendInput = {
  to: string;
  body: string;
};

export type WhatsAppSendResult = {
  provider: WhatsAppProviderName;
  messageId?: string;
  mocked: boolean;
};

type WhatsAppProvider = {
  name: WhatsAppProviderName;
  isMock: boolean;
  sendText(input: WhatsAppSendInput): Promise<WhatsAppSendResult>;
};

function normalizeWhatsAppTo(phoneNumber: string) {
  const trimmed = phoneNumber.trim();
  if (trimmed.startsWith('whatsapp:')) return trimmed;
  return `whatsapp:${trimmed}`;
}

function createMockProvider(reason: string): WhatsAppProvider {
  return {
    name: 'mock',
    isMock: true,
    async sendText(input) {
      console.log(`[mock-whatsapp] ${reason}. To: ${input.to} | Body:\n${input.body}`);
      return { provider: 'mock', mocked: true };
    },
  };
}

function createTwilioProvider(): WhatsAppProvider {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const whatsappFrom = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';

  if (!accountSid || !authToken) {
    return createMockProvider('TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN is missing');
  }

  const client = twilio(accountSid, authToken);

  return {
    name: 'twilio',
    isMock: false,
    async sendText(input) {
      const message = await client.messages.create({
        from: whatsappFrom,
        to: normalizeWhatsAppTo(input.to),
        body: input.body,
      });
      return { provider: 'twilio', messageId: message.sid, mocked: false };
    },
  };
}

function createMetaProvider(): WhatsAppProvider {
  const accessToken = process.env.META_WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.META_WHATSAPP_PHONE_NUMBER_ID;

  if (!accessToken || !phoneNumberId) {
    return createMockProvider('META_WHATSAPP_ACCESS_TOKEN or META_WHATSAPP_PHONE_NUMBER_ID is missing');
  }

  return {
    name: 'meta',
    isMock: false,
    async sendText(input) {
      const response = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: input.to.replace(/^\+/, ''),
          type: 'text',
          text: { preview_url: false, body: input.body },
        }),
      });

      const payload = await response.json().catch(() => null) as {
        messages?: Array<{ id?: string }>;
        error?: { message?: string };
      } | null;

      if (!response.ok) {
        throw new Error(payload?.error?.message ?? `Meta WhatsApp API failed with ${response.status}`);
      }

      return { provider: 'meta', messageId: payload?.messages?.[0]?.id, mocked: false };
    },
  };
}

export function createWhatsAppProvider(): WhatsAppProvider {
  const provider = (process.env.WHATSAPP_PROVIDER ?? '').trim().toLowerCase();

  if (provider === 'meta') return createMetaProvider();
  if (provider === 'twilio') return createTwilioProvider();
  if (provider === 'mock') return createMockProvider('WHATSAPP_PROVIDER is set to mock');

  if (process.env.META_WHATSAPP_ACCESS_TOKEN && process.env.META_WHATSAPP_PHONE_NUMBER_ID) {
    return createMetaProvider();
  }

  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    return createTwilioProvider();
  }

  return createMockProvider('No WhatsApp provider environment is configured');
}
