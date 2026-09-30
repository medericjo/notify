# notify

API de notification agnostique des fournisseurs. Un appel décrit le sujet, le destinataire et les canaux ; chaque canal est confié au fournisseur configuré.

```ts
import { EmailProvider, Notification, SmsProvider } from "notify";

const notification = new Notification({
  providers: {
    email: new EmailProvider({
      send: async ({ to, topic, data }) => {
        // Resend, SES, SendGrid, etc.
        return { messageId: crypto.randomUUID() };
      },
    }),
    sms: new SmsProvider({
      send: async ({ to, topic, data }) => {
        // Twilio, Vonage, etc.
        return { messageId: crypto.randomUUID() };
      },
    }),
  },
});

const results = await notification.send({
  topic: "payment.success",
  recipient: {
    id: user.id,
    email: user.email,
    phone: user.phone,
  },
  channels: ["email", "sms"],
  data: {
    amount: 2500,
    currency: "USD",
    paymentId: "pay_123",
  },
});
```

`send` renvoie un résultat par canal. L’échec d’un canal (fournisseur absent, destinataire incomplet, erreur du transport) n’empêche pas les autres canaux de s’exécuter.

## Développement

```bash
pnpm install
pnpm typecheck
pnpm test
pnpm build
```
