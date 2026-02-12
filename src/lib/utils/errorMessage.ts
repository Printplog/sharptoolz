interface ApiError extends Error {
  response?: {
    data:
    | {
      detail?: string;
      message?: string;
      error?: string;
      email?: string;
      username?: string;
      password?: string;
      tracking_id?: string;
    }
    | string
    | string[]
    | Record<string, string[]>;
  };
}

export default function errorMessage(error: ApiError): string {
  const data = error.response?.data;

  if (typeof data === "string") return data;

  if (Array.isArray(data)) {
    return data[0];
  }

  if (typeof data === "object" && data !== null) {
    // If it's a validation error with multiple fields, show them better
    const entries = Object.entries(data);
    if (entries.length > 0) {
      const [key, val] = entries[0];
      if (Array.isArray(val)) return `${key}: ${val[0]}`;
      if (typeof val === 'string') return `${key}: ${val}`;
    }

    return (
      (data.detail as string | undefined) ??
      (data.message as string | undefined) ??
      (data.error as string | undefined) ??
      (data.email as string | undefined) ??
      (data.username as string | undefined) ??
      (data.password as string | undefined) ??
      (data.tracking_id && "Generate a new tracking id") ??
      String(Object.values(data)[0] ?? error.message)
    );
  }

  return error.message;
}
