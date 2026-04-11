export type MessageThreadKind = 'kul' | 'mandali' | 'direct';
export type MessageDeliveryState = 'sending' | 'sent' | 'delivered' | 'read';

export interface MessageThread {
  id: string;
  title: string;
  subtitle: string;
  kind: MessageThreadKind;
  contextLabel: string;
  participantCount: number;
  unreadCount: number;
  lastMessagePreview: string;
  lastMessageAt: string;
  avatarFallback: string;
}

export interface ThreadMessage {
  id: string;
  threadId: string;
  senderId: string;
  senderName: string;
  body: string;
  createdAt: string;
  deliveryState: MessageDeliveryState;
  isCurrentUser: boolean;
}

export interface SendThreadMessageInput {
  threadId: string;
  userId: string;
  userName: string;
  body: string;
}

export interface MessagesApi {
  listThreads(userId: string): Promise<MessageThread[]>;
  listMessages(threadId: string, userId: string): Promise<ThreadMessage[]>;
  sendMessage(input: SendThreadMessageInput): Promise<ThreadMessage>;
  markThreadRead(threadId: string, userId: string): Promise<void>;
}
