export interface OutboundSms {
  to: string;
  text: string;
}

export interface SmsTransport {
  send(message: OutboundSms): Promise<{ messageId?: string }>;
}
