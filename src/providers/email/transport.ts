export interface OutboundEmail {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export interface EmailTransport {
  send(message: OutboundEmail): Promise<{ messageId?: string }>;
}
