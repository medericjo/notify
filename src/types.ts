export type NotificationChannel = "email" | "sms";

export interface NotificationRecipient {
  id?: string;
  email?: string;
  phone?: string;
  name?: string;
}

export interface NotificationRequest {
  topic: string;
  recipient: NotificationRecipient;
  channels: NotificationChannel[];
  data?: Record<string, unknown>;
}

export interface NotificationResult {
  channel: NotificationChannel;
  success: boolean;
  messageId?: string;
  error?: Error;
}

export interface NotificationProvider {
  send(
    topic: string,
    recipient: NotificationRecipient,
    data?: Record<string, unknown>,
  ): Promise<{
    messageId?: string;
  }>;
}
