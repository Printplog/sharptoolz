const HTTP_PROTOCOL = /^(https?):(.*)$/i;

export function correctWebsiteInput(input: string): string {
  return input
    .replace(/\\/g, "/")
    .replace(/^(https?):\/(?!\/)/i, "$1://");
}

export function normalizeWebsiteOrigin(input: string): string {
  let value = correctWebsiteInput(input).trim();
  if (!value) throw new Error("Enter a website.");

  const protocolMatch = value.match(HTTP_PROTOCOL);
  if (protocolMatch) {
    value = `${protocolMatch[1].toLowerCase()}://${protocolMatch[2].replace(/^\/+/, "")}`;
  } else {
    value = `https://${value.replace(/^\/+/, "")}`;
  }

  try {
    const url = new URL(value);
    if (!url.hostname || !["http:", "https:"].includes(url.protocol) || url.username || url.password) {
      throw new Error();
    }
    return url.origin;
  } catch {
    throw new Error("Enter a valid website, for example app.example.com.");
  }
}
