import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import Prism from "prismjs";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-json";
import "prismjs/components/prism-python";
import "prismjs/components/prism-typescript";
import {
  ArrowRight,
  Check,
  Clipboard,
  Code2,
  ExternalLink,
  KeyRound,
  PackageCheck,
  ShieldCheck,
} from "lucide-react";

import Logo from "@/components/Logo";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";

type CodeLanguage = "bash" | "javascript" | "json" | "python" | "typescript";
type ServerLanguage = "javascript" | "python" | "bash";

type CodeExample = {
  code: string;
  label: string;
  language: CodeLanguage;
};

type CodeExamples = Record<ServerLanguage, CodeExample>;

type SdkMethod = {
  method: string;
  purpose: string;
  scope: string;
};

const lines = (...value: string[]) => value.join("\n");

const LANGUAGE_OPTIONS: Array<{ id: ServerLanguage; label: string }> = [
  { id: "javascript", label: "JavaScript" },
  { id: "python", label: "Python" },
  { id: "bash", label: "Bash" },
];

const NAV_ITEMS = [
  { id: "start", label: "Get started" },
  { id: "templates", label: "Templates" },
  { id: "hosted-form", label: "Create form" },
  { id: "edit-form", label: "Edit form" },
  { id: "documents", label: "Documents" },
  { id: "appearance", label: "Appearance" },
  { id: "rendering", label: "Rendering" },
  { id: "errors", label: "Errors" },
  { id: "methods", label: "SDK methods" },
];

const SDK_METHODS: Record<ServerLanguage, SdkMethod[]> = {
  javascript: [
    { method: "sharp.templates.list()", purpose: "List available templates", scope: "templates:read" },
    { method: "sharp.hostedForms.create(input)", purpose: "Open a new document in the hosted form", scope: "sessions:write" },
    { method: "sharp.hostedForms.edit(documentId, input)", purpose: "Open an existing document in the hosted form", scope: "sessions:write" },
    { method: "sharp.hostedForms.revoke(sessionId)", purpose: "Revoke a pending hosted-form session", scope: "sessions:write" },
    { method: "sharp.documents.get(documentId)", purpose: "Get one document", scope: "documents:read" },
    { method: "sharp.documents.list(options)", purpose: "List and filter documents", scope: "documents:read" },
    { method: "sharp.documents.upgrade(documentId)", purpose: "Charge wallet and make a test document paid", scope: "documents:write" },
    { method: "sharp.documents.delete(documentId)", purpose: "Delete one document", scope: "documents:write" },
    { method: "sharp.documents.render(documentId, options)", purpose: "Queue a PNG or PDF", scope: "documents:read" },
    { method: "sharp.documents.renderAndWait(documentId, options)", purpose: "Render and wait for the download URL", scope: "documents:read" },
    { method: "sharp.renders.get(jobId)", purpose: "Get one render job", scope: "documents:read" },
    { method: "sharp.renders.wait(jobOrId, options)", purpose: "Wait for a queued render", scope: "documents:read" },
  ],
  python: [
    { method: "sharp.templates.list()", purpose: "List available templates", scope: "templates:read" },
    { method: "sharp.hosted_forms.create(**input)", purpose: "Open a new document in the hosted form", scope: "sessions:write" },
    { method: "sharp.hosted_forms.edit(document_id, **input)", purpose: "Open an existing document in the hosted form", scope: "sessions:write" },
    { method: "sharp.hosted_forms.revoke(session_id)", purpose: "Revoke a pending hosted-form session", scope: "sessions:write" },
    { method: "sharp.documents.get(document_id)", purpose: "Get one document", scope: "documents:read" },
    { method: "sharp.documents.list(...)", purpose: "List and filter documents", scope: "documents:read" },
    { method: "sharp.documents.upgrade(document_id)", purpose: "Charge wallet and make a test document paid", scope: "documents:write" },
    { method: "sharp.documents.delete(document_id)", purpose: "Delete one document", scope: "documents:write" },
    { method: "sharp.documents.render(document_id, format=...)", purpose: "Queue a PNG or PDF", scope: "documents:read" },
    { method: "sharp.documents.render_and_wait(document_id, ...)", purpose: "Render and wait for the download URL", scope: "documents:read" },
    { method: "sharp.renders.get(job_id)", purpose: "Get one render job", scope: "documents:read" },
    { method: "sharp.renders.wait(job_or_id)", purpose: "Wait for a queued render", scope: "documents:read" },
  ],
  bash: [
    { method: "GET /templates", purpose: "List available templates", scope: "templates:read" },
    { method: "POST /embed-sessions", purpose: "Open a new document in the hosted form", scope: "sessions:write" },
    { method: "POST /documents/{id}/session", purpose: "Open an existing document in the hosted form", scope: "sessions:write" },
    { method: "DELETE /embed-sessions/{id}", purpose: "Revoke a pending hosted-form session", scope: "sessions:write" },
    { method: "GET /documents/{id}", purpose: "Get one document", scope: "documents:read" },
    { method: "GET /documents", purpose: "List and filter documents", scope: "documents:read" },
    { method: "POST /documents/{id}/upgrade", purpose: "Charge wallet and make a test document paid", scope: "documents:write" },
    { method: "DELETE /documents/{id}", purpose: "Delete one document", scope: "documents:write" },
    { method: "POST /documents/{id}/render", purpose: "Queue a PNG or PDF", scope: "documents:read" },
    { method: "GET /renders/{id}", purpose: "Get the render status and download URL", scope: "documents:read" },
  ],
};

