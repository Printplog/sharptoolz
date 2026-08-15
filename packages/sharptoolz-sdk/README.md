# SharpToolz JavaScript SDK

Create a short-lived hosted form on your server, then mount it in the browser. Your API key and SharpToolz's form conventions never enter customer frontend code.

```bash
npm install @sharp-toolz/sdk
```

Server:

```js
import { SharpToolz } from "@sharp-toolz/sdk";

const sharp = new SharpToolz({ apiKey: process.env.SHARPTOOLZ_API_KEY });
const session = await sharp.hostedForms.create({
  template_id: templateId,
  external_user_id: currentUser.id,
  origin: "https://app.example.com",
  mode: "test",
  preview_mode: "protected",
});

return { embedUrl: session.embed_url };
```

Browser:

```js
import { mountHostedForm } from "@sharp-toolz/sdk/browser";

const form = mountHostedForm("#sharptoolz-form", {
  embedUrl,
  onComplete: ({ documentId }) => console.log(documentId),
});
```

Open an existing document in the same hosted UI:

```js
const session = await sharp.hostedForms.edit(documentId, {
  origin: "https://app.example.com",
  preview_mode: "protected",
});
```

The server SDK also lists templates and documents, revokes sessions, upgrades test documents, and renders PNG or PDF files. Creation and field editing are intentionally iframe-only.

[Full documentation](https://sharptoolz.com/api-docs)
