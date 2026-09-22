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

Render and save a PDF on your server:

```js
import { writeFile } from "node:fs/promises";

const job = await sharp.documents.renderAndWait(documentId, { format: "pdf" });
const file = await sharp.renders.download(job);
await writeFile(file.filename, file.bytes);
```

`renderAndWait()` returns render metadata. `renders.download()` performs the
file request, refreshes the five-minute signed URL first, and returns
`{ bytes, filename, contentType, job }`. Keep both calls on your backend so the
API key never enters browser code. To let a browser download directly, send
only `job.download_url` to it and use a normal link; configured API origins may
also fetch the signed URL with browser JavaScript.

Render artifacts are retained for 24 hours by default. A signed URL lasts five
minutes, and retrieving the render job creates a fresh one.

The server SDK also lists templates and documents, revokes sessions, and
upgrades test documents. Creation and field editing are intentionally
iframe-only.

[Full documentation](https://sharptoolz.com/api-docs)