const INSTALL_EXAMPLES: CodeExamples = {
  javascript: {
    code: lines(
      "npm install @sharp-toolz/sdk",
      "",
      "# .env",
      "SHARPTOOLZ_API_KEY=stz_live_your_key",
    ),
    label: "Install and configure the Node SDK",
    language: "bash",
  },
  python: {
    code: lines(
      "pip install sharptoolz",
      "",
      "# .env",
      "SHARPTOOLZ_API_KEY=stz_live_your_key",
    ),
    label: "Install and configure the Python SDK",
    language: "bash",
  },
  bash: {
    code: lines(
      "# No SDK required. Bash examples use curl.",
      "export SHARPTOOLZ_API_KEY=stz_live_your_key",
      "export SHARPTOOLZ_API_URL=https://api.sharptoolz.com/api/v1",
    ),
    label: "Configure Bash",
    language: "bash",
  },
};

const CLIENT_EXAMPLES: CodeExamples = {
  javascript: {
    code: lines(
      "import { SharpToolz } from \"@sharp-toolz/sdk\";",
      "",
      "export const sharp = new SharpToolz({",
      "  apiKey: process.env.SHARPTOOLZ_API_KEY,",
      "});",
    ),
    label: "Create the server client",
    language: "typescript",
  },
  python: {
    code: lines(
      "import os",
      "from sharptoolz import SharpToolz",
      "",
      "sharp = SharpToolz(api_key=os.environ[\"SHARPTOOLZ_API_KEY\"])",
    ),
    label: "Create the server client",
    language: "python",
  },
  bash: {
    code: lines(
      "curl --fail-with-body \"$SHARPTOOLZ_API_URL/templates\" \\",
      "  -H \"Authorization: Bearer $SHARPTOOLZ_API_KEY\" \\",
      "  -H \"Accept: application/json\"",
    ),
    label: "Make an authenticated request",
    language: "bash",
  },
};

const TEMPLATES_EXAMPLES: CodeExamples = {
  javascript: {
    code: lines(
      "const { results: templates } = await sharp.templates.list();",
      "const template = templates[0];",
      "console.log(template.id, template.name, template.price);",
    ),
    label: "List template metadata",
    language: "typescript",
  },
  python: {
    code: lines(
      "templates = sharp.templates.list()[\"results\"]",
      "template = templates[0]",
      "print(template[\"id\"], template[\"name\"], template[\"price\"])",
    ),
    label: "List template metadata",
    language: "python",
  },
  bash: {
    code: lines(
      "curl --fail-with-body \"$SHARPTOOLZ_API_URL/templates\" \\",
      "  -H \"Authorization: Bearer $SHARPTOOLZ_API_KEY\" \\",
      "  -H \"Accept: application/json\"",
    ),
    label: "List template metadata",
    language: "bash",
  },
};

const HOSTED_SESSION_EXAMPLES: CodeExamples = {
  javascript: {
    code: lines(
      "const session = await sharp.hostedForms.create({",
      "  template_id: template.id,",
      "  external_user_id: \"user_42\",",
      "  origin: \"https://app.example.com\",",
      "  mode: \"test\",",
      "  preview_mode: \"protected\",",
      "  ttl_minutes: 30,",
      "});",
      "",
      "return session.embed_url;",
    ),
    label: "Create a hosted-form session",
    language: "typescript",
  },
  python: {
    code: lines(
      "session = sharp.hosted_forms.create(",
      "    template_id=template_id,",
      "    external_user_id=str(current_user.id),",
      "    origin=\"https://app.example.com\",",
      "    mode=\"test\",",
      "    preview_mode=\"protected\",",
      "    ttl_minutes=30,",
      ")",
      "",
      "return {\"embedUrl\": session[\"embed_url\"]}",
    ),
    label: "Create a hosted-form session",
    language: "python",
  },
  bash: {
    code: lines(
      "curl --fail-with-body \"$SHARPTOOLZ_API_URL/embed-sessions\" \\",
      "  -H \"Authorization: Bearer $SHARPTOOLZ_API_KEY\" \\",
      "  -H \"Content-Type: application/json\" \\",
      "  --data @- <<JSON",
      "{",
      "  \"template_id\": \"$TEMPLATE_ID\",",
      "  \"external_user_id\": \"user_42\",",
      "  \"origin\": \"https://app.example.com\",",
      "  \"mode\": \"test\",",
      "  \"preview_mode\": \"protected\",",
      "  \"ttl_minutes\": 30",
      "}",
      "JSON",
    ),
    label: "Create a hosted-form session",
    language: "bash",
  },
};

