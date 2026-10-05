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
  loading: {
    text: "Preparing your document…",
    logoUrl: "/brand/acme-mark.svg",
    logoAlt: "Acme",
    backgroundColor: "#ffffff",
    textColor: "#17362f",
    accentColor: "#176b5b",
  },
  onComplete: ({ documentId }) => console.log(documentId),
});
```

## Loading-screen styling

The browser SDK displays a neutral, unbranded loading screen until it receives
a trusted `sharptoolz:ready` message from the hosted iframe. The iframe stays
hidden and unavailable to keyboard or assistive-technology users during that
time.

The `loading` object supports:

- `text`: status copy; defaults to `Loading form…`.
- `logoUrl`, `logoAlt`, and `logoWidth`: a customer-owned logo and its size.
- `backgroundColor`, `textColor`, and `accentColor`: overlay, copy, and spinner colours.
- `fontFamily` and `textSize`: CSS values for the status copy.
- `element`: your own `HTMLElement`. The SDK moves it into the overlay and removes it when ready.

Use `loading: false` to reveal the iframe immediately:

```js
mountHostedForm("#sharptoolz-form", { embedUrl, loading: false });
```

To provide a completely custom loader:

```js
const skeleton = document.createElement("div");
skeleton.className = "document-form-skeleton";
skeleton.textContent = "Opening your workspace…";

mountHostedForm("#sharptoolz-form", {
  embedUrl,
  loading: { element: skeleton },
});
```

Loader content stays in the customer's page and receives no API key, template
data, or form values. `loading` is independent of the session theme's
`showSharpToolzBranding` option, which controls branding inside the loaded form.
Hosted-form branding is off by default and appears only when
`showSharpToolzBranding` is explicitly set to `true`. Per-session theme fields
override the saved appearance; omitted fields continue to use the saved values.

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
