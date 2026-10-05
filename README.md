# notify

L'envoi est déjà implémenté. L'application déclare le contenu d'un topic, puis appelle `send`. Le transport email (SMTP ou Resend) et le transport SMS (Orange Côte d'Ivoire) sont choisis par la configuration.

```ts
import { notification, registerTemplate } from "notify";

registerTemplate("topic.test", {
  subject: "Test {{name}}",
  text: "Bonjour {{name}}",
});

await notification.send({
  topic: "topic.test",
  recipient: user,
  channels: ["email", "sms"],
});
```

`{{name}}`, `{{email}}`, `{{phone}}` et `{{id}}` viennent du destinataire. Les clés de `data` remplacent ces valeurs quand elles portent le même nom.

Le SMS utilise le champ `sms` du template, ou `text` s'il est absent. Orange Côte d'Ivoire n'accepte que les numéros `+225` suivis de 10 chiffres, et limite le message à 160 caractères. LeTexto accepte un numéro international, par exemple Côte d'Ivoire, Burkina Faso, Mali, Bénin, Sénégal ou Togo.

## Configuration

SMTP :

```bash
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=notifications@example.com
SMTP_PASS=secret
SMTP_FROM=notifications@example.com
```

Resend :

```bash
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_...
EMAIL_FROM=notifications@example.com
```

Orange SMS Côte d'Ivoire :

```bash
SMS_PROVIDER=orange
ORANGE_SMS_BASIC_AUTH=Basic ...
ORANGE_SMS_SENDER_ADDRESS=tel:+2250000
ORANGE_SMS_SENDER_NAME=AMANEPLUS
```

`ORANGE_SMS_BASIC_AUTH` est la valeur complète du header `Authorization` (préfixe `Basic` inclus). L'adresse et le nom d'expéditeur sont optionnels.

LeTexto :

```bash
SMS_PROVIDER=letexto
LETEXTO_API_TOKEN=...
LETEXTO_SENDER=SMS INFO
LETEXTO_DLR_URL=https://example.com/dlr
LETEXTO_DLR_METHOD=POST
```

`LETEXTO_DLR_URL` et `LETEXTO_DLR_METHOD` (`GET` ou `POST`) sont optionnels. Ils reçoivent le statut du message.

`send` renvoie un résultat par canal. Un type sans template, une configuration absente ou une erreur du transport marque ce canal en échec.

## Développement

```bash
pnpm install
pnpm typecheck
pnpm test
pnpm build
```