const EDIT_SESSION_EXAMPLES: CodeExamples = {
  javascript: {
    code: lines(
      "const session = await sharp.hostedForms.edit(documentId, {",
      "  origin: \"https://app.example.com\",",
      "  preview_mode: \"protected\",",
      "  ttl_minutes: 30,",
      "});",
      "",
      "return session.embed_url;",
    ),
    label: "Create an edit session",
    language: "typescript",
  },
  python: {
    code: lines(
      "session = sharp.hosted_forms.edit(",
      "    document_id,",
      "    origin=\"https://app.example.com\",",
      "    preview_mode=\"protected\",",
      "    ttl_minutes=30,",
      ")",
      "",
      "return {\"embedUrl\": session[\"embed_url\"]}",
    ),
    label: "Create an edit session",
    language: "python",
  },
  bash: {
    code: lines(
      "curl --fail-with-body \\",
      "  \"$SHARPTOOLZ_API_URL/documents/$DOCUMENT_ID/session\" \\",
      "  -H \"Authorization: Bearer $SHARPTOOLZ_API_KEY\" \\",
      "  -H \"Content-Type: application/json\" \\",
      "  --data '{",
      "    \"origin\": \"https://app.example.com\",",
      "    \"preview_mode\": \"protected\",",
      "    \"ttl_minutes\": 30",
      "  }'",
    ),
    label: "Create an edit session",
    language: "bash",
  },
};

const HOSTED_BROWSER_EXAMPLE = lines(
  "import { mountHostedForm } from \"@sharp-toolz/sdk/browser\";",
  "",
  "const form = mountHostedForm(\"#sharptoolz-form\", {",
  "  embedUrl,",
  "  autoResize: true,",
  "  borderRadius: \"16px\",",
  "  onReady() {",
  "    console.log(\"Form ready\");",
  "  },",
  "  onComplete({ documentId, sessionId }) {",
  "    console.log({ documentId, sessionId });",
  "  },",
  "  onError({ message }) {",
  "    console.error(message);",
  "  },",
  "});",
  "",
  "// Remove it when your page unmounts",
  "form.destroy();",
);

const REVOKE_SESSION_EXAMPLES: CodeExamples = {
  javascript: {
    code: "await sharp.hostedForms.revoke(session.id);",
    label: "Revoke an unused session",
    language: "typescript",
  },
  python: {
    code: "sharp.hosted_forms.revoke(session[\"id\"])",
    label: "Revoke an unused session",
    language: "python",
  },
  bash: {
    code: lines(
      "curl --fail-with-body -X DELETE \\",
      "  \"$SHARPTOOLZ_API_URL/embed-sessions/$SESSION_ID\" \\",
      "  -H \"Authorization: Bearer $SHARPTOOLZ_API_KEY\"",
    ),
    label: "Revoke an unused session",
    language: "bash",
  },
};

const READ_DOCUMENTS_EXAMPLES: CodeExamples = {
  javascript: {
    code: lines(
      "const document = await sharp.documents.get(documentId);",
      "",
      "const page = await sharp.documents.list({",
      "  externalUserId: \"user_42\",",
      "});",
      "",
      "if (page.next) {",
      "  const nextPage = await sharp.documents.list({ cursor: page.next });",
      "  console.log(nextPage.results);",
      "}",
    ),
    label: "Get, filter, and paginate",
    language: "typescript",
  },
  python: {
    code: lines(
      "document = sharp.documents.get(document_id)",
      "",
      "page = sharp.documents.list(external_user_id=\"user_42\")",
      "",
      "if page[\"next\"]:",
      "    next_page = sharp.documents.list(cursor=page[\"next\"])",
      "    print(next_page[\"results\"])",
    ),
    label: "Get, filter, and paginate",
    language: "python",
  },
  bash: {
    code: lines(
      "curl --fail-with-body \\",
      "  \"$SHARPTOOLZ_API_URL/documents/$DOCUMENT_ID\" \\",
      "  -H \"Authorization: Bearer $SHARPTOOLZ_API_KEY\"",
      "",
      "curl --fail-with-body --get \"$SHARPTOOLZ_API_URL/documents\" \\",
      "  -H \"Authorization: Bearer $SHARPTOOLZ_API_KEY\" \\",
      "  --data-urlencode \"external_user_id=user_42\" \\",
      "  --data-urlencode \"cursor=$NEXT_CURSOR\"",
    ),
    label: "Get, filter, and paginate",
    language: "bash",
  },
};

const MANAGE_DOCUMENT_EXAMPLES: CodeExamples = {
  javascript: {
    code: lines(
      "const paid = await sharp.documents.upgrade(documentId);",
      "",
      "await sharp.documents.delete(documentId);",
    ),
    label: "Upgrade or delete",
    language: "typescript",
  },
  python: {
    code: lines(
      "paid = sharp.documents.upgrade(document_id)",
      "",
      "sharp.documents.delete(document_id)",
    ),
    label: "Upgrade or delete",
    language: "python",
  },
  bash: {
    code: lines(
      "curl --fail-with-body -X POST \\",
      "  \"$SHARPTOOLZ_API_URL/documents/$DOCUMENT_ID/upgrade\" \\",
      "  -H \"Authorization: Bearer $SHARPTOOLZ_API_KEY\" \\",
      "  -H \"Idempotency-Key: upgrade-$DOCUMENT_ID\"",
      "",
      "curl --fail-with-body -X DELETE \\",
      "  \"$SHARPTOOLZ_API_URL/documents/$DOCUMENT_ID\" \\",
      "  -H \"Authorization: Bearer $SHARPTOOLZ_API_KEY\"",
    ),
    label: "Upgrade or delete",
    language: "bash",
  },
};

const THEME_EXAMPLES: CodeExamples = {
  javascript: {
    code: lines(
      "const session = await sharp.hostedForms.create({",
      "  template_id: template.id,",
      "  external_user_id: \"user_42\",",
      "  origin: \"https://app.example.com\",",
      "  theme: {",
      "    primaryColor: \"#cee88c\",",
      "    backgroundColor: \"#10120f\",",
      "    textColor: \"#ffffff\",",
      "    inputBackground: \"#191c17\",",
      "    borderColor: \"#34382f\",",
      "    borderRadius: \"12px\",",
      "    fontFamily: \"Inter\",",
      "    buttonText: \"Create document\",",
      "    appearance: \"dark\",",
      "    showSharpToolzBranding: true,",
      "  },",
      "});",
    ),
    label: "Session theme",
    language: "typescript",
  },
  python: {
    code: lines(
      "session = sharp.hosted_forms.create(",
      "    template_id=template_id,",
      "    external_user_id=\"user_42\",",
      "    origin=\"https://app.example.com\",",
      "    theme={",
      "        \"primaryColor\": \"#cee88c\",",
      "        \"backgroundColor\": \"#10120f\",",
      "        \"textColor\": \"#ffffff\",",
      "        \"inputBackground\": \"#191c17\",",
      "        \"borderColor\": \"#34382f\",",
      "        \"borderRadius\": \"12px\",",
      "        \"fontFamily\": \"Inter\",",
      "        \"buttonText\": \"Create document\",",
      "        \"appearance\": \"dark\",",
      "        \"showSharpToolzBranding\": True,",
      "    },",
      ")",
    ),
    label: "Session theme",
    language: "python",
  },
  bash: {
    code: lines(
      "curl --fail-with-body \"$SHARPTOOLZ_API_URL/embed-sessions\" \\",
      "  -H \"Authorization: Bearer $SHARPTOOLZ_API_KEY\" \\",
      "  -H \"Content-Type: application/json\" \\",
      "  --data @- <<JSON",
      "{",
      "  \"template_id\": \"$TEMPLATE_ID\",",
      "  \"external_user_id\": \"user_42\",",
      "  \"origin\": \"https://app.example.com\",",
      "  \"theme\": {",
      "    \"primaryColor\": \"#cee88c\",",
      "    \"backgroundColor\": \"#10120f\",",
      "    \"textColor\": \"#ffffff\",",
      "    \"inputBackground\": \"#191c17\",",
      "    \"borderColor\": \"#34382f\",",
      "    \"borderRadius\": \"12px\",",
      "    \"fontFamily\": \"Inter\",",
      "    \"buttonText\": \"Create document\",",
      "    \"appearance\": \"dark\",",
      "    \"showSharpToolzBranding\": true",
      "  }",
      "}",
      "JSON",
    ),
    label: "Session theme",
    language: "bash",
  },
};

const RENDER_EXAMPLES: CodeExamples = {
  javascript: {
    code: lines(
      "const completed = await sharp.documents.renderAndWait(documentId, {",
      "  format: \"pdf\",",
      "  timeoutMs: 120_000,",
      "});",
      "",
      "console.log(completed.download_url);",
    ),
    label: "Render and get the download URL",
    language: "typescript",
  },
  python: {
    code: lines(
      "completed = sharp.documents.render_and_wait(",
      "    document_id,",
      "    format=\"pdf\",",
      "    timeout=120,",
      ")",
      "",
      "print(completed[\"download_url\"])",
    ),
    label: "Render and get the download URL",
    language: "python",
  },
  bash: {
    code: lines(
      "# jq is used only to read values from the JSON response.",
      "JOB=$(curl --fail-with-body -X POST \\",
      "  \"$SHARPTOOLZ_API_URL/documents/$DOCUMENT_ID/render\" \\",
      "  -H \"Authorization: Bearer $SHARPTOOLZ_API_KEY\" \\",
      "  -H \"Idempotency-Key: render-$DOCUMENT_ID-pdf\" \\",
      "  -H \"Content-Type: application/json\" \\",
      "  --data '{\"format\":\"pdf\"}')",
      "JOB_ID=$(jq -r '.id' <<<\"$JOB\")",
      "",
      "while [[ $(jq -r '.status' <<<\"$JOB\") =~ ^(queued|running)$ ]]; do",
      "  sleep 2",
      "  JOB=$(curl --fail-with-body \\",
      "    \"$SHARPTOOLZ_API_URL/renders/$JOB_ID\" \\",
      "    -H \"Authorization: Bearer $SHARPTOOLZ_API_KEY\")",
      "done",
      "",
      "curl --fail-with-body -L \"$(jq -r '.download_url' <<<\"$JOB\")\" \\",
      "  --output document.pdf",
    ),
    label: "Render and download with curl and jq",
    language: "bash",
  },
};

const MANUAL_RENDER_EXAMPLES: CodeExamples = {
  javascript: {
    code: lines(
      "const job = await sharp.documents.render(documentId, { format: \"png\" });",
      "",
      "const current = await sharp.renders.get(job.id);",
      "const completed = await sharp.renders.wait(current);",
      "",
      "console.log(completed.download_url);",
    ),
    label: "Queue and wait separately",
    language: "typescript",
  },
  python: {
    code: lines(
      "job = sharp.documents.render(document_id, format=\"png\")",
      "",
      "current = sharp.renders.get(job[\"id\"])",
      "completed = sharp.renders.wait(current)",
      "",
      "print(completed[\"download_url\"])",
    ),
    label: "Queue and wait separately",
    language: "python",
  },
  bash: {
    code: lines(
      "curl --fail-with-body -X POST \\",
      "  \"$SHARPTOOLZ_API_URL/documents/$DOCUMENT_ID/render\" \\",
      "  -H \"Authorization: Bearer $SHARPTOOLZ_API_KEY\" \\",
      "  -H \"Idempotency-Key: render-$DOCUMENT_ID-png\" \\",
      "  -H \"Content-Type: application/json\" \\",
      "  --data '{\"format\":\"png\"}'",
      "",
      "curl --fail-with-body \"$SHARPTOOLZ_API_URL/renders/$JOB_ID\" \\",
      "  -H \"Authorization: Bearer $SHARPTOOLZ_API_KEY\"",
    ),
    label: "Queue and check separately",
    language: "bash",
  },
};

const ERROR_EXAMPLES: CodeExamples = {
  javascript: {
    code: lines(
      "import { SharpToolzError } from \"@sharp-toolz/sdk\";",
      "",
      "try {",
      "  await sharp.documents.get(documentId);",
      "} catch (error) {",
      "  if (error instanceof SharpToolzError) {",
      "    console.error(error.status);",
      "    console.error(error.data);",
      "  }",
      "}",
    ),
    label: "Handle SDK errors",
    language: "typescript",
  },
  python: {
    code: lines(
      "from sharptoolz import SharpToolzError",
      "",
      "try:",
      "    sharp.documents.get(document_id)",
      "except SharpToolzError as error:",
      "    print(error.status_code)",
      "    print(error.data)",
    ),
    label: "Handle SDK errors",
    language: "python",
  },
  bash: {
    code: lines(
      "if ! curl --fail-with-body \\",
      "  \"$SHARPTOOLZ_API_URL/documents/$DOCUMENT_ID\" \\",
      "  -H \"Authorization: Bearer $SHARPTOOLZ_API_KEY\"; then",
      "  echo \"SharpToolz request failed\" >&2",
      "  exit 1",
      "fi",
    ),
    label: "Stop on an API error",
    language: "bash",
  },
};

const CANCEL_EXAMPLES: CodeExamples = {
  javascript: {
    code: lines(
      "const controller = new AbortController();",
      "",
      "const render = sharp.documents.renderAndWait(documentId, {",
      "  format: \"pdf\",",
      "  signal: controller.signal,",
      "});",
      "",
      "controller.abort();",
      "await render;",
    ),
    label: "Cancel a render wait",
    language: "typescript",
  },
  python: {
    code: lines(
      "completed = sharp.documents.render_and_wait(",
      "    document_id,",
      "    format=\"pdf\",",
      "    timeout=30,",
      ")",
    ),
    label: "Set a render timeout",
    language: "python",
  },
  bash: {
    code: lines(
      "curl --fail-with-body --max-time 30 \\",
      "  \"$SHARPTOOLZ_API_URL/renders/$JOB_ID\" \\",
      "  -H \"Authorization: Bearer $SHARPTOOLZ_API_KEY\"",
    ),
    label: "Set a request timeout",
    language: "bash",
  },
};

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function copyValue() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <button
      type="button"
      onClick={copyValue}
      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-white/45 transition hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
      aria-label="Copy code to clipboard"
    >
      {copied ? <Check className="size-3.5 text-primary" /> : <Clipboard className="size-3.5" />}
      <span>{copied ? "Copied" : "Copy"}</span>
    </button>
  );
}

function CodeBlock({
  code,
  label,
  language = "typescript",
}: {
  code: string;
  label: string;
  language?: CodeLanguage;
}) {
  const highlightedCode = useMemo(
    () => Prism.highlight(code, Prism.languages[language] || Prism.languages.javascript, language),
    [code, language],
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#080c11]">
      <div className="flex min-h-11 items-center justify-between border-b border-white/[0.07] px-3 sm:px-4">
        <div className="flex min-w-0 items-center gap-2 text-xs text-white/35">
          <Code2 className="size-3.5 shrink-0" />
          <span className="truncate">{label}</span>
          <span className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-white/25">
            {language}
          </span>
        </div>
        <CopyButton value={code} />
      </div>
      <pre className="api-code overflow-x-auto p-4 text-[12px] leading-6 text-[#d6deeb] sm:p-5 sm:text-[13px]">
        <code dangerouslySetInnerHTML={{ __html: highlightedCode }} />
      </pre>
    </div>
  );
}

function LanguagePicker({
  value,
  onChange,
}: {
  value: ServerLanguage;
  onChange: (language: ServerLanguage) => void;
}) {
  return (
    <div
      className="grid grid-cols-3 gap-1 rounded-xl border border-white/[0.08] bg-black/20 p-1"
      aria-label="Choose a server language"
    >
      {LANGUAGE_OPTIONS.map((option) => {
        const selected = option.id === value;
        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.id)}
            className={
              "min-w-0 rounded-lg px-3 py-2.5 text-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 " +
              (selected
                ? "bg-white/[0.12] text-white ring-1 ring-inset ring-white/[0.08]"
                : "text-white/45 hover:bg-white/[0.05] hover:text-white")
            }
          >
            <span className="block truncate text-xs font-semibold sm:text-sm">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function LanguageCodeBlock({
  examples,
  language,
}: {
  examples: CodeExamples;
  language: ServerLanguage;
}) {
  const example = examples[language];
  return (
    <div aria-live="polite">
      <CodeBlock code={example.code} label={example.label} language={example.language} />
    </div>
  );
}

function SectionHeading({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-6 max-w-2xl">
      <h2 className="text-2xl font-semibold tracking-[-0.025em] text-white sm:text-3xl">{title}</h2>
      {children ? <div className="mt-2 text-sm leading-6 text-white/48">{children}</div> : null}
    </div>
  );
}

function Note({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-white/[0.08] bg-white/[0.018] p-4 text-sm leading-6 text-white/48">
      <span className="mt-1 text-primary/75">{icon}</span>
      <div>{children}</div>
    </div>
  );
}

function useActiveSection() {
  const [activeSection, setActiveSection] = useState(NAV_ITEMS[0].id);

  useEffect(() => {
    let animationFrame = 0;
    const update = () => {
      animationFrame = 0;
      const marker = window.innerWidth >= 1024 ? 116 : 138;
      let current = NAV_ITEMS[0].id;
      for (const item of NAV_ITEMS) {
        const section = document.getElementById(item.id);
        if (section && section.getBoundingClientRect().top <= marker) current = item.id;
      }
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 8) {
        current = NAV_ITEMS[NAV_ITEMS.length - 1].id;
      }
      setActiveSection((previous) => previous === current ? previous : current);
    };
    const scheduleUpdate = () => {
      if (!animationFrame) animationFrame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate, { passive: true });
    window.addEventListener("hashchange", scheduleUpdate);
    return () => {
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      window.removeEventListener("hashchange", scheduleUpdate);
    };
  }, []);

  return activeSection;
}

function MethodReference({ language }: { language: ServerLanguage }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.08]">
      <div className="hidden grid-cols-[minmax(250px,1.2fr)_1fr_130px] gap-4 border-b border-white/[0.07] px-5 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-white/30 md:grid">
        <span>Method</span>
        <span>Use</span>
        <span>Key scope</span>
      </div>
      {SDK_METHODS[language].map((item) => (
        <div
          key={item.method}
          className="grid gap-2 border-b border-white/[0.06] px-4 py-4 last:border-0 md:grid-cols-[minmax(250px,1.2fr)_1fr_130px] md:items-center md:gap-4 md:px-5"
        >
          <code className="break-all text-xs text-white/75">{item.method}</code>
          <span className="text-xs leading-5 text-white/45">{item.purpose}</span>
          <code className="text-[11px] text-primary/70">{item.scope}</code>
        </div>
      ))}
    </div>
  );
}

export default function ApiDocsPage() {
  const canRenderDocs = import.meta.env.DEV
    || window.location.hostname.toLowerCase() === "developer.sharptoolz.com";
  const activeSection = useActiveSection();
  const [serverLanguage, setServerLanguage] = useState<ServerLanguage>(() => {
    if (typeof window === "undefined") return "javascript";
    const saved = window.localStorage.getItem("sharptoolz-docs-language");
    return LANGUAGE_OPTIONS.some((option) => option.id === saved)
      ? (saved as ServerLanguage)
      : "javascript";
  });

  function changeServerLanguage(language: ServerLanguage) {
    setServerLanguage(language);
    window.localStorage.setItem("sharptoolz-docs-language", language);
  }

  useEffect(() => {
    if (!canRenderDocs) return;
    const previousHtmlOverflowX = document.documentElement.style.overflowX;
    const previousBodyOverflowX = document.body.style.overflowX;
    document.documentElement.style.overflowX = "clip";
    document.body.style.overflowX = "clip";
    return () => {
      document.documentElement.style.overflowX = previousHtmlOverflowX;
      document.body.style.overflowX = previousBodyOverflowX;
    };
  }, [canRenderDocs]);

  if (!canRenderDocs) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-[#0b1118] text-white selection:bg-primary/30">
      <SEO
        title="SharpToolz SDK Documentation"
        description="Install the SharpToolz SDK and integrate templates, documents, hosted forms, and rendering."
        canonical="https://developer.sharptoolz.com/"
      />

      <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#0b1118]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1380px] items-center gap-3 px-4 sm:px-6 lg:px-8">
          <a href="https://sharptoolz.com" aria-label="Go to the SharpToolz home page">
            <Logo size={30} noLink />
          </a>
          <span className="hidden h-5 w-px bg-white/10 sm:block" />
          <span className="hidden text-sm text-white/50 sm:block">SDK docs</span>
          <span className="rounded-full border border-primary/15 bg-primary/[0.07] px-2 py-0.5 font-mono text-[10px] text-primary/75">
            v0.2.0
          </span>
          <div className="ml-auto flex items-center gap-2">
            <a
              href="https://www.npmjs.com/package/@sharp-toolz/sdk"
              target="_blank"
              rel="noreferrer"
              className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-xs text-white/50 hover:bg-white/5 hover:text-white sm:inline-flex"
            >
              npm <ExternalLink className="size-3" />
            </a>
            <a
              href="https://pypi.org/project/sharptoolz/"
              target="_blank"
              rel="noreferrer"
              className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-xs text-white/50 hover:bg-white/5 hover:text-white md:inline-flex"
            >
              PyPI <ExternalLink className="size-3" />
            </a>
            <Button asChild size="sm" className="px-3.5">
              <a href="https://sharptoolz.com/settings/api">API settings</a>
            </Button>
          </div>
        </div>
      </header>

      <nav
        className="sticky top-16 z-40 overflow-x-auto border-b border-white/[0.07] bg-[#0b1118]/95 px-4 py-2.5 backdrop-blur-xl lg:hidden"
        aria-label="SDK documentation sections"
      >
        <div className="flex w-max gap-1">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.id}
              href={"#" + item.id}
              aria-current={activeSection === item.id ? "location" : undefined}
              className={
                "rounded-lg px-3 py-1.5 text-xs transition " +
                (activeSection === item.id
                  ? "bg-primary/10 text-primary"
                  : "text-white/45 hover:bg-white/5 hover:text-white")
              }
            >
              {item.label}
            </a>
          ))}
        </div>
      </nav>

      <div className="mx-auto grid max-w-[1380px] gap-12 px-4 pb-24 pt-10 sm:px-6 lg:grid-cols-[210px_minmax(0,900px)] lg:justify-center lg:gap-16 lg:px-8 lg:pt-14 xl:gap-24">
        <aside className="hidden self-start lg:sticky lg:top-20 lg:block">
          <div>
            <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-white/25">SDK reference</p>
            <nav className="space-y-0.5" aria-label="SDK documentation sections">
              {NAV_ITEMS.map((item) => (
                <a
                  key={item.id}
                  href={"#" + item.id}
                  aria-current={activeSection === item.id ? "location" : undefined}
                  className={
                    "relative block rounded-lg px-3 py-2 text-sm transition " +
                    (activeSection === item.id
                      ? "bg-primary/[0.08] font-medium text-primary before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:bg-primary"
                      : "text-white/42 hover:bg-white/[0.04] hover:text-white")
                  }
                >
                  {item.label}
                </a>
              ))}
            </nav>
            <div className="mt-7 border-t border-white/[0.07] pt-5">
              <a
                href="https://sharptoolz.com/settings/api"
                className="inline-flex items-center gap-1.5 px-3 text-xs font-medium text-primary/75 hover:text-primary"
              >
                Create API key <ArrowRight className="size-3" />
              </a>
            </div>
          </div>
        </aside>

        <main className="min-w-0">
          <section id="start" className="scroll-mt-32 border-b border-white/[0.07] pb-14 lg:scroll-mt-24">
            <div className="flex items-center gap-2 text-xs text-primary/80">
              <PackageCheck className="size-4" />
              <span>SDK packages</span>
            </div>
            <h1 className="mt-5 text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">
              SharpToolz SDK
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-white/48">
              Use Node, Python, or curl on your backend. Mount the SharpToolz form with browser JavaScript.
            </p>

            <div className="mt-8 max-w-xl">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-white/30">
                Choose your backend
              </p>
              <LanguagePicker value={serverLanguage} onChange={changeServerLanguage} />
            </div>

            <div className="mt-5 space-y-4">
              <LanguageCodeBlock examples={INSTALL_EXAMPLES} language={serverLanguage} />
              <LanguageCodeBlock examples={CLIENT_EXAMPLES} language={serverLanguage} />
            </div>

            <div className="mt-4">
              <Note icon={<ShieldCheck className="size-4" />}>
                Keep <code className="text-white/75">SHARPTOOLZ_API_KEY</code> on your server. Browser code receives only a hosted-session URL.
              </Note>
            </div>
            <p className="mt-3 text-xs leading-5 text-white/35">
              JavaScript and Python use the official SDKs. Bash uses the same API securely through curl.
            </p>
          </section>

          <section id="templates" className="scroll-mt-32 border-b border-white/[0.07] py-14 lg:scroll-mt-24">
            <SectionHeading title="Templates">
              Choose a template by its ID. The hosted form handles every field and template rule.
            </SectionHeading>
            <LanguageCodeBlock examples={TEMPLATES_EXAMPLES} language={serverLanguage} />
          </section>

          <section id="hosted-form" className="scroll-mt-32 border-b border-white/[0.07] py-14 lg:scroll-mt-24">
            <SectionHeading title="Create a document">
              Create the short-lived session on your backend, then mount it in the browser.
            </SectionHeading>
            <div className="space-y-4">
              <LanguageCodeBlock examples={HOSTED_SESSION_EXAMPLES} language={serverLanguage} />
              <CodeBlock code={HOSTED_BROWSER_EXAMPLE} label="Browser JavaScript · required for every backend" language="javascript" />
              <LanguageCodeBlock examples={REVOKE_SESSION_EXAMPLES} language={serverLanguage} />
            </div>
          </section>

          <section id="edit-form" className="scroll-mt-32 border-b border-white/[0.07] py-14 lg:scroll-mt-24">
            <SectionHeading title="Edit a document">
              Create an edit session for the document, then mount it with the same browser code. SharpToolz enables only editable fields.
            </SectionHeading>
            <LanguageCodeBlock examples={EDIT_SESSION_EXAMPLES} language={serverLanguage} />
          </section>

          <section id="documents" className="scroll-mt-32 border-b border-white/[0.07] py-14 lg:scroll-mt-24">
            <SectionHeading title="Documents">
              Read metadata, filter by your own user ID, upgrade a test document, or delete it.
            </SectionHeading>
            <div className="space-y-4">
              <LanguageCodeBlock examples={READ_DOCUMENTS_EXAMPLES} language={serverLanguage} />
              <LanguageCodeBlock examples={MANAGE_DOCUMENT_EXAMPLES} language={serverLanguage} />
            </div>
          </section>

          <section id="appearance" className="scroll-mt-32 border-b border-white/[0.07] py-14 lg:scroll-mt-24">
            <SectionHeading title="Appearance">
              Pass a theme when creating a hosted-form session, or save the same values in API settings.
            </SectionHeading>
            <LanguageCodeBlock examples={THEME_EXAMPLES} language={serverLanguage} />
            <Button asChild variant="outline" size="sm" className="mt-4 border-white/10 bg-transparent text-white/65 hover:bg-white/5 hover:text-white">
              <a href="https://sharptoolz.com/settings/api">Open style editor <ArrowRight className="size-3.5" /></a>
            </Button>
          </section>

          <section id="rendering" className="scroll-mt-32 border-b border-white/[0.07] py-14 lg:scroll-mt-24">
            <SectionHeading title="Rendering">
              Use <code className="text-white/70">renderAndWait</code> for the complete flow, or keep the job when you need separate queue and wait steps.
            </SectionHeading>
            <div className="space-y-4">
              <LanguageCodeBlock examples={RENDER_EXAMPLES} language={serverLanguage} />
              <LanguageCodeBlock examples={MANUAL_RENDER_EXAMPLES} language={serverLanguage} />
            </div>
          </section>

          <section id="errors" className="scroll-mt-32 border-b border-white/[0.07] py-14 lg:scroll-mt-24">
            <SectionHeading title="Errors and cancellation" />
            <div className="space-y-4">
              <LanguageCodeBlock examples={ERROR_EXAMPLES} language={serverLanguage} />
              <LanguageCodeBlock examples={CANCEL_EXAMPLES} language={serverLanguage} />
            </div>
          </section>

          <section id="methods" className="scroll-mt-32 py-14 lg:scroll-mt-24">
            <SectionHeading title={serverLanguage === "bash" ? "Bash API reference" : "SDK methods"} />
            <MethodReference language={serverLanguage} />
          </section>

          <div className="flex flex-col gap-4 border-t border-white/[0.07] py-8 text-xs text-white/30 sm:flex-row sm:items-center sm:justify-between">
            <span>JavaScript · Python · Bash</span>
            <div className="flex items-center gap-5">
              <a
                href="https://www.npmjs.com/package/@sharp-toolz/sdk"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 hover:text-white/65"
              >
                npm <ExternalLink className="size-3" />
              </a>
              <a
                href="https://pypi.org/project/sharptoolz/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 hover:text-white/65"
              >
                PyPI <ExternalLink className="size-3" />
              </a>
              <a href="https://sharptoolz.com/settings/api" className="inline-flex items-center gap-1 hover:text-white/65">
                API settings <KeyRound className="size-3" />
              </a>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
